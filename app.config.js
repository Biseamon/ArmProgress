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
      infoPlist: {
        UIViewControllerBasedStatusBarAppearance: false,
      },
      usesAppleSignIn: true,
      config: {
        // AdMob App ID for iOS
        // Using test App ID for development: ca-app-pub-3940256099942544~1458002511
        // Replace with your real App ID from https://apps.admob.com/ for production
        googleMobileAdsAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || "ca-app-pub-3940256099942544~1458002511"
      }
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
      config: {
        // AdMob App ID for Android
        // Using test App ID for development: ca-app-pub-3940256099942544~3347511713
        // Replace with your real App ID from https://apps.admob.com/ for production
        googleMobileAdsAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || "ca-app-pub-3940256099942544~3347511713"
      }
    },
    web: {
      bundler: "metro",
      output: "single",
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "expo-apple-authentication"
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      // Environment variables - automatically loaded from .env
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_REVENUECAT_IOS_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
      EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
      EXPO_PUBLIC_STRIPE_DONATION_URL: process.env.EXPO_PUBLIC_STRIPE_DONATION_URL,
      EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV,
      EXPO_PUBLIC_APP_SCHEME: process.env.EXPO_PUBLIC_APP_SCHEME,
      EXPO_PUBLIC_APP_URL: process.env.EXPO_PUBLIC_APP_URL,
    },
  },
};
