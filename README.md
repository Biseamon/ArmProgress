# Arm Wrestling Pro 💪

A comprehensive training tracker for arm wrestlers built with React Native, Expo, and Supabase.

## Features

- ✅ **Workout Tracking** - Log training sessions with exercises, sets, reps, and weights
- ✅ **Training Cycles** - Organize workouts into periodized training programs
- ✅ **Progress Analytics** - Track strength gains over time with charts
- ✅ **Goal Setting** - Set and track training goals
- ✅ **Body Measurements** - Track arm circumference, weight, and more
- ✅ **Scheduled Training** - Plan workouts with notifications
- ✅ **Dark Mode** - Eye-friendly dark theme
- ✅ **Premium Features** - Advanced analytics and unlimited tracking
- ✅ **Social Authentication** - Sign in with Google, Facebook, or Apple
- ✅ **Profile Pictures** - Upload custom avatars

## Tech Stack

- **Framework:** React Native (Expo)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth + OAuth
- **Storage:** Supabase Storage
- **State Management:** React Context
- **Navigation:** Expo Router
- **Charts:** react-native-chart-kit
- **UI Components:** React Native + Lucide icons
- **Subscriptions:** RevenueCat (planned)
- **Payments:** Stripe (donations)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio (for Android)
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd armtestapp-rn
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

   Required variables:
   - `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on your device**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Documentation

- 📖 **[Secrets Setup Guide](docs/SECRETS_SETUP.md)** - How to manage API keys and secrets
- 📖 **[CI/CD Setup Guide](docs/CI_CD_SETUP.md)** - GitHub Actions and deployment
- 📖 **[RevenueCat Integration](#premium-features-revenuecat)** - Premium subscriptions setup

## Project Structure

```
armtestapp-rn/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── components/            # Reusable React components
├── contexts/              # React Context providers
│   ├── AuthContext.tsx   # Authentication state
│   └── ThemeContext.tsx  # Theme/dark mode
├── lib/                   # Utilities and configuration
│   ├── supabase.ts       # Supabase client
│   └── config.ts         # Environment config
├── docs/                  # Documentation
├── .github/workflows/     # GitHub Actions CI/CD
└── assets/               # Images, fonts, etc.
```

## Environment Setup

### Required Environment Variables

See `.env.example` for all variables. Critical ones:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# RevenueCat (optional, for subscriptions)
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxx

# Stripe (optional, for donations)
EXPO_PUBLIC_STRIPE_DONATION_URL=https://buy.stripe.com/...
```

**⚠️ See [docs/SECRETS_SETUP.md](docs/SECRETS_SETUP.md) for detailed setup instructions.**

## Database Schema

### Main Tables

- `profiles` - User profiles and settings
- `workouts` - Training session records
- `exercises` - Individual exercises within workouts
- `cycles` - Training cycles/programs
- `goals` - User-defined goals
- `strength_tests` - Periodic strength assessments
- `body_measurements` - Physical measurements over time
- `scheduled_trainings` - Planned workout sessions

### Row Level Security (RLS)

All tables have RLS enabled. Users can only access their own data.

## Authentication

### Supported Methods

- ✅ Email/Password
- ✅ Google OAuth
- ✅ Facebook OAuth
- ✅ Apple OAuth (iOS only)

### OAuth Setup

1. Configure OAuth providers in Supabase Dashboard → Authentication → Providers
2. Add redirect URLs in each provider's console
3. Test in development before production

## Premium Features (RevenueCat)

### Can I Set Up Before App Store Release?

**Yes!** You can set up RevenueCat during development:

1. Create RevenueCat account (free)
2. Use sandbox testing:
   - iOS: Create sandbox testers in App Store Connect
   - Android: Add test users in Google Play Console
3. Create products in store consoles (doesn't require published app)
4. Use development/sandbox API keys for testing

### Setup Steps

See the detailed RevenueCat implementation guide in the conversation above, which includes:
- Complete code examples
- Configuration files
- Testing setup
- Production deployment

## CI/CD

### GitHub Actions Workflows

We've set up 3 automated workflows:

1. **CI** (`ci.yml`) - Runs on every PR
   - TypeScript checking
   - Linting
   - Tests

2. **EAS Build** (`eas-build.yml`) - Builds apps
   - Development builds on push to `main`
   - Production builds on version tags (`v1.0.0`)

3. **EAS Update** (`eas-update.yml`) - OTA updates
   - Publishes updates on push to `develop`

**📖 See [docs/CI_CD_SETUP.md](docs/CI_CD_SETUP.md) for complete setup guide.**

### Quick Start

```bash
# Set up GitHub secrets first (see docs/CI_CD_SETUP.md)

# Push to develop for OTA update
git push origin develop

# Create production release
git tag v1.0.0
git push origin main --tags
```

## Security

### ✅ Best Practices Implemented

- All secrets in `.env` (gitignored)
- RLS enabled on all Supabase tables
- OAuth tokens handled securely
- Separate keys for dev/production
- Cache-busting for avatar uploads

### ⚠️ Important Notes

**Supabase Anon Key:**
- Safe to use in client apps
- Protected by Row Level Security
- Cannot access data without RLS policies

**RevenueCat Keys:**
- Designed for client-side use
- Safe to expose in mobile apps

**What's in .gitignore:**
- `.env` - All secrets
- `*.key`, `*.p8`, `*.p12` - Certificates
- `*.mobileprovision` - Provisioning profiles

**📖 See [docs/SECRETS_SETUP.md](docs/SECRETS_SETUP.md) for full security guide.**

## Development Commands

```bash
# Start development server
npm start

# Type checking
npx tsc --noEmit

# Run tests
npm test

# Lint code
npm run lint

# Clear cache
npx expo start --clear

# Build for development
eas build --profile development --platform ios

# Build for production
eas build --profile production --platform all
```

## Troubleshooting

### Common Issues

**OAuth Redirect Issues:**
- Ensure redirect URLs are configured in OAuth provider
- Check `skipBrowserRedirect: true` in OAuth call
- Verify session is being set with extracted tokens

**Avatar Upload Issues:**
- Old images not deleting: Check file listing permissions
- Cache issues: Use cache-busting timestamps
- Upload fails: Verify storage bucket permissions

**Environment Variable Issues:**
```bash
# Verify config loads correctly
npm start
# Check console for "✅ Configuration validated successfully"
```

**Metro bundler issues:**
```bash
npx expo start --clear
rm -rf node_modules && npm install
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Resources

- 📖 [Expo Documentation](https://docs.expo.dev/)
- 📖 [Supabase Documentation](https://supabase.com/docs)
- 📖 [RevenueCat Documentation](https://www.revenuecat.com/docs)
- 📖 [React Native Documentation](https://reactnative.dev/)

## License

[Your License Here]

## Acknowledgments

- [Expo](https://expo.dev) - React Native framework
- [Supabase](https://supabase.com) - Backend as a service
- [RevenueCat](https://www.revenuecat.com) - Subscription management
- [Lucide](https://lucide.dev) - Icon library

---

Built with ❤️ for arm wrestlers 💪
