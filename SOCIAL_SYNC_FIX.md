# Social Features Sync Fix

## Problem Summary

The social features (friends, groups, feed) were not syncing to Supabase due to:

1. **Invalid UUID errors (22P02)**: Old test data used string-based IDs like `grp-123`, `post-456` instead of proper UUIDs
2. **Permission denied errors (42501)**: Missing RLS policies and sync tracking columns on social tables

## Solution Applied

### 1. Database Migration (Supabase)

**File**: `supabase/migrations/20251127_add_social_sync_support.sql`

This migration adds:
- ✅ `modified_at` and `deleted` columns to all social tables
- ✅ Auto-update triggers for `modified_at`
- ✅ Indexes on `modified_at` for efficient sync queries
- ✅ DELETE RLS policies for all social tables
- ✅ UPDATE policy for `groups` table (needed for upsert operations)
- ✅ Backfills `modified_at` with `created_at` for existing data

**Tables updated**:
- `friends`
- `friend_invites`
- `groups`
- `group_members`
- `group_invites`
- `feed_posts`
- `feed_reactions`

### 2. Local Database Cleanup Script

**File**: `lib/db/migrations/cleanupInvalidIds.ts`

This script removes old records with invalid UUID formats from your local SQLite database.

## How to Apply the Fix

### Step 1: Apply Supabase Migration

Run the migration on your Supabase database:

```bash
# Using Supabase CLI
supabase db push

# OR manually apply the migration file in Supabase Dashboard
# SQL Editor -> New query -> Paste contents of 20251127_add_social_sync_support.sql
```

### Step 2: Clean Up Local Invalid IDs

**Option A: Preview what will be cleaned (safe)**

Add this to your app temporarily (e.g., in a settings screen):

```typescript
import { previewCleanup } from '@/lib/db/migrations/cleanupInvalidIds';

// Button or useEffect to preview
const handlePreview = async () => {
  const report = await previewCleanup();
  console.log('Cleanup preview:', report);
};
```

**Option B: Run the cleanup (removes old data)**

```typescript
import { cleanupInvalidIds } from '@/lib/db/migrations/cleanupInvalidIds';

// Button or useEffect to clean
const handleCleanup = async () => {
  const result = await cleanupInvalidIds();
  console.log(`Cleaned ${result.recordsCleaned} records`);
};
```

**Option C: Clear entire local database (nuclear option)**

If you're okay losing all local data and re-syncing from Supabase:

```typescript
// Add this to your app temporarily
import * as SQLite from 'expo-sqlite';

const clearDatabase = async () => {
  await SQLite.deleteDatabaseAsync('armprogress.db');
  console.log('Database cleared - restart app to reinitialize');
};
```

### Step 3: Test the Sync

After applying the migration and cleaning up invalid IDs:

1. **Create a test post**:
   - Go to Activity tab
   - Share an update
   - Check Supabase dashboard to verify it appears in `feed_posts` table

2. **Create a test friend invite**:
   - Go to Friends tab
   - Invite by email
   - Check `friend_invites` table in Supabase

3. **Create a test group**:
   - Go to Groups tab
   - Create a public group
   - Check `groups` and `group_members` tables in Supabase

4. **Check sync logs**:
   - Watch console for `[Sync]` messages
   - Should see "Pushed X to Supabase" instead of errors

## What Changed

### Before ❌
- Social tables missing `modified_at` and `deleted` columns
- No DELETE policies on social tables
- Old records with invalid IDs (e.g., `grp-1234`) failing to sync
- Upsert operations failing on `groups` table

### After ✅
- All social tables have proper sync tracking columns
- Complete RLS policies (SELECT, INSERT, UPDATE, DELETE)
- Only valid UUID format allowed
- Sync engine works seamlessly with social features

## Verification Checklist

After applying the fix, verify:

- [ ] Migration applied successfully on Supabase
- [ ] All social tables have `modified_at` and `deleted` columns
- [ ] Invalid IDs cleaned from local database
- [ ] Creating a post syncs to `feed_posts` table
- [ ] Creating a friend invite syncs to `friend_invites` table
- [ ] Creating a group syncs to `groups` and `group_members` tables
- [ ] No more "permission denied" errors in logs
- [ ] No more "invalid UUID" errors in logs

## Troubleshooting

### Still seeing "permission denied" errors?

Check that the migration was applied:

```sql
-- In Supabase SQL Editor
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'friends'
  AND column_name IN ('modified_at', 'deleted');
```

Should return 2 rows. If not, re-run the migration.

### Still seeing "invalid UUID" errors?

Check for remaining invalid IDs:

```typescript
import { previewCleanup } from '@/lib/db/migrations/cleanupInvalidIds';

const report = await previewCleanup();
console.log(report); // Should be empty {}
```

If not empty, run `cleanupInvalidIds()`.

### Data not appearing in Supabase?

1. Check that sync is triggering:
   ```typescript
   import { triggerSync } from '@/lib/sync/syncEngine';
   const { profile } = useAuth();

   await triggerSync(profile.id);
   ```

2. Check network connection
3. Check Supabase logs for RLS policy errors

## Files Modified

- ✅ `supabase/migrations/20251127_add_social_sync_support.sql` (new)
- ✅ `lib/db/migrations/cleanupInvalidIds.ts` (new)
- ℹ️ No changes needed to `lib/sync/syncEngine.ts` (already handles deletions correctly)
- ℹ️ No changes needed to `lib/react-query-sqlite-complete.ts` (already generates proper UUIDs)

## Next Steps

1. Apply the Supabase migration
2. Clean up local invalid IDs
3. Test social features end-to-end
4. Monitor sync logs to ensure no errors
5. (Optional) Add monitoring/alerting for sync failures

---

**Note**: The migration is idempotent - it's safe to run multiple times. It uses `IF NOT EXISTS` and `DROP ... IF EXISTS` to avoid errors on re-runs.
