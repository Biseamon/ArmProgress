# Building with Xcode for Real AdMob Ads (iOS)

This guide shows you how to build your app locally with Xcode so AdMob ads work with real native code.

## Prerequisites

✅ Mac computer (required for iOS development)  
✅ Xcode installed (from Mac App Store)  
✅ CocoaPods installed  
✅ iOS Simulator or physical iPhone  

### Install CocoaPods (if not installed)

```bash
sudo gem install cocoapods
```

---

## Step 1: Generate Native iOS Project

Run this from your project root:

```bash
cd /Users/marincapranov/Desktop/TestApps/ArmProgress
npx expo prebuild --platform ios
```

This creates the `ios/` folder with native Xcode project files.

**What it does:**
- Creates `ios/ArmProgress.xcworkspace`
- Adds all native dependencies (including Google Mobile Ads)
- Configures build settings
- Links React Native

---

## Step 2: Install iOS Dependencies

```bash
cd ios
pod install
cd ..
```

**What it does:**
- Installs CocoaPods dependencies
- Links Google Mobile Ads SDK
- Sets up native modules

You should see output like:
```
Installing Google-Mobile-Ads-SDK (11.x.x)
Installing RNGoogleMobileAds (16.x.x)
```

---

## Step 3: Configure AdMob App ID (Optional for Testing)

For production, you'll need to add your AdMob App ID.

### Edit `ios/ArmProgress/Info.plist`

Add this inside the `<dict>` tag:

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXXXXXXX~YYYYYYYYYY</string>
```

Replace `ca-app-pub-XXXXXXXXXXXXX~YYYYYYYYYY` with your AdMob App ID from [AdMob Console](https://apps.admob.com/).

**For testing without App ID:**
The app will work with test ads even without this. Add it when you have a real AdMob account.

---

## Step 4: Open in Xcode

### Option A: Command Line
```bash
open ios/ArmProgress.xcworkspace
```

### Option B: Finder
1. Navigate to `ios/` folder
2. Double-click `ArmProgress.xcworkspace` (NOT `.xcodeproj`)

**⚠️ Important:** Always open the `.xcworkspace` file, not `.xcodeproj`

---

## Step 5: Configure Xcode Project

### A. Select Target Device

In Xcode toolbar (top):
1. Click on device dropdown (next to "ArmProgress")
2. Select:
   - **iOS Simulator** (e.g., "iPhone 15 Pro")
   - **Your iPhone** (if connected via USB)

### B. Set Development Team (Required for Device)

If building for a physical device:

1. Select project in left sidebar: **ArmProgress**
2. Select target: **ArmProgress** (under TARGETS)
3. Go to **Signing & Capabilities** tab
4. Under **Team**, select your Apple Developer account
5. If you don't see your team, click "Add Account..." and sign in

### C. Bundle Identifier (Optional)

Default: `com.armprogress.app`

To change:
1. Same screen as above (Signing & Capabilities)
2. Change **Bundle Identifier**
3. Must match your AdMob settings later

---

## Step 6: Build and Run

### Option A: Using Xcode GUI

1. Click the **Play button** (▶️) in top-left corner
2. Or press `Cmd + R`

### Option B: Using Command Line

```bash
# Run on simulator
npx expo run:ios

# Run on specific simulator
npx expo run:ios --device "iPhone 15 Pro"

# Run on physical device
npx expo run:ios --device
```

**First build takes 5-10 minutes.** Subsequent builds are much faster.

---

## Step 7: Verify Ads Work

Once the app launches:

### You should see:

✅ **Test ads loading** (with "TEST AD - Development Mode" label)  
✅ **Real AdMob banner** (not placeholder)  
✅ Console logs: "AdMob Banner loaded successfully"  

### Debug Console

View logs in Xcode:
1. Click **Debug area** button (bottom-right, looks like: ⬜️)
2. Look for AdMob-related messages

---

## Development Workflow

### First Build (Run Once)
```bash
npx expo prebuild --platform ios
cd ios && pod install && cd ..
open ios/ArmProgress.xcworkspace
# Build in Xcode (Cmd + R)
```

### Regular Development (Fast Refresh)

After first build, you can use:

```bash
npm run dev
# Select option: "i" (iOS simulator)
```

Or keep Xcode open and press `Cmd + R` to rebuild.

---

## Common Issues & Solutions

### Issue: "No such module 'RNGoogleMobileAds'"

**Solution:**
```bash
cd ios
pod install
cd ..
# Rebuild in Xcode
```

### Issue: "Command PhaseScriptExecution failed"

**Solution:**
```bash
cd ios
pod deintegrate
pod install
cd ..
# Clean build folder in Xcode: Cmd + Shift + K
# Rebuild: Cmd + R
```

### Issue: Ads not loading

**Check:**
1. Internet connection in simulator
2. Console for error messages
3. AdMob account is approved (new accounts take 24-48 hours)

### Issue: "Could not find iPhone simulator"

**Solution:**
```bash
# Install iOS simulators via Xcode
# Xcode > Settings > Platforms > Download iOS simulators
```

### Issue: Build succeeds but app crashes immediately

**Solution:**
```bash
# Clean everything and rebuild
cd ios
pod deintegrate
pod install
cd ..

