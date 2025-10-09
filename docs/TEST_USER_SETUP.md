# Test User Setup Instructions

This document explains how to set up test users with premium access for development and testing purposes.

## What is a Test User?

A test user is an account that has premium features enabled automatically, regardless of subscription status. This allows you to:
- Test premium features without a real subscription
- Access paywalled features during development
- Demonstrate the app with full functionality

## How to Create a Test User

### Method 1: Via Supabase Dashboard

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **Table Editor** → **profiles**
4. Find your user account (or create a new one first by registering in the app)
5. Edit the user's row
6. Set `is_test_user` to `true`
7. Save the changes

### Method 2: Via SQL Query

Run this SQL query in the Supabase SQL Editor:

```sql
-- Update existing user by email
UPDATE profiles
SET is_test_user = true
WHERE email = 'your-test-email@example.com';

-- Or update by user ID
UPDATE profiles
SET is_test_user = true
WHERE id = 'user-uuid-here';
```

## Test User Benefits

When `is_test_user` is set to `true`, the user will:
- ✓ Have `isPremium` return `true` in the app
- ✓ See no advertisements
- ✓ Access all premium features without limits
- ✓ See a "Test User" badge in their profile
- ✓ Bypass all paywall restrictions

## Verifying Test User Status

1. Log in to the app with your test user account
2. Go to the **Profile** tab
3. You should see:
   - "Premium Member" badge at the top
   - "Test User - Premium Access Enabled" banner
   - Account Status showing "Premium"

## Recommended Test Users

For development, create test users with these emails:
- `test@armwrestling.pro` - Primary test account
- `demo@armwrestling.pro` - Demo/presentation account
- `dev@armwrestling.pro` - Developer testing account

## Important Notes

- Test user status is stored in the database, not in code
- You can toggle test user status on/off at any time
- Test users still need valid authentication credentials
- Regular users with `is_premium = true` will also have premium access
- Test users are useful for development but should not be used in production

## Example SQL to Create a Test User

```sql
-- After a user registers, make them a test user
UPDATE profiles
SET is_test_user = true,
    full_name = 'Test User'
WHERE email = 'test@armwrestling.pro';
```

## Removing Test User Status

To remove test user access:

```sql
UPDATE profiles
SET is_test_user = false
WHERE email = 'your-test-email@example.com';
```

---

**Developer Note**: The test user feature is implemented in `contexts/AuthContext.tsx` where `isPremium` checks both `is_premium` and `is_test_user` flags.
