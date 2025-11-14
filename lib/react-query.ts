/**
 * React Query Configuration
 *
 * Central configuration for TanStack Query (React Query) including:
 * - QueryClient setup with optimal defaults
 * - Query key factory for consistent cache keys
 * - Shared query and mutation functions
 */

import { QueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

/**
 * Create and configure the QueryClient
 *
 * Configuration optimized for mobile apps:
 * - Stale-while-revalidate: Show cached data while fetching fresh data
 * - Automatic refetching on window focus and network reconnect
 * - Retry failed queries with exponential backoff
 * - Cache data for 10 minutes, consider stale after 5 minutes
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache time: Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      
      // Refetch data when window regains focus (app comes to foreground)
      refetchOnWindowFocus: true,
      
      // Refetch when component mounts if data is stale
      refetchOnMount: true,
      
      // Refetch on network reconnect
      refetchOnReconnect: true,
      
      // Retry failed queries (3 attempts with exponential backoff)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Enable network mode for better offline support
      networkMode: 'online',
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      retryDelay: 1000,
      
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

/**
 * Query Key Factory
 *
 * Centralized query key generation for consistent cache management
 * Following React Query best practices with hierarchical keys
 */
export const queryKeys = {
  // Home screen data
  home: (userId: string) => ['home', userId] as const,
  
  // Progress screen data
  progress: (userId: string) => ['progress', userId] as const,
  
  // Workouts
  workouts: {
    all: (userId: string) => ['workouts', userId] as const,
    list: (userId: string, filters?: { limit?: number; cycleId?: string }) =>
      ['workouts', userId, 'list', filters] as const,
    detail: (workoutId: string) => ['workouts', 'detail', workoutId] as const,
    infinite: (userId: string, cycleId?: string) =>
      ['workouts', userId, 'infinite', { cycleId }] as const,
  },
  
  // Exercises
  exercises: {
    byWorkout: (workoutId: string) => ['exercises', workoutId] as const,
  },
  
  // Goals
  goals: {
    all: (userId: string) => ['goals', userId] as const,
    list: (userId: string, status?: 'active' | 'completed') =>
      ['goals', userId, 'list', { status }] as const,
    detail: (goalId: string) => ['goals', 'detail', goalId] as const,
  },
  
  // Strength tests (PRs)
  strengthTests: {
    all: (userId: string) => ['strength-tests', userId] as const,
    list: (userId: string, limit?: number) =>
      ['strength-tests', userId, 'list', { limit }] as const,
    infinite: (userId: string) =>
      ['strength-tests', userId, 'infinite'] as const,
  },
  
  // Body measurements
  measurements: {
    all: (userId: string) => ['measurements', userId] as const,
    list: (userId: string, limit?: number) =>
      ['measurements', userId, 'list', { limit }] as const,
    infinite: (userId: string) =>
      ['measurements', userId, 'infinite'] as const,
  },
  
  // Training cycles
  cycles: {
    all: (userId: string) => ['cycles', userId] as const,
    detail: (cycleId: string) => ['cycles', 'detail', cycleId] as const,
    workouts: (cycleId: string) => ['cycles', cycleId, 'workouts'] as const,
  },
  
  // Scheduled trainings
  scheduledTrainings: {
    all: (userId: string) => ['scheduled-trainings', userId] as const,
    upcoming: (userId: string) =>
      ['scheduled-trainings', userId, 'upcoming'] as const,
  },
  
  // Calendar data
  calendar: {
    data: (userId: string, year: number) =>
      ['calendar', userId, year] as const,
  },
  
  // Profile
  profile: (userId: string) => ['profile', userId] as const,
};

/**
 * Cache Invalidation Helpers
 *
 * Simplify cache invalidation after mutations
 */
export const invalidateQueries = {
  // Invalidate home screen data
  home: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.home(userId) });
  },
  
  // Invalidate progress screen data
  progress: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.progress(userId) });
  },
  
  // Invalidate all workout-related queries
  workouts: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.home(userId) });
    queryClient.invalidateQueries({ queryKey: ['calendar', userId] });
  },
  
  // Invalidate specific workout
  workout: (workoutId: string, userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workouts.detail(workoutId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.home(userId) });
  },
  
  // Invalidate goals
  goals: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.goals.all(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.home(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.progress(userId) });
  },
  
  // Invalidate strength tests
  strengthTests: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.strengthTests.all(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.progress(userId) });
  },
  
  // Invalidate measurements
  measurements: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.measurements.all(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.progress(userId) });
  },
  
  // Invalidate cycles
  cycles: (userId: string, cycleId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.home(userId) });
    if (cycleId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.detail(cycleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.workouts(cycleId) });
    }
  },
  
  // Invalidate scheduled trainings
  scheduledTrainings: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.scheduledTrainings.all(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.home(userId) });
  },
  
  // Invalidate calendar data
  calendar: (userId: string, year?: number) => {
    if (year) {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.data(userId, year) });
    } else {
      queryClient.invalidateQueries({ queryKey: ['calendar', userId] });
    }
  },
  
  // Invalidate everything for a user (useful after logout or major changes)
  all: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['home', userId] });
    queryClient.invalidateQueries({ queryKey: ['progress', userId] });
    queryClient.invalidateQueries({ queryKey: ['workouts', userId] });
    queryClient.invalidateQueries({ queryKey: ['goals', userId] });
    queryClient.invalidateQueries({ queryKey: ['strength-tests', userId] });
    queryClient.invalidateQueries({ queryKey: ['measurements', userId] });
    queryClient.invalidateQueries({ queryKey: ['cycles', userId] });
    queryClient.invalidateQueries({ queryKey: ['scheduled-trainings', userId] });
    queryClient.invalidateQueries({ queryKey: ['calendar', userId] });
  },
};

/**
 * Prefetch Helpers
 *
 * Prefetch data before it's needed to improve perceived performance
 */
export const prefetchQueries = {
  // Prefetch home data
  home: async (userId: string) => {
    // Implementation will be added when we migrate useHomeData
  },
  
  // Prefetch progress data
  progress: async (userId: string) => {
    // Implementation will be added when we migrate useProgressData
  },
};

/**
 * Set query data helpers
 *
 * Manually update cache (useful for optimistic updates)
 */
export const setQueryData = {
  // Update workout in cache
  updateWorkout: (workoutId: string, userId: string, updater: any) => {
    queryClient.setQueryData(queryKeys.workouts.detail(workoutId), updater);
    // Also update in lists
    queryClient.setQueriesData(
      { queryKey: queryKeys.workouts.all(userId) },
      (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data?.map((w: any) =>
            w.id === workoutId ? { ...w, ...updater } : w
          ),
        };
      }
    );
  },
};

