/**
 * SQLite Database Setup
 * 
 * Primary local database for offline-first architecture.
 * All app data is stored here and synced to Supabase.
 */

import * as SQLite from 'expo-sqlite';

// Database name
const DB_NAME = 'armprogress.db';

// Open/create database
let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  
  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeDatabase(db);
    console.log('[Database] SQLite database initialized successfully');
    return db;
  } catch (error) {
    console.error('[Database] Failed to initialize database:', error);
    throw error;
  }
};

/**
 * Initialize database tables
 */
const initializeDatabase = async (database: SQLite.SQLiteDatabase) => {
  try {
    console.log('[Database] Setting up database...');
    
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);
    
    console.log('[Database] Creating tables...');
    // Create all tables
    await createTables(database);
    
    console.log('[Database] Creating sync metadata table...');
    // Create sync metadata table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        last_sync_at TEXT,
        user_id TEXT
      );
      
      INSERT OR IGNORE INTO sync_metadata (id, last_sync_at, user_id) 
      VALUES (1, NULL, NULL);
    `);
    
    // Verify sync_metadata was created
    const result = await database.getFirstAsync('SELECT * FROM sync_metadata WHERE id = 1');
    console.log('[Database] Sync metadata verified:', result);
    
    console.log('[Database] Database initialization complete');
  } catch (error) {
    console.error('[Database] Initialization error:', error);
    throw error;
  }
};

/**
 * Create all tables with sync columns
 */
const createTables = async (database: SQLite.SQLiteDatabase) => {
  // Profiles table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      full_name TEXT,
      is_premium INTEGER DEFAULT 0,
      is_test_user INTEGER DEFAULT 0,
      weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
      avatar_url TEXT,
      avatar_local_path TEXT,
      avatar_cached_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0
    );
  `);

  // Workouts table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      cycle_id TEXT,
      workout_type TEXT NOT NULL,
      duration_minutes INTEGER,
      intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
      notes TEXT,
      weight_unit TEXT DEFAULT 'lbs',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES profiles(id),
      FOREIGN KEY (cycle_id) REFERENCES cycles(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
    CREATE INDEX IF NOT EXISTS idx_workouts_pending_sync ON workouts(pending_sync);
  `);

  // Exercises table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      sets INTEGER DEFAULT 0,
      reps INTEGER DEFAULT 0,
      weight_lbs REAL DEFAULT 0,
      weight_unit TEXT DEFAULT 'lbs',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0,
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON exercises(workout_id);
  `);

  // Cycles table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS cycles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      cycle_type TEXT NOT NULL DEFAULT 'strength',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES profiles(id)
    );

    CREATE INDEX IF NOT EXISTS idx_cycles_user_id ON cycles(user_id);
  `);

  // Training Templates table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS training_templates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      workout_type TEXT NOT NULL,
      suggested_duration_minutes INTEGER,
      suggested_intensity INTEGER CHECK (suggested_intensity >= 1 AND suggested_intensity <= 10),
      exercises TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES profiles(id)
    );

    CREATE INDEX IF NOT EXISTS idx_training_templates_user_id ON training_templates(user_id);
    CREATE INDEX IF NOT EXISTS idx_training_templates_pending_sync ON training_templates(pending_sync);
  `);

  // Goals table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      goal_type TEXT NOT NULL,
      target_value REAL NOT NULL,
      current_value REAL DEFAULT 0,
      deadline TEXT,
      is_completed INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES profiles(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
  `);

  // Strength Tests table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS strength_tests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      test_type TEXT NOT NULL,
      result_value REAL NOT NULL,
      result_unit TEXT DEFAULT 'lbs',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES profiles(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_strength_tests_user_id ON strength_tests(user_id);
  `);

  // Body Measurements table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS body_measurements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      weight REAL,
      weight_unit TEXT DEFAULT 'lbs',
      arm_circumference REAL,
      forearm_circumference REAL,
      wrist_circumference REAL,
      notes TEXT,
      measured_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES profiles(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_body_measurements_user_id ON body_measurements(user_id);
  `);

  // Scheduled Trainings table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS scheduled_trainings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      notification_enabled INTEGER DEFAULT 1,
      notification_minutes_before INTEGER DEFAULT 30,
      notification_id TEXT,
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES profiles(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_scheduled_trainings_user_id ON scheduled_trainings(user_id);
    CREATE INDEX IF NOT EXISTS idx_scheduled_trainings_date ON scheduled_trainings(scheduled_date);
  `);

  // Friends table (symmetric accepted stored as two rows)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS friends (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      friend_user_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending','accepted','rejected')),
      created_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_friends_pair ON friends(user_id, friend_user_id);
    CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
    CREATE INDEX IF NOT EXISTS idx_friends_pending_sync ON friends(pending_sync);
  `);

  // Friend invites (for non-users, auto-accept on signup)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS friend_invites (
      id TEXT PRIMARY KEY,
      inviter_id TEXT NOT NULL,
      invitee_email TEXT NOT NULL,
      token TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
      created_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_friend_invites_email ON friend_invites(invitee_email);
    CREATE INDEX IF NOT EXISTS idx_friend_invites_inviter ON friend_invites(inviter_id);
    CREATE INDEX IF NOT EXISTS idx_friend_invites_pending_sync ON friend_invites(pending_sync);
  `);

  // Groups
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
      created_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_groups_owner ON groups(owner_id);
    CREATE INDEX IF NOT EXISTS idx_groups_visibility ON groups(visibility);
    CREATE INDEX IF NOT EXISTS idx_groups_pending_sync ON groups(pending_sync);
  `);

  // Add avatar_url column to groups (migration-safe)
  try {
    await database.execAsync('ALTER TABLE groups ADD COLUMN avatar_url TEXT;');
  } catch (error: any) {
    // Column already exists, ignore error
    if (!error.message?.includes('duplicate column')) {
      console.warn('[Database] Error adding avatar_url to groups:', error);
    }
  }

  // Group members
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS group_members (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active','pending','rejected')),
      created_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_unique ON group_members(group_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
    CREATE INDEX IF NOT EXISTS idx_group_members_pending_sync ON group_members(pending_sync);
  `);

  // Group invites
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS group_invites (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      inviter_id TEXT NOT NULL,
      invitee_user_id TEXT,
      invitee_email TEXT,
      token TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
      created_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_group_invites_group ON group_invites(group_id);
    CREATE INDEX IF NOT EXISTS idx_group_invites_inviter ON group_invites(inviter_id);
    CREATE INDEX IF NOT EXISTS idx_group_invites_invitee_user ON group_invites(invitee_user_id);
    CREATE INDEX IF NOT EXISTS idx_group_invites_pending_sync ON group_invites(pending_sync);
  `);

  // Feed posts
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS feed_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      group_id TEXT,
      type TEXT NOT NULL CHECK (type IN ('goal','pr','summary')),
      title TEXT NOT NULL,
      body TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_feed_posts_user ON feed_posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_feed_posts_group ON feed_posts(group_id);
    CREATE INDEX IF NOT EXISTS idx_feed_posts_pending_sync ON feed_posts(pending_sync);
    CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON feed_posts(created_at);
  `);

  // Feed reactions
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS feed_reactions (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reaction TEXT NOT NULL CHECK (reaction IN ('arm','fire','like')),
      created_at TEXT DEFAULT (datetime('now')),
      modified_at TEXT DEFAULT (datetime('now')),
      pending_sync INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_feed_reactions_unique ON feed_reactions(post_id, user_id, reaction);
    CREATE INDEX IF NOT EXISTS idx_feed_reactions_user ON feed_reactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_feed_reactions_post ON feed_reactions(post_id);
    CREATE INDEX IF NOT EXISTS idx_feed_reactions_pending_sync ON feed_reactions(pending_sync);
  `);
};

/**
 * Reset database (for development/testing)
 */
export const resetDatabase = async () => {
  console.log('[Database] Resetting database...');
  
  // Close existing connection
  if (db) {
    await db.closeAsync();
    db = null;
  }
  
  // Delete the database file
  try {
    await SQLite.deleteDatabaseAsync(DB_NAME);
    console.log('[Database] Database file deleted');
  } catch (error) {
    console.log('[Database] No existing database to delete');
  }
  
  // Reinitialize
  const database = await getDatabase();
  console.log('[Database] Database reset complete');
  return database;
};

/**
 * Get sync metadata
 */
export const getSyncMetadata = async () => {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{
    last_sync_at: string | null;
    user_id: string | null;
  }>('SELECT last_sync_at, user_id FROM sync_metadata WHERE id = 1');
  
  return result;
};

/**
 * Update sync metadata
 */
export const updateSyncMetadata = async (userId: string) => {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE sync_metadata SET last_sync_at = ?, user_id = ? WHERE id = 1',
    [new Date().toISOString(), userId]
  );
};

/**
 * Clear social data when switching accounts to avoid cross-user leakage.
 * Leaves workouts/goals intact; only social tables are wiped.
 */
export const clearSocialData = async () => {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM feed_reactions;
    DELETE FROM feed_posts;
    DELETE FROM group_invites;
    DELETE FROM group_members;
    DELETE FROM groups;
    DELETE FROM friend_invites;
    DELETE FROM friends;
  `);
  await database.runAsync('UPDATE sync_metadata SET last_sync_at = NULL, user_id = NULL WHERE id = 1');
  console.log('[Database] Social tables cleared for user switch');
};
