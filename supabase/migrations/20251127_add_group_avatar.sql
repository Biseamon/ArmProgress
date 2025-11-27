-- Add avatar_url column to groups table
-- This allows group owners to upload custom group avatars/logos

ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN public.groups.avatar_url IS 'URL to group avatar/logo image stored in Supabase Storage';
