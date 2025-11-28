import { Tabs, Redirect } from 'expo-router';
import { Home, Dumbbell, TrendingUp, User, Calendar, Activity } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/lib/useResponsive';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { session, loading } = useAuth();
  const { colors, isDark } = useTheme();
  const { isTablet } = useResponsive();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Add a safety check to ensure colors is defined
  if (!colors) {
    return null;
  }

  // Calculate responsive tab bar dimensions
  const tabBarHeight = isTablet ? 80 : 60;
  const iconSize = isTablet ? 28 : 24;
  const iconWrapperWidth = isTablet ? 32 : 28;
  const labelFontSize = isTablet ? 14 : 12;
  
  // Account for device navigation bar (safe area)
  const tabBarPaddingBottom = Math.max(insets.bottom, 8);

  const renderIcon =
    (IconComponent: typeof Home) =>
    ({ color }: { color: string }) =>
      (
        <View style={{ width: iconWrapperWidth, alignItems: 'center', justifyContent: 'center' }}>
          <IconComponent size={iconSize} color={color} />
        </View>
      );

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: tabBarHeight + tabBarPaddingBottom,
            paddingBottom: tabBarPaddingBottom,
            paddingTop: isTablet ? 12 : 8,
            paddingHorizontal: 0,
          },
          tabBarLabelStyle: {
            fontSize: labelFontSize,
            fontWeight: '600',
            marginBottom: 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
          tabBarItemStyle: {
            flex: 1, // Evenly distribute each tab across the bar
            flexBasis: 0, // Ignore intrinsic width of icon/label
            minWidth: 0, // Allow full shrinking so all 6 fit edge-to-edge
            alignItems: 'center',
            paddingHorizontal: 0,
            marginHorizontal: 0,
            gap: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: renderIcon(Home),
          }}
        />
        <Tabs.Screen
          name="training"
          options={{
            title: 'Training',
            tabBarIcon: renderIcon(Dumbbell),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            tabBarIcon: renderIcon(Calendar),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: renderIcon(TrendingUp),
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: 'Activity',
            tabBarIcon: renderIcon(Activity),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: renderIcon(User),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
