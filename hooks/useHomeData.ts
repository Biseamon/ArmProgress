/**
 * Custom hook for Home screen data fetching with caching
 *
 * Fetches all required data for the home screen from SQLite (offline-first)
 * with automatic caching and loading states.
 * 
 * Now powered by React Query + SQLite for offline-first architecture.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Workout, Cycle } from '@/lib/supabase';
import { getWorkouts, getRecentWorkouts } from '@/lib/db/queries/workouts';
import { getCycles } from '@/lib/db/queries/cycles';
import { getGoals, getActiveGoals, getCompletedGoals } from '@/lib/db/queries/goals';
import { getScheduledTrainings, getUpcomingTrainings } from '@/lib/db/queries/scheduledTrainings';

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
 * Fetch all home screen data from SQLite (offline-first)
 * 
 * React Query handles caching automatically
 */
async function fetchHomeData(userId: string): Promise<HomeData> {
  console.log('[Home Data] Fetching from SQLite');

  // Fetch all data in parallel from SQLite
  const [
    recentWorkoutsData,
    allWorkoutsData,
    cyclesData,
    completedGoalsData,
    activeGoalsData,
    scheduledTrainingsData,
  ] = await Promise.all([
    getRecentWorkouts(userId, 10),
    getWorkouts(userId),
    getCycles(userId),
    getCompletedGoals(userId),
    getActiveGoals(userId),
    getUpcomingTrainings(userId),
  ]);

  // Calculate stats
  const stats = calculateStats(allWorkoutsData || []);

  // Sort cycles by active status then start date
  const sortedCycles = (cyclesData || [])
    .sort((a, b) => {
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1;
      }
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    })
    .slice(0, 3);

  const homeData: HomeData = {
    recentWorkouts: recentWorkoutsData || [],
    cycles: sortedCycles,
    completedGoals: (completedGoalsData || []).slice(0, 3), // Limit to 3 for display
    activeGoals: (activeGoalsData || []).slice(0, 5), // Limit to 5 for display
    scheduledTrainings: (scheduledTrainingsData || []).slice(0, 5), // Limit to 5
    stats,
  };

  return homeData;
}

/**
 * React hook for home screen data with caching (offline-first)
 *
 * Now powered by React Query + SQLite for offline-first architecture
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
    queryKey: ['home', userId],
    queryFn: () => fetchHomeData(userId!),
    enabled: !!userId,
    staleTime: 0, // Always refetch when invalidated
  });

  return {
    data: data ?? null,
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
 * Now uses React Query's invalidation system for SQLite data
 */
export function invalidateHomeData(userId: string): void {
  const queryClient = useQueryClient();
  queryClient.invalidateQueries({ queryKey: ['home', userId] });
}
