import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export function AdBanner() {
  const { isPremium } = useAuth();

  if (isPremium) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.adLabel}>Advertisement</Text>
      <View style={styles.adContent}>
        <Text style={styles.adText}>AdMob Banner Placeholder</Text>
        <Text style={styles.adSubtext}>
          {Platform.OS === 'web'
            ? '320x50 - Ads display on mobile devices'
            : '320x50 Banner Ad'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2A2A',
    padding: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 8,
  },
  adLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  adContent: {
    backgroundColor: '#1A1A1A',
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  adText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  adSubtext: {
    color: '#666',
    fontSize: 10,
    marginTop: 2,
  },
});
