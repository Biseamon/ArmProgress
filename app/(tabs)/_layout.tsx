import React, { useEffect, useRef } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Home, Dumbbell, TrendingUp, User, Calendar, Activity } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/lib/useResponsive';
import { View, ActivityIndicator, StyleSheet, StatusBar, Animated } from 'react-native';
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
  const tabBarHeight = isTablet ? 55 : 35;
  const iconSize = isTablet ? 32 : 28;
  const labelFontSize = isTablet ? 14 : 12;
  
  // Account for device navigation bar (safe area)
  const tabBarPaddingBottom = Math.max(insets.bottom, 8);

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
            paddingLeft: 0,
            paddingRight: 0,
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
            width: '16.666667%', // Exactly 1/6 of screen width for 6 tabs
            paddingHorizontal: 0,
            marginHorizontal: 0,
            gap: 0,
            justifyContent: 'space-evenly'
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon IconComponent={Home} color={color} size={iconSize} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="training"
          options={{
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                IconComponent={Dumbbell}
                color={color}
                size={iconSize}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                IconComponent={Calendar}
                color={color}
                size={iconSize}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                IconComponent={TrendingUp}
                color={color}
                size={iconSize}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                IconComponent={Activity}
                color={color}
                size={iconSize}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon IconComponent={User} color={color} size={iconSize} focused={focused} />
            ),
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

type AnimatedTabIconProps = {
  IconComponent: typeof Home;
  color: string;
  size: number;
  focused: boolean;
};

function AnimatedTabIcon({ IconComponent, color, size, focused }: AnimatedTabIconProps) {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      stiffness: 240,
      damping: 22,
      mass: 0.9,
    }).start();
  }, [anim, focused]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <Animated.View style={{ transform: [{ scale }, { translateY }], opacity }}>
      <IconComponent size={size} color={color} />
    </Animated.View>
  );
}
