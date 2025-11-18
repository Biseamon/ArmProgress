# Android In-App Purchase Testing Guide

Unlike iOS which has local StoreKit testing, Android requires Google Play services for in-app purchases. Here are your testing options.

## Option 1: License Testing (Development - Easiest)

This allows testing without uploading to Google Play Console.

### Setup Steps:

1. **Add Your Google Account as a License Tester:**
   - Go to [Google Play Console](https://play.google.com/console/)
   - Select your app
   - Go to **Setup → License testing**
   - Add your Gmail account under "License testers"
   - Set license response to **RESPOND_NORMALLY**

2. **Create Products in Google Play Console:**
   - Go to **Monetize → Products → Subscriptions** (or In-app products)
   - Click **"Create subscription"**
   - Create products matching your RevenueCat dashboard:
     - `premium_monthly` - Set your price (e.g., $4.99)
     - `premium_annual` - Set your price (e.g., $39.99)
     - `premium_lifetime` - Create as non-consumable product
   - **Important**: Products must be in **"Active"** status

3. **Link Products in RevenueCat:**
   - Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
   - Navigate to **Projects → Your Project → Products**
   - Add the Google Play product IDs
   - Add them to your offering

4. **Test on Device:**
   - Build and install the app on your Android device
   - Sign in with the Google account you added as a license tester
   - Navigate to the paywall
   - **License testers see a banner**: "This is a test purchase"
   - Complete the purchase - **you won't be charged**
   - Purchase completes successfully without real payment

### Advantages:
- ✅ No need to upload APK
- ✅ Quick iteration during development
- ✅ No real charges
- ✅ Works immediately

### Limitations:
- ❌ Still requires Google Play Console setup
- ❌ Products must be created and active
- ❌ Need physical device or emulator with Google Play

---

## Option 2: Internal Testing Track (Recommended for Testing)

Best for testing with a small team before public release.

### Setup Steps:

1. **Create Products** (same as Option 1)

2. **Upload to Internal Testing:**
   - Build Android App Bundle (AAB):
     ```bash
     cd android
     ./gradlew bundleRelease
     ```
   - Go to Google Play Console → **Release → Testing → Internal testing**
   - Create a new release
   - Upload `android/app/build/outputs/bundle/release/app-release.aab`
   - Add release notes
   - Click **"Review release"** → **"Start rollout"**

3. **Add Testers:**
   - In Internal testing section, click **"Testers"**
   - Create an email list with tester Gmail accounts
   - Share the opt-in URL with testers

4. **Test:**
   - Testers download from the opt-in URL
   - Purchases work exactly like production
   - **Testers are NOT charged** (test purchases are free)

### Advantages:
- ✅ Most realistic testing environment
- ✅ Tests full purchase flow
- ✅ No charges for testers
- ✅ Can add up to 100 testers

### Testing Tips:
- **Subscription renewals**: Set to "test mode" for faster renewals (5 min instead of 1 month)
- **Cancellations**: Test canceling and refunding
- **Restore purchases**: Uninstall/reinstall to test restoration

---

## Option 3: Closed Testing (Beta Track)

Similar to Internal Testing but for larger groups (up to 10,000 testers).

Setup is the same as Internal Testing, but:
- Go to **Closed testing** instead
- Can have multiple closed tracks
- Takes ~24 hours for review (first time)

---

## Current Setup in Your App

Your app is already configured for Android IAP:

### 1. Package Name
Check `android/app/build.gradle`:
```gradle
applicationId "com.armprogress.app"  // This is your package name
```

### 2. RevenueCat Android Key
In `.env`:
```
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxx
```

### 3. Google Play Developer Account
You need:
- Active Google Play Developer account ($25 one-time fee)
- App created in Google Play Console with matching package name

---

## Quick Start: What to Do Now

### For Quick Testing (Option 1):

1. **Create app in Google Play Console** (if not done):
   - Go to https://play.google.com/console/
   - Create app with package name: `com.armprogress.app`

2. **Create subscription products**:
   - Monetize → Subscriptions
   - Create: `premium_monthly`, `premium_annual`
   - Create: `premium_lifetime` (as In-app product)
   - Activate all products

3. **Add yourself as license tester**:
   - Setup → License testing
   - Add your Gmail account
   - Set to RESPOND_NORMALLY

4. **Build and test**:
   ```bash
   # Build APK for testing
   cd android
   ./gradlew assembleRelease

   # Install on device
   adb install app/build/outputs/apk/release/app-release.apk
   ```

5. **Test purchase flow**:
   - Open app
   - Go to paywall
   - You'll see "This is a test purchase" banner
   - Complete purchase (no charge)

---

## Troubleshooting

### "Item not available for purchase"
**Cause**: Products not created or not active in Google Play Console

**Solution**:
1. Check products are created and **Active**
2. Wait 2-4 hours after creating products (Google Play sync)
3. Verify product IDs match exactly in RevenueCat

### "You're not authorized to make this purchase"
**Cause**: Not added as license tester or wrong Google account

**Solution**:
1. Add your Gmail to license testers
2. Sign in with that account on device
3. Clear Google Play Store cache

### "This version of the app is not configured for billing"
**Cause**: Package name mismatch or app not uploaded

**Solution**:
1. Verify package name matches: `com.armprogress.app`
2. For internal testing, upload at least one release
3. Wait 2-4 hours after first upload

### RevenueCat shows no offerings
**Cause**: Products not linked in RevenueCat or API key incorrect

**Solution**:
1. Check `.env` has correct `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
2. In RevenueCat dashboard, add Google Play product IDs
3. Ensure products are in an offering
4. Restart app

---

## Comparison: iOS vs Android Testing

| Feature | iOS (StoreKit) | Android (License Testing) |
|---------|---------------|---------------------------|
| Local testing | ✅ Yes | ❌ No, needs Google Play |
| Setup time | 🚀 Instant | 🕒 2-4 hours (first time) |
| Requires upload | ❌ No | ⚠️ Optional (license testing) |
| Real purchase flow | ✅ Identical | ✅ Identical |
| Multiple testers | ✅ Easy | ✅ Easy (email list) |
| Cost | Free | $25 Google Play account |

---

## Production Checklist

Before releasing to production:

### iOS:
- [ ] Products created in App Store Connect
- [ ] Products linked in RevenueCat
- [ ] App submitted for review with IAP
- [ ] Subscription terms clearly displayed
- [ ] Restore purchases working

### Android:
- [ ] Products created in Google Play Console
- [ ] Products Active and linked in RevenueCat
- [ ] App uploaded to Production track
- [ ] Privacy Policy URL added
- [ ] Subscription terms displayed
- [ ] Restore purchases working

---

## Additional Resources

- [RevenueCat Android Guide](https://www.revenuecat.com/docs/android)
- [Google Play Billing Guide](https://developer.android.com/google/play/billing/integrate)
- [Testing In-App Purchases](https://developer.android.com/google/play/billing/test)
- [RevenueCat Testing Guide](https://www.revenuecat.com/docs/test-and-launch)
