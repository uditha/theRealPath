import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { EMOTIONS, EmotionType, getEmotionLabel } from '../../utils/emotions';
import * as Haptics from 'expo-haptics';

interface EmotionIconBarProps {
  onEmotionTap: (emotion: EmotionType) => void;
  disabled?: boolean;
}

const EmotionIconBar = React.memo(function EmotionIconBar({ onEmotionTap, disabled = false }: EmotionIconBarProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const scaleAnims = useRef(
    EMOTIONS.reduce((acc, emotion) => {
      acc[emotion.type] = new Animated.Value(1);
      return acc;
    }, {} as Record<EmotionType, Animated.Value>)
  ).current;

  const handleEmotionTap = useCallback((emotion: EmotionType) => {
    if (disabled) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Scale animation
    const anim = scaleAnims[emotion];
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onEmotionTap(emotion);
  }, [disabled, onEmotionTap]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {EMOTIONS.map((emotion) => {
          const label = getEmotionLabel(emotion.type, language);
          return (
            <TouchableOpacity
              key={emotion.type}
              style={styles.iconButton}
              onPress={() => handleEmotionTap(emotion.type)}
              disabled={disabled}
              activeOpacity={0.7}
              accessibilityLabel={`${label} emotion`}
              accessibilityRole="button"
            >
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: colors.surface,
                    transform: [{ scale: scaleAnims[emotion.type] }],
                  },
                ]}
              >
                <Text style={styles.emoji}>{emotion.emoji}</Text>
              </Animated.View>
              <Text
                style={[styles.label, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingVertical: 12,
    maxHeight: 120,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    alignItems: 'center',
    minWidth: 60,
    maxWidth: 80,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default EmotionIconBar;

