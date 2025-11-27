/**
 * Complete React Query + SQLite Integration
 * 
 * Hooks for all app data:
 * - Workouts & Exercises
 * - Cycles
 * - Goals
 * - Strength Tests (PRs)
 * - Body Measurements
 * - Scheduled Trainings
 * - Profile
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InteractionManager } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Workout, Cycle, Goal, StrengthTest, BodyMeasurement, ScheduledTraining, Profile } from './supabase';
import { triggerSync } from './sync/syncEngine';
import { getDatabase } from './db/database';

// Lightweight UUID generator (non-crypto) for Supabase UUID columns
const generateUuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// Default stale time (5 minutes) to prevent excessive refetches
const DEFAULT_STALE_TIME = 5 * 60 * 1000;

// Workouts
import {
  getWorkouts,
  getRecentWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getWorkoutStats,
} from './db/queries/workouts';

// Exercises
import {
  getExercises,
  createExercise,
  createExercises,
  updateExercise,
  deleteExercise,
  deleteExercisesByWorkout,
} from './db/queries/exercises';

// Cycles
import {
  getCycles,
  getActiveCycle,
  getCycleById,
  createCycle,
  updateCycle,
  deleteCycle,
  setActiveCycle,
} from './db/queries/cycles';

// Goals
import {
  getGoals,
  getActiveGoals,
  getCompletedGoals,
  getGoalById,
  createGoal,
  updateGoal,
  incrementGoal,
  decrementGoal,
  deleteGoal,
  getGoalStats,
} from './db/queries/goals';

// Strength Tests
import {
  getStrengthTests,
  getRecentStrengthTests,
  getLatestPRsByType,
  createStrengthTest,
  updateStrengthTest,
  deleteStrengthTest,
} from './db/queries/strengthTests';

// Body Measurements
import {
  getMeasurements,
  getRecentMeasurements,
  getLatestMeasurement,
  createMeasurement,
  updateMeasurement,
  deleteMeasurement,
} from './db/queries/measurements';

// Scheduled Trainings
import {
  getScheduledTrainings,
  getUpcomingTrainings,
  getTrainingsByDate,
  createScheduledTraining,
  updateScheduledTraining,
  markTrainingCompleted,
  deleteScheduledTraining,
} from './db/queries/scheduledTrainings';

// Profile
import {
  getProfile,
  updateProfile,
  updateWeightUnit,
} from './db/queries/profile';

// Activity (friends, groups, feed)
import {
  getFriends,
  getFriendInvites,
  getGroups as getGroupsLocal,
  getFeedPosts,
  upsertFriend,
  upsertFriendInvite,
  upsertGroup as upsertGroupLocal,
  updateGroupSettings,
  markGroupDeleted,
  markFeedPostDeleted,
  markFriendDeleted,
  upsertFeedPost,
  updateFriendStatus,
  upsertGroupMember,
  upsertGroupInvite,
  upsertFeedReaction,
  getUserReactionForPost,
  deleteFeedReaction,
  getAllReactionsForFeed,
  updateFeedPost,
  getGroupMembers,
  updateGroupMemberStatus,
  getGroupInvitesForUser,
  getProfilesByIds,
  getIncomingFriendInvites,
} from './db/queries/activity';

/**
 * QUERY KEYS
 */
