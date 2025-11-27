/**
 * React Query + SQLite Integration
 * 
 * All queries read from SQLite.
 * All mutations write to SQLite first, then mark for sync.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Workout } from './supabase';
import {
  getWorkouts,
  getRecentWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getWorkoutStats,
} from './db/queries/workouts';
import { triggerSync } from './sync/syncEngine';

/**
 * QUERY KEYS
 */
export const queryKeys = {
  workouts: (userId: string) => ['workouts', userId] as const,
  workout: (id: string) => ['workout', id] as const,
  recentWorkouts: (userId: string, limit?: number) => ['workouts', 'recent', userId, limit] as const,
  workoutStats: (userId: string) => ['workouts', 'stats', userId] as const,
  cycles: (userId: string) => ['cycles', userId] as const,
  goals: (userId: string) => ['goals', userId] as const,
  measurements: (userId: string) => ['measurements', userId] as const,
  scheduledTrainings: (userId: string) => ['scheduledTrainings', userId] as const,
};

/**
 * Get all workouts for current user
 */
export const useWorkouts = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.workouts(profile?.id || ''),
    queryFn: () => getWorkouts(profile!.id),
    enabled: !!profile?.id,
    staleTime: Infinity, // SQLite is always fresh
  });
};

/**
 * Get recent workouts
 */
export const useRecentWorkouts = (limit: number = 10) => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.recentWorkouts(profile?.id || '', limit),
    queryFn: () => getRecentWorkouts(profile!.id, limit),
    enabled: !!profile?.id,
    staleTime: Infinity,
  });
};

/**
 * Get workout by ID
 */
export const useWorkout = (id: string) => {
  return useQuery({
    queryKey: queryKeys.workout(id),
    queryFn: () => getWorkoutById(id),
    enabled: !!id,
    staleTime: Infinity,
  });
};

/**
 * Get workout stats
 */
export const useWorkoutStats = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.workoutStats(profile?.id || ''),
    queryFn: () => getWorkoutStats(profile!.id),
    enabled: !!profile?.id,
    staleTime: Infinity,
  });
};

/**
 * Create workout mutation
 */
export const useCreateWorkout = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (workout: Omit<Workout, 'id' | 'updated_at' | 'created_at'> & { created_at?: string }) => {
      const id = await createWorkout({
        ...workout,
        created_at: workout.created_at || new Date().toISOString(),
      });
      return id;
    },
    onSuccess: () => {
      // Invalidate all workout queries to trigger refetch from SQLite
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      
      // Trigger background sync
      triggerSync(profile!.id);
    },
  });
};

/**
 * Update workout mutation
 */
export const useUpdateWorkout = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Workout> }) => {
      await updateWorkout(id, updates);
    },
    onSuccess: (_, variables) => {
      // Invalidate specific workout and all workouts list
      queryClient.invalidateQueries({ queryKey: queryKeys.workout(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      
      // Trigger background sync
      triggerSync(profile!.id);
    },
  });
};

/**
 * Delete workout mutation
 */
export const useDeleteWorkout = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteWorkout(id);
    },
    onSuccess: () => {
      // Invalidate all workout queries
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      
      // Trigger background sync
      triggerSync(profile!.id);
    },
  });
};

/**
 * Optimistic update helper
 * 
 * Example usage:
 * 
 * const updateMutation = useUpdateWorkout();
 * 
 * const handleUpdate = async (id: string, updates: Partial<Workout>) => {
 *   await updateMutation.mutateAsync({ id, updates });
 * };
 */

/**
 * Example: Invalidate all queries after sync completes
 */
export const invalidateAllQueries = (queryClient: any, userId: string) => {
  queryClient.invalidateQueries({ queryKey: ['workouts', userId] });
  queryClient.invalidateQueries({ queryKey: ['cycles', userId] });
  queryClient.invalidateQueries({ queryKey: ['goals', userId] });
  queryClient.invalidateQueries({ queryKey: ['measurements', userId] });
  queryClient.invalidateQueries({ queryKey: ['scheduledTrainings', userId] });
};

/**
 * Hook to manually trigger sync
 */
export const useSyncTrigger = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('No user');
      await triggerSync(profile.id);
    },
    onSuccess: () => {
      // Refetch all data after sync
      if (profile?.id) {
        invalidateAllQueries(queryClient, profile.id);
      }
    },
  });
};
