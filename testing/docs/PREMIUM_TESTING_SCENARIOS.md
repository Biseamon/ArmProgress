# Premium Feature Testing Scenarios

Comprehensive test scenarios for premium features without needing RevenueCat.

## 🎯 Overview

This guide covers all premium features and how to test them using test user flags.

---

## 1️⃣ Visual Indicators

### PRO Badge Testing

#### Test 1.1: Home Screen PRO Badge
**Setup**: Grant premium access
```sql
UPDATE profiles SET is_premium = true WHERE email = 'your-email@example.com';
```

**Steps**:
1. Restart app
2. Go to Home screen
3. **Expected**: PRO badge appears next to your name (right side)
4. **Badge should**:
   - Show "PRO" text
   - Have golden/premium color background
   - Be inline with user name
   - Be responsive (larger on tablets)

**Test States**:
- ✅ Premium: Badge visible
- ✅ Free: No badge

---

#### Test 1.2: Profile Screen Premium Status
**Steps**:
1. Go to Profile tab
2. **Expected (Premium)**:
   - Header shows "Premium Member" badge with crown icon
   - "Premium Membership" section title
   - "Manage Subscription" button visible
   - "Restore Purchases" button visible
   - Premium benefits listed

**Expected (Free)**:
   - "Upgrade to Premium" button in header
   - "Premium Benefits" section title
   - "Get Premium Now" large button
   - "Restore Purchases" button
   - Benefits listed with upgrade CTA

---

## 2️⃣ Ad Management

### Ad Banner Testing

#### Test 2.1: Home Screen Ad Banner
**Setup**: Toggle premium status

**Free User**:
```sql
UPDATE profiles SET is_premium = false WHERE email = 'your-email@example.com';
```
- Go to Home screen
- **Expected**: Ad banner placeholder visible below header
- Banner shows: "📱 Ad Space - 300x250"

**Premium User**:
```sql
UPDATE profiles SET is_premium = true WHERE email = 'your-email@example.com';
```
- Go to Home screen
- **Expected**: No ad banner (completely hidden)

#### Test 2.2: Calendar Screen Ad Banner
**Same as 2.1 but on Calendar tab**
- Free: Shows ad
- Premium: No ad

---

## 3️⃣ Feature Limits

### Training Cycles Limit

#### Test 3.1: Free User Cycle Limit
**Setup**: Remove premium
```sql
UPDATE profiles SET is_premium = false WHERE email = 'your-email@example.com';
```

**Steps**:
1. Restart app
2. Go to Training tab
3. Create your first cycle → **Should succeed**
4. Try to create second cycle → **Should show PaywallModal**
5. Click "View Premium Plans" → Navigate to paywall screen
6. Click "Maybe Later" → Return to training

**Expected Behavior**:
- First cycle: ✅ Creates successfully
- Second cycle: ❌ Shows modal with premium features list
- Modal has "View Premium Plans" and "Maybe Later" buttons

#### Test 3.2: Premium User Unlimited Cycles
**Setup**: Grant premium
```sql
UPDATE profiles SET is_premium = true WHERE email = 'your-email@example.com';
```

**Steps**:
1. Restart app
2. Go to Training tab
3. Create multiple cycles → **All should succeed**
4. No paywall should appear

**Expected**: Can create unlimited cycles

---

### Goals Limit (Future Implementation)

#### Test 3.3: Free User Goal Limit
*Currently not enforced, but prepared for*

**Free**: 5 active goals max
**Premium**: Unlimited

---

## 4️⃣ Analytics & Charts

### Advanced Analytics Access

#### Test 4.1: Progress Graphs (Free User)
**Setup**: Remove premium
```sql
UPDATE profiles SET is_premium = false WHERE email = 'your-email@example.com';
```

**Steps**:
1. Go to Progress tab
2. Scroll to "Progress Graphs" section
3. **Expected**: Limited chart views
4. Premium features may show lock icon or upgrade prompt

