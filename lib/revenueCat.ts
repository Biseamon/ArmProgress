import Purchases, {
  PurchasesOffering,
  CustomerInfo,
  PurchasesPackage,
  LOG_LEVEL
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys - Add these to your .env file
const REVENUECAT_API_KEY = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
};

// Check if API keys are valid (not placeholder values)
const isValidApiKey = (key: string): boolean => {
  // Valid formats: appl_xxx, goog_xxx, test_xxx, or any other RevenueCat key format
  return !!(key && key.length > 10 && !key.includes('xxxxx'));
};

// Check if RevenueCat is properly configured
const isRevenueCatConfigured = (): boolean => {
  const apiKey = Platform.OS === 'ios'
    ? REVENUECAT_API_KEY.ios
    : REVENUECAT_API_KEY.android;

  return isValidApiKey(apiKey);
};

// Premium entitlement identifier (set this in RevenueCat dashboard)
export const PREMIUM_ENTITLEMENT_ID = 'premium';

// Offering identifiers
export const OFFERING_ID = {
  DEFAULT: 'default',
};

/**
 * Initialize RevenueCat SDK
 * Call this on app startup, ideally in App.tsx or root layout
 */
export const initializeRevenueCat = async (userId?: string) => {
  try {
    // RevenueCat doesn't work on web, skip initialization
    if (Platform.OS === 'web') {
      console.log('RevenueCat: Skipping initialization on web platform');
      return;
    }

    if (!isRevenueCatConfigured()) {
      console.warn('RevenueCat API key not configured or invalid. Purchases will not work.');
      return;
    }

    const apiKey = Platform.OS === 'ios'
      ? REVENUECAT_API_KEY.ios
      : REVENUECAT_API_KEY.android;

    console.log('RevenueCat: Initializing with API key for', Platform.OS);

    // Configure SDK
    Purchases.setLogLevel(LOG_LEVEL.DEBUG); // Set to INFO or WARN in production

    // Initialize - use single configure call with appUserID if available
    await Purchases.configure({
      apiKey,
      appUserID: userId, // Pass user ID directly in configure instead of separate logIn call
    });

    console.log('RevenueCat initialized successfully', userId ? `with user ID: ${userId}` : 'anonymously');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    // Don't throw - allow app to continue without RevenueCat
  }
};

/**
 * Get current customer info and premium status
 */
export const getCustomerInfo = async (): Promise<{
  customerInfo: CustomerInfo | null;
  isPremium: boolean;
}> => {
  try {
    if (Platform.OS === 'web' || !isRevenueCatConfigured()) {
      return { customerInfo: null, isPremium: false };
    }

    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;

    return { customerInfo, isPremium };
  } catch (error) {
    console.error('Error getting customer info:', error);
    return { customerInfo: null, isPremium: false };
  }
};

/**
 * Get available offerings/packages
 */
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    if (Platform.OS === 'web' || !isRevenueCatConfigured()) {
      return null;
    }

    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Error getting offerings:', error);
    return null;
  }
};

/**
 * Purchase a package
 */
export const purchasePackage = async (
  packageToPurchase: PurchasesPackage
): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> => {
  try {
    if (Platform.OS === 'web') {
      return {
        success: false,
        error: 'Purchases are not supported on web. Please use iOS or Android.',
      };
    }

    if (!isRevenueCatConfigured()) {
      return {
        success: false,
        error: 'RevenueCat is not configured. Please set up your API keys.',
      };
    }

    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

    const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;

    return {
      success: isPremium,
      customerInfo,
    };
  } catch (error: any) {
    console.error('Error purchasing package:', error);

    // Check if user cancelled
    if (error.userCancelled) {
      return {
        success: false,
        error: 'Purchase cancelled',
      };
    }

    return {
      success: false,
      error: error.message || 'Purchase failed',
    };
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<{
  success: boolean;
  isPremium: boolean;
  error?: string;
}> => {
  try {
    if (Platform.OS === 'web') {
      return {
        success: false,
        isPremium: false,
        error: 'Purchases are not supported on web. Please use iOS or Android.',
      };
    }

    if (!isRevenueCatConfigured()) {
      return {
        success: false,
        isPremium: false,
        error: 'RevenueCat is not configured. Please set up your API keys.',
      };
    }

    const customerInfo = await Purchases.restorePurchases();
    const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;

    return {
      success: true,
      isPremium,
    };
  } catch (error: any) {
    console.error('Error restoring purchases:', error);
    return {
      success: false,
      isPremium: false,
      error: error.message || 'Failed to restore purchases',
    };
  }
};

/**
 * Log in user (call when user logs in to your app)
 */
export const loginRevenueCat = async (userId: string) => {
  try {
    if (Platform.OS === 'web' || !isRevenueCatConfigured()) {
      return;
    }

    await Purchases.logIn(userId);
  } catch (error) {
    console.error('Error logging in to RevenueCat:', error);
  }
};

/**
 * Log out user (call when user logs out of your app)
 */
export const logoutRevenueCat = async () => {
  try {
    if (Platform.OS === 'web' || !isRevenueCatConfigured()) {
      return;
    }

    await Purchases.logOut();
  } catch (error) {
    console.error('Error logging out from RevenueCat:', error);
  }
};

/**
 * Check if user has active premium subscription
 */
export const checkPremiumStatus = async (): Promise<boolean> => {
  const { isPremium } = await getCustomerInfo();
  return isPremium;
};

/**
 * Get subscription management URL (for iOS)
 */
export const getManageSubscriptionURL = () => {
  if (Platform.OS === 'ios') {
    return 'https://apps.apple.com/account/subscriptions';
  } else {
    return 'https://play.google.com/store/account/subscriptions';
  }
};
