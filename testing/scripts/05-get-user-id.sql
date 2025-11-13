-- ============================================
-- GET YOUR USER ID
-- ============================================
-- Use this script to find your user ID
-- Run this in Supabase SQL Editor

-- Find user by email
SELECT
  id,
  email,
  full_name,
  is_premium,
  is_test_user,
  created_at
FROM profiles
WHERE email = 'your-email@example.com';

-- Or list all users
SELECT
  id,
  email,
  full_name,
  is_premium,
  is_test_user,
  created_at
FROM profiles
ORDER BY created_at DESC;
