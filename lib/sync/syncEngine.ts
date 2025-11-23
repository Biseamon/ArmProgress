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
  } catch (error) {
    console.error('[Sync] Sync failed:', error);
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
 */
const pushLocalChanges = async (userId: string) => {
  console.log('[Sync] Pushing local changes...');
  
  // Get all pending workouts
  const pendingWorkouts = await getPendingWorkouts();
  
  if (pendingWorkouts.length === 0) {
    console.log('[Sync] No pending changes to push');
    return;
  }
  
  console.log(`[Sync] Pushing ${pendingWorkouts.length} workouts...`);
  
  for (const workout of pendingWorkouts) {
    try {
      if (workout.deleted) {
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
            created_at: workout.created_at,
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
  
  // Push Exercises (must be after workouts since exercises reference workout_id)
  const pendingExercises = await getPendingExercises();
  if (pendingExercises.length > 0) {
    console.log(`[Sync] Pushing ${pendingExercises.length} exercises...`);
    for (const exercise of pendingExercises) {
      try {
        if (exercise.deleted) {
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
            created_at: exercise.created_at,
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
  
  // Push Cycles
  const pendingCycles = await getPendingCycles();
  if (pendingCycles.length > 0) {
    console.log(`[Sync] Pushing ${pendingCycles.length} cycles...`);
    for (const cycle of pendingCycles) {
      try {
        if (cycle.deleted) {
          const { error } = await supabase.from('cycles').delete().eq('id', cycle.id);
          if (error) throw error;
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
            created_at: cycle.created_at,
            updated_at: new Date().toISOString(),
          });
          if (error) throw error;
        }
        await markCycleSynced(cycle.id);
      } catch (error) {
        console.error(`[Sync] Failed to push cycle ${cycle.id}:`, error);
      }
    }
  }
  
  // Push Goals
  const pendingGoals = await getPendingGoals();
  if (pendingGoals.length > 0) {
    console.log(`[Sync] Pushing ${pendingGoals.length} goals...`);
    for (const goal of pendingGoals) {
      try {
        if (goal.deleted) {
          const { error } = await supabase.from('goals').delete().eq('id', goal.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('goals').upsert(goal);
          if (error) throw error;
        }
        await markGoalSynced(goal.id);
      } catch (error) {
        console.error(`[Sync] Failed to push goal ${goal.id}:`, error);
      }
    }
  }
  
  // Push Measurements
  const pendingMeasurements = await getPendingMeasurements();
  if (pendingMeasurements.length > 0) {
    console.log(`[Sync] Pushing ${pendingMeasurements.length} measurements...`);
    for (const measurement of pendingMeasurements) {
      try {
        if (measurement.deleted) {
          const { error } = await supabase.from('body_measurements').delete().eq('id', measurement.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('body_measurements').upsert(measurement);
          if (error) throw error;
        }
        await markMeasurementSynced(measurement.id);
      } catch (error) {
        console.error(`[Sync] Failed to push measurement ${measurement.id}:`, error);
      }
    }
  }
  
  // Push Strength Tests (PRs)
  const pendingTests = await getPendingStrengthTests();
  if (pendingTests.length > 0) {
    console.log(`[Sync] Pushing ${pendingTests.length} strength tests...`);
    for (const test of pendingTests) {
      try {
        if (test.deleted) {
          const { error } = await supabase.from('strength_tests').delete().eq('id', test.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('strength_tests').upsert(test);
          if (error) throw error;
        }
        await markStrengthTestSynced(test.id);
      } catch (error) {
        console.error(`[Sync] Failed to push strength test ${test.id}:`, error);
      }
    }
  }
  
  // Push Scheduled Trainings
  const pendingTrainings = await getPendingScheduledTrainings();
  if (pendingTrainings.length > 0) {
    console.log(`[Sync] Pushing ${pendingTrainings.length} scheduled trainings...`);
    for (const training of pendingTrainings) {
      try {
        if (training.deleted) {
          const { error } = await supabase.from('scheduled_trainings').delete().eq('id', training.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('scheduled_trainings').upsert(training);
          if (error) throw error;
        }
        await markScheduledTrainingSynced(training.id);
      } catch (error) {
        console.error(`[Sync] Failed to push scheduled training ${training.id}:`, error);
      }
    }
  }
  
  console.log('[Sync] Push completed');
};

/**
 * PULL: Download remote changes from Supabase
 */
const pullRemoteChanges = async (userId: string) => {
  console.log('[Sync] Pulling remote changes...');
  
  const syncMetadata = await getSyncMetadata();
  const lastSyncAt = syncMetadata?.last_sync_at;
  
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
  
  // STEP 2: Sync cycles (needed before workouts since workouts reference cycles)
  console.log('[Sync] Pulling cycles...');
  try {
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
  
  // STEP 3: Now sync workouts (profile and cycles exist, foreign keys will work)
  console.log('[Sync] Pulling workouts...');
  let query = supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId);
  
  // Only pull changes since last sync
  if (lastSyncAt) {
    query = query.gt('modified_at', lastSyncAt);
  }
  
  const { data: remoteWorkouts, error } = await query;
  
  if (error) {
    console.error('[Sync] Pull failed:', error);
    throw error;
  }
  
  if (!remoteWorkouts || remoteWorkouts.length === 0) {
    console.log('[Sync] No remote workouts to pull');
  } else {
    console.log(`[Sync] Pulling ${remoteWorkouts.length} workouts...`);
    
    // Handle conflicts and merge
    for (const remoteWorkout of remoteWorkouts) {
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

