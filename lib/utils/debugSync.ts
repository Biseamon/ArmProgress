/**
 * Debug utilities for sync operations
 *
 * Use these functions to diagnose and fix sync issues.
 * Import and call from anywhere in your app (e.g., settings screen, useEffect).
 */

import { getDatabase } from '../db/database';
import { triggerSync } from '../sync/syncEngine';

/**
 * Check if a string is a valid UUID v4
 */
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Preview what records have invalid IDs (won't delete anything)
 */
export const previewInvalidIds = async () => {
  console.log('[Debug] Scanning for invalid IDs...');
  const db = await getDatabase();

  const tables = [
    'friends',
    'friend_invites',
    'groups',
    'group_members',
    'group_invites',
    'feed_posts',
    'feed_reactions',
  ];

  const report: Record<string, { count: number; examples: string[] }> = {};
  let totalInvalid = 0;

  for (const table of tables) {
    const rows = await db.getAllAsync<{ id: string }>(
      `SELECT id FROM ${table}`
    );

    const invalidIds = rows
      .filter(row => !isValidUUID(row.id))
      .map(row => row.id);

    if (invalidIds.length > 0) {
      report[table] = {
        count: invalidIds.length,
        examples: invalidIds.slice(0, 3), // Show first 3 examples
      };
      totalInvalid += invalidIds.length;
    }
  }

  console.log('[Debug] Invalid IDs found:', report);
  console.log(`[Debug] Total invalid records: ${totalInvalid}`);

  return {
    totalInvalid,
    details: report,
  };
};

/**
 * Clean up all records with invalid IDs
 * WARNING: This will permanently delete local records that can't sync
 */
export const cleanupInvalidIds = async () => {
  console.log('[Debug] Starting cleanup of invalid IDs...');
  const db = await getDatabase();

  const tables = [
    'friends',
    'friend_invites',
    'groups',
    'group_members',
    'group_invites',
    'feed_posts',
    'feed_reactions',
  ];

  let totalCleaned = 0;
  const cleanedByTable: Record<string, number> = {};

  for (const table of tables) {
    const rows = await db.getAllAsync<{ id: string }>(
      `SELECT id FROM ${table}`
    );

    const invalidIds = rows
      .filter(row => !isValidUUID(row.id))
      .map(row => row.id);

    if (invalidIds.length > 0) {
      console.log(`[Debug] Cleaning ${invalidIds.length} invalid records from ${table}...`);

      for (const id of invalidIds) {
        await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [id]);
      }

      cleanedByTable[table] = invalidIds.length;
      totalCleaned += invalidIds.length;
    }
  }

  console.log(`[Debug] Cleanup complete! Removed ${totalCleaned} records`);
  console.log('[Debug] Breakdown:', cleanedByTable);

  return {
    totalCleaned,
    cleanedByTable,
  };
};

/**
 * Check pending sync status
 */
export const checkPendingSync = async () => {
  console.log('[Debug] Checking pending sync records...');
  const db = await getDatabase();

  const tables = [
    'friends',
    'friend_invites',
    'groups',
    'group_members',
    'group_invites',
    'feed_posts',
    'feed_reactions',
  ];

  const pending: Record<string, number> = {};
  let totalPending = 0;

  for (const table of tables) {
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${table} WHERE pending_sync = 1`
    );

    const count = result?.count || 0;
    if (count > 0) {
      pending[table] = count;
      totalPending += count;
    }
  }

  console.log('[Debug] Pending sync records:', pending);
  console.log(`[Debug] Total pending: ${totalPending}`);

  return {
    totalPending,
    pendingByTable: pending,
  };
};

/**
 * Force a full sync for a user
 */
export const forceSyncNow = async (userId: string) => {
  console.log('[Debug] Forcing sync for user:', userId);

  try {
    await triggerSync(userId);
    console.log('[Debug] Sync completed successfully');
    return { success: true };
  } catch (error: any) {
    console.error('[Debug] Sync failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Full diagnostic - runs all checks
 */
export const runFullDiagnostic = async (userId: string) => {
  console.log('[Debug] ========== SYNC DIAGNOSTIC ==========');

  // Check for invalid IDs
  const invalidCheck = await previewInvalidIds();

  // Check pending sync
  const pendingCheck = await checkPendingSync();

  // Build report
  const report = {
    timestamp: new Date().toISOString(),
    userId,
    invalidIds: invalidCheck,
    pendingSync: pendingCheck,
    recommendations: [] as string[],
  };

  // Generate recommendations
  if (invalidCheck.totalInvalid > 0) {
    report.recommendations.push(
      `⚠️ Found ${invalidCheck.totalInvalid} records with invalid IDs. Run cleanupInvalidIds() to fix.`
    );
  }

  if (pendingCheck.totalPending > 0) {
    report.recommendations.push(
      `📤 ${pendingCheck.totalPending} records waiting to sync. Run forceSyncNow() to push them.`
    );
  }

  if (invalidCheck.totalInvalid === 0 && pendingCheck.totalPending === 0) {
    report.recommendations.push('✅ Everything looks good! No issues found.');
  }

  console.log('[Debug] ========== DIAGNOSTIC REPORT ==========');
  console.log(JSON.stringify(report, null, 2));
  console.log('[Debug] =========================================');

  return report;
};
