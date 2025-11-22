# iOS Build & Submit Workflow

Complete step-by-step guide for building and submitting ArmProgress to the App Store.

---

## Prerequisites

- Xcode installed (latest stable version)
- Apple Developer account with App Store Connect access
- CocoaPods installed (`sudo gem install cocoapods`)
- Node.js and npm installed

---

## Step 1: Regenerate iOS Project

After making code changes, regenerate the native iOS project:

```bash
cd /Users/marincapranov/Desktop/TestApps/ArmProgress
npx expo prebuild --platform ios --clean
```

This creates fresh native code from your Expo/React Native source.

---

## Step 2: Verify New Architecture Setting

> **NOTE**: New Architecture must stay **enabled** (`true`) because `react-native-reanimated` v4.x requires it.

Verify these files have correct settings:

**ios/Podfile.properties.json:**
```json
{
  "newArchEnabled": "true"
}
```

**ios/ArmProgress/Info.plist:**
```xml
<key>RCTNewArchEnabled</key>
<true/>
```

If you see errors about Reanimated requiring New Architecture, ensure both files have `true`.

---

## Step 3: Install CocoaPods

```bash
cd ios
export LANG=en_US.UTF-8
pod install
cd ..
```

If you get encoding errors, the `LANG` export fixes UTF-8 issues.

---

## Step 4: Increment Build Number

Edit `ios/ArmProgress/Info.plist` and increment `CFBundleVersion`:

```xml
<key>CFBundleVersion</key>
<string>2</string>  <!-- Increment this for each upload: 1, 2, 3, etc. -->
```

**Note**:
- `CFBundleShortVersionString` = Marketing version (1.0.0) - change for new releases
- `CFBundleVersion` = Build number (1, 2, 3...) - increment for each upload

---

## Step 5: Open Xcode Workspace

```bash
open ios/ArmProgress.xcworkspace
```

**Important**: Always open `.xcworkspace`, NOT `.xcodeproj`

---

## Step 6: Verify Settings in Xcode

Before building, verify:

1. **Signing & Capabilities**: Correct team and bundle ID selected
2. **Build Settings**: Check that `RCTNewArchEnabled` shows as `NO`
3. **General**: Version and build number are correct

---

## Step 7: Test on iPad Simulator

1. Select any iPad simulator from the destination dropdown (top left)
2. Press **Cmd + R** (or Product > Run)
3. Verify the app launches without crashing
4. Test basic functionality

**This step is critical** - the previous rejection was for iPad crashes.

---

## Step 8: Clean Build (Before Archive)

Press **Shift + Cmd + K** or go to **Product > Clean Build Folder**

This ensures no stale artifacts are included in the archive.

---

## Step 9: Archive for Distribution

1. Change destination to **Any iOS Device (arm64)** (not a simulator)
2. Press **Shift + Cmd + U** or go to **Product > Archive**
3. Wait for the build to complete (may take several minutes)
4. Organizer window opens automatically when done

---

## Step 10: Upload to App Store Connect

In the Organizer window:

1. Select your latest archive
2. Click **Distribute App**
3. Select **App Store Connect** > **Upload**
4. Click **Next** through the options (defaults are fine)
5. Wait for validation and upload to complete
6. You'll see "Upload Successful" when done

---

## Step 11: Wait for Processing

- Apple processes the build (5-15 minutes typically)
- You'll receive an email: "Your app build is now available for submission"
- The build will appear in App Store Connect

---

## Step 12: Replace Build in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app (ArmProgress)
3. Go to your version (e.g., 1.0.0)
4. Scroll to the **Build** section
5. Click the **(+)** button or current build
6. Select your new build from the list
7. Click **Done**
8. Click **Save** (top right)

---

## Step 13: Submit for Review

1. Click **Add for Review** (or **Submit for Review**)
2. Answer compliance questions:
   - Export Compliance: Select "None of the algorithms mentioned above"
   - Content Rights: Confirm you have rights to content
3. Click **Submit**

---

## Updating Builds After Code Changes

When you make code changes and want to test them on TestFlight or submit a new build:

### Quick Update Workflow

