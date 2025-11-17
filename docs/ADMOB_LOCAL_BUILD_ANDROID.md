# Building with Android Studio for Real AdMob Ads (Android)

This guide shows you how to build your app locally with Android Studio so AdMob ads work with real native code.

## Prerequisites

✅ Android Studio installed  
✅ Android SDK installed (via Android Studio)  
✅ JDK (Java Development Kit) installed  
✅ Android Emulator or physical Android device  

### Install Android Studio

1. Download from [developer.android.com/studio](https://developer.android.com/studio)
2. Install with default settings
3. Install Android SDK (API 34 recommended)

### Install JDK

Android Studio usually includes JDK, but if needed:
```bash
# On Mac with Homebrew
brew install openjdk@17

# Or download from Oracle
```

---

## Step 1: Generate Native Android Project

Run this from your project root:

```bash
cd /Users/marincapranov/Desktop/TestApps/ArmProgress
npx expo prebuild --platform android
```

This creates the `android/` folder with native Android project files.

**What it does:**
- Creates `android/` folder with Gradle project
- Adds all native dependencies (including Google Mobile Ads)
- Configures build settings
- Links React Native

---

## Step 2: Open in Android Studio

### Option A: Command Line
```bash
studio android
# or
open -a "Android Studio" android
```

### Option B: Android Studio GUI
1. Open Android Studio
2. Click **"Open"**
3. Navigate to `ArmProgress/android/` folder
4. Click **"Open"**

**⚠️ Important:** Open the `android` folder, not the root project folder

### First Time Opening

Android Studio will:
1. Index files (takes 1-2 minutes)
2. Download Gradle dependencies (takes 5-10 minutes)
3. Sync Gradle

Wait for **"Gradle sync finished"** message at bottom.

---

## Step 3: Configure Android Studio

### A. Set Up Android SDK

1. Go to **Android Studio > Settings** (or **Preferences** on Mac)
2. Navigate to **Appearance & Behavior > System Settings > Android SDK**
3. Ensure these are installed:
   - ✅ Android 14.0 (API 34) or latest
   - ✅ Android SDK Platform-Tools
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Command-line Tools

### B. Create/Start Emulator

**Create new emulator:**
1. Click **Device Manager** (phone icon in toolbar)
2. Click **"Create Virtual Device"**
3. Select **Phone** > **Pixel 6** (recommended)
4. Select **System Image** (e.g., API 34, x86_64)
5. Click **Finish**

**Or use physical device:**
1. Enable **Developer Options** on your Android phone:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
2. Enable **USB Debugging**:
   - Settings > Developer Options > USB Debugging
3. Connect via USB
4. Accept "Allow USB Debugging" prompt

---

## Step 4: Configure AdMob App ID (Optional for Testing)

For production, you'll need to add your AdMob App ID.

### Edit `android/app/src/main/AndroidManifest.xml`

Add this inside the `<application>` tag:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXXXXXXX~YYYYYYYYYY"/>
```

Replace `ca-app-pub-XXXXXXXXXXXXX~YYYYYYYYYY` with your AdMob App ID from [AdMob Console](https://apps.admob.com/).

**For testing without App ID:**
The app will work with test ads even without this. Add it when you have a real AdMob account.

---

## Step 5: Build and Run

### Option A: Using Android Studio GUI

1. **Select device** in toolbar (emulator or connected phone)
2. Click **Run button** (▶️) or press `Shift + F10`
3. Select **app** configuration
4. Wait for build to complete

### Option B: Using Command Line

```bash
# Make sure you're in project root
cd /Users/marincapranov/Desktop/TestApps/ArmProgress

# Run on emulator
npx expo run:android

# Run on specific device
npx expo run:android --device "Pixel_6_API_34"

# Run on physical device
npx expo run:android --device
```

**First build takes 10-15 minutes.** Subsequent builds are much faster.

---

## Step 6: Verify Ads Work

Once the app launches:

### You should see:

✅ **Test ads loading** (with "TEST AD - Development Mode" label)  
✅ **Real AdMob banner** (not placeholder)  
✅ Console logs: "AdMob Banner loaded successfully"  

### Debug Logs

View logs in Android Studio:
1. Click **Logcat** tab at bottom
2. Filter by: **"AdMob"** or **"GoogleMobileAds"**
3. Look for ad loading messages

Or use command line:
```bash
npx react-native log-android
```

---

## Development Workflow

### First Build (Run Once)
```bash
npx expo prebuild --platform android
# Open in Android Studio
# Click Run (Shift + F10)
```

### Regular Development (Fast Refresh)

After first build, you can use:

```bash
npm run dev
# Select option: "a" (Android emulator/device)
```

Or in Android Studio, just press `Shift + F10` to rebuild.

---

## Common Issues & Solutions

### Issue: "SDK location not found"

**Solution:**
Create `android/local.properties`:

```properties
# Mac
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk

# Linux
sdk.dir=/home/YOUR_USERNAME/Android/Sdk

# Windows
sdk.dir=C\:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```

Replace `YOUR_USERNAME` with your actual username.

### Issue: "Gradle build failed"

**Solution:**
```bash
cd android
./gradlew clean
cd ..

# In Android Studio:
# File > Invalidate Caches > Invalidate and Restart
```

### Issue: "Could not resolve com.google.android.gms:play-services-ads"

**Solution:**

Edit `android/build.gradle`, ensure you have:

```gradle
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
```

Then:
```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
cd ..
```

### Issue: Ads not loading

**Check:**
1. Internet connection (emulator has internet access)
2. Logcat for error messages
3. AdMob account is approved (new accounts take 24-48 hours)

### Issue: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"

**Solution:**
```bash
# Uninstall old app from device/emulator
adb uninstall com.armprogress.app

# Rebuild
npx expo run:android
```

### Issue: Metro bundler conflicts

**Solution:**
```bash
# Kill existing Metro
killall node

# Clear cache
npm start -- --reset-cache
```

---

## Updating Dependencies

When you update packages or change configuration:

```bash
# Regenerate native project
npx expo prebuild --platform android --clean

# Clean and rebuild
cd android
./gradlew clean
cd ..

# Rebuild in Android Studio
```

---

## Building APK for Testing

### Debug APK (for testing)

```bash
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

Install on device:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (for production)

First, create keystore:
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

Edit `android/gradle.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=YOUR_PASSWORD
MYAPP_RELEASE_KEY_PASSWORD=YOUR_PASSWORD
```

Edit `android/app/build.gradle`:
```gradle
signingConfigs {
    release {
        storeFile file(MYAPP_RELEASE_STORE_FILE)
        storePassword MYAPP_RELEASE_STORE_PASSWORD
        keyAlias MYAPP_RELEASE_KEY_ALIAS
        keyPassword MYAPP_RELEASE_KEY_PASSWORD
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        // ...
    }
}
```

Build:
```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

## Adding AdMob App ID for Production

### Step 1: Get App ID from AdMob

1. Go to [AdMob Console](https://apps.admob.com/)
2. Select your Android app
3. Find App ID (format: `ca-app-pub-XXXXXXXXXXXXX~YYYYYYYYYY`)

### Step 2: Add to AndroidManifest.xml

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
    <meta-data
        android:name="com.google.android.gms.ads.APPLICATION_ID"
        android:value="ca-app-pub-XXXXXXXXXXXXX~YYYYYYYYYY"/>
</application>
```

### Step 3: Add Ad Unit IDs to .env

```env
EXPO_PUBLIC_ADMOB_ANDROID_BANNER=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_ANDROID_REWARDED=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
```

### Step 4: Rebuild

```bash
npx expo prebuild --platform android --clean
# Rebuild in Android Studio (Shift + F10)
```

---

## Testing Production Ads

### Switch to Production Mode

Build a **Release variant**:

1. In Android Studio:
   - **Build > Select Build Variant**
   - Change to **release**
   - Run (Shift + F10)

2. Or use command line:
   ```bash
   cd android
   ./gradlew assembleRelease
   adb install app/build/outputs/apk/release/app-release.apk
   ```

**⚠️ Warning:** Don't repeatedly click production ads!

---

## Android Studio Shortcuts

| Action | Shortcut |
|--------|----------|
| Build & Run | `Shift + F10` |
| Stop | `Cmd/Ctrl + F2` |
| Clean Project | Build > Clean Project |
| Rebuild Project | Build > Rebuild Project |
| Open Logcat | `Cmd/Ctrl + 6` |
| Sync Gradle | File > Sync Project with Gradle Files |

---

## Project Structure

After prebuild, your structure looks like:

```
ArmProgress/
├── android/                              # Native Android code
│   ├── app/                              
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml      # Add AdMob App ID here
│   │   │   └── java/
│   │   └── build.gradle                  # App-level config
│   ├── build.gradle                      # Project-level config
│   └── gradle.properties                 # Gradle properties
├── app/                                  # Your React Native code
├── components/                           # Your components (AdBanner, etc.)
└── package.json
```

---

## Useful Gradle Commands

```bash
cd android

# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Install on device
./gradlew installDebug

# List dependencies
./gradlew app:dependencies

# Refresh dependencies
./gradlew --refresh-dependencies
```

---

## Performance Tips

### Faster Builds

1. **Increase Gradle memory**:
   Edit `android/gradle.properties`:
   ```properties
   org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
   org.gradle.daemon=true
   org.gradle.parallel=true
   org.gradle.configureondemand=true
   ```

2. **Use physical device** (faster than emulator)

3. **Enable instant run** in Android Studio settings

4. **Close other apps** to free up RAM

### Clean Build When Needed

Only clean when you have issues:
```bash
cd android
./gradlew clean
cd ..

# In Android Studio:
# Build > Clean Project
```

---

## Emulator Tips

### Speed up emulator:

1. Use **x86_64** system image (faster)
2. Enable **Hardware acceleration**:
   - Mac: Hypervisor.framework (built-in)
   - Windows: Intel HAXM
   - Linux: KVM
3. Allocate more **RAM** in AVD settings
4. Enable **Graphics: Hardware - GLES 2.0**

### Common emulator commands:

```bash
# List emulators
emulator -list-avds

# Start emulator
emulator -avd Pixel_6_API_34

# Start with more RAM
emulator -avd Pixel_6_API_34 -memory 4096
```

---

## Next Steps

1. ✅ Build succeeds in Android Studio
2. ✅ Test ads show in app
3. ⏳ Create AdMob account
4. ⏳ Add production ad unit IDs
5. ⏳ Test with real ads
6. ⏳ Generate signed APK/AAB
7. ⏳ Submit to Google Play

---

## Resources

- [Android Studio Documentation](https://developer.android.com/studio)
- [Expo Prebuild Guide](https://docs.expo.dev/workflow/prebuild/)
- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)
- [AdMob Android Setup](https://developers.google.com/admob/android/quick-start)
- [Gradle Documentation](https://gradle.org/guides/)

---

## Summary

✅ Generate Android project: `npx expo prebuild --platform android`  
✅ Open in Android Studio: `studio android`  
✅ Wait for Gradle sync  
✅ Build & Run: `Shift + F10`  
✅ See real test ads working!  

Your Android app is ready with working AdMob integration! 🎉

