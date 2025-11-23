/**
 * Cycle CRUD Operations
 */

import { getDatabase } from '../database';
import { Cycle } from '@/lib/supabase';

/**
 * Get all cycles for a user
 */
export const getCycles = async (userId: string): Promise<Cycle[]> => {
  const db = await getDatabase();
  
  const cycles = await db.getAllAsync<Cycle>(
    'SELECT * FROM cycles WHERE user_id = ? AND deleted = 0 ORDER BY start_date DESC',
    [userId]
  );
  
  return cycles;
};

/**
 * Get active cycle
 */
export const getActiveCycle = async (userId: string): Promise<Cycle | null> => {
  const db = await getDatabase();
  
  const cycle = await db.getFirstAsync<Cycle>(
    'SELECT * FROM cycles WHERE user_id = ? AND is_active = 1 AND deleted = 0 LIMIT 1',
    [userId]
  );
  
  return cycle || null;
};

/**
 * Get cycle by ID
 */
export const getCycleById = async (id: string): Promise<Cycle | null> => {
  const db = await getDatabase();
  
  const cycle = await db.getFirstAsync<Cycle>(
    'SELECT * FROM cycles WHERE id = ? AND deleted = 0',
    [id]
  );
  
  return cycle || null;
};

/**
 * Create a new cycle
 */
export const createCycle = async (cycle: Omit<Cycle, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  const db = await getDatabase();
  
  const id = generateUUID();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO cycles (
      id, user_id, name, description, cycle_type, 
      start_date, end_date, is_active, 
      created_at, updated_at, modified_at, pending_sync
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      id,
      cycle.user_id,
      cycle.name,
      cycle.description || '',
      cycle.cycle_type,
      cycle.start_date,
      cycle.end_date,
      cycle.is_active ? 1 : 0,
      now,
      now,
      now
    ]
  );
  
  return id;
};

/**
 * Update a cycle
 */
export const updateCycle = async (id: string, updates: Partial<Cycle>): Promise<void> => {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const values: any[] = [];
  
  Object.keys(updates).forEach(key => {
    if (key !== 'id' && key !== 'created_at') {
      setClauses.push(`${key} = ?`);
      const value = (updates as any)[key];
      // Convert boolean to integer for SQLite
      if (key === 'is_active') {
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
    `UPDATE cycles SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
};

/**
 * Delete a cycle (soft delete)
 */
export const deleteCycle = async (id: string): Promise<void> => {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  
  await db.runAsync(
    'UPDATE cycles SET deleted = 1, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [now, id]
  );
};

/**
 * Set cycle as active (deactivate others)
 */
export const setActiveCycle = async (userId: string, cycleId: string): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  // Deactivate all cycles
  await db.runAsync(
    'UPDATE cycles SET is_active = 0, modified_at = ?, pending_sync = 1 WHERE user_id = ?',
    [now, userId]
  );
  
  // Activate the selected cycle
  await db.runAsync(
    'UPDATE cycles SET is_active = 1, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [now, cycleId]
  );
};

/**
 * Get cycles that need to be synced
 */
export const getPendingCycles = async (): Promise<Cycle[]> => {
  const db = await getDatabase();
  
  const cycles = await db.getAllAsync<Cycle>(
    'SELECT * FROM cycles WHERE pending_sync = 1'
  );
  
  return cycles;
};

/**
 * Mark cycle as synced
 */
export const markCycleSynced = async (id: string): Promise<void> => {
  const db = await getDatabase();
  
  await db.runAsync(
    'UPDATE cycles SET pending_sync = 0 WHERE id = ?',
    [id]
  );
};

/**
 * Upsert cycle from Supabase (during sync)
 */
export const upsertCycle = async (cycle: Cycle): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT OR REPLACE INTO cycles (
      id, user_id, name, description, cycle_type,
      start_date, end_date, is_active,
      created_at, updated_at, modified_at, pending_sync, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      cycle.id,
      cycle.user_id,
      cycle.name,
      cycle.description,
      cycle.cycle_type,
      cycle.start_date,
      cycle.end_date,
      cycle.is_active ? 1 : 0,
      cycle.created_at,
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

