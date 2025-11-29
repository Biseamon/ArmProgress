/**
 * Training Template CRUD Operations
 *
 * All training template operations go through SQLite.
 * Changes are marked for sync with pending_sync = 1.
 */

import { getDatabase } from '../database';
import { TrainingTemplate, TemplateExercise } from '@/lib/supabase';

/**
 * Get all training templates for a user
 */
export const getTrainingTemplates = async (userId: string): Promise<TrainingTemplate[]> => {
  const db = await getDatabase();

  const rows = await db.getAllAsync<any>(
    'SELECT * FROM training_templates WHERE user_id = ? AND deleted = 0 ORDER BY created_at DESC',
    [userId]
  );

  // Parse exercises JSON for each template
  return rows.map(row => ({
    ...row,
    exercises: row.exercises ? JSON.parse(row.exercises) : [],
  }));
};

/**
 * Get training template by ID
 */
export const getTrainingTemplateById = async (id: string): Promise<TrainingTemplate | null> => {
  const db = await getDatabase();

  const row = await db.getFirstAsync<any>(
    'SELECT * FROM training_templates WHERE id = ? AND deleted = 0',
    [id]
  );

  if (!row) return null;

  return {
    ...row,
    exercises: row.exercises ? JSON.parse(row.exercises) : [],
  };
};

/**
 * Get count of templates for a user (for premium limit check)
 */
export const getTemplateCount = async (userId: string): Promise<number> => {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM training_templates WHERE user_id = ? AND deleted = 0',
    [userId]
  );

  return result?.count || 0;
};

/**
 * Create a new training template
 */
export const createTrainingTemplate = async (
  template: Omit<TrainingTemplate, 'id' | 'created_at'>
): Promise<string> => {
  const db = await getDatabase();

  const id = generateUUID();
  const now = new Date().toISOString();

  // Stringify exercises array for storage
  const exercisesJson = template.exercises ? JSON.stringify(template.exercises) : '[]';

  await db.runAsync(
    `INSERT INTO training_templates (
      id, user_id, name, description, workout_type,
      suggested_duration_minutes, suggested_intensity, exercises, notes,
      created_at, updated_at, modified_at, pending_sync, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
    [
      id,
      template.user_id,
      template.name,
      template.description || null,
      template.workout_type,
      template.suggested_duration_minutes || null,
      template.suggested_intensity || null,
      exercisesJson,
      template.notes || null,
      now,
      now,
      now
    ]
  );

  return id;
};

/**
 * Update a training template
 */
export const updateTrainingTemplate = async (
  id: string,
  updates: Partial<TrainingTemplate>
): Promise<void> => {
  const db = await getDatabase();

  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const values: any[] = [];

  // Build dynamic SET clause
  Object.keys(updates).forEach(key => {
    if (key !== 'id' && key !== 'created_at' && key !== 'user_id') {
      if (key === 'exercises') {
        // Stringify exercises array
        setClauses.push('exercises = ?');
        values.push(JSON.stringify((updates as any)[key] || []));
      } else {
        setClauses.push(`${key} = ?`);
        values.push((updates as any)[key]);
      }
    }
  });

  // Always update these
  setClauses.push('updated_at = ?', 'modified_at = ?', 'pending_sync = ?');
  values.push(now, now, 1);

  // Add ID for WHERE clause
  values.push(id);

  await db.runAsync(
    `UPDATE training_templates SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
};

/**
 * Delete a training template (soft delete)
 */
export const deleteTrainingTemplate = async (id: string): Promise<void> => {
  const db = await getDatabase();

  const now = new Date().toISOString();

  await db.runAsync(
    'UPDATE training_templates SET deleted = 1, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [now, id]
  );
};

/**
 * Get training templates that need to be synced
 */
export const getPendingTemplates = async (): Promise<any[]> => {
  const db = await getDatabase();

  const rows = await db.getAllAsync<any>(
    'SELECT * FROM training_templates WHERE pending_sync = 1'
  );

  // Return as-is with exercises as JSON string for sync
  return rows;
};

/**
 * Mark training template as synced
 */
export const markTemplateSynced = async (id: string): Promise<void> => {
  const db = await getDatabase();

  await db.runAsync(
    'UPDATE training_templates SET pending_sync = 0 WHERE id = ?',
    [id]
  );
};

/**
 * Upsert training template from Supabase (during sync)
 */
export const upsertTrainingTemplate = async (template: any): Promise<void> => {
  const db = await getDatabase();

  const now = new Date().toISOString();

  // Handle exercises - could be array or string depending on source
  const exercisesJson = typeof template.exercises === 'string'
    ? template.exercises
    : JSON.stringify(template.exercises || []);

  await db.runAsync(
    `INSERT OR REPLACE INTO training_templates (
      id, user_id, name, description, workout_type,
      suggested_duration_minutes, suggested_intensity, exercises, notes,
      created_at, updated_at, modified_at, pending_sync, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      template.id,
      template.user_id,
      template.name,
      template.description || null,
      template.workout_type,
      template.suggested_duration_minutes || null,
      template.suggested_intensity || null,
      exercisesJson,
      template.notes || null,
      template.created_at || now,
      template.updated_at || now,
      template.modified_at || now
    ]
  );
};

// Helper function to generate UUID (simple version)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
