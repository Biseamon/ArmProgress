-- Emergency fix for RLS permission denied errors
-- This ensures all social tables have proper INSERT, UPDATE, DELETE policies

-- ==========================================
-- FRIENDS TABLE
-- ==========================================

-- Ensure RLS is enabled
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS friends_select_policy ON public.friends;
DROP POLICY IF EXISTS friends_insert_policy ON public.friends;
DROP POLICY IF EXISTS friends_update_policy ON public.friends;
DROP POLICY IF EXISTS friends_delete_policy ON public.friends;

-- Recreate with proper permissions
CREATE POLICY friends_select_policy ON public.friends
  FOR SELECT USING (
    auth.uid() is not null
    AND (user_id = auth.uid() OR friend_user_id = auth.uid())
  );

CREATE POLICY friends_insert_policy ON public.friends
  FOR INSERT WITH CHECK (
    auth.uid() is not null
    AND (user_id = auth.uid() OR friend_user_id = auth.uid())
  );

CREATE POLICY friends_update_policy ON public.friends
  FOR UPDATE USING (
    auth.uid() is not null
    AND (user_id = auth.uid() OR friend_user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() is not null
    AND (user_id = auth.uid() OR friend_user_id = auth.uid())
  );

CREATE POLICY friends_delete_policy ON public.friends
  FOR DELETE USING (
    auth.uid() is not null
    AND (user_id = auth.uid() OR friend_user_id = auth.uid())
  );

-- ==========================================
-- FRIEND_INVITES TABLE
-- ==========================================

ALTER TABLE public.friend_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS friend_invites_select_policy ON public.friend_invites;
DROP POLICY IF EXISTS friend_invites_insert_policy ON public.friend_invites;
DROP POLICY IF EXISTS friend_invites_update_policy ON public.friend_invites;
DROP POLICY IF EXISTS friend_invites_delete_policy ON public.friend_invites;

CREATE POLICY friend_invites_select_policy ON public.friend_invites
  FOR SELECT USING (
    auth.uid() is not null
    AND inviter_id = auth.uid()
  );

CREATE POLICY friend_invites_insert_policy ON public.friend_invites
  FOR INSERT WITH CHECK (
    auth.uid() is not null
    AND inviter_id = auth.uid()
  );

CREATE POLICY friend_invites_update_policy ON public.friend_invites
  FOR UPDATE USING (
    auth.uid() is not null
    AND inviter_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() is not null
    AND inviter_id = auth.uid()
  );

CREATE POLICY friend_invites_delete_policy ON public.friend_invites
  FOR DELETE USING (
    auth.uid() is not null
    AND inviter_id = auth.uid()
  );

-- ==========================================
-- GROUPS TABLE
-- ==========================================

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS groups_select_policy ON public.groups;
DROP POLICY IF EXISTS groups_insert_policy ON public.groups;
DROP POLICY IF EXISTS groups_update_policy ON public.groups;
DROP POLICY IF EXISTS groups_delete_policy ON public.groups;

CREATE POLICY groups_select_policy ON public.groups
  FOR SELECT USING (
    visibility = 'public'
    OR owner_id = auth.uid()
    OR public.is_group_member(id, auth.uid())
  );

CREATE POLICY groups_insert_policy ON public.groups
  FOR INSERT WITH CHECK (
    auth.uid() is not null
    AND owner_id = auth.uid()
  );

CREATE POLICY groups_update_policy ON public.groups
  FOR UPDATE USING (
    auth.uid() is not null
    AND owner_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() is not null
    AND owner_id = auth.uid()
  );

CREATE POLICY groups_delete_policy ON public.groups
  FOR DELETE USING (
    auth.uid() is not null
    AND owner_id = auth.uid()
  );

-- ==========================================
-- GROUP_MEMBERS TABLE
-- ==========================================

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS group_members_select_policy ON public.group_members;
DROP POLICY IF EXISTS group_members_insert_policy ON public.group_members;
DROP POLICY IF EXISTS group_members_update_policy ON public.group_members;
DROP POLICY IF EXISTS group_members_delete_policy ON public.group_members;

CREATE POLICY group_members_select_policy ON public.group_members
  FOR SELECT USING (
    auth.uid() is not null
    AND (
      user_id = auth.uid()
      OR public.is_group_member(group_id, auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = group_members.group_id
          AND g.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY group_members_insert_policy ON public.group_members
  FOR INSERT WITH CHECK (
    auth.uid() is not null
    AND user_id = auth.uid()
  );

CREATE POLICY group_members_update_policy ON public.group_members
  FOR UPDATE USING (
    auth.uid() is not null
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = group_members.group_id
          AND g.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (true);

CREATE POLICY group_members_delete_policy ON public.group_members
  FOR DELETE USING (
    auth.uid() is not null
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = group_members.group_id
          AND g.owner_id = auth.uid()
      )
    )
  );

-- ==========================================
-- GROUP_INVITES TABLE
-- ==========================================

ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS group_invites_select_policy ON public.group_invites;
DROP POLICY IF EXISTS group_invites_insert_policy ON public.group_invites;
DROP POLICY IF EXISTS group_invites_update_policy ON public.group_invites;
DROP POLICY IF EXISTS group_invites_delete_policy ON public.group_invites;

CREATE POLICY group_invites_select_policy ON public.group_invites
  FOR SELECT USING (
    auth.uid() is not null
    AND (
      inviter_id = auth.uid()
      OR invitee_user_id = auth.uid()
      OR public.is_group_member(group_id, auth.uid())
    )
  );

CREATE POLICY group_invites_insert_policy ON public.group_invites
  FOR INSERT WITH CHECK (
    auth.uid() is not null
    AND inviter_id = auth.uid()
  );

CREATE POLICY group_invites_update_policy ON public.group_invites
  FOR UPDATE USING (
    auth.uid() is not null
    AND (inviter_id = auth.uid() OR invitee_user_id = auth.uid())
  )
  WITH CHECK (true);

CREATE POLICY group_invites_delete_policy ON public.group_invites
  FOR DELETE USING (
    auth.uid() is not null
    AND (inviter_id = auth.uid() OR invitee_user_id = auth.uid())
  );

-- ==========================================
-- FEED_POSTS TABLE
-- ==========================================

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feed_posts_select_policy ON public.feed_posts;
DROP POLICY IF EXISTS feed_posts_insert_policy ON public.feed_posts;
DROP POLICY IF EXISTS feed_posts_update_policy ON public.feed_posts;
DROP POLICY IF EXISTS feed_posts_delete_policy ON public.feed_posts;

CREATE POLICY feed_posts_select_policy ON public.feed_posts
  FOR SELECT USING (
    auth.uid() is not null
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.friends f
        WHERE ((f.user_id = auth.uid() AND f.friend_user_id = feed_posts.user_id)
          OR (f.friend_user_id = auth.uid() AND f.user_id = feed_posts.user_id))
          AND f.status = 'accepted'
      )
      OR (
        feed_posts.group_id IS NOT NULL
        AND public.is_group_member(feed_posts.group_id, auth.uid())
      )
    )
  );

CREATE POLICY feed_posts_insert_policy ON public.feed_posts
  FOR INSERT WITH CHECK (
    auth.uid() is not null
    AND user_id = auth.uid()
  );

CREATE POLICY feed_posts_update_policy ON public.feed_posts
  FOR UPDATE USING (
    auth.uid() is not null
    AND user_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() is not null
    AND user_id = auth.uid()
  );

CREATE POLICY feed_posts_delete_policy ON public.feed_posts
  FOR DELETE USING (
    auth.uid() is not null
    AND user_id = auth.uid()
  );

-- ==========================================
-- FEED_REACTIONS TABLE
-- ==========================================

ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feed_reactions_select_policy ON public.feed_reactions;
DROP POLICY IF EXISTS feed_reactions_insert_policy ON public.feed_reactions;
DROP POLICY IF EXISTS feed_reactions_update_policy ON public.feed_reactions;
DROP POLICY IF EXISTS feed_reactions_delete_policy ON public.feed_reactions;

CREATE POLICY feed_reactions_select_policy ON public.feed_reactions
  FOR SELECT USING (
    auth.uid() is not null
    AND user_id = auth.uid()
  );

CREATE POLICY feed_reactions_insert_policy ON public.feed_reactions
  FOR INSERT WITH CHECK (
    auth.uid() is not null
    AND user_id = auth.uid()
  );

CREATE POLICY feed_reactions_update_policy ON public.feed_reactions
  FOR UPDATE USING (
    auth.uid() is not null
    AND user_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() is not null
    AND user_id = auth.uid()
  );

CREATE POLICY feed_reactions_delete_policy ON public.feed_reactions
  FOR DELETE USING (
    auth.uid() is not null
    AND user_id = auth.uid()
  );
