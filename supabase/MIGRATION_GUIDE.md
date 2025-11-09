# Database Migration Guide

This guide explains how to apply the clean database schema to your Supabase project.

## Current Situation

You have multiple fragmented migration files:
- `20251104_initial_migration.sql`
- `20251104_create_crud_tables.sql`
- Multiple `20251104_fix_*.sql` files
- `20251105_fix_*.sql` files

These were incremental fixes that led to a messy migration history.

## New Approach

We've created **one comprehensive migration** that replaces all of these:
- `20251110_complete_schema.sql` - Complete, clean database schema

## Migration Options

### Option 1: Fresh Supabase Project (Recommended for Development)

If you're in development and can start fresh:

1. **Create a new Supabase project** (or reset your current one)

2. **Run the complete migration:**
   ```sql
   -- In Supabase SQL Editor, run:
   -- File: supabase/migrations/20251110_complete_schema.sql
   ```

3. **Verify the schema:**
   ```sql
   -- Check tables exist
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';

   -- Check RLS is enabled
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';
   ```

4. **Done!** Your database now has a clean, proper schema.

### Option 2: Migrate Existing Data (Production)

If you have existing data you need to keep:

1. **Backup your current database:**
   ```bash
   # Using Supabase CLI
   supabase db dump > backup_$(date +%Y%m%d).sql
   ```

2. **Export your data:**
   ```sql
   -- Export important data (adjust as needed)
   COPY (SELECT * FROM profiles) TO '/tmp/profiles.csv' CSV HEADER;
   COPY (SELECT * FROM workouts) TO '/tmp/workouts.csv' CSV HEADER;
   -- Repeat for other tables...
   ```

3. **Run migration in a transaction:**
   ```sql
   BEGIN;

   -- Drop old tables (THIS DELETES DATA!)
   DROP TABLE IF EXISTS exercises CASCADE;
   DROP TABLE IF EXISTS workouts CASCADE;
   DROP TABLE IF EXISTS goals CASCADE;
   DROP TABLE IF EXISTS strength_tests CASCADE;
   DROP TABLE IF EXISTS body_measurements CASCADE;
   DROP TABLE IF EXISTS scheduled_trainings CASCADE;
   DROP TABLE IF EXISTS cycles CASCADE;
   DROP TABLE IF EXISTS training_cycles CASCADE;
   DROP TABLE IF EXISTS profiles CASCADE;

   -- Run the complete migration
   \i supabase/migrations/20251110_complete_schema.sql

   -- If everything looks good, commit
   COMMIT;

   -- If something went wrong, rollback
   -- ROLLBACK;
   ```

4. **Import your data:**
   ```sql
   -- Import data back
   COPY profiles FROM '/tmp/profiles.csv' CSV HEADER;
   COPY workouts FROM '/tmp/workouts.csv' CSV HEADER;
   -- Repeat for other tables...
   ```

### Option 3: Using Supabase CLI (Recommended for Teams)

1. **Initialize Supabase in your project:**
   ```bash
   supabase init
   ```

2. **Link to your project:**
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Push migration:**
   ```bash
   supabase db push
   ```

4. **Verify:**
   ```bash
   supabase db diff
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

## Verifying the Migration

After running the migration, verify everything works:

```sql
-- 1. Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- - body_measurements
-- - cycles
-- - exercises
-- - goals
-- - profiles
-- - scheduled_trainings
-- - strength_tests
-- - workouts

-- 2. Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- All should show: rowsecurity = true

-- 3. Check indexes exist
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 4. Test RLS policies work
-- As an authenticated user, try:
SELECT * FROM profiles WHERE id = auth.uid();
-- Should return your profile

SELECT * FROM workouts WHERE user_id = auth.uid();
-- Should return your workouts only

-- 5. Test foreign keys
\d+ workouts
-- Should show foreign keys to profiles and cycles

-- 6. Test triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
-- Should show on_auth_user_created and update triggers
```

## Cleanup Old Migrations (Optional)

After successfully migrating, you can optionally remove old migration files:

```bash
# Keep the new one, remove old ones
mv supabase/migrations/20251110_complete_schema.sql supabase/migrations/20251110_complete_schema.sql.keep
rm supabase/migrations/20251104_*.sql
rm supabase/migrations/20251105_*.sql
mv supabase/migrations/20251110_complete_schema.sql.keep supabase/migrations/20251110_complete_schema.sql
```

## Troubleshooting

### "relation already exists"
Your table already exists. Either:
- Drop it first: `DROP TABLE tablename CASCADE;`
- Or start with a fresh database

### "permission denied"
Make sure you're connected as the postgres user or have sufficient privileges.

### "violates foreign key constraint"
Data in child tables references non-existent parent records. Clean up orphaned records first.

### "column already exists"
You have existing columns with different definitions. Drop and recreate the table.

## Rolling Back

If you need to rollback, use the backup you created:

```bash
# Restore from backup
psql -h db.xxx.supabase.co -U postgres -d postgres < backup_20251110.sql
```

## Next Steps

After migration:

1. ✅ Test all app functionality
2. ✅ Verify RLS policies work correctly
3. ✅ Check data integrity
4. ✅ Update your app.json/app.config.js if needed
5. ✅ Document any custom changes

## Support

If you encounter issues:
1. Check the Supabase logs
2. Review the SQL error messages
3. Verify your user permissions
4. Test RLS policies manually
5. Check foreign key constraints

---

**Created:** 2025-01-10
**Schema Version:** 1.0.0
**Maintainer:** Your Team
