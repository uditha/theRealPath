import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { EmotionType } from '../../utils/emotions';
import { getEmotion } from '../../utils/emotions';

interface EmotionPebbleProps {
  emotion: EmotionType;
  timestamp: number;
  ageInHours: number;
  onPress?: () => void;
  onLongPress?: () => void;
}

const EmotionPebble = React.memo(function EmotionPebble({
  emotion,
  timestamp,
  ageInHours,
  onPress,
  onLongPress,
}: EmotionPebbleProps) {
  const emotionDef = getEmotion(emotion);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  // Calculate opacity based on age (impermanence - fade over 7 days)
  const baseOpacity = Math.max(0.3, 1 - ageInHours / (7 * 24));

  useEffect(() => {
    // Ripple in animation on mount
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rippleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Set opacity based on age
    opacityAnim.setValue(baseOpacity);
  }, []);

  // Pulse animation (heartbeat effect)
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: baseOpacity * 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: baseOpacity,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [baseOpacity]);

  const handlePress = () => {
    onPress?.();
  };

  const handleLongPress = () => {
    onLongPress?.();
  };

  // Deterministic size based on timestamp for consistency
  const size = 12 + ((timestamp % 7) * 0.8); // Organic variance: 12-18px
  const rotation = ((timestamp % 11) - 5) * 1.5; // Slight rotation for natural feel

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.2, 0],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={styles.container}
      accessibilityLabel={`${emotionDef.labelEn} pebble`}
      accessibilityRole="button"
    >
      {/* Ripple effect */}
      <Animated.View
        style={[
          styles.ripple,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: emotionDef.color,
            opacity: rippleOpacity,
            transform: [{ scale: rippleScale }],
          },
        ]}
      />
      
      {/* Pebble */}
      <Animated.View
        style={[
          styles.pebble,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: emotionDef.color,
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { rotate: `${rotation}deg` },
            ],
          },
        ]}
      />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    margin: 2,
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  pebble: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default EmotionPebble;