export const queryKeys = {
  // Workouts
  workouts: (userId: string) => ['workouts', userId] as const,
  workout: (id: string) => ['workout', id] as const,
  recentWorkouts: (userId: string, limit?: number) => ['workouts', 'recent', userId, limit] as const,
  workoutStats: (userId: string) => ['workouts', 'stats', userId] as const,
  
  // Exercises
  exercises: (workoutId: string) => ['exercises', workoutId] as const,
  
  // Cycles
  cycles: (userId: string) => ['cycles', userId] as const,
  cycle: (id: string) => ['cycle', id] as const,
  activeCycle: (userId: string) => ['cycles', 'active', userId] as const,
  
  // Goals
  goals: (userId: string) => ['goals', userId] as const,
  goal: (id: string) => ['goal', id] as const,
  activeGoals: (userId: string) => ['goals', 'active', userId] as const,
  completedGoals: (userId: string) => ['goals', 'completed', userId] as const,
  goalStats: (userId: string) => ['goals', 'stats', userId] as const,
  
  // Strength Tests
  strengthTests: (userId: string) => ['strengthTests', userId] as const,
  recentStrengthTests: (userId: string, limit?: number) => ['strengthTests', 'recent', userId, limit] as const,
  latestPRs: (userId: string) => ['strengthTests', 'latest', userId] as const,
  
  // Body Measurements
  measurements: (userId: string) => ['measurements', userId] as const,
  recentMeasurements: (userId: string, limit?: number) => ['measurements', 'recent', userId, limit] as const,
  latestMeasurement: (userId: string) => ['measurements', 'latest', userId] as const,
  
  // Scheduled Trainings
  scheduledTrainings: (userId: string) => ['scheduledTrainings', userId] as const,
  upcomingTrainings: (userId: string) => ['scheduledTrainings', 'upcoming', userId] as const,
  trainingsByDate: (userId: string, date: string) => ['scheduledTrainings', 'date', userId, date] as const,
  
  // Profile
  profile: (userId: string) => ['profile', userId] as const,

  // Activity
  friends: (userId: string) => ['friends', userId] as const,
  friendInvites: (userId: string) => ['friendInvites', userId] as const,
  groups: (userId: string) => ['groups', userId] as const,
  feed: (userId: string) => ['feed', userId] as const,
  groupMembers: (groupId: string) => ['groupMembers', groupId] as const,
  groupInvites: (userId: string) => ['groupInvites', userId] as const,
  profilesByIds: (ids: string[]) => ['profilesByIds', ...ids] as const,
};

// ==========================================
// WORKOUTS
// ==========================================

export const useWorkouts = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.workouts(profile?.id || ''),
    queryFn: async () => {
      // Defer until after animations/interactions complete
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      return getWorkouts(profile!.id);
    },
    enabled: !!profile?.id,
    staleTime: DEFAULT_STALE_TIME, // Reduced refetch frequency
  });
};

export const useRecentWorkouts = (limit: number = 10) => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.recentWorkouts(profile?.id || '', limit),
    queryFn: async () => {
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      return getRecentWorkouts(profile!.id, limit);
    },
    enabled: !!profile?.id,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const useWorkout = (id: string) => {
  return useQuery({
    queryKey: queryKeys.workout(id),
    queryFn: () => getWorkoutById(id),
    enabled: !!id,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const useWorkoutStats = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.workoutStats(profile?.id || ''),
    queryFn: async () => {
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      return getWorkoutStats(profile!.id);
    },
    enabled: !!profile?.id,
    staleTime: DEFAULT_STALE_TIME,
  });
};

// ==========================================
// ACTIVITY (friends, invites, groups, feed)
// ==========================================

export const useFriends = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.friends(profile?.id || ''),
    queryFn: async () => {
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      return getFriends(profile!.id);
    },
    enabled: !!profile?.id,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const useFriendInvites = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.friendInvites(profile?.id || ''),
    queryFn: async () => {
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      return getFriendInvites(profile!.id);
    },
    enabled: !!profile?.id,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const useIncomingFriendInvites = () => {
  const { profile } = useAuth();
  const email = profile?.email?.toLowerCase() || '';
  return useQuery({
    queryKey: ['friendInvites', 'incoming', email],
    queryFn: async () => {
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      return getIncomingFriendInvites(email);
    },
    enabled: !!email,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const useGroups = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.groups(profile?.id || ''),
    queryFn: async () => {
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      return getGroupsLocal(profile!.id);
    },
    enabled: !!profile?.id,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const useFeed = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.feed(profile?.id || ''),
    queryFn: async () => {
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      return getFeedPosts(profile!.id);
    },
    enabled: !!profile?.id,
    staleTime: DEFAULT_STALE_TIME / 2,
  });
};

