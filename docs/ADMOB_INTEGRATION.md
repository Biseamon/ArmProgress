# AdMob Integration Guide

## Overview

Your app now has a complete AdMob integration with automatic switching between test ads (development) and production ads (release mode). The integration uses the official **react-native-google-mobile-ads** package (v13+), which is the maintained and recommended solution for Google Mobile Ads.

The integration includes three ad types:

1. **Banner Ads** - Small ads that appear at the top/bottom of screens
2. **Interstitial Ads** - Full-screen ads shown between activities
3. **Rewarded Ads** - Video ads that give users rewards for watching

## Automatic Test/Production Switching

The app automatically uses:
- **Test Ad Unit IDs** in development mode (`__DEV__ = true`)
- **Production Ad Unit IDs** in release builds (`__DEV__ = false`)

This means you can safely test ads during development without violating AdMob policies.

## Test Ad Unit IDs (Pre-configured)

These Google-provided test IDs are already configured for development:

### Banner Ads
- **iOS**: `ca-app-pub-3940256099942544/2934735716`
- **Android**: `ca-app-pub-3940256099942544/6300978111`

### Interstitial Ads
- **iOS**: `ca-app-pub-3940256099942544/4411468910`
- **Android**: `ca-app-pub-3940256099942544/1033173712`

### Rewarded Ads
- **iOS**: `ca-app-pub-3940256099942544/1712485313`
- **Android**: `ca-app-pub-3940256099942544/5224354917`

## Setting Up Production Ad Unit IDs

### Step 1: Create AdMob Account & App

1. Go to [AdMob Console](https://apps.admob.com/)
2. Create an account if you don't have one
3. Create a new app for your iOS and Android versions
4. Note down your App IDs

### Step 2: Create Ad Units

For each platform (iOS and Android), create:

1. **Banner Ad Unit**
   - Type: Banner
   - Size: 320x50 (Standard Banner)

2. **Interstitial Ad Unit**
   - Type: Interstitial

3. **Rewarded Ad Unit**
   - Type: Rewarded

### Step 3: Configure Environment Variables

Add your production ad unit IDs to your `.env` file:

```env
# AdMob Production Ad Unit IDs

# iOS Banner Ad Unit ID
EXPO_PUBLIC_ADMOB_IOS_BANNER=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY

# iOS Interstitial Ad Unit ID
EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY

# iOS Rewarded Ad Unit ID
EXPO_PUBLIC_ADMOB_IOS_REWARDED=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY

# Android Banner Ad Unit ID
EXPO_PUBLIC_ADMOB_ANDROID_BANNER=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY

# Android Interstitial Ad Unit ID
EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY

# Android Rewarded Ad Unit ID
EXPO_PUBLIC_ADMOB_ANDROID_REWARDED=ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY
```

### Step 4: Update app.json with AdMob App ID

Add your AdMob App IDs to `app.json`:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXX~YYYYYYYYYY"
      }
    },
    "android": {
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXX~YYYYYYYYYY"
      }
    }
  }
}
```

## Usage Examples

### 1. Banner Ads (Already Implemented)

Banner ads are already being used in your app via the `<AdBanner />` component:

```tsx
import { AdBanner } from '@/components/AdBanner';

function MyScreen() {
  return (
    <ScrollView>
      {/* Your content */}
      
      <AdBanner />
      
      {/* More content */}
    </ScrollView>
  );
}
```

The banner:
- Automatically hides for premium users
- Shows test ads in development
- Shows real ads in production
- Gracefully handles errors
- Shows a placeholder on web

### 2. Interstitial Ads (Hook-based)

Use interstitial ads between activities or after completing tasks:

```tsx
import { useAdInterstitial } from '@/components/AdInterstitial';
import { Button } from 'react-native';

function MyScreen() {
  const { showInterstitial, isReady, isTestMode } = useAdInterstitial();

  const handleCompleteTask = async () => {
    // Complete the user's task
    await completeTask();
    
    // Show ad if ready
    if (isReady) {
      await showInterstitial();
    }
    
    // Navigate to next screen
    navigation.navigate('NextScreen');
  };

  return (
    <Button 
      title="Complete Task" 
      onPress={handleCompleteTask}
    />
  );
}
```

**Best Practices for Interstitial Ads:**
- Show between natural breaks (completing a workout, finishing a set)
- Don't show too frequently (respect your users)
- Don't show on app launch or critical user flows

### 3. Rewarded Ads (Hook-based)

Use rewarded ads to give users benefits for watching:

```tsx
import { useAdRewarded } from '@/components/AdRewarded';
import { Button, Alert } from 'react-native';

