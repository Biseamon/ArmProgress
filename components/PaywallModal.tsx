import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Crown, X, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import RevenueCatUI from 'react-native-purchases-ui';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { useAuth } from '@/contexts/AuthContext';

type PaywallModalProps = {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  feature: string;
};

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

export function PaywallModal({ visible, onClose, onUpgrade, feature }: PaywallModalProps) {
  const { refreshCustomerInfo, offerings } = useRevenueCat();
  const { refreshProfile } = useAuth();
  const [isPresenting, setIsPresenting] = useState(false);

  const presentRevenueCatPaywall = async () => {
    if (isPresenting || Platform.OS === 'web') return;

    try {
      setIsPresenting(true);
      console.log('[PaywallModal] Presenting RevenueCat paywall...');

      const paywallResult = await RevenueCatUI.presentPaywall({
        offering: offerings || undefined,
      });

      if (paywallResult === RevenueCatUI.PAYWALL_RESULT.PURCHASED) {
        await refreshCustomerInfo();
        await refreshProfile();

        Alert.alert(
          'Success!',
          'Welcome to Premium! You now have access to all premium features.',
          [{ text: 'Get Started', onPress: () => { onClose(); if (onUpgrade) onUpgrade(); } }]
        );
      } else if (paywallResult === RevenueCatUI.PAYWALL_RESULT.RESTORED) {
        await refreshCustomerInfo();
        await refreshProfile();

        Alert.alert(
          'Success',
          'Your purchases have been restored!',
          [{ text: 'OK', onPress: () => { onClose(); if (onUpgrade) onUpgrade(); } }]
        );
      } else if (paywallResult === RevenueCatUI.PAYWALL_RESULT.CANCELLED) {
        // User cancelled, do nothing
      }
    } catch (error: any) {
      console.error('[PaywallModal] Error presenting paywall:', error);
      Alert.alert('Error', 'Failed to load paywall. Please try again.');
    } finally {
      setIsPresenting(false);
    }
  };

  const handleSelectPlan = (planType: 'monthly' | 'yearly') => {
    console.log('[PaywallModal] User selected plan:', planType);
    presentRevenueCatPaywall();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.modal}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#999" />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <Crown size={60} color="#FFD700" strokeWidth={2} />
            </View>

            <Text style={styles.title}>Premium Feature</Text>
            <Text style={styles.description}>
              {feature} requires Premium membership
            </Text>

            {/* Pricing Section - Tappable Cards */}
            <View style={styles.pricingContainer}>
              <TouchableOpacity
                style={styles.priceCard}
                onPress={() => handleSelectPlan('monthly')}
                disabled={isPresenting}
                activeOpacity={0.7}
              >
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.price}>$4.99</Text>
                <Text style={styles.priceSubtext}>per month</Text>
                <View style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Select</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.priceCard, styles.bestValue]}
                onPress={() => handleSelectPlan('yearly')}
                disabled={isPresenting}
                activeOpacity={0.7}
              >
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
                <Text style={styles.planName}>Yearly</Text>
                <Text style={styles.price}>$39.99</Text>
                <Text style={styles.priceSubtext}>per year</Text>
                <Text style={styles.savings}>Save 33%</Text>
                <View style={[styles.selectButton, styles.selectButtonYearly]}>
                  <Text style={styles.selectButtonText}>Select</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>What You Get:</Text>
              {premiumFeatures.map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
                  <Check size={18} color="#FFD700" strokeWidth={3} />
                  <Text style={styles.benefit}>{benefit}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.disclaimer}>
              Tap a plan above to continue • Cancel anytime
            </Text>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  pricingContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  priceCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#444',
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  bestValue: {
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bestValueText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 6,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E63946',
    marginBottom: 2,
  },
  priceSubtext: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  savings: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  selectButton: {
    backgroundColor: '#E63946',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  selectButtonYearly: {
    backgroundColor: '#FFD700',
  },
  selectButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  benefitsContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  benefit: {
    fontSize: 13,
    color: '#CCC',
    flex: 1,
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 14,
  },
});
