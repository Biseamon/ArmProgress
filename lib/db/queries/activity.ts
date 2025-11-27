import { getDatabase } from '../database';

// Friends (includes outgoing and incoming for current user)
export const getFriends = async (userId: string) => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<
    {
      id: string;
      user_id: string;
      friend_user_id: string;
      status: string;
      direction: 'outgoing' | 'incoming';
    }
  >(
    `SELECT id, user_id, friend_user_id, status,
      CASE WHEN user_id = ? THEN 'outgoing' ELSE 'incoming' END as direction
     FROM friends
     WHERE deleted = 0 AND (user_id = ? OR friend_user_id = ?)`,
    [userId, userId, userId]
  );
  return rows;
};

export const upsertFriend = async (friend: {
  id: string;
  user_id: string;
  friend_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  pending_sync?: number;
}) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO friends (id, user_id, friend_user_id, status, pending_sync, modified_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [friend.id, friend.user_id, friend.friend_user_id, friend.status, friend.pending_sync ?? 1]
  );
};

export const updateFriendStatus = async (id: string, status: 'pending' | 'accepted' | 'rejected') => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE friends SET status = ?, pending_sync = 1, modified_at = datetime('now') WHERE id = ?`,
    [status, id]
  );
};

// Friend invites
export const upsertFriendInvite = async (invite: {
  id: string;
  inviter_id: string;
  invitee_email: string;
  token: string;
  status: 'pending' | 'accepted';
  pending_sync?: number;
}) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO friend_invites (id, inviter_id, invitee_email, token, status, pending_sync, modified_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [invite.id, invite.inviter_id, invite.invitee_email, invite.token, invite.status, invite.pending_sync ?? 1]
  );
};

export const getFriendInvites = async (inviterId: string) => {
  const db = await getDatabase();
  return db.getAllAsync(
    'SELECT * FROM friend_invites WHERE inviter_id = ? AND deleted = 0',
    [inviterId]
  );
};

export const getIncomingFriendInvites = async (inviteeEmail: string) => {
  const db = await getDatabase();
  return db.getAllAsync(
    'SELECT * FROM friend_invites WHERE invitee_email = ? AND status = \'pending\' AND deleted = 0',
    [inviteeEmail.toLowerCase()]
  );
};

// Groups
export const upsertGroup = async (group: {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  visibility: 'public' | 'private';
  pending_sync?: number;
  deleted?: number;
}) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO groups (id, owner_id, name, description, visibility, pending_sync, deleted, modified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [group.id, group.owner_id, group.name, group.description ?? null, group.visibility, group.pending_sync ?? 1, group.deleted ?? 0]
  );
};

export const getGroups = async (userId: string) => {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT g.*, gm.status as membership_status
     FROM groups g
     LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ? AND gm.deleted = 0
     WHERE g.deleted = 0 AND (g.visibility = 'public' OR gm.status = 'active')`,
    [userId]
  );
};

export const updateGroupSettings = async (groupId: string, updates: { description?: string | null; visibility?: 'public' | 'private' }) => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE groups
     SET description = COALESCE(?, description),
         visibility = COALESCE(?, visibility),
         pending_sync = 1,
         modified_at = datetime('now')
     WHERE id = ?`,
    [updates.description ?? null, updates.visibility ?? null, groupId]
  );
};

export const markGroupDeleted = async (groupId: string) => {
  const db = await getDatabase();
  await db.execAsync('BEGIN');
  try {
    await db.runAsync(
      `UPDATE groups SET deleted = 1, pending_sync = 1, modified_at = datetime('now') WHERE id = ?`,
      [groupId]
    );
    await db.runAsync(
      `UPDATE group_members SET deleted = 1, pending_sync = 1, modified_at = datetime('now') WHERE group_id = ?`,
      [groupId]
    );
    await db.runAsync(
      `UPDATE group_invites SET deleted = 1, pending_sync = 1, modified_at = datetime('now') WHERE group_id = ?`,
      [groupId]
    );
    await db.execAsync('COMMIT');
  } catch (err) {
    await db.execAsync('ROLLBACK');
    throw err;
  }
};

// Group members
export const upsertGroupMember = async (member: {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'rejected';
  pending_sync?: number;
}) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO group_members (id, group_id, user_id, role, status, pending_sync, modified_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [member.id, member.group_id, member.user_id, member.role, member.status, member.pending_sync ?? 1]
  );
};

// Group invites
export const upsertGroupInvite = async (invite: {
  id: string;
  group_id: string;
  inviter_id: string | null;
  invitee_user_id?: string | null;
  invitee_email?: string | null;
  token?: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  pending_sync?: number;
}) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO group_invites (id, group_id, inviter_id, invitee_user_id, invitee_email, token, status, pending_sync, modified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      invite.id,
      invite.group_id,
      invite.inviter_id ?? null,
      invite.invitee_user_id ?? null,
      invite.invitee_email ?? null,
      invite.token ?? null,
      invite.status,
      invite.pending_sync ?? 1,
    ]
  );
};

// Group members
export const getGroupMembers = async (groupId: string) => {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT * FROM group_members WHERE group_id = ? AND deleted = 0`,
    [groupId]
  );
};

