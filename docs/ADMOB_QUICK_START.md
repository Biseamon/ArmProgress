# AdMob Quick Start

Your app now has **fully functional AdMob integration** with automatic test/production ad switching using the official **react-native-google-mobile-ads** package! 🎉

## What's Working Right Now

✅ **Banner Ads** - Already displayed on:
  - Home screen
  - Progress screen
  - Calendar screen  
  - Training screen

✅ **Test Ads** - In development mode, Google test ads load automatically

✅ **Premium Handling** - Ads automatically hide for premium users

✅ **Platform Support** - Works on iOS and Android (placeholder on web)

✅ **Error Handling** - Gracefully handles ad loading failures

## Testing Now (Development Mode)

1. Run your app:
   ```bash
   npm run dev
   ```

2. You'll see banner ads with "TEST AD - Development Mode" label

3. Test ads are safe to click - they won't affect your AdMob account

4. Check console logs for ad loading status

## Going to Production

When you're ready to show real ads and earn revenue:

### Step 1: Get AdMob Account (5 minutes)

1. Go to [AdMob Console](https://apps.admob.com/)
2. Sign up/login with Google account
3. Click "Apps" → "Add App"
4. Create apps for iOS and Android
5. Save your **App IDs** (format: `ca-app-pub-XXXXXXXXXXXXX~YYYYYYYYYY`)

### Step 2: Create Ad Units (5 minutes)

For each app (iOS and Android), create these ad units:

**Banner Ad Unit:**
- Type: Banner
- Size: 320x50 (Standard)

**Interstitial Ad Unit:**
- Type: Interstitial

**Rewarded Ad Unit:**
- Type: Rewarded

Save all 6 ad unit IDs (format: `ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY`)

### Step 3: Configure Your App (2 minutes)

1. **Add to `.env` file:**

```env
# iOS
EXPO_PUBLIC_ADMOB_IOS_BANNER=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_IOS_REWARDED=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY

# Android
EXPO_PUBLIC_ADMOB_ANDROID_BANNER=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
EXPO_PUBLIC_ADMOB_ANDROID_REWARDED=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
```

2. **Update `app.config.js`:**

Uncomment and add your App IDs:

```javascript
ios: {
  config: {
    googleMobileAdsAppId: "ca-app-pub-XXXXXXXXXXXXX~YYYYYYYYYY"
  }
},
android: {
  config: {
    googleMobileAdsAppId: "ca-app-pub-XXXXXXXXXXXXX~YYYYYYYYYY"
  }
}
```

### Step 4: Build & Test (10 minutes)

```bash
# Build release version
expo build:ios --release-channel production
expo build:android --release-channel production
```

Install on device and verify real ads appear.

## Using Different Ad Types

### Banner Ads (Already Working)

```tsx
import { AdBanner } from '@/components/AdBanner';

<AdBanner />
```

### Interstitial Ads (Full Screen)

```tsx
import { useAdInterstitial } from '@/components/AdInterstitial';

const { showInterstitial, isReady } = useAdInterstitial();

// Show ad after workout complete
if (isReady) {
  await showInterstitial();
}
```

### Rewarded Ads (Video with Reward)

```tsx
import { useAdRewarded } from '@/components/AdRewarded';

const { showRewardedAd, isReady } = useAdRewarded({
  onRewardEarned: (reward) => {
    // Give user their reward!
    console.log('Reward earned:', reward);
  }
});

// Show ad when user clicks "Watch for Reward"
if (isReady) {
  await showRewardedAd();
}
```

## Key Features

🔄 **Automatic Switching:**
- Development: Uses Google test ads
- Production: Uses your real ad unit IDs
- No code changes needed!

🎯 **Smart Handling:**
- Hides for premium users automatically
- Web shows placeholder
- Graceful error handling
- Console logging in dev mode

📱 **All Ad Types:**
- Banner (320x50)
- Interstitial (full screen)
- Rewarded (video)

## Revenue Tips

1. **Don't overdo it**: Respect your users
2. **Strategic placement**: Between natural breaks
3. **Offer premium**: Always give option to remove ads
4. **Value rewards**: Make rewarded ads worth watching
5. **Never click your own ads**: Seriously, don't!

## Documentation

- 📘 [Full Integration Guide](./ADMOB_INTEGRATION.md) - Complete documentation
- 📝 [Code Examples](../components/ads/AdExamples.tsx) - Usage examples
- ⚙️ [Configuration](../lib/config.ts) - AdMob config

## Troubleshooting

**No ads showing?**
- Check if you're premium user
- Check platform (web not supported)
- Check console for errors
- Wait a moment (ads need to load)

**Still seeing test ads in production?**
- Did you add production ad unit IDs to `.env`?
- Did you build in release mode?
- Did you update `app.config.js`?

**Ad load failed?**
- Check internet connection
- New AdMob accounts need approval (takes days)
- Check ad unit IDs are correct

## Need Help?

1. Check [Full Documentation](./ADMOB_INTEGRATION.md)
2. Check [AdMob Help Center](https://support.google.com/admob)
3. Check [react-native-google-mobile-ads docs](https://docs.page/invertase/react-native-google-mobile-ads)

## What's Next?

1. ✅ Test ads work in development (already done!)
2. ⏳ Create AdMob account and ad units
3. ⏳ Add production ad unit IDs to `.env`
4. ⏳ Build and test production version
5. ⏳ Add interstitial ads at strategic points
6. ⏳ Add rewarded ads for premium features

You're all set! Your ads are working in development mode right now. When ready for production, just follow the steps above. 🚀

