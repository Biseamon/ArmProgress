/**
 * Custom hook for Progress screen data fetching with caching
 */

import { useQuery } from './useQuery';
import { supabase, Goal, StrengthTest, Workout, Cycle, BodyMeasurement } from '@/lib/supabase';
import { requestCache, CacheKeys } from '@/lib/cache';

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
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all progress screen data in parallel
 */
async function fetchProgressData(userId: string): Promise<ProgressData> {
  const cacheKey = `progress:${userId}`;

  // Check cache first
  const cached = requestCache.get<ProgressData>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch all data in parallel
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

  // Cache the result
  requestCache.set(cacheKey, progressData, CACHE_TTL);

  return progressData;
}

/**
 * Hook for fetching progress screen data
 */
export function useProgressData(userId: string | undefined): UseProgressDataResult {
  const { data, isLoading, error, refetch } = useQuery(
    `progress:${userId}`,
    async () => {
      if (!userId) throw new Error('User ID is required');
      return fetchProgressData(userId);
    },
    {
      enabled: !!userId,
      cacheTime: CACHE_TTL,
      staleTime: 60 * 1000, // 1 minute
    }
  );

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
