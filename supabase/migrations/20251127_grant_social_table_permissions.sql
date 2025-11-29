-- ============================================
-- FIX SOCIAL TABLES PERMISSIONS
-- ============================================
-- Root Cause: Social tables created in 20250304_activity_feature.sql
-- were never granted table-level permissions to the authenticated role.
-- This causes RLS policy EXISTS checks to fail with "permission denied"
-- even though the policies themselves are correct.
--
-- This migration grants the same permissions that working tables
-- (workouts, goals, etc.) received in 20250123_fix_rls_permissions.sql
-- ============================================

-- CRITICAL: Grant table-level permissions to authenticated role
-- Without these grants, RLS policies with EXISTS subqueries fail
-- with "permission denied for table" errors

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.friends TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.friend_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.group_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.feed_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.feed_reactions TO authenticated;

-- Also grant SELECT to anon role for read-only operations (consistent with other tables)
GRANT SELECT ON TABLE public.friends TO anon;
GRANT SELECT ON TABLE public.friend_invites TO anon;
GRANT SELECT ON TABLE public.groups TO anon;
GRANT SELECT ON TABLE public.group_members TO anon;
GRANT SELECT ON TABLE public.group_invites TO anon;
GRANT SELECT ON TABLE public.feed_posts TO anon;
GRANT SELECT ON TABLE public.feed_reactions TO anon;

-- Grant execute permissions on helper functions
-- The is_group_member function needs to be callable by authenticated users
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;

-- Verify RLS is enabled (should already be enabled, but ensure it)
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.friends IS 'Friendship relationships between users - synced with offline support';
COMMENT ON TABLE public.friend_invites IS 'Friend invitations sent via email - synced with offline support';
COMMENT ON TABLE public.groups IS 'User groups for collaborative training - synced with offline support';
COMMENT ON TABLE public.group_members IS 'Group membership records - synced with offline support';
COMMENT ON TABLE public.group_invites IS 'Group invitations - synced with offline support';
COMMENT ON TABLE public.feed_posts IS 'Social feed posts (goals, PRs, summaries) - synced with offline support';
COMMENT ON TABLE public.feed_reactions IS 'Reactions to feed posts - synced with offline support';
