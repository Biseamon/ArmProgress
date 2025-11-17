# RevenueCat Paywall - Quick Start Checklist ✅

## ✅ Already Done

- [x] **SDK Version**: react-native-purchases `9.6.4` (Required: 8.11.3+)
- [x] **UI Package**: react-native-purchases-ui installed
- [x] **Plugin**: Added to app.json
- [x] **Code**: Paywall screen supports dashboard paywalls
- [x] **Context**: RevenueCat initialized with user ID

## 📝 Your To-Do List

### 1. Add API Keys (5 minutes)
```bash
# Add to .env file
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxx
```

**Get keys from**: https://app.revenuecat.com/settings/api-keys

---

### 2. RevenueCat Dashboard Setup (15 minutes)

#### Create Entitlement
1. Go to: **Dashboard → Entitlements**
2. Click **+ New**
3. Name: `premium`
4. Save

#### Create Products
1. Go to: **Dashboard → Products**
2. Add:
   - `premium_monthly` → $9.99/month
   - `premium_yearly` → $79.99/year
   - `premium_lifetime` → $149.99 one-time

#### Create Offering
1. Go to: **Dashboard → Offerings**
2. Click **+ New Offering**
3. Set as "Current/Default"
4. Add your 3 products
5. Attach `premium` entitlement
6. Save

---

### 3. Design Paywall (10 minutes)
1. Go to: **Dashboard → Paywalls**
2. Click **+ New Paywall**
3. Select your offering
4. Choose a template
5. Customize design
6. **Publish**

---

### 4. App Store Connect (iOS) (20 minutes)
1. Go to: https://appstoreconnect.apple.com
2. Your app → **Features → In-App Purchases**
3. Create 3 subscriptions:
   - `premium_monthly` → Auto-Renewable
   - `premium_yearly` → Auto-Renewable
   - `premium_lifetime` → Non-Consumable
4. Set prices, descriptions, localization

---

### 5. Google Play Console (Android) (20 minutes)
1. Go to: https://play.google.com/console
2. Your app → **Monetize → Subscriptions**
3. Create same 3 products
4. Match IDs exactly with iOS

---

### 6. Link Store Products (5 minutes)
1. Back to RevenueCat: **Dashboard → Products**
2. For each product:
   - Add App Store ID (from Apple)
   - Add Play Store ID (from Google)
3. Save

---

### 7. Rebuild App (10 minutes)
```bash
# Clean and rebuild (required for new plugin)
npx expo prebuild --clean
npx expo run:ios    # or run:android
```

---

### 8. Test (10 minutes)
1. Open app → Profile → Upgrade to Premium
2. Click "View Dashboard Paywall" button
3. See your designed paywall
4. Test purchase with sandbox account

---

## 🎯 Quick Reference

| Task | Time | Priority |
|------|------|----------|
| Add API keys | 5 min | 🔴 Critical |
| RevenueCat setup | 15 min | 🔴 Critical |
| Design paywall | 10 min | 🟡 Optional |
| iOS products | 20 min | 🔴 Critical |
| Android products | 20 min | 🔴 Critical |
| Link products | 5 min | 🔴 Critical |
| Rebuild app | 10 min | 🔴 Critical |
| Test | 10 min | 🟢 Verify |

**Total time**: ~1.5 hours (first time)

---

## 🚨 Common Mistakes

❌ **Product IDs don't match** exactly between stores and RevenueCat  
✅ **Solution**: Double-check spelling and case

❌ **Forgot to set offering as "Current"**  
✅ **Solution**: Go to Offerings, click "Set as Current"

❌ **API keys not in .env file**  
✅ **Solution**: Add them and rebuild

❌ **Didn't rebuild after adding plugin**  
✅ **Solution**: Run `npx expo prebuild --clean`

❌ **Testing on web (paywalls don't work on web)**  
✅ **Solution**: Test on iOS simulator or Android emulator

---

## 🎉 Done? You Should See...

### In Your App
- "View Dashboard Paywall" button appears
- Clicking it shows your designed paywall
- Purchase flow works end-to-end
- Premium status updates after purchase

### In RevenueCat Dashboard
- Real-time subscription data
- Revenue charts
- Active subscribers count
- Conversion rates

---

## 📞 Need Help?

- **Full Guide**: See `REVENUECAT_PAYWALL_READY.md`
- **RevenueCat Docs**: https://docs.revenuecat.com
- **Community**: https://community.revenuecat.com

---

## 🔄 Update Your Paywall Anytime

The beauty of dashboard paywalls:
1. Edit design in RevenueCat dashboard
2. Click "Publish"
3. **No app update needed** - changes go live instantly!

Perfect for:
- A/B testing different designs
- Changing pricing displays
- Updating marketing copy
- Seasonal promotions
- Different paywalls per user segment

---

**Status**: Your app is **READY** for RevenueCat dashboard paywalls! 🚀  
**SDK**: ✅ Compatible (9.6.4 > 8.11.3)  
**Code**: ✅ Integrated  
**Next**: Follow the checklist above ☝️

