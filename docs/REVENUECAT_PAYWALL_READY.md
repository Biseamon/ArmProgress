# RevenueCat Paywall - Production Ready Guide

## ✅ SDK Requirements Met

Your app is **fully ready** to serve paywalls built through the RevenueCat dashboard!

### Current Setup
- ✅ **react-native-purchases**: `9.6.4` (Required: `8.11.3+`)
- ✅ **react-native-purchases-ui**: `Installed` (For dashboard paywalls)
- ✅ **app.json**: Plugin configured
- ✅ **Paywall Screen**: Supports both custom and dashboard paywalls
- ✅ **RevenueCat Context**: Properly initialized with user ID
- ✅ **Premium Logic**: Already integrated throughout the app

## 🎯 What's Been Done

### 1. Plugin Configuration
Added the RevenueCat plugin to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-purchases",
        {
          "enableAmazon": false
        }
      ]
    ]
  }
}
```

### 2. RevenueCat UI Integration
- Installed `react-native-purchases-ui` package
- Updated `app/paywall.tsx` to support dashboard-built paywalls
- Added automatic detection of dashboard paywalls
- Added manual trigger button for testing

### 3. Smart Paywall Detection
The app now:
- Checks if a paywall is configured in your RevenueCat dashboard
- Automatically presents the dashboard paywall if available
- Falls back to the custom paywall if no dashboard paywall exists
- Shows a "View Dashboard Paywall" button for testing (only when paywall is configured)

## 📋 Next Steps to Complete Setup

### Step 1: Add API Keys to Environment
Create or update your `.env` file:

```bash
# RevenueCat API Keys (get from https://app.revenuecat.com/settings/api-keys)
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxx

# Your existing Supabase keys
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**Where to get API keys:**
1. Go to https://app.revenuecat.com
2. Navigate to: **Project Settings → API Keys**
3. Copy your iOS and Android API keys
4. Paste them into your `.env` file

### Step 2: Configure Products in RevenueCat

1. **Create an Entitlement**
   - Go to: **Dashboard → Entitlements**
   - Click **+ New**
   - Name it: `premium`
   - Save

2. **Create Products**
   - Go to: **Dashboard → Products**
   - Add your products:
     - Monthly: `premium_monthly` → $9.99/month
     - Yearly: `premium_yearly` → $79.99/year
     - Lifetime: `premium_lifetime` → $149.99 one-time

3. **Create an Offering**
   - Go to: **Dashboard → Offerings**
   - Click **+ New Offering**
   - Set as "Default" offering
   - Add your products to this offering
   - Attach the `premium` entitlement
   - Save

### Step 3: Design Your Paywall (Dashboard Editor)

1. **Navigate to Paywalls**
   - Go to: **Dashboard → Paywalls**
   - Click **+ New Paywall**

2. **Choose Your Offering**
   - Select the offering you created (e.g., "Default")

3. **Design Your Paywall**
   - Choose a template or start from scratch
   - Customize colors, text, and layout
   - Add your premium features
   - Preview on different devices

4. **Publish**
   - Click **Publish** when ready
   - Your paywall is now live!

### Step 4: Configure App Store Products

#### iOS (App Store Connect)
1. Go to https://appstoreconnect.apple.com
2. Select your app
3. Navigate to: **Features → In-App Purchases**
4. Create products matching your RevenueCat IDs:
   - `premium_monthly` → Auto-Renewable Subscription
   - `premium_yearly` → Auto-Renewable Subscription
   - `premium_lifetime` → Non-Consumable

#### Android (Google Play Console)
1. Go to https://play.google.com/console
2. Select your app
3. Navigate to: **Monetize → Subscriptions**
4. Create products matching your RevenueCat IDs

### Step 5: Link Products in RevenueCat

1. Go back to RevenueCat Dashboard
2. Navigate to: **Products**
3. For each product, add the store identifiers:
   - **App Store ID**: Product ID from App Store Connect
   - **Play Store ID**: Product ID from Google Play Console
4. Save

### Step 6: Rebuild Your App

Since we added a native plugin, you need to rebuild:

```bash
# For development
npx expo prebuild --clean
npx expo run:ios    # or run:android

# For production
eas build --platform ios
eas build --platform android
```

## 🧪 Testing Your Paywall

### Test Dashboard Paywall
1. Open your app
2. Navigate to Profile → Upgrade to Premium
3. If a dashboard paywall is configured, you'll see a "View Dashboard Paywall" button
4. Click it to see your dashboard-built paywall

### Test Purchases
- **iOS**: Use sandbox test user from App Store Connect
- **Android**: Use test track and test user from Google Play Console
- RevenueCat provides test mode for development

