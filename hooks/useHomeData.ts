/**
 * Custom hook for Home screen data fetching with caching
 *
 * Fetches all required data for the home screen in a single, optimized query
 * with automatic caching and loading states.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Workout, Cycle } from '@/lib/supabase';
import { requestCache, CacheKeys } from '@/lib/cache';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

interface HomeDataStats {
  totalWorkouts: number;
  thisWeek: number;
  totalMinutes: number;
  avgIntensity: number;
  viewAll: {
    fontSize: number;
    fontWeight: string;
    textDecorationLine: string;
  };
}

interface HomeData {
  recentWorkouts: Workout[];
  cycles: Cycle[];
  completedGoals: any[];
  activeGoals: any[];
  scheduledTrainings: any[];
  stats: HomeDataStats;
}

interface UseHomeDataResult {
  data: HomeData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const CACHE_KEY_PREFIX = 'home-data';
const CACHE_TTL = 60000; // 60 seconds

/**
 * Calculate workout statistics
 */
function calculateStats(workoutData: Workout[]): HomeDataStats {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const thisWeekWorkouts = workoutData.filter(
    (w) => new Date(w.created_at) > weekAgo
  );

  const totalMinutes = workoutData.reduce(
    (sum, w) => sum + w.duration_minutes,
    0
  );

  const avgIntensity =
    workoutData.length > 0
      ? workoutData.reduce((sum, w) => sum + w.intensity, 0) / workoutData.length
      : 0;

  return {
    totalWorkouts: workoutData.length,
    thisWeek: thisWeekWorkouts.length,
    totalMinutes,
    avgIntensity: Math.round(avgIntensity * 10) / 10,
    viewAll: {
      fontSize: 14,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  };
}

/**
 * Fetch all home screen data with caching
 */
async function fetchHomeData(userId: string): Promise<HomeData> {
  // Check cache first
  const cacheKey = `${CACHE_KEY_PREFIX}:${userId}`;
  const cached = requestCache.get<HomeData>(cacheKey);

  if (cached) {
    console.log('[Home Data] Cache HIT');
    return cached;
  }

  console.log('[Home Data] Cache MISS - Fetching from API');

  // Fetch all data in parallel (6 queries)
  const [
    recentWorkouts,
    allWorkouts,
    cyclesData,
    completedGoalsData,
    activeGoalsData,
    scheduledTrainingsData,
  ] = await Promise.all([
    supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('cycles')
      .select('*')
      .eq('user_id', userId)
      .order('is_active', { ascending: false })
      .order('start_date', { ascending: false })
      .limit(3),
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .order('deadline', { ascending: true })
      .limit(5),
    supabase
      .from('scheduled_trainings')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .limit(5),
  ]);

  // Check for errors
  if (recentWorkouts.error) throw recentWorkouts.error;
  if (allWorkouts.error) throw allWorkouts.error;
  if (cyclesData.error) throw cyclesData.error;
  if (completedGoalsData.error) throw completedGoalsData.error;
  if (activeGoalsData.error) throw activeGoalsData.error;
  if (scheduledTrainingsData.error) throw scheduledTrainingsData.error;

  // Calculate stats
  const stats = calculateStats(allWorkouts.data || []);

  const homeData: HomeData = {
    recentWorkouts: recentWorkouts.data || [],
    cycles: cyclesData.data || [],
    completedGoals: completedGoalsData.data || [],
    activeGoals: activeGoalsData.data || [],
    scheduledTrainings: scheduledTrainingsData.data || [],
    stats,
  };

  // Cache the result
  requestCache.set(cacheKey, homeData, CACHE_TTL);

  return homeData;
}

/**
 * React hook for home screen data with caching
 *
 * @example
 * const { data, isLoading, error, refetch } = useHomeData(profile?.id);
 *
 * if (isLoading) return <ActivityIndicator />;
 * if (error) return <Text>Error: {error.message}</Text>;
 *
 * <Text>Total Workouts: {data.stats.totalWorkouts}</Text>
 */
export function useHomeData(userId: string | undefined): UseHomeDataResult {
  const [data, setData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const appState = useRef(AppState.currentState);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const homeData = await fetchHomeData(userId);
      setData(homeData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[Home Data] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch on mount and when userId changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when screen is focused (cache will be checked first, so this is efficient)
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchData();
      }
    }, [userId, fetchData])
  );

  // Also refetch when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        fetchData();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [fetchData]);

  const refetch = useCallback(async () => {
    if (userId) {
      // Invalidate cache before refetch
      const cacheKey = `${CACHE_KEY_PREFIX}:${userId}`;
      requestCache.invalidate(cacheKey);
      await fetchData();
    }
  }, [userId, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Invalidate home data cache
 * Call this after creating/updating/deleting workouts, goals, cycles, etc.
 */
export function invalidateHomeData(userId: string): void {
  const cacheKey = `${CACHE_KEY_PREFIX}:${userId}`;
  requestCache.invalidate(cacheKey);
}