export const useGroupMembers = (groupId?: string | null) => {
  const enabled = !!groupId;
  return useQuery({
    queryKey: queryKeys.groupMembers(groupId || ''),
    queryFn: async () => {
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      return getGroupMembers(groupId!);
    },
    enabled,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const useGroupInvites = (userId?: string | null, email?: string | null) => {
  const enabled = !!userId;
  return useQuery({
    queryKey: queryKeys.groupInvites(userId || ''),
    queryFn: async () => {
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      return getGroupInvitesForUser(userId!, email || null);
    },
    enabled,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const useProfilesByIds = (ids: string[]) => {
  return useQuery({
    queryKey: queryKeys.profilesByIds(ids),
    queryFn: async () => getProfilesByIds(ids),
    enabled: ids.length > 0,
    staleTime: DEFAULT_STALE_TIME,
  });
};

// Mutations (local upsert + trigger sync)
export const useCreateFriendRequest = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendUserId, status }: { friendUserId: string; status?: 'pending' | 'accepted' | 'rejected' }) => {
      if (!profile) throw new Error('No profile');
      const id = generateUuid();
      await upsertFriend({
        id,
        user_id: profile.id,
        friend_user_id: friendUserId,
        status: status || 'pending',
        pending_sync: 1,
      });
      return id;
    },
    onSuccess: () => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.friends(profile.id) });
        triggerSync(profile.id);
      }
    },
  });
};

export const useCreateFriendInvite = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, token }: { email: string; token?: string }) => {
      if (!profile) throw new Error('No profile');
      const id = generateUuid();
      await upsertFriendInvite({
        id,
        inviter_id: profile.id,
        invitee_email: email.trim().toLowerCase(),
        token: token || `tok-${Date.now()}`,
        status: 'pending',
        pending_sync: 1,
      });
      return id;
    },
    onSuccess: () => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.friendInvites(profile.id) });
        triggerSync(profile.id);
      }
    },
  });
};

export const useRespondToFriendInvite = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invite, accept }: { invite: any; accept: boolean }) => {
      if (!profile) throw new Error('No profile');
      if (accept) {
        const friendIdA = generateUuid();
        const friendIdB = generateUuid();
        await upsertFriend({
          id: friendIdA,
          user_id: invite.inviter_id,
          friend_user_id: profile.id,
          status: 'accepted',
          pending_sync: 1,
        });
        await upsertFriend({
          id: friendIdB,
          user_id: profile.id,
          friend_user_id: invite.inviter_id,
          status: 'accepted',
          pending_sync: 1,
        });
        await upsertFriendInvite({
          id: invite.id,
          inviter_id: invite.inviter_id,
          invitee_email: invite.invitee_email,
          token: invite.token,
          status: 'accepted',
          pending_sync: 1,
        });
      } else {
        // Decline: remove the invite locally so it doesn't keep showing
        await upsertFriendInvite({
          id: invite.id,
          inviter_id: invite.inviter_id,
          invitee_email: invite.invitee_email,
          token: invite.token,
          status: 'pending',
          pending_sync: 1,
        });
        const db = await getDatabase();
        await db.runAsync('UPDATE friend_invites SET deleted = 1, modified_at = datetime(\'now\'), pending_sync = 1 WHERE id = ?', [invite.id]);
      }
    },
    onSuccess: () => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.friends(profile.id) });
        queryClient.invalidateQueries({ queryKey: ['friendInvites', 'incoming'] });
        queryClient.invalidateQueries({ queryKey: queryKeys.friendInvites(profile.id) });
        triggerSync(profile.id);
      }
    },
  });
};

export const useRespondToFriendRequest = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, requesterId, accept }: { id: string; requesterId: string; accept: boolean }) => {
      if (!profile) throw new Error('No profile');
      // Update incoming row
      await updateFriendStatus(id, accept ? 'accepted' : 'rejected');
      // If accepted, create reciprocal accepted row
      if (accept) {
        const reciprocalId = generateUuid();
        const originalId = id;
        await upsertFriend({
          id: reciprocalId,
          user_id: profile.id,
          friend_user_id: requesterId,
          status: 'accepted',
          pending_sync: 1,
        });
        // Also ensure requester's row is accepted (id may be time-based; use upsert with deterministic id)
        await upsertFriend({
          id: originalId,
          user_id: requesterId,
          friend_user_id: profile.id,
          status: 'accepted',
          pending_sync: 1,
        });
      }
    },
    onSuccess: () => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.friends(profile.id) });
        triggerSync(profile.id);
      }
    },
  });
};

