-- ============================================
-- REVOKE PREMIUM ACCESS FROM USER
-- ============================================
-- Use this script to remove premium access for testing free tier
-- Run this in Supabase SQL Editor

-- OPTION 1: Revoke premium by email
UPDATE profiles
SET
  is_premium = false,
  is_test_user = false,
  updated_at = now()
WHERE email = 'your-email@example.com';

-- OPTION 2: Revoke premium by user ID
-- UPDATE profiles
-- SET
--   is_premium = false,
--   is_test_user = false,
--   updated_at = now()
-- WHERE id = 'user-id-here';

-- OPTION 3: Revoke premium from ALL users (use carefully!)
-- UPDATE profiles
-- SET
--   is_premium = false,
--   is_test_user = false,
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
WHERE email = 'your-email@example.com';
