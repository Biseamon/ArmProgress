# 🚀 Local Development Guide

Quick guide to running your Arm Wrestling Training app locally.

---

## Prerequisites

- Node.js 18+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Supabase account with project created

---

## First-Time Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/armtestapp-rn.git
cd armtestapp-rn

# Install dependencies
npm install
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual credentials
# NEVER commit this file!
```

Edit `.env` with your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-actual-key
```

Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

### 3. Set Up Supabase Database

Run all migrations in order:

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Run each migration file in `supabase/migrations/` in chronological order:
   - `20251104_initial_migration.sql`
   - `20251104_create_crud_tables.sql`
   - (continue with all files in order)
   - **Most important**: `20251110_storage_security.sql` (for secure avatar uploads)

### 4. Create Storage Bucket

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets
2. Click "New bucket"
3. Name: `avatars`
4. Public: ✅ Yes (for public avatar URLs)
5. File size limit: 5 MB
6. Allowed MIME types: `image/jpeg,image/png,image/webp,image/gif`
7. Click "Save"

Then run the `20251110_storage_security.sql` migration to add RLS policies.

---

## Running the App

### Start Development Server

```bash
npm run dev
```

This will:
- Start the Expo development server
- Show a QR code in your terminal
- Open Expo DevTools in your browser

### Run on iOS Simulator (Mac only)

```bash
# In the terminal where Expo is running, press 'i'
# Or run:
npm run ios
```

### Run on Android Emulator

```bash
# Make sure Android emulator is running first
# Then in the terminal where Expo is running, press 'a'
# Or run:
npm run android
```

### Run on Physical Device

1. Install **Expo Go** app on your phone:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. Scan the QR code shown in your terminal with:
   - iOS: Camera app
   - Android: Expo Go app

---

## Common Issues

### "Missing Supabase environment variables"

**Fix**: Make sure you created `.env` file with your credentials.

```bash
# Check if .env exists
ls -la .env

# If not, copy from example
cp .env.example .env
```

### "Failed to fetch" or "Network request failed"

**Fix**: Check your Supabase URL and make sure the project is not paused.

1. Go to: https://supabase.com/dashboard
2. Make sure your project shows "Active" (not "Paused")
3. Verify the URL in `.env` matches your project URL

### "No provider for 'google' is configured"

**Fix**: OAuth providers need to be configured in Supabase.

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/providers
2. Enable and configure the providers you want (Google, Apple, Facebook)
3. Add redirect URLs for development:
   - `exp://192.168.1.XXX:8081` (replace with your local IP)
   - `myapp://auth/callback` (if using custom scheme)

### Avatar upload fails

**Fix**: Make sure storage bucket and RLS policies are set up.

1. Check bucket exists: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets
2. Run the `20251110_storage_security.sql` migration
3. Test by uploading an avatar in the profile screen

### App crashes on startup

**Fix**: Clear cache and restart.

```bash
# Clear Expo cache
npm start -- --clear

# Or
expo start -c

# If that doesn't work, clean install:
rm -rf node_modules
npm install
npm start
```

---

## Development Tips

### Environment-Specific Code

Use `__DEV__` to check if running in development:

```typescript
if (__DEV__) {
  console.log('This only logs in development');
}
```

### Hot Reloading

- Changes to `.tsx` files reload automatically
- Changes to `.env` require restart (`Ctrl+C` then `npm run dev`)
- Changes to native dependencies require rebuild

### Viewing Logs

```bash
# All logs
npm run dev

# iOS logs only
npx react-native log-ios

# Android logs only
npx react-native log-android
```

### Testing Different Scenarios

```typescript
// In your code, you can force different states
const TESTING = __DEV__ && false; // Set to true to test

if (TESTING) {
  // Override user to test premium features
  const testProfile = { ...profile, is_premium: true };
}
```

---

## Database Management

### Viewing Data

Use Supabase Table Editor:
https://supabase.com/dashboard/project/YOUR_PROJECT/editor

### Resetting Database

**Warning**: This deletes all data!

```sql
-- In Supabase SQL Editor, run:
TRUNCATE profiles, workouts, cycles, goals, strength_tests,
         scheduled_trainings, body_measurements CASCADE;
```

### Creating Test Data

```sql
-- Create a test premium user
INSERT INTO profiles (id, email, full_name, is_premium, is_test_user)
VALUES ('your-user-id', 'test@example.com', 'Test User', true, true);

-- Create test workouts
INSERT INTO workouts (user_id, workout_type, duration_minutes, intensity)
VALUES
  ('your-user-id', 'strength', 60, 8),
  ('your-user-id', 'technique', 45, 7);
```

---

## Code Structure

```
armtestapp-rn/
├── app/                    # Screens (using Expo Router)
│   ├── (auth)/            # Login, register, etc.
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── contexts/              # React context providers
├── lib/                   # Utilities and helpers
│   ├── supabase.ts       # Supabase client
│   ├── validation.ts     # Input validation
│   └── weightUtils.ts    # Unit conversion
├── supabase/
│   └── migrations/       # Database migrations
├── .env                  # Your secrets (NEVER commit!)
├── .env.example          # Template for .env
└── package.json          # Dependencies
```

---

## Useful Commands

```bash
# Start dev server
npm run dev

# Type checking
npm run typecheck

# Lint code
npm run lint

# Build for web
npm run build:web

# Clear cache and restart
npm start -- --clear

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

---

## Making Changes

### Adding a New Screen

1. Create file in `app/` directory
2. Expo Router automatically creates route
3. Link to it with `router.push('/screen-name')`

### Adding a New Database Table

1. Create migration in `supabase/migrations/`
2. Run migration in Supabase SQL Editor
3. Add RLS policies
4. Add TypeScript type to `lib/supabase.ts`

### Adding a New Feature

1. Create components in `components/`
2. Add screen in `app/`
3. Update database if needed
4. Test thoroughly
5. Commit changes (make sure no secrets!)

---

## Before Pushing to Git

**⚠️ CRITICAL CHECKLIST**:

- [ ] No secrets in code (no API keys, passwords, etc.)
- [ ] `.env` is in `.gitignore` (it should be!)
- [ ] Only `.env.example` is committed
- [ ] `console.log` statements wrapped in `__DEV__`
- [ ] Code is type-checked (`npm run typecheck`)
- [ ] No TODO comments for critical issues
- [ ] Tested on both iOS and Android
- [ ] Database migrations are included (if you made schema changes)

```bash
# Before committing, check for secrets
git diff

# Make sure .env is ignored
git status --ignored

# If .env shows up in `git status`, it's NOT properly ignored!
# Fix it immediately!
```

---

## Getting Help

### Expo Issues
- Docs: https://docs.expo.dev
- Community: https://forums.expo.dev

### Supabase Issues
- Docs: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions

### React Native Issues
- Docs: https://reactnative.dev
- Community: https://stackoverflow.com/questions/tagged/react-native

---

## Next Steps

Once you're comfortable with local development:

1. Read `PRODUCTION_SECURITY_CHECKLIST.md` before deploying
2. Read `SECURITY_CLEANUP_GUIDE.md` to clean up any leaked secrets
3. Set up error tracking (Sentry)
4. Configure CI/CD for automated deployments
5. Set up staging environment

---

Happy coding! 🎉
