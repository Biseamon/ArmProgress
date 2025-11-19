/**
 * Application Configuration
 *
 * Central place for all environment variables and configuration.
 * All secrets should be stored in .env file and accessed through this module.
 */

import Constants from 'expo-constants';

// Helper to get environment variable from either Expo config or process.env
const getEnvVar = (key: string, fallback?: string): string => {
  const value = Constants.expoConfig?.extra?.[key] || process.env[key] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// Helper to get optional environment variable
const getOptionalEnvVar = (key: string, fallback?: string): string | undefined => {
  return Constants.expoConfig?.extra?.[key] || process.env[key] || fallback;
};

/**
 * Supabase Configuration
 */
export const SUPABASE_CONFIG = {
  url: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
  anonKey: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
} as const;

/**
 * RevenueCat Configuration
 */
export const REVENUECAT_CONFIG = {
  iosKey: getOptionalEnvVar('EXPO_PUBLIC_REVENUECAT_IOS_KEY'),
  androidKey: getOptionalEnvVar('EXPO_PUBLIC_REVENUECAT_ANDROID_KEY'),
  entitlementId: 'premium', // Your entitlement identifier in RevenueCat
} as const;

/**
 * Stripe Configuration
 */
export const STRIPE_CONFIG = {
  donationUrl: getOptionalEnvVar(
    'EXPO_PUBLIC_STRIPE_DONATION_URL',
    '***REMOVED***'
  ) as string,
} as const;

/**
 * App Configuration
 */
export const APP_CONFIG = {
  scheme: getOptionalEnvVar('EXPO_PUBLIC_APP_SCHEME', 'armprogress'),
  url: getOptionalEnvVar('EXPO_PUBLIC_APP_URL', 'https://armprogress.com'),
  environment: getOptionalEnvVar('EXPO_PUBLIC_ENV', __DEV__ ? 'development' : 'production'),
} as const;

/**
 * AdMob Configuration
 * Automatically switches between test and production ad unit IDs
 */
export const ADMOB_CONFIG = {
  // Use test ad unit IDs in development, real ones in production
  banner: {
    ios: __DEV__ 
      ? 'ca-app-pub-3940256099942544/2934735716' // Test banner
      : getOptionalEnvVar('EXPO_PUBLIC_ADMOB_IOS_BANNER', 'ca-app-pub-3940256099942544/2934735716'),
    android: __DEV__ 
      ? 'ca-app-pub-3940256099942544/6300978111' // Test banner
      : getOptionalEnvVar('EXPO_PUBLIC_ADMOB_ANDROID_BANNER', 'ca-app-pub-3940256099942544/6300978111'),
  },
  interstitial: {
    ios: __DEV__ 
      ? 'ca-app-pub-3940256099942544/4411468910' // Test interstitial
      : getOptionalEnvVar('EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL', 'ca-app-pub-3940256099942544/4411468910'),
    android: __DEV__ 
      ? 'ca-app-pub-3940256099942544/1033173712' // Test interstitial
      : getOptionalEnvVar('EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL', 'ca-app-pub-3940256099942544/1033173712'),
  },
  rewarded: {
    ios: __DEV__ 
      ? 'ca-app-pub-3940256099942544/1712485313' // Test rewarded
      : getOptionalEnvVar('EXPO_PUBLIC_ADMOB_IOS_REWARDED', 'ca-app-pub-3940256099942544/1712485313'),
    android: __DEV__ 
      ? 'ca-app-pub-3940256099942544/5224354917' // Test rewarded
      : getOptionalEnvVar('EXPO_PUBLIC_ADMOB_ANDROID_REWARDED', 'ca-app-pub-3940256099942544/5224354917'),
  },
  isTestMode: __DEV__,
} as const;

/**
 * Feature Flags
 * Control feature availability based on environment
 */
export const FEATURES = {
  enableRevenueCat: !!REVENUECAT_CONFIG.iosKey || !!REVENUECAT_CONFIG.androidKey,
  enableAnalytics: APP_CONFIG.environment === 'production',
  enableDebugLogs: __DEV__ || APP_CONFIG.environment === 'development',
  enableAds: true, // Can be controlled via environment variable if needed
} as const;

/**
 * Validation
 * Ensures all required configuration is present
 */
export const validateConfig = () => {
  const errors: string[] = [];

  if (!SUPABASE_CONFIG.url) {
    errors.push('EXPO_PUBLIC_SUPABASE_URL is required');
  }

  if (!SUPABASE_CONFIG.anonKey) {
    errors.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  if (__DEV__) {
    console.log('✅ Configuration validated successfully');
    console.log('Environment:', APP_CONFIG.environment);
    console.log('Features:', FEATURES);
  }
};

// Auto-validate on import in development
if (__DEV__) {
  validateConfig();
}
