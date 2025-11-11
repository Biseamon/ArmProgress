-- ============================================
-- ROLLBACK SCRIPT FOR COMPLETE SCHEMA
-- ============================================
-- Use this to rollback the 20251110_complete_schema.sql migration
-- WARNING: This will DROP all tables and data!
-- Make sure you have a backup before running this!
-- ============================================

BEGIN;

-- Drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_cycles_updated_at ON cycles;
DROP TRIGGER IF EXISTS update_workouts_updated_at ON workouts;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_active_cycle(UUID) CASCADE;
DROP FUNCTION IF EXISTS goal_progress_percentage(UUID) CASCADE;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS scheduled_trainings CASCADE;
DROP TABLE IF EXISTS body_measurements CASCADE;
DROP TABLE IF EXISTS strength_tests CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS cycles CASCADE;
DROP TABLE IF EXISTS training_cycles CASCADE;  -- Old table name
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop extensions if no longer needed
-- DROP EXTENSION IF EXISTS "uuid-ossp";
-- DROP EXTENSION IF EXISTS "pgcrypto";

COMMIT;

-- ============================================
-- ROLLBACK COMPLETE
-- ============================================
-- All tables, triggers, and functions have been removed
-- You can now run a different migration or restore from backup
-- ============================================