```bash
# 1. Navigate to project
cd /Users/marincapranov/Desktop/TestApps/ArmProgress

# 2. Increment build number in ios/ArmProgress/Info.plist
# Change CFBundleVersion from "2" to "3", etc.

# 3. Clean old artifacts and reinstall pods
cd ios
rm -rf Pods Podfile.lock build
export LANG=en_US.UTF-8
pod install
cd ..

# 4. Open Xcode
open ios/ArmProgress.xcworkspace
```

### In Xcode

1. **Clean Build** - Press **⇧⌘K**
2. **Test on Simulator** - Select iPad, press **⌘R**
3. **Archive** - Select "Any iOS Device (arm64)", then **Product > Archive**
4. **Upload** - Organizer opens → **Distribute App** → **App Store Connect** → **Upload**

### Upload to TestFlight (for testing changes)

1. After upload completes, wait 5-15 minutes for processing
2. Go to [App Store Connect](https://appstoreconnect.apple.com)
3. Select your app → **TestFlight** tab
4. New build appears automatically
5. Add testers to internal or external testing groups
6. Testers receive notification to update

### Upload for App Review (production release)

1. Go to App Store Connect → Your app → **App Store** tab
2. Select your version (e.g., 1.0.0)
3. In **Build** section, click **(+)**
4. Select the new build
5. Click **Save** → **Submit for Review**

### Important Notes

- **Always increment `CFBundleVersion`** - App Store rejects duplicate build numbers
- **Build number must be higher** than any previously uploaded build
- TestFlight builds can be used for App Review (same build)
- Test on TestFlight first to verify changes work before submitting for review

### Build Number Strategy

| Purpose | CFBundleVersion | CFBundleShortVersionString |
|---------|-----------------|----------------------------|
| Bug fix build | 3, 4, 5... | 1.0.0 (same) |
| New version | 1 (reset ok) | 1.1.0 (increment) |

**Tip**: You can upload many builds to TestFlight (build 1, 2, 3...) and only submit the stable one for App Review.

---

## Troubleshooting

### iPad Crash on Launch
- **Cause**: Stale build artifacts or native module mismatch
- **Fix**: Clean rebuild with fresh pod install (see "setColor" fix below)

### Blank App Icon
- **Cause**: Missing or placeholder icon
- **Fix**: Ensure `assets/images/icon.png` is 1024x1024px

### CocoaPods UTF-8 Error
- **Cause**: Locale not set correctly
- **Fix**: Run `export LANG=en_US.UTF-8` before `pod install`

### Build Number Already Used
- **Cause**: Uploading same build number twice
- **Fix**: Increment `CFBundleVersion` in Info.plist

### Red Pods Folder in Xcode
- **Cause**: Pods not properly linked
- **Fix**: Close Xcode, delete Pods folder, run `pod install`, reopen workspace

### "setColor" Crash in Simulator
- **Cause**: Stale build artifacts or native module mismatch
- **Fix**: Clean build folder, reinstall pods, rebuild

---

## Quick Command Reference

```bash
# Full rebuild from scratch
cd /Users/marincapranov/Desktop/TestApps/ArmProgress
npx expo prebuild --platform ios --clean

# Fix New Architecture (ALWAYS run after prebuild)
sed -i '' 's/<key>RCTNewArchEnabled<\/key>.*<true\/>/<key>RCTNewArchEnabled<\/key>\n\t<false\/>/g' ios/ArmProgress/Info.plist

# Install pods
cd ios && export LANG=en_US.UTF-8 && pod install && cd ..

# Open Xcode
open ios/ArmProgress.xcworkspace
```

---

## Checklist Before Submitting

- [ ] `RCTNewArchEnabled` is `false` in Info.plist
- [ ] Build number incremented
- [ ] Tested on iPad simulator (no crash)
- [ ] Tested on iPhone simulator
- [ ] App icon displays correctly
- [ ] Clean build performed before archive
- [ ] Archive uploaded successfully
- [ ] New build selected in App Store Connect

---

## Version History

| Version | Build | Date | Notes |
|---------|-------|------|-------|
| 1.0.0   | 1     | -    | Initial submission (rejected - iPad crash) |
| 1.0.0   | 2     | -    | Fixed New Architecture setting |

---

*Last updated: November 2024*
