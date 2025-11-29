import { getDatabase } from '../database';

// Generic pending fetcher for local tables
export const getPending = async (table: string) => {
  const db = await getDatabase();
  // Include deleted rows so removals propagate to Supabase
  return db.getAllAsync(`SELECT * FROM ${table} WHERE pending_sync = 1`);
};

export const markSynced = async (table: string, id: string) => {
  const db = await getDatabase();
  await db.runAsync(`UPDATE ${table} SET pending_sync = 0 WHERE id = ?`, [id]);
};

// Specialized pending fetchers for social tables (filter by current user)
export const getPendingFriends = async (userId: string) => {
  const db = await getDatabase();
  // Only sync friends where current user is one of the participants
  return db.getAllAsync(
    `SELECT * FROM friends WHERE pending_sync = 1 AND (user_id = ? OR friend_user_id = ?)`,
    [userId, userId]
  );
};

export const getPendingFriendInvites = async (userId: string) => {
  const db = await getDatabase();
  // Only sync invites created by current user (not invites TO them)
  return db.getAllAsync(
    `SELECT * FROM friend_invites WHERE pending_sync = 1 AND inviter_id = ?`,
    [userId]
  );
};

export const getPendingGroups = async (userId: string) => {
  const db = await getDatabase();
  // Only sync groups owned by current user
  return db.getAllAsync(
    `SELECT * FROM groups WHERE pending_sync = 1 AND owner_id = ?`,
    [userId]
  );
};

export const getPendingGroupMembers = async (userId: string) => {
  const db = await getDatabase();
  // Sync memberships for the current user OR any group they own (so owners can manage members)
  return db.getAllAsync(
    `SELECT gm.*
     FROM group_members gm
     LEFT JOIN groups g ON gm.group_id = g.id
     WHERE gm.pending_sync = 1
       AND (gm.user_id = ? OR g.owner_id = ?)`,
    [userId, userId]
  );
};

export const getPendingGroupInvites = async (userId: string) => {
  const db = await getDatabase();
  // Only sync invites sent by current user
  return db.getAllAsync(
    `SELECT * FROM group_invites WHERE pending_sync = 1 AND inviter_id = ?`,
    [userId]
  );
};

export const getPendingFeedPosts = async (userId: string) => {
  const db = await getDatabase();
  // Only sync posts created by current user
  return db.getAllAsync(
    `SELECT * FROM feed_posts WHERE pending_sync = 1 AND user_id = ?`,
    [userId]
  );
};

export const getPendingFeedReactions = async (userId: string) => {
  const db = await getDatabase();
  // Only sync reactions by current user
  return db.getAllAsync(
    `SELECT * FROM feed_reactions WHERE pending_sync = 1 AND user_id = ?`,
    [userId]
  );
};
