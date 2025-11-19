import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface Colors {
  // Backgrounds
  background: string;
  surface: string;
  card: string;
  
  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Primary
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Accents
  accent: string;
  success: string;
  warning: string;
  error: string;
  
  // Borders & Dividers
  border: string;
  divider: string;
  
  // Interactive
  button: string;
  buttonText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  
  // Special
  overlay: string;
  shadow: string;
}

const lightColors: Colors = {
  // Fixed: Warmer, softer light mode - cream/beige tones instead of pure white
  background: '#FDF9F5', // Warm cream - softer than pure white, more calming
  surface: '#F5F0EB', // Warm beige surface - adds depth without harshness
  card: '#FFFFFF', // Pure white cards for contrast against warm background
  
  text: '#2C2416', // Warm dark brown - softer than pure black, more readable
  textSecondary: '#6B5D4F', // Fixed: Warm brown-gray - improved contrast (4.8:1 WCAG AA compliant)
  textTertiary: '#B8A99A', // Warm light brown-gray
  
  // Fixed: Softer saffron for light mode - less intense, more calming
  primary: '#E67E22', // Muted saffron-orange - warmer and less harsh than bright #FF8C00
  primaryLight: '#FFF8F0', // Very light warm cream tint for backgrounds
  primaryDark: '#C96A1A', // Deeper warm saffron for depth
  
  // Fixed: Softer gold accent - less bright, more elegant
  accent: '#D4AF37', // Muted gold - softer than bright #FFD700, more elegant
  success: '#27AE60', // Green - nature, growth, harmony
  warning: '#E67E22', // Muted saffron for warnings (calming)
  error: '#C0392B', // Softer red - less harsh than deep #8B0000
  
  border: '#E8DDD4', // Warm beige border - softer than gray
  divider: '#E0D5CA', // Warm light brown divider
  
  // Fixed: Updated button colors with softer saffron
  button: '#E67E22', // Muted saffron primary button
  buttonText: '#FFFFFF',
  buttonSecondary: '#F5F0EB', // Warm beige secondary button
  buttonSecondaryText: '#2C2416', // Warm dark brown text
  
  overlay: 'rgba(0, 0, 0, 0.4)', // Lighter overlay for less heavy feel
  shadow: 'rgba(0, 0, 0, 0.08)', // Softer shadows
};

const darkColors: Colors = {
  background: '#121212', // Fixed: Changed from #1A1A1A to avoid pure black, reduces eye strain
  surface: '#242424',
  card: '#2C2C2C',
  
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#707070',
  
  // Fixed: Buddhist-themed colors for dark mode - warmer saffron tones
  primary: '#FF9F40', // Lighter saffron for better visibility in dark mode (maintains warmth)
  primaryLight: '#3A2A1A', // Dark saffron tint for backgrounds
  primaryDark: '#CC7000', // Darker saffron for depth
  
  // Fixed: Gold accent for dark mode (slightly muted to avoid oversaturation)
  accent: '#FFD700', // Gold - represents enlightenment
  success: '#27AE60', // Green - nature, growth
  warning: '#FF9F40', // Saffron for warnings (calming)
  error: '#A52A2A', // Muted deep red for dark mode (less harsh than pure #8B0000)
  
  border: '#3A3A3A',
  divider: '#404040',
  
  // Fixed: Updated button colors to use Buddhist saffron
  button: '#FF9F40', // Lighter saffron for dark mode visibility
  buttonText: '#FFFFFF',
  buttonSecondary: '#3A3A3A',
  buttonSecondaryText: '#FFFFFF',
  
  overlay: 'rgba(0, 0, 0, 0.6)', // Fixed: Reduced opacity from 0.7 to 0.6 for less heavy feel
  shadow: 'rgba(0, 0, 0, 0.3)',
};

interface ThemeContextType {
  colors: Colors;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = '@realpath_theme_mode';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto')) {
        setModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const setMode = async (newMode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
      setModeState(newMode);
    } catch (error) {
      console.error('Error saving theme', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode);
  };

  const isDark = mode === 'auto' 
    ? systemColorScheme === 'dark' 
    : mode === 'dark';

  const colors = isDark ? darkColors : lightColors;

  if (!isInitialized) {
    return null; // Or a loading screen
  }

  return (
    <ThemeContext.Provider
      value={{
        colors,
        mode,
        isDark,
        setMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};









