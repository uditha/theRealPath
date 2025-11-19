import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { rippleAnimation } from '../../utils/gardenAnimations';
import { EmotionType, getEmotion } from '../../utils/emotions';

interface PondRippleProps {
  emotion: EmotionType;
  onComplete?: () => void;
}

/**
 * Individual ripple animation that expands from center
 * Appears when an emotion is tapped
 */
const PondRipple: React.FC<PondRippleProps> = ({ emotion, onComplete }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const emotionDef = getEmotion(emotion);
  const color = emotionDef.color;

  useEffect(() => {
    rippleAnimation(scaleAnim, opacityAnim, { duration: 800 }).start(() => {
      onComplete?.();
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.ripple,
          {
            width: 200,
            height: 200,
            borderRadius: 100,
            borderWidth: 3,
            borderColor: color,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.rippleInner,
          {
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: `${color}33`,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  ripple: {
    position: 'absolute',
  },
  rippleInner: {
    position: 'absolute',
  },
});

export default PondRipple;


