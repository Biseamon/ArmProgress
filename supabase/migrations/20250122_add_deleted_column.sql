-- Migration: Add deleted column for soft delete support
-- This enables offline-first sync with proper delete tracking

-- Add deleted to goals
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Add deleted to body_measurements
ALTER TABLE public.body_measurements
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Add deleted to strength_tests
ALTER TABLE public.strength_tests
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Add deleted to scheduled_trainings
ALTER TABLE public.scheduled_trainings
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Add deleted to cycles (if not exists)
ALTER TABLE public.cycles
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Add deleted to exercises (if not exists)
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Create indexes for efficient queries (exclude deleted by default)
CREATE INDEX IF NOT EXISTS idx_goals_deleted ON public.goals(deleted);
CREATE INDEX IF NOT EXISTS idx_body_measurements_deleted ON public.body_measurements(deleted);
CREATE INDEX IF NOT EXISTS idx_strength_tests_deleted ON public.strength_tests(deleted);
CREATE INDEX IF NOT EXISTS idx_scheduled_trainings_deleted ON public.scheduled_trainings(deleted);
CREATE INDEX IF NOT EXISTS idx_cycles_deleted ON public.cycles(deleted);
CREATE INDEX IF NOT EXISTS idx_exercises_deleted ON public.exercises(deleted);

COMMENT ON COLUMN public.goals.deleted IS 'Soft delete flag for sync tracking';
COMMENT ON COLUMN public.body_measurements.deleted IS 'Soft delete flag for sync tracking';
COMMENT ON COLUMN public.strength_tests.deleted IS 'Soft delete flag for sync tracking';
COMMENT ON COLUMN public.scheduled_trainings.deleted IS 'Soft delete flag for sync tracking';
COMMENT ON COLUMN public.cycles.deleted IS 'Soft delete flag for sync tracking';
COMMENT ON COLUMN public.exercises.deleted IS 'Soft delete flag for sync tracking';

