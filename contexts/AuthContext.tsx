/**
 * Authentication Context
 *
 * This file manages user authentication and profile data throughout the app.
 * It provides login, signup, logout functionality and maintains the current user's session.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase, Profile } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import { getProfile } from '@/lib/db/queries/profile';

/**
 * Type definition for the authentication context
 * Defines all available authentication functions and state
 */
type AuthContextType = {
  session: Session | null;           // Current user session from Supabase
  profile: Profile | null;            // User profile data from database
  loading: boolean;                   // Loading state during initial auth check
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
  signInWithFacebook: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>; // Send password reset email
  updatePassword: (newPassword: string) => Promise<{ error: any }>; // Update user's password
  isPremium: boolean;                 // Whether user has premium access
  refreshProfile: () => Promise<void>; // Manually refresh profile data
};

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 *
 * Wraps the app to provide authentication state and functions to all child components.
 * Automatically handles session persistence and profile fetching.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State: Current Supabase session (contains user ID, email, etc.)
  const [session, setSession] = useState<Session | null>(null);

  // State: User profile from database (contains full_name, is_premium, weight_unit, etc.)
  const [profile, setProfile] = useState<Profile | null>(null);

  // State: Loading indicator for initial authentication check
  const [loading, setLoading] = useState(true);

  /**
   * Fetch user profile from database
   * Called after successful authentication to load user data
   * If offline, loads from SQLite cache instead
   */
  const fetchProfile = async (userId: string, forceOffline = false) => {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    const isOnline = netInfo.isConnected && !forceOffline;

    if (isOnline) {
      // Online: fetch from Supabase
      console.log('[AuthContext] Fetching profile from Supabase...');
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Returns null if no profile found (won't throw error)

      if (data) {
        console.log('[AuthContext] Profile fetched, weight_unit:', data.weight_unit);
        console.log('[AuthContext] Avatar URL:', data.avatar_url);
        setProfile(data);
      } else {
        console.log('[AuthContext] No profile data returned');
      }
    } else {
      // Offline: load from SQLite cache
      console.log('[AuthContext] Offline mode - loading profile from SQLite cache...');
      try {
        const cachedProfile = await getProfile(userId);
        if (cachedProfile) {
          console.log('[AuthContext] Profile loaded from cache, weight_unit:', cachedProfile.weight_unit);
          setProfile(cachedProfile);
        } else {
          console.log('[AuthContext] No cached profile found in SQLite');
        }
      } catch (error) {
        console.error('[AuthContext] Failed to load cached profile:', error);
      }
    }
  };

  /**
   * Effect: Initialize authentication on app startup
   *
   * 1. Checks network connectivity
   * 2. If offline, loads cached session and profile from local storage/SQLite
   * 3. If online, retrieves session from Supabase (validates tokens)
   * 4. Sets up a listener for auth state changes (login, logout, token refresh)
   * 5. Fetches user profile when session is available
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check network connectivity
        const netInfo = await NetInfo.fetch();
        const isOnline = netInfo.isConnected;

        if (!isOnline) {
          // Offline mode: Try to load cached session from AsyncStorage
          console.log('[AuthContext] Offline mode detected - loading cached session...');

          try {
            // Supabase stores session in AsyncStorage, we can access it directly
            const { data: { session }, error } = await supabase.auth.getSession();

            if (session?.user && !error) {
              console.log('[AuthContext] Cached session found for user:', session.user.email);
              setSession(session);
              // Load profile from SQLite cache (forceOffline = true)
              await fetchProfile(session.user.id, true);
            } else {
              console.log('[AuthContext] No cached session available offline');
            }
          } catch (error) {
            console.log('[AuthContext] Failed to load cached session offline:', error);
          }

          setLoading(false);
        } else {
          // Online mode: Normal flow - validate session with Supabase
          console.log('[AuthContext] Online mode - validating session with Supabase...');
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('[AuthContext] Auth initialization error:', error);
        setLoading(false);
      }
    };

    // Initialize auth
    initAuth();

    // Listen for authentication state changes
    // This fires when user logs in, logs out, or token is refreshed
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        // User logged in - fetch their profile
        fetchProfile(session.user.id);
      } else {
        // User logged out - clear profile
        setProfile(null);
      }
      setLoading(false);
    });

    // Cleanup: Unsubscribe from auth listener when component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in an existing user
   * @param email - User's email address
   * @param password - User's password
   * @returns Object containing error if sign in failed
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  /**
   * Register a new user
   * @param email - New user's email
   * @param password - New user's password
   * @param fullName - New user's full name
   * @returns Object containing error if signup failed
   *
   * The profile is automatically created by a database trigger
   */
  const signUp = async (email: string, password: string, fullName: string) => {
    // Create authentication user in Supabase Auth
    // The database trigger will automatically create the profile
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName, // Pass full name to user metadata
        }
      }
    });

    return { error };
  };

  /**
   * Sign in with Google
   * Uses Supabase OAuth with Google provider
   */
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'armprogress:///(tabs)',
      },
    });
    return { error };
  };

  /**
   * Sign in with Apple
   * Uses Supabase OAuth with Apple provider
   */
  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'armprogress:///(tabs)',
      },
    });
    return { error };
  };

  /**
   * Sign in with Facebook
   * Uses Supabase OAuth with Facebook provider
   */
  const signInWithFacebook = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: 'armprogress:///(tabs)',
      },
    });
    return { error };
  };

  /**
   * Sign out the current user
   * Clears session and profile data
   */
  const signOut = async () => {
    console.log('[AuthContext] Signing out...');
    
    // Clear profile state first
    setProfile(null);
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    console.log('[AuthContext] Sign out complete');
  };

  /**
   * Send password reset email
   * @param email - User's email address
   * @returns Object containing error if reset failed
   *
   * Note: This only works for users who signed up with email/password.
   * OAuth users (Google, Facebook, Apple) should use their provider's recovery.
   */
  const resetPassword = async (email: string) => {
    // Determine the redirect URL based on environment
    // In Expo development, use the Expo redirect URL
    // In production, use the custom scheme
    let redirectTo: string;

    if (__DEV__ && Constants.expoConfig?.hostUri) {
      // Expo development mode - use makeRedirectUri to get the correct Expo URL
      redirectTo = AuthSession.makeRedirectUri({
        path: '(auth)/reset-password',
      });
      console.log('Using Expo redirect URL for password reset:', redirectTo);
    } else {
      // Production mode - use custom scheme
      redirectTo = 'armprogress://(auth)/reset-password';
      console.log('Using production redirect URL for password reset:', redirectTo);
    }

    console.log('Sending password reset email to:', email, 'with redirect:', redirectTo);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    return { error };
  };

  /**
   * Update user's password
   * @param newPassword - The new password
   * @returns Object containing error if update failed
   *
   * This should be called after the user clicks the reset link in their email
   * and is redirected back to the app.
   */
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  /**
   * Manually refresh the user's profile data
   * Useful after updating profile settings
   */
  const refreshProfile = async () => {
    console.log('[AuthContext] refreshProfile called');
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  // Log when avatar URL changes in profile state
  useEffect(() => {
    if (profile?.avatar_url) {
      console.log('[AuthContext] Profile avatar_url updated in state:', profile.avatar_url);
    }
  }, [profile?.avatar_url]);

  // Determine if user has premium access (either paid premium or test user)
  const isPremium = profile?.is_premium || profile?.is_test_user || false;

  // Memoize profile to prevent unnecessary re-renders in child components
  // This ensures profile object reference only changes when actual data changes
  const memoizedProfile = useMemo(() => profile, [
    profile?.id,
    profile?.email,
    profile?.full_name,
    profile?.avatar_url,
    profile?.weight_unit,
    profile?.is_premium,
    profile?.is_test_user,
    profile?.created_at,
    profile?.updated_at,
  ]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      session,
      profile: memoizedProfile,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      signInWithFacebook,
      signOut,
      resetPassword,
      updatePassword,
      isPremium,
      refreshProfile,
    }),
    [
      session,
      memoizedProfile,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      signInWithFacebook,
      signOut,
      resetPassword,
      updatePassword,
      isPremium,
      refreshProfile,
    ]
  );

  // Provide all auth state and functions to child components
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 *
 * Custom hook to access authentication context from any component.
 * Must be used within an AuthProvider.
 *
 * @example
 * const { session, profile, signIn, signOut } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
