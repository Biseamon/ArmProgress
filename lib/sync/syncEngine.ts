/**
 * Sync Engine
 * 
 * Two-way sync between SQLite and Supabase:
 * 1. PUSH: Local changes (pending_sync=1) → Supabase
 * 2. PULL: Supabase changes (newer than last sync) → SQLite
 * 
 * Conflict Resolution: Newer modified_at wins
 */

import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import { getDatabase, getSyncMetadata, updateSyncMetadata } from '@/lib/db/database';
import { getPendingWorkouts, markWorkoutSynced, upsertWorkout } from '@/lib/db/queries/workouts';
import { getPendingExercises, markExerciseSynced, upsertExercise } from '@/lib/db/queries/exercises';
import { getPendingCycles, markCycleSynced, upsertCycle } from '@/lib/db/queries/cycles';
import { getPendingGoals, markGoalSynced, upsertGoal } from '@/lib/db/queries/goals';
import { getPendingMeasurements, markMeasurementSynced, upsertMeasurement } from '@/lib/db/queries/measurements';
import { getPendingStrengthTests, markStrengthTestSynced, upsertStrengthTest } from '@/lib/db/queries/strengthTests';
import { getPendingScheduledTrainings, markScheduledTrainingSynced, upsertScheduledTraining } from '@/lib/db/queries/scheduledTrainings';

// Activity
import {
  getPendingFriends,
  markFriendSynced,
  upsertFriend,
  getPendingFriendInvites,
  markFriendInviteSynced,
  upsertFriendInvite,
  getPendingGroups,
  markGroupSynced,
  upsertGroup,
  getPendingGroupMembers,
  markGroupMemberSynced,
  upsertGroupMember,
  getPendingGroupInvites,
  markGroupInviteSynced,
  upsertGroupInvite,
  getPendingFeedPosts,
  markFeedPostSynced,
  upsertFeedPost,
  getPendingFeedReactions,
  markFeedReactionSynced,
  upsertFeedReaction,
} from '@/lib/db/queries/activitySync';

let isSyncing = false;
let syncQueue: string[] = [];

/**
 * Main sync function
 */
export const triggerSync = async (userId: string) => {
  // Check network connectivity
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    console.log('[Sync] No network connection');
    return;
  }

  // Prevent concurrent syncs
  if (isSyncing) {
    console.log('[Sync] Already syncing, adding to queue');
    if (!syncQueue.includes(userId)) {
      syncQueue.push(userId);
    }
    return;
  }
  
  isSyncing = true;
  console.log('[Sync] Starting sync for user:', userId);
  
  try {
    // Step 1: PUSH local changes to Supabase
    await pushLocalChanges(userId);
    
    // Step 2: PULL remote changes from Supabase
    await pullRemoteChanges(userId);
    
    // Update last sync timestamp
    await updateSyncMetadata(userId);
    
    console.log('[Sync] Sync completed successfully');
  } catch (error: any) {
    console.error('[Sync] Sync failed:', error?.message || error);
    throw error;
  } finally {
    isSyncing = false;
    
    // Process queued syncs
    if (syncQueue.length > 0) {
      const nextUserId = syncQueue.shift();
      if (nextUserId) {
        setTimeout(() => triggerSync(nextUserId), 1000);
      }
    }
  }
};

/**
 * PUSH: Upload local changes to Supabase
 * 
 * CRITICAL: Push in dependency order to avoid foreign key errors:
 * 1. Cycles (no dependencies)
 * 2. Workouts (depends on cycles)
 * 3. Exercises (depends on workouts)
 * 4. Goals, Measurements, Tests, Trainings (no dependencies)
 */
