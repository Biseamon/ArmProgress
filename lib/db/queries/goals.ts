/**
 * Goal CRUD Operations
 */

import { getDatabase } from '../database';
import { Goal } from '@/lib/supabase';

/**
 * Get all goals for a user
 */
export const getGoals = async (userId: string): Promise<Goal[]> => {
  const db = await getDatabase();
  
  const goals = await db.getAllAsync<Goal>(
    'SELECT * FROM goals WHERE user_id = ? AND deleted = 0 ORDER BY created_at DESC',
    [userId]
  );
  
  return goals;
};

/**
 * Get active (incomplete) goals
 */
export const getActiveGoals = async (userId: string): Promise<Goal[]> => {
  const db = await getDatabase();
  
  const goals = await db.getAllAsync<Goal>(
    'SELECT * FROM goals WHERE user_id = ? AND is_completed = 0 AND deleted = 0 ORDER BY created_at DESC',
    [userId]
  );
  
  return goals;
};

/**
 * Get completed goals
 */
export const getCompletedGoals = async (userId: string): Promise<Goal[]> => {
  const db = await getDatabase();
  
  const goals = await db.getAllAsync<Goal>(
    'SELECT * FROM goals WHERE user_id = ? AND is_completed = 1 AND deleted = 0 ORDER BY created_at DESC',
    [userId]
  );
  
  return goals;
};

/**
 * Get goal by ID
 */
export const getGoalById = async (id: string): Promise<Goal | null> => {
  const db = await getDatabase();
  
  const goal = await db.getFirstAsync<Goal>(
    'SELECT * FROM goals WHERE id = ? AND deleted = 0',
    [id]
  );
  
  return goal || null;
};

/**
 * Create a new goal
 */
export const createGoal = async (goal: Omit<Goal, 'id' | 'created_at'>): Promise<string> => {
  const db = await getDatabase();
  
  const id = generateUUID();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO goals (
      id, user_id, goal_type, target_value, current_value,
      deadline, is_completed, notes,
      created_at, modified_at, pending_sync, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
    [
      id,
      goal.user_id,
      goal.goal_type,
      goal.target_value,
      goal.current_value || 0,
      goal.deadline || null,
      goal.is_completed ? 1 : 0,
      goal.notes || null,
      now,
      now
    ]
  );
  
  return id;
};

/**
 * Update a goal
 */
export const updateGoal = async (id: string, updates: Partial<Goal>): Promise<void> => {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const values: any[] = [];
  
  Object.keys(updates).forEach(key => {
    if (key !== 'id' && key !== 'created_at') {
      setClauses.push(`${key} = ?`);
      const value = (updates as any)[key];
      // Convert boolean to integer for SQLite
      if (key === 'is_completed') {
        values.push(value ? 1 : 0);
      } else {
        values.push(value);
      }
    }
  });
  
  setClauses.push('modified_at = ?', 'pending_sync = ?');
  values.push(now, 1);
  values.push(id);
  
  await db.runAsync(
    `UPDATE goals SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
};

/**
 * Increment goal progress
 */
export const incrementGoal = async (id: string): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  // Get current goal
  const goal = await getGoalById(id);
  if (!goal) return;
  
  const newValue = goal.current_value + 1;
  const isCompleted = newValue >= goal.target_value;
  
  await db.runAsync(
    'UPDATE goals SET current_value = ?, is_completed = ?, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [newValue, isCompleted ? 1 : 0, now, id]
  );
};

/**
 * Decrement goal progress
 */
export const decrementGoal = async (id: string): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  // Get current goal
  const goal = await getGoalById(id);
  if (!goal) return;
  
  const newValue = Math.max(goal.current_value - 1, 0);
  const isCompleted = newValue >= goal.target_value;
  
  await db.runAsync(
    'UPDATE goals SET current_value = ?, is_completed = ?, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [newValue, isCompleted ? 1 : 0, now, id]
  );
};

/**
 * Toggle goal completion
 */
export const toggleGoalCompletion = async (id: string): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  const goal = await getGoalById(id);
  if (!goal) return;
  
  await db.runAsync(
    'UPDATE goals SET is_completed = ?, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [goal.is_completed ? 0 : 1, now, id]
  );
};

/**
 * Delete a goal (soft delete)
 */
export const deleteGoal = async (id: string): Promise<void> => {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  
  await db.runAsync(
    'UPDATE goals SET deleted = 1, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [now, id]
  );
};

/**
 * Get goals that need to be synced
 */
export const getPendingGoals = async (): Promise<Goal[]> => {
  const db = await getDatabase();
  
  const goals = await db.getAllAsync<Goal>(
    'SELECT * FROM goals WHERE pending_sync = 1'
  );
  
  return goals;
};

/**
 * Mark goal as synced
 */
export const markGoalSynced = async (id: string): Promise<void> => {
  const db = await getDatabase();
  
  await db.runAsync(
    'UPDATE goals SET pending_sync = 0 WHERE id = ?',
    [id]
  );
};

/**
 * Upsert goal from Supabase (during sync)
 */
export const upsertGoal = async (goal: Goal): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT OR REPLACE INTO goals (
      id, user_id, goal_type, target_value, current_value,
      deadline, is_completed, notes,
      created_at, modified_at, pending_sync, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      goal.id,
      goal.user_id,
      goal.goal_type,
      goal.target_value,
      goal.current_value,
      goal.deadline,
      goal.is_completed ? 1 : 0,
      goal.notes,
      goal.created_at,
      now,
    ]
  );
};

/**
 * Get goal stats
 */
export const getGoalStats = async (userId: string) => {
  const db = await getDatabase();
  
  const totalResult = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM goals WHERE user_id = ? AND deleted = 0',
    [userId]
  );
  
  const completedResult = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM goals WHERE user_id = ? AND is_completed = 1 AND deleted = 0',
    [userId]
  );
  
  return {
    total: totalResult?.count || 0,
    completed: completedResult?.count || 0,
    active: (totalResult?.count || 0) - (completedResult?.count || 0),
  };
};

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

