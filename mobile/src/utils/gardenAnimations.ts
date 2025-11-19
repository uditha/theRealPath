import { Animated } from 'react-native';

/**
 * Animation utilities for garden elements
 * All animations use React Native Animated API (no external dependencies)
 */

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  useNativeDriver?: boolean;
}

const DEFAULT_DURATION = 400;
const DEFAULT_DELAY = 0;

/**
 * Grow animation: scale from 0 to 1 with ease-out
 */
export const growAnimation = (
  animatedValue: Animated.Value,
  config: AnimationConfig = {}
): Animated.CompositeAnimation => {
  const { duration = DEFAULT_DURATION, delay = DEFAULT_DELAY, useNativeDriver = true } = config;
  
  animatedValue.setValue(0);
  
  return Animated.sequence([
    Animated.delay(delay),
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      useNativeDriver,
    }),
  ]);
};

/**
 * Fade in animation: opacity from 0 to 1
 */
export const fadeInAnimation = (
  animatedValue: Animated.Value,
  config: AnimationConfig = {}
): Animated.CompositeAnimation => {
  const { duration = DEFAULT_DURATION, delay = DEFAULT_DELAY, useNativeDriver = true } = config;
  
  animatedValue.setValue(0);
  
  return Animated.sequence([
    Animated.delay(delay),
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      useNativeDriver,
    }),
  ]);
};

/**
 * Ripple animation: expanding circle effect
 */
export const rippleAnimation = (
  scaleValue: Animated.Value,
  opacityValue: Animated.Value,
  config: AnimationConfig = {}
): Animated.CompositeAnimation => {
  const { duration = 600, delay = DEFAULT_DELAY, useNativeDriver = true } = config;
  
  scaleValue.setValue(0);
  opacityValue.setValue(1);
  
  return Animated.sequence([
    Animated.delay(delay),
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 2,
        duration,
        useNativeDriver,
      }),
      Animated.timing(opacityValue, {
        toValue: 0,
        duration,
        useNativeDriver,
      }),
    ]),
  ]);
};

/**
 * Seed drop animation: drop from top with bounce
 */
export const seedDropAnimation = (
  translateY: Animated.Value,
  scale: Animated.Value,
  config: AnimationConfig = {}
): Animated.CompositeAnimation => {
  const { duration = 500, delay = DEFAULT_DELAY, useNativeDriver = true } = config;
  
  translateY.setValue(-100);
  scale.setValue(0.5);
  
  return Animated.sequence([
    Animated.delay(delay),
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver,
      }),
    ]),
  ]);
};

/**
 * Weather transition: smooth fade and scale
 */
export const weatherTransition = (
  opacity: Animated.Value,
  scale: Animated.Value,
  config: AnimationConfig = {}
): Animated.CompositeAnimation => {
  const { duration = 300, delay = DEFAULT_DELAY, useNativeDriver = true } = config;
  
  opacity.setValue(0);
  scale.setValue(0.9);
  
  return Animated.sequence([
    Animated.delay(delay),
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration,
        useNativeDriver,
      }),
    ]),
  ]);
};

/**
 * Gentle pulse animation for living elements
 */
export const pulseAnimation = (
  scaleValue: Animated.Value,
  config: AnimationConfig = {}
): Animated.CompositeAnimation => {
  const { duration = 2000, delay = DEFAULT_DELAY, useNativeDriver = true } = config;
  
  scaleValue.setValue(1);
  
  return Animated.loop(
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(scaleValue, {
        toValue: 1.05,
        duration: duration / 2,
        useNativeDriver,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: duration / 2,
        useNativeDriver,
      }),
    ])
  );
};


