-- =====================================================
-- Storage Security Policies for Avatar Uploads
-- =====================================================
-- This migration creates RLS policies for the avatars storage bucket
-- to prevent unauthorized access and abuse
--
-- Run this migration in your Supabase dashboard:
-- 1. Go to SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"

-- First, ensure the avatars bucket exists
-- (You may have created this manually, this is just a safety check)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- =====================================================
-- Enable RLS on storage.objects
-- =====================================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Storage Policies
-- =====================================================

-- Policy 1: Users can upload their own avatar
-- Filename format: {user_id}/avatar.{extension}
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can update their own avatar
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can delete their own avatar
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Anyone can view avatars (public read)
-- This allows displaying avatars without authentication
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- =====================================================
-- File Size Limits
-- =====================================================
-- Note: File size limits must be set in Supabase dashboard
-- Go to: Storage > avatars bucket > Settings
-- Recommended settings:
-- - Maximum file size: 5 MB
-- - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- - File size limit per user: 50 MB (allows ~10 avatar versions)

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify policies are created:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