export const useCreateGroup = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description, visibility }: { name: string; description?: string; visibility: 'public' | 'private' }) => {
      if (!profile) throw new Error('No profile');
      const id = generateUuid();
      await upsertGroupLocal({
        id,
        owner_id: profile.id,
        name,
        description: description || null,
        visibility,
        pending_sync: 1,
      });
      // Add owner membership row
      const memberId = generateUuid();
      await upsertGroupMember({
        id: memberId,
        group_id: id,
        user_id: profile.id,
        role: 'owner',
        status: 'active',
        pending_sync: 1,
      });
      return id;
    },
    onSuccess: () => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups(profile.id) });
        triggerSync(profile.id);
      }
    },
  });
};

export const useUpdateGroup = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, description, visibility, avatarUrl }: { groupId: string; description?: string | null; visibility?: 'public' | 'private'; avatarUrl?: string | null }) => {
      if (!profile) throw new Error('No profile');
      await updateGroupSettings(groupId, { description, visibility, avatarUrl });
    },
    onSuccess: (_, variables) => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups(profile.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(variables.groupId) });
        triggerSync(profile.id);
      }
    },
  });
};

export const useDeleteGroup = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId }: { groupId: string }) => {
      if (!profile) throw new Error('No profile');
      await markGroupDeleted(groupId);
    },
    onSuccess: (_, variables) => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups(profile.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(variables.groupId) });
        triggerSync(profile.id);
      }
    },
  });
};

export const useDeleteFeedPost = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!profile) throw new Error('No profile');
      await markFeedPostDeleted(postId);
    },
    onSuccess: () => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed(profile.id) });
        triggerSync(profile.id);
      }
    },
  });
};

export const useUpdateFeedPost = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, title, body }: { postId: string; title?: string; body?: string }) => {
      if (!profile) throw new Error('No profile');
      await updateFeedPost(postId, { title, body });
    },
    onSuccess: () => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed(profile.id) });
        triggerSync(profile.id);
      }
    },
  });
};

export const useUnfriend = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendId }: { friendId: string }) => {
      if (!profile) throw new Error('No profile');
      await markFriendDeleted(friendId);
    },
    onSuccess: () => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.friends(profile.id) });
        triggerSync(profile.id);
      }
    },
  });
};

export const useRequestJoinGroup = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, status }: { groupId: string; status?: 'pending' | 'active' }) => {
      if (!profile) throw new Error('No profile');
      const id = generateUuid();
      await upsertGroupMember({
        id,
        group_id: groupId,
        user_id: profile.id,
        role: 'member',
        status: status || 'pending',
        pending_sync: 1,
      });
      return id;
    },
    onSuccess: () => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups(profile.id) });
        triggerSync(profile.id);
      }
    },
  });
};

export const useCreateFeedPost = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, title, body, groupId, metadata }: { type: 'goal' | 'pr' | 'summary'; title: string; body?: string; groupId?: string | null; metadata?: any }) => {
      if (!profile) throw new Error('No profile');
      const id = generateUuid();
      await upsertFeedPost({
        id,
        user_id: profile.id,
        group_id: groupId ?? null,
        type,
        title,
        body: body || null,
        metadata: metadata || null,
        pending_sync: 1,
      });
      return id;
    },
    onSuccess: () => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed(profile.id) });
        triggerSync(profile.id);
      }
    },
  });
};

export const useUpdateGroupMemberStatus = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'pending' | 'rejected' }) => {
      await updateGroupMemberStatus(id, status);
    },
    onSuccess: () => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups(profile.id) });
        // Refresh members for any group
        queryClient.invalidateQueries({ queryKey: ['groupMembers'] as any });
        triggerSync(profile.id);
      }
    },
  });
};

