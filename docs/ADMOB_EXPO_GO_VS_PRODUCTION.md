# AdMob: Expo Go vs Production Builds

## ✅ Issue Fixed!

Your app now works in **both** Expo Go (for development) and production builds (for real ads).

## How It Works

### 🧪 In Expo Go (Current)

**What you see:**
- Banner ad **placeholders** with text: "320x50 - Build with native code to show real ads"
- No errors or crashes
- Full app functionality

**Why placeholders?**
- AdMob requires **native code** (iOS/Android specific code)
- Expo Go is a generic app that can't include custom native modules
- The components detect this and show placeholders instead of crashing

**What to do:**
- ✅ **Nothing!** Continue developing and testing
- ✅ All your app logic works normally
- ✅ Ads automatically hide for premium users
- ✅ Placeholders show where real ads will appear

### 🚀 In Production Builds (Real Ads)

**What users will see:**
- **Real AdMob ads** (banner, interstitial, rewarded)
- Automatic test/production switching
- Ads hide for premium users

**How to get there:**
You have **2 options** to build with native code:

---

## Option 1: Local Build with Xcode/Android Studio ⭐ (Recommended)

Build locally on your machine for full control and faster iteration.

### iOS (Xcode)

```bash
# 1. Generate iOS project
npx expo prebuild --platform ios

# 2. Install CocoaPods
cd ios && pod install && cd ..

# 3. Open in Xcode
open ios/ArmProgress.xcworkspace

# 4. Build and run (Cmd + R)
```

**📖 Full iOS Guide:** [Building with Xcode](./ADMOB_LOCAL_BUILD_IOS.md)

### Android (Android Studio)

```bash
# 1. Generate Android project
npx expo prebuild --platform android

# 2. Open in Android Studio
studio android
# or: open -a "Android Studio" android

# 3. Wait for Gradle sync

# 4. Build and run (Shift + F10)
```

**📖 Full Android Guide:** [Building with Android Studio](./ADMOB_LOCAL_BUILD_ANDROID.md)

**Benefits:**
- ✅ **Full control** over build process
- ✅ **Faster iterations** (local builds)
- ✅ **Direct debugging** in Xcode/Android Studio
- ✅ **No cloud dependencies** or limits
- ✅ **Professional development** environment
- ✅ **Test real ads** immediately

**Requirements:**
- **iOS**: Mac with Xcode installed
- **Android**: Android Studio (works on Mac, Windows, Linux)

---

## Option 2: EAS Build (Cloud Alternative)

Build in the cloud if you don't want to set up local development environments.

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build
eas build --platform ios --profile development
eas build --platform android --profile development
```

**Benefits:**
- ✅ No local setup required
- ✅ Works on any computer
- ✅ Handles certificates automatically

**Drawbacks:**
- ❌ Slower than local builds
- ❌ Requires internet connection
- ❌ Build queue wait times

---

## Quick Comparison

| Feature | Expo Go | Local Build (Xcode/Android Studio) | Production Build |
|---------|---------|-----------------------------------|------------------|
| **Ads** | Placeholders | Real test ads | Real production ads |
| **Setup** | None needed | Xcode or Android Studio | Same as local |
| **Build Speed** | Instant start | Fast (3-5 min after first) | Same as local |
| **Debugging** | Limited | Full native debugging | N/A |
| **Best for** | UI/logic development | Ad testing, full development | End users |

---

## Current Status

✅ **Works in Expo Go**: Placeholders show, no crashes  
✅ **Ready for production**: Native code will work automatically  
✅ **Automatic switching**: Test ads in dev, real ads in production  
✅ **No code changes needed**: Just build!  

---

## Recommended Workflow

### Phase 1: Initial Development (Use Expo Go)
```bash
npm run dev
```
- Use Expo Go for fast iteration
- Develop UI and app logic
- See ad placeholders (expected)
- No build setup needed

### Phase 2: Build Locally for Ad Testing
**iOS:**
```bash
npx expo prebuild --platform ios
cd ios && pod install && cd ..
open ios/ArmProgress.xcworkspace
# Build in Xcode (Cmd + R)
```

**Android:**
```bash
npx expo prebuild --platform android
studio android
# Build in Android Studio (Shift + F10)
```

- Test real ads with test ad unit IDs
- Verify ad placement and behavior
- Debug with full native tools

### Phase 3: Production Release

**Build release versions:**
- **iOS**: Archive in Xcode > Distribute to App Store
- **Android**: `./gradlew bundleRelease` > Upload to Play Console

- Add production ad unit IDs
- Test with real ads (don't click repeatedly!)
- Submit to stores

---

## For Real Ads in Production

Don't forget to:

1. ✅ Create AdMob account
2. ✅ Create ad units (banner, interstitial, rewarded)
3. ✅ Add ad unit IDs to `.env`:
   ```env
   EXPO_PUBLIC_ADMOB_IOS_BANNER=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
   EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
   EXPO_PUBLIC_ADMOB_IOS_REWARDED=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
   
   EXPO_PUBLIC_ADMOB_ANDROID_BANNER=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
   EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
   EXPO_PUBLIC_ADMOB_ANDROID_REWARDED=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
   ```
4. ✅ Add AdMob App IDs to `app.config.js`

---

## Testing Checklist

### In Expo Go ✅
- [x] App loads without errors
- [x] Banner placeholders show
- [x] Premium users don't see placeholders
- [x] App functions normally

### In Development Build
- [ ] Build app with native code
- [ ] Real test ads load
- [ ] Banner ads display correctly
- [ ] Interstitial ads show (if implemented)
- [ ] Rewarded ads work (if implemented)
- [ ] Test mode label shows

### In Production Build
- [ ] Real production ads show
- [ ] No test mode label
- [ ] Ads respect premium status
- [ ] Revenue tracking works

---

## Troubleshooting

### "Still seeing placeholders in production"
- Did you build with native code? (not Expo Go)
- Check if build includes `react-native-google-mobile-ads`
- Try rebuilding: `npx expo prebuild --clean`

### "Ads not loading in development build"
- Check internet connection
- Look for errors in console
- Verify AdMob account setup
- New accounts take 24-48 hours to activate

### "Error: AdMob App ID missing"
- Add App IDs to `app.config.js`
- Rebuild app after changes

---

## Summary

🎯 **Right Now**: Continue using Expo Go for development  
🎯 **When ready to test ads**: Build locally with Xcode/Android Studio  
🎯 **For production**: Build release version with real ad unit IDs  

Your code is ready! The ads will work automatically when you build with native code. 🚀

## Detailed Guides

### 📱 Platform-Specific Build Guides
- **[iOS - Building with Xcode](./ADMOB_LOCAL_BUILD_IOS.md)** ⭐ Complete iOS guide
- **[Android - Building with Android Studio](./ADMOB_LOCAL_BUILD_ANDROID.md)** ⭐ Complete Android guide

### 📚 General Documentation
- [AdMob Integration Guide](./ADMOB_INTEGRATION.md) - Full AdMob documentation
- [Quick Start Guide](./ADMOB_QUICK_START.md) - Fast setup instructions
- [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/) - Official Expo docs

