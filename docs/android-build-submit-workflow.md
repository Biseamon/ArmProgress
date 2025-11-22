# Android Build & Submit Workflow

Complete step-by-step guide for building and submitting ArmProgress to Google Play Store.

---

## Prerequisites

- Android Studio installed (latest stable version)
- Google Play Developer account ($25 one-time fee)
- Java JDK 17 installed
- Node.js and npm installed
- Keystore file for signing (created once, keep safe!)

---

## Step 1: Regenerate Android Project

After making code changes, regenerate the native Android project:

```bash
cd /Users/marincapranov/Desktop/TestApps/ArmProgress
npx expo prebuild --platform android --clean
```

This creates fresh native code from your Expo/React Native source.

---

## Step 2: Clean Build Artifacts (If Needed)

If you encounter build errors, clean the project:

```bash
cd android
./gradlew clean
rm -rf .gradle .cxx app/build build
cd ..
```

---

## Step 3: Update Version Numbers

Edit `android/app/build.gradle` and update:

```gradle
android {
    defaultConfig {
        versionCode 2        // Increment for each upload: 1, 2, 3...
        versionName "1.0.0"  // Marketing version
    }
}
```

Or edit `app.json` before prebuild:

```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 2
    }
  }
}
```

---

## Step 4: Create/Verify Keystore (First Time Only)

If you don't have a keystore, create one:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/release.keystore -alias armprogress -keyalg RSA -keysize 2048 -validity 10000
```

**IMPORTANT**:
- Save this keystore file securely (backup it!)
- Remember your passwords - you cannot recover them
- You need the same keystore for all future updates

---

## Step 5: Configure Signing

Create or edit `android/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=release.keystore
MYAPP_UPLOAD_KEY_ALIAS=armprogress
MYAPP_UPLOAD_STORE_PASSWORD=your_store_password
MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
```

Edit `android/app/build.gradle` to add signing config:

```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## Step 6: Build Release AAB (Android App Bundle)

Google Play requires AAB format (not APK):

```bash
cd android
./gradlew bundleRelease
```

The output file will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Step 7: Test the Release Build (Optional but Recommended)

Build and install a release APK to test:

```bash
cd android
./gradlew assembleRelease
```

Install on device:
```bash
adb install app/build/outputs/apk/release/app-release.apk
```

---

## Step 8: Open Android Studio (Alternative Build Method)

```bash
open -a "Android Studio" android
```

Or from Android Studio:
1. File > Open > Select the `android` folder
2. Build > Generate Signed Bundle / APK
3. Choose Android App Bundle
4. Select your keystore
5. Choose release build variant
6. Click Finish

---

## Updating Builds After Code Changes

When you make code changes and want to test them on internal testing or submit a new build:

### Quick Update Workflow

```bash
# 1. Navigate to project
cd /Users/marincapranov/Desktop/TestApps/ArmProgress

# 2. Increment version code in app.json (or build.gradle)
# Edit app.json: "android": { "versionCode": 3 }  # increment this

# 3. Regenerate native project (if you changed native dependencies)
npx expo prebuild --platform android --clean

# 4. Build new AAB
cd android
./gradlew bundleRelease

# 5. Upload to Play Console
```

### Upload to Internal Testing (for testing changes)

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app (ArmProgress)
3. Navigate to **Release > Testing > Internal testing**
4. Click **Create new release**
5. Upload your new AAB file from `android/app/build/outputs/bundle/release/app-release.aab`
6. Add release notes describing what changed
7. Click **Save** → **Review release** → **Start rollout**
8. Testers will receive update notification

### Upload to Production (for app review/release)

1. Navigate to **Release > Production**
2. Click **Create new release**
3. Upload the new AAB file
4. Add release notes
5. Click **Save** → **Review release** → **Start rollout to Production**

### Important Notes

- **Always increment `versionCode`** - Play Store rejects duplicate version codes
- **Version code must be higher** than any previously uploaded build
- Internal testing builds can be promoted to production (no re-upload needed)
- Use internal testing first to verify changes work before production

### Version Code Strategy

| Track | Version Code | Purpose |
|-------|--------------|---------|
| Internal testing | 1, 2, 3... | Quick iteration, testing |
| Production | Same or higher | Public release |

**Tip**: You can upload to internal testing frequently (e.g., versionCode 1, 2, 3, 4...) and only promote stable builds to production.

---

## Google Play Console Setup

### Step 9: Create App in Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in:
   - App name: ArmProgress
   - Default language: English
   - App or game: App
   - Free or paid: Free
4. Accept declarations
5. Click **Create app**

---

### Step 10: Complete Store Listing

Navigate to **Grow > Store presence > Main store listing**:

**Required fields:**
- **App name**: ArmProgress
- **Short description** (80 chars): Track your arm measurements and workout progress with ease
- **Full description** (4000 chars): Detailed app description
- **App icon**: 512x512 PNG
- **Feature graphic**: 1024x500 PNG (required for featuring)
- **Screenshots**:
  - Phone: 2-8 screenshots (min 320px, max 3840px)
  - Tablet: 2-8 screenshots (7-inch and 10-inch)

---

### Step 11: Complete App Content Section

Navigate to **Policy > App content** and complete ALL sections:

