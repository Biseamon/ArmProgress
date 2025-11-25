// Load environment variables from .env file
require('dotenv').config();

module.exports = {
  expo: {
    name: "ArmProgress",
    slug: "armprogress",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "armprogress",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.armprogress.app",
      buildNumber: "8",
      infoPlist: {
        UIViewControllerBasedStatusBarAppearance: false,
      },
      usesAppleSignIn: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#1A1A1A",
      },
      package: "com.armprogress.app",
      statusBar: {
        barStyle: "auto",
        backgroundColor: "#00000000",
        translucent: true,
      },
    },
    web: {
      bundler: "metro",
      output: "single",
    },
    splash: {
      image: "./assets/images/icon.png",
      resizeMode: "contain",
      backgroundColor: "#1A1A1A"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "expo-apple-authentication",
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || "ca-app-pub-3940256099942544~3347511713",
          iosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || "ca-app-pub-3940256099942544~1458002511",
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      // Environment variables - automatically loaded from .env
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      // RevenueCat keys (both dev and prod for automatic switching)
      EXPO_PUBLIC_REVENUECAT_IOS_KEY_DEV: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY_DEV,
      EXPO_PUBLIC_REVENUECAT_IOS_KEY_PROD: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY_PROD,
      EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_DEV: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_DEV,
      EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_PROD: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_PROD,
      // AdMob Ad Unit IDs (for production ads)
      EXPO_PUBLIC_ADMOB_IOS_BANNER: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER,
      EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL,
      EXPO_PUBLIC_ADMOB_IOS_REWARDED: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED,
      EXPO_PUBLIC_ADMOB_ANDROID_BANNER: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER,
      EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL,
      EXPO_PUBLIC_ADMOB_ANDROID_REWARDED: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED,
      EXPO_PUBLIC_STRIPE_DONATION_URL: process.env.EXPO_PUBLIC_STRIPE_DONATION_URL,
      EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV,
      EXPO_PUBLIC_APP_SCHEME: process.env.EXPO_PUBLIC_APP_SCHEME,
      EXPO_PUBLIC_APP_URL: process.env.EXPO_PUBLIC_APP_URL,
    },
  },
};
