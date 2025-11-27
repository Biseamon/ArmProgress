import { supabase } from '@/lib/supabase';
import { getPending, markSynced } from './activitySyncHelpers';

// Friends
export const getPendingFriends = () => getPending('friends');
export const markFriendSynced = (id: string) => markSynced('friends', id);
export const upsertFriend = async (row: any) => {
  await supabase.from('friends').upsert({
    id: row.id,
    user_id: row.user_id,
    friend_user_id: row.friend_user_id,
    status: row.status,
    created_at: row.created_at,
  });
};

// Friend invites
export const getPendingFriendInvites = () => getPending('friend_invites');
export const markFriendInviteSynced = (id: string) => markSynced('friend_invites', id);
export const upsertFriendInvite = async (row: any) => {
  await supabase.from('friend_invites').upsert({
    id: row.id,
    inviter_id: row.inviter_id,
    invitee_email: row.invitee_email,
    token: row.token,
    status: row.status,
    created_at: row.created_at,
  });
};

// Groups
export const getPendingGroups = () => getPending('groups');
export const markGroupSynced = (id: string) => markSynced('groups', id);
export const upsertGroup = async (row: any) => {
  await supabase.from('groups').upsert({
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    created_at: row.created_at,
  });
};

// Group members
export const getPendingGroupMembers = () => getPending('group_members');
export const markGroupMemberSynced = (id: string) => markSynced('group_members', id);
export const upsertGroupMember = async (row: any) => {
  await supabase.from('group_members').upsert({
    id: row.id,
    group_id: row.group_id,
    user_id: row.user_id,
    role: row.role,
    status: row.status,
    created_at: row.created_at,
  });
};

// Group invites
export const getPendingGroupInvites = () => getPending('group_invites');
export const markGroupInviteSynced = (id: string) => markSynced('group_invites', id);
export const upsertGroupInvite = async (row: any) => {
  await supabase.from('group_invites').upsert({
    id: row.id,
    group_id: row.group_id,
    inviter_id: row.inviter_id,
    invitee_user_id: row.invitee_user_id,
    invitee_email: row.invitee_email,
    token: row.token,
    status: row.status,
    created_at: row.created_at,
  });
};

// Feed posts
export const getPendingFeedPosts = () => getPending('feed_posts');
export const markFeedPostSynced = (id: string) => markSynced('feed_posts', id);
export const upsertFeedPost = async (row: any) => {
  await supabase.from('feed_posts').upsert({
    id: row.id,
    user_id: row.user_id,
    group_id: row.group_id,
    type: row.type,
    title: row.title,
    body: row.body,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    created_at: row.created_at,
  });
};

// Feed reactions
export const getPendingFeedReactions = () => getPending('feed_reactions');
export const markFeedReactionSynced = (id: string) => markSynced('feed_reactions', id);
export const upsertFeedReaction = async (row: any) => {
  await supabase.from('feed_reactions').upsert({
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    reaction: row.reaction,
    created_at: row.created_at,
  });
};
