# Testing Utilities

Complete testing toolkit for Arm Wrestling Pro app. Test all features without needing RevenueCat or paid developer accounts.

## 📁 Folder Structure

```
testing/
├── README.md (this file)
├── scripts/          # SQL scripts for Supabase
│   ├── 01-grant-premium.sql
│   ├── 02-revoke-premium.sql
│   ├── 03-create-test-data.sql
│   ├── 04-clear-test-data.sql
│   └── 05-get-user-id.sql
├── docs/             # Testing documentation
│   ├── TESTING_GUIDE.md
│   ├── PREMIUM_TESTING_SCENARIOS.md
│   └── UNIT_TESTING_GUIDE.md
└── data/             # (Future: JSON test data files)
```

---

## 🚀 Quick Start

### 1. Get Your User ID
```bash
# In Supabase SQL Editor, run:
testing/scripts/05-get-user-id.sql
```

### 2. Grant Yourself Premium
```bash
# Edit and run:
testing/scripts/01-grant-premium.sql
# Replace 'your-email@example.com' with your email
```

### 3. Generate Test Data
```bash
# Edit and run:
testing/scripts/03-create-test-data.sql
# Replace 'YOUR_USER_ID' (2 places) with your user ID
```

### 4. Restart App
```bash
# Force close and restart to see changes
```

---

## 📜 SQL Scripts

### `01-grant-premium.sql`
**Purpose**: Give premium access to any user

**Usage**:
```sql
-- Edit the email or user ID
UPDATE profiles
SET is_premium = true, is_test_user = true
WHERE email = 'your-email@example.com';
```

**Result**: User gets PRO badge, no ads, unlimited features

---

### `02-revoke-premium.sql`
**Purpose**: Remove premium access (test free tier)

**Usage**:
```sql
-- Edit the email or user ID
UPDATE profiles
SET is_premium = false, is_test_user = false
WHERE email = 'your-email@example.com';
```

**Result**: User becomes free tier, sees ads and limits

---

### `03-create-test-data.sql`
**Purpose**: Generate realistic test data

**Usage**:
```sql
-- Replace YOUR_USER_ID in 2 places
DO $$
DECLARE
  test_user_id UUID := 'YOUR_USER_ID'; -- ⚠️ REPLACE THIS
  ...
```

**Creates**:
- 📊 ~25 workouts (last 2 months)
- 🏋️ 1 active training cycle
- 🎯 3 active goals + 2 completed goals
- 💪 Multiple PR test entries
- 📅 4 upcoming scheduled trainings

---

### `04-clear-test-data.sql`
**Purpose**: Delete all test data

**Usage**:
```sql
-- Replace YOUR_USER_ID
DO $$
DECLARE
  test_user_id UUID := 'YOUR_USER_ID'; -- ⚠️ REPLACE THIS
  ...
```

**Deletes**: All workouts, cycles, goals, tests, schedules

---

### `05-get-user-id.sql`
**Purpose**: Find your user ID

**Usage**:
```sql
-- Find by email
SELECT id, email, full_name
FROM profiles
WHERE email = 'your-email@example.com';
```

**Returns**: Your UUID (needed for other scripts)

---

## 📚 Documentation

### `TESTING_GUIDE.md`
Complete testing guide covering:
- Quick start instructions
- Testing premium features
- Generating test data
- Testing scenarios & checklists
- Common issues & solutions

### `PREMIUM_TESTING_SCENARIOS.md`
Comprehensive premium feature tests:
- Visual indicators (PRO badge)
- Ad management
- Feature limits
- Analytics access
- Subscription management
- Paywall navigation
- Edge cases

### `UNIT_TESTING_GUIDE.md`
Complete unit testing guide:
- Running tests locally and in CI/CD
- Writing new unit tests
- Test coverage reports
- Troubleshooting test issues
- Jest configuration

---

## 🎯 Common Testing Workflows

### Workflow 1: Test Premium Features

```bash
1. Get User ID → 05-get-user-id.sql
2. Grant Premium → 01-grant-premium.sql
3. Restart app
4. Verify PRO badge appears
5. Verify ads hidden
6. Test unlimited cycles
7. Revoke Premium → 02-revoke-premium.sql
8. Restart app
9. Verify limits enforced
```