### Testing Tips
- Use the RevenueCat iOS app to preview paywalls
- Override offerings for specific users in the dashboard
- Create targeting rules for internal builds
- Test in both light and dark mode

## 🎨 How It Works Now

### Automatic Detection
```typescript
// The app checks if a dashboard paywall exists
if (offerings?.paywall) {
  // Use RevenueCat dashboard paywall
  RevenueCatUI.presentPaywall({ 
    requiredEntitlementIdentifier: 'premium' 
  });
} else {
  // Use custom paywall
  // Show your custom UI
}
```

### Manual Override
You can always test the dashboard paywall by clicking the "View Dashboard Paywall" button that appears when a paywall is configured.

## 📱 What Users Will See

### Before Configuring Dashboard Paywall
- Users see your **custom paywall** (current beautiful UI)
- Purchase flow works through your custom UI

### After Configuring Dashboard Paywall
- Users see the **dashboard paywall** automatically
- Purchases work through RevenueCat UI
- No app update required to change paywall design!

### Benefits of Dashboard Paywalls
- ✅ A/B test different designs without app updates
- ✅ Change pricing displays remotely
- ✅ Target different paywalls to different users
- ✅ Update marketing copy instantly
- ✅ Test multiple paywall templates
- ✅ View analytics on paywall performance

## 🔒 Security Checklist

- ✅ API keys in `.env` file (not committed to git)
- ✅ `.env` is in `.gitignore`
- ✅ Use production API keys in production builds
- ✅ Use test API keys in development
- ✅ Server-side receipt validation (RevenueCat handles this)

## 📊 Monitoring

### RevenueCat Dashboard
Monitor in real-time:
- Active subscriptions
- Revenue
- Churn rate
- Trial conversions
- Paywall conversion rates

### Webhooks (Optional)
Set up webhooks to sync premium status with Supabase:
1. Go to: **Dashboard → Integrations → Webhooks**
2. Add your backend URL
3. Handle events: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`

## 🚀 Going to Production

### Pre-Launch Checklist
- [ ] API keys configured in production build
- [ ] Products created in App Store Connect
- [ ] Products created in Google Play Console
- [ ] Products linked in RevenueCat
- [ ] Entitlement configured (`premium`)
- [ ] Offering created and set as default
- [ ] Paywall designed and published (optional)
- [ ] Test purchases completed successfully
- [ ] Restore purchases tested
- [ ] Privacy policy and terms linked
- [ ] App Store/Play Store subscription details filled

### Launch Tips
1. **Start with a soft launch** to test with real users
2. **Monitor RevenueCat dashboard** for issues
3. **Test restore purchases** thoroughly
4. **Provide support** for purchase issues
5. **Comply with store guidelines** for subscription apps

## 🆘 Troubleshooting

### "No offerings found"
- Check API keys are correct
- Verify offering is set as "Current"
- Check app bundle ID matches RevenueCat project
- Wait a few minutes for cache to clear

### "Purchase failed"
- Verify products exist in App Store/Play Store
- Check product IDs match exactly
- Ensure app is signed correctly
- Test with sandbox/test account

### "Paywall not showing"
- Verify paywall is published in dashboard
- Check offering has a paywall attached
- Ensure SDK version is compatible (you're good at 9.6.4)
- Check Platform.OS !== 'web' (paywalls don't work on web)

### "Premium status not updating"
- Check entitlement ID is exactly `premium`
- Call `refreshCustomerInfo()` after purchase
- Verify Supabase profile is updated
- Check AuthContext `isPremium` logic

## 📚 Resources

- **RevenueCat Docs**: https://docs.revenuecat.com
- **Paywall Editor Guide**: https://www.revenuecat.com/docs/tools/paywalls
- **Expo Integration**: https://www.revenuecat.com/docs/getting-started/installation/expo
- **Community Forum**: https://community.revenuecat.com

## ✨ Your Current Implementation

### Files Modified
1. ✅ `app.json` - Added RevenueCat plugin
2. ✅ `app/paywall.tsx` - Added dashboard paywall support
3. ✅ `package.json` - Added `react-native-purchases-ui`

### Existing Files (Already Working)
- ✅ `lib/revenueCat.ts` - Core RevenueCat functions
- ✅ `contexts/RevenueCatContext.tsx` - Context provider
- ✅ `contexts/AuthContext.tsx` - Premium status logic
- ✅ `app/_layout.tsx` - RevenueCat initialized on app start

## 🎉 You're Ready!

Your app is **fully prepared** to serve paywalls from the RevenueCat dashboard. Just complete the setup steps above and you'll be able to:

1. **Design beautiful paywalls** in the dashboard
2. **Update them remotely** without app updates
3. **A/B test** different designs
4. **Target specific users** with different paywalls
5. **Monitor performance** in real-time

No more app updates needed for paywall changes! 🚀