export const useRespondGroupInvite = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      invite,
      accept,
    }: {
      invite: {
        id: string;
        group_id: string;
        inviter_id?: string | null;
        invitee_user_id?: string | null;
        invitee_email?: string | null;
        token?: string | null;
      };
      accept: boolean;
    }) => {
      if (!profile) throw new Error('No profile');
      // Update invite status locally
      await upsertGroupInvite({
        id: invite.id,
        group_id: invite.group_id,
        inviter_id: invite.inviter_id || null,
        invitee_user_id: profile.id,
        invitee_email: invite.invitee_email || null,
        token: invite.token || null,
        status: accept ? 'accepted' : 'rejected',
        pending_sync: 1,
      });
      // If accepted, ensure membership row is active
      if (accept) {
        const memberId = generateUuid();
        await upsertGroupMember({
          id: memberId,
          group_id: invite.group_id,
          user_id: profile.id,
          role: 'member',
          status: 'active',
          pending_sync: 1,
        });
      }
    },
    onSuccess: () => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groupInvites(profile.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.groups(profile.id) });
        triggerSync(profile.id);
      }
    },
  });
};

export const useCreateGroupInvite = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, email, inviteeUserId }: { groupId: string; email?: string; inviteeUserId?: string }) => {
      if (!profile) throw new Error('No profile');
      const id = generateUuid();
      await upsertGroupInvite({
        id,
        group_id: groupId,
        inviter_id: profile.id,
        invitee_user_id: inviteeUserId || null,
        invitee_email: email?.trim().toLowerCase() || null,
        token: `gtok-${Date.now()}`,
        status: 'pending',
        pending_sync: 1,
      });
      return id;
    },
    onSuccess: (_, variables) => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groupInvites(profile.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.groups(profile.id) });
        triggerSync(profile.id);
      }
    },
  });
};

export const useReactToFeed = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, reaction }: { postId: string; reaction: 'arm' | 'fire' | 'like' }) => {
      if (!profile) throw new Error('No profile');

      // Check if user already reacted with this reaction type
      const existingReaction = await getUserReactionForPost(postId, profile.id, reaction);

      if (existingReaction) {
        // Remove the reaction (toggle off)
        await deleteFeedReaction(existingReaction.id);
        return { action: 'removed', id: existingReaction.id };
      } else {
        // Add the reaction (toggle on)
        const id = generateUuid();
        await upsertFeedReaction({
          id,
          post_id: postId,
          user_id: profile.id,
          reaction,
          pending_sync: 1,
        });
        return { action: 'added', id };
      }
    },
    onSuccess: (_, variables) => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed(profile.id) });
        triggerSync(profile.id);
      }
    },
  });
};

