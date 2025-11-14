# Testing & Distribution Guide

This guide covers all testing methods for your React Native/Expo app, from local development to production release.

---

## Table of Contents

1. [Comparison Table](#comparison-table)
2. [Option 1: Xcode Development (Recommended for Active Development)](#option-1-xcode-development-fastest)
3. [Option 2: EAS Development Build](#option-2-eas-development-build)
4. [Option 3: TestFlight (iOS Beta Testing)](#option-3-testflight-best-for-ios-beta-testing)
5. [Option 4: Google Play Internal Testing (Android)](#option-4-google-play-internal-testing-android)
6. [Recommended Workflow](#recommended-workflow)
7. [FAQ](#faq)

---

## Comparison Table

| Feature | Xcode Dev | EAS Dev Build | TestFlight | Play Internal |
|---------|-----------|---------------|------------|---------------|
| **Apple Sign In Testing** | ✅ Yes | ✅ Yes | ✅ Yes | N/A |
| **Google Sign In Testing** | ✅ Yes | ✅ Yes | N/A | ✅ Yes |
| **Installation Method** | USB/Xcode | Download link | TestFlight app | Play Store |
| **Requires Rebuild** | No* | Yes | Yes | Yes |
| **Certificate Mgmt** | Manual | Automatic | Automatic | Automatic |
| **Device Registration** | Manual | Via website | Automatic | None |
| **Max Devices** | 100 | 100 | 10,000 | 100 (internal) |
| **Build Expiration** | 1 year | 30 days | 90 days | No expiration |
| **Build Time** | 5-15 min | 10-20 min | 10-20 min + review | 10-20 min |
| **Cost** | Free | 30 builds/month (free) | Free | Free |
| **Hot Reload** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Best For** | Active dev | Testing specific builds | Beta testing | Android beta |

*Xcode uses incremental builds - only rebuilds what changed.

---

## Option 1: Xcode Development (Fastest)

**Best for:** Active development, daily testing, quick iterations

### Prerequisites
- Mac with Xcode installed
- iPhone/iPad connected via USB
- Apple Developer account (free or paid)

### Steps

1. **Connect your iPhone via USB**
   - Make sure device is unlocked and connected

2. **Open project in Xcode**
   ```bash
   open ios/ArmWrestlingPro.xcworkspace
   ```

3. **Select your device**
   - In Xcode toolbar, click on "Any iOS Device" (or simulator name)
   - Select your connected iPhone from the dropdown

4. **Trust Developer Certificate (First time only)**
   - Xcode → Settings → Accounts → Add your Apple ID
   - Select your account → Manage Certificates → + → Apple Development
   - On your iPhone: Settings → General → VPN & Device Management → Trust certificate

5. **Run the app**
   - Press `Cmd + R` or click the Play ▶️ button
   - Xcode will build, sign, and install automatically
   - App launches on your device

### Making Changes

**No rebuild needed!** Just hit `Cmd + R` again after making code changes.
- Xcode only rebuilds what changed (incremental build)
- For JavaScript-only changes, you may even get hot reload
- Full rebuild only happens when native dependencies change

### Pros & Cons

**Pros:**
- ✅ Fastest iteration (just hit Run)
- ✅ No manual installation
- ✅ Live debugging with breakpoints
- ✅ Hot reload for JS changes
- ✅ Free, unlimited builds
- ✅ Test all native features (Apple Sign In, push notifications, etc.)

**Cons:**
- ❌ Requires Mac with Xcode
- ❌ Device must be connected via USB
- ❌ Must manage certificates manually

---

## Option 2: EAS Development Build

**Best for:** Testing specific builds, sharing with remote testers, no Mac available

### Prerequisites
- Expo account (free)
- Device UDID registered with EAS
- EAS CLI installed: `npm install -g eas-cli`

### Steps

1. **Login to EAS**
   ```bash
   eas login
   ```

2. **Build development profile**
   ```bash
   eas build --profile development --platform ios
   ```

3. **Register your device (First time only)**
   - EAS will generate a device registration URL
   - Open the URL on your iPhone
   - Tap "Register Device"
   - EAS automatically captures your device UDID
   - Restart the build

4. **After build completes:**
   - EAS provides a download link
   - Open link on your iPhone (in Safari)
   - Tap "Install" (no App Store, no TestFlight needed)
   - App installs directly to your home screen

5. **Test the app**
   - Open app from home screen
   - Test Apple Sign In, all native features

### Rebuild & Reinstall Process

Every time you make changes:
```bash
# 1. Rebuild
eas build --profile development --platform ios

# 2. Wait 10-20 minutes for build to complete

# 3. Open download link on iPhone

# 4. Tap "Install" to reinstall
```

### Pros & Cons

**Pros:**
- ✅ No Xcode needed (can build from any machine)
- ✅ Easy device registration
- ✅ Share with up to 100 devices
- ✅ No USB connection needed
- ✅ Automatic certificate management

**Cons:**
- ❌ Slower than Xcode (10-20 min per build)
- ❌ Limited to 30 builds/month (free tier)
- ❌ Must rebuild for every change
- ❌ Build expires after 30 days

---

## Option 3: TestFlight (Best for iOS Beta Testing)

**Best for:** Beta testing with large groups, pre-release testing, production-like environment

### Prerequisites
- Paid Apple Developer account ($99/year)
- App Store Connect access
- App created in App Store Connect

### Steps

1. **Build production profile**
   ```bash
   eas build --profile production --platform ios
   # OR archive in Xcode: Product → Archive
   ```

2. **Submit to App Store Connect**
   ```bash
   eas submit --platform ios
   # OR upload via Xcode: Window → Organizer → Distribute App
   ```

3. **Wait for review** (First build: 1-2 days, subsequent: few hours)

4. **Invite testers in App Store Connect**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - My Apps → Your App → TestFlight
   - Create test group (Internal or External)
   - Add tester emails
   - Testers receive invitation email

5. **Testers install via TestFlight**
   - Download TestFlight app from App Store
   - Open invitation link
   - Install your beta app
   - Test all features

### Types of Testing

**Internal Testing** (up to 100 testers)
- No review required
- For team members with App Store Connect access
- Instant distribution

**External Testing** (up to 10,000 testers)
- Requires Apple review (first build: 1-2 days)
- For anyone with an email address
- Subsequent builds: hours

### Pros & Cons

**Pros:**
- ✅ Up to 10,000 external testers
- ✅ No device registration needed
- ✅ Automatic updates for testers
- ✅ Crash reporting & feedback
- ✅ Production-like environment
- ✅ App expires after 90 days (prevents old betas)

**Cons:**
- ❌ Requires review (1-2 days first build)
- ❌ More formal process
- ❌ Build takes 15-30 min
- ❌ Requires paid Apple Developer account

---

## Option 4: Google Play Internal Testing (Android)

**Best for:** Android beta testing, pre-release testing

### Prerequisites
- Google Play Console account ($25 one-time fee)
- App created in Play Console

### Steps

1. **Build production profile**
   ```bash
   eas build --profile production --platform android
   # OR build in Android Studio: Build → Generate Signed Bundle/APK
   ```

2. **Upload to Play Console**
   ```bash
   eas submit --platform android
   # OR manually upload AAB file in Play Console
   ```

3. **Create internal test track**
   - Go to [Play Console](https://play.google.com/console)
   - Your App → Testing → Internal testing
   - Create new release
   - Upload AAB file (if not using EAS Submit)
   - Add release notes

4. **Add testers**
   - Create tester list (email addresses)
   - Share testing link with testers
   - Testers click link → Accept invitation → Download from Play Store

### Testing Tracks

**Internal Testing** (up to 100 testers)
- No review required
- Instant distribution
- For team and trusted testers

**Closed Testing** (unlimited testers)
- Requires review
- For larger beta groups

**Open Testing** (public)
- Anyone can join
- Appears in Play Store as "Early Access"

### Pros & Cons

**Pros:**
- ✅ No device limit (internal: 100, closed/open: unlimited)
- ✅ No review for internal testing
- ✅ Automatic updates
- ✅ Crash reports via Play Console
- ✅ A/B testing support

**Cons:**
- ❌ Requires Google Play Console account ($25)
- ❌ Build takes 10-20 min
- ❌ More setup than direct APK install

---

## Recommended Workflow

### Phase 1: Active Development

**Use Xcode (Option 1) for iOS**
```bash
# 1. Connect iPhone via USB
# 2. Open Xcode
open ios/ArmWrestlingPro.xcworkspace

# 3. Select your device and press Cmd+R
```

**Use Android Studio for Android**
```bash
# 1. Connect Android device via USB or use emulator
# 2. Run
npx expo run:android
```

**Why:**
- Test changes instantly
- No rebuild/reinstall cycle
- Hot reload for JS changes
- Free, unlimited builds

---

### Phase 2: Testing Specific Builds

**Use EAS Development Build (Option 2)**
```bash
# Build once, install on device
eas build --profile development --platform ios
eas build --profile development --platform android
```

**Why:**
- Test exact build that will go to production
- Share with friends/testers (up to 100 devices)
- Works without Mac (for iOS)
- Test on devices you don't have physical access to

---

### Phase 3: Beta Testing

**iOS: Use TestFlight (Option 3)**
```bash
# Build and submit
eas build --profile production --platform ios
eas submit --platform ios
```

**Android: Use Play Internal Testing (Option 4)**
```bash
# Build and submit
eas build --profile production --platform android
eas submit --platform android
```

**Why:**
- Large-scale testing (iOS: 10,000 users, Android: unlimited)
- Closest to production environment
- Testers don't need device registration
- Automatic updates
- Crash reports and analytics

---

### Phase 4: Production

**Submit to App Store & Play Store**
```bash
# iOS
eas build --profile production --platform ios
eas submit --platform ios

# Android
eas build --profile production --platform android
eas submit --platform android
```

---

## FAQ

### Q: Do I need to rebuild every time I make a change?

**Xcode (Option 1):** No! Just hit `Cmd + R` again. Xcode incrementally builds only what changed.

**EAS/TestFlight/Play Testing (Options 2-4):** Yes, you need to rebuild the entire app and reinstall.

**Bottom line:** Use Xcode for development, EAS/TestFlight/Play for distribution.

---

### Q: Can I test Apple Sign In with development builds?

**Yes!** All three iOS options (Xcode, EAS Dev, TestFlight) support testing Apple Sign In. The app is properly signed and can use all native features.

However, you must complete the Apple Sign In setup first:
1. Configure App ID in Apple Developer Portal
2. Configure Services ID in Apple Developer Portal
3. Generate JWT token and configure Supabase
4. See [Apple Sign In Setup Guide](./Apple_Sign_In_Setup.md)

---

### Q: Which method is fastest for daily development?

**Xcode with USB connection** (Option 1) is the fastest:
- First build: 5-10 minutes
- Subsequent builds: 30 seconds - 2 minutes (incremental)
- No manual reinstall needed
- Hot reload for JS changes

---

### Q: Can I use EAS for free?

**Yes, with limitations:**
- 30 builds per month (combined iOS + Android)
- Standard build queue (not priority)
- Enough for initial launch and first few months

**Paid plans:**
- Production: $99/month - Unlimited builds, priority queue
- Enterprise: Custom pricing - Team features, analytics

---

### Q: How long do builds expire?

- **Development builds (Xcode):** 1 year
- **Development builds (EAS):** 30 days
- **TestFlight builds:** 90 days
- **Play Console builds:** No expiration

---

### Q: Can I test on simulators/emulators?

**Yes, but with limitations:**
- iOS Simulator: Works, but **cannot test Apple Sign In** (requires real device)
- Android Emulator: Works, can test Google Sign In

For full feature testing (push notifications, Apple Sign In, camera, etc.), use real devices.

---

### Q: How do I add more testers?

**EAS Development Build:**
- Register up to 100 device UDIDs
- Each device gets the download link
- Device registration URL: Build page on EAS dashboard

**TestFlight:**
- Internal: Add up to 100 App Store Connect users
- External: Add up to 10,000 email addresses

**Play Console:**
- Internal: Add up to 100 email addresses
- Closed: Unlimited testers
- Open: Anyone can join (public beta)

---

### Q: What if I don't have a Mac?

**For iOS development:**
- Use EAS Build (Option 2) - builds in the cloud
- Can't use Xcode (Option 1)
- TestFlight (Option 3) works with EAS

**For Android development:**
- Use EAS Build or any machine with Android Studio
- Linux/Windows/Mac all supported

---

## Quick Reference Commands

```bash
# Development
npx expo start                           # Start dev server
open ios/ArmWrestlingPro.xcworkspace    # Open Xcode
npx expo run:android                     # Run Android

# EAS Build
eas login                                # Login to EAS
eas build --profile development --platform ios      # iOS dev build
eas build --profile development --platform android  # Android dev build
eas build --profile production --platform all       # Production builds

# Submission
eas submit --platform ios                # Submit to App Store
eas submit --platform android            # Submit to Play Store

# Device Registration
eas device:create                        # Register device UDID
```

---

## Additional Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Apple Developer Portal](https://developer.apple.com)
- [Xcode Documentation](https://developer.apple.com/xcode/)

---

---

## Appendix: EAS vs Local Builds

### Why We Chose Local Builds (Xcode/Android Studio)

This project uses **local builds** instead of EAS (Expo Application Services) for the following reasons:

**Advantages of Local Builds:**
- ✅ Faster iteration during development (incremental builds)
- ✅ No build limits (free, unlimited)
- ✅ No monthly costs ($0 vs $99/month for EAS Production)
- ✅ Full control over build process
- ✅ Can debug native code locally
- ✅ No dependency on cloud services

**When EAS Makes Sense:**
- Building from non-Mac machines (for iOS)
- Need to share builds with 100+ testers
- Want automated certificate management
- Building from CI/CD pipelines
- Don't want to manage Xcode/Android Studio

### EAS Configuration Removed

The following EAS configuration has been removed from this project:
- `eas.json` - EAS build profiles (deleted)
- `extra.eas.projectId` in `app.config.js` (removed)
- `eas-cli` package (uninstalled)

If you want to re-enable EAS in the future:

1. **Reinstall EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to EAS**
   ```bash
   eas login
   ```

3. **Configure EAS**
   ```bash
   eas build:configure
   ```

4. **Build with EAS**
   ```bash
   eas build --profile development --platform ios
   ```

---

**Last Updated:** 2025-01-14
