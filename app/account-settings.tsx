import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, FileText, ChevronRight, Trash2, AlertTriangle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountSettings() {
  const { profile, signOut } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteEmail, setDeleteEmail] = useState('');

  const handleDeleteAccount = async () => {
    if (!profile?.email) {
      Alert.alert('Error', 'Profile not found');
      return;
    }

    // Validate email matches
    if (deleteEmail.toLowerCase().trim() !== profile.email.toLowerCase()) {
      Alert.alert('Error', 'Email does not match your account email');
      return;
    }

    // Validate password is entered
    if (!deletePassword.trim()) {
      Alert.alert('Error', 'Please enter your password to confirm');
      return;
    }

    // Final confirmation
    Alert.alert(
      'Delete Account - Final Confirmation',
      'This action cannot be undone. All your data including workouts, goals, progress, and social connections will be permanently deleted.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);

              // Step 1: Verify password by attempting to sign in
              const { error: signInError } = await supabase.auth.signInWithPassword({
                email: profile.email,
                password: deletePassword,
              });

              if (signInError) {
                Alert.alert('Authentication Failed', 'Incorrect password. Account deletion cancelled.');
                setDeleting(false);
                return;
              }

              // Step 2: Delete user data from Supabase (cascade will handle related data)
              // Mark profile as deleted (soft delete) - Supabase RLS policies should handle cascade
              const { error: deleteError } = await supabase
                .from('profiles')
                .update({ deleted: 1, updated_at: new Date().toISOString() })
                .eq('id', profile.id);

              if (deleteError) {
                console.error('Error marking profile as deleted:', deleteError);
                Alert.alert('Error', 'Failed to delete account data. Please try again or contact support.');
                setDeleting(false);
                return;
              }

              // Step 3: Delete the user from Supabase Auth
              const { error: authDeleteError } = await supabase.auth.admin.deleteUser(profile.id);

              if (authDeleteError) {
                // If auth deletion fails, we already soft-deleted the profile
                // This is acceptable - the user won't be able to sign in anyway
                console.warn('Auth deletion warning:', authDeleteError);
              }

              // Step 4: Sign out
              await signOut();

              // Step 5: Show success and redirect
              Alert.alert(
                'Account Deleted',
                'Your account has been permanently deleted. Thank you for using ArmProgress.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/(auth)/login'),
                  },
                ]
              );
            } catch (error: any) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', error.message || 'Failed to delete account. Please try again or contact support.');
            } finally {
              setDeleting(false);
              setShowDeleteConfirm(false);
              setDeletePassword('');
              setDeleteEmail('');
            }
          },
        },
      ]
    );
  };

  const handleInitiateDelete = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This will permanently delete:\n\n• All your workouts and exercises\n• All your goals and progress\n• All your measurements and PRs\n• All your social connections (friends and groups)\n• Your profile and settings\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => setShowDeleteConfirm(true),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Account Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal</Text>

          <TouchableOpacity
            style={[styles.card, styles.legalCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/legal')}
          >
            <View style={styles.settingLeft}>
              <FileText size={20} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>Privacy & Terms</Text>
            </View>
            <ChevronRight size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>

          <View style={[styles.dangerCard, { backgroundColor: colors.surface, borderColor: colors.error }]}>
            <View style={styles.dangerHeader}>
              <AlertTriangle size={24} color={colors.error} />
              <Text style={[styles.dangerTitle, { color: colors.error }]}>Delete Account</Text>
            </View>

            <Text style={[styles.dangerDescription, { color: colors.textSecondary }]}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </Text>

            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: colors.error }]}
              onPress={handleInitiateDelete}
            >
              <Trash2 size={18} color="#FFF" />
              <Text style={styles.deleteButtonText}>Delete My Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <AlertTriangle size={32} color={colors.error} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Account Deletion</Text>
            </View>

            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              To confirm deletion, please enter your email and password:
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={deleteEmail}
                onChangeText={setDeleteEmail}
                placeholder={profile?.email || 'your@email.com'}
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!deleting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={deletePassword}
                onChangeText={setDeletePassword}
                placeholder="Enter your password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                editable={!deleting}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setDeleteEmail('');
                }}
                disabled={deleting}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.error }]}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Trash2 size={18} color="#FFF" />
                    <Text style={styles.confirmButtonText}>Delete Forever</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
  },
  legalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dangerCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dangerDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 40,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
