# Database Schema Overview

Complete database schema for Arm Wrestling Pro training tracker.

## Schema Version

**Version:** 1.0.0
**Date:** 2025-01-10
**Migration File:** `20251110_complete_schema.sql`

## Architecture

### Entity Relationship Diagram

```
┌─────────────┐
│ auth.users  │ (Supabase Auth)
└──────┬──────┘
       │
       │ 1:1
       ▼
┌─────────────────────────────────────┐
│ profiles                            │
│ ─────────────────────────────────── │
│ • id (PK, FK -> auth.users)        │
│ • email                             │
│ • full_name                         │
│ • avatar_url                        │
│ • is_premium                        │
│ • is_test_user                      │
│ • weight_unit (lbs/kg)              │
│ • premium_expires_at                │
│ • created_at, updated_at            │
└─────┬───────────────────────────────┘
      │
      │ 1:N
      ├─────────┬─────────┬─────────┬──────────┬────────────┬──────────────┐
      │         │         │         │          │            │              │
      ▼         ▼         ▼         ▼          ▼            ▼              ▼
┌──────────┐ ┌──────┐ ┌──────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐
│  cycles  │ │goals │ │tests │ │  body_   │ │scheduled │ │ workouts │ │                 │
│          │ │      │ │      │ │  measure │ │trainings │ │          │ │                 │
└────┬─────┘ └──────┘ └──────┘ └──────────┘ └──────────┘ └────┬─────┘ │                 │
     │                                                          │       │                 │
     │ 1:N                                                      │ 1:N   │                 │
     │                                                          ▼       │                 │
     └──────────────────────────────────────────────────┬─► ┌──────────┐                │
                                                        │   │exercises │                │
                                                        │   └──────────┘                │
                                                        │                               │
                                                        └───────────────────────────────┘
```

## Tables

### 1. profiles
**Purpose:** User profiles linked to Supabase auth.users

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, FK -> auth.users | User ID from auth |
| email | TEXT | NOT NULL | User's email |
| full_name | TEXT | | Display name |
| avatar_url | TEXT | | Profile picture URL |
| is_premium | BOOLEAN | DEFAULT false | Premium subscription status |
| is_test_user | BOOLEAN | DEFAULT false | Test user flag (gets premium) |
| weight_unit | TEXT | CHECK (lbs/kg), DEFAULT 'lbs' | Preferred weight unit |
| premium_expires_at | TIMESTAMPTZ | | Premium expiration date |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Account creation |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**RLS:** ✅ Enabled - Users can only access their own profile

**Triggers:**
- `on_auth_user_created` - Auto-creates profile on signup
- `update_profiles_updated_at` - Auto-updates timestamp

---

### 2. cycles
**Purpose:** Training cycles for periodized programming

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Cycle ID |
| user_id | UUID | FK -> profiles, NOT NULL | Owner |
| name | TEXT | NOT NULL | Cycle name |
| description | TEXT | | Optional description |
| cycle_type | TEXT | CHECK enum, NOT NULL | Type of cycle |
| start_date | DATE | NOT NULL | Cycle start |
| end_date | DATE | NOT NULL | Cycle end |
| is_active | BOOLEAN | DEFAULT false | Currently active? |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation date |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Valid cycle_types:**
- `strength` - Strength building phase
- `technique` - Technical skill development
- `conditioning` - Cardiovascular conditioning
- `recovery` - Recovery/deload phase
- `competition_prep` - Pre-competition preparation
- `off_season` - Off-season maintenance

**RLS:** ✅ Enabled - Users can only access their own cycles

**Constraints:**
- `end_date` must be >= `start_date`

---

### 3. workouts
**Purpose:** Individual workout sessions

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Workout ID |
| user_id | UUID | FK -> profiles, NOT NULL | Owner |
| cycle_id | UUID | FK -> cycles, NULL | Associated cycle |
| workout_type | TEXT | NOT NULL | Type of workout |
| duration_minutes | INTEGER | CHECK > 0 | Workout duration |
| intensity | INTEGER | CHECK 1-10 | Intensity rating |
| notes | TEXT | | Workout notes |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Logged date |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**RLS:** ✅ Enabled - Users can only access their own workouts

**Indexes:**
- `idx_workouts_user_id` - Query by user
- `idx_workouts_cycle_id` - Query by cycle
- `idx_workouts_created_at` - Sort by date (DESC)

---

### 4. exercises
**Purpose:** Individual exercises within a workout

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Exercise ID |
| workout_id | UUID | FK -> workouts, NOT NULL | Parent workout |
| exercise_name | TEXT | NOT NULL | Exercise name |
| sets | INTEGER | CHECK >= 0, DEFAULT 0 | Number of sets |
| reps | INTEGER | CHECK >= 0, DEFAULT 0 | Reps per set |
| weight_lbs | DECIMAL(10,2) | CHECK >= 0, DEFAULT 0 | Weight used |
| weight_unit | TEXT | CHECK (lbs/kg), DEFAULT 'lbs' | Weight unit |
| notes | TEXT | | Exercise notes |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Logged date |

**RLS:** ✅ Enabled - Users can only access exercises from their workouts

**Note:** RLS enforced through workout ownership

---