export const useCreateWorkout = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (workout: Omit<Workout, 'id' | 'updated_at' | 'created_at'> & { created_at?: string }) => {
      const id = await createWorkout({
        ...workout,
        created_at: workout.created_at || new Date().toISOString(),
      });
      return id;
    },
    onSuccess: () => {
      // Invalidate all queries that might show workouts
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledTrainings'] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useUpdateWorkout = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Workout> }) => {
      await updateWorkout(id, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workout(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useDeleteWorkout = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteWorkout(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// EXERCISES
// ==========================================

export const useExercises = (workoutId: string) => {
  return useQuery({
    queryKey: queryKeys.exercises(workoutId),
    queryFn: () => getExercises(workoutId),
    enabled: !!workoutId,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useCreateExercises = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (exercises: Omit<any, 'id' | 'created_at'>[]) => {
      const ids = await createExercises(exercises);
      return ids;
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: queryKeys.exercises(variables[0].workout_id) });
      }
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// CYCLES
// ==========================================

export const useCycles = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.cycles(profile?.id || ''),
    queryFn: async () => {
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      return getCycles(profile!.id);
    },
    enabled: !!profile?.id,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const useActiveCycle = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.activeCycle(profile?.id || ''),
    queryFn: () => getActiveCycle(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useCycle = (id: string) => {
  return useQuery({
    queryKey: queryKeys.cycle(id),
    queryFn: () => getCycleById(id),
    enabled: !!id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useCreateCycle = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (cycle: Omit<Cycle, 'id' | 'created_at' | 'updated_at'>) => {
      const id = await createCycle(cycle);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useUpdateCycle = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Cycle> }) => {
      await updateCycle(id, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycle(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useDeleteCycle = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteCycle(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useSetActiveCycle = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (cycleId: string) => {
      await setActiveCycle(profile!.id, cycleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// GOALS
// ==========================================

export const useGoals = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.goals(profile?.id || ''),
    queryFn: async () => {
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      return getGoals(profile!.id);
    },
    enabled: !!profile?.id,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const useActiveGoals = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.activeGoals(profile?.id || ''),
    queryFn: () => getActiveGoals(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useGoalStats = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.goalStats(profile?.id || ''),
    queryFn: () => getGoalStats(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (goal: Omit<Goal, 'id' | 'created_at'>) => {
      const id = await createGoal(goal);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['progress', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Goal> }) => {
      await updateGoal(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['progress', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useIncrementGoal = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await incrementGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['progress', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useDecrementGoal = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await decrementGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['progress', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['progress', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// STRENGTH TESTS (PRs)
// ==========================================

export const useStrengthTests = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.strengthTests(profile?.id || ''),
    queryFn: async () => {
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      return getStrengthTests(profile!.id);
    },
    enabled: !!profile?.id,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const useRecentStrengthTests = (limit: number = 10) => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.recentStrengthTests(profile?.id || '', limit),
    queryFn: () => getRecentStrengthTests(profile!.id, limit),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useLatestPRs = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.latestPRs(profile?.id || ''),
    queryFn: () => getLatestPRsByType(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useCreateStrengthTest = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (test: Omit<StrengthTest, 'id' | 'created_at'>) => {
      const id = await createStrengthTest(test);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strengthTests'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useUpdateStrengthTest = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StrengthTest> }) => {
      await updateStrengthTest(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strengthTests'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useDeleteStrengthTest = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteStrengthTest(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strengthTests'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// BODY MEASUREMENTS
// ==========================================

export const useMeasurements = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.measurements(profile?.id || ''),
    queryFn: async () => {
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      return getMeasurements(profile!.id);
    },
    enabled: !!profile?.id,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const useRecentMeasurements = (limit: number = 10) => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.recentMeasurements(profile?.id || '', limit),
    queryFn: () => getRecentMeasurements(profile!.id, limit),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useLatestMeasurement = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.latestMeasurement(profile?.id || ''),
    queryFn: () => getLatestMeasurement(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useCreateMeasurement = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (measurement: Omit<BodyMeasurement, 'id' | 'created_at'>) => {
      const id = await createMeasurement(measurement);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useUpdateMeasurement = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BodyMeasurement> }) => {
      await updateMeasurement(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useDeleteMeasurement = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteMeasurement(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// SCHEDULED TRAININGS
// ==========================================

export const useScheduledTrainings = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.scheduledTrainings(profile?.id || ''),
    queryFn: async () => {
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      return getScheduledTrainings(profile!.id);
    },
    enabled: !!profile?.id,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const useUpcomingTrainings = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.upcomingTrainings(profile?.id || ''),
    queryFn: () => getUpcomingTrainings(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useTrainingsByDate = (date: string) => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.trainingsByDate(profile?.id || '', date),
    queryFn: () => getTrainingsByDate(profile!.id, date),
    enabled: !!profile?.id && !!date,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useCreateScheduledTraining = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (training: Omit<ScheduledTraining, 'id' | 'created_at'>) => {
      const id = await createScheduledTraining(training);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledTrainings'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useUpdateScheduledTraining = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ScheduledTraining> }) => {
      await updateScheduledTraining(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledTrainings'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useMarkTrainingCompleted = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await markTrainingCompleted(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledTrainings'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useDeleteScheduledTraining = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteScheduledTraining(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledTrainings'] });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// PROFILE
// ==========================================

export const useProfile = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.profile(profile?.id || ''),
    queryFn: () => getProfile(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // Refetch immediately when invalidated
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      await updateProfile(profile!.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(profile!.id) });
      queryClient.invalidateQueries({ queryKey: ['home', profile?.id] }); // Update home screen when profile changes
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

export const useUpdateWeightUnit = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (weightUnit: 'lbs' | 'kg') => {
      await updateWeightUnit(profile!.id, weightUnit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(profile!.id) });
      if (profile?.id) triggerSync(profile.id);
    },
  });
};

// ==========================================
// SYNC TRIGGER
// ==========================================

export const useSyncTrigger = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('No user');
      await triggerSync(profile.id);
    },
    onSuccess: () => {
      // Refetch all data after sync
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: ['workouts', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['cycles', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['goals', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['strengthTests', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['measurements', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['scheduledTrainings', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['profile', profile.id] });
      }
    },
  });
};
