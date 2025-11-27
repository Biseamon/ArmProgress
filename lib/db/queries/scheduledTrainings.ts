/**
 * Scheduled Training CRUD Operations
 */

import { getDatabase } from '../database';
import { ScheduledTraining } from '@/lib/supabase';

/**
 * Get all scheduled trainings for a user
 */
export const getScheduledTrainings = async (userId: string): Promise<ScheduledTraining[]> => {
  const db = await getDatabase();
  
  const trainings = await db.getAllAsync<ScheduledTraining>(
    'SELECT * FROM scheduled_trainings WHERE user_id = ? AND deleted = 0 ORDER BY scheduled_date ASC, scheduled_time ASC',
    [userId]
  );
  
  return trainings;
};

/**
 * Get upcoming scheduled trainings
 */
export const getUpcomingTrainings = async (userId: string): Promise<ScheduledTraining[]> => {
  const db = await getDatabase();
  // Extract just the date part (YYYY-MM-DD) to match scheduled_date format
  const today = new Date().toISOString().split('T')[0];
  
  const trainings = await db.getAllAsync<ScheduledTraining>(
    'SELECT * FROM scheduled_trainings WHERE user_id = ? AND deleted = 0 AND completed = 0 AND scheduled_date >= ? ORDER BY scheduled_date ASC, scheduled_time ASC',
    [userId, today]
  );
  
  return trainings;
};

/**
 * Get trainings for a specific date
 */
export const getTrainingsByDate = async (userId: string, date: string): Promise<ScheduledTraining[]> => {
  const db = await getDatabase();
  
  const trainings = await db.getAllAsync<ScheduledTraining>(
    'SELECT * FROM scheduled_trainings WHERE user_id = ? AND deleted = 0 AND scheduled_date = ? ORDER BY scheduled_time ASC',
    [userId, date]
  );
  
  return trainings;
};

/**
 * Get trainings for a date range
 */
export const getTrainingsByDateRange = async (userId: string, startDate: string, endDate: string): Promise<ScheduledTraining[]> => {
  const db = await getDatabase();
  
  const trainings = await db.getAllAsync<ScheduledTraining>(
    'SELECT * FROM scheduled_trainings WHERE user_id = ? AND deleted = 0 AND scheduled_date >= ? AND scheduled_date <= ? ORDER BY scheduled_date ASC, scheduled_time ASC',
    [userId, startDate, endDate]
  );
  
  return trainings;
};

/**
 * Get completed trainings
 */
export const getCompletedTrainings = async (userId: string): Promise<ScheduledTraining[]> => {
  const db = await getDatabase();
  
  const trainings = await db.getAllAsync<ScheduledTraining>(
    'SELECT * FROM scheduled_trainings WHERE user_id = ? AND deleted = 0 AND completed = 1 ORDER BY scheduled_date DESC',
    [userId]
  );
  
  return trainings;
};

/**
 * Get scheduled training by ID
 */
export const getScheduledTrainingById = async (id: string): Promise<ScheduledTraining | null> => {
  const db = await getDatabase();
  
  const training = await db.getFirstAsync<ScheduledTraining>(
    'SELECT * FROM scheduled_trainings WHERE id = ? AND deleted = 0',
    [id]
  );
  
  return training || null;
};

/**
 * Create a new scheduled training
 */
export const createScheduledTraining = async (training: Omit<ScheduledTraining, 'id' | 'created_at'>): Promise<string> => {
  const db = await getDatabase();
  
  const id = generateUUID();
  const now = new Date().toISOString();
  const completedAt = (training as any).completed_at ?? null;
  
  await db.runAsync(
    `INSERT INTO scheduled_trainings (
      id, user_id, title, description, scheduled_date, scheduled_time,
      notification_enabled, notification_minutes_before, notification_id,
      completed, completed_at, created_at, updated_at, modified_at, pending_sync, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
    [
      id,
      training.user_id,
      training.title,
      training.description || null,
      training.scheduled_date,
      training.scheduled_time,
      training.notification_enabled ? 1 : 0,
      training.notification_minutes_before || 30,
      training.notification_id || null,
      training.completed ? 1 : 0,
      completedAt,
      now,
      now,
      now
    ]
  );
  
  return id;
};

/**
 * Update a scheduled training
 */
export const updateScheduledTraining = async (id: string, updates: Partial<ScheduledTraining>): Promise<void> => {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const values: any[] = [];
  
  Object.keys(updates).forEach(key => {
    if (key !== 'id' && key !== 'created_at') {
      setClauses.push(`${key} = ?`);
      const value = (updates as any)[key];
      // Convert boolean to integer for SQLite
      if (key === 'notification_enabled' || key === 'completed') {
        values.push(value ? 1 : 0);
      } else {
        values.push(value);
      }
    }
  });
  
  setClauses.push('updated_at = ?', 'modified_at = ?', 'pending_sync = ?');
  values.push(now, now, 1);
  values.push(id);
  
  await db.runAsync(
    `UPDATE scheduled_trainings SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
};

/**
 * Mark training as completed
 */
export const markTrainingCompleted = async (id: string): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  await db.runAsync(
    'UPDATE scheduled_trainings SET completed = 1, completed_at = ?, updated_at = ?, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [now, now, now, id]
  );
};

/**
 * Mark training as incomplete
 */
export const markTrainingIncomplete = async (id: string): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  await db.runAsync(
    'UPDATE scheduled_trainings SET completed = 0, completed_at = NULL, updated_at = ?, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [now, now, id]
  );
};

/**
 * Delete a scheduled training (soft delete)
 */
export const deleteScheduledTraining = async (id: string): Promise<void> => {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  
  await db.runAsync(
    'UPDATE scheduled_trainings SET deleted = 1, updated_at = ?, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [now, now, id]
  );
};

/**
 * Get scheduled trainings that need to be synced
 */
export const getPendingScheduledTrainings = async (): Promise<ScheduledTraining[]> => {
  const db = await getDatabase();
  
  const trainings = await db.getAllAsync<ScheduledTraining>(
    'SELECT * FROM scheduled_trainings WHERE pending_sync = 1'
  );
  
  return trainings;
};

/**
 * Mark scheduled training as synced
 */
export const markScheduledTrainingSynced = async (id: string): Promise<void> => {
  const db = await getDatabase();
  
  await db.runAsync(
    'UPDATE scheduled_trainings SET pending_sync = 0 WHERE id = ?',
    [id]
  );
};

/**
 * Upsert scheduled training from Supabase (during sync)
 */
export const upsertScheduledTraining = async (training: ScheduledTraining): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const completedAt = (training as any).completed_at ?? null;
  
  await db.runAsync(
    `INSERT OR REPLACE INTO scheduled_trainings (
      id, user_id, title, description, scheduled_date, scheduled_time,
      notification_enabled, notification_minutes_before, notification_id,
      completed, completed_at, created_at, updated_at, modified_at, pending_sync, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      training.id,
      training.user_id,
      training.title,
      training.description,
      training.scheduled_date,
      training.scheduled_time,
      training.notification_enabled ? 1 : 0,
      training.notification_minutes_before,
      training.notification_id,
      training.completed ? 1 : 0,
      completedAt,
      (training as any).created_at ?? now,
      now,
      now,
    ]
  );
};

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
