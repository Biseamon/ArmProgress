/**
 * Complete React Query + SQLite Integration
 * 
 * Hooks for all app data:
 * - Workouts & Exercises
 * - Cycles
 * - Goals
 * - Strength Tests (PRs)
 * - Body Measurements
 * - Scheduled Trainings
 * - Profile
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Workout, Cycle, Goal, StrengthTest, BodyMeasurement, ScheduledTraining, Profile } from './supabase';
import { triggerSync } from './sync/syncEngine';

// Workouts
import {
  getWorkouts,
  getRecentWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getWorkoutStats,
} from './db/queries/workouts';

// Exercises
import {
  getExercises,
  createExercise,
  createExercises,
  updateExercise,
  deleteExercise,
  deleteExercisesByWorkout,
} from './db/queries/exercises';

// Cycles
import {
  getCycles,
  getActiveCycle,
  getCycleById,
  createCycle,
  updateCycle,
  deleteCycle,
  setActiveCycle,
} from './db/queries/cycles';

// Goals
import {
  getGoals,
  getActiveGoals,
  getCompletedGoals,
  getGoalById,
  createGoal,
  updateGoal,
  incrementGoal,
  decrementGoal,
  deleteGoal,
  getGoalStats,
} from './db/queries/goals';

// Strength Tests
import {
  getStrengthTests,
  getRecentStrengthTests,
  getLatestPRsByType,
  createStrengthTest,
  updateStrengthTest,
  deleteStrengthTest,
} from './db/queries/strengthTests';

// Body Measurements
import {
  getMeasurements,
  getRecentMeasurements,
  getLatestMeasurement,
  createMeasurement,
  updateMeasurement,
  deleteMeasurement,
} from './db/queries/measurements';

// Scheduled Trainings
import {
  getScheduledTrainings,
  getUpcomingTrainings,
  getTrainingsByDate,
  createScheduledTraining,
  updateScheduledTraining,
  markTrainingCompleted,
  deleteScheduledTraining,
} from './db/queries/scheduledTrainings';

// Profile
import {
  getProfile,
  updateProfile,
  updateWeightUnit,
} from './db/queries/profile';

/**
 * QUERY KEYS
 */
export const queryKeys = {
  // Workouts
  workouts: (userId: string) => ['workouts', userId] as const,
  workout: (id: string) => ['workout', id] as const,
  recentWorkouts: (userId: string, limit?: number) => ['workouts', 'recent', userId, limit] as const,
  workoutStats: (userId: string) => ['workouts', 'stats', userId] as const,
  
  // Exercises
  exercises: (workoutId: string) => ['exercises', workoutId] as const,
  
  // Cycles
  cycles: (userId: string) => ['cycles', userId] as const,
  cycle: (id: string) => ['cycle', id] as const,
  activeCycle: (userId: string) => ['cycles', 'active', userId] as const,
  
  // Goals
  goals: (userId: string) => ['goals', userId] as const,
  goal: (id: string) => ['goal', id] as const,
  activeGoals: (userId: string) => ['goals', 'active', userId] as const,
  completedGoals: (userId: string) => ['goals', 'completed', userId] as const,
  goalStats: (userId: string) => ['goals', 'stats', userId] as const,
  
  // Strength Tests
  strengthTests: (userId: string) => ['strengthTests', userId] as const,
  recentStrengthTests: (userId: string, limit?: number) => ['strengthTests', 'recent', userId, limit] as const,
  latestPRs: (userId: string) => ['strengthTests', 'latest', userId] as const,
  
  // Body Measurements
  measurements: (userId: string) => ['measurements', userId] as const,
  recentMeasurements: (userId: string, limit?: number) => ['measurements', 'recent', userId, limit] as const,
  latestMeasurement: (userId: string) => ['measurements', 'latest', userId] as const,
  
  // Scheduled Trainings
  scheduledTrainings: (userId: string) => ['scheduledTrainings', userId] as const,
  upcomingTrainings: (userId: string) => ['scheduledTrainings', 'upcoming', userId] as const,
  trainingsByDate: (userId: string, date: string) => ['scheduledTrainings', 'date', userId, date] as const,
  
  // Profile
  profile: (userId: string) => ['profile', userId] as const,
};

// ==========================================
// WORKOUTS
// ==========================================

