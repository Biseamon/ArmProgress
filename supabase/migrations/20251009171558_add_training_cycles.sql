/*
  # Add Training Cycles

  ## Overview
  This migration adds training cycles support, allowing users to organize their workouts
  into structured training periods (e.g., competition prep, rehab, off-season).

  ## New Tables

  ### `cycles`
  - `id` (uuid, primary key) - Unique cycle identifier
  - `user_id` (uuid, foreign key) - References profiles.id
  - `name` (text) - Cycle name (e.g., "Competition Prep 2025")
  - `description` (text) - Cycle description/notes
  - `cycle_type` (text) - Type of cycle (competition_prep, rehab, strength_building, etc.)
  - `start_date` (date) - Cycle start date
  - `end_date` (date) - Cycle end date
  - `is_active` (boolean) - Whether this is the current active cycle
  - `created_at` (timestamptz) - Creation timestamp

  ## Changes to Existing Tables

  ### `workouts`
  - Add `cycle_id` (uuid, nullable) - Links workout to a cycle

  ## Security
  - RLS enabled on cycles table
  - Users can only access their own cycles
  - Workouts maintain existing security with cycle linkage
*/

-- Create cycles table
CREATE TABLE IF NOT EXISTS cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  cycle_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;

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

-- Add cycle_id to workouts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'cycle_id'
  ) THEN
    ALTER TABLE workouts ADD COLUMN cycle_id uuid REFERENCES cycles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cycles_user_id ON cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_cycles_dates ON cycles(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_cycles_active ON cycles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workouts_cycle_id ON workouts(cycle_id);
