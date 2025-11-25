-- Migration: Add sync tracking columns to all tables
-- This enables offline-first sync with modified_at timestamps

-- Add modified_at to workouts (if not exists)
ALTER TABLE public.workouts 
ADD COLUMN IF NOT EXISTS modified_at timestamp with time zone DEFAULT now();

-- Add modified_at to cycles
ALTER TABLE public.cycles 
ADD COLUMN IF NOT EXISTS modified_at timestamp with time zone DEFAULT now();

-- Add modified_at to goals
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS modified_at timestamp with time zone DEFAULT now();

-- Add modified_at to body_measurements
ALTER TABLE public.body_measurements 
ADD COLUMN IF NOT EXISTS modified_at timestamp with time zone DEFAULT now();

-- Add modified_at to strength_tests
ALTER TABLE public.strength_tests 
ADD COLUMN IF NOT EXISTS modified_at timestamp with time zone DEFAULT now();

-- Add modified_at to scheduled_trainings (already has updated_at, but add modified_at for consistency)
ALTER TABLE public.scheduled_trainings 
ADD COLUMN IF NOT EXISTS modified_at timestamp with time zone DEFAULT now();

-- Add modified_at to exercises
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS modified_at timestamp with time zone DEFAULT now();

-- Add modified_at to profiles (already has updated_at, but add modified_at for consistency)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS modified_at timestamp with time zone DEFAULT now();

-- Create triggers to auto-update modified_at on any change
-- This ensures we can track the last modification time for sync

CREATE OR REPLACE FUNCTION update_modified_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Workouts trigger
DROP TRIGGER IF EXISTS update_workouts_modified_at ON public.workouts;
CREATE TRIGGER update_workouts_modified_at
    BEFORE UPDATE ON public.workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- Cycles trigger
DROP TRIGGER IF EXISTS update_cycles_modified_at ON public.cycles;
CREATE TRIGGER update_cycles_modified_at
    BEFORE UPDATE ON public.cycles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- Goals trigger
DROP TRIGGER IF EXISTS update_goals_modified_at ON public.goals;
CREATE TRIGGER update_goals_modified_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- Body measurements trigger
DROP TRIGGER IF EXISTS update_body_measurements_modified_at ON public.body_measurements;
CREATE TRIGGER update_body_measurements_modified_at
    BEFORE UPDATE ON public.body_measurements
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- Strength tests trigger
DROP TRIGGER IF EXISTS update_strength_tests_modified_at ON public.strength_tests;
CREATE TRIGGER update_strength_tests_modified_at
    BEFORE UPDATE ON public.strength_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- Scheduled trainings trigger
DROP TRIGGER IF EXISTS update_scheduled_trainings_modified_at ON public.scheduled_trainings;
CREATE TRIGGER update_scheduled_trainings_modified_at
    BEFORE UPDATE ON public.scheduled_trainings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- Exercises trigger
DROP TRIGGER IF EXISTS update_exercises_modified_at ON public.exercises;
CREATE TRIGGER update_exercises_modified_at
    BEFORE UPDATE ON public.exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- Profiles trigger
DROP TRIGGER IF EXISTS update_profiles_modified_at ON public.profiles;
CREATE TRIGGER update_profiles_modified_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- Create indexes on modified_at for efficient sync queries
CREATE INDEX IF NOT EXISTS idx_workouts_modified_at ON public.workouts(modified_at);
CREATE INDEX IF NOT EXISTS idx_cycles_modified_at ON public.cycles(modified_at);
CREATE INDEX IF NOT EXISTS idx_goals_modified_at ON public.goals(modified_at);
CREATE INDEX IF NOT EXISTS idx_body_measurements_modified_at ON public.body_measurements(modified_at);
CREATE INDEX IF NOT EXISTS idx_strength_tests_modified_at ON public.strength_tests(modified_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_trainings_modified_at ON public.scheduled_trainings(modified_at);
CREATE INDEX IF NOT EXISTS idx_exercises_modified_at ON public.exercises(modified_at);

-- Backfill modified_at with updated_at where available, otherwise created_at
UPDATE public.workouts SET modified_at = COALESCE(updated_at, created_at) WHERE modified_at IS NULL;
UPDATE public.cycles SET modified_at = COALESCE(updated_at, created_at) WHERE modified_at IS NULL;
UPDATE public.goals SET modified_at = created_at WHERE modified_at IS NULL;
UPDATE public.body_measurements SET modified_at = created_at WHERE modified_at IS NULL;
UPDATE public.strength_tests SET modified_at = created_at WHERE modified_at IS NULL;
UPDATE public.scheduled_trainings SET modified_at = COALESCE(updated_at, created_at) WHERE modified_at IS NULL;
UPDATE public.exercises SET modified_at = created_at WHERE modified_at IS NULL;
UPDATE public.profiles SET modified_at = COALESCE(updated_at, created_at) WHERE modified_at IS NULL;

COMMENT ON COLUMN public.workouts.modified_at IS 'Timestamp of last modification, used for sync tracking';
COMMENT ON COLUMN public.cycles.modified_at IS 'Timestamp of last modification, used for sync tracking';
COMMENT ON COLUMN public.goals.modified_at IS 'Timestamp of last modification, used for sync tracking';

