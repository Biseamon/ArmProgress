# 🚀 External Setup Guide - AdMob & RevenueCat

This guide covers **ALL** external setup you need to do for AdMob and RevenueCat. Your app code is **100% ready** - you just need to configure these services and add the API keys.

## ✅ What's Already Done in Your App

Your app has:
- ✅ AdMob SDK installed and configured
- ✅ RevenueCat SDK (9.6.4) installed and configured
- ✅ RevenueCat UI for dashboard paywalls
- ✅ Automatic test/production switching
- ✅ All code implemented and tested
- ✅ Premium status tracking
- ✅ Purchase restoration flow

**All you need to do: Follow this guide to set up the external services!**

---

## 📋 Quick Checklist

- [ ] **Part 1**: Set up AdMob (30-45 minutes)
- [ ] **Part 2**: Set up RevenueCat (45-60 minutes)
- [ ] **Part 3**: Create Store Products (60 minutes)
- [ ] **Part 4**: Link Everything Together (15 minutes)
- [ ] **Part 5**: Add Keys to `.env` and Build

**Total Time**: ~3-4 hours

---

# PART 1: AdMob Setup (Monetization)

## Step 1.1: Create AdMob Account

1. Go to **https://apps.admob.com/**
2. Click "**Sign Up**" (or "Get Started")
3. Sign in with your Google account
4. Accept the terms and conditions
5. Complete your account information

## Step 1.2: Add Your iOS App

1. In AdMob dashboard, click "**Apps**" in left menu
2. Click "**Add App**"
3. Select platform: **iOS**
4. **Is your app published on the App Store?**
   - If **NO** (for testing): Select "No" → Enter app name: `ArmProgress`
   - If **YES**: Enter your App Store URL
5. Click "**Next**"
6. **Enable user metrics**: Choose your preference
7. Click "**Add App**"

📝 **Save this**:
```
iOS App ID: ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
```

## Step 1.3: Create iOS Ad Units

Create 3 ad units for iOS:

### Banner Ad Unit (iOS)
1. In your iOS app page, click "**Ad units**" tab
2. Click "**Add ad unit**"
3. Select "**Banner**"
4. Ad unit name: `iOS Banner - ArmProgress`
5. Click "**Create ad unit**"
6. 📝 **Copy the Ad unit ID**: `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`
7. Click "**Done**"

### Interstitial Ad Unit (iOS)
1. Click "**Add ad unit**" again
2. Select "**Interstitial**"
3. Ad unit name: `iOS Interstitial - ArmProgress`
4. Click "**Create ad unit**"
5. 📝 **Copy the Ad unit ID**: `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`
6. Click "**Done**"

### Rewarded Ad Unit (iOS)
1. Click "**Add ad unit**" again
2. Select "**Rewarded**"
3. Ad unit name: `iOS Rewarded - ArmProgress`
4. **Reward:**
   - Item: `Premium Access`
   - Amount: `1`
5. Click "**Create ad unit**"
6. 📝 **Copy the Ad unit ID**: `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`
7. Click "**Done**"

## Step 1.4: Add Your Android App

1. In AdMob dashboard, click "**Apps**" in left menu
2. Click "**Add App**"
3. Select platform: **Android**
4. **Is your app published on Google Play?**
   - If **NO** (for testing): Select "No" → Enter app name: `ArmProgress`
   - If **YES**: Enter your Google Play URL
5. Click "**Next**"
6. **Enable user metrics**: Choose your preference
7. Click "**Add App**"

📝 **Save this**:
```
Android App ID: ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
```

## Step 1.5: Create Android Ad Units

Create 3 ad units for Android:

### Banner Ad Unit (Android)
1. In your Android app page, click "**Ad units**" tab
2. Click "**Add ad unit**"
3. Select "**Banner**"
4. Ad unit name: `Android Banner - ArmProgress`
5. Click "**Create ad unit**"
6. 📝 **Copy the Ad unit ID**: `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`
7. Click "**Done**"

