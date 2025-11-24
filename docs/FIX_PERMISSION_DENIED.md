# URGENT: Fix Permission Denied Errors

## Problem
Getting "permission denied for table profiles" and "permission denied for table workouts" errors when logging in.

## Root Cause
**The RLS (Row Level Security) policies in your Supabase database are not properly applied or missing the `TO authenticated` clause.**

## Quick Fix (5 minutes)

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**

### Step 2: Run the Fix Script
1. Open the file: `supabase/migrations/20250123_fix_rls_permissions.sql`
2. **Copy the ENTIRE contents**
3. Paste into Supabase SQL Editor
4. Click **Run**

### Step 3: Verify
After running the script, check:
1. Go to **Database** → **Tables**
2. Click on `profiles` table
3. Go to **Policies** tab
4. You should see policies with "TO authenticated" in them

### Step 4: Restart App
```bash
# Stop the app (Ctrl+C)
# Restart
npx expo start --clear
```

## Why This Happened

The original RLS policies were created without explicitly specifying `TO authenticated`, which can cause permission issues. The fix script:

1. ✅ Grants proper permissions to `authenticated` role
2. ✅ Drops old policies
3. ✅ Recreates all policies with explicit `TO authenticated` clause
4. ✅ Adds `WITH CHECK` clauses for UPDATE operations (more secure)
5. ✅ Ensures RLS is enabled on all tables

## Expected Result

After applying the fix:
- ✅ Login should work without errors
- ✅ Data should sync properly
- ✅ All CRUD operations should work
- ✅ Users can only see their own data (security maintained)

## If Still Having Issues

### Check Auth
```sql
-- Run this in Supabase SQL Editor to see current user
SELECT auth.uid();
```

If this returns `null`, you're not authenticated. Log out and log back in.

### Check Profile Exists
```sql
-- Check if your profile was created
SELECT * FROM profiles WHERE id = auth.uid();
```

If empty, the trigger might not have fired. Manually create:
```sql
INSERT INTO profiles (id, email, full_name)
VALUES (auth.uid(), 'your-email@example.com', 'Your Name');
```

### Check RLS is Enabled
```sql
-- Verify RLS is on
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
```

All your tables should be listed.

## Prevention

For future deploys, always:
1. Include `TO authenticated` in policy definitions
2. Use both `USING` and `WITH CHECK` for UPDATE policies
3. Test with a fresh user account
4. Check policies after migration

## Related Files
- `supabase/migrations/20251110_complete_schema.sql` - Original schema
- `supabase/migrations/20250123_fix_rls_permissions.sql` - This fix

## Support

If this doesn't fix it, check:
1. Supabase dashboard logs
2. Network connectivity
3. Auth token validity
4. Database connection string

