import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { WorldTheme } from '../utils/worldThemes';

const { width, height } = Dimensions.get('window');

interface AnimatedBackgroundProps {
  theme: WorldTheme;
  style?: any;
}

/**
 * Animated background component with particles based on world theme
 */
export default function AnimatedBackground({ theme, style }: AnimatedBackgroundProps) {
  const particles = useRef<Animated.Value[]>([]);
  const cloudAnim = useRef(new Animated.Value(0));

  const animationRefs = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    // Cleanup previous animations
    animationRefs.current.forEach(anim => anim.stop());
    animationRefs.current = [];

    // Create particles based on theme - reduced from 8 to 4 for better performance
    const particleCount = theme.particles?.type === 'none' ? 0 : 4;
    particles.current = Array.from({ length: particleCount }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(0.3 + Math.random() * 0.4),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
    }));

    // Animate particles
    if (theme.particles?.type === 'leaves' || theme.particles?.type === 'petals') {
      particles.current.forEach((particle, index) => {
        const animation = Animated.loop(
          Animated.parallel([
            Animated.timing(particle.x, {
              toValue: Math.random() * width,
              duration: 10000 + Math.random() * 5000,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(particle.y, {
                toValue: height + 50,
                duration: 8000 + Math.random() * 4000,
                useNativeDriver: true,
              }),
              Animated.timing(particle.y, {
                toValue: -50,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
            Animated.loop(
              Animated.sequence([
                Animated.timing(particle.opacity, {
                  toValue: 0.7,
                  duration: 2000,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.opacity, {
                  toValue: 0.3,
                  duration: 2000,
                  useNativeDriver: true,
                }),
              ])
            ),
          ])
        );
        animationRefs.current.push(animation);
        animation.start();
      });
    }

    // Animate clouds
    if (theme.particles?.type === 'clouds') {
      const cloudAnimation = Animated.loop(
        Animated.timing(cloudAnim.current, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      );
      animationRefs.current.push(cloudAnimation);
      cloudAnimation.start();
    }

    // Cleanup on unmount
    return () => {
      animationRefs.current.forEach(anim => anim.stop());
      animationRefs.current = [];
    };
  }, [theme]);

  const cloudTranslateX = cloudAnim.current.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.3],
  });

  return (
    <View style={[styles.container, style]}>
      {/* Gradient Background - Using solid color for now, can be enhanced with LinearGradient */}
      <View
        style={[
          styles.gradient,
          {
            backgroundColor: theme.backgroundGradient[0],
          },
        ]}
      />

      {/* Particles */}
      {theme.particles?.type !== 'none' &&
        particles.current.map((particle, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                backgroundColor: theme.particles?.color || theme.primaryColor,
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { scale: particle.scale },
                ],
                opacity: particle.opacity,
              },
            ]}
          />
        ))}

      {/* Clouds */}
      {theme.particles?.type === 'clouds' && (
        <>
          <Animated.View
            style={[
              styles.cloud,
              {
                backgroundColor: theme.particles?.color || '#FFFFFF',
                transform: [{ translateX: cloudTranslateX }],
                opacity: 0.4,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.cloud,
              {
                backgroundColor: theme.particles?.color || '#FFFFFF',
                transform: [
                  {
                    translateX: Animated.add(
                      cloudTranslateX,
                      new Animated.Value(width * 0.5)
                    ),
                  },
                ],
                opacity: 0.3,
                top: height * 0.2,
              },
            ]}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cloud: {
    position: 'absolute',
    width: 100,
    height: 40,
    borderRadius: 50,
    top: height * 0.1,
  },
});




