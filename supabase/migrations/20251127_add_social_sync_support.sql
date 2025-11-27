-- Migration: Add sync support to social tables
-- Adds modified_at, deleted columns and necessary policies/triggers for proper sync

-- ==========================================
-- STEP 1: Add modified_at and deleted columns
-- ==========================================

-- Friends table
ALTER TABLE public.friends
ADD COLUMN IF NOT EXISTS modified_at timestamptz DEFAULT now();

ALTER TABLE public.friends
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Friend invites table
ALTER TABLE public.friend_invites
ADD COLUMN IF NOT EXISTS modified_at timestamptz DEFAULT now();

ALTER TABLE public.friend_invites
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Groups table
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS modified_at timestamptz DEFAULT now();

ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Group members table
ALTER TABLE public.group_members
ADD COLUMN IF NOT EXISTS modified_at timestamptz DEFAULT now();

ALTER TABLE public.group_members
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Group invites table
ALTER TABLE public.group_invites
ADD COLUMN IF NOT EXISTS modified_at timestamptz DEFAULT now();

ALTER TABLE public.group_invites
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Feed posts table
ALTER TABLE public.feed_posts
ADD COLUMN IF NOT EXISTS modified_at timestamptz DEFAULT now();

ALTER TABLE public.feed_posts
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Feed reactions table
ALTER TABLE public.feed_reactions
ADD COLUMN IF NOT EXISTS modified_at timestamptz DEFAULT now();

ALTER TABLE public.feed_reactions
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- ==========================================
-- STEP 2: Create auto-update triggers for modified_at
-- ==========================================

-- Reuse the update_modified_at_column function from existing migration
-- (Created in 20250122_add_sync_columns.sql)

-- Friends trigger
DROP TRIGGER IF EXISTS update_friends_modified_at ON public.friends;
CREATE TRIGGER update_friends_modified_at
    BEFORE UPDATE ON public.friends
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- Friend invites trigger
DROP TRIGGER IF EXISTS update_friend_invites_modified_at ON public.friend_invites;
CREATE TRIGGER update_friend_invites_modified_at
    BEFORE UPDATE ON public.friend_invites
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- Groups trigger
DROP TRIGGER IF EXISTS update_groups_modified_at ON public.groups;
CREATE TRIGGER update_groups_modified_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- Group members trigger
DROP TRIGGER IF EXISTS update_group_members_modified_at ON public.group_members;
CREATE TRIGGER update_group_members_modified_at
    BEFORE UPDATE ON public.group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- Group invites trigger
DROP TRIGGER IF EXISTS update_group_invites_modified_at ON public.group_invites;
CREATE TRIGGER update_group_invites_modified_at
    BEFORE UPDATE ON public.group_invites
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- Feed posts trigger
DROP TRIGGER IF EXISTS update_feed_posts_modified_at ON public.feed_posts;
CREATE TRIGGER update_feed_posts_modified_at
    BEFORE UPDATE ON public.feed_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- Feed reactions trigger
DROP TRIGGER IF EXISTS update_feed_reactions_modified_at ON public.feed_reactions;
CREATE TRIGGER update_feed_reactions_modified_at
    BEFORE UPDATE ON public.feed_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- ==========================================
-- STEP 3: Create indexes on modified_at for efficient sync queries
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_friends_modified_at ON public.friends(modified_at);
CREATE INDEX IF NOT EXISTS idx_friend_invites_modified_at ON public.friend_invites(modified_at);
CREATE INDEX IF NOT EXISTS idx_groups_modified_at ON public.groups(modified_at);
CREATE INDEX IF NOT EXISTS idx_group_members_modified_at ON public.group_members(modified_at);
CREATE INDEX IF NOT EXISTS idx_group_invites_modified_at ON public.group_invites(modified_at);
CREATE INDEX IF NOT EXISTS idx_feed_posts_modified_at ON public.feed_posts(modified_at);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_modified_at ON public.feed_reactions(modified_at);

-- ==========================================
-- STEP 4: Backfill modified_at with created_at
-- ==========================================

UPDATE public.friends SET modified_at = created_at WHERE modified_at IS NULL;
UPDATE public.friend_invites SET modified_at = created_at WHERE modified_at IS NULL;
UPDATE public.groups SET modified_at = created_at WHERE modified_at IS NULL;
UPDATE public.group_members SET modified_at = created_at WHERE modified_at IS NULL;
UPDATE public.group_invites SET modified_at = created_at WHERE modified_at IS NULL;
UPDATE public.feed_posts SET modified_at = created_at WHERE modified_at IS NULL;
UPDATE public.feed_reactions SET modified_at = created_at WHERE modified_at IS NULL;

