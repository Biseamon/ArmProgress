# Testing Guide for Arm Wrestling Pro

Complete guide for testing all features of the app without needing RevenueCat or paid developer accounts.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Testing Premium Features](#testing-premium-features)
3. [Generating Test Data](#generating-test-data)
4. [Testing Scenarios](#testing-scenarios)
5. [Common Issues](#common-issues)

---

## 🚀 Quick Start

### Step 1: Get Your User ID

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Run the script: `testing/scripts/05-get-user-id.sql`
5. Copy your `id` (looks like: `550e8400-e29b-41d4-a716-446655440000`)

### Step 2: Grant Yourself Premium Access

1. Open `testing/scripts/01-grant-premium.sql`
2. Replace `'your-email@example.com'` with your actual email
3. Run the script in Supabase SQL Editor
4. **Restart your app** to see changes

### Step 3: Generate Test Data (Optional)

1. Open `testing/scripts/03-create-test-data.sql`
2. Replace `'YOUR_USER_ID'` (appears 2 times) with your actual user ID
3. Run the script in Supabase SQL Editor
4. **Refresh your app** to see the data

---

## 🎯 Testing Premium Features

### What Changes When You're Premium?

| Feature | Free Tier | Premium Tier |
|---------|-----------|--------------|
| **Workouts** | Unlimited | Unlimited |
| **Training Cycles** | 1 cycle max | Unlimited |
| **Goals** | 5 active max | Unlimited |
| **PRs/Tests** | Limited history | Full history |
| **Analytics** | Basic charts | 6 advanced charts |
| **Ads** | Shown | Hidden |
| **Data Export** | ❌ | ✅ |
| **PRO Badge** | ❌ | ✅ (Home & Profile) |

### Testing the PRO Badge

1. **Grant Premium**: Run `01-grant-premium.sql`
2. **Restart App**
3. **Check Home Screen**: PRO badge should appear next to your name
4. **Check Profile**: Should show "Premium Member" instead of "Upgrade" button

### Testing Premium Gates

#### Test 1: Training Cycle Limit
1. **Revoke Premium**: Run `02-revoke-premium.sql`
2. **Restart App**
3. Go to **Training** tab
4. Try to create a **2nd cycle** → Should show PaywallModal
5. **Grant Premium**: Run `01-grant-premium.sql`
6. **Restart App**
7. Try to create cycle → Should work without paywall

#### Test 2: Advanced Analytics
1. **Revoke Premium**: Run `02-revoke-premium.sql`
2. Go to **Progress** tab
3. Scroll to graphs → Should see "upgrade" prompts
4. **Grant Premium**: Run `01-grant-premium.sql`
5. **Restart App**
6. Check graphs → Should see all 6 chart types

#### Test 3: Ad Banner
1. **Revoke Premium**: Run `02-revoke-premium.sql`
2. **Restart App**
3. Go to **Home** tab → Should see ad banner placeholder
4. Go to **Calendar** tab → Should see ad banner
5. **Grant Premium**: Run `01-grant-premium.sql`
6. **Restart App**
7. Ads should be hidden on all screens

---

## 📊 Generating Test Data

### Scenario 1: New User (Empty State)

**Purpose**: Test empty states and first-time user experience

**Steps**:
1. Make sure you have NO data (or run `04-clear-test-data.sql`)
2. Open app
3. **Expected**:
   - Home: "No workouts yet" message
   - Training: Empty cycle list
   - Progress: Empty goals and PRs
   - Calendar: Empty calendar

### Scenario 2: Active User (With Data)

**Purpose**: Test full feature set with realistic data

**Steps**:
1. Run `03-create-test-data.sql` (replace YOUR_USER_ID)
2. **Refresh app**
3. **Expected**:
   - Home: Shows recent workouts and stats
   - Training: Active cycle displayed
   - Progress: Active and completed goals visible
   - Progress: Multiple PR test entries
   - Calendar: Upcoming scheduled trainings

**What Gets Created**:
- ✅ ~25 workouts (spread over 2 months)
- ✅ 1 active training cycle
- ✅ 3 active goals (in progress)
- ✅ 2 completed goals
- ✅ Multiple PR test entries (wrist curl, static hold, arm curl)
- ✅ 4 scheduled upcoming training sessions

### Scenario 3: Clean Slate

**Purpose**: Remove all data and start fresh

**Steps**:
1. Run `04-clear-test-data.sql` (replace YOUR_USER_ID)
2. **Restart app**
3. All data cleared - back to empty states

---

## 🧪 Testing Scenarios

### Test Suite 1: Premium Flow

1. ✅ **Free → Premium**
   - Start as free user
   - Click "Get Premium Now" in profile
   - Verify paywall screen opens
   - Grant premium via SQL
   - Verify PRO badge appears

2. ✅ **Premium → Free**
   - Start as premium user
   - Revoke premium via SQL
   - Verify PRO badge disappears
   - Verify ads appear
   - Verify premium features show upgrade prompts

### Test Suite 2: Data Creation

1. ✅ **Create Workout**
   - Go to Training → Record Workout
   - Fill in details
   - Save
   - Verify appears on Home screen

2. ✅ **Create Goal**
   - Go to Progress → New Goal
   - Set target and deadline
   - Save
   - Verify appears in active goals
   - Test increment/decrement

3. ✅ **Create Training Cycle**
   - Go to Training → New Cycle
   - Enter cycle details
   - Save
   - Verify appears in cycles list

4. ✅ **Record PR**
   - Go to Progress → Record PR
   - Select test type
   - Enter result
   - Save
   - Verify appears in tests list

### Test Suite 3: Limits & Gates

1. ✅ **Free Tier Cycle Limit**
   - As free user
   - Create 1 cycle → Should work
   - Try to create 2nd cycle → Should show paywall

2. ✅ **Premium Analytics Access**
   - As free user → Limited charts
   - As premium → All 6 charts visible

### Test Suite 4: Theme & Settings

1. ✅ **Dark/Light Mode**
   - Toggle in profile
   - Verify all screens update
   - Check text contrast

2. ✅ **Weight Unit Toggle**
   - Change lbs ↔ kg in profile
   - Verify PR values convert correctly
   - Check throughout app

### Test Suite 5: Scheduled Trainings

1. ✅ **Create Schedule**
   - Go to Training → Schedule
   - Create new training session
   - Set date, time, notification
   - Save
   - Verify appears on Home and Calendar

2. ✅ **Complete Training**
   - Mark training as complete
   - Verify removed from upcoming
   - Check history

---

## 🐛 Common Issues & Solutions

### Issue: "Premium status not updating"

**Solution**:
1. Make sure you ran the SQL script correctly
2. **Force close and restart the app** (don't just refresh)
3. Check Supabase logs for errors
4. Verify `is_premium` and `is_test_user` are both `true` in database

### Issue: "PRO badge not showing"

**Solution**:
1. Restart app after granting premium
2. Check `is_premium = true` in profiles table
3. Clear app cache (Settings → Storage → Clear cache)

### Issue: "Test data not appearing"

**Solution**:
1. Verify you replaced `YOUR_USER_ID` in the SQL script
2. Check for SQL errors in Supabase logs
3. Pull to refresh on Home screen
4. Restart app

### Issue: "Can't find my user ID"

**Solution**:
Run this in Supabase SQL Editor:
```sql
SELECT id, email FROM profiles ORDER BY created_at DESC;
```

### Issue: "Ads still showing as premium"

**Solution**:
1. Verify `is_premium = true` in database
2. Restart app completely
3. Check `isPremium` value in console logs

---

## 📝 Testing Checklist

Use this checklist before releasing updates:

### Core Features
- [ ] User can sign up and log in
- [ ] User can create profile
- [ ] User can upload avatar
- [ ] User can toggle theme
- [ ] User can toggle weight units

### Workouts
- [ ] Can create workout
- [ ] Can view workout history
- [ ] Workouts show on home screen
- [ ] Stats calculate correctly

### Training Cycles
- [ ] Can create cycle (premium check)
- [ ] Can view cycle details
- [ ] Can edit/delete cycle
- [ ] Progress bar updates

### Goals
- [ ] Can create goal
- [ ] Can increment/decrement progress
- [ ] Progress bar updates correctly
- [ ] Can complete goals
- [ ] Completed goals show in history

### PRs/Tests
- [ ] Can record PR
- [ ] Multiple test types work
- [ ] Unit conversion works (kg/lbs)
- [ ] History displays correctly

### Premium Features
- [ ] PRO badge shows when premium
- [ ] Ads hidden when premium
- [ ] Premium gates work correctly
- [ ] Paywall screen functional
- [ ] "Manage Subscription" button works

### Scheduled Trainings
- [ ] Can create schedule
- [ ] Shows on calendar
- [ ] Shows on home screen
- [ ] Can mark complete
- [ ] Notifications work (if enabled)

---

## 🔄 Reset Everything

To completely reset your account for fresh testing:

```sql
-- Run in Supabase SQL Editor
DELETE FROM scheduled_trainings WHERE user_id = 'YOUR_USER_ID';
DELETE FROM tests WHERE user_id = 'YOUR_USER_ID';
DELETE FROM goals WHERE user_id = 'YOUR_USER_ID';
DELETE FROM workouts WHERE user_id = 'YOUR_USER_ID';
DELETE FROM cycles WHERE user_id = 'YOUR_USER_ID';

UPDATE profiles
SET is_premium = false, is_test_user = false
WHERE id = 'YOUR_USER_ID';
```

---

## 📞 Support

If you encounter issues:
1. Check console logs for errors
2. Verify SQL scripts ran successfully
3. Check Supabase dashboard for data
4. Restart app after database changes

Happy testing! 🎉
