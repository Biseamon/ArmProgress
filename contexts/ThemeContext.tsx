/**
 * Theme Context
 *
 * Manages light/dark theme throughout the app.
 * Theme preference is persisted in local storage.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

// Theme type: either 'light' or 'dark'
export type Theme = 'light' | 'dark';

/**
 * Color definitions for the app
 * Each property represents a semantic color used throughout the UI
 */
export type ThemeColors = {
  background: string;        // Main background color
  surface: string;           // Cards, modals, elevated surfaces
  surfaceSecondary: string;  // Secondary surface color
  text: string;              // Primary text color
  textSecondary: string;     // Secondary text (descriptions, labels)
  textTertiary: string;      // Tertiary text (placeholders, disabled)
  primary: string;           // Brand color (red)
  secondary: string;         // Secondary brand color (blue)
  border: string;            // Border color for inputs, cards
  success: string;           // Success state (green)
  warning: string;           // Warning state (yellow)
  error: string;             // Error state (red)
  premium: string;           // Premium badge color (gold)
  cardBackground: string;    // Background for cards
  cardText: string;          // Text color on cards
  modalBackground: string;   // Background for modals
  modalText: string;         // Text color in modals
};

/**
 * Light Theme Colors
 * Used when user selects light mode
 */
const lightTheme: ThemeColors = {
  background: '#F5F5F5',        // Light gray background
  surface: '#FFFFFF',           // White surfaces
  surfaceSecondary: '#F0F0F0',
  text: '#1A1A1A',              // Almost black text
  textSecondary: '#666666',     // Gray text
  textTertiary: '#999999',      // Light gray text
  primary: '#E63946',           // Red (brand color)
  secondary: '#2A7DE1',         // Blue
  border: '#E0E0E0',            // Light gray borders
  success: '#4CAF50',           // Green
  warning: '#FFD700',           // Gold
  error: '#FF6B6B',             // Light red
  premium: '#FFD700',           // Gold
  cardBackground: '#FFFFFF',
  cardText: '#1A1A1A',
  modalBackground: '#2A2A2A',
  modalText: '#FFFFFF',
};

/**
 * Dark Theme Colors
 * Used when user selects dark mode (default)
 */
const darkTheme: ThemeColors = {
  background: '#1A1A1A',        // Dark gray/black background
  surface: '#2A2A2A',           // Lighter dark gray surfaces
  surfaceSecondary: '#1A1A1A',
  text: '#FFFFFF',              // White text
  textSecondary: '#CCCCCC',     // Light gray text
  textTertiary: '#999999',      // Medium gray text
  primary: '#E63946',           // Red (same as light)
  secondary: '#2A7DE1',         // Blue (same as light)
  border: '#333333',            // Dark gray borders
  success: '#4CAF50',           // Green
  warning: '#FFD700',           // Gold
  error: '#FF6B6B',             // Light red
  premium: '#FFD700',           // Gold
  cardBackground: '#2A2A2A',
  cardText: '#FFFFFF',
  modalBackground: '#2A2A2A',
  modalText: '#FFFFFF',
};

/**
 * Type definition for theme context
 */
type ThemeContextType = {
  theme: Theme;                 // Current theme ('light' or 'dark')
  colors: ThemeColors;          // Current color palette
  toggleTheme: () => void;      // Function to switch themes
  isDark: boolean;              // Quick check if dark theme is active
};

// Create the theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage key for persisting theme preference
const THEME_STORAGE_KEY = '@armprogress_theme';

/**
 * Cross-platform storage utility
 * Uses localStorage on web, AsyncStorage on mobile
 */
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(key, value);
  },
};

/**
 * ThemeProvider Component
 *
 * Wraps the app to provide theme state and functions to all child components.
 * Automatically loads saved theme preference on app startup.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // State: Current theme ('dark' is default)
  const [theme, setTheme] = useState<Theme>('dark');

  /**
   * Effect: Load saved theme preference on app startup
   */
  useEffect(() => {
    loadTheme();
  }, []);

  /**
   * Load theme preference from storage
   * Falls back to 'dark' if no saved preference exists
   */
  const loadTheme = async () => {
    try {
      const savedTheme = await storage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  /**
   * Toggle between light and dark themes
   * Saves preference to storage for persistence
   */
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await storage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  // Get the appropriate color palette based on current theme
  const colors = theme === 'light' ? lightTheme : darkTheme;

  // Provide theme state and functions to all child components
  return (
    <ThemeContext.Provider
      value={{
        theme,        // Current theme name
        colors,       // Current color palette
        toggleTheme,  // Function to switch themes
        isDark: theme === 'dark',  // Quick boolean check
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme Hook
 *
 * Custom hook to access theme context from any component.
 * Must be used within a ThemeProvider.
 *
 * @example
 * const { theme, colors, toggleTheme, isDark } = useTheme();
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
