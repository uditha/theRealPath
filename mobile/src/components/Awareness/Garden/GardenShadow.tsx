import React from 'react';
import { View, StyleSheet } from 'react-native';
import GardenElement from './GardenElement';
import { EmotionType } from '../../../utils/emotions';
import { getEmotion } from '../../../utils/emotions';

interface GardenShadowProps {
  emotion: EmotionType;
  size?: number;
  animated?: boolean;
  delay?: number;
  style?: any;
}

/**
 * Fear - Dark ripple/shadow
 */
const GardenShadow: React.FC<GardenShadowProps> = ({
  emotion,
  size = 24,
  animated = true,
  delay = 0,
  style,
}) => {
  const emotionDef = getEmotion(emotion);
  const color = emotionDef.color;

  return (
    <GardenElement size={size} animated={animated} delay={delay} style={style}>
      <View style={[styles.container, { width: size, height: size }]}>
        {/* Outer ripple */}
        <View
          style={[
            styles.ripple,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 2,
              borderColor: `${color}66`,
            },
          ]}
        />
        
        {/* Middle ripple */}
        <View
          style={[
            styles.ripple,
            {
              width: size * 0.7,
              height: size * 0.7,
              borderRadius: size * 0.35,
              borderWidth: 1.5,
              borderColor: `${color}88`,
            },
          ]}
        />
        
        {/* Center shadow */}
        <View
          style={[
            styles.center,
            {
              width: size * 0.4,
              height: size * 0.4,
              borderRadius: size * 0.2,
              backgroundColor: `${color}CC`,
            },
          ]}
        />
        
        {/* Eyes */}
        <View style={styles.eyesContainer}>
          <View
            style={[
              styles.eye,
              {
                width: size * 0.1,
                height: size * 0.1,
                borderRadius: size * 0.05,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                left: size * 0.25,
                top: size * 0.3,
              },
            ]}
          />
          <View
            style={[
              styles.eye,
              {
                width: size * 0.1,
                height: size * 0.1,
                borderRadius: size * 0.05,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                right: size * 0.25,
                top: size * 0.3,
              },
            ]}
          />
        </View>
      </View>
    </GardenElement>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
  },
  center: {
    position: 'absolute',
  },
  eyesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  eye: {
    position: 'absolute',
  },
});

export default GardenShadow;


