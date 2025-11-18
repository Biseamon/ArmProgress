import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { ChevronLeft, FileText, Shield } from 'lucide-react-native';

const PRIVACY_POLICY_URL = 'https://yourdomain.com/privacy-policy.html';
const TERMS_CONDITIONS_URL = 'https://yourdomain.com/terms-and-conditions.html';

export default function LegalScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const openPrivacyPolicy = () => {
    Linking.openURL(PRIVACY_POLICY_URL);
  };

  const openTermsConditions = () => {
    Linking.openURL(TERMS_CONDITIONS_URL);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Legal</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal Documents</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Review our legal policies and terms of service
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={openPrivacyPolicy}
        >
          <View style={styles.cardIcon}>
            <Shield size={24} color={colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Privacy Policy</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Learn how we collect, use, and protect your personal information
            </Text>
          </View>
          <ChevronLeft size={20} color={colors.textTertiary} style={styles.chevron} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={openTermsConditions}
        >
          <View style={styles.cardIcon}>
            <FileText size={24} color={colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Terms and Conditions</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Review our terms of service and user agreement
            </Text>
          </View>
          <ChevronLeft size={20} color={colors.textTertiary} style={styles.chevron} />
        </TouchableOpacity>

        <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            By using ArmProgress, you agree to our Terms and Conditions and acknowledge that you have read our Privacy Policy.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  chevron: {
    transform: [{ rotate: '180deg' }],
  },
  infoBox: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
});
