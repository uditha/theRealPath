import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Heart } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { emotionService } from '../../services/emotion.service';
import { EmotionType } from '../../utils/emotions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CompassionPhase = 'idle' | 'settling' | 'holding' | 'phrases' | 'expanding' | 'closing' | 'complete';

const COMPASSION_PHRASES = [
  // Beginner-friendly
  { en: 'May you be free from pain.', si: 'ඔබ වේදනාවෙන් මිදෙනු ලැබේවා.' },
  { en: 'May your suffering ease.', si: 'ඔබේ දුක් වේදනාව සැහැල්ලු වේවා.' },
  { en: 'I care about your well-being.', si: 'මම ඔබේ යහපැවැත්ම ගැන සැලකිලිමත් වෙමි.' },
  // Deeper
  { en: 'I hold this pain with warmth.', si: 'මම මෙම වේදනාව උණුසුමින් රඳවා ගනිමි.' },
  { en: 'May your burden be lighter.', si: 'ඔබේ බර සැහැල්ලු වේවා.' },
  // Self-compassion
  { en: 'May I be gentle with myself.', si: 'මම මා සමඟ මෘදු වෙමි.' },
  { en: 'May I meet my pain with kindness.', si: 'මම මගේ වේදනාව කරුණාවෙන් මුණගැසෙමි.' },
];

const PHASE_DURATIONS = {
  settling: 15000, // 15 seconds
  holding: 20000, // 20 seconds
  phrases: 60000, // 60 seconds (rotating phrases)
  expanding: 25000, // 25 seconds
  closing: 15000, // 15 seconds
};

const PHRASE_DURATION = 9000; // 9 seconds per phrase

