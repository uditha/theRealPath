import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { EmotionType } from '../../utils/emotions';
import { getEmotion } from '../../utils/emotions';

interface EmotionTileProps {
  emotion: EmotionType;
  size?: number;
  onPress?: () => void;
  animated?: boolean;
}

const EmotionTile = React.memo(function EmotionTile({ 
  emotion, 
  size = 40, 
  onPress,
  animated = false 
}: EmotionTileProps) {
  const emotionDef = getEmotion(emotion);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      // Fade in animation
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [animated]);

  const handlePress = () => {
    // Pulse animation on tap
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress?.();
  };
  
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={!onPress}
      style={styles.container}
      accessibilityLabel={`${emotionDef.labelEn} emotion tile`}
      accessibilityRole="button"
      accessibilityHint={onPress ? 'Tap to view details' : undefined}
    >
      <Animated.View
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            backgroundColor: emotionDef.color,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    margin: 2,
  },
  tile: {
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default EmotionTile;

