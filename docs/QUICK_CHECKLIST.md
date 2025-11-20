# ✅ External Setup Checklist

Use this as a quick reference while following `EXTERNAL_SETUP_GUIDE.md`

---

## PART 1: AdMob Setup (30-45 min)

### Create Account
- [ ] Sign up at https://apps.admob.com/
- [ ] Complete account info
- [ ] Set up payment info

### iOS App
- [ ] Add iOS app to AdMob
- [ ] 📝 Save iOS App ID: `_________________________`
- [ ] Create banner ad unit
  - [ ] 📝 Save ID: `_________________________`
- [ ] Create interstitial ad unit
  - [ ] 📝 Save ID: `_________________________`
- [ ] Create rewarded ad unit
  - [ ] 📝 Save ID: `_________________________`

### Android App
- [ ] Add Android app to AdMob
- [ ] 📝 Save Android App ID: `_________________________`
- [ ] Create banner ad unit
  - [ ] 📝 Save ID: `_________________________`
- [ ] Create interstitial ad unit
  - [ ] 📝 Save ID: `_________________________`
- [ ] Create rewarded ad unit
  - [ ] 📝 Save ID: `_________________________`

---

## PART 2: RevenueCat Setup (45-60 min)

### Create Account
- [ ] Sign up at https://www.revenuecat.com/
- [ ] Create project: `ArmProgress`

### Add Apps
- [ ] Add iOS app (Bundle ID: `com.armprogress.app`)
  - [ ] 📝 Save iOS API Key: `_________________________`
- [ ] Add Android app (Package: `com.armprogress.app`)
  - [ ] 📝 Save Android API Key: `_________________________`

### Configure Products
- [ ] Create entitlement: `premium`
- [ ] Create product: `premium_monthly`
- [ ] Create product: `premium_yearly`
- [ ] Create product: `premium_lifetime` (optional)
- [ ] Create offering: `default`
- [ ] Add packages to offering
- [ ] Set offering as "Current"

---

## PART 3: App Store Connect (30-45 min)

### Create App
- [ ] Create app in App Store Connect
- [ ] Bundle ID: `com.armprogress.app`

### Create Subscriptions
- [ ] Create subscription group: `Premium Subscriptions`
- [ ] Create subscription: `premium_monthly`
  - [ ] Price: $9.99/month
  - [ ] Add localization
  - [ ] Submit for review
- [ ] Create subscription: `premium_yearly`
  - [ ] Price: $79.99/year
  - [ ] Add localization
  - [ ] Submit for review
- [ ] Create IAP: `premium_lifetime` (optional)
  - [ ] Price: $149.99
  - [ ] Submit for review

### Create Test Account
- [ ] Create sandbox tester
- [ ] 📝 Save test email: `_________________________`
- [ ] 📝 Save test password: `_________________________`

---

## PART 4: Google Play Console (30-45 min)

### Create App
- [ ] Create app in Google Play Console
- [ ] Package name: `com.armprogress.app`

### Create Subscriptions
- [ ] Create subscription: `premium_monthly`
  - [ ] Price: $9.99/month
  - [ ] Activate
- [ ] Create subscription: `premium_yearly`
  - [ ] Price: $79.99/year
  - [ ] Activate
- [ ] Create IAP: `premium_lifetime` (optional)
  - [ ] Price: $149.99
  - [ ] Activate

### Create Test Account
- [ ] Add test account in License Testing
- [ ] 📝 Save test email: `_________________________`

---

## PART 5: Link RevenueCat (20-30 min)

### Link Products
- [ ] Link `premium_monthly` to iOS
- [ ] Link `premium_yearly` to iOS
- [ ] Link `premium_lifetime` to iOS (optional)
- [ ] Link `premium_monthly` to Android
- [ ] Link `premium_yearly` to Android
- [ ] Link `premium_lifetime` to Android (optional)

### iOS Service Credentials
- [ ] Create App Store Connect API Key
- [ ] Download `.p8` file
- [ ] Upload to RevenueCat
- [ ] Enter Key ID and Issuer ID

### Android Service Credentials
- [ ] Create service account in Google Play
- [ ] Download JSON file
- [ ] Upload to RevenueCat
- [ ] Grant permissions in Google Play

---

## PART 6: Add Keys to App (5 min)

- [ ] Copy `.env.example` to `.env`
- [ ] Add RevenueCat iOS key
- [ ] Add RevenueCat Android key
- [ ] Add AdMob iOS App ID
- [ ] Add AdMob Android App ID
- [ ] Add AdMob iOS banner ID
- [ ] Add AdMob iOS interstitial ID
- [ ] Add AdMob iOS rewarded ID
- [ ] Add AdMob Android banner ID
- [ ] Add AdMob Android interstitial ID
- [ ] Add AdMob Android rewarded ID
- [ ] Save `.env` file
- [ ] Verify `.env` is in `.gitignore`

---

## PART 7: Build and Test (15-30 min)

### Prebuild
- [ ] Run: `npx expo prebuild --clean`

### Test iOS
- [ ] Run: `npx expo run:ios`
- [ ] Test banner ads appear (with "TEST AD" label)
- [ ] Go to Profile → Upgrade to Premium
- [ ] See RevenueCat offerings
- [ ] Test purchase with sandbox account
- [ ] Verify premium status updates
- [ ] Verify ads disappear

### Test Android
- [ ] Run: `npx expo run:android`
- [ ] Test banner ads appear
- [ ] Test RevenueCat purchase
- [ ] Verify premium status
- [ ] Verify ads disappear

---

## ✅ Completion Checklist

When everything is working:

- [ ] AdMob test ads showing in dev mode
- [ ] RevenueCat offerings loading
- [ ] Can purchase with sandbox account
- [ ] Premium status updates correctly
- [ ] Ads hide for premium users
- [ ] Restore purchases works
- [ ] All API keys added to `.env`
- [ ] `.env` not committed to git
- [ ] Ready for production build!

---

## 📝 Your Configuration Summary

**AdMob IDs:**
```
iOS App ID: _________________________
iOS Banner: _________________________
iOS Interstitial: _________________________
iOS Rewarded: _________________________

Android App ID: _________________________
Android Banner: _________________________
Android Interstitial: _________________________
Android Rewarded: _________________________
```

**RevenueCat Keys:**
```
iOS API Key: _________________________
Android API Key: _________________________
```

**Product IDs (must match everywhere):**
- `premium_monthly` ✓
- `premium_yearly` ✓
- `premium_lifetime` ✓

**Entitlement ID:**
- `premium` ✓ (hardcoded in app)

---

## 🆘 Having Issues?

See detailed troubleshooting in:
- `docs/EXTERNAL_SETUP_GUIDE.md` (full guide)
- `docs/SETUP_STATUS.md` (status and what's done)

**Common Issues:**

❌ **No offerings found**
→ Check API keys, offering set as "Current", rebuild app

❌ **Purchase failed**
→ Verify product IDs match exactly, check service credentials

❌ **Ads not showing**
→ Dev mode uses test ads (works automatically), production needs approval

❌ **Premium not activating**
→ Check entitlement ID is exactly `premium`, products attached to offering

---

**Print this and check off items as you complete them!** ✓
