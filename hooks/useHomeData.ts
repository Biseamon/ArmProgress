/**
 * Custom hook for Home screen data fetching with caching
 *
 * Fetches all required data for the home screen in a single, optimized query
 * with automatic caching and loading states.
 * 
 * Now powered by React Query for improved caching and synchronization.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase, Workout, Cycle } from '@/lib/supabase';
import { queryKeys, invalidateQueries } from '@/lib/react-query';

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

// Legacy cache constants removed - React Query handles caching now

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
 * Fetch all home screen data
 * 
 * React Query handles caching automatically
 */
async function fetchHomeData(userId: string): Promise<HomeData> {
  console.log('[Home Data] Fetching from API');

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

  return homeData;
}

/**
 * React hook for home screen data with caching
 *
 * Now powered by React Query for automatic caching, refetching, and synchronization
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
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.home(userId || ''),
    queryFn: () => fetchHomeData(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    data: data ?? null, // Use nullish coalescing for better null/undefined handling
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}

/**
 * Invalidate home data cache
 * Call this after creating/updating/deleting workouts, goals, cycles, etc.
 * 
 * Now uses React Query's invalidation system
 */
export function invalidateHomeData(userId: string): void {
  invalidateQueries.home(userId);
}
