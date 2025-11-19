import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { getWisdomQuoteForDate } from '../../utils/wisdomQuotes';

interface DailyWisdomProps {
  style?: any;
}

export default function DailyWisdom({ style }: DailyWisdomProps) {
  const { language } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const quote = getWisdomQuoteForDate();

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.wisdomText,
        { opacity: fadeAnim },
        style,
      ]}
    >
      {language === 'en' ? quote.en : quote.si}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  wisdomText: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.6, // 60% opacity
    marginTop: 4,
    lineHeight: 18,
  },
});


