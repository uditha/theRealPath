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
import { Sun } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { emotionService } from '../../services/emotion.service';
import { EmotionType } from '../../utils/emotions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type MuditaPhase = 'idle' | 'settling' | 'warmup' | 'phrases' | 'expanding' | 'closing' | 'complete';

const MUDITA_PHRASES = [
  // Set A (classic mudita)
  { en: 'I am happy for your happiness.', si: 'මම ඔබේ සතුටට සතුටු වෙමි.' },
  { en: 'May your joy continue.', si: 'ඔබේ සතුට දිගටම පවතීවා.' },
  { en: 'May you never be separated from your success.', si: 'ඔබ කිසිදා ඔබේ සාර්ථකත්වයෙන් වෙන් නොවේවා.' },
  // Set B (light-hearted modern)
  { en: 'Your joy brings joy to the world.', si: 'ඔබේ සතුට ලෝකයට සතුට ගෙන එයි.' },
  { en: 'Your success inspires me.', si: 'ඔබේ සාර්ථකත්වය මට ප්‍රේරණයක් ලබා දෙයි.' },
  // Set C (self-mudita)
  { en: 'I, too, deserve joy.', si: 'මටත් සතුටට අයිතියක් ඇත.' },
  { en: 'May I appreciate my own goodness.', si: 'මම මගේම යහපත අගය කරමි.' },
  // Set D (expansion)
  { en: 'May all beings experience success and joy.', si: 'සියලු සත්වයන් සාර්ථකත්වය සහ සතුට අත්විඳීවා.' },
];

const PHASE_DURATIONS = {
  settling: 15000, // 15 seconds
  warmup: 15000, // 15 seconds
  phrases: 60000, // 60 seconds (rotating phrases)
  expanding: 20000, // 20 seconds
  closing: 15000, // 15 seconds
};

const PHRASE_DURATION = 8000; // 8 seconds per phrase