### Interstitial Ad Unit (Android)
1. Click "**Add ad unit**" again
2. Select "**Interstitial**"
3. Ad unit name: `Android Interstitial - ArmProgress`
4. Click "**Create ad unit**"
5. 📝 **Copy the Ad unit ID**: `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`
6. Click "**Done**"

### Rewarded Ad Unit (Android)
1. Click "**Add ad unit**" again
2. Select "**Rewarded**"
3. Ad unit name: `Android Rewarded - ArmProgress`
4. **Reward:**
   - Item: `Premium Access`
   - Amount: `1`
5. Click "**Create ad unit**"
6. 📝 **Copy the Ad unit ID**: `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`
7. Click "**Done**"

## Step 1.6: AdMob Account Settings

1. Click "**Settings**" → "**Account**" → "**Account information**"
2. Fill in your payment information (required for receiving ad revenue)
3. Set up payment method
4. Complete tax information (US: W-9 or W-8BEN)

✅ **AdMob setup complete!** Save all your IDs - you'll add them to `.env` later.

---

# PART 2: RevenueCat Setup (Subscriptions)

## Step 2.1: Create RevenueCat Account

1. Go to **https://www.revenuecat.com/**
2. Click "**Start for free**"
3. Sign up with email or Google
4. Verify your email
5. Complete onboarding survey (optional)

## Step 2.2: Create Your Project

1. Click "**Create new project**"
2. Project name: `ArmProgress`
3. Select your industry: **Health & Fitness**
4. Click "**Create**"

## Step 2.3: Add iOS App

1. In your project, click "**Apps**" in left menu
2. Click "**Add new**"
3. Select platform: **Apple App Store**
4. **Bundle ID**: `com.armprogress.app` (must match your app exactly!)
5. App name: `ArmProgress iOS`
6. Click "**Save**"

📝 **You'll see your iOS API key**: `appl_xxxxxxxxxxxxx`

**Copy and save this key!**

## Step 2.4: Add Android App

1. Click "**Apps**" again
2. Click "**Add new**"
3. Select platform: **Google Play Store**
4. **Package name**: `com.armprogress.app` (must match your app exactly!)
5. App name: `ArmProgress Android`
6. Click "**Save**"

📝 **You'll see your Android API key**: `goog_xxxxxxxxxxxxx`

**Copy and save this key!**

## Step 2.5: Create Entitlement

1. Click "**Entitlements**" in left menu
2. Click "**New**"
3. Identifier: `premium` (MUST be exactly this - your code expects it!)
4. Display name: `Premium Access`
5. Description: `Full access to all premium features`
6. Click "**Save**"

## Step 2.6: Create Products

You need to create product identifiers that you'll use in the App Store and Google Play:

1. Click "**Products**" in left menu
2. Click "**New**"

### Monthly Subscription Product
- Identifier: `premium_monthly`
- Type: **Subscription**
- Display name: `Premium Monthly`
- Description: `Monthly premium subscription`
- Click "**Save**"

### Yearly Subscription Product
- Click "**New**" again
- Identifier: `premium_yearly`
- Type: **Subscription**
- Display name: `Premium Yearly`
- Description: `Yearly premium subscription (Save 33%)`
- Click "**Save**"

### Optional: Lifetime Product
- Click "**New**" again
- Identifier: `premium_lifetime`
- Type: **Non-Consumable**
- Display name: `Premium Lifetime`
- Description: `One-time purchase for lifetime access`
- Click "**Save**"

## Step 2.7: Create Offering

1. Click "**Offerings**" in left menu
2. Click "**New**"
3. Identifier: `default`
4. Description: `Default premium offering`
5. Click "**Save**"

### Add Packages to Offering

1. In your `default` offering, click "**Add Package**"

**Package 1: Monthly**
- Identifier: `monthly`
- Product: Select `premium_monthly`
- Click "**Add**"

**Package 2: Annual**
- Click "**Add Package**" again
- Identifier: `annual`
- Product: Select `premium_yearly`
- Click "**Add**"

**Optional: Lifetime**
- Click "**Add Package**" again
- Identifier: `lifetime`
- Product: Select `premium_lifetime`
- Click "**Add**"

2. Click "**Set as Current**" to make this offering live

✅ **RevenueCat configuration complete!**

