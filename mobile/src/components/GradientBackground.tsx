import React, { useState } from 'react';
import { View, StyleSheet, Image, ImageBackground, ActivityIndicator } from 'react-native';
import { WorldTheme } from '../utils/worldThemes';

interface GradientBackgroundProps {
  theme: WorldTheme;
  style?: any;
  children?: React.ReactNode;
}

/**
 * Background component that supports both images and gradients
 * If backgroundImage is provided, it uses that; otherwise falls back to gradient
 */
export default function GradientBackground({ theme, style, children }: GradientBackgroundProps) {
  const colors = theme.backgroundGradient;
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // If background image is provided, use ImageBackground
  if (theme.backgroundImage && !imageError) {
    return (
      <ImageBackground
        source={{ uri: theme.backgroundImage }}
        style={[styles.container, style]}
        imageStyle={[styles.backgroundImage, { opacity: imageLoading ? 0 : 1 }]}
        resizeMode="cover"
        onLoadStart={() => {
          setImageLoading(true);
        }}
        onLoadEnd={() => {
          setImageLoading(false);
        }}
        onError={(error) => {
          setImageError(true);
          setImageLoading(false);
        }}
      >
        {/* Loading indicator */}
        {imageLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}
        {/* Overlay for better text readability */}
        <View style={styles.imageOverlay} />
        {children}
      </ImageBackground>
    );
  }

  // Otherwise, use enhanced gradient layers for better visual appeal
  return (
    <View style={[styles.container, { backgroundColor: colors[0] }, style]}>
      {/* Multiple gradient layers for depth and richness */}
      <View
        style={[
          styles.layer1,
          {
            backgroundColor: colors[1],
            opacity: 0.7,
          },
        ]}
      />
      <View
        style={[
          styles.layer2,
          {
            backgroundColor: colors[2] || colors[1],
            opacity: 0.5,
          },
        ]}
      />
      {/* Additional subtle radial gradient effect */}
      <View
        style={[
          styles.radialGradient,
          {
            backgroundColor: colors[1] || colors[0],
            opacity: 0.3,
          },
        ]}
      />
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
    opacity: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Very subtle overlay for better text readability
  },
  layer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  layer2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  radialGradient: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    width: '80%',
    height: '60%',
    borderRadius: 1000,
    transform: [{ translateX: -200 }],
  },
});

