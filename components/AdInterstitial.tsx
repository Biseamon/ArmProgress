import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { ADMOB_CONFIG, FEATURES } from '@/lib/config';

// Dynamic import with error handling for native module
let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;

try {
  const googleAds = require('react-native-google-mobile-ads');
  InterstitialAd = googleAds.InterstitialAd;
  AdEventType = googleAds.AdEventType;
  TestIds = googleAds.TestIds;
} catch (error) {
  // Native module not available (Expo Go or web)
  if (__DEV__) {
    console.log('AdMob native module not available for Interstitial - will show nothing');
  }
}

/**
 * AdInterstitial Hook
 * 
 * Manages interstitial ads with automatic test/production mode switching.
 * 
 * Usage:
 * const { showInterstitial, isReady } = useAdInterstitial();
 * 
 * // Show ad when ready
 * if (isReady) {
 *   await showInterstitial();
 * }
 */
export function useAdInterstitial() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [interstitial, setInterstitial] = useState<any>(null);

  // Get the correct ad unit ID for the current platform
  const adUnitID = Platform.select({
    ios: ADMOB_CONFIG.interstitial.ios,
    android: ADMOB_CONFIG.interstitial.android,
  }) || TestIds?.INTERSTITIAL;

  // Initialize interstitial ad
  useEffect(() => {
    // Don't load ads on web, if ads are disabled, or if native module not available
    if (Platform.OS === 'web' || !FEATURES.enableAds || !InterstitialAd) {
      return;
    }

    const ad = InterstitialAd.createForAdRequest(adUnitID, {
      requestNonPersonalizedAdsOnly: true,
    });

    // Event listeners
    const loadedListener = ad.addAdEventListener(AdEventType.LOADED, () => {
      setIsReady(true);
      setIsLoading(false);
      if (FEATURES.enableDebugLogs) {
        console.log('AdMob Interstitial loaded successfully');
      }
    });

    const errorListener = ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
      console.warn('Failed to load interstitial ad:', error);
      setIsReady(false);
      setIsLoading(false);
    });

    const closedListener = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setIsReady(false);
      if (FEATURES.enableDebugLogs) {
        console.log('Interstitial ad closed');
      }
      // Load next ad
      ad.load();
    });

    setInterstitial(ad);
    setIsLoading(true);
    ad.load();

    // Cleanup
    return () => {
      loadedListener();
      errorListener();
      closedListener();
    };
  }, [adUnitID]);

  // Show interstitial ad
  const showInterstitial = useCallback(async () => {
    if (!isReady || !interstitial || Platform.OS === 'web' || !FEATURES.enableAds || !InterstitialAd) {
      return false;
    }

    try {
      await interstitial.show();
      
      if (FEATURES.enableDebugLogs) {
        console.log('AdMob Interstitial displayed');
      }
      
      return true;
    } catch (error) {
      console.warn('Failed to show interstitial ad:', error);
      setIsReady(false);
      // Try to load again
      if (interstitial) {
        interstitial.load();
      }
      return false;
    }
  }, [isReady, interstitial]);

  return {
    showInterstitial,
    isReady,
    isLoading,
    isTestMode: ADMOB_CONFIG.isTestMode,
  };
}