### Workflow 2: Populate Fresh Account

```bash
1. Get User ID → 05-get-user-id.sql
2. Clear Data → 04-clear-test-data.sql (if needed)
3. Create Data → 03-create-test-data.sql
4. Grant Premium → 01-grant-premium.sql (optional)
5. Restart app
6. Explore populated app
```

### Workflow 3: Test Free → Premium Flow

```bash
1. Start as free user (02-revoke-premium.sql)
2. Restart app
3. Try to create 2nd cycle → Paywall appears
4. Grant premium (01-grant-premium.sql)
5. Restart app
6. Create unlimited cycles
```

---

## 💡 Pro Tips

### Tip 1: Always Restart After SQL Changes
```bash
# Force close the app completely
# Then reopen - changes won't appear otherwise
```

### Tip 2: Use Test User Flag
```sql
-- Mark yourself as test user (shows in profile)
UPDATE profiles
SET is_test_user = true
WHERE email = 'your-email@example.com';
```

### Tip 3: Quick Premium Toggle
```sql
-- Save this as a snippet in Supabase
UPDATE profiles
SET is_premium = NOT is_premium -- Toggles true/false
WHERE email = 'your-email@example.com';
```

### Tip 4: Check Your Status Anytime
```sql
SELECT email, is_premium, is_test_user
FROM profiles
WHERE email = 'your-email@example.com';
```

---

## 🐛 Troubleshooting

### Problem: Premium status not updating

**Solutions**:
1. Force close and restart app (don't just refresh)
2. Verify SQL ran successfully (check for errors)
3. Run status check query to confirm database update
4. Clear app cache if persists

### Problem: Test data not appearing

**Solutions**:
1. Verify you replaced `YOUR_USER_ID` in the script
2. Pull to refresh on Home screen
3. Check Supabase logs for SQL errors
4. Restart app

### Problem: Can't find my user ID

**Solution**:
```sql
-- List all users sorted by newest first
SELECT id, email, created_at
FROM profiles
ORDER BY created_at DESC;
```

---

## 📋 Testing Checklist

Use this before each release:

### Premium Features
- [ ] Grant premium → PRO badge appears
- [ ] Revoke premium → PRO badge disappears
- [ ] Premium: Ads hidden
- [ ] Free: Ads visible
- [ ] Premium: Unlimited cycles
- [ ] Free: 1 cycle limit with paywall
- [ ] "Manage Subscription" button works
- [ ] "Restore Purchases" button works

### Data Creation
- [ ] Can create workouts
- [ ] Can create goals
- [ ] Can create cycles
- [ ] Can record PRs
- [ ] Can schedule trainings
- [ ] Stats calculate correctly

### Test Data Scripts
- [ ] Grant premium works
- [ ] Revoke premium works
- [ ] Create test data works
- [ ] Clear test data works
- [ ] Get user ID works

---

## 🔐 Security Note

**IMPORTANT**: These scripts are for **development and testing only**.

- ⚠️ Never run these on production database
- ⚠️ Never commit actual user IDs or emails to git
- ⚠️ Use separate test accounts, not real user accounts
- ⚠️ Always verify which database you're connected to before running scripts

---

## 🚧 Future Enhancements

Ideas for expanding this testing toolkit:

- [ ] Automated test runner (Jest tests)
- [ ] Mock RevenueCat responses
- [ ] Performance benchmarking scripts
- [ ] API endpoint testing
- [ ] Screenshot comparison tests
- [ ] CSV data import/export
- [ ] Seed data generators
- [ ] User journey simulators

---

## 📞 Need Help?

If you encounter issues:

1. Check the docs: `docs/TESTING_GUIDE.md`
2. Review common issues section above
3. Verify Supabase connection and permissions
4. Check app console logs for errors

---

## 📄 License

These testing utilities are part of the Arm Wrestling Pro project.
For internal development and testing use only.

---

**Happy Testing!** 🎉

Last Updated: 2025-01-11