export const useWorkouts = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.workouts(profile?.id || ''),
    queryFn: () => getWorkouts(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useRecentWorkouts = (limit: number = 10) => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.recentWorkouts(profile?.id || '', limit),
    queryFn: () => getRecentWorkouts(profile!.id, limit),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useWorkout = (id: string) => {
  return useQuery({
    queryKey: queryKeys.workout(id),
    queryFn: () => getWorkoutById(id),
    enabled: !!id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useWorkoutStats = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.workoutStats(profile?.id || ''),
    queryFn: () => getWorkoutStats(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useCreateWorkout = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (workout: Omit<Workout, 'id' | 'created_at' | 'updated_at'>) => {
      const id = await createWorkout(workout);
      return id;
    },
    onSuccess: () => {
      // Invalidate all queries that might show workouts
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledTrainings'] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useUpdateWorkout = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Workout> }) => {
      await updateWorkout(id, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workout(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useDeleteWorkout = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteWorkout(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// EXERCISES
// ==========================================

export const useExercises = (workoutId: string) => {
  return useQuery({
    queryKey: queryKeys.exercises(workoutId),
    queryFn: () => getExercises(workoutId),
    enabled: !!workoutId,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useCreateExercises = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (exercises: Omit<any, 'id' | 'created_at'>[]) => {
      const ids = await createExercises(exercises);
      return ids;
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: queryKeys.exercises(variables[0].workout_id) });
      }
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// CYCLES
// ==========================================

export const useCycles = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.cycles(profile?.id || ''),
    queryFn: () => getCycles(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useActiveCycle = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.activeCycle(profile?.id || ''),
    queryFn: () => getActiveCycle(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useCycle = (id: string) => {
  return useQuery({
    queryKey: queryKeys.cycle(id),
    queryFn: () => getCycleById(id),
    enabled: !!id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useCreateCycle = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (cycle: Omit<Cycle, 'id' | 'created_at' | 'updated_at'>) => {
      const id = await createCycle(cycle);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useUpdateCycle = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Cycle> }) => {
      await updateCycle(id, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycle(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useDeleteCycle = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteCycle(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useSetActiveCycle = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (cycleId: string) => {
      await setActiveCycle(profile!.id, cycleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// GOALS
// ==========================================

export const useGoals = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.goals(profile?.id || ''),
    queryFn: () => getGoals(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useActiveGoals = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.activeGoals(profile?.id || ''),
    queryFn: () => getActiveGoals(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useGoalStats = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.goalStats(profile?.id || ''),
    queryFn: () => getGoalStats(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (goal: Omit<Goal, 'id' | 'created_at'>) => {
      const id = await createGoal(goal);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Goal> }) => {
      await updateGoal(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useIncrementGoal = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await incrementGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useDecrementGoal = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await decrementGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// STRENGTH TESTS (PRs)
// ==========================================

export const useStrengthTests = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.strengthTests(profile?.id || ''),
    queryFn: () => getStrengthTests(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useRecentStrengthTests = (limit: number = 10) => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.recentStrengthTests(profile?.id || '', limit),
    queryFn: () => getRecentStrengthTests(profile!.id, limit),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useLatestPRs = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.latestPRs(profile?.id || ''),
    queryFn: () => getLatestPRsByType(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useCreateStrengthTest = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (test: Omit<StrengthTest, 'id' | 'created_at'>) => {
      const id = await createStrengthTest(test);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strengthTests'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useUpdateStrengthTest = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StrengthTest> }) => {
      await updateStrengthTest(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strengthTests'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useDeleteStrengthTest = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteStrengthTest(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strengthTests'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// BODY MEASUREMENTS
// ==========================================

export const useMeasurements = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.measurements(profile?.id || ''),
    queryFn: () => getMeasurements(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useRecentMeasurements = (limit: number = 10) => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.recentMeasurements(profile?.id || '', limit),
    queryFn: () => getRecentMeasurements(profile!.id, limit),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useLatestMeasurement = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.latestMeasurement(profile?.id || ''),
    queryFn: () => getLatestMeasurement(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useCreateMeasurement = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (measurement: Omit<BodyMeasurement, 'id' | 'created_at'>) => {
      const id = await createMeasurement(measurement);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useUpdateMeasurement = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BodyMeasurement> }) => {
      await updateMeasurement(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useDeleteMeasurement = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteMeasurement(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// SCHEDULED TRAININGS
// ==========================================

export const useScheduledTrainings = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.scheduledTrainings(profile?.id || ''),
    queryFn: () => getScheduledTrainings(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useUpcomingTrainings = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.upcomingTrainings(profile?.id || ''),
    queryFn: () => getUpcomingTrainings(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useTrainingsByDate = (date: string) => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.trainingsByDate(profile?.id || '', date),
    queryFn: () => getTrainingsByDate(profile!.id, date),
    enabled: !!profile?.id && !!date,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useCreateScheduledTraining = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (training: Omit<ScheduledTraining, 'id' | 'created_at'>) => {
      const id = await createScheduledTraining(training);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledTrainings'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useUpdateScheduledTraining = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ScheduledTraining> }) => {
      await updateScheduledTraining(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledTrainings'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useMarkTrainingCompleted = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await markTrainingCompleted(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledTrainings'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useDeleteScheduledTraining = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteScheduledTraining(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledTrainings'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// PROFILE
// ==========================================

export const useProfile = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.profile(profile?.id || ''),
    queryFn: () => getProfile(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      await updateProfile(profile!.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(profile!.id) });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useUpdateWeightUnit = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (weightUnit: 'lbs' | 'kg') => {
      await updateWeightUnit(profile!.id, weightUnit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(profile!.id) });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// SYNC TRIGGER
// ==========================================

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
        queryClient.invalidateQueries({ queryKey: ['workouts', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['cycles', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['goals', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['strengthTests', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['measurements', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['scheduledTrainings', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['profile', profile.id] });
      }
    },
  });
};

