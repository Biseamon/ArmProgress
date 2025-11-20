# 💰 Monetization Setup - Master Guide

Your app is **100% code-ready** for both AdMob (ads) and RevenueCat (subscriptions). This README helps you navigate the setup documentation.

---

## 🎯 Start Here

### For External Setup (What You Need to Do)

📖 **[EXTERNAL_SETUP_GUIDE.md](EXTERNAL_SETUP_GUIDE.md)** ← **START HERE**
- Complete step-by-step guide for external setup
- AdMob account, app, and ad unit creation
- RevenueCat account and product configuration
- App Store Connect and Google Play Console setup
- Linking everything together
- Adding API keys to your app
- Testing instructions

**Time: 3-4 hours** | **Difficulty: Easy** | **Follow step-by-step**

---

## 📋 Quick Reference

### Checklist Format

📋 **[QUICK_CHECKLIST.md](QUICK_CHECKLIST.md)**
- Printable checklist format
- Check off items as you complete them
- Quick reference for IDs and keys
- Troubleshooting tips

**Print this and follow along!**

---

### Status Overview

📊 **[SETUP_STATUS.md](SETUP_STATUS.md)**
- What's done vs. what you need to do
- Current implementation status
- Package versions
- Configuration state
- Quick summary

**Read this first to understand what's ready**

---

## 📚 Technical Documentation

### AdMob (Advertisements)

**Implementation:**
- 📖 [ADMOB_IMPLEMENTATION_SUMMARY.md](ADMOB_IMPLEMENTATION_SUMMARY.md) - Complete implementation details
- 📖 [ADMOB_QUICK_START.md](ADMOB_QUICK_START.md) - Quick start for testing
- 📖 [ADMOB_INTEGRATION.md](ADMOB_INTEGRATION.md) - Full technical reference

**What's Implemented:**
- ✅ Banner ads on all main screens
- ✅ Interstitial ad hook (`useAdInterstitial()`)
- ✅ Rewarded ad hook (`useAdRewarded()`)
- ✅ Automatic test/production switching
- ✅ Premium user detection
- ✅ SDK v16.0.0 installed

### RevenueCat (Subscriptions)

**Implementation:**
- 📖 [REVENUECAT_STATUS.md](REVENUECAT_STATUS.md) - Current status and capabilities
- 📖 [REVENUECAT_PAYWALL_READY.md](REVENUECAT_PAYWALL_READY.md) - Dashboard paywall setup
- 📖 [REVENUECAT_SETUP.md](REVENUECAT_SETUP.md) - Integration guide

**What's Implemented:**
- ✅ SDK v9.6.4 installed
- ✅ UI SDK for dashboard paywalls
- ✅ Purchase flow
- ✅ Restore purchases
- ✅ Premium status sync with Supabase
- ✅ Customer info tracking

---

## 🚀 Quick Start Guide

### 1. Understand What's Done
Read: **[SETUP_STATUS.md](SETUP_STATUS.md)** (5 min)

### 2. Do External Setup
Follow: **[EXTERNAL_SETUP_GUIDE.md](EXTERNAL_SETUP_GUIDE.md)** (3-4 hours)

### 3. Add Keys and Build
```bash
# Copy environment template
cp .env.example .env

# Add your keys to .env (see EXTERNAL_SETUP_GUIDE.md Part 5)
# Then build:
npx expo prebuild --clean
npx expo run:ios    # or run:android
```

### 4. Test
- Banner ads should show (with "TEST AD" in dev)
- Profile → Upgrade to Premium → See offerings
- Try purchase with sandbox account
- Verify premium status updates
- Verify ads hide for premium users

---

## 📦 What's Installed

### NPM Packages
```json
{
  "react-native-google-mobile-ads": "^16.0.0",
  "react-native-purchases": "^9.6.4",
  "react-native-purchases-ui": "^9.6.5"
}
```

### App Configuration
- `app.config.js` - AdMob App IDs, RevenueCat plugin
- `lib/config.ts` - Environment variable loader
- `.env.example` - Template with all required variables

---

## 🗂️ File Structure

### AdMob Files
```
components/
  ├── AdBanner.tsx          - Banner ad component
  ├── AdInterstitial.tsx    - Interstitial hook
  └── AdRewarded.tsx        - Rewarded ad hook
```

### RevenueCat Files
```
contexts/
  └── RevenueCatContext.tsx - RevenueCat provider
lib/
  └── revenueCat.ts        - RevenueCat utilities
app/
  └── paywall.tsx          - Paywall screen
```

### Configuration
```
app.config.js              - App-level config
lib/config.ts              - Config loader
.env                       - Your API keys (git-ignored)
.env.example              - Template
```

