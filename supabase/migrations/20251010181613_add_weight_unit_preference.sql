/*
  # Add Weight Unit Preference

  ## Overview
  This migration adds a weight unit preference field to the profiles table,
  allowing users to choose between lbs and kg for displaying weights.

  ## Changes

  ### Profiles Table
  - Add `weight_unit` (text) - User's preferred weight unit ('lbs' or 'kg')
  - Default value is 'lbs'

  ## Notes
  - The weight_unit field will be used throughout the app to display weights
  - All stored weights remain in lbs in the database
  - Conversion to kg happens in the UI layer
*/

-- Add weight_unit column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'weight_unit'
  ) THEN
    ALTER TABLE profiles ADD COLUMN weight_unit text DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg'));
  END IF;
END $$;
