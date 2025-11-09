-- ============================================
-- ARM WRESTLING PRO - COMPLETE DATABASE SCHEMA
-- ============================================
-- This migration creates a clean, complete database schema
-- Run this on a fresh Supabase project or after dropping existing tables
--
-- Author: Claude Code
-- Date: 2025-01-10
-- Version: 1.0.0
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES TABLE
-- ============================================
-- User profiles linked to auth.users
-- This is the central user table that all other tables reference

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_premium BOOLEAN DEFAULT false,
    is_test_user BOOLEAN DEFAULT false,
    weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
    premium_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CYCLES TABLE
-- ============================================
-- Training cycles/programs for periodization

CREATE TABLE IF NOT EXISTS cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    cycle_type TEXT NOT NULL CHECK (cycle_type IN ('strength', 'technique', 'conditioning', 'recovery', 'competition_prep', 'off_season')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own cycles"
    ON cycles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycles"
    ON cycles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycles"
    ON cycles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycles"
    ON cycles FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_cycles_updated_at
    BEFORE UPDATE ON cycles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- WORKOUTS TABLE
-- ============================================
-- Individual workout sessions

CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES cycles(id) ON DELETE SET NULL,
    workout_type TEXT NOT NULL,
    duration_minutes INTEGER CHECK (duration_minutes > 0),
    intensity INTEGER CHECK (intensity BETWEEN 1 AND 10),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own workouts"
    ON workouts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
    ON workouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
    ON workouts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
    ON workouts FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- EXERCISES TABLE
-- ============================================
-- Individual exercises within a workout

CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    sets INTEGER DEFAULT 0 CHECK (sets >= 0),
    reps INTEGER DEFAULT 0 CHECK (reps >= 0),
    weight_lbs DECIMAL(10,2) DEFAULT 0 CHECK (weight_lbs >= 0),
    weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies (access through workout ownership)
CREATE POLICY "Users can view own exercises"
    ON exercises FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workouts
            WHERE workouts.id = exercises.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own exercises"
    ON exercises FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workouts
            WHERE workouts.id = exercises.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own exercises"
    ON exercises FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM workouts
            WHERE workouts.id = exercises.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own exercises"
    ON exercises FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM workouts
            WHERE workouts.id = exercises.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

-- ============================================
-- GOALS TABLE
-- ============================================
-- User-defined training goals

CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL,
    target_value DECIMAL(10,2) NOT NULL CHECK (target_value > 0),
    current_value DECIMAL(10,2) DEFAULT 0 CHECK (current_value >= 0),
    deadline DATE,
    is_completed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own goals"
    ON goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
    ON goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
    ON goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
    ON goals FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- STRENGTH TESTS TABLE
-- ============================================
-- Periodic strength assessment results

CREATE TABLE IF NOT EXISTS strength_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL,
    result_value DECIMAL(10,2) NOT NULL CHECK (result_value > 0),
    result_unit TEXT DEFAULT 'lbs' CHECK (result_unit IN ('lbs', 'kg')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE strength_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tests"
    ON strength_tests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tests"
    ON strength_tests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests"
    ON strength_tests FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tests"
    ON strength_tests FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- BODY MEASUREMENTS TABLE
-- ============================================
-- Physical measurements over time

CREATE TABLE IF NOT EXISTS body_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    weight DECIMAL(10,2) CHECK (weight > 0),
    weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
    arm_circumference DECIMAL(10,2) CHECK (arm_circumference > 0),
    forearm_circumference DECIMAL(10,2) CHECK (forearm_circumference > 0),
    wrist_circumference DECIMAL(10,2) CHECK (wrist_circumference > 0),
    notes TEXT,
    measured_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own measurements"
    ON body_measurements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements"
    ON body_measurements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements"
    ON body_measurements FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements"
    ON body_measurements FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- SCHEDULED TRAININGS TABLE
-- ============================================
-- Planned future workout sessions

CREATE TABLE IF NOT EXISTS scheduled_trainings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    notification_enabled BOOLEAN DEFAULT true,
    notification_minutes_before INTEGER DEFAULT 30 CHECK (notification_minutes_before >= 0),
    notification_id TEXT,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scheduled_trainings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own schedules"
    ON scheduled_trainings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
    ON scheduled_trainings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
    ON scheduled_trainings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
    ON scheduled_trainings FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
-- Create indexes on foreign keys and commonly queried columns

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);

-- Cycles indexes
CREATE INDEX IF NOT EXISTS idx_cycles_user_id ON cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_cycles_is_active ON cycles(is_active);
CREATE INDEX IF NOT EXISTS idx_cycles_date_range ON cycles(start_date, end_date);

-- Workouts indexes
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_cycle_id ON workouts(cycle_id);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON workouts(created_at DESC);

-- Exercises indexes
CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON exercises(workout_id);

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_is_completed ON goals(is_completed);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);

-- Strength tests indexes
CREATE INDEX IF NOT EXISTS idx_strength_tests_user_id ON strength_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_strength_tests_created_at ON strength_tests(created_at DESC);

-- Body measurements indexes
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_id ON body_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_measured_at ON body_measurements(measured_at DESC);

-- Scheduled trainings indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_trainings_user_id ON scheduled_trainings(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_trainings_date ON scheduled_trainings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_trainings_completed ON scheduled_trainings(completed);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Service role gets all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to get user's active cycle
CREATE OR REPLACE FUNCTION get_active_cycle(user_uuid UUID)
RETURNS UUID AS $$
    SELECT id FROM cycles
    WHERE user_id = user_uuid
    AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to calculate goal progress percentage
CREATE OR REPLACE FUNCTION goal_progress_percentage(goal_id UUID)
RETURNS DECIMAL AS $$
    SELECT ROUND(
        (current_value / NULLIF(target_value, 0)) * 100,
        2
    ) FROM goals WHERE id = goal_id;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE profiles IS 'User profiles with preferences and premium status';
COMMENT ON TABLE cycles IS 'Training cycles for periodized programming';
COMMENT ON TABLE workouts IS 'Individual workout sessions';
COMMENT ON TABLE exercises IS 'Exercises performed within a workout';
COMMENT ON TABLE goals IS 'User-defined training goals with progress tracking';
COMMENT ON TABLE strength_tests IS 'Periodic strength assessment results';
COMMENT ON TABLE body_measurements IS 'Physical measurements tracked over time';
COMMENT ON TABLE scheduled_trainings IS 'Planned future workout sessions';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Schema version: 1.0.0
-- All tables created with RLS enabled
-- Indexes created for optimal query performance
-- Permissions granted appropriately
-- ============================================
