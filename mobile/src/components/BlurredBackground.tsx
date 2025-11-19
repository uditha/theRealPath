import React from 'react';
import { View, StyleSheet, ImageBackground, Image } from 'react-native';
import { WorldTheme } from '../utils/worldThemes';

interface BlurredBackgroundProps {
  theme: WorldTheme;
  imageUrl?: string | null;
  style?: any;
  children?: React.ReactNode;
  blurIntensity?: number;
}

/**
 * Blurred background component for lesson screens
 * Uses the world background image with a blur effect
 */
export default function BlurredBackground({ 
  theme, 
  imageUrl, 
  style, 
  children,
  blurIntensity = 8 
}: BlurredBackgroundProps) {
  const backgroundImage = imageUrl || theme.backgroundImage;

  // If we have a background image, use it with blur effect
  if (backgroundImage) {
    return (
      <View style={[styles.container, style]}>
        <ImageBackground
          source={{ uri: backgroundImage }}
          style={styles.backgroundImage}
          resizeMode="cover"
          blurRadius={blurIntensity}
        >
          {/* Gradient overlay for better text readability */}
          <View style={styles.gradientOverlay} />
          {children}
        </ImageBackground>
      </View>
    );
  }

  // Fallback to gradient
  const colors = theme.backgroundGradient;
  return (
    <View style={[styles.container, { backgroundColor: colors[0] }, style]}>
      <View style={[styles.gradientLayer1, { backgroundColor: colors[1], opacity: 0.6 }]} />
      <View style={[styles.gradientLayer2, { backgroundColor: colors[2] || colors[1], opacity: 0.4 }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // White overlay for better text readability
  },
  gradientLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  gradientLayer2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
});

