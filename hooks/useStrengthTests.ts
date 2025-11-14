/**
 * Strength Tests Query Hooks
 * 
 * React Query hooks for fetching and managing strength test/PR data with pagination
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase, StrengthTest } from '@/lib/supabase';
import { queryKeys } from '@/lib/react-query';

const TESTS_PAGE_SIZE = 20;

interface TestsInfiniteQueryResult {
  data: StrengthTest[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

/**
 * Fetch strength tests with cursor-based pagination
 */
async function fetchStrengthTestsPage(
  userId: string,
  pageParam: string | null
): Promise<{ data: StrengthTest[]; nextCursor: string | null }> {
  let query = supabase
    .from('strength_tests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(TESTS_PAGE_SIZE + 1); // Fetch one extra to determine if there are more

  // Use cursor for pagination
  if (pageParam) {
    query = query.lt('created_at', pageParam);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Check if there are more results
  const hasMore = data && data.length > TESTS_PAGE_SIZE;
  const tests = hasMore ? data.slice(0, TESTS_PAGE_SIZE) : (data || []);
  
  // Get next cursor from last item
  const nextCursor = hasMore && tests.length > 0
    ? tests[tests.length - 1].created_at
    : null;

  return {
    data: tests,
    nextCursor,
  };
}

/**
 * Hook for infinite scroll strength tests list
 */
export function useStrengthTestsInfinite(
  userId: string | undefined
): TestsInfiniteQueryResult {
  const {
    data,
    isLoading,
    isFetching,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.strengthTests.infinite(userId || ''),
    queryFn: ({ pageParam }) => fetchStrengthTestsPage(userId!, pageParam),
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
 * Hook for fetching a limited list of strength tests
 */
export function useStrengthTestsList(
  userId: string | undefined,
  limit?: number
) {
  return useQuery({
    queryKey: queryKeys.strengthTests.list(userId || '', limit),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      let query = supabase
        .from('strength_tests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

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

