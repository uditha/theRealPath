import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GardenElement from './GardenElement';
import { EmotionType } from '../../../utils/emotions';
import { getEmotion } from '../../../utils/emotions';

interface GardenFlowerProps {
  emotion: EmotionType;
  size?: number;
  animated?: boolean;
  delay?: number;
  style?: any;
}

/**
 * Joy - Yellow flower with sunbeam
 */
const GardenFlower: React.FC<GardenFlowerProps> = ({
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
      {/* Sunbeam rays */}
      <View style={[styles.rayContainer, { width: size * 1.5, height: size * 1.5 }]}>
        {[0, 45, 90, 135].map((rotation) => (
          <View
            key={rotation}
            style={[
              styles.ray,
              {
                width: size * 0.3,
                height: size * 0.15,
                backgroundColor: color,
                opacity: 0.3,
                transform: [{ rotate: `${rotation}deg` }],
              },
            ]}
          />
        ))}
      </View>
      
      {/* Flower petals */}
      <View style={[styles.flowerContainer, { width: size, height: size }]}>
        {/* Center */}
        <View
          style={[
            styles.center,
            {
              width: size * 0.3,
              height: size * 0.3,
              backgroundColor: color,
              borderRadius: size * 0.15,
            },
          ]}
        />
        
        {/* Petals */}
        {[0, 60, 120, 180, 240, 300].map((rotation) => (
          <View
            key={rotation}
            style={[
              styles.petal,
              {
                width: size * 0.4,
                height: size * 0.3,
                transform: [{ rotate: `${rotation}deg` }],
              },
            ]}
          >
            <LinearGradient
              colors={[color, `${color}CC`]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
        ))}
      </View>
    </GardenElement>
  );
};

const styles = StyleSheet.create({
  rayContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ray: {
    position: 'absolute',
    borderRadius: 2,
  },
  flowerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    zIndex: 2,
  },
  petal: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.9,
  },
});

export default GardenFlower;


