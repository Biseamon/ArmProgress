-- ============================================
-- GRANT PREMIUM ACCESS TO USER
-- ============================================
-- Use this script to give premium access to any user for testing
-- Run this in Supabase SQL Editor

-- OPTION 1: Grant premium by email
UPDATE profiles
SET
  is_premium = true,
  is_test_user = true,
  updated_at = now()
WHERE email = 'your-email@example.com';

-- OPTION 2: Grant premium by user ID
-- UPDATE profiles
-- SET
--   is_premium = true,
--   is_test_user = true,
--   updated_at = now()
-- WHERE id = 'user-id-here';

-- OPTION 3: Grant premium to ALL users (use carefully!)
-- UPDATE profiles
-- SET
--   is_premium = true,
--   is_test_user = true,
--   updated_at = now();

-- Verify the change
SELECT
  id,
  email,
  full_name,
  is_premium,
  is_test_user,
  created_at,
  updated_at
FROM profiles
WHERE is_premium = true
ORDER BY updated_at DESC;
