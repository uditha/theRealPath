import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GardenElement from './GardenElement';
import { EmotionType } from '../../../utils/emotions';
import { getEmotion } from '../../../utils/emotions';

interface GardenDropletProps {
  emotion: EmotionType;
  size?: number;
  animated?: boolean;
  delay?: number;
  style?: any;
}

/**
 * Sadness - Blue teardrop
 */
const GardenDroplet: React.FC<GardenDropletProps> = ({
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
      <View style={[styles.container, { width: size, height: size * 1.2 }]}>
        <LinearGradient
          colors={[`${color}E6`, `${color}CC`, color]}
          style={[
            styles.droplet,
            {
              width: size * 0.7,
              height: size * 0.9,
              borderRadius: size * 0.35,
            },
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          {/* Highlight */}
          <View
            style={[
              styles.highlight,
              {
                width: size * 0.2,
                height: size * 0.2,
                borderRadius: size * 0.1,
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                top: size * 0.15,
                left: size * 0.2,
              },
            ]}
          />
        </LinearGradient>
      </View>
    </GardenElement>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  droplet: {
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
  },
});

export default GardenDroplet;