function MyScreen() {
  const { showRewardedAd, isReady, isTestMode } = useAdRewarded({
    onRewardEarned: (reward) => {
      // User completed the ad - give them the reward!
      console.log('User earned reward:', reward);
      grantPremiumFeatureAccess();
      Alert.alert('Success!', 'You earned a reward!');
    },
    onAdClosed: () => {
      console.log('Ad was closed');
    },
    onAdFailedToLoad: (error) => {
      console.log('Ad failed to load:', error);
      Alert.alert('Error', 'Could not load rewarded ad');
    }
  });

  const handleWatchAd = async () => {
    if (isReady) {
      await showRewardedAd();
    } else {
      Alert.alert('Not Ready', 'Ad is still loading...');
    }
  };

  return (
    <Button 
      title={isReady ? "Watch Ad for Premium Access" : "Loading Ad..."}
      onPress={handleWatchAd}
      disabled={!isReady}
    />
  );
}
```

**Reward Ideas:**
- Temporary premium feature access
- Extra workout templates
- Remove banner ads for 24 hours
- Unlock special progress insights
- Bonus measurement entries

## Premium Users

All ad components automatically hide for premium users. They check the `isPremium` status from your `AuthContext`.

## Testing

### Development Testing

1. Run your app in development mode:
   ```bash
   npm run dev
   ```

2. You'll see "TEST AD - Development Mode" label on ads
3. Test ads will load from Google's test ad units
4. Safe to click and interact with test ads

### Production Testing

1. Build a release version:
   ```bash
   # iOS
   expo build:ios --release-channel production
   
   # Android
   expo build:android --release-channel production
   ```

2. Install on a device
3. Real ads will show (make sure you've configured production ad unit IDs)
4. **DO NOT** repeatedly click your own ads (violates AdMob policy)

## Configuration Reference

All AdMob configuration is centralized in `/lib/config.ts`:

```typescript
export const ADMOB_CONFIG = {
  banner: {
    ios: string,      // iOS banner ad unit ID
    android: string,  // Android banner ad unit ID
  },
  interstitial: {
    ios: string,      // iOS interstitial ad unit ID
    android: string,  // Android interstitial ad unit ID
  },
  rewarded: {
    ios: string,      // iOS rewarded ad unit ID
    android: string,  // Android rewarded ad unit ID
  },
  isTestMode: boolean, // true in development, false in production
};
```

## Troubleshooting

### Ads Not Showing

1. **Check premium status**: Ads hide for premium users
2. **Check platform**: Ads don't work on web
3. **Check console**: Look for error messages
4. **Wait a moment**: Ads take time to load
5. **Check internet**: Ads require network connection

### "Ad failed to load" Error

Common causes:
- No internet connection
- Ad inventory unavailable
- Invalid ad unit ID (check production config)
- AdMob account not approved yet (new accounts take time)

### Test Ads in Production

If you see test ads in production:
1. Check that you built in release mode
2. Verify production ad unit IDs are in `.env`
3. Confirm `__DEV__` is false in production build

### AdMob Policy Violations

**NEVER:**
- Click your own ads
- Encourage users to click ads
- Place ads in a way that causes accidental clicks
- Show ads on empty or error screens

## Revenue Tips

1. **Strategic Placement**: Place banner ads in natural viewing positions
2. **Interstitial Timing**: Show between logical breaks, not during critical flows
3. **Rewarded Value**: Make rewards valuable enough that users want to watch
4. **Respect Users**: Don't be too aggressive with ad frequency
5. **Premium Path**: Always offer a premium subscription to remove ads

## Current Implementation Status

✅ **Banner Ads**: Implemented in:
- Home screen (`app/(tabs)/index.tsx`)
- Progress screen (`app/(tabs)/progress.tsx`)
- Calendar screen (`app/(tabs)/calendar.tsx`)
- Training screen (`app/(tabs)/training/index.tsx`)

✅ **Interstitial Ads**: Component created, ready to use
✅ **Rewarded Ads**: Component created, ready to use
✅ **Automatic Test/Production Switching**: Configured
✅ **Premium User Handling**: Implemented

## Next Steps

1. **Get AdMob Account**: Sign up at [AdMob Console](https://apps.admob.com/)
2. **Create Ad Units**: Set up banner, interstitial, and rewarded ad units
3. **Add Production IDs**: Update `.env` with your production ad unit IDs
4. **Add App IDs**: Update `app.json` with your AdMob app IDs
5. **Test in Development**: Verify test ads work correctly
6. **Build Release**: Create production build and test real ads
7. **Implement Interstitial**: Add interstitial ads at strategic points
8. **Implement Rewarded**: Add rewarded ad opportunities for users

## Support

For AdMob-specific issues:
- [AdMob Help Center](https://support.google.com/admob)
- [react-native-google-mobile-ads Documentation](https://docs.page/invertase/react-native-google-mobile-ads)

For implementation questions:
- Check the code in `/components/AdBanner.tsx`
- Check the code in `/components/AdInterstitial.tsx`
- Check the code in `/components/AdRewarded.tsx`
- Review configuration in `/lib/config.ts`

