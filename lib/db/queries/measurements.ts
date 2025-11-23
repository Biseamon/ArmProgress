/**
 * Body Measurements CRUD Operations
 */

import { getDatabase } from '../database';
import { BodyMeasurement } from '@/lib/supabase';

/**
 * Get all measurements for a user
 */
export const getMeasurements = async (userId: string): Promise<BodyMeasurement[]> => {
  const db = await getDatabase();
  
  const measurements = await db.getAllAsync<BodyMeasurement>(
    'SELECT * FROM body_measurements WHERE user_id = ? AND deleted = 0 ORDER BY measured_at DESC',
    [userId]
  );
  
  return measurements;
};

/**
 * Get recent measurements (limit)
 */
export const getRecentMeasurements = async (userId: string, limit: number = 10): Promise<BodyMeasurement[]> => {
  const db = await getDatabase();
  
  const measurements = await db.getAllAsync<BodyMeasurement>(
    'SELECT * FROM body_measurements WHERE user_id = ? AND deleted = 0 ORDER BY measured_at DESC LIMIT ?',
    [userId, limit]
  );
  
  return measurements;
};

/**
 * Get latest measurement
 */
export const getLatestMeasurement = async (userId: string): Promise<BodyMeasurement | null> => {
  const db = await getDatabase();
  
  const measurement = await db.getFirstAsync<BodyMeasurement>(
    'SELECT * FROM body_measurements WHERE user_id = ? AND deleted = 0 ORDER BY measured_at DESC LIMIT 1',
    [userId]
  );
  
  return measurement || null;
};

/**
 * Get measurement by ID
 */
export const getMeasurementById = async (id: string): Promise<BodyMeasurement | null> => {
  const db = await getDatabase();
  
  const measurement = await db.getFirstAsync<BodyMeasurement>(
    'SELECT * FROM body_measurements WHERE id = ? AND deleted = 0',
    [id]
  );
  
  return measurement || null;
};

/**
 * Create a new measurement
 */
export const createMeasurement = async (measurement: Omit<BodyMeasurement, 'id' | 'created_at'>): Promise<string> => {
  const db = await getDatabase();
  
  const id = generateUUID();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO body_measurements (
      id, user_id, weight, weight_unit, 
      arm_circumference, forearm_circumference, wrist_circumference,
      notes, measured_at, created_at, modified_at, pending_sync, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
    [
      id,
      measurement.user_id,
      measurement.weight || null,
      measurement.weight_unit || 'lbs',
      measurement.arm_circumference || null,
      measurement.forearm_circumference || null,
      measurement.wrist_circumference || null,
      measurement.notes || null,
      measurement.measured_at || now,
      now,
      now
    ]
  );
  
  return id;
};

/**
 * Update a measurement
 */
export const updateMeasurement = async (id: string, updates: Partial<BodyMeasurement>): Promise<void> => {
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
    `UPDATE body_measurements SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
};

/**
 * Delete a measurement (soft delete)
 */
export const deleteMeasurement = async (id: string): Promise<void> => {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  
  await db.runAsync(
    'UPDATE body_measurements SET deleted = 1, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [now, id]
  );
};

/**
 * Get measurements that need to be synced
 */
export const getPendingMeasurements = async (): Promise<BodyMeasurement[]> => {
  const db = await getDatabase();
  
  const measurements = await db.getAllAsync<BodyMeasurement>(
    'SELECT * FROM body_measurements WHERE pending_sync = 1'
  );
  
  return measurements;
};

/**
 * Mark measurement as synced
 */
export const markMeasurementSynced = async (id: string): Promise<void> => {
  const db = await getDatabase();
  
  await db.runAsync(
    'UPDATE body_measurements SET pending_sync = 0 WHERE id = ?',
    [id]
  );
};

/**
 * Upsert measurement from Supabase (during sync)
 */
export const upsertMeasurement = async (measurement: BodyMeasurement): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT OR REPLACE INTO body_measurements (
      id, user_id, weight, weight_unit,
      arm_circumference, forearm_circumference, wrist_circumference,
      notes, measured_at, created_at, modified_at, pending_sync, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      measurement.id,
      measurement.user_id,
      measurement.weight,
      measurement.weight_unit,
      measurement.arm_circumference,
      measurement.forearm_circumference,
      measurement.wrist_circumference,
      measurement.notes,
      measurement.measured_at,
      measurement.created_at,
      now,
    ]
  );
};

/**
 * Get measurement trends (for graphs)
 */
export const getMeasurementTrends = async (userId: string, days: number = 90) => {
  const db = await getDatabase();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const measurements = await db.getAllAsync<BodyMeasurement>(
    'SELECT * FROM body_measurements WHERE user_id = ? AND deleted = 0 AND measured_at >= ? ORDER BY measured_at ASC',
    [userId, startDate.toISOString()]
  );
  
  return measurements;
};

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

