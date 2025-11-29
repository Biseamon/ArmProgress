-- Run this in Supabase SQL Editor to verify the migration was applied

-- 1. Check if modified_at column exists
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('friends', 'friend_invites', 'groups', 'group_members', 'group_invites', 'feed_posts', 'feed_reactions')
  AND column_name IN ('modified_at', 'deleted')
ORDER BY table_name, column_name;

-- 2. Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('friends', 'friend_invites', 'groups', 'group_members', 'group_invites', 'feed_posts', 'feed_reactions')
ORDER BY tablename, cmd, policyname;

-- 3. Check triggers
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('friends', 'friend_invites', 'groups', 'group_members', 'group_invites', 'feed_posts', 'feed_reactions')
ORDER BY event_object_table;
