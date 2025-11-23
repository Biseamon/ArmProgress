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

