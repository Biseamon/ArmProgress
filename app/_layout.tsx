import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { RevenueCatProvider } from '@/contexts/RevenueCatContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { queryClient } from '@/lib/react-query';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isDark } = useTheme();
  const { profile, loading } = useAuth();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    // Update status bar when theme changes
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
  }, [isDark]);

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for auth to complete
        if (!loading) {
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, [loading]);

  useEffect(() => {
    // Hide splash screen once app is ready
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Show native loading state while app initializes
  if (!appIsReady) {
    return null; // Splash screen will show
  }

  return (
    <RevenueCatProvider userId={profile?.id}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </RevenueCatProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SyncProvider>
            <AppContent />
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
