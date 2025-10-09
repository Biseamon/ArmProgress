/*
  # Add Profile Insert Policy

  This migration adds a policy to allow users to insert their own profile during signup.

  ## Changes
  - Add INSERT policy for profiles table
  - Allows authenticated users to create their own profile

  ## Security
  - Users can only insert a profile with their own user ID
  - Maintains data security while allowing signup
*/

-- Add insert policy for profiles
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