---

## 🎮 Testing

### Development (Test Ads)
AdMob uses Google's test ad units automatically in dev mode:
- Banner: `ca-app-pub-3940256099942544/2934735716` (iOS)
- Banner: `ca-app-pub-3940256099942544/6300978111` (Android)

**No setup needed - works out of the box!**

### Production (Real Ads)
Add your production ad unit IDs to `.env`:
```env
EXPO_PUBLIC_ADMOB_IOS_BANNER=ca-app-pub-XXXXX/YYYYY
EXPO_PUBLIC_ADMOB_ANDROID_BANNER=ca-app-pub-XXXXX/YYYYY
```

App automatically switches when not in `__DEV__` mode.

### RevenueCat Testing
Requires sandbox accounts:
- **iOS**: App Store Connect → Sandbox Testers
- **Android**: Google Play Console → License Testing

See [EXTERNAL_SETUP_GUIDE.md](EXTERNAL_SETUP_GUIDE.md) Part 6 for details.

---

## 🔑 Required Environment Variables

### Minimum (.env file)
```env
# Supabase (already have)
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...

# RevenueCat (need to add)
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxx
```

### Full Production (.env file)
```env
# Add AdMob for production
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-XXXXX~XXXXX
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-XXXXX~XXXXX
EXPO_PUBLIC_ADMOB_IOS_BANNER=ca-app-pub-XXXXX/YYYYY
EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL=ca-app-pub-XXXXX/YYYYY
EXPO_PUBLIC_ADMOB_IOS_REWARDED=ca-app-pub-XXXXX/YYYYY
EXPO_PUBLIC_ADMOB_ANDROID_BANNER=ca-app-pub-XXXXX/YYYYY
EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL=ca-app-pub-XXXXX/YYYYY
EXPO_PUBLIC_ADMOB_ANDROID_REWARDED=ca-app-pub-XXXXX/YYYYY
```

---

## ✅ Verification Checklist

### Code Implementation
- [x] AdMob SDK installed and configured
- [x] RevenueCat SDK installed and configured
- [x] RevenueCat UI installed for dashboard paywalls
- [x] RevenueCat plugin in app.config.js
- [x] Banner ads on main screens
- [x] Interstitial and rewarded ad hooks
- [x] Purchase flow implemented
- [x] Restore purchases implemented
- [x] Premium status tracking
- [x] Automatic test/production switching
- [x] Environment variable setup

### External Setup (Your To-Do)
- [ ] AdMob account created
- [ ] AdMob apps and ad units created
- [ ] RevenueCat account created
- [ ] RevenueCat products and offering configured
- [ ] App Store Connect products created
- [ ] Google Play Console products created
- [ ] Service credentials configured
- [ ] API keys added to `.env`

---

## 🆘 Support

### Documentation Index
| Topic | File | Purpose |
|-------|------|---------|
| **Main Guide** | [EXTERNAL_SETUP_GUIDE.md](EXTERNAL_SETUP_GUIDE.md) | Complete setup walkthrough |
| **Checklist** | [QUICK_CHECKLIST.md](QUICK_CHECKLIST.md) | Printable checklist |
| **Status** | [SETUP_STATUS.md](SETUP_STATUS.md) | What's done vs to-do |
| **AdMob** | [ADMOB_IMPLEMENTATION_SUMMARY.md](ADMOB_IMPLEMENTATION_SUMMARY.md) | AdMob implementation |
| **RevenueCat** | [REVENUECAT_STATUS.md](REVENUECAT_STATUS.md) | RevenueCat status |

### External Resources
- **AdMob**: https://apps.admob.com/
- **RevenueCat**: https://app.revenuecat.com/
- **App Store Connect**: https://appstoreconnect.apple.com/
- **Google Play Console**: https://play.google.com/console/

### Common Issues
See troubleshooting sections in:
- [EXTERNAL_SETUP_GUIDE.md](EXTERNAL_SETUP_GUIDE.md) - End of document
- [QUICK_CHECKLIST.md](QUICK_CHECKLIST.md) - "Having Issues?" section

---

## 🎉 Summary

**Your app code is production-ready!**

All you need to do:
1. Read [SETUP_STATUS.md](SETUP_STATUS.md) to understand what's ready
2. Follow [EXTERNAL_SETUP_GUIDE.md](EXTERNAL_SETUP_GUIDE.md) step-by-step
3. Use [QUICK_CHECKLIST.md](QUICK_CHECKLIST.md) to track progress
4. Add API keys to `.env`
5. Build and test
6. Deploy! 🚀

**Total time: 3-4 hours for complete setup**

---

**Questions?** Read the detailed guides linked above. Everything is documented!
