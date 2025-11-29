/**
 * Workout CRUD Operations
 * 
 * All workout operations go through SQLite.
 * Changes are marked for sync with pending_sync = 1.
 */

import { getDatabase } from '../database';
import { Workout } from '@/lib/supabase';

/**
 * Get all workouts for a user
 */
export const getWorkouts = async (userId: string): Promise<Workout[]> => {
  const db = await getDatabase();
  
  const workouts = await db.getAllAsync<Workout>(
    'SELECT * FROM workouts WHERE user_id = ? AND deleted = 0 ORDER BY created_at DESC',
    [userId]
  );
  
  return workouts;
};

/**
 * Get recent workouts (last 10)
 */
export const getRecentWorkouts = async (userId: string, limit: number = 10): Promise<Workout[]> => {
  const db = await getDatabase();
  
  const workouts = await db.getAllAsync<Workout>(
    'SELECT * FROM workouts WHERE user_id = ? AND deleted = 0 ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );
  
  return workouts;
};

/**
 * Get workout by ID
 */
export const getWorkoutById = async (id: string): Promise<Workout | null> => {
  const db = await getDatabase();
  
  const workout = await db.getFirstAsync<Workout>(
    'SELECT * FROM workouts WHERE id = ? AND deleted = 0',
    [id]
  );
  
  return workout || null;
};

/**
 * Create a new workout
 */
export const createWorkout = async (
  workout: Omit<Workout, 'id' | 'updated_at' | 'created_at'> & { created_at?: string }
): Promise<string> => {
  const db = await getDatabase();
  
  const id = generateUUID();
  const now = new Date().toISOString();
  const createdAt = workout.created_at || now; // Use provided created_at or default to now
  const weightUnit = (workout as any).weight_unit || 'lbs';
  
  await db.runAsync(
    `INSERT INTO workouts (
      id, user_id, cycle_id, workout_type, duration_minutes, 
      intensity, notes, weight_unit, created_at, updated_at, 
      modified_at, pending_sync, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
    [
      id,
      workout.user_id,
      workout.cycle_id || null,
      workout.workout_type,
      workout.duration_minutes || 0,
      workout.intensity || 5,
      workout.notes || '',
      weightUnit,
      createdAt, // Use custom or current timestamp
      now,
      now
    ]
  );
  
  return id;
};

/**
 * Update a workout
 */
export const updateWorkout = async (id: string, updates: Partial<Workout>): Promise<void> => {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const values: any[] = [];
  
  // Build dynamic SET clause
  Object.keys(updates).forEach(key => {
    if (key !== 'id' && key !== 'created_at') {
      setClauses.push(`${key} = ?`);
      values.push((updates as any)[key]);
    }
  });
  
  // Always update these
  setClauses.push('updated_at = ?', 'modified_at = ?', 'pending_sync = ?');
  values.push(now, now, 1);
  
  // Add ID for WHERE clause
  values.push(id);
  
  await db.runAsync(
    `UPDATE workouts SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
};

/**
 * Delete a workout (soft delete)
 */
export const deleteWorkout = async (id: string): Promise<void> => {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  
  await db.runAsync(
    'UPDATE workouts SET deleted = 1, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [now, id]
  );
};

/**
 * Get workouts that need to be synced
 */
export const getPendingWorkouts = async (): Promise<Workout[]> => {
  const db = await getDatabase();
  
  const workouts = await db.getAllAsync<Workout>(
    'SELECT * FROM workouts WHERE pending_sync = 1'
  );
  
  return workouts;
};

/**
 * Mark workout as synced
 */
export const markWorkoutSynced = async (id: string): Promise<void> => {
  const db = await getDatabase();
  
  await db.runAsync(
    'UPDATE workouts SET pending_sync = 0 WHERE id = ?',
    [id]
  );
};

/**
 * Upsert workout from Supabase (during sync)
 */
export const upsertWorkout = async (workout: Workout): Promise<void> => {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT OR REPLACE INTO workouts (
      id, user_id, cycle_id, workout_type, duration_minutes,
      intensity, notes, weight_unit, created_at, updated_at,
      modified_at, pending_sync, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      workout.id,
      workout.user_id,
      workout.cycle_id,
      workout.workout_type,
      workout.duration_minutes,
      workout.intensity,
      workout.notes,
      'lbs',
      workout.created_at,
      now,
      now, // Use current timestamp as modified_at for synced data
    ]
  );
};

/**
 * Get workout stats
 */
export const getWorkoutStats = async (userId: string) => {
  const db = await getDatabase();
  
  // Total workouts
  const totalResult = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM workouts WHERE user_id = ? AND deleted = 0',
    [userId]
  );
  
  // This week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekResult = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM workouts WHERE user_id = ? AND deleted = 0 AND created_at >= ?',
    [userId, weekAgo.toISOString()]
  );
  
  // Total minutes
  const minutesResult = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(duration_minutes), 0) as total FROM workouts WHERE user_id = ? AND deleted = 0',
    [userId]
  );
  
  // Average intensity
  const intensityResult = await db.getFirstAsync<{ avg: number }>(
    'SELECT COALESCE(AVG(intensity), 0) as avg FROM workouts WHERE user_id = ? AND deleted = 0',
    [userId]
  );
  
  return {
    totalWorkouts: totalResult?.count || 0,
    thisWeek: thisWeekResult?.count || 0,
    totalMinutes: minutesResult?.total || 0,
    avgIntensity: Math.round(intensityResult?.avg || 0),
  };
};

// Helper function to generate UUID (simple version)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
