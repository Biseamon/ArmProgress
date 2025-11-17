import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ADMOB_CONFIG, FEATURES } from '@/lib/config';
import { useState } from 'react';

// Dynamic import with error handling for native module
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

try {
  const googleAds = require('react-native-google-mobile-ads');
  BannerAd = googleAds.BannerAd;
  BannerAdSize = googleAds.BannerAdSize;
  TestIds = googleAds.TestIds;
} catch (error) {
  // Native module not available (Expo Go or web)
  if (FEATURES.enableDebugLogs) {
    console.log('AdMob native module not available - using placeholders');
  }
}

export function AdMediumRectangle() {
  const { isPremium } = useAuth();
  const { colors } = useTheme();
  const [adError, setAdError] = useState(false);

  // Don't show ads for premium users or if ads are disabled
  if (isPremium || !FEATURES.enableAds) {
    return null;
  }

  // Show placeholder if native module not available or on web
  if (Platform.OS === 'web' || !BannerAd) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.adLabel, { color: colors.textTertiary }]}>Advertisement</Text>
        <View style={[styles.adContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.adText, { color: colors.textSecondary }]}>AdMob Medium Rectangle</Text>
          <Text style={[styles.adSubtext, { color: colors.textTertiary }]}>
            {Platform.OS === 'web'
              ? '300x250 - Ads display on mobile devices'
              : '300x250 - Build with native code to show real ads'}
          </Text>
        </View>
      </View>
    );
  }

  // Get the correct ad unit ID for the current platform
  const adUnitID = Platform.select({
    ios: ADMOB_CONFIG.banner.ios,
    android: ADMOB_CONFIG.banner.android,
  }) || TestIds?.BANNER;

  // If ad failed to load, show nothing (graceful degradation)
  if (adError) {
    return null;
  }

  return (
    <View style={styles.container}>
      {ADMOB_CONFIG.isTestMode && (
        <Text style={[styles.testLabel, { color: colors.textTertiary }]}>
          TEST AD - Development Mode
        </Text>
      )}
      <BannerAd
        unitId={adUnitID}
        size={BannerAdSize.MEDIUM_RECTANGLE}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error: any) => {
          console.warn('AdMob Medium Rectangle failed to load:', error);
          setAdError(true);
        }}
        onAdLoaded={() => {
          if (FEATURES.enableDebugLogs) {
            console.log('AdMob Medium Rectangle loaded successfully');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  testLabel: {
    fontSize: 10,
    marginBottom: 4,
    fontWeight: '600',
  },
  adLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  adContent: {
    width: 300,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  adText: {
    fontSize: 14,
    fontWeight: '600',
  },
  adSubtext: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