### 5. goals
**Purpose:** User-defined training goals

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Goal ID |
| user_id | UUID | FK -> profiles, NOT NULL | Owner |
| goal_type | TEXT | NOT NULL | Goal description |
| target_value | DECIMAL(10,2) | CHECK > 0, NOT NULL | Target to reach |
| current_value | DECIMAL(10,2) | CHECK >= 0, DEFAULT 0 | Current progress |
| deadline | DATE | | Optional deadline |
| is_completed | BOOLEAN | DEFAULT false | Completed? |
| notes | TEXT | | Goal notes |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation date |

**RLS:** ✅ Enabled - Users can only access their own goals

**Utility Functions:**
- `goal_progress_percentage(goal_id)` - Calculate progress %

---

### 6. strength_tests
**Purpose:** Periodic strength assessment results

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Test ID |
| user_id | UUID | FK -> profiles, NOT NULL | Owner |
| test_type | TEXT | NOT NULL | Type of test |
| result_value | DECIMAL(10,2) | CHECK > 0, NOT NULL | Test result |
| result_unit | TEXT | CHECK (lbs/kg), DEFAULT 'lbs' | Result unit |
| notes | TEXT | | Test notes |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Test date |

**RLS:** ✅ Enabled - Users can only access their own tests

**Common test_types:**
- `max_wrist_curl`
- `table_pressure`
- `hook_strength`
- `top_roll_strength`

---

### 7. body_measurements
**Purpose:** Physical measurements tracked over time

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Measurement ID |
| user_id | UUID | FK -> profiles, NOT NULL | Owner |
| weight | DECIMAL(10,2) | CHECK > 0 | Body weight |
| weight_unit | TEXT | CHECK (lbs/kg), DEFAULT 'lbs' | Weight unit |
| arm_circumference | DECIMAL(10,2) | CHECK > 0 | Arm size (cm) |
| forearm_circumference | DECIMAL(10,2) | CHECK > 0 | Forearm size (cm) |
| wrist_circumference | DECIMAL(10,2) | CHECK > 0 | Wrist size (cm) |
| notes | TEXT | | Measurement notes |
| measured_at | DATE | DEFAULT CURRENT_DATE | Measurement date |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Logged date |

**RLS:** ✅ Enabled - Users can only access their own measurements

---

### 8. scheduled_trainings
**Purpose:** Planned future workout sessions

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Schedule ID |
| user_id | UUID | FK -> profiles, NOT NULL | Owner |
| title | TEXT | NOT NULL | Workout title |
| description | TEXT | | Workout description |
| scheduled_date | DATE | NOT NULL | Planned date |
| scheduled_time | TIME | NOT NULL | Planned time |
| notification_enabled | BOOLEAN | DEFAULT true | Send notification? |
| notification_minutes_before | INTEGER | CHECK >= 0, DEFAULT 30 | Minutes before |
| notification_id | TEXT | | System notification ID |
| completed | BOOLEAN | DEFAULT false | Marked complete? |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation date |

**RLS:** ✅ Enabled - Users can only access their own schedules

---

## Security

### Row Level Security (RLS)

✅ **All tables have RLS enabled**

**Policy Pattern:**
- Users can only `SELECT`, `INSERT`, `UPDATE`, `DELETE` their own data
- Enforced through `auth.uid() = user_id` check
- Exercises use parent workout ownership for access control

### Permissions

**Authenticated users:**
- Full CRUD on their own data
- No access to other users' data

**Anonymous users:**
- Read-only access to public schema
- No access to user data

**Service role:**
- Full access (for admin operations)

---

## Performance Optimizations

### Indexes

All tables have indexes on:
- Foreign keys (user_id, cycle_id, workout_id)
- Commonly queried columns (created_at, is_active, is_completed)
- Date ranges (for time-series queries)

### Query Patterns

**Get user's recent workouts:**
```sql
SELECT * FROM workouts
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
```
✅ Uses `idx_workouts_user_id` and `idx_workouts_created_at`

**Get active cycle:**
```sql
SELECT * FROM cycles
WHERE user_id = auth.uid() AND is_active = true;
```
✅ Uses `idx_cycles_user_id` and `idx_cycles_is_active`

---

## Data Integrity

### Constraints

**Foreign Keys:**
- All have `ON DELETE CASCADE` or `ON DELETE SET NULL`
- Ensures no orphaned records

**Check Constraints:**
- Positive values for weights, measurements, etc.
- Valid enum values for types and units
- Date ranges (end_date >= start_date)

**NOT NULL:**
- Required fields enforced at database level
- Prevents invalid data entry

---

## Automation

### Triggers

**Profile Creation:**
- Auto-creates profile when user signs up
- Copies email and name from auth.users
- Uses `handle_new_user()` function

**Timestamp Updates:**
- Auto-updates `updated_at` on changes
- Applied to profiles, cycles, workouts

---

## Migration History

| Date | Version | Description |
|------|---------|-------------|
| 2025-01-10 | 1.0.0 | Complete schema migration - replaces all previous migrations |

**Previous migrations (deprecated):**
- `20251104_initial_migration.sql`
- `20251104_create_crud_tables.sql`
- Multiple fix migrations (replaced by complete schema)

---

## Next Steps

1. **Apply migration** - See `MIGRATION_GUIDE.md`
2. **Verify schema** - Run verification queries
3. **Test app** - Ensure all features work
4. **Monitor performance** - Check query performance
5. **Document changes** - Keep this doc updated

---

**Maintained by:** Your Team
**Last Updated:** 2025-01-10
**Schema Version:** 1.0.0
