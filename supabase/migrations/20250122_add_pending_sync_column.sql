-- Migration: Add pending_sync column for offline sync tracking
-- This enables proper sync of local changes to Supabase

-- Add pending_sync to all tables that need it
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS pending_sync boolean DEFAULT false;

ALTER TABLE public.body_measurements
ADD COLUMN IF NOT EXISTS pending_sync boolean DEFAULT false;

ALTER TABLE public.strength_tests
ADD COLUMN IF NOT EXISTS pending_sync boolean DEFAULT false;

ALTER TABLE public.scheduled_trainings
ADD COLUMN IF NOT EXISTS pending_sync boolean DEFAULT false;

ALTER TABLE public.cycles
ADD COLUMN IF NOT EXISTS pending_sync boolean DEFAULT false;

ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS pending_sync boolean DEFAULT false;

-- Set default value for existing rows
UPDATE public.goals SET pending_sync = false WHERE pending_sync IS NULL;
UPDATE public.body_measurements SET pending_sync = false WHERE pending_sync IS NULL;
UPDATE public.strength_tests SET pending_sync = false WHERE pending_sync IS NULL;
UPDATE public.scheduled_trainings SET pending_sync = false WHERE pending_sync IS NULL;
UPDATE public.cycles SET pending_sync = false WHERE pending_sync IS NULL;
UPDATE public.exercises SET pending_sync = false WHERE pending_sync IS NULL;

COMMENT ON COLUMN public.goals.pending_sync IS 'Flag for pending changes to sync';
COMMENT ON COLUMN public.body_measurements.pending_sync IS 'Flag for pending changes to sync';
COMMENT ON COLUMN public.strength_tests.pending_sync IS 'Flag for pending changes to sync';
COMMENT ON COLUMN public.scheduled_trainings.pending_sync IS 'Flag for pending changes to sync';
COMMENT ON COLUMN public.cycles.pending_sync IS 'Flag for pending changes to sync';
COMMENT ON COLUMN public.exercises.pending_sync IS 'Flag for pending changes to sync';