export default function MuditaScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [currentPhase, setCurrentPhase] = useState<MuditaPhase>('idle');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const phraseFade = useRef(new Animated.Value(1)).current;
  const orbGlow = useRef(new Animated.Value(0.5)).current;
  const orbScale = useRef(new Animated.Value(1)).current;
  const orbBrightness = useRef(new Animated.Value(0.5)).current;
  const lightRingScale = useRef(new Animated.Value(1)).current;
  const lightRingOpacity = useRef(new Animated.Value(0.3)).current;

  // Sparkle animations
  const sparkleAnimations = useRef(
    Array.from({ length: 8 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
    }))
  ).current;

  // Particle animations
  const particleAnimations = useRef(
    Array.from({ length: 15 }, () => ({
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

  // Orb glow animation
  useEffect(() => {
    if (!sessionStarted || currentPhase === 'idle' || currentPhase === 'complete') {
      return;
    }

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(orbGlow, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(orbGlow, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    glow.start();
    return () => glow.stop();
  }, [sessionStarted, currentPhase]);

  // Orb pulse animation
  useEffect(() => {
    if (!sessionStarted || currentPhase === 'idle' || currentPhase === 'complete') {
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(orbScale, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(orbScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [sessionStarted, currentPhase]);

  // Orb brightness increases with phrases
  useEffect(() => {
    if (currentPhase === 'phrases') {
      const brightness = (currentPhraseIndex + 1) / MUDITA_PHRASES.length;
      Animated.timing(orbBrightness, {
        toValue: 0.5 + brightness * 0.5,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [currentPhraseIndex, currentPhase]);

  // Light rings animation (radiating outward)
  useEffect(() => {
    if (!sessionStarted || currentPhase === 'idle' || currentPhase === 'complete') {
      return;
    }

    const rings = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(lightRingScale, {
            toValue: 1.3,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(lightRingScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(lightRingOpacity, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(lightRingOpacity, {
            toValue: 0.2,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    rings.start();
    return () => rings.stop();
  }, [sessionStarted, currentPhase]);

  // Sparkle animations
  useEffect(() => {
    if (!sessionStarted || currentPhase === 'idle' || currentPhase === 'complete') {
      return;
    }

    sparkleAnimations.forEach((sparkle, index) => {
      const delay = index * 500;
      const angle = (index / sparkleAnimations.length) * Math.PI * 2;
      const radius = 80 + Math.random() * 40;
      
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(sparkle.scale, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(sparkle.scale, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(sparkle.opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(sparkle.opacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(sparkle.translateX, {
              toValue: Math.cos(angle) * radius,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(sparkle.translateY, {
              toValue: Math.sin(angle) * radius,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });
  }, [sessionStarted, currentPhase]);

  // Floating particles animation
  useEffect(() => {
    if (!sessionStarted) return;

    particleAnimations.forEach((particle, index) => {
      const delay = index * 400;
      const duration = 12000 + Math.random() * 8000;
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
                toValue: 0.5,
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
            setCurrentPhase('warmup');
          }
        }, PHASE_DURATIONS.settling);
        break;

      case 'warmup':
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('phrases');
            setCurrentPhraseIndex(0);
            orbBrightness.setValue(0.5);
          }
        }, PHASE_DURATIONS.warmup);
        break;

      case 'phrases':
        // Rotate phrases
        setCurrentPhraseIndex(0);
        phraseFade.setValue(1);

        phraseTimerRef.current = setInterval(() => {
          if (!isActiveRef.current) return;

          setCurrentPhraseIndex((prev) => {
            const next = (prev + 1) % MUDITA_PHRASES.length;
            
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
        // Expand orb brightness
        Animated.timing(orbBrightness, {
          toValue: 1,
          duration: PHASE_DURATIONS.expanding,
          useNativeDriver: true,
        }).start();

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
      console.error('Error saving mudita practice:', error);
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
    orbGlow.setValue(0.5);
    orbScale.setValue(1);
    orbBrightness.setValue(0.5);
    lightRingScale.setValue(1);
    lightRingOpacity.setValue(0.3);
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
          ? 'Take a deep relaxing breath…\n\nBring someone to mind who is joyful today.\n\n(someone who succeeded, laughed, is peaceful, or healthy)'
          : 'ගැඹුරු සන්සුන් හුස්මක් ගන්න…\n\nඅද සතුටු වන කෙනෙකු මනසට ගෙන එන්න.\n\n(සාර්ථක වූ, සිනාසුණු, සන්සුන් හෝ සෞඛ්‍ය සම්පන්න කෙනෙක්)';
      case 'warmup':
        return language === 'en'
          ? 'See their happiness…\n\nLet your heart feel warm.'
          : 'ඔවුන්ගේ සතුට දැක්ම…\n\nඔබේ හදවත උණුසුම් වීමට ඉඩ දෙන්න.';
      case 'phrases':
        return MUDITA_PHRASES[currentPhraseIndex]
          ? language === 'en'
            ? MUDITA_PHRASES[currentPhraseIndex].en
            : MUDITA_PHRASES[currentPhraseIndex].si
          : '';
      case 'expanding':
        return language === 'en'
          ? 'Let this joy spread to all beings…\n\nMay everyone\'s happiness grow.'
          : 'මෙම සතුට සියලු සත්වයන් වෙත ව්‍යාප්ත වීමට ඉඩ දෙන්න…\n\nසැමගේම සතුට වර්ධනය වේවා.';
      case 'closing':
        return language === 'en'
          ? 'Joy shared is joy multiplied.'
          : 'බෙදාගත් සතුට ගුණ කළ සතුටයි.';
      default:
        return '';
    }
  };

  // Glow opacity interpolation
  const glowOpacity = orbGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  const brightnessOpacity = orbBrightness.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.6, 1],
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
              backgroundColor: '#F5D76E',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.completionContainer}>
          <Animated.View style={[styles.completionCard, { opacity: fadeAnim }]}>
            <Text style={styles.completionIcon}>🌞</Text>
            <Text style={[styles.completionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Beautiful' : 'සුන්දර'}
            </Text>
            <Text style={[styles.completionSubtitle, { color: colors.text }]}>
              {language === 'en'
                ? 'You practised Appreciative Joy.'
                : 'ඔබ ප්‍රශංසා සතුට පුරුදු කළා.'}
            </Text>
            <Text style={[styles.completionText, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Mudita uplifts the heart — your joy grows when others shine.'
                : 'මුදිතා හදවත උත්සාහ කරයි — අනෙක් අය දීප්තිමත් වන විට ඔබේ සතුට වර්ධනය වේ.'}
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
                style={[styles.completionButton, { backgroundColor: '#F5D76E' }]}
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
              backgroundColor: '#F5D76E',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.introContainer}>
          <Animated.View style={[styles.introCard, { opacity: fadeAnim }]}>
            <View style={[styles.introIcon, { backgroundColor: '#F5D76E' + '30' }]}>
              <Sun size={48} color="#F5D76E" strokeWidth={1.5} fill="#F5D76E" />
            </View>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              {language === 'en' ? 'Appreciative Joy (Mudita)' : 'ප්‍රශංසා සතුට (මුදිතා)'}
            </Text>
            <Text style={[styles.introSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? '1–2 minute heart-opening practice'
                : 'විනාඩි 1–2 ක හදවත විවෘත කිරීමේ පුරුදුව'}
            </Text>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: '#F5D76E' }]}
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
      {/* Warm Gold-Yellow Gradient Background */}
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[colors.background, colors.background + 'F0', colors.background + 'E0']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Warm Gold Overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#F5D76E',
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
            {language === 'en' ? 'Appreciative Joy (Mudita)' : 'ප්‍රශංසා සතුට (මුදිතා)'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {language === 'en'
              ? 'Feel joy in the joy of others.'
              : 'අනෙක් අයගේ සතුටේ සතුට දැනෙන්න.'}
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {language === 'en'
              ? 'Based on the Brahmavihāra practice of Mudita — joyful appreciation.'
              : 'මුදිතා බ්‍රහ්මවිහාර පුරුදු මත පදනම්ව — ප්‍රශංසා සතුට.'}
          </Text>
        </View>

        {/* Orb/Sun Animation */}
        <View style={styles.orbContainer}>
          {/* Light Rings (radiating outward) */}
          <Animated.View
            style={[
              styles.lightRing,
              {
                transform: [{ scale: lightRingScale }],
                opacity: lightRingOpacity,
              },
            ]}
          />

          {/* Glow */}
          <Animated.View
            style={[
              styles.orbGlow,
              {
                opacity: Animated.multiply(glowOpacity, brightnessOpacity),
              },
            ]}
          />

          {/* Sparkles */}
          {sparkleAnimations.map((sparkle, index) => (
            <Animated.View
              key={index}
              style={[
                styles.sparkle,
                {
                  transform: [
                    { translateX: sparkle.translateX },
                    { translateY: sparkle.translateY },
                    { scale: sparkle.scale },
                  ],
                  opacity: sparkle.opacity,
                },
              ]}
            />
          ))}

          {/* Sun/Orb Icon */}
          <Animated.View
            style={[
              styles.orbWrapper,
              {
                transform: [{ scale: orbScale }],
                opacity: brightnessOpacity,
              },
            ]}
          >
            <Sun size={120} color="#F5D76E" strokeWidth={2} fill="#F5D76E" />
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
  orbContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  orbWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  orbGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#F5D76E',
    zIndex: 1,
  },
  lightRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: '#F5D76E',
    zIndex: 2,
  },
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F5D76E',
    zIndex: 4,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#F5D76E',
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