---

# PART 3: Create Store Products

Now you need to create the actual subscription products in App Store Connect and Google Play Console.

## Step 3.1: iOS - App Store Connect

### Create App Store App (if not done)

1. Go to **https://appstoreconnect.apple.com/**
2. Click "**My Apps**" → "**+**" → "**New App**"
3. Platform: **iOS**
4. Name: `ArmProgress`
5. Primary Language: **English (U.S.)**
6. Bundle ID: Select `com.armprogress.app`
7. SKU: `armprogress-ios`
8. Click "**Create**"

### Create Subscription Group

1. In your app, click "**Subscriptions**" tab
2. Click "**+**" next to "Subscription Groups"
3. Reference name: `Premium Subscriptions`
4. Click "**Create**"

### Create Monthly Subscription

1. In your subscription group, click "**+**" to add subscription
2. Product ID: `premium_monthly` (MUST match RevenueCat product ID!)
3. Reference name: `Premium Monthly`
4. Click "**Create**"

**Configure Monthly Subscription:**
1. Subscription duration: **1 month**
2. Click "**Add Subscription Pricing**"
3. Select all countries
4. Price: **$9.99** (or your preferred price)
5. Click "**Next**" → "**Create**"

**Localization:**
1. Click "**Create New Localization**"
2. Language: **English (U.S.)**
3. Subscription display name: `Premium Monthly`
4. Description: `Full access to all premium features. Billed monthly.`
5. Click "**Save**"

### Create Yearly Subscription

1. In subscription group, click "**+**" again
2. Product ID: `premium_yearly` (MUST match RevenueCat!)
3. Reference name: `Premium Yearly`
4. Click "**Create**"

**Configure Yearly Subscription:**
1. Subscription duration: **1 year**
2. Click "**Add Subscription Pricing**"
3. Select all countries
4. Price: **$79.99** (or your preferred price)
5. Click "**Next**" → "**Create**"

**Localization:**
1. Click "**Create New Localization**"
2. Language: **English (U.S.)**
3. Subscription display name: `Premium Yearly`
4. Description: `Full access to all premium features. Save 33% vs monthly. Billed yearly.`
5. Click "**Save**"

### Optional: Create Lifetime Purchase

1. Go to "**In-App Purchases**" tab
2. Click "**+**"
3. Type: **Non-Consumable**
4. Click "**Create**"
5. Product ID: `premium_lifetime` (MUST match RevenueCat!)
6. Reference name: `Premium Lifetime`
7. Click "**Create**"

**Configure:**
1. Click "**Add Pricing**"
2. Price: **$149.99**
3. Localization same as above
4. Click "**Save**"

### Submit for Review

1. For each product, click "**Submit for Review**"
2. Screenshot: Upload any screenshot (just for testing)
3. Review notes: "Premium subscription for arm wrestling training app"
4. Click "**Submit**"

✅ **iOS products created!**

## Step 3.2: Android - Google Play Console

### Create Google Play App (if not done)

1. Go to **https://play.google.com/console/**
2. Click "**Create app**"
3. App name: `ArmProgress`
4. Language: **English (United States)**
5. App or game: **App**
6. Free or paid: **Free**
7. Accept declarations
8. Click "**Create app**"

### Create Subscription Group

1. In your app dashboard, go to "**Monetize**" → "**Subscriptions**"
2. Click "**Create subscription**"
3. Product ID: `premium_subscriptions` (group ID)
4. Name: `Premium Subscriptions`
5. Click "**Create**"

### Create Monthly Subscription

1. In subscription group, click "**Add base plan**"
2. Base plan ID: `premium_monthly` (MUST match RevenueCat!)
3. Billing period: **Monthly**
4. Price: **$9.99 USD**
5. Click "**Add price**" for other countries
6. Click "**Activate**"

**Product Details:**
1. Name: `Premium Monthly`
2. Description: `Full access to all premium features. Billed monthly. Cancel anytime.`
3. Click "**Save**"

### Create Yearly Subscription

