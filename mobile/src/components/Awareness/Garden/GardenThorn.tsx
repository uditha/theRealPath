import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GardenElement from './GardenElement';
import { EmotionType } from '../../../utils/emotions';
import { getEmotion } from '../../../utils/emotions';

interface GardenThornProps {
  emotion: EmotionType;
  size?: number;
  animated?: boolean;
  delay?: number;
  style?: any;
}

/**
 * Anger - Orange/red thorn or flame
 */
const GardenThorn: React.FC<GardenThornProps> = ({
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
        {/* Flame/Thorn shape */}
        <LinearGradient
          colors={[color, `${color}DD`, `${color}AA`]}
          style={[
            styles.thorn,
            {
              width: size * 0.5,
              height: size * 0.8,
            },
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          {/* Sparks */}
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.spark,
                {
                  width: size * 0.15,
                  height: size * 0.15,
                  backgroundColor: color,
                  opacity: 0.6,
                  left: index === 0 ? -size * 0.1 : index === 1 ? size * 0.2 : size * 0.45,
                  top: size * 0.1 + index * size * 0.2,
                },
              ]}
            />
          ))}
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
  thorn: {
    borderRadius: 50,
    position: 'relative',
  },
  spark: {
    position: 'absolute',
    borderRadius: 50,
  },
});

export default GardenThorn;


