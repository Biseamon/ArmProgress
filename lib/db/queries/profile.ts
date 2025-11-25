/**
 * Profile CRUD Operations
 */

import { getDatabase } from '../database';
import { Profile } from '@/lib/supabase';

/**
 * Get profile by user ID
 */
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const db = await getDatabase();
  
  const profile = await db.getFirstAsync<Profile>(
    'SELECT * FROM profiles WHERE id = ? AND deleted = 0',
    [userId]
  );
  
  return profile || null;
};

/**
 * Create or update profile (upsert)
 */
export const upsertProfile = async (profile: Profile): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT OR REPLACE INTO profiles (
      id, email, full_name, is_premium, is_test_user,
      weight_unit, avatar_url, avatar_local_path, avatar_cached_at,
      created_at, updated_at, modified_at, pending_sync, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
    [
      profile.id,
      profile.email,
      profile.full_name || '',
      profile.is_premium ? 1 : 0,
      profile.is_test_user ? 1 : 0,
      profile.weight_unit || 'lbs',
      profile.avatar_url || null,
      null, // avatar_local_path (set separately by image cache)
      null, // avatar_cached_at (set separately by image cache)
      profile.created_at || now,
      profile.updated_at || now,
      now,
    ]
  );
};

/**
 * Update profile fields
 */
export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<void> => {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const values: any[] = [];
  
  Object.keys(updates).forEach(key => {
    if (key !== 'id' && key !== 'created_at') {
      setClauses.push(`${key} = ?`);
      const value = (updates as any)[key];
      // Convert boolean to integer for SQLite
      if (key === 'is_premium' || key === 'is_test_user') {
        values.push(value ? 1 : 0);
      } else {
        values.push(value);
      }
    }
  });
  
  setClauses.push('updated_at = ?', 'modified_at = ?', 'pending_sync = ?');
  values.push(now, now, 1);
  values.push(userId);
  
  await db.runAsync(
    `UPDATE profiles SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
};

/**
 * Update avatar metadata (used by image cache)
 */
export const updateAvatarMetadata = async (
  userId: string,
  avatarUrl: string | null,
  localPath: string | null,
  cachedAt: string | null
): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  await db.runAsync(
    'UPDATE profiles SET avatar_url = ?, avatar_local_path = ?, avatar_cached_at = ?, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [avatarUrl, localPath, cachedAt, now, userId]
  );
};

/**
 * Update weight unit preference
 */
export const updateWeightUnit = async (userId: string, weightUnit: 'lbs' | 'kg'): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  await db.runAsync(
    'UPDATE profiles SET weight_unit = ?, updated_at = ?, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [weightUnit, now, now, userId]
  );
};

/**
 * Get profile that needs to be synced
 */
export const getPendingProfile = async (): Promise<Profile | null> => {
  const db = await getDatabase();
  
  const profile = await db.getFirstAsync<Profile>(
    'SELECT * FROM profiles WHERE pending_sync = 1 LIMIT 1'
  );
  
  return profile || null;
};

/**
 * Mark profile as synced
 */
export const markProfileSynced = async (userId: string): Promise<void> => {
  const db = await getDatabase();
  
  await db.runAsync(
    'UPDATE profiles SET pending_sync = 0 WHERE id = ?',
    [userId]
  );
};

/**
 * Delete profile (soft delete)
 */
export const deleteProfile = async (userId: string): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  await db.runAsync(
    'UPDATE profiles SET deleted = 1, modified_at = ?, pending_sync = 1 WHERE id = ?',
    [now, userId]
  );
};

/**
 * Get avatar cache info
 */
export const getAvatarCacheInfo = async (userId: string) => {
  const db = await getDatabase();
  
  const result = await db.getFirstAsync<{
    avatar_url: string | null;
    avatar_local_path: string | null;
    avatar_cached_at: string | null;
  }>(
    'SELECT avatar_url, avatar_local_path, avatar_cached_at FROM profiles WHERE id = ?',
    [userId]
  );
  
  return result;
};