1. Click "**Add base plan**" again
2. Base plan ID: `premium_yearly` (MUST match RevenueCat!)
3. Billing period: **Yearly**
4. Price: **$79.99 USD**
5. Click "**Add price**" for other countries
6. Click "**Activate**"

**Product Details:**
1. Name: `Premium Yearly`
2. Description: `Full access to all premium features. Save 33% vs monthly. Billed yearly. Cancel anytime.`
3. Click "**Save**"

### Optional: Create Lifetime Product

1. Go to "**Monetize**" → "**In-app products**"
2. Click "**Create product**"
3. Product ID: `premium_lifetime` (MUST match RevenueCat!)
4. Name: `Premium Lifetime`
5. Description: `One-time purchase for lifetime premium access`
6. Price: **$149.99 USD**
7. Click "**Activate**"

✅ **Android products created!**

---

# PART 4: Link RevenueCat to Store Products

## Step 4.1: Link iOS Products

1. In RevenueCat dashboard, go to "**Products**"
2. Click on `premium_monthly`
3. Under "**App Store Configuration**", click "**Add**"
4. Select your iOS app
5. App Store Product ID: `premium_monthly` (the one you created in App Store Connect)
6. Click "**Attach**"
7. Repeat for `premium_yearly` and `premium_lifetime`

## Step 4.2: Link Android Products

1. Click on `premium_monthly` again
2. Under "**Google Play Configuration**", click "**Add**"
3. Select your Android app
4. Google Play Product ID: `premium_monthly` (from Google Play Console)
5. Click "**Attach**"
6. Repeat for `premium_yearly` and `premium_lifetime`

## Step 4.3: Configure iOS Service Credentials

RevenueCat needs access to verify iOS purchases:

1. In RevenueCat, go to "**Project settings**" → "**Integrations**"
2. Find "**Apple App Store**"
3. Click "**Configure**"

**Option A: App Store Connect API Key (Recommended)**
1. In App Store Connect, go to "Users and Access" → "Keys" → "App Store Connect API"
2. Click "**+**" to generate key
3. Name: `RevenueCat`
4. Access: **App Manager**
5. Click "**Generate**"
6. **Download** the `.p8` file (you only get one chance!)
7. Copy the **Key ID** and **Issuer ID**
8. In RevenueCat:
   - Upload the `.p8` file
   - Enter Key ID
   - Enter Issuer ID
9. Click "**Save**"

**Option B: Shared Secret (Legacy)**
1. In App Store Connect, go to your app → "Subscriptions"
2. Click "**Shared Secret**" → "**Generate**"
3. Copy the secret
4. Paste in RevenueCat
5. Click "**Save**"

## Step 4.4: Configure Android Service Credentials

1. In RevenueCat, go to "**Project settings**" → "**Integrations**"
2. Find "**Google Play**"
3. Click "**Configure**"

**Create Service Account:**
1. In Google Play Console, go to "**Setup**" → "**API access**"
2. Click "**Create new service account**"
3. Follow link to Google Cloud Console
4. Click "**Create Service Account**"
5. Name: `RevenueCat`
6. Click "**Create and Continue**"
7. Role: **Service Account User**
8. Click "**Done**"
9. Click on the service account you just created
10. Go to "**Keys**" tab → "**Add Key**" → "**Create new key**"
11. Type: **JSON**
12. Click "**Create**"
13. **Download** the JSON file

**Upload to RevenueCat:**
1. Back in RevenueCat, click "**Choose File**"
2. Upload the JSON file you just downloaded
3. Click "**Save**"

**Grant Permissions:**
1. Back in Google Play Console
2. Under "API access", find your service account
3. Click "**Grant access**"
4. Permissions:
   - **View financial data**: Yes
   - **Manage orders and subscriptions**: Yes
5. Click "**Invite user**"

✅ **RevenueCat fully linked!**

---

# PART 5: Add Keys to Your App

## Step 5.1: Create `.env` File

1. In your project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in your editor

## Step 5.2: Add RevenueCat Keys

```env
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxx
```

Replace with your actual keys from Step 2.3 and 2.4!

## Step 5.3: Add AdMob Keys