# In Xcode:
# Product > Clean Build Folder (Cmd + Shift + K)
# Product > Build (Cmd + B)
```

---

## Updating Dependencies

When you update packages or change configuration:

```bash
# Regenerate native project
npx expo prebuild --platform ios --clean

# Reinstall pods
cd ios
pod install
cd ..

# Rebuild in Xcode
```

---

## Building for Physical Device

### Requirements:
1. Apple Developer account (free account works for testing)
2. iPhone connected via USB
3. Trust the computer on your iPhone

### Steps:

1. **Connect iPhone** via USB
2. **Trust device**: On iPhone, tap "Trust This Computer"
3. **Select device** in Xcode (top toolbar)
4. **Set team** in Signing & Capabilities
5. **Build and Run** (Cmd + R)

### First time:
- iPhone may show "Untrusted Developer"
- Go to: Settings > General > VPN & Device Management
- Trust your developer certificate

---

## Adding AdMob App ID for Production

### Step 1: Get App ID from AdMob

1. Go to [AdMob Console](https://apps.admob.com/)
2. Select your iOS app
3. Find App ID (format: `ca-app-pub-XXXXXXXXXXXXX~YYYYYYYYYY`)

### Step 2: Add to Info.plist

Edit `ios/ArmProgress/Info.plist`:

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXXXXXXX~YYYYYYYYYY</string>
```

### Step 3: Add Ad Unit IDs to .env

```env
EXPO_PUBLIC_ADMOB_IOS_BANNER=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_IOS_REWARDED=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
```

### Step 4: Rebuild

```bash
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..
# Rebuild in Xcode
```

---

## Testing Production Ads

### Switch to Production Mode

To test production ads (not test ads):

1. Build in **Release mode** in Xcode:
   - Product > Scheme > Edit Scheme
   - Change "Build Configuration" to **Release**
   - Run (Cmd + R)

2. Or use command line:
   ```bash
   npx expo run:ios --configuration Release
   ```

**⚠️ Warning:** Don't repeatedly click production ads!

---

## Xcode Shortcuts

| Action | Shortcut |
|--------|----------|
| Build & Run | `Cmd + R` |
| Stop | `Cmd + .` |
| Clean Build | `Cmd + Shift + K` |
| Open Quickly | `Cmd + Shift + O` |
| Show Debug Area | `Cmd + Shift + Y` |
| Show Navigator | `Cmd + 1` |

---

## Project Structure

After prebuild, your structure looks like:

```
ArmProgress/
├── ios/                          # Native iOS code
│   ├── ArmProgress.xcworkspace  # Open this in Xcode!
│   ├── ArmProgress.xcodeproj    # Don't open this
│   ├── ArmProgress/              # App source
│   │   ├── Info.plist           # Add AdMob App ID here
│   │   └── ...
│   ├── Pods/                     # CocoaPods dependencies
│   └── Podfile                   # CocoaPods configuration
├── app/                          # Your React Native code
├── components/                   # Your components (AdBanner, etc.)
└── package.json
```

---

## Performance Tips

### Faster Builds

1. **Use physical device when possible** (faster than simulator)
2. **Keep Xcode open** between builds
3. **Use Fast Refresh** instead of full rebuilds
4. **Close other apps** to free up RAM

### Clean Build When Needed

Only clean when you have issues:
```bash
# In Xcode: Cmd + Shift + K
# Or delete build folder:
rm -rf ios/build
```

---

## Next Steps

1. ✅ Build succeeds in Xcode
2. ✅ Test ads show in app
3. ⏳ Create AdMob account
4. ⏳ Add production ad unit IDs
5. ⏳ Test with real ads
6. ⏳ Submit to App Store

---

## Resources

- [Xcode Documentation](https://developer.apple.com/xcode/)
- [Expo Prebuild Guide](https://docs.expo.dev/workflow/prebuild/)
- [React Native iOS Setup](https://reactnative.dev/docs/environment-setup)
- [AdMob iOS Setup](https://developers.google.com/admob/ios/quick-start)
- [CocoaPods](https://cocoapods.org/)

---

## Summary

✅ Generate iOS project: `npx expo prebuild --platform ios`  
✅ Install pods: `cd ios && pod install`  
✅ Open workspace: `open ios/ArmProgress.xcworkspace`  
✅ Build & Run: `Cmd + R` in Xcode  
✅ See real test ads working!  

Your iOS app is ready with working AdMob integration! 🎉

