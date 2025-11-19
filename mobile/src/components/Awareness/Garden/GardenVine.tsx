import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GardenElement from './GardenElement';
import { EmotionType } from '../../../utils/emotions';
import { getEmotion } from '../../../utils/emotions';

interface GardenVineProps {
  emotion: EmotionType;
  size?: number;
  animated?: boolean;
  delay?: number;
  style?: any;
}

/**
 * Craving - Green twisting vine
 */
const GardenVine: React.FC<GardenVineProps> = ({
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
        {/* Main vine stem */}
        <View
          style={[
            styles.stem,
            {
              width: size * 0.15,
              height: size * 0.8,
              backgroundColor: color,
              borderRadius: size * 0.075,
              left: size * 0.4,
              top: size * 0.1,
            },
          ]}
        />
        
        {/* Twisting tendrils */}
        {[0, 1, 2].map((index) => {
          const angle = index * 45 - 45;
          const offsetX = Math.cos((angle * Math.PI) / 180) * size * 0.25;
          const offsetY = Math.sin((angle * Math.PI) / 180) * size * 0.25;
          
          return (
            <View
              key={index}
              style={[
                styles.tendril,
                {
                  width: size * 0.1,
                  height: size * 0.3,
                  backgroundColor: color,
                  borderRadius: size * 0.05,
                  left: size * 0.45 + offsetX,
                  top: size * 0.3 + offsetY,
                  transform: [{ rotate: `${angle}deg` }],
                },
              ]}
            />
          );
        })}
        
        {/* Leaves */}
        {[0, 1].map((index) => (
          <View
            key={index}
            style={[
              styles.leaf,
              {
                width: size * 0.3,
                height: size * 0.2,
                left: index === 0 ? size * 0.2 : size * 0.5,
                top: size * 0.4 + index * size * 0.2,
              },
            ]}
          >
            <LinearGradient
              colors={[color, `${color}DD`]}
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
  container: {
    position: 'relative',
  },
  stem: {
    position: 'absolute',
  },
  tendril: {
    position: 'absolute',
  },
  leaf: {
    position: 'absolute',
    borderRadius: 50,
  },
});

export default GardenVine;