export const updateGroupMemberStatus = async (id: string, status: 'active' | 'pending' | 'rejected') => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE group_members SET status = ?, pending_sync = 1, modified_at = datetime('now') WHERE id = ?`,
    [status, id]
  );
};

// Group invites for a user (by user_id or email)
export const getGroupInvitesForUser = async (userId: string, email?: string | null) => {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT * FROM group_invites
     WHERE deleted = 0
       AND status = 'pending'
       AND (invitee_user_id = ? OR (invitee_email IS NOT NULL AND invitee_email = ?))`,
    [userId, email?.toLowerCase() || '']
  );
};

// Profile lookup for names
export const getProfilesByIds = async (ids: string[]) => {
  if (!ids || ids.length === 0) return [];
  const db = await getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  return db.getAllAsync(
    `SELECT id, full_name, email FROM profiles WHERE id IN (${placeholders})`,
    ids
  );
};

// Feed posts
export const upsertFeedPost = async (post: {
  id: string;
  user_id: string;
  group_id?: string | null;
  type: 'goal' | 'pr' | 'summary';
  title: string;
  body?: string | null;
  metadata?: any;
  pending_sync?: number;
}) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO feed_posts (id, user_id, group_id, type, title, body, metadata, pending_sync, modified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [post.id, post.user_id, post.group_id ?? null, post.type, post.title, post.body ?? null, post.metadata ? JSON.stringify(post.metadata) : null, post.pending_sync ?? 1]
  );
};

export const getFeedPosts = async (userId: string) => {
  const db = await getDatabase();
  return db.getAllAsync(
    `
    SELECT DISTINCT fp.*
    FROM feed_posts fp
    LEFT JOIN friends f
      ON (
        (f.user_id = ? AND f.friend_user_id = fp.user_id)
        OR (f.friend_user_id = ? AND f.user_id = fp.user_id)
      )
      AND f.deleted = 0
    LEFT JOIN group_members gm
      ON fp.group_id IS NOT NULL
      AND gm.group_id = fp.group_id
      AND gm.user_id = ?
      AND gm.status = 'active'
      AND gm.deleted = 0
    LEFT JOIN groups g
      ON g.id = fp.group_id
    WHERE fp.deleted = 0
      AND (
        fp.user_id = ?
        OR (f.status = 'accepted')
        OR (fp.group_id IS NOT NULL AND gm.id IS NOT NULL)
        OR (fp.group_id IS NOT NULL AND g.owner_id = ?)
      )
    ORDER BY datetime(fp.created_at) DESC
    `,
    [userId, userId, userId, userId, userId]
  );
};

// Feed reactions
export const upsertFeedReaction = async (reaction: {
  id: string;
  post_id: string;
  user_id: string;
  reaction: 'arm' | 'fire' | 'like';
  pending_sync?: number;
}) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO feed_reactions (id, post_id, user_id, reaction, pending_sync, modified_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [reaction.id, reaction.post_id, reaction.user_id, reaction.reaction, reaction.pending_sync ?? 1]
  );
};

export const getReactionsForPost = async (postId: string) => {
  const db = await getDatabase();
  return db.getAllAsync(
    'SELECT * FROM feed_reactions WHERE post_id = ? AND deleted = 0',
    [postId]
  );
};
