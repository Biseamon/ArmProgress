-- ============================================
-- FIX RLS PERMISSIONS - EMERGENCY FIX
-- ============================================
-- This fixes the "permission denied for table" errors
-- Run this in your Supabase SQL Editor immediately
-- ============================================

-- Grant basic permissions first
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- DROP AND RECREATE ALL RLS POLICIES
-- ============================================

-- PROFILES TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- WORKOUTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can insert own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can update own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can delete own workouts" ON workouts;

CREATE POLICY "Users can view own workouts"
    ON workouts FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
    ON workouts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
    ON workouts FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
    ON workouts FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- EXERCISES TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can insert own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can update own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can delete own exercises" ON exercises;

CREATE POLICY "Users can view own exercises"
    ON exercises FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM workouts
            WHERE workouts.id = exercises.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own exercises"
    ON exercises FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workouts
            WHERE workouts.id = exercises.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own exercises"
    ON exercises FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM workouts
            WHERE workouts.id = exercises.workout_id
            AND workouts.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workouts
            WHERE workouts.id = exercises.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own exercises"
    ON exercises FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM workouts
            WHERE workouts.id = exercises.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

-- CYCLES TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view own cycles" ON cycles;
DROP POLICY IF EXISTS "Users can insert own cycles" ON cycles;
DROP POLICY IF EXISTS "Users can update own cycles" ON cycles;
DROP POLICY IF EXISTS "Users can delete own cycles" ON cycles;

CREATE POLICY "Users can view own cycles"
    ON cycles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycles"
    ON cycles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycles"
    ON cycles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycles"
    ON cycles FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- GOALS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

CREATE POLICY "Users can view own goals"
    ON goals FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
    ON goals FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
    ON goals FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
    ON goals FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- STRENGTH TESTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view own tests" ON strength_tests;
DROP POLICY IF EXISTS "Users can insert own tests" ON strength_tests;
DROP POLICY IF EXISTS "Users can update own tests" ON strength_tests;
DROP POLICY IF EXISTS "Users can delete own tests" ON strength_tests;

CREATE POLICY "Users can view own tests"
    ON strength_tests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tests"
    ON strength_tests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests"
    ON strength_tests FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tests"
    ON strength_tests FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- BODY MEASUREMENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view own measurements" ON body_measurements;
DROP POLICY IF EXISTS "Users can insert own measurements" ON body_measurements;
DROP POLICY IF EXISTS "Users can update own measurements" ON body_measurements;
DROP POLICY IF EXISTS "Users can delete own measurements" ON body_measurements;

CREATE POLICY "Users can view own measurements"
    ON body_measurements FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements"
    ON body_measurements FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements"
    ON body_measurements FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements"
    ON body_measurements FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- SCHEDULED TRAININGS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view own schedules" ON scheduled_trainings;
DROP POLICY IF EXISTS "Users can insert own schedules" ON scheduled_trainings;
DROP POLICY IF EXISTS "Users can update own schedules" ON scheduled_trainings;
DROP POLICY IF EXISTS "Users can delete own schedules" ON scheduled_trainings;

CREATE POLICY "Users can view own schedules"
    ON scheduled_trainings FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
    ON scheduled_trainings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
    ON scheduled_trainings FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
    ON scheduled_trainings FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE strength_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_trainings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- GRANT EXECUTE ON FUNCTIONS
-- ============================================
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================
-- DONE!
-- ============================================
-- After running this:
-- 1. Refresh your Supabase dashboard
-- 2. Restart your app
-- 3. Try logging in again
-- ============================================