const pushLocalChanges = async (userId: string) => {
  console.log('[Sync] Pushing local changes...');
  
  let hasChanges = false;
  const db = await getDatabase();
  
  // STEP 1: Push Cycles FIRST (workouts depend on cycles)
  const pendingCycles = await getPendingCycles();
  if (pendingCycles.length > 0) {
    hasChanges = true;
    console.log(`[Sync] Pushing ${pendingCycles.length} cycles...`);
    for (const cycle of pendingCycles) {
      try {
        if ((cycle as any).deleted) {
          const { error } = await supabase.from('cycles').delete().eq('id', cycle.id);
          if (error) throw error;
          console.log(`[Sync] Deleted cycle ${cycle.id} from Supabase`);
        } else {
          const { error } = await supabase.from('cycles').upsert({
            id: cycle.id,
            user_id: cycle.user_id,
            name: cycle.name,
            description: cycle.description,
            cycle_type: cycle.cycle_type,
            start_date: cycle.start_date,
            end_date: cycle.end_date,
            is_active: cycle.is_active,
            created_at: (cycle as any).created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          if (error) throw error;
          console.log(`[Sync] Pushed cycle ${cycle.id} to Supabase`);
        }
        await markCycleSynced(cycle.id);
      } catch (error) {
        console.error(`[Sync] Failed to push cycle ${cycle.id}:`, error);
      }
    }
  }
  
  // STEP 2: Push Workouts (depends on cycles being pushed first)
  const pendingWorkouts = await getPendingWorkouts();
  if (pendingWorkouts.length > 0) {
    hasChanges = true;
    console.log(`[Sync] Pushing ${pendingWorkouts.length} workouts...`);
    
    for (const workout of pendingWorkouts) {
      try {
        if ((workout as any).deleted) {
          // Delete from Supabase
          const { error } = await supabase
            .from('workouts')
            .delete()
            .eq('id', workout.id);
          
          if (error) throw error;
          
          console.log(`[Sync] Deleted workout ${workout.id} from Supabase`);
        } else {
          // Upsert to Supabase
          const { error } = await supabase
            .from('workouts')
            .upsert({
              id: workout.id,
              user_id: workout.user_id,
              cycle_id: workout.cycle_id,
              workout_type: workout.workout_type,
              duration_minutes: workout.duration_minutes,
              intensity: workout.intensity,
              notes: workout.notes,
              weight_unit: 'lbs',
              created_at: (workout as any).created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          
          if (error) throw error;
          
          console.log(`[Sync] Pushed workout ${workout.id} to Supabase`);
        }
        
        // Mark as synced in SQLite
        await markWorkoutSynced(workout.id);
      } catch (error) {
        console.error(`[Sync] Failed to push workout ${workout.id}:`, error);
        // Continue with other workouts instead of failing entire sync
      }
    }
  }

  // STEP X: Push social data (friends, invites, groups, feed)
  const pendingFriends: any[] = await getPendingFriends();
  for (const row of pendingFriends) {
    hasChanges = true;
    try {
      const { error } = await supabase.from('friends').upsert({
        id: row.id,
        user_id: row.user_id,
        friend_user_id: row.friend_user_id,
        status: row.status,
        created_at: row.created_at,
      });
      if (error) throw error;
      await markFriendSynced(row.id);
    } catch (error) {
      console.error('[Sync] Failed to push friend', row.id, error);
    }
  }

  const pendingFriendInvites: any[] = await getPendingFriendInvites();
  for (const row of pendingFriendInvites) {
    hasChanges = true;
    try {
      const { error } = await supabase.from('friend_invites').upsert({
        id: row.id,
        inviter_id: row.inviter_id,
        invitee_email: row.invitee_email,
        token: row.token,
        status: row.status,
        created_at: row.created_at,
      });
      if (error) throw error;
      await markFriendInviteSynced(row.id);
    } catch (error) {
      console.error('[Sync] Failed to push friend invite', row.id, error);
    }
  }

  const pendingGroups: any[] = await getPendingGroups();
  for (const row of pendingGroups) {
    hasChanges = true;
    try {
      if ((row as any).deleted) {
        const { error } = await supabase.from('groups').delete().eq('id', row.id);
        if (error) throw error;
        // Clean local references
        await db.runAsync('DELETE FROM group_members WHERE group_id = ?', [row.id]);
        await db.runAsync('DELETE FROM group_invites WHERE group_id = ?', [row.id]);
        await db.runAsync('DELETE FROM groups WHERE id = ?', [row.id]);
      } else {
        const { error } = await supabase.from('groups').upsert({
          id: row.id,
          owner_id: row.owner_id,
          name: row.name,
          description: row.description,
          visibility: row.visibility,
          created_at: row.created_at,
        });
        if (error) throw error;
        await markGroupSynced(row.id);
      }
    } catch (error) {
      console.error('[Sync] Failed to push group', row.id, error);
    }
  }

  const pendingGroupMembers: any[] = await getPendingGroupMembers();
  for (const row of pendingGroupMembers) {
    hasChanges = true;
    try {
      const { error } = await supabase.from('group_members').upsert({
        id: row.id,
        group_id: row.group_id,
        user_id: row.user_id,
        role: row.role,
        status: row.status,
        created_at: row.created_at,
      });
      if (error) throw error;
      await markGroupMemberSynced(row.id);
    } catch (error) {
      console.error('[Sync] Failed to push group member', row.id, error);
    }
  }

  const pendingGroupInvites: any[] = await getPendingGroupInvites();
  for (const row of pendingGroupInvites) {
    hasChanges = true;
    try {
      const { error } = await supabase.from('group_invites').upsert({
        id: row.id,
        group_id: row.group_id,
        inviter_id: row.inviter_id,
        invitee_user_id: row.invitee_user_id,
        invitee_email: row.invitee_email,
        token: row.token,
        status: row.status,
        created_at: row.created_at,
      });
      if (error) throw error;
      await markGroupInviteSynced(row.id);
    } catch (error) {
      console.error('[Sync] Failed to push group invite', row.id, error);
    }
  }

  const pendingFeedPosts: any[] = await getPendingFeedPosts();
  for (const row of pendingFeedPosts) {
    hasChanges = true;
    try {
      const { error } = await supabase.from('feed_posts').upsert({
        id: row.id,
        user_id: row.user_id,
        group_id: row.group_id,
        type: row.type,
        title: row.title,
        body: row.body,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        created_at: row.created_at,
      });
      if (error) throw error;
      await markFeedPostSynced(row.id);
    } catch (error) {
      console.error('[Sync] Failed to push feed post', row.id, error);
    }
  }

  const pendingFeedReactions: any[] = await getPendingFeedReactions();
  for (const row of pendingFeedReactions) {
    hasChanges = true;
    try {
      const { error } = await supabase.from('feed_reactions').upsert({
        id: row.id,
        post_id: row.post_id,
        user_id: row.user_id,
        reaction: row.reaction,
        created_at: row.created_at,
      });
      if (error) throw error;
      await markFeedReactionSynced(row.id);
    } catch (error) {
      console.error('[Sync] Failed to push feed reaction', row.id, error);
    }
  }
  
  // STEP 3: Push Exercises (must be after workouts since exercises reference workout_id)
  const pendingExercises = await getPendingExercises();
  if (pendingExercises.length > 0) {
    hasChanges = true;
    console.log(`[Sync] Pushing ${pendingExercises.length} exercises...`);
    for (const exercise of pendingExercises) {
      try {
        if ((exercise as any).deleted) {
          const { error } = await supabase.from('exercises').delete().eq('id', exercise.id);
          if (error) throw error;
          console.log(`[Sync] Deleted exercise ${exercise.id} from Supabase`);
        } else {
          const { error } = await supabase.from('exercises').upsert({
            id: exercise.id,
            workout_id: exercise.workout_id,
            exercise_name: exercise.exercise_name,
            sets: exercise.sets,
            reps: exercise.reps,
            weight_lbs: exercise.weight_lbs,
            weight_unit: exercise.weight_unit,
            notes: exercise.notes,
            created_at: (exercise as any).created_at || new Date().toISOString(),
          });
          if (error) throw error;
          console.log(`[Sync] Pushed exercise ${exercise.id} to Supabase`);
        }
        await markExerciseSynced(exercise.id);
      } catch (error) {
        console.error(`[Sync] Failed to push exercise ${exercise.id}:`, error);
      }
    }
  }
  
  // STEP 4: Push Goals (no dependencies)
  const pendingGoals = await getPendingGoals();
  if (pendingGoals.length > 0) {
    hasChanges = true;
    console.log(`[Sync] Pushing ${pendingGoals.length} goals...`);
    for (const goal of pendingGoals) {
      try {
        if ((goal as any).deleted) {
          const { error } = await supabase.from('goals').delete().eq('id', goal.id);
          if (error) throw error;
          console.log(`[Sync] Deleted goal ${goal.id} from Supabase`);
        } else {
          const { error } = await supabase.from('goals').upsert(goal);
          if (error) throw error;
          console.log(`[Sync] Pushed goal ${goal.id} to Supabase`);
        }
        await markGoalSynced(goal.id);
      } catch (error) {
        console.error(`[Sync] Failed to push goal ${goal.id}:`, error);
      }
    }
  }
  
  // STEP 5: Push Measurements (no dependencies)
  const pendingMeasurements = await getPendingMeasurements();
  if (pendingMeasurements.length > 0) {
    hasChanges = true;
    console.log(`[Sync] Pushing ${pendingMeasurements.length} measurements...`);
    for (const measurement of pendingMeasurements) {
      try {
        if ((measurement as any).deleted) {
          const { error } = await supabase.from('body_measurements').delete().eq('id', measurement.id);
          if (error) throw error;
          console.log(`[Sync] Deleted measurement ${measurement.id} from Supabase`);
        } else {
          const { error } = await supabase.from('body_measurements').upsert(measurement);
          if (error) throw error;
          console.log(`[Sync] Pushed measurement ${measurement.id} to Supabase`);
        }
        await markMeasurementSynced(measurement.id);
      } catch (error) {
        console.error(`[Sync] Failed to push measurement ${measurement.id}:`, error);
      }
    }
  }
  
  // STEP 6: Push Strength Tests (no dependencies)
  const pendingTests = await getPendingStrengthTests();
  if (pendingTests.length > 0) {
    hasChanges = true;
    console.log(`[Sync] Pushing ${pendingTests.length} strength tests...`);
    for (const test of pendingTests) {
      try {
        if ((test as any).deleted) {
          const { error } = await supabase.from('strength_tests').delete().eq('id', test.id);
          if (error) throw error;
          console.log(`[Sync] Deleted strength test ${test.id} from Supabase`);
        } else {
          const { error } = await supabase.from('strength_tests').upsert(test);
          if (error) throw error;
          console.log(`[Sync] Pushed strength test ${test.id} to Supabase`);
        }
        await markStrengthTestSynced(test.id);
      } catch (error) {
        console.error(`[Sync] Failed to push strength test ${test.id}:`, error);
      }
    }
  }
  
  // STEP 7: Push Scheduled Trainings (no dependencies)
  const pendingTrainings = await getPendingScheduledTrainings();
  if (pendingTrainings.length > 0) {
    hasChanges = true;
    console.log(`[Sync] Pushing ${pendingTrainings.length} scheduled trainings...`);
    for (const training of pendingTrainings) {
      try {
        if ((training as any).deleted) {
          const { error } = await supabase.from('scheduled_trainings').delete().eq('id', training.id);
          if (error) throw error;
          console.log(`[Sync] Deleted scheduled training ${training.id} from Supabase`);
        } else {
          const { error } = await supabase.from('scheduled_trainings').upsert(training);
          if (error) throw error;
          console.log(`[Sync] Pushed scheduled training ${training.id} to Supabase`);
        }
        await markScheduledTrainingSynced(training.id);
      } catch (error) {
        console.error(`[Sync] Failed to push scheduled training ${training.id}:`, error);
      }
    }
  }
  
  if (!hasChanges) {
    console.log('[Sync] No pending changes to push');
  } else {
    console.log('[Sync] Push completed');
  }
};

/**
 * PULL: Download remote changes from Supabase
 * 
 * Important: This also handles deletions by comparing local vs remote IDs
 */
const pullRemoteChanges = async (userId: string) => {
  console.log('[Sync] Pulling remote changes...');
  
  const syncMetadata = await getSyncMetadata();
  const lastSyncAt = syncMetadata?.last_sync_at;
  const db = await getDatabase();
  
  // Temporarily disable foreign key constraints for cleanup operations
  // This prevents foreign key errors during deletion cascades
  await db.execAsync('PRAGMA foreign_keys = OFF');
  console.log('[Sync] Foreign key constraints disabled for cleanup');
  
  try {
  
  // STEP 1: Sync profile FIRST (required for foreign keys)
  console.log('[Sync] Pulling profile...');
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('[Sync] Profile pull failed:', profileError);
    } else if (profile) {
      // Upsert profile into SQLite
      const db = await getDatabase();
      await db.runAsync(
        `INSERT OR REPLACE INTO profiles (
          id, email, full_name, is_premium, is_test_user,
          weight_unit, avatar_url, avatar_local_path, avatar_cached_at,
          created_at, updated_at, modified_at, pending_sync, deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          profile.id,
          profile.email,
          profile.full_name || '',
          profile.is_premium ? 1 : 0,
          profile.is_test_user ? 1 : 0,
          profile.weight_unit || 'lbs',
          profile.avatar_url || null,
          null, // avatar_local_path
          null, // avatar_cached_at
          profile.created_at || new Date().toISOString(),
          profile.updated_at || new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
      console.log('[Sync] Profile synced successfully');
    }
  } catch (error) {
    console.error('[Sync] Profile sync error:', error);
  }
  
  // STEP 1.5: Sync social data
  // STEP 1.5: Pull social data (rely on RLS for visibility)
  try {
    // Friends
    const { data: remoteFriends } = await supabase.from('friends').select('*');
    if (remoteFriends) {
      for (const row of remoteFriends) {
        await upsertFriend(row);
      }
    }

    // Friend invites
    const { data: remoteFriendInv } = await supabase.from('friend_invites').select('*');
    if (remoteFriendInv) {
      for (const row of remoteFriendInv) {
        await upsertFriendInvite(row);
      }
    }

    // Groups
    const { data: remoteGroups } = await supabase.from('groups').select('*');
    if (remoteGroups) {
      for (const row of remoteGroups) {
        await upsertGroup(row);
      }
      // Clean up groups removed remotely (owner deleted)
      const remoteIds = new Set(remoteGroups.map((r: any) => r.id));
      const localGroups = await db.getAllAsync<{ id: string }>(
        'SELECT id FROM groups WHERE pending_sync = 0'
      );
      for (const lg of localGroups) {
        if (!remoteIds.has(lg.id)) {
          await db.runAsync('DELETE FROM groups WHERE id = ?', [lg.id]);
          await db.runAsync('DELETE FROM group_members WHERE group_id = ?', [lg.id]);
          await db.runAsync('DELETE FROM group_invites WHERE group_id = ?', [lg.id]);
        }
      }
    }

    // Group members
    const { data: remoteMembers } = await supabase.from('group_members').select('*');
    if (remoteMembers) {
      for (const row of remoteMembers) {
        await upsertGroupMember(row);
      }
    }

    // Group invites
    const { data: remoteGInv } = await supabase.from('group_invites').select('*');
    if (remoteGInv) {
      for (const row of remoteGInv) {
        await upsertGroupInvite(row);
      }
    }

    // Feed posts (RLS will filter)
    const { data: remotePosts } = await supabase
      .from('feed_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (remotePosts) {
      for (const row of remotePosts) {
        await upsertFeedPost(row);
      }
    }

    // Feed reactions by user
    const { data: remoteReactions } = await supabase.from('feed_reactions').select('*').eq('user_id', userId);
    if (remoteReactions) {
      for (const row of remoteReactions) {
        await upsertFeedReaction(row);
      }
    }
  } catch (error) {
    console.error('[Sync] Social pull failed:', error);
  }

  // STEP 2: Sync cycles (needed before workouts since workouts reference cycles)
  console.log('[Sync] Pulling cycles...');
  try {
    // Get all remote cycle IDs to detect deletions
    const { data: remoteCycleIds } = await supabase
      .from('cycles')
      .select('id')
      .eq('user_id', userId);
    
    // Get all local cycle IDs
    const localCycles = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM cycles WHERE user_id = ? AND pending_sync = 0',
      [userId]
    );
    
    // Clean up deleted cycles
    const remoteCIds = new Set((remoteCycleIds || []).map(c => c.id));
    const localCIds = new Set(localCycles.map(c => c.id));
    const deletedCycleIds = [...localCIds].filter(id => !remoteCIds.has(id));
    
    if (deletedCycleIds.length > 0) {
      console.log(`[Sync] Cleaning up ${deletedCycleIds.length} deleted cycles...`);
      for (const id of deletedCycleIds) {
        // First delete all workouts that reference this cycle
        await db.runAsync('DELETE FROM workouts WHERE cycle_id = ?', [id]);
        // Then delete the cycle
        await db.runAsync('DELETE FROM cycles WHERE id = ?', [id]);
      }
    }
    
    // Pull cycle details
    let cyclesQuery = supabase.from('cycles').select('*').eq('user_id', userId);
    if (lastSyncAt) {
      cyclesQuery = cyclesQuery.gt('modified_at', lastSyncAt);
    }
    const { data: remoteCycles, error: cyclesError } = await cyclesQuery;
    if (cyclesError) throw cyclesError;
    
    if (remoteCycles && remoteCycles.length > 0) {
      console.log(`[Sync] Pulled ${remoteCycles.length} cycles`);
      for (const cycle of remoteCycles) {
        await upsertCycle(cycle);
      }
    }
  } catch (error) {
    console.error('[Sync] Cycles pull failed:', error);
  }
  
    // STEP X: Pull social data
  try {
    // Friends: only rows where current user is involved
    const { data: remoteFriends } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${userId},friend_user_id.eq.${userId}`);
    if (remoteFriends) {
      for (const row of remoteFriends) {
        await upsertFriend(row);
      }
    }

    // Friend invites: sent by user or (if needed) pending to user's email handled via invites table separately
    const { data: remoteFriendInv } = await supabase
      .from('friend_invites')
      .select('*')
      .eq('inviter_id', userId);
    if (remoteFriendInv) {
      for (const row of remoteFriendInv) {
        await upsertFriendInvite(row);
      }
    }

    // Groups owned by user
    const { data: ownedGroups } = await supabase.from('groups').select('*').eq('owner_id', userId);
    if (ownedGroups) {
      for (const row of ownedGroups) {
        await upsertGroup(row);
      }
    }

    // Groups where user is a member
    const { data: memberGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .eq('status', 'active');
    const memberGroupIds = (memberGroups || []).map((m) => m.group_id);
    if (memberGroupIds.length > 0) {
      const { data: remoteMemberGroups } = await supabase.from('groups').select('*').in('id', memberGroupIds);
      if (remoteMemberGroups) {
        for (const row of remoteMemberGroups) {
          await upsertGroup(row);
        }
      }
    }

    // Group members for groups the user owns or belongs to
    const groupIdsForMembers = Array.from(new Set([...(ownedGroups || []).map(g => g.id), ...memberGroupIds]));
    if (groupIdsForMembers.length > 0) {
      const { data: remoteMembers } = await supabase
        .from('group_members')
        .select('*')
        .in('group_id', groupIdsForMembers);
      if (remoteMembers) {
        for (const row of remoteMembers) {
          await upsertGroupMember(row);
        }
      }
    }

    // Group invites where user is invitee (by user_id) or owner (inviter)
    const { data: remoteGInv } = await supabase
      .from('group_invites')
      .select('*')
      .or(`invitee_user_id.eq.${userId},inviter_id.eq.${userId}`);
    if (remoteGInv) {
      for (const row of remoteGInv) {
        await upsertGroupInvite(row);
      }
    }

    // Feed posts: pull posts by user, friends, and groups user belongs to
    // NOTE: This is simplified; for full RLS fidelity consider a server function.
    const friendIds = (remoteFriends || []).flatMap((f: any) =>
      f.user_id === userId ? f.friend_user_id : f.user_id
    );
    const visibleGroups = groupIdsForMembers;
    const postQuery = supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(200);
    let postFilters: any[] = [];
    postFilters.push(`user_id.eq.${userId}`);
    if (friendIds.length > 0) {
      postFilters.push(`user_id.in.(${friendIds.join(',')})`);
    }
    if (visibleGroups.length > 0) {
      postFilters.push(`group_id.in.(${visibleGroups.join(',')})`);
    }
    if (postFilters.length > 0) {
      postQuery.or(postFilters.join(','));
    }
    const { data: remotePosts } = await postQuery;
    if (remotePosts) {
      for (const row of remotePosts) {
        await upsertFeedPost(row);
      }
    }

    // Feed reactions by current user (to keep user’s reaction state)
    const { data: remoteReactions } = await supabase.from('feed_reactions').select('*').eq('user_id', userId);
    if (remoteReactions) {
      for (const row of remoteReactions) {
        await upsertFeedReaction(row);
      }
    }
  } catch (error) {
    console.error('[Sync] Social pull failed:', error);
  }


  // STEP 3: Now sync workouts (profile and cycles exist, foreign keys will work)
  console.log('[Sync] Pulling workouts...');
  
  // Get ALL remote workouts (not just changes since last sync) to detect deletions
  const { data: remoteWorkouts, error } = await supabase
    .from('workouts')
    .select('id')
    .eq('user_id', userId);
  
  if (error) {
    console.error('[Sync] Pull failed:', error);
    throw error;
  }
  
  // Get all local workout IDs (including deleted ones)
  const localWorkouts = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM workouts WHERE user_id = ? AND pending_sync = 0',
    [userId]
  );
  
  // Find IDs that exist locally but not remotely (these were deleted elsewhere)
  const remoteIds = new Set((remoteWorkouts || []).map(w => w.id));
  const localIds = new Set(localWorkouts.map(w => w.id));
  const deletedIds = [...localIds].filter(id => !remoteIds.has(id));
  
  if (deletedIds.length > 0) {
    console.log(`[Sync] Cleaning up ${deletedIds.length} deleted workouts...`);
    for (const id of deletedIds) {
      // Delete exercises first (they reference workouts)
      await db.runAsync('DELETE FROM exercises WHERE workout_id = ?', [id]);
      // Then delete the workout
      await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
    }
  }
  
  // Now pull actual workout data (only changed since last sync for efficiency)
  let detailQuery = supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId);
  
  if (lastSyncAt) {
    detailQuery = detailQuery.gt('modified_at', lastSyncAt);
  }
  
  const { data: remoteWorkoutDetails, error: detailError } = await detailQuery;
  
  if (detailError) {
    console.error('[Sync] Workout details pull failed:', detailError);
  } else if (remoteWorkoutDetails && remoteWorkoutDetails.length > 0) {
    console.log(`[Sync] Pulling ${remoteWorkoutDetails.length} workout updates...`);
    
    // Handle conflicts and merge
    for (const remoteWorkout of remoteWorkoutDetails) {
      try {
        await resolveConflictAndMerge(remoteWorkout);
      } catch (error) {
        console.error(`[Sync] Failed to merge workout ${remoteWorkout.id}:`, error);
      }
    }
  }
  
  // STEP 3.5: Sync exercises (must be after workouts since exercises reference workout_id)
  console.log('[Sync] Pulling exercises...');
  try {
    let exercisesQuery = supabase
      .from('exercises')
      .select('*, workouts!inner(user_id)')
      .eq('workouts.user_id', userId);
    
    if (lastSyncAt) {
      exercisesQuery = exercisesQuery.gt('modified_at', lastSyncAt);
    }
    
    const { data: remoteExercises, error: exercisesError } = await exercisesQuery;
    if (exercisesError) throw exercisesError;
    
    if (remoteExercises && remoteExercises.length > 0) {
      console.log(`[Sync] Pulled ${remoteExercises.length} exercises`);
      for (const exercise of remoteExercises) {
        // Remove the nested workouts object before upserting
        const { workouts: _workouts, ...exerciseData } = exercise;
        await upsertExercise(exerciseData);
      }
    }
  } catch (error) {
    console.error('[Sync] Exercises pull failed:', error);
  }
  
  // STEP 4: Sync goals
  console.log('[Sync] Pulling goals...');
  try {
    // Get all remote goal IDs to detect deletions
    const { data: remoteGoalIds } = await supabase
      .from('goals')
      .select('id')
      .eq('user_id', userId);
    
    // Get all local goal IDs
    const localGoals = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM goals WHERE user_id = ? AND pending_sync = 0',
      [userId]
    );
    
    // Clean up deleted goals
    const remoteGIds = new Set((remoteGoalIds || []).map(g => g.id));
    const localGIds = new Set(localGoals.map(g => g.id));
    const deletedGoalIds = [...localGIds].filter(id => !remoteGIds.has(id));
    
    if (deletedGoalIds.length > 0) {
      console.log(`[Sync] Cleaning up ${deletedGoalIds.length} deleted goals...`);
      for (const id of deletedGoalIds) {
        await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
      }
    }
    
    // Pull goal details
    let goalsQuery = supabase.from('goals').select('*').eq('user_id', userId);
    if (lastSyncAt) {
      goalsQuery = goalsQuery.gt('modified_at', lastSyncAt);
    }
    const { data: remoteGoals, error: goalsError } = await goalsQuery;
    if (goalsError) throw goalsError;
    
    if (remoteGoals && remoteGoals.length > 0) {
      console.log(`[Sync] Pulled ${remoteGoals.length} goals`);
      for (const goal of remoteGoals) {
        await upsertGoal(goal);
      }
    }
  } catch (error) {
    console.error('[Sync] Goals pull failed:', error);
  }
  
  // STEP 5: Sync body measurements
  console.log('[Sync] Pulling measurements...');
  try {
    // Get all remote measurement IDs to detect deletions
    const { data: remoteMeasurementIds } = await supabase
      .from('body_measurements')
      .select('id')
      .eq('user_id', userId);
    
    // Get all local measurement IDs
    const localMeasurements = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM body_measurements WHERE user_id = ? AND pending_sync = 0',
      [userId]
    );
    
    // Clean up deleted measurements
    const remoteMIds = new Set((remoteMeasurementIds || []).map(m => m.id));
    const localMIds = new Set(localMeasurements.map(m => m.id));
    const deletedMeasurementIds = [...localMIds].filter(id => !remoteMIds.has(id));
    
    if (deletedMeasurementIds.length > 0) {
      console.log(`[Sync] Cleaning up ${deletedMeasurementIds.length} deleted measurements...`);
      for (const id of deletedMeasurementIds) {
        await db.runAsync('DELETE FROM body_measurements WHERE id = ?', [id]);
      }
    }
    
    // Pull measurement details
    let measurementsQuery = supabase.from('body_measurements').select('*').eq('user_id', userId);
    if (lastSyncAt) {
      measurementsQuery = measurementsQuery.gt('modified_at', lastSyncAt);
    }
    const { data: remoteMeasurements, error: measurementsError } = await measurementsQuery;
    if (measurementsError) throw measurementsError;
    
    if (remoteMeasurements && remoteMeasurements.length > 0) {
      console.log(`[Sync] Pulled ${remoteMeasurements.length} measurements`);
      for (const measurement of remoteMeasurements) {
        await upsertMeasurement(measurement);
      }
    }
  } catch (error) {
    console.error('[Sync] Measurements pull failed:', error);
  }
  
  // STEP 6: Sync strength tests (PRs)
  console.log('[Sync] Pulling strength tests...');
  try {
    // Get all remote strength test IDs to detect deletions
    const { data: remoteTestIds } = await supabase
      .from('strength_tests')
      .select('id')
      .eq('user_id', userId);
    
    // Get all local strength test IDs
    const localTests = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM strength_tests WHERE user_id = ? AND pending_sync = 0',
      [userId]
    );
    
    // Clean up deleted strength tests
    const remoteTIds = new Set((remoteTestIds || []).map(t => t.id));
    const localTIds = new Set(localTests.map(t => t.id));
    const deletedTestIds = [...localTIds].filter(id => !remoteTIds.has(id));
    
    if (deletedTestIds.length > 0) {
      console.log(`[Sync] Cleaning up ${deletedTestIds.length} deleted strength tests...`);
      for (const id of deletedTestIds) {
        await db.runAsync('DELETE FROM strength_tests WHERE id = ?', [id]);
      }
    }
    
    // Pull strength test details
    let testsQuery = supabase.from('strength_tests').select('*').eq('user_id', userId);
    if (lastSyncAt) {
      testsQuery = testsQuery.gt('modified_at', lastSyncAt);
    }
    const { data: remoteTests, error: testsError } = await testsQuery;
    if (testsError) throw testsError;
    
    if (remoteTests && remoteTests.length > 0) {
      console.log(`[Sync] Pulled ${remoteTests.length} strength tests`);
      for (const test of remoteTests) {
        await upsertStrengthTest(test);
      }
    }
  } catch (error) {
    console.error('[Sync] Strength tests pull failed:', error);
  }
  
  // STEP 7: Sync scheduled trainings
  console.log('[Sync] Pulling scheduled trainings...');
  try {
    // Get all remote scheduled training IDs to detect deletions
    const { data: remoteTrainingIds } = await supabase
      .from('scheduled_trainings')
      .select('id')
      .eq('user_id', userId);
    
    // Get all local scheduled training IDs
    const localTrainings = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM scheduled_trainings WHERE user_id = ? AND pending_sync = 0',
      [userId]
    );
    
    // Clean up deleted scheduled trainings
    const remoteStIds = new Set((remoteTrainingIds || []).map(t => t.id));
    const localStIds = new Set(localTrainings.map(t => t.id));
    const deletedTrainingIds = [...localStIds].filter(id => !remoteStIds.has(id));
    
    if (deletedTrainingIds.length > 0) {
      console.log(`[Sync] Cleaning up ${deletedTrainingIds.length} deleted scheduled trainings...`);
      for (const id of deletedTrainingIds) {
        await db.runAsync('DELETE FROM scheduled_trainings WHERE id = ?', [id]);
      }
    }
    
    // Pull scheduled training details
    let trainingsQuery = supabase.from('scheduled_trainings').select('*').eq('user_id', userId);
    if (lastSyncAt) {
      trainingsQuery = trainingsQuery.gt('modified_at', lastSyncAt);
    }
    const { data: remoteTrainings, error: trainingsError } = await trainingsQuery;
    if (trainingsError) throw trainingsError;
    
    if (remoteTrainings && remoteTrainings.length > 0) {
      console.log(`[Sync] Pulled ${remoteTrainings.length} scheduled trainings`);
      for (const training of remoteTrainings) {
        await upsertScheduledTraining(training);
      }
    }
  } catch (error) {
    console.error('[Sync] Scheduled trainings pull failed:', error);
  }
  
  } finally {
    // Re-enable foreign key constraints
    await db.execAsync('PRAGMA foreign_keys = ON');
    console.log('[Sync] Foreign key constraints re-enabled');
  }
  
  console.log('[Sync] Pull completed');
};

