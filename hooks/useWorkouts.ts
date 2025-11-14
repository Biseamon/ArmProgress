/**
 * Workouts Query Hooks
 * 
 * React Query hooks for fetching and managing workout data with pagination
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase, Workout } from '@/lib/supabase';
import { queryKeys } from '@/lib/react-query';

const WORKOUTS_PAGE_SIZE = 20;

interface WorkoutsInfiniteQueryResult {
  data: Workout[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

/**
 * Fetch workouts with cursor-based pagination
 */
async function fetchWorkoutsPage(
  userId: string,
  pageParam: string | null,
  cycleId?: string
): Promise<{ data: Workout[]; nextCursor: string | null }> {
  let query = supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(WORKOUTS_PAGE_SIZE + 1); // Fetch one extra to determine if there are more

  // Filter by cycle if specified
  if (cycleId) {
    query = query.eq('cycle_id', cycleId);
  }

  // Use cursor for pagination (created_at based)
  if (pageParam) {
    query = query.lt('created_at', pageParam);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Check if there are more results
  const hasMore = data && data.length > WORKOUTS_PAGE_SIZE;
  const workouts = hasMore ? data.slice(0, WORKOUTS_PAGE_SIZE) : (data || []);
  
  // Get next cursor from last item
  const nextCursor = hasMore && workouts.length > 0
    ? workouts[workouts.length - 1].created_at
    : null;

  return {
    data: workouts,
    nextCursor,
  };
}

/**
 * Hook for infinite scroll workouts list
 * 
 * @example
 * const { data, hasNextPage, fetchNextPage, isLoading } = useWorkoutsInfinite(userId);
 * 
 * // Flatten pages for display
 * const allWorkouts = data.flatMap(page => page);
 * 
 * // Load more on scroll
 * <FlatList
 *   data={allWorkouts}
 *   onEndReached={() => hasNextPage && fetchNextPage()}
 * />
 */
export function useWorkoutsInfinite(
  userId: string | undefined,
  cycleId?: string
): WorkoutsInfiniteQueryResult {
  const {
    data,
    isLoading,
    isFetching,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.workouts.infinite(userId || '', cycleId),
    queryFn: ({ pageParam }) => fetchWorkoutsPage(userId!, pageParam, cycleId),
    enabled: !!userId,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten pages into single array (ensure always returns array, never undefined)
  const flattenedData = data?.pages.flatMap((page) => page.data) ?? [];

  return {
    data: flattenedData,
    isLoading,
    isFetching,
    error: error as Error | null,
    hasNextPage: hasNextPage ?? false, // Ensure boolean, never undefined
    fetchNextPage: () => {
      if (hasNextPage && !isFetching) {
        fetchNextPage();
      }
    },
    refetch: async () => {
      await refetch();
    },
  };
}

/**
 * Hook for fetching a limited list of workouts (for home screen, etc.)
 */
export function useWorkoutsList(
  userId: string | undefined,
  limit?: number,
  cycleId?: string
) {
  return useQuery({
    queryKey: queryKeys.workouts.list(userId || '', { limit, cycleId }),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      let query = supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (cycleId) {
        query = query.eq('cycle_id', cycleId);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching a single workout by ID
 */
export function useWorkout(workoutId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workouts.detail(workoutId || ''),
    queryFn: async () => {
      if (!workoutId) throw new Error('Workout ID is required');

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();

      if (error) throw error;

      return data;
    },
    enabled: !!workoutId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for fetching exercises for a workout
 */
export function useWorkoutExercises(workoutId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.exercises.byWorkout(workoutId || ''),
    queryFn: async () => {
      if (!workoutId) throw new Error('Workout ID is required');

      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('workout_id', workoutId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    },
    enabled: !!workoutId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

