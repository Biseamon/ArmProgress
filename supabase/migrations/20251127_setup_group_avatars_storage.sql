-- Setup group-avatars storage bucket with RLS policies
-- This allows group owners to upload and manage group avatar images

-- Create the group-avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'group-avatars',
  'group-avatars',
  true,  -- Make bucket public so avatars can be displayed
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload group avatars
-- Users can upload to group-avatars/{group_id}/* if they own the group
DROP POLICY IF EXISTS "Allow group owners to upload avatars" ON storage.objects;
CREATE POLICY "Allow group owners to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'group-avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM public.groups
    WHERE owner_id = auth.uid()
  )
);

-- Policy: Allow anyone to view/download group avatars (public read)
DROP POLICY IF EXISTS "Public read access for group avatars" ON storage.objects;
CREATE POLICY "Public read access for group avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'group-avatars');

-- Policy: Allow group owners to update their group avatars
DROP POLICY IF EXISTS "Allow group owners to update avatars" ON storage.objects;
CREATE POLICY "Allow group owners to update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'group-avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM public.groups
    WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'group-avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM public.groups
    WHERE owner_id = auth.uid()
  )
);

-- Policy: Allow group owners to delete their group avatars
DROP POLICY IF EXISTS "Allow group owners to delete avatars" ON storage.objects;
CREATE POLICY "Allow group owners to delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'group-avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM public.groups
    WHERE owner_id = auth.uid()
  )
);
