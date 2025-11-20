import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RevenueCatUI from 'react-native-purchases-ui';

export default function PaywallScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { offerings, isPremium, refreshCustomerInfo } = useRevenueCat();
  const { refreshProfile } = useAuth();
  const [isPresenting, setIsPresenting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Present RevenueCat paywall from dashboard
  const presentRevenueCatPaywall = async () => {
    if (isPresenting || Platform.OS === 'web') return;

    try {
      setIsPresenting(true);
      console.log('Presenting RevenueCat paywall...');

      const paywallResult = await RevenueCatUI.presentPaywall();
      console.log('Paywall result:', paywallResult);

      // Handle different result types
      if (paywallResult === RevenueCatUI.PAYWALL_RESULT.PURCHASED) {
        console.log('User completed purchase');

        // Refresh RevenueCat customer info
        await refreshCustomerInfo();

        // Refresh AuthContext profile to sync with Supabase
        await refreshProfile();

        // Show success message
        Alert.alert(
          'Success!',
          'Welcome to Premium! You now have access to all premium features.',
          [
            {
              text: 'Get Started',
              onPress: () => router.back(),
            },
          ]
        );
      } else if (paywallResult === RevenueCatUI.PAYWALL_RESULT.RESTORED) {
        console.log('User restored purchases');

        // Refresh both contexts
        await refreshCustomerInfo();
        await refreshProfile();

        // Show success message
        Alert.alert(
          'Success',
          'Your purchases have been restored!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else if (paywallResult === RevenueCatUI.PAYWALL_RESULT.CANCELLED) {
        console.log('User cancelled paywall');
        // User cancelled, just go back
        router.back();
      } else if (paywallResult === RevenueCatUI.PAYWALL_RESULT.ERROR) {
        console.error('Paywall presentation error');
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } catch (error: any) {
      console.error('Error presenting paywall:', error);
      Alert.alert('Error', 'Failed to load paywall. Please try again.');
    } finally {
      setIsPresenting(false);
    }
  };

  // Auto-present paywall when screen loads (if not premium)
  useEffect(() => {
    if (!isPremium && Platform.OS !== 'web' && offerings) {
      // Small delay to ensure screen is mounted
      const timer = setTimeout(() => {
        setIsLoading(false);
        presentRevenueCatPaywall();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [isPremium, offerings]);

  // If user is already premium, show success screen
  if (isPremium) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.premiumContainer}>
          <Crown size={64} color={colors.premium} />
          <Text style={[styles.premiumTitle, { color: colors.text }]}>
            You're a Premium Member!
          </Text>
          <Text style={[styles.premiumText, { color: colors.textSecondary }]}>
            You have access to all premium features.
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back to App</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show loading while waiting for offerings or paywall presentation
  if (isLoading || !offerings) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading subscription plans...
          </Text>
        </View>
      </View>
    );
  }

  // Fallback: Show button to manually trigger paywall
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.fallbackContainer}>
        <Crown size={64} color={colors.premium} />
        <Text style={[styles.fallbackTitle, { color: colors.text }]}>
          Upgrade to Premium
        </Text>
        <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>
          Unlock all features and take your training to the next level
        </Text>
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
          onPress={presentRevenueCatPaywall}
          disabled={isPresenting}
        >
          {isPresenting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.upgradeButtonText}>View Subscription Plans</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
  },
  closeButton: {
    padding: 8,
  },
  premiumContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
    textAlign: 'center',
  },
  premiumText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  fallbackTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 24,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  upgradeButton: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
