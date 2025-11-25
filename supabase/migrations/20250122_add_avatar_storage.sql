-- Migration: Set up avatar storage in Supabase Storage
-- SKIPPED: Avatars bucket and policies already exist
--
-- This migration is not needed because:
-- 1. Avatars bucket already exists
-- 2. Storage policies already configured
-- 3. profiles.avatar_url column already exists
--
-- No changes required.

-- Verify avatars bucket exists (read-only check)
DO $$ 
DECLARE
  bucket_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE 'Avatars bucket already exists - migration skipped';
  ELSE
    RAISE WARNING 'Avatars bucket does not exist - please create it manually in Supabase Dashboard';
  END IF;
END $$;

