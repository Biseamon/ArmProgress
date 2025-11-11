# Database Migration Guide

This guide explains how to set up your Supabase database from scratch.

## Overview

The database setup uses **one comprehensive migration file**:
- `migrations/20251110_complete_schema.sql` - Complete, clean database schema

This single file creates all tables, RLS policies, indexes, triggers, and constraints.

## Quick Setup (Recommended)

### For Fresh Database (First-Time Setup)

1. **Go to Supabase SQL Editor**
   - URL: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

2. **Run the Complete Migration**
   - Open: `migrations/20251110_complete_schema.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click **"Run"**
   - Should see: "Success. No rows returned" ✅

3. **Verify Tables Created**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
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

4. **Done!** Your database is ready. 🎉

---

## With Existing Data (Advanced)

**⚠️ Only if you have production data to preserve**

### Before You Start

1. **Backup your database**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/database/backups
   - Click "Create backup"
   - Wait for completion

2. **Test on staging first** - Never run migrations on production without testing

### Migration Steps

1. **Export existing data** (via Supabase Table Editor)
   - Download CSV for each table you want to keep
   - Save to safe location

2. **Drop old tables** (in SQL Editor)
   ```sql
   -- ⚠️ THIS DELETES ALL DATA - Make sure you have backups!
   DROP TABLE IF EXISTS exercises CASCADE;
   DROP TABLE IF EXISTS workouts CASCADE;
   DROP TABLE IF EXISTS goals CASCADE;
   DROP TABLE IF EXISTS strength_tests CASCADE;
   DROP TABLE IF EXISTS body_measurements CASCADE;
   DROP TABLE IF EXISTS scheduled_trainings CASCADE;
   DROP TABLE IF EXISTS cycles CASCADE;
   DROP TABLE IF EXISTS profiles CASCADE;
   ```

3. **Run complete schema** (paste entire `20251110_complete_schema.sql`)

4. **Import data back** (via Table Editor or CSV import)
   - Go to each table
   - Click "Insert" → "Import from CSV"
   - Upload your saved CSVs

5. **Verify data integrity**
   ```sql
   -- Check row counts
   SELECT 'profiles' as table, COUNT(*) FROM profiles
   UNION ALL
   SELECT 'workouts', COUNT(*) FROM workouts
   UNION ALL
   SELECT 'goals', COUNT(*) FROM goals;
   ```

## What This Migration Includes

### ✅ All Tables
- `profiles` - User profiles with premium status
- `cycles` - Training cycles/programs
- `workouts` - Workout sessions
- `exercises` - Individual exercises
- `goals` - Training goals
- `strength_tests` - Strength assessments
- `body_measurements` - Physical measurements
- `scheduled_trainings` - Planned workouts

### ✅ Security
- Row Level Security (RLS) enabled on all tables
- Proper RLS policies (users can only access their own data)
- Foreign key constraints for data integrity

### ✅ Performance
- Indexes on all foreign keys
- Indexes on commonly queried columns
- Optimized for read and write operations

### ✅ Data Integrity
- CHECK constraints for valid data
- NOT NULL constraints where appropriate
- Proper CASCADE behaviors on deletes

### ✅ Automation
- Auto-create profile on user signup
- Auto-update `updated_at` timestamps
- Utility functions for common operations

---

## Verification Steps

After running the migration, verify everything is set up correctly:

### 1. Check All Tables Exist
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```
**Expected**: 8 tables (body_measurements, cycles, exercises, goals, profiles, scheduled_trainings, strength_tests, workouts)

### 2. Verify RLS is Enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
**Expected**: All tables show `rowsecurity = true`

### 3. Check RLS Policies
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```
**Expected**: ~32 policies (4 per table: SELECT, INSERT, UPDATE, DELETE)

### 4. Test User Data Access
Sign up in your app, then run:
```sql
-- Should return your profile
SELECT * FROM profiles WHERE id = auth.uid();

-- Should return empty (no workouts yet)
SELECT * FROM workouts WHERE user_id = auth.uid();
```

### 5. Test Data Isolation
- Create 2 test accounts (User A and User B)
- Log workout for User A
- Log in as User B
- User B should NOT see User A's workout ✅

---

## Common Issues

### ❌ "relation already exists"
**Cause**: Tables already created
**Solution**: Either:
  - Drop existing tables first (see "With Existing Data" section)
  - Or ignore (tables already set up correctly)

### ❌ "permission denied for table"
**Cause**: Usually means RLS is working correctly!
**Solution**: Make sure you're authenticated when querying user data

### ❌ "No rows returned" (after migration)
**Cause**: Normal! DDL statements don't return rows
**Solution**: Check for errors. If none, migration succeeded ✅

### ❌ "could not create unique index"
**Cause**: Duplicate data in table
**Solution**: Clean up duplicates or drop table and recreate

---

## Rolling Back

If something goes wrong, restore from your backup:

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/database/backups
2. Find your backup (created before migration)
3. Click "Restore"
4. Confirm restoration

Supabase also keeps automatic daily backups.

---

## Next Steps

After successful migration:

1. ✅ Configure storage bucket (see `../docs/STORAGE_POLICY_SETUP.md`)
2. ✅ Set up environment variables (`.env` file)
3. ✅ Test app functionality
4. ✅ Verify data isolation between users
5. ✅ Review `SCHEMA_OVERVIEW.md` for schema details

---

## Need Help?

- **Schema Details**: See `SCHEMA_OVERVIEW.md`
- **Supabase Docs**: https://supabase.com/docs/guides/database
- **SQL Reference**: https://www.postgresql.org/docs/
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security

---

**Schema Version**: 1.0.0
**Last Updated**: November 11, 2025
