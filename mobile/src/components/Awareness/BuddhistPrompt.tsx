import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { fadeInAnimation } from '../../utils/gardenAnimations';

interface BuddhistPromptProps {
  show?: boolean;
  onHide?: () => void;
}

interface Prompt {
  textEn: string;
  textSi: string;
}

const PROMPTS: Prompt[] = [
  {
    textEn: 'Notice the seed, don\'t fight it.',
    textSi: 'බීජය දැකීමට උත්සාහ කරන්න, එයට එරෙහිව නොයන්න.',
  },
  {
    textEn: 'This emotion appeared and passed.',
    textSi: 'මෙම හැඟීම පෙනී ගියේය සහ ගෙවී ගියේය.',
  },
  {
    textEn: 'All feelings are impermanent.',
    textSi: 'සියලුම හැඟීම් අනිත්‍යය.',
  },
  {
    textEn: 'You observed without reacting — this is growth.',
    textSi: 'ඔබ ප්‍රතික්‍රියා නොකර නිරීක්ෂණය කළේය — මෙය වර්ධනයකි.',
  },
  {
    textEn: 'The garden grows through awareness.',
    textSi: 'උයන සැලකිල්ලෙන් වර්ධනය වේ.',
  },
  {
    textEn: 'Each emotion is a teacher.',
    textSi: 'සෑම හැඟීමක්ම ගුරුවරයෙකි.',
  },
  {
    textEn: 'Mindfulness is the gardener.',
    textSi: 'සැලකිල්ල උයන්වැවියාය.',
  },
  {
    textEn: 'Watch, don\'t judge.',
    textSi: 'නරඹන්න, විනිශ්චය නොකරන්න.',
  },
];

/**
 * Buddhist encouraging messages
 * Shows randomly after emotion taps (10-20% chance)
 */
const BuddhistPrompt: React.FC<BuddhistPromptProps> = ({ show = false, onHide }) => {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);

  useEffect(() => {
    if (show) {
      // Select random prompt
      const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
      setCurrentPrompt(randomPrompt);

      // Fade in
      fadeInAnimation(opacityAnim, { duration: 400 }).start();

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setCurrentPrompt(null);
          onHide?.();
        });
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      opacityAnim.setValue(0);
      setCurrentPrompt(null);
    }
  }, [show]);

  if (!currentPrompt) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          backgroundColor: colors.overlay,
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.promptCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.promptText, { color: colors.text }]}>
          {language === 'en' ? currentPrompt.textEn : currentPrompt.textSi}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  promptCard: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  promptText: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
});

export default BuddhistPrompt;


