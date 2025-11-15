# AdMob Platform-Specific Configuration Guide

## ✅ Your Code is Already Set Up Correctly!

The code **automatically handles** platform-specific ad IDs. This guide shows you how it works and how to configure it.

---

## How Platform Detection Works

### Automatic Selection

When your app runs, it automatically picks the right ad ID:

```typescript
// In components/AdBanner.tsx (and all ad components)
const adUnitID = Platform.select({
  ios: ADMOB_CONFIG.banner.ios,        // 👈 iOS device uses this
  android: ADMOB_CONFIG.banner.android  // 👈 Android device uses this
})
```

**Result:**
- iPhone/iPad → Uses iOS ad unit ID
- Android phone/tablet → Uses Android ad unit ID
- **No manual switching needed!**

---

## Understanding AdMob IDs

AdMob has **two types of IDs** - both are platform-specific:

### 1. App ID (One per platform)

**Format:** `ca-app-pub-XXXXXXXXXXXXX~YYYYYYYYYY` ← Notice the `~`

| Platform | Where it goes | Count |
|----------|---------------|-------|
| iOS | `ios/ArmProgress/Info.plist` | 1 |
| Android | `android/app/src/main/AndroidManifest.xml` | 1 |

**Purpose:** Identifies your app to AdMob

### 2. Ad Unit IDs (Multiple per platform)

**Format:** `ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY` ← Notice the `/`

| Platform | Ad Type | Where it goes | Variable Name |
|----------|---------|---------------|---------------|
| iOS | Banner | `.env` | `EXPO_PUBLIC_ADMOB_IOS_BANNER` |
| iOS | Interstitial | `.env` | `EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL` |
| iOS | Rewarded | `.env` | `EXPO_PUBLIC_ADMOB_IOS_REWARDED` |
| Android | Banner | `.env` | `EXPO_PUBLIC_ADMOB_ANDROID_BANNER` |
| Android | Interstitial | `.env` | `EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL` |
| Android | Rewarded | `.env` | `EXPO_PUBLIC_ADMOB_ANDROID_REWARDED` |

**Purpose:** Identifies specific ad placements in your app

---

## Current Configuration (Already Set Up)

### Test Mode (Development)

Your `lib/config.ts` already has **Google's test IDs** for both platforms:

```typescript
export const ADMOB_CONFIG = {
  banner: {
    ios: 'ca-app-pub-3940256099942544/2934735716',      // iOS test banner
    android: 'ca-app-pub-3940256099942544/6300978111',  // Android test banner
  },
  interstitial: {
    ios: 'ca-app-pub-3940256099942544/4411468910',      // iOS test interstitial
    android: 'ca-app-pub-3940256099942544/1033173712',  // Android test interstitial
  },
  rewarded: {
    ios: 'ca-app-pub-3940256099942544/1712485313',      // iOS test rewarded
    android: 'ca-app-pub-3940256099942544/5224354917',  // Android test rewarded
  },
}
```

✅ **This means:**
- iOS builds → Show iOS test ads
- Android builds → Show Android test ads
- Automatically switches based on device!

### Production Mode (When Ready)

When you add your `.env` file, it automatically uses **your production IDs**:

```env
# iOS Production Ad Unit IDs
EXPO_PUBLIC_ADMOB_IOS_BANNER=ca-app-pub-YOUR_PUBLISHER_ID/YOUR_IOS_BANNER_ID
EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL=ca-app-pub-YOUR_PUBLISHER_ID/YOUR_IOS_INTERSTITIAL_ID
EXPO_PUBLIC_ADMOB_IOS_REWARDED=ca-app-pub-YOUR_PUBLISHER_ID/YOUR_IOS_REWARDED_ID

# Android Production Ad Unit IDs
EXPO_PUBLIC_ADMOB_ANDROID_BANNER=ca-app-pub-YOUR_PUBLISHER_ID/YOUR_ANDROID_BANNER_ID
EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL=ca-app-pub-YOUR_PUBLISHER_ID/YOUR_ANDROID_INTERSTITIAL_ID
EXPO_PUBLIC_ADMOB_ANDROID_REWARDED=ca-app-pub-YOUR_PUBLISHER_ID/YOUR_ANDROID_REWARDED_ID
```