#### Test 4.2: Progress Graphs (Premium User)
**Setup**: Grant premium
```sql
UPDATE profiles SET is_premium = true WHERE email = 'your-email@example.com';
```

**Steps**:
1. Go to Progress tab
2. Scroll to "Progress Graphs" section
3. **Expected**: All 6 chart types available:
   - PR Timeline
   - Workout Frequency
   - Intensity Heatmap
   - Progress Velocity
   - Consistency Score
   - Body Measurements

---

## 5️⃣ Subscription Management

### Manage Subscription Flow

#### Test 5.1: Manage Subscription Button (iOS)
**Setup**: Grant premium, test on iOS device

**Steps**:
1. Go to Profile tab
2. Scroll to "Premium Membership" section
3. Tap "Manage Subscription" button
4. **Expected**: Opens App Store subscriptions page
5. User can cancel/modify subscription there

#### Test 5.2: Manage Subscription Button (Android)
**Same as 5.1 but opens Google Play subscriptions**

---

### Restore Purchases Flow

#### Test 5.3: Restore Purchases (Free User)
**Setup**: Remove premium
```sql
UPDATE profiles SET is_premium = false WHERE email = 'your-email@example.com';
```

**Steps**:
1. Go to Profile → Premium Benefits section
2. Tap "Restore Purchases" button
3. **Expected**: Shows alert "Restoring Purchases..."
4. If no purchases found: "No previous purchases found"
5. If purchases found: Premium restored, PRO badge appears

#### Test 5.4: Restore Purchases (Premium User)
**Setup**: Grant premium

**Steps**:
1. Go to Profile → Premium Membership section
2. Tap "Restore Purchases" button
3. **Expected**: Confirms "Your purchases have been restored!"
4. Premium status maintained

---

## 6️⃣ Paywall Screen

### Paywall Navigation

#### Test 6.1: Access from Profile
**Steps**:
1. Go to Profile (as free user)
2. Tap "Upgrade to Premium" button → Opens paywall
3. OR tap "Get Premium Now" → Opens paywall

**Expected**: Full-screen paywall with:
- Crown icon
- "Upgrade to Premium" title
- Feature list (8+ features)
- Package selection (monthly/annual)
- "Subscribe Now" button
- "Restore Purchases" button
- Legal links (Privacy & Terms)

#### Test 6.2: Access from PaywallModal
**Steps**:
1. Trigger any premium gate (e.g., create 2nd cycle as free user)
2. PaywallModal appears
3. Tap "View Premium Plans"
4. **Expected**: Navigates to full paywall screen

#### Test 6.3: Paywall as Premium User
**Setup**: Grant premium

**Steps**:
1. Navigate to `/paywall` (e.g., via deep link)
2. **Expected**: Shows "You're a Premium Member!" screen
   - Crown icon
   - "You're a Premium Member!" title
   - "You have access to all premium features" message
   - "Back to App" button

---

## 7️⃣ Data & Limits

### Workout History

#### Test 7.1: Workout History Access
**Free**: All workouts visible (no limit)
**Premium**: All workouts visible

*Note: Currently no limit on workout history for free users*

---

### Test Data Volume

#### Test 7.2: High Volume Data
**Setup**: Create large dataset
```sql
-- Run 03-create-test-data.sql multiple times
-- OR manually create 50+ workouts, 10+ goals, etc.
```

**Steps**:
1. Open app as free user
2. Check performance and loading times
3. Grant premium
4. Check if any performance differences

**Expected**: Premium users may see performance optimizations

---

## 8️⃣ Edge Cases

### Rapid Status Changes

#### Test 8.1: Quick Toggle Premium
**Steps**:
1. Start as free user
2. Grant premium via SQL
3. **Immediately** restart app
4. Verify PRO badge appears
5. Revoke premium via SQL
6. **Immediately** restart app
7. Verify PRO badge disappears

**Expected**: Status changes take effect after app restart

---

### Offline Behavior

#### Test 8.2: Offline Premium Status
**Steps**:
1. Grant premium
2. Restart app (load premium status)
3. Turn on Airplane Mode
4. Navigate through app
5. **Expected**: Premium status cached, features accessible offline

