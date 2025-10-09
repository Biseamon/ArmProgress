# Arm Wrestling Pro - Setup Instructions

## Overview

Arm Wrestling Pro is a comprehensive mobile training app for arm wrestlers, featuring:
- Workout tracking with detailed exercise logging
- Goal setting and progress monitoring
- Strength test tracking
- Authentication with Supabase
- Premium subscription model with AdMob monetization
- Free tier with limited features

## Features

### Free Tier
- Up to 5 workouts tracked
- Up to 3 goals
- Basic progress tracking
- Advertisement banners
- Full authentication

### Premium Tier
- Unlimited workout tracking
- Unlimited goals
- Advanced analytics
- No advertisements
- Data export capabilities
- Priority support

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/Password)
- **Monetization**: AdMob (placeholder ready)
- **Icons**: Lucide React Native

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (already set in `.env`):
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. The database schema is already applied via migration

## Running the App

### Development Mode
```bash
npm run dev
```

### Build for Web
```bash
npm run build:web
```

### Type Checking
```bash
npm run typecheck
```

## Database Schema

The app uses the following tables:

### profiles
- User profile information
- Premium subscription status
- Test user flags

### workouts
- Workout sessions with type, duration, and intensity
- Linked to user profiles

### exercises
- Individual exercises within workouts
- Sets, reps, and weight tracking

### goals
- User-defined training goals
- Progress tracking with target values

### strength_tests
- Periodic strength measurements
- Multiple test types supported

## Monetization

### AdMob Integration
AdMob banners are integrated and display for free users. The implementation uses placeholders that show:
- Where ads will appear
- Ad dimensions (320x50)
- Visual indicators in the UI

To activate real ads:
1. Get AdMob app ID
2. Configure in `app.json`
3. Replace placeholder with actual AdMob banner component

### Paywall System
Premium features are locked behind paywalls:
- Workout tracking limit (5 for free users)
- Goal tracking limit (3 for free users)
- PaywallModal component handles upgrade prompts

## Test User Setup

You can create test users with premium access for development:

1. Register a user account in the app
2. Go to Supabase Dashboard → Table Editor → profiles
3. Find your user and set `is_test_user = true`

Or use SQL:
```sql
UPDATE profiles
SET is_test_user = true
WHERE email = 'your-email@example.com';
```

Test users get:
- Full premium access
- No ads
- No feature limits
- Special badge in profile

See `docs/TEST_USER_SETUP.md` for detailed instructions.

## App Structure

```
app/
├── (auth)/              # Authentication screens
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/              # Main app tabs
│   ├── index.tsx        # Home/Dashboard
│   ├── training.tsx     # Workout logging
│   ├── progress.tsx     # Goals & stats
│   └── profile.tsx      # User profile
├── _layout.tsx          # Root layout with AuthProvider
└── index.tsx            # Auth routing logic

components/
├── AdBanner.tsx         # AdMob banner placeholder
└── PaywallModal.tsx     # Premium upgrade modal

contexts/
└── AuthContext.tsx      # Authentication state management

lib/
└── supabase.ts          # Supabase client & types
```

## Key Features Implementation

### Authentication
- Email/password sign up and login
- Automatic profile creation on registration
- Secure session management
- Protected routes

### Workout Tracking
- Multiple workout types (table practice, strength, technique, etc.)
- Duration and intensity tracking
- Optional exercise detail logging
- Sets, reps, and weight tracking per exercise

### Progress Monitoring
- Custom goal creation
- Progress bars showing completion
- Strength test tracking over time
- Multiple test types supported

### Monetization Visibility
- Ad banners visible on all main screens (free users)
- Paywall modals trigger on feature limits
- Clear premium benefits display
- Test user system for demo purposes

## Mobile-Friendly Design

The app is optimized for mobile with:
- Touch-friendly button sizes (min 44x44pt)
- Responsive layouts with proper spacing
- ScrollView for all content areas
- Modal sheets for data entry
- Dark theme optimized for OLED screens
- Clear visual hierarchy
- Minimal text input requirements

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Secure authentication with Supabase
- No sensitive data exposed in client

## Next Steps

1. Configure real AdMob ads
2. Implement actual payment processing (recommend RevenueCat)
3. Add data export for premium users
4. Implement advanced analytics
5. Add social features (optional)
6. Set up push notifications

## Support

For issues or questions:
1. Check the database via Supabase Dashboard
2. Review RLS policies if data access issues occur
3. Check authentication state in AuthContext
4. Verify test user status for premium features

## License

Proprietary - All rights reserved
