# RevenueCat Integration Guide

This guide explains how to integrate RevenueCat for premium subscriptions and in-app purchases in your Arm Wrestling Pro app.

## Important Note

Since this is an Expo project running in a web preview environment, you'll need to **export the project and open it locally** (e.g., in Cursor or VS Code) to fully integrate RevenueCat with native code support.

RevenueCat requires native code and will not function in the browser-based preview. To test purchases, you should create a development build using the Expo Dev Client.

## Prerequisites

1. Create a RevenueCat account at https://www.revenuecat.com
2. Set up your app in the RevenueCat dashboard
3. Configure products in App Store Connect (iOS) and Google Play Console (Android)
4. Link your products to RevenueCat

## Installation Steps

### 1. Export Your Expo Project Locally

Since Bolt runs in the browser, you need to work locally:

```bash
# Clone or download your project
# Navigate to your project directory
cd your-project-directory
```

### 2. Install RevenueCat SDK

Follow the official RevenueCat guide for Expo:
https://www.revenuecat.com/docs/getting-started/installation/expo

```bash
npx expo install react-native-purchases
```

### 3. Configure Your App

Add RevenueCat configuration to your `app.json`:

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

### 4. Initialize RevenueCat

Update `contexts/AuthContext.tsx` to initialize RevenueCat:

```typescript
import Purchases, { PurchasesOffering } from 'react-native-purchases';
import Constants from 'expo-constants';

// In your AuthContext, add initialization
useEffect(() => {
  if (Platform.OS === 'ios') {
    Purchases.configure({
      apiKey: 'your_ios_api_key_here',
      appUserID: user?.id, // optional
    });
  } else if (Platform.OS === 'android') {
    Purchases.configure({
      apiKey: 'your_android_api_key_here',
      appUserID: user?.id, // optional
    });
  }
}, [user]);
```

### 5. Implement Purchase Flow

Update `components/PaywallModal.tsx` to use RevenueCat:

```typescript
import Purchases, { PurchasesPackage } from 'react-native-purchases';

const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

    // Check if the user is now premium
    if (customerInfo.entitlements.active['premium'] !== undefined) {
      // User is now premium, update your app state
      await refreshProfile();
      onClose();
    }
  } catch (error) {
    if (!error.userCancelled) {
      // Show error to user
      Alert.alert('Purchase Error', error.message);
    }
  }
};

const loadOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      // Display available packages
      setPackages(offerings.current.availablePackages);
    }
  } catch (error) {
    console.error('Error loading offerings:', error);
  }
};
```

### 6. Check Premium Status

Check premium status when the app loads:

```typescript
const checkPremiumStatus = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

    // Update premium status in Supabase
    if (profile && isPremium !== profile.is_premium) {
      await supabase
        .from('profiles')
        .update({ is_premium: isPremium })
        .eq('id', profile.id);
    }

    return isPremium;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
};
```

### 7. Handle Restore Purchases

Add a restore purchases function:

```typescript
const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

    if (isPremium) {
      Alert.alert('Success', 'Your purchases have been restored!');
      await refreshProfile();
    } else {
      Alert.alert('No Purchases', 'No active purchases found to restore.');
    }
  } catch (error) {
    Alert.alert('Restore Error', error.message);
  }
};
```

## Product Setup

### Create Products in RevenueCat

1. Go to your RevenueCat dashboard
2. Create an Entitlement called "premium"
3. Create Products for your subscription tiers:
   - Monthly: $9.99/month
   - Yearly: $79.99/year (save 33%)
   - Lifetime: $149.99 (one-time)

### Link to App Stores

1. Create matching products in App Store Connect (iOS)
2. Create matching products in Google Play Console (Android)
3. Link these products to your RevenueCat products

## Testing

### iOS Testing
1. Create a sandbox test user in App Store Connect
2. Use the sandbox account to test purchases on a real device or simulator
3. RevenueCat provides test mode for development

### Android Testing
1. Create test users in Google Play Console
2. Join your app's testing track
3. Test purchases on a real device

## Environment Variables

Add these to your `.env` file:

```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=your_ios_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=your_android_key_here
```

## Current Implementation

The app currently has:
- ✅ Premium badge in profile
- ✅ Paywall modal UI
- ✅ Premium feature gates (workout limits, goal limits)
- ✅ Database field `is_premium` in profiles table
- ⏳ RevenueCat integration (requires local development)

## Next Steps

1. Export your project locally
2. Follow the RevenueCat Expo guide
3. Create development builds with `expo-dev-client`
4. Test on real devices
5. Submit to app stores

## Support

- RevenueCat Docs: https://docs.revenuecat.com
- RevenueCat Expo Guide: https://www.revenuecat.com/docs/getting-started/installation/expo
- RevenueCat Community: https://community.revenuecat.com

## Important Reminders

- **Test thoroughly** before going to production
- **Never use test API keys in production**
- **Handle edge cases** (network failures, user cancellations)
- **Comply with app store guidelines** for subscriptions
- **Provide clear pricing** and terms to users
