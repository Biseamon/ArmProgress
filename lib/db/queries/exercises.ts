/**
 * Exercise CRUD Operations
 */

import { getDatabase } from '../database';
import { Exercise } from '@/lib/supabase';

/**
 * Get all exercises for a workout
 */
export const getExercises = async (workoutId: string): Promise<Exercise[]> => {
  const db = await getDatabase();
  
  const exercises = await db.getAllAsync<Exercise>(
    'SELECT * FROM exercises WHERE workout_id = ? AND deleted = 0 ORDER BY created_at ASC',
    [workoutId]
  );
  
  return exercises;
};

/**
 * Get exercise by ID
 */
export const getExerciseById = async (id: string): Promise<Exercise | null> => {
  const db = await getDatabase();
  
  const exercise = await db.getFirstAsync<Exercise>(
    'SELECT * FROM exercises WHERE id = ? AND deleted = 0',
    [id]
  );
  
  return exercise || null;
};

/**
 * Create a new exercise
 */
export const createExercise = async (exercise: Omit<Exercise, 'id' | 'created_at'>): Promise<string> => {
  const db = await getDatabase();
  
  const id = generateUUID();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO exercises (
      id, workout_id, exercise_name, sets, reps, 
      weight_lbs, weight_unit, notes,
      created_at, modified_at, pending_sync
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      id,
      exercise.workout_id,
      exercise.exercise_name,
      exercise.sets || 0,
      exercise.reps || 0,
      exercise.weight_lbs || 0,
      exercise.weight_unit || 'lbs',
      exercise.notes || '',
      now,
      now
    ]
  );
  
  return id;
};

/**
 * Create multiple exercises at once
 */
export const createExercises = async (exercises: Omit<Exercise, 'id' | 'created_at'>[]): Promise<string[]> => {
  const db = await getDatabase();
  const ids: string[] = [];
  const now = new Date().toISOString();
  
  for (const exercise of exercises) {
    const id = generateUUID();
    ids.push(id);
    
    await db.runAsync(
      `INSERT INTO exercises (
        id, workout_id, exercise_name, sets, reps,
        weight_lbs, weight_unit, notes,
        created_at, modified_at, pending_sync
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id,
        exercise.workout_id,
        exercise.exercise_name,
        exercise.sets || 0,
        exercise.reps || 0,
        exercise.weight_lbs || 0,
        exercise.weight_unit || 'lbs',
        exercise.notes || '',
        now,
        now
      ]
    );
  }
  
  return ids;
};

/**
 * Update an exercise
 */
export const updateExercise = async (id: string, updates: Partial<Exercise>): Promise<void> => {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const values: any[] = [];
  
  Object.keys(updates).forEach(key => {
    if (key !== 'id' && key !== 'created_at') {
      setClauses.push(`${key} = ?`);
      values.push((updates as any)[key]);
    }
  });
  
  setClauses.push('modified_at = ?', 'pending_sync = ?');
  values.push(now, 1);
  values.push(id);
  
  await db.runAsync(
    `UPDATE exercises SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
};

/**
 * Delete an exercise (soft delete)
 */
export const deleteExercise = async (id: string): Promise<void> => {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  
  await db.runAsync(
    'UPDATE exercises SET deleted = 1, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [now, id]
  );
};

/**
 * Delete all exercises for a workout
 */
export const deleteExercisesByWorkout = async (workoutId: string): Promise<void> => {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  
  await db.runAsync(
    'UPDATE exercises SET deleted = 1, modified_at = ?, pending_sync = 1 WHERE workout_id = ?',
    [now, workoutId]
  );
};

/**
 * Get exercises that need to be synced
 */
export const getPendingExercises = async (): Promise<Exercise[]> => {
  const db = await getDatabase();
  
  const exercises = await db.getAllAsync<Exercise>(
    'SELECT * FROM exercises WHERE pending_sync = 1'
  );
  
  return exercises;
};

/**
 * Mark exercise as synced
 */
export const markExerciseSynced = async (id: string): Promise<void> => {
  const db = await getDatabase();
  
  await db.runAsync(
    'UPDATE exercises SET pending_sync = 0 WHERE id = ?',
    [id]
  );
};

/**
 * Upsert exercise from Supabase (during sync)
 */
export const upsertExercise = async (exercise: Exercise): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT OR REPLACE INTO exercises (
      id, workout_id, exercise_name, sets, reps,
      weight_lbs, weight_unit, notes,
      created_at, modified_at, pending_sync, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      exercise.id,
      exercise.workout_id,
      exercise.exercise_name,
      exercise.sets,
      exercise.reps,
      exercise.weight_lbs,
      exercise.weight_unit,
      exercise.notes,
      exercise.created_at,
      now,
    ]
  );
};

/**
 * Get exercise history by name (for tracking progress on specific exercises)
 */
export const getExerciseHistory = async (userId: string, exerciseName: string): Promise<Exercise[]> => {
  const db = await getDatabase();
  
  // Join with workouts to filter by user
  const exercises = await db.getAllAsync<Exercise>(
    `SELECT e.* FROM exercises e
     JOIN workouts w ON e.workout_id = w.id
     WHERE w.user_id = ? AND e.exercise_name = ? AND e.deleted = 0
     ORDER BY w.created_at DESC`,
    [userId, exerciseName]
  );
  
  return exercises;
};

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

