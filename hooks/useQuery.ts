/**
 * Custom Query Hooks with Caching
 *
 * React hooks for data fetching with built-in caching, loading states, and error handling.
 * Inspired by React Query / SWR but lightweight and tailored for this app.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestCache, CacheKeys, invalidateCache } from '@/lib/cache';

export interface QueryOptions<T> {
  enabled?: boolean; // Whether to run the query automatically
  cacheTime?: number; // How long to cache data (ms)
  staleTime?: number; // How long data is considered fresh (ms)
  retry?: number; // Number of retries on failure
  retryDelay?: number; // Delay between retries (ms)
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  refetchOnFocus?: boolean; // Refetch when window/app regains focus
  refetchInterval?: number; // Auto-refetch interval (ms)
}

export interface QueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Custom hook for data fetching with caching
 *
 * @example
 * const { data, isLoading, error, refetch } = useQuery(
 *   'workouts:userId',
 *   async () => {
 *     const { data } = await supabase.from('workouts').select('*');
 *     return data;
 *   },
 *   { cacheTime: 60000, staleTime: 30000 }
 * );
 */
export function useQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: QueryOptions<T> = {}
): QueryResult<T> {
  const {
    enabled = true,
    cacheTime = 60000,
    staleTime = 30000,
    retry = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
    refetchOnFocus = false,
    refetchInterval,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const retryCount = useRef(0);
  const isMountedRef = useRef(true);
  const lastFetchTime = useRef<number>(0);

  const fetchData = useCallback(async () => {
    // Check if data is still fresh
    const timeSinceLastFetch = Date.now() - lastFetchTime.current;
    const cached = requestCache.get<T>(key);

    if (cached && timeSinceLastFetch < staleTime) {
      setData(cached);
      setIsLoading(false);
      return;
    }

    setIsFetching(true);
    setIsError(false);
    setError(null);

    try {
      const result = await queryFn();

      if (isMountedRef.current) {
        setData(result);
        setIsLoading(false);
        setIsFetching(false);
        requestCache.set(key, result, cacheTime);
        lastFetchTime.current = Date.now();
        retryCount.current = 0;

        if (onSuccess) {
          onSuccess(result);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      if (retryCount.current < retry) {
        retryCount.current++;
        console.log(`Retrying query ${key} (${retryCount.current}/${retry})...`);

        setTimeout(() => {
          if (isMountedRef.current) {
            fetchData();
          }
        }, retryDelay);
      } else {
        if (isMountedRef.current) {
          setIsError(true);
          setError(error);
          setIsLoading(false);
          setIsFetching(false);

          if (onError) {
            onError(error);
          }
        }
      }
    }
  }, [key, queryFn, cacheTime, staleTime, retry, retryDelay, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [enabled, fetchData]);

  // Refetch on focus
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      if (enabled) {
        fetchData();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [refetchOnFocus, enabled, fetchData]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, refetchInterval);

    return () => clearInterval(intervalId);
  }, [refetchInterval, enabled, fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const invalidate = useCallback(() => {
    requestCache.invalidate(key);
    lastFetchTime.current = 0;
  }, [key]);

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    invalidate,
  };
}

/**
 * Hook for mutations with automatic cache invalidation
 *
 * @example
 * const addWorkout = useMutation(
 *   async (workout: Workout) => {
 *     const { data, error } = await supabase.from('workouts').insert(workout);
 *     if (error) throw error;
 *     return data;
 *   },
 *   {
 *     onSuccess: () => {
 *       invalidateCache.workouts(userId);
 *     }
 *   }
 * );
 *
 * // Use it
 * await addWorkout.mutate(newWorkout);
 */
export interface MutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

export interface MutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: TData | null;
  reset: () => void;
}

export function useMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: MutationOptions<TData, TVariables> = {}
): MutationResult<TData, TVariables> {
  const { onSuccess, onError, onSettled } = options;

  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const result = await mutationFn(variables);
        setData(result);
        setIsLoading(false);

        if (onSuccess) {
          onSuccess(result, variables);
        }

        if (onSettled) {
          onSettled(result, null, variables);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setIsError(true);
        setError(error);
        setIsLoading(false);

        if (onError) {
          onError(error, variables);
        }

        if (onSettled) {
          onSettled(undefined, error, variables);
        }

        throw error;
      }
    },
    [mutationFn, onSuccess, onError, onSettled]
  );

  const reset = useCallback(() => {
    setData(null);
    setIsError(false);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    mutate,
    isLoading,
    isError,
    error,
    data,
    reset,
  };
}

/**
 * Pre-configured query hooks for common data fetching
 */

/**
 * Fetch user's workouts with caching
 */
export function useWorkouts(userId: string | undefined, limit?: number) {
  return useQuery(
    CacheKeys.workouts(userId || '', limit),
    async () => {
      if (!userId) throw new Error('User ID is required');

      const { supabase } = await import('@/lib/supabase');
      let query = supabase.from('workouts').select('*').eq('user_id', userId).order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    {
      enabled: !!userId,
      cacheTime: 5 * 60 * 1000, // 5 minutes
      staleTime: 60 * 1000, // 1 minute
    }
  );
}

/**
 * Fetch user's goals with caching
 */
export function useGoals(userId: string | undefined, status?: 'active' | 'completed') {
  return useQuery(
    CacheKeys.goals(userId || '', status),
    async () => {
      if (!userId) throw new Error('User ID is required');

      const { supabase } = await import('@/lib/supabase');
      let query = supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false });

      if (status === 'active') {
        query = query.eq('is_achieved', false);
      } else if (status === 'completed') {
        query = query.eq('is_achieved', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    {
      enabled: !!userId,
      cacheTime: 10 * 60 * 1000, // 10 minutes (goals change less frequently)
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

/**
 * Fetch user's training cycles with caching
 */
export function useCycles(userId: string | undefined) {
  return useQuery(
    CacheKeys.cycles(userId || ''),
    async () => {
      if (!userId) throw new Error('User ID is required');

      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    {
      enabled: !!userId,
      cacheTime: 10 * 60 * 1000, // 10 minutes
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

/**
 * Fetch user's strength tests with caching
 */
export function useStrengthTests(userId: string | undefined, limit?: number) {
  return useQuery(
    CacheKeys.strengthTests(userId || '', limit),
    async () => {
      if (!userId) throw new Error('User ID is required');

      const { supabase } = await import('@/lib/supabase');
      let query = supabase
        .from('strength_tests')
        .select('*')
        .eq('user_id', userId)
        .order('test_date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    {
      enabled: !!userId,
      cacheTime: 5 * 60 * 1000, // 5 minutes
      staleTime: 60 * 1000, // 1 minute
    }
  );
}
