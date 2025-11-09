# Supabase Database

Complete database setup for Arm Wrestling Pro.

## Quick Start

### For New/Fresh Database

1. Run the complete migration:
   ```bash
   # In Supabase SQL Editor:
   migrations/20251110_complete_schema.sql
   ```

2. Verify it worked:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

That's it! ✅

## Files

### Migrations

- **`20251110_complete_schema.sql`** ⭐ - **USE THIS ONE**
  - Complete, clean database schema
  - Replaces all previous migrations
  - Includes all tables, RLS, indexes, triggers

- **`rollback_20251110_complete_schema.sql`** - Rollback script
  - Use only if you need to undo the migration
  - **WARNING:** Deletes all data!

### Documentation

- **`MIGRATION_GUIDE.md`** - Step-by-step migration instructions
  - Options for fresh vs. existing databases
  - Verification steps
  - Troubleshooting

- **`SCHEMA_OVERVIEW.md`** - Complete schema documentation
  - All tables explained
  - ERD diagrams
  - Security policies
  - Performance optimizations

## Schema Summary

### Tables (8 total)

1. **profiles** - User profiles
2. **cycles** - Training cycles/programs
3. **workouts** - Workout sessions
4. **exercises** - Individual exercises
5. **goals** - Training goals
6. **strength_tests** - Strength assessments
7. **body_measurements** - Physical measurements
8. **scheduled_trainings** - Planned workouts

### Features

✅ Row Level Security (RLS) on all tables
✅ Automatic profile creation on signup
✅ Auto-update timestamps
✅ Comprehensive indexes for performance
✅ Foreign key constraints
✅ CHECK constraints for data validity
✅ Utility functions

## Common Tasks

### Check Current Schema Version

```sql
SELECT obj_description('profiles'::regclass);
```

### List All Tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Check RLS Status

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### View User's Data

```sql
-- As authenticated user
SELECT * FROM profiles WHERE id = auth.uid();
SELECT * FROM workouts WHERE user_id = auth.uid();
SELECT * FROM goals WHERE user_id = auth.uid();
```

## Troubleshooting

**Issue:** Tables already exist
**Solution:** Drop old tables first or use rollback script

**Issue:** Permission denied
**Solution:** Check you're using the postgres user

**Issue:** Foreign key violations
**Solution:** Clean up orphaned data before migrating

See `MIGRATION_GUIDE.md` for detailed troubleshooting.

## Need Help?

1. Check `MIGRATION_GUIDE.md` for detailed instructions
2. Review `SCHEMA_OVERVIEW.md` for schema details
3. Check Supabase logs for error messages
4. Verify RLS policies are working

---

**Schema Version:** 1.0.0
**Last Updated:** 2025-01-10
