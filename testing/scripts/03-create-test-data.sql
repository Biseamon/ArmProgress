-- ============================================
-- CREATE SAMPLE TEST DATA
-- ============================================
-- Use this script to populate your account with test data
-- Run this in Supabase SQL Editor
-- Replace 'YOUR_USER_ID' with your actual user ID from profiles table

-- Set your user ID here
DO $$
DECLARE
  test_user_id UUID := 'YOUR_USER_ID'; -- ⚠️ REPLACE THIS
  workout_id UUID;
  cycle_id UUID;
  goal_id UUID;
BEGIN

  -- ============================================
  -- 1. CREATE SAMPLE WORKOUTS
  -- ============================================

  -- Recent workouts (last 2 weeks)
  INSERT INTO workouts (user_id, workout_type, duration_minutes, intensity, notes, created_at)
  VALUES
    (test_user_id, 'strength', 45, 8, 'Great session, felt strong!', NOW() - INTERVAL '1 day'),
    (test_user_id, 'technique', 30, 6, 'Worked on hook technique', NOW() - INTERVAL '2 days'),
    (test_user_id, 'endurance', 60, 7, 'Long endurance session', NOW() - INTERVAL '4 days'),
    (test_user_id, 'strength', 50, 9, 'PR day! Hit new max', NOW() - INTERVAL '5 days'),
    (test_user_id, 'sparring', 40, 8, 'Sparring with training partner', NOW() - INTERVAL '7 days'),
    (test_user_id, 'technique', 35, 6, 'Refined top roll', NOW() - INTERVAL '9 days'),
    (test_user_id, 'strength', 45, 7, 'Regular strength training', NOW() - INTERVAL '11 days'),
    (test_user_id, 'endurance', 55, 6, 'Building stamina', NOW() - INTERVAL '13 days');

  -- Older workouts (last 2 months)
  FOR i IN 15..60 BY 3 LOOP
    INSERT INTO workouts (user_id, workout_type, duration_minutes, intensity, created_at)
    VALUES (
      test_user_id,
      CASE (RANDOM() * 4)::INT
        WHEN 0 THEN 'strength'
        WHEN 1 THEN 'technique'
        WHEN 2 THEN 'endurance'
        ELSE 'sparring'
      END,
      30 + (RANDOM() * 40)::INT,
      5 + (RANDOM() * 5)::INT,
      NOW() - (i || ' days')::INTERVAL
    );
  END LOOP;

  -- ============================================
  -- 2. CREATE TRAINING CYCLE
  -- ============================================

  INSERT INTO cycles (user_id, name, cycle_type, start_date, end_date, description, is_active)
  VALUES (
    test_user_id,
    'Pre-Competition Strength',
    'strength',
    CURRENT_DATE - INTERVAL '2 weeks',
    CURRENT_DATE + INTERVAL '6 weeks',
    'Building maximum strength for upcoming competition. Focus on heavy compounds and specific arm wrestling movements.',
    true
  )
  RETURNING id INTO cycle_id;

  -- ============================================
  -- 3. CREATE GOALS
  -- ============================================

  -- Active goals
  INSERT INTO goals (user_id, goal_type, target_value, current_value, deadline, notes, is_completed)
  VALUES
    (test_user_id, 'Win 10 matches', 10, 6, CURRENT_DATE + INTERVAL '3 months', 'Tournament prep goal', false),
    (test_user_id, 'Train 20 times this month', 20, 12, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month', 'Consistency goal', false),
    (test_user_id, 'Max wrist curl 100 lbs', 100, 85, CURRENT_DATE + INTERVAL '2 months', 'Strength milestone', false);

  -- Completed goals
  INSERT INTO goals (user_id, goal_type, target_value, current_value, deadline, notes, is_completed, created_at)
  VALUES
    (test_user_id, 'Master hook technique', 1, 1, CURRENT_DATE - INTERVAL '1 week', 'Technique goal achieved!', true, NOW() - INTERVAL '2 months'),
    (test_user_id, 'Train 15 times last month', 15, 15, CURRENT_DATE - INTERVAL '1 month', 'Consistency achieved', true, NOW() - INTERVAL '2 months');

  -- ============================================
  -- 4. CREATE PR TESTS (Strength Tests)
  -- ============================================

  -- Max Wrist Curl progression
  INSERT INTO tests (user_id, test_type, result_value, unit, notes, created_at)
  VALUES
    (test_user_id, 'max_wrist_curl', 85, 'lbs', 'New PR!', NOW() - INTERVAL '1 day'),
    (test_user_id, 'max_wrist_curl', 82, 'lbs', 'Getting stronger', NOW() - INTERVAL '1 week'),
    (test_user_id, 'max_wrist_curl', 80, 'lbs', 'Solid lift', NOW() - INTERVAL '2 weeks'),
    (test_user_id, 'max_wrist_curl', 78, 'lbs', 'Building up', NOW() - INTERVAL '3 weeks');

  -- Static Hold progression
  INSERT INTO tests (user_id, test_type, result_value, unit, notes, created_at)
  VALUES
    (test_user_id, 'static_hold', 45, 'seconds', 'Endurance improving', NOW() - INTERVAL '2 days'),
    (test_user_id, 'static_hold', 42, 'seconds', 'Good hold', NOW() - INTERVAL '1 week'),
    (test_user_id, 'static_hold', 38, 'seconds', 'Starting point', NOW() - INTERVAL '2 weeks');

  -- Arm Curl progression
  INSERT INTO tests (user_id, test_type, result_value, unit, notes, created_at)
  VALUES
    (test_user_id, 'arm_curl', 50, 'lbs', 'Strong curl', NOW() - INTERVAL '3 days'),
    (test_user_id, 'arm_curl', 48, 'lbs', 'Consistent', NOW() - INTERVAL '10 days');

  -- ============================================
  -- 5. CREATE SCHEDULED TRAININGS
  -- ============================================

  -- Upcoming training sessions
  INSERT INTO scheduled_trainings (user_id, title, scheduled_date, scheduled_time, description, notification_enabled, notification_minutes_before, completed)
  VALUES
    (test_user_id, 'Strength Training', CURRENT_DATE + INTERVAL '1 day', '18:00:00', 'Heavy compounds - focus on wrist and forearm', true, 30, false),
    (test_user_id, 'Technique Practice', CURRENT_DATE + INTERVAL '2 days', '17:30:00', 'Work on top roll and hook transitions', true, 30, false),
    (test_user_id, 'Sparring Session', CURRENT_DATE + INTERVAL '4 days', '19:00:00', 'Practice with John - tournament simulation', true, 60, false),
    (test_user_id, 'Recovery Session', CURRENT_DATE + INTERVAL '5 days', '10:00:00', 'Light technique and stretching', true, 30, false);

  RAISE NOTICE 'Test data created successfully!';
  RAISE NOTICE 'Created workouts, cycle, goals, PRs, and scheduled trainings for user: %', test_user_id;

END $$;

-- Verify the data
SELECT 'Workouts' as type, COUNT(*) as count FROM workouts WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Cycles', COUNT(*) FROM cycles WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Goals', COUNT(*) FROM goals WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Tests', COUNT(*) FROM tests WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Scheduled', COUNT(*) FROM scheduled_trainings WHERE user_id = 'YOUR_USER_ID';
