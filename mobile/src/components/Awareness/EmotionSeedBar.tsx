import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { EMOTIONS, EmotionType, getEmotionLabel, getEmotion } from '../../utils/emotions';
import { seedDropAnimation } from '../../utils/gardenAnimations';
import * as Haptics from 'expo-haptics';

interface EmotionSeedBarProps {
  onEmotionTap: (emotion: EmotionType) => void;
  disabled?: boolean;
}

/**
 * Seed-style emotion bar
 * Each emotion is represented as a beautifully designed seed/nature element
 */
const EmotionSeedBar: React.FC<EmotionSeedBarProps> = ({ onEmotionTap, disabled = false }) => {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const translateYAnims = useRef(
    EMOTIONS.reduce((acc, emotion) => {
      acc[emotion.type] = new Animated.Value(0);
      return acc;
    }, {} as Record<EmotionType, Animated.Value>)
  ).current;
  const scaleAnims = useRef(
    EMOTIONS.reduce((acc, emotion) => {
      acc[emotion.type] = new Animated.Value(1);
      return acc;
    }, {} as Record<EmotionType, Animated.Value>)
  ).current;

  const handleEmotionTap = useCallback(
    (emotion: EmotionType) => {
      if (disabled) return;

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Seed drop animation
      const translateY = translateYAnims[emotion];
      const scale = scaleAnims[emotion];

      translateY.setValue(-20);
      scale.setValue(0.9);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      onEmotionTap(emotion);
    },
    [disabled, onEmotionTap]
  );

  const getSeedStyle = (emotion: EmotionType) => {
    const emotionDef = getEmotion(emotion);
    const color = emotionDef.color;

    switch (emotion) {
      case EmotionType.JOY:
        // Warm glowing seed with sun rays
        return {
          gradient: [color, `${color}DD`, color],
          shape: 'circle',
          glow: true,
        };
      case EmotionType.CALM_CLARITY:
        // Lotus seed - calm and clear
        return {
          gradient: [`${color}EE`, `${color}CC`, color],
          shape: 'lotus',
          glow: false,
        };
      case EmotionType.SADNESS_GRIEF:
        // Blue teardrop seed
        return {
          gradient: [`${color}E6`, `${color}CC`, color],
          shape: 'teardrop',
          glow: false,
        };
      case EmotionType.ANGER_AVERSION:
        // Red ember seed
        return {
          gradient: [color, `${color}DD`, `${color}AA`],
          shape: 'flame',
          glow: true,
        };
      case EmotionType.FEAR_CONFUSION:
        // Trembling shadow seed
        return {
          gradient: [`${color}CC`, `${color}99`, color],
          shape: 'shadow',
          glow: false,
        };
      case EmotionType.CRAVING:
        // Twisting vine seed
        return {
          gradient: [color, `${color}DD`],
          shape: 'vine',
          glow: false,
        };
      default:
        return {
          gradient: [color, `${color}DD`],
          shape: 'circle',
          glow: false,
        };
    }
  };

  const renderSeed = (emotion: EmotionType) => {
    const emotionDef = getEmotion(emotion);
    const seedStyle = getSeedStyle(emotion);
    const translateY = translateYAnims[emotion];
    const scale = scaleAnims[emotion];

    return (
      <TouchableOpacity
        key={emotion}
        style={styles.seedButton}
        onPress={() => handleEmotionTap(emotion)}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityLabel={`${getEmotionLabel(emotion, language)} emotion`}
        accessibilityRole="button"
      >
        <Animated.View
          style={[
            styles.seedContainer,
            {
              transform: [{ translateY }, { scale }],
            },
          ]}
        >
          {/* Seed glow effect */}
          {seedStyle.glow && (
            <View
              style={[
                styles.glow,
                {
                  backgroundColor: emotionDef.color,
                  opacity: 0.3,
                },
              ]}
            />
          )}

          {/* Seed shape */}
          <View style={styles.seedShape}>
            <LinearGradient
              colors={seedStyle.gradient}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Seed content based on shape */}
              {seedStyle.shape === 'teardrop' && (
                <View style={styles.teardropShape}>
                  <View
                    style={[
                      styles.highlight,
                      {
                        backgroundColor: 'rgba(255, 255, 255, 0.4)',
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        top: 4,
                        left: 6,
                      },
                    ]}
                  />
                </View>
              )}
              {seedStyle.shape === 'flame' && (
                <View style={styles.flameShape}>
                  <View style={styles.flameTop} />
                  <View style={styles.flameBottom} />
                </View>
              )}
              {seedStyle.shape === 'shadow' && (
                <View style={styles.shadowShape}>
                  <View style={styles.shadowCenter} />
                </View>
              )}
              {seedStyle.shape === 'vine' && (
                <View style={styles.vineShape}>
                  <View style={styles.vineStem} />
                  <View style={styles.vineLeaf} />
                </View>
              )}
              {seedStyle.shape === 'cracked' && (
                <View style={styles.crackedShape}>
                  <View style={styles.crackLine1} />
                  <View style={styles.crackLine2} />
                </View>
              )}
              {(seedStyle.shape === 'circle' || !seedStyle.shape) && (
                <View style={styles.circleShape}>
                  <View
                    style={[
                      styles.highlight,
                      {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        top: 6,
                        left: 8,
                      },
                    ]}
                  />
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Emoji overlay for clarity */}
          <View style={styles.emojiOverlay}>
            <Text style={styles.emoji}>{emotionDef.emoji}</Text>
          </View>
        </Animated.View>

        {/* Label */}
        <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
          {getEmotionLabel(emotion, language)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      <View style={styles.scrollContent}>
        {EMOTIONS.map((emotion) => renderSeed(emotion.type))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingVertical: 12,
    maxHeight: 120,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    width: '100%',
  },
  seedButton: {
    alignItems: 'center',
    minWidth: 60,
    maxWidth: 80,
  },
  seedContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    zIndex: 0,
  },
  seedShape: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  highlight: {
    position: 'absolute',
  },
  // Shape styles
  teardropShape: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  flameShape: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameTop: {
    width: 20,
    height: 20,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    position: 'absolute',
    top: 8,
  },
  flameBottom: {
    width: 30,
    height: 30,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
    bottom: 4,
  },
  shadowShape: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowCenter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  vineShape: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vineStem: {
    width: 4,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  vineLeaf: {
    width: 16,
    height: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
    top: 10,
    left: 20,
  },
  crackedShape: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crackLine1: {
    width: 20,
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
  },
  crackLine2: {
    width: 20,
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    transform: [{ rotate: '-45deg' }],
    position: 'absolute',
  },
  circleShape: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  emojiOverlay: {
    position: 'absolute',
    zIndex: 2,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default EmotionSeedBar;

