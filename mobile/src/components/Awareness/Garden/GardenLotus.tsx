import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GardenElement from './GardenElement';
import { EmotionType } from '../../../utils/emotions';
import { getEmotion } from '../../../utils/emotions';

interface GardenLotusProps {
  emotion: EmotionType;
  size?: number;
  animated?: boolean;
  delay?: number;
  style?: any;
}

/**
 * Calmness/Equanimity/Peace - Lotus petals
 */
const GardenLotus: React.FC<GardenLotusProps> = ({
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
        {/* Outer petals */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((rotation) => (
          <View
            key={rotation}
            style={[
              styles.outerPetal,
              {
                width: size * 0.35,
                height: size * 0.25,
                transform: [{ rotate: `${rotation}deg` }],
              },
            ]}
          >
            <LinearGradient
              colors={[`${color}E6`, `${color}CC`]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
        ))}
        
        {/* Inner petals */}
        {[0, 72, 144, 216, 288].map((rotation) => (
          <View
            key={rotation}
            style={[
              styles.innerPetal,
              {
                width: size * 0.25,
                height: size * 0.2,
                transform: [{ rotate: `${rotation}deg` }],
              },
            ]}
          >
            <LinearGradient
              colors={[`${color}FF`, `${color}DD`]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
        ))}
        
        {/* Center */}
        <View
          style={[
            styles.center,
            {
              width: size * 0.2,
              height: size * 0.2,
              borderRadius: size * 0.1,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </GardenElement>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerPetal: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.9,
  },
  innerPetal: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.95,
  },
  center: {
    position: 'absolute',
    zIndex: 3,
  },
});

export default GardenLotus;


