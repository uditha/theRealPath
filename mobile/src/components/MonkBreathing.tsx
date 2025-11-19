import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import LottieView from 'lottie-react-native';

interface MonkBreathingProps {
  size?: number;
  style?: ViewStyle;
  variant?: 'simple' | 'advanced';
  pauseWhenNotVisible?: boolean;
}

export default function MonkBreathing({ 
  size = 160, 
  style,
  variant = 'advanced',
  pauseWhenNotVisible = true
}: MonkBreathingProps) {
  const animationSource = variant === 'advanced'
    ? require('../assets/animations/monk_breathing_advanced.json')
    : require('../assets/animations/monk_breathing.json');
  
  const lottieRef = useRef<LottieView>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (pauseWhenNotVisible && lottieRef.current) {
      if (isFocused) {
        lottieRef.current.play();
      } else {
        lottieRef.current.pause();
      }
    }
  }, [isFocused, pauseWhenNotVisible]);

  return (
    <View style={[styles.container, style]}>
      <LottieView
        ref={lottieRef}
        source={animationSource}
        autoPlay={!pauseWhenNotVisible || isFocused}
        loop
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

