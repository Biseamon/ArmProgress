import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { ADMOB_CONFIG, FEATURES } from '@/lib/config';

// Dynamic import with error handling for native module
let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let TestIds: any = null;

try {
  const googleAds = require('react-native-google-mobile-ads');
  RewardedAd = googleAds.RewardedAd;
  RewardedAdEventType = googleAds.RewardedAdEventType;
  TestIds = googleAds.TestIds;
} catch (error) {
  // Native module not available (Expo Go or web)
  if (__DEV__) {
    console.log('AdMob native module not available for Rewarded - will show nothing');
  }
}

/**
 * AdRewarded Hook
 * 
 * Manages rewarded video ads with automatic test/production mode switching.
 * 
 * Usage:
 * const { showRewardedAd, isReady, userDidEarnReward } = useAdRewarded({
 *   onRewardEarned: (reward) => {
 *     console.log('User earned reward:', reward);
 *   }
 * });
 * 
 * // Show ad when ready
 * if (isReady) {
 *   await showRewardedAd();
 * }
 */

interface RewardedAdOptions {
  onRewardEarned?: (reward: { type: string; amount: number }) => void;
  onAdClosed?: () => void;
  onAdFailedToLoad?: (error: string) => void;
}

export function useAdRewarded(options: RewardedAdOptions = {}) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userDidEarnReward, setUserDidEarnReward] = useState(false);
  const [rewarded, setRewarded] = useState<any>(null);

  // Get the correct ad unit ID for the current platform
  const adUnitID = Platform.select({
    ios: ADMOB_CONFIG.rewarded.ios,
    android: ADMOB_CONFIG.rewarded.android,
  }) || TestIds?.REWARDED;

  // Initialize rewarded ad
  useEffect(() => {
    // Don't load ads on web, if ads are disabled, or if native module not available
    if (Platform.OS === 'web' || !FEATURES.enableAds || !RewardedAd) {
      return;
    }

    const ad = RewardedAd.createForAdRequest(adUnitID, {
      requestNonPersonalizedAdsOnly: true,
    });

    // Event listeners
    const loadedListener = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsReady(true);
      setIsLoading(false);
      if (FEATURES.enableDebugLogs) {
        console.log('AdMob Rewarded ad loaded successfully');
      }
    });

    const errorListener = ad.addAdEventListener(RewardedAdEventType.ERROR, (error: any) => {
      console.warn('Failed to load rewarded ad:', error);
      setIsReady(false);
      setIsLoading(false);
      options.onAdFailedToLoad?.(String(error));
    });

    const earnedRewardListener = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward: any) => {
        setUserDidEarnReward(true);
        if (FEATURES.enableDebugLogs) {
          console.log('User earned reward:', reward);
        }
        options.onRewardEarned?.(reward);
      }
    );

    setRewarded(ad);
    setIsLoading(true);
    ad.load();

    // Cleanup
    return () => {
      loadedListener();
      errorListener();
      earnedRewardListener();
    };
  }, [adUnitID, options.onRewardEarned, options.onAdFailedToLoad]);

  // Show rewarded ad
  const showRewardedAd = useCallback(async () => {
    if (!isReady || !rewarded || Platform.OS === 'web' || !FEATURES.enableAds || !RewardedAd) {
      return false;
    }

    try {
      setUserDidEarnReward(false);
      await rewarded.show();
      
      if (FEATURES.enableDebugLogs) {
        console.log('AdMob Rewarded ad displayed');
      }
      
      // Reset ready state and load next ad
      setIsReady(false);
      options.onAdClosed?.();
      
      // Load next ad
      rewarded.load();
      
      return true;
    } catch (error) {
      console.warn('Failed to show rewarded ad:', error);
      setIsReady(false);
      // Try to load again
      if (rewarded) {
        rewarded.load();
      }
      return false;
    }
  }, [isReady, rewarded, options]);

  return {
    showRewardedAd,
    isReady,
    isLoading,
    userDidEarnReward,
    isTestMode: ADMOB_CONFIG.isTestMode,
  };
}