---

### Multiple Devices

#### Test 8.3: Premium Sync Across Devices
**Setup**: Same account on 2 devices

**Steps**:
1. Device A: Grant premium via SQL
2. Device B: Restart app
3. **Expected**: Device B shows premium status
4. **Note**: Without RevenueCat, this requires manual database update

---

## 9️⃣ User Flow Testing

### Complete Free → Premium Journey

#### Test 9.1: Full Conversion Flow
**Setup**: Start fresh as free user

**Steps**:
1. ✅ Create account
2. ✅ Use app, hit a limit (e.g., 2nd cycle)
3. ✅ See PaywallModal
4. ✅ Click "View Premium Plans"
5. ✅ View paywall with packages
6. ✅ Grant premium via SQL (simulating purchase)
7. ✅ Restart app
8. ✅ Verify PRO badge appears
9. ✅ Verify limits removed
10. ✅ Verify ads hidden
11. ✅ Can manage subscription

**Expected**: Smooth transition with all premium features activated

---

## 🧪 Automated Test Scenarios

### SQL Test Suite

#### Run Full Test Cycle
```sql
-- 1. Setup: Create test user with premium
UPDATE profiles
SET is_premium = true, is_test_user = true
WHERE email = 'test@example.com';

-- 2. Verify premium features enabled
SELECT
  id,
  email,
  is_premium,
  is_test_user,
  (SELECT COUNT(*) FROM cycles WHERE user_id = profiles.id) as cycle_count
FROM profiles
WHERE email = 'test@example.com';

-- 3. Revoke premium
UPDATE profiles
SET is_premium = false
WHERE email = 'test@example.com';

-- 4. Verify premium features disabled
SELECT
  id,
  email,
  is_premium,
  is_test_user
FROM profiles
WHERE email = 'test@example.com';

-- 5. Cleanup
UPDATE profiles
SET is_test_user = false
WHERE email = 'test@example.com';
```

---

## ✅ Testing Checklist

Before marking premium features as complete:

### Visual Elements
- [ ] PRO badge shows/hides correctly on home
- [ ] Profile shows correct premium status
- [ ] Ads show for free, hidden for premium
- [ ] Premium badge styling correct (colors, fonts)

### Feature Gates
- [ ] Training cycle limit enforced for free users
- [ ] PaywallModal appears when limit hit
- [ ] Premium users bypass all limits

### Navigation
- [ ] "Get Premium Now" opens paywall
- [ ] "Upgrade to Premium" opens paywall
- [ ] PaywallModal "View Premium Plans" navigates correctly
- [ ] "Manage Subscription" opens store links

### Subscription Management
- [ ] "Restore Purchases" button works
- [ ] "Manage Subscription" opens correct store
- [ ] Premium status persists after restart

### Data & Performance
- [ ] Premium status syncs from database
- [ ] Offline premium status cached
- [ ] No performance degradation with premium

---

## 📊 Test Results Template

Use this template to document your test results:

```
Test Date: YYYY-MM-DD
Tester: Your Name
Platform: iOS/Android
App Version: X.X.X

| Test ID | Scenario | Result | Notes |
|---------|----------|--------|-------|
| 1.1 | Home PRO Badge | ✅ PASS | Badge appears correctly |
| 1.2 | Profile Premium Status | ✅ PASS | All elements visible |
| 2.1 | Home Ad Banner | ✅ PASS | Hidden when premium |
| 3.1 | Cycle Limit (Free) | ❌ FAIL | Paywall didn't appear |
| ... | ... | ... | ... |
```

---

## 🐛 Known Issues & Workarounds

### Issue: Premium status doesn't update immediately
**Workaround**: Force close and restart app after SQL changes

### Issue: Ads still showing after granting premium
**Workaround**: Clear app cache or reinstall

### Issue: PaywallModal shows even when premium
**Workaround**: Verify `is_premium = true` in database, restart app

---

Happy testing! 🎉
