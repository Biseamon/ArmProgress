# 📊 Database Migrations

This folder contains the SQL migrations to set up your Supabase database.

---

## Quick Start

To set up your database from scratch, run these migrations in order:

### 1. Complete Database Schema (Required)

**File**: `20251110_complete_schema.sql`

This creates all tables, indexes, and Row Level Security (RLS) policies.

**How to run**:
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copy the entire contents of `20251110_complete_schema.sql`
3. Paste into SQL Editor
4. Click **"Run"**

**What it creates**:
- ✅ `profiles` - User profiles
- ✅ `cycles` - Training cycles
- ✅ `workouts` - Workout sessions
- ✅ `exercises` - Exercise details
- ✅ `goals` - User goals
- ✅ `strength_tests` - Strength test results
- ✅ `body_measurements` - Body measurements
- ✅ `scheduled_trainings` - Scheduled training sessions
- ✅ All RLS policies for data protection
- ✅ All indexes for performance

---

### 2. Storage Configuration (Optional - Use Dashboard Instead)

**File**: `20251110_storage_security.sql`

⚠️ **NOTE**: This file is provided for reference but **won't work on Supabase Cloud** due to permissions.

Instead, configure storage through the dashboard:
- See `../STORAGE_POLICY_SETUP.md` for instructions
- Or follow the Quick Start guide

**Summary**:
- Go to Storage in dashboard
- Create `avatars` bucket
- Set as **public**
- Set 5MB file size limit
- Done!

---

## Database Schema Overview

```
profiles (user data)
  ├── cycles (training programs)
  │     └── workouts (training sessions)
  │           └── exercises (exercise details)
  ├── goals (user goals)
  ├── strength_tests (test results)
  ├── body_measurements (body metrics)
  └── scheduled_trainings (scheduled sessions)
```

All tables have:
- ✅ **RLS enabled** - Users can only access their own data
- ✅ **Proper foreign keys** - Data integrity enforced
- ✅ **Indexes** - Fast queries
- ✅ **Timestamps** - Created/updated tracking

---

## Row Level Security (RLS)

Every table has these policies:
- **SELECT**: Users can view their own data
- **INSERT**: Users can create their own data
- **UPDATE**: Users can update their own data
- **DELETE**: Users can delete their own data

This prevents users from accessing or modifying other users' data, even if they somehow get direct database access.

---

## Verification

After running the migration, verify everything is set up:

### Check Tables
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Should return 8 tables:
- body_measurements
- cycles
- exercises
- goals
- profiles
- scheduled_trainings
- strength_tests
- workouts

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

Should return ~32 policies (4 per table for SELECT, INSERT, UPDATE, DELETE).

### Check Indexes
```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
```

Should return multiple indexes for performance optimization.

---

## Common Issues

### "permission denied for table profiles"
**Solution**: RLS is working correctly! This error means users can't access data they don't own.

### "relation already exists"
**Solution**: Tables already created. If you want to start fresh, drop all tables first (careful!):
```sql
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS cycles CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS strength_tests CASCADE;
DROP TABLE IF EXISTS body_measurements CASCADE;
DROP TABLE IF EXISTS scheduled_trainings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

Then re-run the complete schema migration.

### "could not create unique index"
**Solution**: You have duplicate data. Clean up duplicates first or drop the table and recreate.

---

## Archived Migrations

Old incremental migrations have been moved to `../archive/` for reference.

The complete schema file is the only migration you need to run on a fresh database.

---

## Making Changes

If you need to modify the schema:

1. **Don't edit existing migrations** - They may have already been run
2. **Create a new migration file** with the date:
   ```
   20251111_add_new_feature.sql
   ```
3. **Include both UP and DOWN migrations**:
   ```sql
   -- UP Migration
   ALTER TABLE profiles ADD COLUMN new_field TEXT;

   -- To rollback, run:
   -- ALTER TABLE profiles DROP COLUMN new_field;
   ```

4. **Test locally first** before running in production
5. **Update TypeScript types** in `lib/supabase.ts`

---

## Database Backup

Before running any migrations in production:

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/database/backups
2. Click **"Create backup"**
3. Wait for backup to complete
4. Then run your migration

Supabase also does automatic daily backups.

---

## Need Help?

- **Supabase Docs**: https://supabase.com/docs/guides/database
- **SQL Reference**: https://www.postgresql.org/docs/
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security

---

## Summary

For a fresh database setup:

1. ✅ Run `20251110_complete_schema.sql` in SQL Editor
2. ✅ Configure storage bucket via dashboard (see `STORAGE_POLICY_SETUP.md`)
3. ✅ Test by creating a user and logging in
4. ✅ Verify data isolation (user A can't see user B's data)

That's it! Your database is ready for production. 🚀
