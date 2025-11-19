/**
 * AdMob Integration Examples
 * 
 * This file demonstrates how to use all three types of AdMob ads in your app.
 * Copy and adapt these examples to your screens.
 */

import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { AdBanner } from '@/components/AdBanner';
import { useAdInterstitial } from '@/components/AdInterstitial';
import { useAdRewarded } from '@/components/AdRewarded';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Example 1: Banner Ad Usage
 * 
 * Simply place the <AdBanner /> component anywhere in your screen.
 * It automatically handles:
 * - Test/production switching
 * - Premium user hiding
 * - Web platform fallback
 * - Error handling
 */
function BannerAdExample() {
  return (
    <View>
      <Text>Your content here</Text>
      
      {/* Banner ad - that's it! */}
      <AdBanner />
      
      <Text>More content here</Text>
    </View>
  );
}

/**
 * Example 2: Interstitial Ad Usage
 * 
 * Show full-screen ads between natural breaks in your app:
 * - After completing a workout
 * - After finishing a training cycle
 * - Between major sections
 */
function InterstitialAdExample() {
  const { colors } = useTheme();
  const { showInterstitial, isReady, isTestMode } = useAdInterstitial();

  const handleWorkoutComplete = async () => {
    // Your workout completion logic
    console.log('Workout completed!');
    
    // Show interstitial ad (if ready)
    if (isReady) {
      const shown = await showInterstitial();
      if (shown) {
        console.log('Interstitial ad displayed');
      }
    }
    
    // Continue with navigation or other logic
    Alert.alert('Success', 'Workout completed!');
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Interstitial Ad Example
      </Text>
      
      {isTestMode && (
        <Text style={[styles.testModeLabel, { color: colors.textSecondary }]}>
          🧪 Test Mode - Using Google test ads
        </Text>
      )}
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleWorkoutComplete}
      >
        <Text style={styles.buttonText}>
          Complete Workout (Shows Ad)
        </Text>
      </TouchableOpacity>
      
      <Text style={[styles.status, { color: colors.textSecondary }]}>
        Ad Status: {isReady ? '✅ Ready' : '⏳ Loading...'}
      </Text>
    </View>
  );
}

/**
 * Example 3: Rewarded Ad Usage
 * 
 * Give users rewards for watching ads:
 * - Unlock premium features temporarily
 * - Earn in-app currency
 * - Remove banner ads for a period
 * - Get bonus content
 */
function RewardedAdExample() {
  const { colors } = useTheme();
  const { isPremium } = useAuth();
  
  const { showRewardedAd, isReady, userDidEarnReward, isTestMode } = useAdRewarded({
    onRewardEarned: (reward) => {
      console.log('User earned reward:', reward);
      Alert.alert(
        'Reward Earned! 🎉',
        'You unlocked premium features for 24 hours!',
        [{ text: 'Awesome!', style: 'default' }]
      );
      
      // Grant the reward in your app
      grantTemporaryPremium();
    },
    onAdClosed: () => {
      console.log('Rewarded ad was closed');
    },
    onAdFailedToLoad: (error) => {
      console.log('Failed to load rewarded ad:', error);
      Alert.alert('Oops', 'Could not load the ad. Please try again later.');
    }
  });

  const handleWatchAd = async () => {
    if (!isReady) {
      Alert.alert('Not Ready', 'The ad is still loading. Please wait a moment.');
      return;
    }

    const shown = await showRewardedAd();
    if (!shown) {
      Alert.alert('Error', 'Could not show the ad. Please try again.');
    }
  };

  const grantTemporaryPremium = () => {
    // Your logic to grant temporary premium access
    console.log('Granting 24-hour premium access');
  };

  // Don't show for premium users
  if (isPremium) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>
          You're already premium! 🎉
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Rewarded Ad Example
      </Text>
      
      {isTestMode && (
        <Text style={[styles.testModeLabel, { color: colors.textSecondary }]}>
          🧪 Test Mode - Using Google test ads
        </Text>
      )}
      
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Watch a short video to unlock premium features for 24 hours!
      </Text>
      
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: isReady ? colors.primary : colors.surfaceSecondary }
        ]}
        onPress={handleWatchAd}
        disabled={!isReady}
      >
        <Text style={styles.buttonText}>
          {isReady ? '▶️ Watch Ad for Reward' : '⏳ Loading Ad...'}
        </Text>
      </TouchableOpacity>
      
      {userDidEarnReward && (
        <Text style={[styles.successMessage, { color: colors.success }]}>
          ✅ Reward earned! You have premium access.
        </Text>
      )}
      
      <Text style={[styles.status, { color: colors.textSecondary }]}>
        Ad Status: {isReady ? '✅ Ready' : '⏳ Loading...'}
      </Text>
    </View>
  );
}

/**
 * Example 4: Complete Screen with All Ad Types
 * 
 * Shows how to use multiple ad types in a single screen
 */
export function CompleteAdIntegrationExample() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Banner at the top */}
      <AdBanner />
      
      <View style={styles.section}>
        <InterstitialAdExample />
      </View>
      
      <View style={styles.section}>
        <RewardedAdExample />
      </View>
      
      {/* Banner at the bottom */}
      <AdBanner />
    </ScrollView>
  );
}

/**
 * Example 5: Strategic Ad Placement
 * 
 * Best practices for when to show ads
 */
export const AdStrategyExamples = {
  // Show interstitial after user completes a major action
  afterWorkoutComplete: async (showInterstitial: () => Promise<boolean>) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    await showInterstitial();
  },

  // Show rewarded ad to unlock a premium feature
  unlockPremiumFeature: async (showRewardedAd: () => Promise<boolean>) => {
    const shown = await showRewardedAd();
    return shown; // Return whether ad was shown
  },

  // Show interstitial after every N workouts (frequency capping)
  afterEveryNWorkouts: async (
    workoutCount: number,
    frequency: number,
    showInterstitial: () => Promise<boolean>
  ) => {
    if (workoutCount % frequency === 0) {
      await showInterstitial();
    }
  },
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  section: {
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 14,
    marginTop: 8,
  },
  testModeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  successMessage: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
});

/**
 * Usage in your screens:
 * 
 * import { AdBanner } from '@/components/AdBanner';
 * import { useAdInterstitial } from '@/components/AdInterstitial';
 * import { useAdRewarded } from '@/components/AdRewarded';
 * 
 * // Or import all at once:
 * import { AdBanner, useAdInterstitial, useAdRewarded } from '@/components/ads';
 */

