import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { PurchasesPackage } from 'react-native-purchases';
import { Crown, Check, X, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RevenueCatUI from 'react-native-purchases-ui';

export default function PaywallScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { offerings, purchase, restore, isPremium, refreshCustomerInfo } = useRevenueCat();
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [useRevenueCatPaywall, setUseRevenueCatPaywall] = useState(false);

  // Premium features list
  const premiumFeatures = [
    'Unlimited goals and PRs tracking',
    'Advanced analytics and reports',
    'Custom training cycles',
    'Data export functionality',
    'Ad-free experience',
    'Priority support',
    'Exclusive workout templates',
    'Progress sharing features',
  ];

  // Check if RevenueCat paywall is configured
  useEffect(() => {
    const checkPaywallAvailability = async () => {
      try {
        // Check if a paywall is configured in RevenueCat dashboard
        // If offerings have a paywall template, use RevenueCat UI
        if (offerings?.paywall) {
          setUseRevenueCatPaywall(true);
        }
      } catch (error) {
        console.log('No RevenueCat paywall configured, using custom paywall');
      }
    };

    checkPaywallAvailability();
  }, [offerings]);

  // Present RevenueCat paywall from dashboard
  const presentRevenueCatPaywall = async () => {
    try {
      const result = await RevenueCatUI.presentPaywall({
        requiredEntitlementIdentifier: 'premium',
      });

      // Result types: PURCHASED, RESTORED, CANCELLED, ERROR
      if (result === RevenueCatUI.PAYWALL_RESULT.PURCHASED || 
          result === RevenueCatUI.PAYWALL_RESULT.RESTORED) {
        await refreshCustomerInfo();
        router.back();
      }
    } catch (error: any) {
      console.error('Error presenting paywall:', error);
      Alert.alert('Error', 'Failed to load paywall. Please try again.');
    }
  };

  // Use RevenueCat paywall if available and configured
  useEffect(() => {
    if (useRevenueCatPaywall && !isPremium && Platform.OS !== 'web') {
      presentRevenueCatPaywall();
    }
  }, [useRevenueCatPaywall, isPremium]);

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    try {
      setPurchasing(true);
      const result = await purchase(selectedPackage);

      if (result.success) {
        Alert.alert(
          'Success!',
          'Welcome to Premium! 🎉\nYou now have access to all premium features.',
          [
            {
              text: 'Get Started',
              onPress: () => router.back(),
            },
          ]
        );
      } else if (result.error && result.error !== 'Purchase cancelled') {
        Alert.alert('Purchase Failed', result.error);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      const result = await restore();

      if (result.success) {
        Alert.alert(
          'Success',
          result.isPremium
            ? 'Your purchases have been restored!'
            : 'No previous purchases found.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (result.isPremium) {
                  router.back();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to restore purchases');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to restore purchases');
    } finally {
      setRestoring(false);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://yourwebsite.com/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://yourwebsite.com/terms');
  };

  if (isPremium) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.alreadyPremiumContainer}>
          <Crown size={64} color={colors.premium} />
          <Text style={[styles.alreadyPremiumTitle, { color: colors.text }]}>
            You're a Premium Member!
          </Text>
          <Text style={[styles.alreadyPremiumText, { color: colors.textSecondary }]}>
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.heroSection}>
        <Crown size={64} color={colors.premium} />
        <Text style={[styles.title, { color: colors.text }]}>Upgrade to Premium</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Unlock all features and take your training to the next level
        </Text>
      </View>

      <View style={styles.featuresSection}>
        {premiumFeatures.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Check size={20} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
          </View>
        ))}
      </View>

      {offerings && offerings.availablePackages.length > 0 ? (
        <View style={styles.packagesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Your Plan</Text>
          {offerings.availablePackages.map((pkg) => {
            const isSelected = selectedPackage?.identifier === pkg.identifier;
            const isPopular = pkg.packageType === 'ANNUAL';

            return (
              <TouchableOpacity
                key={pkg.identifier}
                style={[
                  styles.packageCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isSelected && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setSelectedPackage(pkg)}
              >
                {isPopular && (
                  <View style={[styles.popularBadge, { backgroundColor: colors.secondary }]}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}
                <View style={styles.packageHeader}>
                  <Text style={[styles.packageTitle, { color: colors.text }]}>
                    {pkg.product.title}
                  </Text>
                  <Text style={[styles.packagePrice, { color: colors.primary }]}>
                    {pkg.product.priceString}
                  </Text>
                </View>
                <Text style={[styles.packageDescription, { color: colors.textSecondary }]}>
                  {pkg.product.description}
                </Text>
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Check size={20} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading subscription plans...
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.purchaseButton,
          { backgroundColor: colors.primary },
          (!selectedPackage || purchasing) && { opacity: 0.5 },
        ]}
        onPress={handlePurchase}
        disabled={!selectedPackage || purchasing}
      >
        {purchasing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.purchaseButtonText}>Subscribe Now</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
        disabled={restoring}
      >
        {restoring ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <RefreshCw size={16} color={colors.primary} />
            <Text style={[styles.restoreButtonText, { color: colors.primary }]}>
              Restore Purchases
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Button to manually trigger RevenueCat paywall (for testing) */}
      {Platform.OS !== 'web' && offerings?.paywall && (
        <TouchableOpacity
          style={[styles.restoreButton, { marginTop: 8 }]}
          onPress={presentRevenueCatPaywall}
        >
          <Crown size={16} color={colors.secondary} />
          <Text style={[styles.restoreButtonText, { color: colors.secondary }]}>
            View Dashboard Paywall
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.legalSection}>
        <Text style={[styles.legalText, { color: colors.textTertiary }]}>
          Subscription automatically renews unless auto-renew is turned off at least 24 hours
          before the end of the current period.
        </Text>
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={openPrivacyPolicy}>
            <Text style={[styles.legalLink, { color: colors.textSecondary }]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
          <Text style={[styles.legalDivider, { color: colors.textTertiary }]}>•</Text>
          <TouchableOpacity onPress={openTermsOfService}>
            <Text style={[styles.legalLink, { color: colors.textSecondary }]}>
              Terms of Service
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
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
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  packagesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  packageCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  packageDescription: {
    fontSize: 14,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  purchaseButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  purchaseButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 32,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  legalSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  legalText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  legalLink: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  legalDivider: {
    fontSize: 12,
  },
  alreadyPremiumContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  alreadyPremiumTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
    textAlign: 'center',
  },
  alreadyPremiumText: {
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
  bottomSpacing: {
    height: 40,
  },
});