-- ==========================================
-- STEP 5: Add missing UPDATE policy for groups (needed for upsert)
-- ==========================================

-- Drop and recreate groups policies to support upsert operations
DROP POLICY IF EXISTS groups_update_policy ON public.groups;
CREATE POLICY groups_update_policy ON public.groups
  FOR UPDATE USING (
    auth.uid() is not null
    and owner_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() is not null
    and owner_id = auth.uid()
  );

-- ==========================================
-- STEP 6: Add DELETE policies for all social tables
-- ==========================================

-- Friends DELETE policy
DROP POLICY IF EXISTS friends_delete_policy ON public.friends;
CREATE POLICY friends_delete_policy ON public.friends
  FOR DELETE USING (
    auth.uid() is not null
    and (user_id = auth.uid() or friend_user_id = auth.uid())
  );

-- Friend invites DELETE policy
DROP POLICY IF EXISTS friend_invites_delete_policy ON public.friend_invites;
CREATE POLICY friend_invites_delete_policy ON public.friend_invites
  FOR DELETE USING (
    auth.uid() is not null
    and inviter_id = auth.uid()
  );

-- Groups DELETE policy (only owner can delete)
DROP POLICY IF EXISTS groups_delete_policy ON public.groups;
CREATE POLICY groups_delete_policy ON public.groups
  FOR DELETE USING (
    auth.uid() is not null
    and owner_id = auth.uid()
  );

-- Group members DELETE policy
DROP POLICY IF EXISTS group_members_delete_policy ON public.group_members;
CREATE POLICY group_members_delete_policy ON public.group_members
  FOR DELETE USING (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or exists (
        select 1 from public.groups g
        where g.id = group_members.group_id
          and g.owner_id = auth.uid()
      )
    )
  );

-- Group invites DELETE policy
DROP POLICY IF EXISTS group_invites_delete_policy ON public.group_invites;
CREATE POLICY group_invites_delete_policy ON public.group_invites
  FOR DELETE USING (
    auth.uid() is not null
    and (inviter_id = auth.uid() or invitee_user_id = auth.uid())
  );

-- Feed posts DELETE policy
DROP POLICY IF EXISTS feed_posts_delete_policy ON public.feed_posts;
CREATE POLICY feed_posts_delete_policy ON public.feed_posts
  FOR DELETE USING (
    auth.uid() is not null
    and user_id = auth.uid()
  );

-- Feed reactions DELETE policy (already exists, but adding for completeness)
-- This was already in the original migration, but we'll ensure it exists
DROP POLICY IF EXISTS feed_reactions_delete_policy ON public.feed_reactions;
CREATE POLICY feed_reactions_delete_policy ON public.feed_reactions
  FOR DELETE USING (
    auth.uid() is not null
    and user_id = auth.uid()
  );

-- ==========================================
-- STEP 7: Add comments for documentation
-- ==========================================

COMMENT ON COLUMN public.friends.modified_at IS 'Timestamp of last modification, used for sync tracking';
COMMENT ON COLUMN public.friends.deleted IS 'Soft delete flag for sync tracking';
COMMENT ON COLUMN public.friend_invites.modified_at IS 'Timestamp of last modification, used for sync tracking';
COMMENT ON COLUMN public.friend_invites.deleted IS 'Soft delete flag for sync tracking';
COMMENT ON COLUMN public.groups.modified_at IS 'Timestamp of last modification, used for sync tracking';
COMMENT ON COLUMN public.groups.deleted IS 'Soft delete flag for sync tracking';
COMMENT ON COLUMN public.group_members.modified_at IS 'Timestamp of last modification, used for sync tracking';
COMMENT ON COLUMN public.group_members.deleted IS 'Soft delete flag for sync tracking';
COMMENT ON COLUMN public.group_invites.modified_at IS 'Timestamp of last modification, used for sync tracking';
COMMENT ON COLUMN public.group_invites.deleted IS 'Soft delete flag for sync tracking';
COMMENT ON COLUMN public.feed_posts.modified_at IS 'Timestamp of last modification, used for sync tracking';
COMMENT ON COLUMN public.feed_posts.deleted IS 'Soft delete flag for sync tracking';
COMMENT ON COLUMN public.feed_reactions.modified_at IS 'Timestamp of last modification, used for sync tracking';
COMMENT ON COLUMN public.feed_reactions.deleted IS 'Soft delete flag for sync tracking';
