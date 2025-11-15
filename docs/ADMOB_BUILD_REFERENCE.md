# AdMob Build Quick Reference

Quick commands and links for building your app with real AdMob ads.

## Current Status

✅ **Expo Go**: Works with ad placeholders (no crashes)  
✅ **Code Ready**: AdMob integration complete  
⏳ **Next Step**: Build with native code to see real ads  

---

## Quick Start Commands

### iOS (Xcode)

```bash
# 1. Generate iOS project
npx expo prebuild --platform ios

# 2. Install dependencies
cd ios && pod install && cd ..

# 3. Open in Xcode
open ios/ArmProgress.xcworkspace

# 4. Press Cmd + R to build and run
```

### Android (Android Studio)

```bash
# 1. Generate Android project
npx expo prebuild --platform android

# 2. Open in Android Studio
studio android
# or: open -a "Android Studio" android

# 3. Wait for Gradle sync, then press Shift + F10
```

---

## Documentation Index

### 🚀 Start Here
**[Expo Go vs Production Guide](./ADMOB_EXPO_GO_VS_PRODUCTION.md)**  
Understand the difference between development and production builds.

### 📱 Platform Guides (Detailed)
- **[iOS - Building with Xcode](./ADMOB_LOCAL_BUILD_IOS.md)**  
  Complete iOS build guide with troubleshooting
  
- **[Android - Building with Android Studio](./ADMOB_LOCAL_BUILD_ANDROID.md)**  
  Complete Android build guide with troubleshooting

### 📚 AdMob Documentation
- **[Platform-Specific Setup](./ADMOB_PLATFORM_SPECIFIC_SETUP.md)** ⭐  
  iOS vs Android ad IDs (already configured!)

- **[AdMob Review Process](./ADMOB_REVIEW_PROCESS.md)**  
  Understanding app review (2-7 days, test ads work now!)
  
- **[Full Integration Guide](./ADMOB_INTEGRATION.md)**  
  Complete AdMob documentation
  
- **[Quick Start](./ADMOB_QUICK_START.md)**  
  Fast setup instructions
  
- **[Fix Summary](./ADMOB_FIX_SUMMARY.md)**  
  What was fixed and current status

---

## Development Workflow

### Phase 1: Development (Current)
```bash
npm run dev
```
✅ Use Expo Go  
✅ See ad placeholders  
✅ Develop features fast  

### Phase 2: Testing Ads
Build locally with Xcode or Android Studio (see guides above).

✅ See real test ads  
✅ Test ad placement  
✅ Debug with native tools  

### Phase 3: Production
Add production ad unit IDs and build release versions.

✅ Real production ads  
✅ Submit to App Store / Play Store  

---

## Common Commands

### iOS

```bash
# Generate project
npx expo prebuild --platform ios

# Install pods
cd ios && pod install && cd ..

# Open Xcode
open ios/ArmProgress.xcworkspace

# Run from command line
npx expo run:ios

# Clean build
cd ios
pod deintegrate
pod install
cd ..
```

### Android

```bash
# Generate project
npx expo prebuild --platform android

# Open Android Studio
studio android

# Run from command line
npx expo run:android

# Clean build
cd android
./gradlew clean
cd ..

# Build APK
cd android
./gradlew assembleDebug
```

### Both Platforms

```bash
# Generate both
npx expo prebuild

# Clean and regenerate
npx expo prebuild --clean

# Update after package changes
npx expo prebuild --clean
```

---

## Troubleshooting Quick Links

### iOS Issues
See: [iOS Build Guide - Common Issues](./ADMOB_LOCAL_BUILD_IOS.md#common-issues--solutions)

### Android Issues
See: [Android Build Guide - Common Issues](./ADMOB_LOCAL_BUILD_ANDROID.md#common-issues--solutions)

---

## AdMob Configuration

### Test Mode (Current)
Automatic! Test ads show in development builds without any setup.

### Production Mode

1. **Create AdMob Account**: [apps.admob.com](https://apps.admob.com/)

2. **Create Ad Units** (iOS and Android):
   - Banner
   - Interstitial
   - Rewarded

3. **Add to `.env`**:
   ```env
   # iOS
   EXPO_PUBLIC_ADMOB_IOS_BANNER=ca-app-pub-XXX/YYY
   EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL=ca-app-pub-XXX/YYY
   EXPO_PUBLIC_ADMOB_IOS_REWARDED=ca-app-pub-XXX/YYY
   
   # Android
   EXPO_PUBLIC_ADMOB_ANDROID_BANNER=ca-app-pub-XXX/YYY
   EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL=ca-app-pub-XXX/YYY
   EXPO_PUBLIC_ADMOB_ANDROID_REWARDED=ca-app-pub-XXX/YYY
   ```

4. **Add App IDs**:
   - iOS: `ios/ArmProgress/Info.plist`
   - Android: `android/app/src/main/AndroidManifest.xml`

See full guide: [AdMob Integration](./ADMOB_INTEGRATION.md)

---

## File Locations

### iOS
```
ios/
├── ArmProgress.xcworkspace     ← Open this in Xcode
├── ArmProgress/
│   └── Info.plist              ← Add AdMob App ID here
└── Podfile
```

### Android
```
android/
├── app/
│   ├── src/main/
│   │   └── AndroidManifest.xml ← Add AdMob App ID here
│   └── build.gradle
└── build.gradle
```

---

## Quick Checklist

### Before Building
- [ ] Run `npx expo prebuild`
- [ ] iOS: Run `pod install`
- [ ] Android: Let Gradle sync complete

### After Building
- [ ] App launches without errors
- [ ] Banner ads show (test ads)
- [ ] Check console for ad loading messages
- [ ] Verify premium users don't see ads

### For Production
- [ ] Create AdMob account
- [ ] Create ad units
- [ ] Add ad unit IDs to `.env`
- [ ] Add AdMob App IDs to native files
- [ ] Build release version
- [ ] Test (don't click ads repeatedly!)
- [ ] Submit to stores

---

## Need Help?

1. **Check platform-specific guide:**
   - [iOS Guide](./ADMOB_LOCAL_BUILD_IOS.md)
   - [Android Guide](./ADMOB_LOCAL_BUILD_ANDROID.md)

2. **Read full documentation:**
   - [Expo Go vs Production](./ADMOB_EXPO_GO_VS_PRODUCTION.md)
   - [AdMob Integration](./ADMOB_INTEGRATION.md)

3. **External resources:**
   - [Expo Prebuild Docs](https://docs.expo.dev/workflow/prebuild/)
   - [AdMob Help Center](https://support.google.com/admob)

---

## Summary

| What | Command | Guide |
|------|---------|-------|
| **iOS** | `npx expo prebuild --platform ios && cd ios && pod install && cd .. && open ios/ArmProgress.xcworkspace` | [iOS Guide](./ADMOB_LOCAL_BUILD_IOS.md) |
| **Android** | `npx expo prebuild --platform android && studio android` | [Android Guide](./ADMOB_LOCAL_BUILD_ANDROID.md) |
| **Both** | `npx expo prebuild && cd ios && pod install && cd ..` | [Main Guide](./ADMOB_EXPO_GO_VS_PRODUCTION.md) |

Your app is ready! Just build with native code to see real ads. 🚀

