/**
 * Strength Test / Personal Records CRUD Operations
 */

import { getDatabase } from '../database';
import { StrengthTest } from '@/lib/supabase';

/**
 * Get all strength tests for a user
 */
export const getStrengthTests = async (userId: string): Promise<StrengthTest[]> => {
  const db = await getDatabase();
  
  const tests = await db.getAllAsync<StrengthTest>(
    'SELECT * FROM strength_tests WHERE user_id = ? AND deleted = 0 ORDER BY created_at DESC',
    [userId]
  );
  
  return tests;
};

/**
 * Get recent strength tests (limit)
 */
export const getRecentStrengthTests = async (userId: string, limit: number = 10): Promise<StrengthTest[]> => {
  const db = await getDatabase();
  
  const tests = await db.getAllAsync<StrengthTest>(
    'SELECT * FROM strength_tests WHERE user_id = ? AND deleted = 0 ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );
  
  return tests;
};

/**
 * Get strength tests by type
 */
export const getStrengthTestsByType = async (userId: string, testType: string): Promise<StrengthTest[]> => {
  const db = await getDatabase();
  
  const tests = await db.getAllAsync<StrengthTest>(
    'SELECT * FROM strength_tests WHERE user_id = ? AND test_type = ? AND deleted = 0 ORDER BY created_at DESC',
    [userId, testType]
  );
  
  return tests;
};

/**
 * Get latest PR for each test type
 */
export const getLatestPRsByType = async (userId: string): Promise<StrengthTest[]> => {
  const db = await getDatabase();
  
  // Get all tests
  const allTests = await db.getAllAsync<StrengthTest>(
    'SELECT * FROM strength_tests WHERE user_id = ? AND deleted = 0 ORDER BY created_at DESC',
    [userId]
  );
  
  // Group by test_type and keep only the latest
  const prsByType: { [key: string]: StrengthTest } = {};
  
  allTests.forEach(test => {
    if (!prsByType[test.test_type] || 
        new Date(test.created_at) > new Date(prsByType[test.test_type].created_at)) {
      prsByType[test.test_type] = test;
    }
  });
  
  return Object.values(prsByType).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

/**
 * Get strength test by ID
 */
export const getStrengthTestById = async (id: string): Promise<StrengthTest | null> => {
  const db = await getDatabase();
  
  const test = await db.getFirstAsync<StrengthTest>(
    'SELECT * FROM strength_tests WHERE id = ? AND deleted = 0',
    [id]
  );
  
  return test || null;
};

/**
 * Create a new strength test
 */
export const createStrengthTest = async (test: Omit<StrengthTest, 'id' | 'created_at'>): Promise<string> => {
  const db = await getDatabase();
  
  const id = generateUUID();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO strength_tests (
      id, user_id, test_type, result_value, result_unit, notes,
      created_at, modified_at, pending_sync, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
    [
      id,
      test.user_id,
      test.test_type,
      test.result_value,
      test.result_unit || 'lbs',
      test.notes || null,
      now,
      now
    ]
  );
  
  return id;
};

/**
 * Update a strength test
 */
export const updateStrengthTest = async (id: string, updates: Partial<StrengthTest>): Promise<void> => {
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
    `UPDATE strength_tests SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
};

/**
 * Delete a strength test (soft delete)
 */
export const deleteStrengthTest = async (id: string): Promise<void> => {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  
  await db.runAsync(
    'UPDATE strength_tests SET deleted = 1, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [now, id]
  );
};

/**
 * Get strength tests that need to be synced
 */
export const getPendingStrengthTests = async (): Promise<StrengthTest[]> => {
  const db = await getDatabase();
  
  const tests = await db.getAllAsync<StrengthTest>(
    'SELECT * FROM strength_tests WHERE pending_sync = 1'
  );
  
  return tests;
};

/**
 * Mark strength test as synced
 */
export const markStrengthTestSynced = async (id: string): Promise<void> => {
  const db = await getDatabase();
  
  await db.runAsync(
    'UPDATE strength_tests SET pending_sync = 0 WHERE id = ?',
    [id]
  );
};

/**
 * Upsert strength test from Supabase (during sync)
 */
export const upsertStrengthTest = async (test: StrengthTest): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT OR REPLACE INTO strength_tests (
      id, user_id, test_type, result_value, result_unit, notes,
      created_at, modified_at, pending_sync, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      test.id,
      test.user_id,
      test.test_type,
      test.result_value ?? null,
      test.result_unit ?? null,
      test.notes ?? null,
      (test as any).created_at ?? now,
      now,
    ]
  );
};

/**
 * Get PR history for a specific test type
 */
export const getPRHistory = async (userId: string, testType: string): Promise<StrengthTest[]> => {
  const db = await getDatabase();
  
  const tests = await db.getAllAsync<StrengthTest>(
    'SELECT * FROM strength_tests WHERE user_id = ? AND test_type = ? AND deleted = 0 ORDER BY created_at ASC',
    [userId, testType]
  );
  
  return tests;
};

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
