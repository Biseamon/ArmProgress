/**
 * Cleanup Invalid IDs Migration
 *
 * This script removes old records with invalid UUID formats from local SQLite.
 * Invalid IDs like 'grp-xxxxx', 'gmem-xxxxx', 'post-xxxxx', 'ginv-xxxxx'
 * were from an older ID generation approach and cannot sync to Supabase.
 *
 * Run this ONCE to clean up old test data before syncing.
 */

import { getDatabase } from '../database';

/**
 * Check if a string is a valid UUID v4
 */
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Clean up records with invalid IDs from social tables
 */
export const cleanupInvalidIds = async () => {
  console.log('[Migration] Starting cleanup of invalid IDs...');
  const db = await getDatabase();

  let totalCleaned = 0;

  try {
    // Tables to clean
    const tables = [
      'friends',
      'friend_invites',
      'groups',
      'group_members',
      'group_invites',
      'feed_posts',
      'feed_reactions',
    ];

    for (const table of tables) {
      console.log(`[Migration] Checking ${table}...`);

      // Get all IDs from table
      const rows = await db.getAllAsync<{ id: string }>(
        `SELECT id FROM ${table}`
      );

      // Find invalid IDs
      const invalidIds = rows
        .filter(row => !isValidUUID(row.id))
        .map(row => row.id);

      if (invalidIds.length > 0) {
        console.log(`[Migration] Found ${invalidIds.length} invalid IDs in ${table}`);
        console.log(`[Migration] Examples: ${invalidIds.slice(0, 3).join(', ')}`);

        // Delete records with invalid IDs
        for (const id of invalidIds) {
          await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [id]);
        }

        totalCleaned += invalidIds.length;
        console.log(`[Migration] Cleaned ${invalidIds.length} records from ${table}`);
      } else {
        console.log(`[Migration] No invalid IDs found in ${table}`);
      }
    }

    console.log(`[Migration] Cleanup complete! Removed ${totalCleaned} records with invalid IDs`);

    if (totalCleaned > 0) {
      console.log('[Migration] You can now sync without UUID errors.');
    }

    return {
      success: true,
      recordsCleaned: totalCleaned,
    };
  } catch (error) {
    console.error('[Migration] Cleanup failed:', error);
    throw error;
  }
};

/**
 * Preview what would be cleaned without actually deleting
 */
export const previewCleanup = async () => {
  console.log('[Migration] Previewing cleanup (no changes will be made)...');
  const db = await getDatabase();

  const report: Record<string, string[]> = {};

  const tables = [
    'friends',
    'friend_invites',
    'groups',
    'group_members',
    'group_invites',
    'feed_posts',
    'feed_reactions',
  ];

  for (const table of tables) {
    const rows = await db.getAllAsync<{ id: string }>(
      `SELECT id FROM ${table}`
    );

    const invalidIds = rows
      .filter(row => !isValidUUID(row.id))
      .map(row => row.id);

    if (invalidIds.length > 0) {
      report[table] = invalidIds;
    }
  }

  console.log('[Migration] Preview report:', report);

  const totalToClean = Object.values(report).reduce((sum, ids) => sum + ids.length, 0);
  console.log(`[Migration] Total records that would be cleaned: ${totalToClean}`);

  return report;
};
