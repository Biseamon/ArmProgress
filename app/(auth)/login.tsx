import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Dumbbell } from 'lucide-react-native';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithApple, signInWithFacebook } = useAuth();
  const { colors } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message || 'Failed to sign in');
      setLoading(false);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple' | 'facebook') => {
    setLoading(true);
    setError('');

    let result;
    switch (provider) {
      case 'google':
        result = await signInWithGoogle();
        break;
      case 'apple':
        result = await signInWithApple();
        break;
      case 'facebook':
        result = await signInWithFacebook();
        break;
    }

    if (result.error) {
      setError(result.error.message || `Failed to sign in with ${provider}`);
      setLoading(false);
    }
    // Note: OAuth redirects will handle navigation automatically
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Dumbbell size={60} color="#E63946" strokeWidth={2} />
          <Text style={styles.title}>Arm Wrestling Pro</Text>
          <Text style={styles.subtitle}>Track your strength journey</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton, loading && styles.buttonDisabled]}
            onPress={() => handleSocialSignIn('google')}
            disabled={loading}
          >
            <Text style={[styles.socialButtonText, styles.googleButtonText]}>Continue with Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton, loading && styles.buttonDisabled]}
              onPress={() => handleSocialSignIn('apple')}
              disabled={loading}
            >
              <Text style={[styles.socialButtonText, styles.appleButtonText]}>Continue with Apple</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.socialButton, styles.facebookButton, loading && styles.buttonDisabled]}
            onPress={() => handleSocialSignIn('facebook')}
            disabled={loading}
          >
            <Text style={[styles.socialButtonText, styles.facebookButtonText]}>Continue with Facebook</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#E63946',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontSize: 14,
  },
  linkBold: {
    color: '#E63946',
    fontWeight: 'bold',
  },
  errorText: {
    backgroundColor: '#4A1A1A',
    color: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  socialButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: '#FFF',
    borderColor: '#DDD',
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  googleButtonText: {
    color: '#000',
  },
  appleButtonText: {
    color: '#FFF',
  },
  facebookButtonText: {
    color: '#FFF',
  },
});
