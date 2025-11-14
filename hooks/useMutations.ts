/**
 * Mutation Hooks
 * 
 * React Query mutation hooks for all CRUD operations with automatic cache invalidation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Workout, Goal, StrengthTest, Cycle, BodyMeasurement } from '@/lib/supabase';
import { queryKeys, invalidateQueries } from '@/lib/react-query';

/**
 * Workout Mutations
 */

export function useCreateWorkout(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workout: Omit<Workout, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('workouts')
        .insert(workout)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all related queries
      invalidateQueries.workouts(userId);
    },
  });
}

export function useUpdateWorkout(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Workout> & { id: string }) => {
      const { data, error } = await supabase
        .from('workouts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate workout queries
      invalidateQueries.workout(data.id, userId);
    },
  });
}

export function useDeleteWorkout(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workoutId: string) => {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);

      if (error) throw error;
      return workoutId;
    },
    onSuccess: () => {
      invalidateQueries.workouts(userId);
    },
  });
}

/**
 * Goal Mutations
 */

export function useCreateGoal(userId: string) {
  return useMutation({
    mutationFn: async (goal: Omit<Goal, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('goals')
        .insert(goal)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateQueries.goals(userId);
    },
  });
}

export function useUpdateGoal(userId: string) {
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateQueries.goals(userId);
    },
  });
}

export function useDeleteGoal(userId: string) {
  return useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      return goalId;
    },
    onSuccess: () => {
      invalidateQueries.goals(userId);
    },
  });
}

/**
 * Strength Test (PR) Mutations
 */

export function useCreateStrengthTest(userId: string) {
  return useMutation({
    mutationFn: async (test: Omit<StrengthTest, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('strength_tests')
        .insert(test)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateQueries.strengthTests(userId);
    },
  });
}

export function useUpdateStrengthTest(userId: string) {
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StrengthTest> & { id: string }) => {
      const { data, error } = await supabase
        .from('strength_tests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateQueries.strengthTests(userId);
    },
  });
}

export function useDeleteStrengthTest(userId: string) {
  return useMutation({
    mutationFn: async (testId: string) => {
      const { error} = await supabase
        .from('strength_tests')
        .delete()
        .eq('id', testId);

      if (error) throw error;
      return testId;
    },
    onSuccess: () => {
      invalidateQueries.strengthTests(userId);
    },
  });
}

/**
 * Body Measurement Mutations
 */

export function useCreateMeasurement(userId: string) {
  return useMutation({
    mutationFn: async (measurement: Omit<BodyMeasurement, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('body_measurements')
        .insert(measurement)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateQueries.measurements(userId);
    },
  });
}

export function useUpdateMeasurement(userId: string) {
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BodyMeasurement> & { id: string }) => {
      const { data, error } = await supabase
        .from('body_measurements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateQueries.measurements(userId);
    },
  });
}

export function useDeleteMeasurement(userId: string) {
  return useMutation({
    mutationFn: async (measurementId: string) => {
      const { error } = await supabase
        .from('body_measurements')
        .delete()
        .eq('id', measurementId);

      if (error) throw error;
      return measurementId;
    },
    onSuccess: () => {
      invalidateQueries.measurements(userId);
    },
  });
}

/**
 * Cycle Mutations
 */

export function useCreateCycle(userId: string) {
  return useMutation({
    mutationFn: async (cycle: Omit<Cycle, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('cycles')
        .insert(cycle)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateQueries.cycles(userId);
    },
  });
}

export function useUpdateCycle(userId: string) {
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cycle> & { id: string }) => {
      const { data, error } = await supabase
        .from('cycles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      invalidateQueries.cycles(userId, data.id);
    },
  });
}

export function useDeleteCycle(userId: string) {
  return useMutation({
    mutationFn: async (cycleId: string) => {
      const { error } = await supabase
        .from('cycles')
        .delete()
        .eq('id', cycleId);

      if (error) throw error;
      return cycleId;
    },
    onSuccess: () => {
      invalidateQueries.cycles(userId);
    },
  });
}

/**
 * Scheduled Training Mutations
 */

export function useCreateScheduledTraining(userId: string) {
  return useMutation({
    mutationFn: async (training: any) => {
      const { data, error } = await supabase
        .from('scheduled_trainings')
        .insert(training)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateQueries.scheduledTrainings(userId);
    },
  });
}

export function useUpdateScheduledTraining(userId: string) {
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('scheduled_trainings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateQueries.scheduledTrainings(userId);
    },
  });
}

export function useDeleteScheduledTraining(userId: string) {
  return useMutation({
    mutationFn: async (trainingId: string) => {
      const { error } = await supabase
        .from('scheduled_trainings')
        .delete()
        .eq('id', trainingId);

      if (error) throw error;
      return trainingId;
    },
    onSuccess: () => {
      invalidateQueries.scheduledTrainings(userId);
    },
  });
}