/**
 * Conflict Resolution: Newer modified_at wins
 */
const resolveConflictAndMerge = async (remoteWorkout: any) => {
  const db = await getDatabase();
  
  // Check if workout exists locally
  const localWorkout = await db.getFirstAsync<any>(
    'SELECT * FROM workouts WHERE id = ?',
    [remoteWorkout.id]
  );
  
  if (!localWorkout) {
    // No conflict - insert new record
    await upsertWorkout(remoteWorkout);
    console.log(`[Sync] Inserted new workout ${remoteWorkout.id}`);
    return;
  }
  
  // Check for conflict
  const localModified = new Date(localWorkout.modified_at);
  const remoteModified = new Date(remoteWorkout.updated_at);
  
  if (localWorkout.pending_sync === 1) {
    // Local has unsync changes
    if (remoteModified > localModified) {
      // Remote is newer - accept remote (lose local changes)
      console.log(`[Sync] Conflict: Remote newer, accepting remote for ${remoteWorkout.id}`);
      await upsertWorkout(remoteWorkout);
      await markWorkoutSynced(remoteWorkout.id);
    } else {
      // Local is newer or equal - keep local (will be pushed in next sync)
      console.log(`[Sync] Conflict: Local newer, keeping local for ${remoteWorkout.id}`);
    }
  } else {
    // No local changes - safe to update
    await upsertWorkout(remoteWorkout);
    console.log(`[Sync] Updated workout ${remoteWorkout.id}`);
  }
};

/**
 * Auto-sync on app start
 */
export const startAutoSync = (userId: string) => {
  // Sync immediately
  triggerSync(userId);
  
  // Sync every 5 minutes
  const intervalId = setInterval(() => {
    triggerSync(userId);
  }, 5 * 60 * 1000);
  
  // Listen for network changes
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      console.log('[Sync] Network reconnected, triggering sync');
      triggerSync(userId);
    }
  });
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    unsubscribe();
  };
};

/**
 * Force full sync (download everything)
 */
export const forceFullSync = async (userId: string) => {
  console.log('[Sync] Starting full sync...');
  
  const db = await getDatabase();
  
  // Reset sync metadata to force full pull
  await db.runAsync(
    'UPDATE sync_metadata SET last_sync_at = NULL WHERE id = 1'
  );
  
  // Trigger sync
  await triggerSync(userId);
};
