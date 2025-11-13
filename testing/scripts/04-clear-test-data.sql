-- ============================================
-- CLEAR TEST DATA
-- ============================================
-- Use this script to remove all test data from your account
-- Run this in Supabase SQL Editor
-- ⚠️ WARNING: This will delete ALL your data!

-- Replace with your user ID
DO $$
DECLARE
  test_user_id UUID := 'YOUR_USER_ID'; -- ⚠️ REPLACE THIS
BEGIN

  -- Delete scheduled trainings
  DELETE FROM scheduled_trainings WHERE user_id = test_user_id;
  RAISE NOTICE 'Deleted scheduled trainings';

  -- Delete tests (PRs)
  DELETE FROM tests WHERE user_id = test_user_id;
  RAISE NOTICE 'Deleted tests/PRs';

  -- Delete goals
  DELETE FROM goals WHERE user_id = test_user_id;
  RAISE NOTICE 'Deleted goals';

  -- Delete workouts
  DELETE FROM workouts WHERE user_id = test_user_id;
  RAISE NOTICE 'Deleted workouts';

  -- Delete cycles
  DELETE FROM cycles WHERE user_id = test_user_id;
  RAISE NOTICE 'Deleted cycles';

  RAISE NOTICE 'All test data cleared for user: %', test_user_id;

END $$;

-- Verify deletion
SELECT 'Workouts' as type, COUNT(*) as remaining FROM workouts WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Cycles', COUNT(*) FROM cycles WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Goals', COUNT(*) FROM goals WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Tests', COUNT(*) FROM tests WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Scheduled', COUNT(*) FROM scheduled_trainings WHERE user_id = 'YOUR_USER_ID';
