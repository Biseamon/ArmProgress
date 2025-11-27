-- Add RLS policies for existing group-avatars bucket
-- Run this in Supabase SQL Editor since bucket already exists

-- Policy: Allow group owners to upload avatars
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

-- Policy: Public read access for group avatars
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
