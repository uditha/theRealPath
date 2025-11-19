import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { growAnimation, fadeInAnimation } from '../../../utils/gardenAnimations';

interface GardenElementProps {
  children: React.ReactNode;
  size?: number;
  color?: string;
  animated?: boolean;
  delay?: number;
  style?: any;
}

/**
 * Base component for all garden elements
 * Provides common animations (grow, fade-in) and styling
 */
const GardenElement: React.FC<GardenElementProps> = ({
  children,
  size = 24,
  color,
  animated = true,
  delay = 0,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      growAnimation(scaleAnim, { delay, duration: 400 }).start();
      fadeInAnimation(opacityAnim, { delay, duration: 400 }).start();
    } else {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [animated, delay]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GardenElement;


