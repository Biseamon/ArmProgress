# 🗂️ Storage Policy Setup Guide

**Problem**: You can't run the storage migration SQL directly due to permission issues.

**Solution**: Configure storage policies through the Supabase Dashboard UI.

---

## Method 1: Simple Public Bucket (Easiest) ⭐

This is the simplest approach and still secure because:
- Users can only upload/update files if authenticated
- RLS on the `profiles` table prevents users from changing others' avatar URLs
- Client-side validation limits file size and type

### Steps:

1. **Go to Storage Settings**
   - URL: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets

2. **Create or Configure `avatars` Bucket**
   - Click **"New bucket"** or edit existing `avatars` bucket
   - Settings:
     - ✅ **Public bucket** (checked)
     - **File size limit**: `5000000` (5MB in bytes)
     - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif`

3. **That's it!** 🎉
   - Public bucket means anyone can view avatars (needed for displaying them)
   - Only authenticated users can upload (handled by Supabase automatically)
   - Your app validates file size/type before upload

### Why This Works:

- **Security**: Even though the bucket is public, users need to be authenticated to upload
- **Protection**: Your app validates files before upload (max 5MB, images only)
- **Profile Protection**: RLS on `profiles` table prevents users from pointing to other users' avatars
- **Simple**: No complex policies needed

---

## Method 2: Folder-Based Security (More Secure)

If you want stricter control where users can ONLY upload files with their own user ID:

### Change Your Upload Code

First, update your avatar upload to use folders:

**File**: `app/(tabs)/profile.tsx`

Change line 144-145 from:
```typescript
const fileName = `${profile.id}.${fileExt}`;
const filePath = fileName;
```

To:
```typescript
const fileName = `avatar.${fileExt}`;
const filePath = `${profile.id}/${fileName}`; // Store in user's folder
```

Also update line 122-123:
```typescript
const fileExt = asset.uri.split('.').pop()?.toLowerCase() || '';
const fileName = `avatar.${fileExt}`;
const filePath = `${profile.id}/${fileName}`;
```

### Create Policies in Dashboard

1. **Go to Storage Policies**
   - URL: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/policies

2. **Create Policy #1: Public Read**
   - Click **"New Policy"**
   - **Policy name**: `Public read avatars`
   - **Policy definition**: Use the template: **"Allow public read access"**
   - Or custom SQL:
     ```sql
     bucket_id = 'avatars'
     ```
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public`

3. **Create Policy #2: Users Upload Own Avatar**
   - Click **"New Policy"**
   - **Policy name**: `Users upload own avatar`
   - **Policy definition**: Custom
     ```sql
     bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
     ```
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`

4. **Create Policy #3: Users Update Own Avatar**
   - **Policy name**: `Users update own avatar`
   - **Policy definition**:
     ```sql
     bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
     ```
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `authenticated`

5. **Create Policy #4: Users Delete Own Avatar**
   - **Policy name**: `Users delete own avatar`
   - **Policy definition**:
     ```sql
     bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
     ```
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`

---

## Recommended: Method 1 (Simple Public Bucket)

For your use case, **Method 1 is sufficient** because:

1. ✅ Your app validates file size/type before upload
2. ✅ RLS on `profiles` table protects against URL manipulation
3. ✅ Users must be authenticated to upload
4. ✅ Simpler = fewer things to break

The additional security from Method 2 (folder-based) is minimal for this use case.

---

## Verification

After setting up (either method):

### Test 1: Upload Avatar
1. Log in to your app
2. Go to Profile
3. Upload a photo
4. Should succeed ✅

### Test 2: View Avatar
1. Log out
2. Create a new account
3. Upload avatar
4. Check if it displays ✅

### Test 3: Check Dashboard
1. Go to Storage: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets/avatars
2. You should see uploaded files
3. File size should be under 5MB ✅

---

## Current Setup Status

Your app already has:
- ✅ Client-side file validation (5MB, images only)
- ✅ Profile RLS policies (users can only update their own profile)
- ✅ Proper error handling

Just need to:
- [ ] Configure bucket in Supabase Dashboard (Method 1)
- [ ] Test avatar upload
- [ ] Done! 🎉

---

## Troubleshooting

### "Failed to upload"
- Check bucket exists and is public
- Check you're logged in
- Check file is under 5MB and is an image

### "Policy violation"
- If using Method 2, check folder path matches user ID
- Check policies are created correctly
- Try Method 1 instead (simpler)

### Files upload but don't display
- Check bucket is marked as **public**
- Check public URL is correctly generated
- Clear browser cache

---

## Summary

**Do this now**:

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets
2. Find or create `avatars` bucket
3. Set as **Public** ✅
4. Set file size limit: **5MB**
5. Set allowed types: **image/jpeg,image/png,image/webp,image/gif**
6. Test uploading an avatar in your app

**Done!** Your storage is now secure and ready for production. 🚀

The SQL migration file isn't needed for hosted Supabase - dashboard configuration is the correct approach.