export default function CompassionScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [currentPhase, setCurrentPhase] = useState<CompassionPhase>('idle');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const phraseFade = useRef(new Animated.Value(1)).current;
  const heartGlow = useRef(new Animated.Value(0.5)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const rippleScale = useRef(new Animated.Value(0.8)).current;
  const rippleOpacity = useRef(new Animated.Value(0.3)).current;

  // Particle animations
  const particleAnimations = useRef(
    Array.from({ length: 12 }, () => ({
      translateY: new Animated.Value(SCREEN_HEIGHT),
      translateX: new Animated.Value(Math.random() * SCREEN_WIDTH),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const isActiveRef = useRef(false);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phraseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize intro fade
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Heart glow animation
  useEffect(() => {
    if (!sessionStarted || currentPhase === 'idle' || currentPhase === 'complete') {
      return;
    }

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(heartGlow, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(heartGlow, {
          toValue: 0.5,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    glow.start();
    return () => glow.stop();
  }, [sessionStarted, currentPhase]);

  // Heart pulse animation
  useEffect(() => {
    if (!sessionStarted || currentPhase === 'idle' || currentPhase === 'complete') {
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [sessionStarted, currentPhase]);

  // Ripple animation (expanding during expanding phase)
  useEffect(() => {
    if (currentPhase === 'expanding') {
      const ripple = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(rippleScale, {
              toValue: 1.5,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(rippleScale, {
              toValue: 0.8,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(rippleOpacity, {
              toValue: 0.6,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity, {
              toValue: 0.2,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      ripple.start();
      return () => ripple.stop();
    } else {
      rippleScale.setValue(0.8);
      rippleOpacity.setValue(0.3);
    }
  }, [currentPhase]);

  // Floating particles animation
  useEffect(() => {
    if (!sessionStarted) return;

    particleAnimations.forEach((particle, index) => {
      const delay = index * 500;
      const duration = 15000 + Math.random() * 10000;
      const startX = Math.random() * SCREEN_WIDTH;
      
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(particle.translateY, {
              toValue: -200,
              duration,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 0.4,
                duration: duration / 4,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: duration / 2,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ])
      ).start();
    });
  }, [sessionStarted]);

  // Phase progression
  useEffect(() => {
    if (!sessionStarted || currentPhase === 'idle' || currentPhase === 'complete') {
      isActiveRef.current = false;
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
      if (phraseTimerRef.current) {
        clearInterval(phraseTimerRef.current);
        phraseTimerRef.current = null;
      }
      return;
    }

    isActiveRef.current = true;

    switch (currentPhase) {
      case 'settling':
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('holding');
          }
        }, PHASE_DURATIONS.settling);
        break;

      case 'holding':
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('phrases');
            setCurrentPhraseIndex(0);
          }
        }, PHASE_DURATIONS.holding);
        break;

      case 'phrases':
        // Rotate phrases
        setCurrentPhraseIndex(0);
        phraseFade.setValue(1);

        phraseTimerRef.current = setInterval(() => {
          if (!isActiveRef.current) return;

          setCurrentPhraseIndex((prev) => {
            const next = (prev + 1) % COMPASSION_PHRASES.length;
            
            // Fade animation for phrase change
            phraseFade.setValue(0);
            Animated.timing(phraseFade, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }).start();

            return next;
          });
        }, PHRASE_DURATION);

        // Move to expanding phase after phrases
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('expanding');
          }
        }, PHASE_DURATIONS.phrases);
        break;

      case 'expanding':
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('closing');
          }
        }, PHASE_DURATIONS.expanding);
        break;

      case 'closing':
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('complete');
            setShowCompletion(true);
          }
        }, PHASE_DURATIONS.closing);
        break;
    }

    return () => {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
      if (phraseTimerRef.current) {
        clearInterval(phraseTimerRef.current);
        phraseTimerRef.current = null;
      }
    };
  }, [currentPhase, sessionStarted]);

  const handleStart = () => {
    setSessionStarted(true);
    setCurrentPhase('settling');
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleDone = () => {
    cleanup();
    navigation.goBack();
  };

  const handleReflect = async () => {
    try {
      await emotionService.saveEmotionTile(EmotionType.CALM_CLARITY);
    } catch (error) {
      console.error('Error saving compassion practice:', error);
    }
    cleanup();
    navigation.goBack();
    setTimeout(() => {
      navigation.getParent()?.navigate('AwarenessTab');
    }, 300);
  };

  const handleRepeat = () => {
    cleanup();
    setShowCompletion(false);
    setSessionStarted(false);
    setCurrentPhase('idle');
    setCurrentPhraseIndex(0);
    fadeAnim.setValue(0);
    phraseFade.setValue(1);
    heartGlow.setValue(0.5);
    heartScale.setValue(1);
    rippleScale.setValue(0.8);
    rippleOpacity.setValue(0.3);
  };

  const cleanup = () => {
    isActiveRef.current = false;
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    if (phraseTimerRef.current) {
      clearInterval(phraseTimerRef.current);
      phraseTimerRef.current = null;
    }
  };

  // Get current instruction text
  const getInstructionText = () => {
    switch (currentPhase) {
      case 'settling':
        return language === 'en'
          ? 'Take a gentle breath…\n\nBring someone to mind who is suffering.\n\nOR\n\nIt may be you — if you are hurting inside.'
          : 'මෘදු හුස්මක් ගන්න…\n\nදුක් විඳින කෙනෙකු මනසට ගෙන එන්න.\n\nහෝ\n\nඑය ඔබ විය හැකිය — ඔබ ඇතුළත වේදනාවක් දරනවා නම්.';
      case 'holding':
        return language === 'en'
          ? 'Feel their pain…\njust notice it.'
          : 'ඔවුන්ගේ වේදනාව දැනෙන්න…\nඑය නිරීක්ෂණය කරන්න පමණි.';
      case 'phrases':
        return COMPASSION_PHRASES[currentPhraseIndex]
          ? language === 'en'
            ? COMPASSION_PHRASES[currentPhraseIndex].en
            : COMPASSION_PHRASES[currentPhraseIndex].si
          : '';
      case 'expanding':
        return language === 'en'
          ? 'Let this compassion expand…\nto anyone suffering right now.'
          : 'මෙම කරුණාව විහිදීමට ඉඩ දෙන්න…\nදැන් දුක් විඳින ඕනෑම කෙනෙකුට.';
      case 'closing':
        return language === 'en'
          ? 'Compassion softens the suffering of the heart.'
          : 'කරුණාව හදවතේ දුක් වේදනාව මෘදු කරයි.';
      default:
        return '';
    }
  };

  // Glow opacity interpolation
  const glowOpacity = heartGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  if (showCompletion) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <BlurView intensity={80} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[colors.background + 'F0', colors.background + 'E0']}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#E9B6B6',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.completionContainer}>
          <Animated.View style={[styles.completionCard, { opacity: fadeAnim }]}>
            <Text style={styles.completionIcon}>💗</Text>
            <Text style={[styles.completionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Beautiful' : 'සුන්දර'}
            </Text>
            <Text style={[styles.completionSubtitle, { color: colors.text }]}>
              {language === 'en'
                ? 'You have practised compassion.'
                : 'ඔබ කරුණාව පුරුදු කළා.'}
            </Text>
            <Text style={[styles.completionText, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Karunā brings warmth to suffering — yours and others\'.'
                : 'කරුණාව දුක් වේදනාවට උණුසුම ගෙන එයි — ඔබගේ සහ අනෙක් අයගේ.'}
            </Text>

            <View style={styles.completionActions}>
              <TouchableOpacity
                style={[styles.completionButton, styles.completionButtonSecondary]}
                onPress={handleDone}
              >
                <Text style={[styles.completionButtonText, { color: colors.text }]}>
                  {language === 'en' ? 'Done' : 'සම්පූර්ණයි'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.completionButton, { backgroundColor: '#E9B6B6' }]}
                onPress={handleReflect}
              >
                <Text style={[styles.completionButtonText, { color: '#FFFFFF' }]}>
                  {language === 'en' ? 'Add to Awareness' : 'සැලකිල්ලට එක් කරන්න'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.repeatButton} onPress={handleRepeat}>
              <Text style={[styles.repeatButtonText, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Repeat' : 'නැවත කරන්න'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if (!sessionStarted) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <BlurView intensity={80} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[colors.background + 'F0', colors.background + 'E0']}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#E9B6B6',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.introContainer}>
          <Animated.View style={[styles.introCard, { opacity: fadeAnim }]}>
            <View style={[styles.introIcon, { backgroundColor: '#E9B6B6' + '30' }]}>
              <Heart size={48} color="#E9B6B6" strokeWidth={1.5} fill="#E9B6B6" />
            </View>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              {language === 'en' ? 'Compassion (Karunā)' : 'කරුණාව (කරුණා)'}
            </Text>
            <Text style={[styles.introSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? '1–3 minute heart-opening practice'
                : 'විනාඩි 1–3 ක හදවත විවෘත කිරීමේ පුරුදුව'}
            </Text>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: '#E9B6B6' }]}
              onPress={handleStart}
            >
              <Text style={styles.startButtonText}>
                {language === 'en' ? 'Start' : 'ආරම්භ කරන්න'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Warm Pink/Rose Gradient Background */}
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[colors.background, colors.background + 'F0', colors.background + 'E0']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Warm Pink Overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#E9B6B6',
            opacity: 0.08,
          },
        ]}
      />

      {/* Floating Particles */}
      {particleAnimations.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              transform: [
                { translateY: particle.translateY },
                { translateX: particle.translateX },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}

      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            cleanup();
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {language === 'en' ? 'Compassion (Karunā)' : 'කරුණාව (කරුණා)'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {language === 'en'
              ? 'Hold suffering with warmth and gentleness.'
              : 'උණුසුම සහ මෘදුකමින් දුක් වේදනාව රඳවා ගන්න.'}
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {language === 'en'
              ? 'Based on heart practices in the Brahmavihāra.'
              : 'බ්‍රහ්මවිහාරයේ හදවතේ පුරුදු මත පදනම්ව.'}
          </Text>
        </View>

        {/* Heart Animation */}
        <View style={styles.heartContainer}>
          {/* Ripple (during expanding phase) */}
          {currentPhase === 'expanding' && (
            <Animated.View
              style={[
                styles.ripple,
                {
                  transform: [{ scale: rippleScale }],
                  opacity: rippleOpacity,
                },
              ]}
            />
          )}

          {/* Glow */}
          <Animated.View
            style={[
              styles.heartGlow,
              {
                opacity: glowOpacity,
              },
            ]}
          />

          {/* Heart Icon */}
          <Animated.View
            style={[
              styles.heartWrapper,
              {
                transform: [{ scale: heartScale }],
              },
            ]}
          >
            <Heart size={100} color="#E9B6B6" strokeWidth={2} fill="#E9B6B6" />
          </Animated.View>
        </View>

        {/* Instruction Text */}
        <Animated.View
          style={[
            styles.instructionContainer,
            {
              opacity: currentPhase === 'phrases' ? phraseFade : 1,
            },
          ]}
        >
          <Text style={[styles.instructionText, { color: colors.text }]}>
            {getInstructionText()}
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
  },
  heartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  heartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  heartGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E9B6B6',
    zIndex: 1,
  },
  ripple: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#E9B6B6',
    zIndex: 2,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#E9B6B6',
  },
  instructionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 32,
    minHeight: 100,
    justifyContent: 'center',
  },
  instructionText: {
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '400',
  },
  introContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  introCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  introIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  introSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  completionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  completionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  completionSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  completionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  completionActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  completionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  completionButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  completionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  repeatButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  repeatButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});