#### Privacy Policy
- Add URL: `https://armprogress.com/privacy-policy.html`

#### Ads
- Select: "Yes, my app contains ads"
- Confirm ad SDK compliance

#### App Access
- Select: "All functionality is available without special access"
- Or provide test credentials if login required

#### Content Rating
- Complete the IARC questionnaire
- Answer all questions honestly
- Receive your content rating

#### Target Audience
- Select age groups (usually 13+)
- Confirm not designed for children

#### News Apps
- Select: "My app is not a news app"

#### COVID-19 Apps
- Select: "My app is not a COVID-19 app"

#### Data Safety
Complete the data safety form:

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| User IDs | Yes | Yes | App functionality, Analytics |
| Name | Yes | No | Account info |
| Email | Yes | No | Account info |
| Photos | Yes | No | App functionality |
| Purchase history | Yes | No | App functionality |

**Security practices:**
- Data encrypted in transit: Yes
- Data can be deleted: Yes (provide instructions)

#### Government Apps
- Select: "My app is not a government app"

#### Financial Features
- Select applicable options for subscriptions/payments

---

### Step 12: Set Up Pricing & Distribution

Navigate to **Monetize > Products > Subscriptions** (if applicable):
- Create subscription products matching your RevenueCat setup
- Set prices for each country

Navigate to **Release > Setup > Managed publishing**:
- Choose automatic or manual publishing

---

### Step 13: Create Internal Testing Track (Recommended First)

Navigate to **Release > Testing > Internal testing**:

1. Click **Create new release**
2. Upload your AAB file (`app-release.aab`)
3. Add release notes
4. Click **Save**
5. Click **Review release**
6. Click **Start rollout to Internal testing**

Add testers:
1. Go to **Testers** tab
2. Create email list
3. Add tester emails
4. Share opt-in link with testers

---

### Step 14: Create Production Release

Once testing is complete:

Navigate to **Release > Production**:

1. Click **Create new release**
2. Upload your AAB file
3. Add release notes:
   ```
   What's new in version 1.0.0:
   - Initial release
   - Track arm measurements
   - View progress over time
   - Premium subscription features
   ```
4. Click **Save**
5. Click **Review release**
6. Fix any errors or warnings
7. Click **Start rollout to Production**

---

### Step 15: Submit for Review

After starting production rollout:
- Google reviews the app (typically 1-3 days, can be longer for new apps)
- You'll receive email notification when approved/rejected
- Check **Publishing overview** for status

---

## Troubleshooting

### Build Fails with CMake Errors
```bash
cd android
rm -rf .cxx app/build build .gradle
./gradlew clean
./gradlew bundleRelease
```

### Keystore Password Issues
- Triple-check passwords in `gradle.properties`
- Ensure no extra spaces or quotes

### AAB Too Large
- Enable ProGuard/R8 minification
- Check for large assets
- Use `bundleRelease` not `assembleRelease`

### Version Code Already Used
- Increment `versionCode` in `build.gradle`
- Each upload must have unique, higher version code

### App Rejected for Policy Violation
- Read rejection email carefully
- Common issues: missing privacy policy, incorrect content rating, data safety incomplete
- Fix issues and resubmit

### Codegen Directory Not Found
```bash
cd android
rm -rf app/build/generated/source/codegen
./gradlew assembleDebug  # Regenerates codegen
./gradlew bundleRelease
```

---

## Quick Command Reference

```bash
# Full rebuild from scratch
cd /Users/marincapranov/Desktop/TestApps/ArmProgress
npx expo prebuild --platform android --clean

# Clean and build release
cd android
./gradlew clean
./gradlew bundleRelease

# Output location
ls -la android/app/build/outputs/bundle/release/app-release.aab

# Build debug APK (for testing)
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk

# Build release APK (for testing)
./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk
```

---

## Checklist Before Submitting

### Build Checklist
- [ ] Version code incremented
- [ ] Version name updated (if new release)
- [ ] Release build successful (no errors)
- [ ] AAB file generated
- [ ] Tested on real device

### Play Console Checklist
- [ ] Store listing complete (title, description, screenshots)
- [ ] Feature graphic uploaded (1024x500)
- [ ] Privacy policy URL added
- [ ] Content rating completed
- [ ] Target audience selected
- [ ] Data safety form completed
- [ ] Ads declaration completed
- [ ] App access configured
- [ ] All policy sections completed

### Release Checklist
- [ ] Internal testing passed
- [ ] Release notes written
- [ ] AAB uploaded
- [ ] No errors in review

---

## Version History

| Version | Code | Date | Notes |
|---------|------|------|-------|
| 1.0.0   | 1    | -    | Initial release |

---

## Important Files

| File | Purpose |
|------|---------|
| `android/app/build.gradle` | Build config, versions, signing |
| `android/gradle.properties` | Keystore passwords |
| `android/app/release.keystore` | Signing key (KEEP SAFE!) |
| `app.json` | Expo config, affects prebuild |

---

## Useful Links

- [Google Play Console](https://play.google.com/console)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [Data Safety Guide](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Content Rating Guide](https://support.google.com/googleplay/android-developer/answer/9859655)

---

*Last updated: November 2024*