---

## Setting Up Your AdMob Account

### Step 1: Create Two Apps in AdMob

Go to [AdMob Console](https://apps.admob.com/) → Apps → Add App

Create **two separate apps**:

```
📱 App 1: "Arm Wrestling Pro" (iOS)
   Platform: iOS
   App Store: Link to your iOS app or add manually

📱 App 2: "Arm Wrestling Pro" (Android)  
   Platform: Android
   Play Store: Link to your Android app or add manually
```

### Step 2: Note Your App IDs

After creating each app, you'll get an **App ID**:

```
iOS App ID:     ca-app-pub-1234567890123456~0987654321
Android App ID: ca-app-pub-1234567890123456~1122334455
                                          👆 Notice the tilde (~)
```

### Step 3: Create Ad Units for Each Platform

For **each app** (iOS and Android), create three ad units:

#### For iOS App:

1. **Banner Ad Unit**
   - Name: "iOS Banner"
   - Type: Banner
   - Size: 320x50
   - Result: `ca-app-pub-XXXXX/1111111111`

2. **Interstitial Ad Unit**
   - Name: "iOS Interstitial"
   - Type: Interstitial
   - Result: `ca-app-pub-XXXXX/2222222222`

3. **Rewarded Ad Unit**
   - Name: "iOS Rewarded"
   - Type: Rewarded
   - Result: `ca-app-pub-XXXXX/3333333333`

#### For Android App:

1. **Banner Ad Unit**
   - Name: "Android Banner"
   - Type: Banner
   - Size: 320x50
   - Result: `ca-app-pub-XXXXX/4444444444`

2. **Interstitial Ad Unit**
   - Name: "Android Interstitial"
   - Type: Interstitial
   - Result: `ca-app-pub-XXXXX/5555555555`

3. **Rewarded Ad Unit**
   - Name: "Android Rewarded"
   - Type: Rewarded
   - Result: `ca-app-pub-XXXXX/6666666666`

---

## Configuration Checklist

### ✅ Ad Unit IDs (`.env` file)

Create/update `.env` in your project root:

```env
# iOS Ad Unit IDs (from iOS app in AdMob)
EXPO_PUBLIC_ADMOB_IOS_BANNER=ca-app-pub-XXXXXXXXXXXXX/1111111111
EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXX/2222222222
EXPO_PUBLIC_ADMOB_IOS_REWARDED=ca-app-pub-XXXXXXXXXXXXX/3333333333

# Android Ad Unit IDs (from Android app in AdMob)
EXPO_PUBLIC_ADMOB_ANDROID_BANNER=ca-app-pub-XXXXXXXXXXXXX/4444444444
EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXX/5555555555
EXPO_PUBLIC_ADMOB_ANDROID_REWARDED=ca-app-pub-XXXXXXXXXXXXX/6666666666
```

### ✅ iOS App ID

**File:** `ios/ArmProgress/Info.plist`

Add inside the `<dict>` tag:

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXXXXXXX~YOUR_IOS_APP_ID</string>
```

**Full example:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Other keys -->
    
    <!-- Add this for AdMob -->
    <key>GADApplicationIdentifier</key>
    <string>ca-app-pub-1234567890123456~0987654321</string>
    
    <!-- Other keys -->
</dict>
</plist>
```

### ✅ Android App ID

**File:** `android/app/src/main/AndroidManifest.xml`

Add inside the `<application>` tag:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXXXXXXX~YOUR_ANDROID_APP_ID"/>
```

**Full example:**
```xml
<manifest>
    <application>
        <!-- Other elements -->
        
        <!-- Add this for AdMob -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-1234567890123456~1122334455"/>
        
        <!-- Other elements -->
    </application>
</manifest>
```

---

## Verification

### How to Verify It's Working

1. **Check logs in development build:**

   **iOS (Xcode):**
   - Build and run
   - Check console for: `"AdMob Banner loaded successfully"`
   - Look for platform: Should show iOS ad unit ID

   **Android (Android Studio):**
   - Build and run
   - Check Logcat for: `"AdMob Banner loaded successfully"`
   - Filter by "GoogleMobileAds" to see ad loading

2. **Verify correct IDs are being used:**

   Add this temporarily to `AdBanner.tsx`:
   ```typescript
   console.log('Platform:', Platform.OS);
   console.log('Ad Unit ID:', adUnitID);
   ```

   **Expected output:**
   - iOS device: `Platform: ios` + iOS ad unit ID
   - Android device: `Platform: android` + Android ad unit ID

---

## Visual Summary

```
Your App Running
│
├─ On iPhone/iPad
│  │
│  ├─ Platform.OS = "ios"
│  │
│  └─ Uses these IDs:
│     ├─ App ID: ios/ArmProgress/Info.plist
│     ├─ Banner: EXPO_PUBLIC_ADMOB_IOS_BANNER
│     ├─ Interstitial: EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL
│     └─ Rewarded: EXPO_PUBLIC_ADMOB_IOS_REWARDED
│
└─ On Android Device
   │
   ├─ Platform.OS = "android"
   │
   └─ Uses these IDs:
      ├─ App ID: AndroidManifest.xml
      ├─ Banner: EXPO_PUBLIC_ADMOB_ANDROID_BANNER
      ├─ Interstitial: EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL
      └─ Rewarded: EXPO_PUBLIC_ADMOB_ANDROID_REWARDED
```

---

## Common Mistakes to Avoid

### ❌ Using iOS ad unit on Android
```env
# WRONG - Same ID for both
EXPO_PUBLIC_ADMOB_IOS_BANNER=ca-app-pub-XXX/111
EXPO_PUBLIC_ADMOB_ANDROID_BANNER=ca-app-pub-XXX/111  # ❌ Should be different!
```

### ✅ Correct - Different IDs
```env
# CORRECT - Platform-specific IDs
EXPO_PUBLIC_ADMOB_IOS_BANNER=ca-app-pub-XXX/111       # iOS banner
EXPO_PUBLIC_ADMOB_ANDROID_BANNER=ca-app-pub-XXX/444   # Android banner (different!)
```

### ❌ Mixing up App ID and Ad Unit ID
```xml
<!-- WRONG - Using ad unit ID instead of app ID -->
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXX/111</string>  <!-- ❌ This is an ad UNIT ID (has /) -->
```

### ✅ Correct - App ID
```xml
<!-- CORRECT - Using app ID -->
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXX~999</string>  <!-- ✅ This is an app ID (has ~) -->
```

---

## Testing Platform Detection

### Quick Test Script

Add this to any screen temporarily to verify:

```typescript
import { Platform, Alert } from 'react-native';
import { ADMOB_CONFIG } from '@/lib/config';

// Add button with:
<Button 
  title="Test AdMob Config"
  onPress={() => {
    const bannerID = Platform.select({
      ios: ADMOB_CONFIG.banner.ios,
      android: ADMOB_CONFIG.banner.android,
    });
    
    Alert.alert(
      'AdMob Config',
      `Platform: ${Platform.OS}\nBanner ID: ${bannerID}\nTest Mode: ${ADMOB_CONFIG.isTestMode}`
    );
  }}
/>
```

**Expected Results:**
- iOS: Shows `Platform: ios` + iOS banner ID
- Android: Shows `Platform: android` + Android banner ID

---

## Summary

✅ **Already Configured:**
- Code automatically detects platform
- Uses correct ad unit ID for each platform
- Switches between test and production IDs

✅ **You Need to Provide:**
- 2 App IDs (iOS + Android) → Native config files
- 6 Ad Unit IDs (3 per platform) → `.env` file

✅ **No Code Changes Needed:**
- Platform detection is automatic
- Everything is already set up correctly

---

## Quick Reference

| What | Count | Goes Where |
|------|-------|------------|
| **App IDs** | 2 (1 iOS + 1 Android) | Native config files |
| **Ad Unit IDs** | 6 (3 iOS + 3 Android) | `.env` file |
| **Code Changes** | 0 | Already done! |

Your app is ready for platform-specific ads! 🎉

