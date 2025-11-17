/**
 * Body Measurements Query Hooks
 * 
 * React Query hooks for fetching and managing body measurement data with pagination
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase, BodyMeasurement } from '@/lib/supabase';
import { queryKeys } from '@/lib/react-query';

const MEASUREMENTS_PAGE_SIZE = 20;

interface MeasurementsInfiniteQueryResult {
  data: BodyMeasurement[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

/**
 * Fetch measurements with cursor-based pagination
 */
async function fetchMeasurementsPage(
  userId: string,
  pageParam: string | null
): Promise<{ data: BodyMeasurement[]; nextCursor: string | null }> {
  let query = supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false })
    .limit(MEASUREMENTS_PAGE_SIZE + 1); // Fetch one extra to determine if there are more

  // Use cursor for pagination
  if (pageParam) {
    query = query.lt('measured_at', pageParam);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Check if there are more results
  const hasMore = data && data.length > MEASUREMENTS_PAGE_SIZE;
  const measurements = hasMore ? data.slice(0, MEASUREMENTS_PAGE_SIZE) : (data || []);
  
  // Get next cursor from last item
  const nextCursor = hasMore && measurements.length > 0
    ? measurements[measurements.length - 1].measured_at
    : null;

  return {
    data: measurements,
    nextCursor,
  };
}

/**
 * Hook for infinite scroll measurements list
 */
export function useMeasurementsInfinite(
  userId: string | undefined
): MeasurementsInfiniteQueryResult {
  const {
    data,
    isLoading,
    isFetching,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.measurements.infinite(userId || ''),
    queryFn: ({ pageParam }) => fetchMeasurementsPage(userId!, pageParam),
    enabled: !!userId,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
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
 * Hook for fetching a limited list of measurements
 */
export function useMeasurementsList(
  userId: string | undefined,
  limit?: number
) {
  return useQuery({
    queryKey: queryKeys.measurements.list(userId || '', limit),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      let query = supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', userId)
        .order('measured_at', { ascending: false});

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

