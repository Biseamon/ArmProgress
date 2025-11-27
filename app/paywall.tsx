import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, X, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RevenueCatUI from 'react-native-purchases-ui';

const premiumFeatures = [
  'Advanced Analytics (6 chart types)',
  'PR Timeline & Consistency Tracking',
  'Body Measurements Tracking',
  'Detailed Progress Reports',
  'Unlimited Goals',
  'Unlimited Workouts',
  'Unlimited Scheduled Trainings',
  'Unlimited Training Cycles',
  'Ad-Free Experience',
];

export default function PaywallScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { offerings, isPremium, refreshCustomerInfo } = useRevenueCat();
  const { refreshProfile } = useAuth();
  const [isPresenting, setIsPresenting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(true);

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

  // Load offerings when screen loads
  useEffect(() => {
    if (offerings || isPremium) {
      setIsLoading(false);
    }
  }, [isPremium, offerings]);

  // Handle proceeding to subscription plans
  const handleViewPlans = () => {
    setShowExplanation(false);
    presentRevenueCatPaywall();
  };

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

  // Show premium explanation screen
  if (showExplanation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.iconContainer}>
            <Crown size={80} color={colors.premium} strokeWidth={2.5} />
          </View>

          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Upgrade to Premium
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Unlock the full potential of your fitness journey
          </Text>

          {/* Pricing Section */}
          <View style={styles.pricingContainer}>
            <View style={[styles.priceCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.planName, { color: colors.text }]}>Monthly</Text>
              <Text style={[styles.price, { color: colors.primary }]}>$4.99</Text>
              <Text style={[styles.priceSubtext, { color: colors.textSecondary }]}>per month</Text>
            </View>

            <View style={[styles.priceCard, styles.bestValue, { backgroundColor: colors.cardBackground, borderColor: colors.premium }]}>
              <View style={[styles.bestValueBadge, { backgroundColor: colors.premium }]}>
                <Text style={styles.bestValueText}>BEST VALUE</Text>
              </View>
              <Text style={[styles.planName, { color: colors.text }]}>Yearly</Text>
              <Text style={[styles.price, { color: colors.premium }]}>$39.99</Text>
              <Text style={[styles.priceSubtext, { color: colors.textSecondary }]}>per year</Text>
              <Text style={[styles.savings, { color: colors.premium }]}>Save 33%</Text>
            </View>
          </View>

          {/* Features Section */}
          <View style={styles.featuresContainer}>
            <Text style={[styles.featuresTitle, { color: colors.text }]}>
              What You Get:
            </Text>
            {premiumFeatures.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Check size={20} color={colors.premium} strokeWidth={3} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: colors.primary }]}
            onPress={handleViewPlans}
            disabled={isPresenting}
          >
            {isPresenting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.ctaButtonText}>Continue to Subscription</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
            Cancel anytime. No commitments.
          </Text>
        </ScrollView>
      </View>
    );
  }

  // Fallback: Show button to manually trigger paywall (after explanation is dismissed)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.fallbackContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading subscription plans...
        </Text>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  pricingContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  priceCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  bestValue: {
    borderWidth: 3,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceSubtext: {
    fontSize: 14,
  },
  savings: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  ctaButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
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
