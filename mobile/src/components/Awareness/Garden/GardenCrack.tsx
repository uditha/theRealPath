import React from 'react';
import { View, StyleSheet } from 'react-native';
import GardenElement from './GardenElement';
import { EmotionType } from '../../../utils/emotions';
import { getEmotion } from '../../../utils/emotions';

interface GardenCrackProps {
  emotion: EmotionType;
  size?: number;
  animated?: boolean;
  delay?: number;
  style?: any;
}

/**
 * Aversion - Dry cracked earth
 */
const GardenCrack: React.FC<GardenCrackProps> = ({
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
        {/* Crack lines */}
        {[
          { startX: 0.2, startY: 0.3, endX: 0.8, endY: 0.7 },
          { startX: 0.4, startY: 0.1, endX: 0.6, endY: 0.9 },
          { startX: 0.7, startY: 0.2, endX: 0.3, endY: 0.8 },
        ].map((crack, index) => {
          const length = Math.sqrt(
            Math.pow((crack.endX - crack.startX) * size, 2) +
              Math.pow((crack.endY - crack.startY) * size, 2)
          );
          const angle =
            Math.atan2(
              (crack.endY - crack.startY) * size,
              (crack.endX - crack.startX) * size
            ) *
            (180 / Math.PI);

          return (
            <View
              key={index}
              style={[
                styles.crack,
                {
                  width: length,
                  height: 2,
                  backgroundColor: `${color}AA`,
                  left: crack.startX * size,
                  top: crack.startY * size,
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: 'left center',
                },
              ]}
            />
          );
        })}
        
        {/* Dust particles */}
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.dust,
              {
                width: size * 0.08,
                height: size * 0.08,
                borderRadius: size * 0.04,
                backgroundColor: `${color}88`,
                left: (0.3 + index * 0.2) * size,
                top: (0.2 + index * 0.3) * size,
              },
            ]}
          />
        ))}
      </View>
    </GardenElement>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  crack: {
    position: 'absolute',
  },
  dust: {
    position: 'absolute',
  },
});

export default GardenCrack;