```env
# AdMob App IDs
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX

# iOS Ad Units
EXPO_PUBLIC_ADMOB_IOS_BANNER=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_IOS_REWARDED=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY

# Android Ad Units
EXPO_PUBLIC_ADMOB_ANDROID_BANNER=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_ANDROID_REWARDED=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
```

Replace with your actual IDs from Part 1!

## Step 5.4: Verify `.env` File

Your complete `.env` should look like:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# RevenueCat
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxx

# AdMob App IDs
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX

# iOS Ad Units
EXPO_PUBLIC_ADMOB_IOS_BANNER=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_IOS_REWARDED=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY

# Android Ad Units
EXPO_PUBLIC_ADMOB_ANDROID_BANNER=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_ANDROID_REWARDED=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY

# Stripe
EXPO_PUBLIC_STRIPE_DONATION_URL=https://buy.stripe.com/your-link

# App Config
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_APP_SCHEME=armprogress
EXPO_PUBLIC_APP_URL=https://armwrestling.app
```

⚠️ **IMPORTANT**: Never commit `.env` to git! It's already in `.gitignore`.

---

# PART 6: Build and Test

## Step 6.1: Prebuild with Native Code

```bash
npx expo prebuild --clean
```

This generates native iOS and Android projects with all your configurations.

## Step 6.2: Test on iOS

### Create Sandbox Tester

1. Go to **App Store Connect** → "**Users and Access**" → "**Sandbox Testers**"
2. Click "**+**"
3. Email: Use a unique email (can be fake like `test@example.com`)
4. Password: Create a password
5. Click "**Save**"

### Build and Test

```bash
# Build for iOS
npx expo run:ios

# Or for device
npx expo run:ios --device
```

**Test RevenueCat:**
1. Go to Profile → Upgrade to Premium
2. You should see your offerings
3. Try to purchase (use sandbox account when prompted)
4. Verify premium status updates

**Test AdMob:**
1. Banner ads should show on main screens
2. Verify they say "TEST AD" in dev mode
3. After going premium, ads should hide

## Step 6.3: Test on Android

### Create Test Account

1. Go to **Google Play Console** → "**Setup**" → "**License testing**"
2. Add your Google account email
3. License test response: **RESPOND_NORMALLY**
4. Click "**Save**"

### Build and Test

```bash
# Build for Android
npx expo run:android

# Or for device
npx expo run:android --device
```

Test same flow as iOS.

## Step 6.4: Production Build

When ready for production:

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

---

# 🎉 You're Done!

## What You've Accomplished

✅ AdMob fully configured with test and production ads
✅ RevenueCat fully configured with subscriptions
✅ Store products created and linked
✅ Service credentials set up
✅ API keys added to your app
✅ Ready to monetize!

## Next Steps

1. **Test thoroughly** with sandbox accounts
2. **Submit apps** to App Store and Google Play
3. **Monitor** RevenueCat dashboard for subscription metrics
4. **Monitor** AdMob dashboard for ad revenue
5. **Optimize** based on data

## Support Resources

**AdMob:**
- Dashboard: https://apps.admob.com/
- Support: https://support.google.com/admob

**RevenueCat:**
- Dashboard: https://app.revenuecat.com/
- Docs: https://docs.revenuecat.com/
- Community: https://community.revenuecat.com/

**App Stores:**
- App Store Connect: https://appstoreconnect.apple.com/
- Google Play Console: https://play.google.com/console/

---

## Troubleshooting

### "No offerings found"
- Verify API keys are correct in `.env`
- Check offering is set as "Current" in RevenueCat
- Rebuild app: `npx expo prebuild --clean`

### "Purchase failed"
- Verify product IDs match exactly between RevenueCat and stores
- Check service credentials are configured
- Use correct sandbox account

### "Ads not showing"
- In development: Test ads should work automatically
- In production: Verify ad unit IDs in `.env`
- AdMob needs app approval (can take 24-48 hours after first build)

### "Premium not activating"
- Check entitlement ID is exactly `premium` in RevenueCat
- Verify products are attached to offering
- Check customer info in RevenueCat dashboard

---

**Congratulations!** Your app is now fully configured for monetization! 🚀💰
