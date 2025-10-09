/*
  # Arm Wrestling Training App Schema

  ## Overview
  This migration creates the complete database schema for an arm wrestling training app
  with user authentication, workout tracking, goals, and premium subscription management.

  ## New Tables

  ### `profiles`
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `is_premium` (boolean) - Premium subscription status
  - `is_test_user` (boolean) - Flag for test users with premium access
  - `created_at` (timestamptz) - Account creation date
  - `updated_at` (timestamptz) - Last profile update

  ### `workouts`
  - `id` (uuid, primary key) - Unique workout identifier
  - `user_id` (uuid, foreign key) - References profiles.id
  - `workout_type` (text) - Type of exercise (e.g., 'table_practice', 'strength', 'technique')
  - `duration_minutes` (integer) - Workout duration
  - `intensity` (integer) - Intensity level (1-10)
  - `notes` (text) - Additional workout notes
  - `created_at` (timestamptz) - Workout date

  ### `exercises`
  - `id` (uuid, primary key) - Unique exercise identifier
  - `workout_id` (uuid, foreign key) - References workouts.id
  - `exercise_name` (text) - Name of exercise
  - `sets` (integer) - Number of sets
  - `reps` (integer) - Number of reps
  - `weight_lbs` (integer) - Weight used
  - `notes` (text) - Exercise-specific notes

  ### `goals`
  - `id` (uuid, primary key) - Unique goal identifier
  - `user_id` (uuid, foreign key) - References profiles.id
  - `goal_type` (text) - Type of goal
  - `target_value` (integer) - Target value to achieve
  - `current_value` (integer) - Current progress value
  - `deadline` (date) - Goal deadline
  - `is_completed` (boolean) - Completion status
  - `created_at` (timestamptz) - Goal creation date

  ### `strength_tests`
  - `id` (uuid, primary key) - Unique test identifier
  - `user_id` (uuid, foreign key) - References profiles.id
  - `test_type` (text) - Type of strength test
  - `result_value` (integer) - Test result
  - `notes` (text) - Test notes
  - `created_at` (timestamptz) - Test date

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Authenticated users required for all operations
  - Test users have premium access regardless of subscription status
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  is_premium boolean DEFAULT false,
  is_test_user boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_type text NOT NULL,
  duration_minutes integer DEFAULT 0,
  intensity integer DEFAULT 5,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

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

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  sets integer DEFAULT 0,
  reps integer DEFAULT 0,
  weight_lbs integer DEFAULT 0,
  notes text DEFAULT ''
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

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

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type text NOT NULL,
  target_value integer NOT NULL,
  current_value integer DEFAULT 0,
  deadline date,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

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

-- Create strength_tests table
CREATE TABLE IF NOT EXISTS strength_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  test_type text NOT NULL,
  result_value integer NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE strength_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strength tests"
  ON strength_tests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strength tests"
  ON strength_tests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strength tests"
  ON strength_tests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own strength tests"
  ON strength_tests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON workouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_strength_tests_user_id ON strength_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_strength_tests_created_at ON strength_tests(created_at DESC);
