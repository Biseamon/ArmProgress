/**
 * Custom hook for Progress screen data fetching with caching
 * 
 * Now powered by React Query for automatic caching, refetching, and synchronization
 */

import { useQuery } from '@tanstack/react-query';
import { supabase, Goal, StrengthTest, Workout, Cycle, BodyMeasurement } from '@/lib/supabase';
import { queryKeys, invalidateQueries } from '@/lib/react-query';

interface ProgressData {
  goals: Goal[];
  strengthTests: StrengthTest[];
  workouts: Workout[];
  measurements: BodyMeasurement[];
  cycles: Cycle[];
}

export interface UseProgressDataResult {
  data: ProgressData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Fetch all progress screen data in parallel
 */
async function fetchProgressData(userId: string): Promise<ProgressData> {
  // Fetch all data in parallel (no manual caching - useQuery handles it)
  const [goalsResponse, testsResponse, workoutsResponse, measurementsResponse, cyclesResponse] =
    await Promise.all([
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('strength_tests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', userId)
        .order('measured_at', { ascending: false })
        .limit(10),
      supabase
        .from('cycles')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false }),
    ]);

  // Check for errors
  if (goalsResponse.error) throw goalsResponse.error;
  if (testsResponse.error) throw testsResponse.error;
  if (workoutsResponse.error) throw workoutsResponse.error;
  if (measurementsResponse.error) throw measurementsResponse.error;
  if (cyclesResponse.error) throw cyclesResponse.error;

  const progressData: ProgressData = {
    goals: goalsResponse.data || [],
    strengthTests: testsResponse.data || [],
    workouts: workoutsResponse.data || [],
    measurements: measurementsResponse.data || [],
    cycles: cyclesResponse.data || [],
  };

  return progressData;
}

/**
 * Hook for fetching progress screen data
 * 
 * Now powered by React Query with proper caching
 */
export function useProgressData(userId: string | undefined): UseProgressDataResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.progress(userId || ''),
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return fetchProgressData(userId);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes - fresher than home data since it's updated more often
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: data ?? null, // Use nullish coalescing for better null/undefined handling
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
    invalidate: () => {
      if (userId) {
        invalidateQueries.progress(userId);
      }
    },
  };
}
