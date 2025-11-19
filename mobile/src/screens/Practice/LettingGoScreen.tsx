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
import { Cloud } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { emotionService } from '../../services/emotion.service';
import { EmotionType } from '../../utils/emotions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PracticePhase = 'idle' | 'identify' | 'hold' | 'breathing' | 'release' | 'lightness' | 'complete';

const BREATHING_INSTRUCTIONS = [
  { en: 'On the exhale… soften.', si: 'හුස්ම පිටතට දමන විට… මෘදු වන්න.' },
  { en: 'On the exhale… release.', si: 'හුස්ම පිටතට දමන විට… මුදා හරින්න.' },
  { en: 'Let the tension float upward…', si: 'තනතුර ඉහළට පාවීමට ඉඩ දෙන්න…' },
  { en: 'Let the mind be light.', si: 'මනස සැහැල්ලු වීමට ඉඩ දෙන්න.' },
];

const BREATHE_DURATION = 4000; // 4 seconds per breath cycle

export default function LettingGoScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [currentPhase, setCurrentPhase] = useState<PracticePhase>('idle');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentBreathIndex, setCurrentBreathIndex] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(90); // Default 1.5 minutes

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const instructionFade = useRef(new Animated.Value(1)).current;
  
  // Bubble/balloon animation
  const bubbleY = useRef(new Animated.Value(SCREEN_HEIGHT * 0.6)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const bubbleOpacity = useRef(new Animated.Value(0.8)).current;
  const bubbleGlow = useRef(new Animated.Value(0.3)).current;
  
  // Breathing animation
  const breathingScale = useRef(new Animated.Value(1)).current;
  const breathingGlow = useRef(new Animated.Value(0.3)).current;
  
  // Particle animations (floating dust)
  const particleAnimations = useRef(
    Array.from({ length: 12 }, () => ({
      translateY: new Animated.Value(SCREEN_HEIGHT),
      translateX: new Animated.Value(Math.random() * SCREEN_WIDTH),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
    }))
  ).current;

  const isActiveRef = useRef(false);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const breathTimerRef = useRef<NodeJS.Timeout | null>(null);
  const breathingAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Initialize intro fade
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Animate floating particles
  useEffect(() => {
    if (!sessionStarted) return;

    particleAnimations.forEach((particle, index) => {
      const delay = index * 300;
      const duration = 10000 + Math.random() * 5000;
      
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

  // Breathing animation (continuous during breathing phase)
  useEffect(() => {
    if (currentPhase !== 'breathing' || !sessionStarted) {
      if (breathingAnimRef.current) {
        breathingAnimRef.current.stop();
      }
      return;
    }

    const breathing = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(breathingScale, {
            toValue: 1.15,
            duration: BREATHE_DURATION / 2,
            useNativeDriver: true,
          }),
          Animated.timing(breathingGlow, {
            toValue: 0.5,
            duration: BREATHE_DURATION / 2,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(breathingScale, {
            toValue: 1,
            duration: BREATHE_DURATION / 2,
            useNativeDriver: true,
          }),
          Animated.timing(breathingGlow, {
            toValue: 0.3,
            duration: BREATHE_DURATION / 2,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    breathingAnimRef.current = breathing;
    breathing.start();

    return () => {
      breathing.stop();
    };
  }, [currentPhase, sessionStarted]);

  // Phase progression
  useEffect(() => {
    if (!sessionStarted || currentPhase === 'idle' || currentPhase === 'complete') {
      return;
    }

    isActiveRef.current = true;

    switch (currentPhase) {
      case 'identify':
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('hold');
          }
        }, 15000); // 15 seconds
        break;

      case 'hold':
        // Bubble glows slightly during hold phase
        Animated.timing(bubbleGlow, {
          toValue: 0.5,
          duration: 15000,
          useNativeDriver: true,
        }).start();

        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('breathing');
            setCurrentBreathIndex(0);
          }
        }, 15000); // 15 seconds
        break;

      case 'breathing':
        // Rotate breathing instructions every breath cycle
        breathTimerRef.current = setInterval(() => {
          if (!isActiveRef.current || currentPhase !== 'breathing') return;

          instructionFade.setValue(0);
          Animated.timing(instructionFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();

          // Bubble rises slightly on each exhale (accumulate upward movement)
          const currentY = bubbleY._value;
          Animated.timing(bubbleY, {
            toValue: Math.max(currentY - 15, SCREEN_HEIGHT * 0.3),
            duration: BREATHE_DURATION,
            useNativeDriver: true,
          }).start();

          setCurrentBreathIndex((prev) => {
            const next = (prev + 1) % BREATHING_INSTRUCTIONS.length;
            if (next === 0 && prev === BREATHING_INSTRUCTIONS.length - 1) {
              // After cycling through all instructions, move to release phase
              setTimeout(() => {
                if (isActiveRef.current) {
                  setCurrentPhase('release');
                }
              }, BREATHE_DURATION);
            }
            return next;
          });
        }, BREATHE_DURATION);

        // Fallback: move to release after 40 seconds
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current && currentPhase === 'breathing') {
            setCurrentPhase('release');
          }
        }, 40000);
        break;

      case 'release':
        // Animate bubble rising and dissolving
        Animated.parallel([
          Animated.timing(bubbleY, {
            toValue: -100,
            duration: 20000,
            useNativeDriver: true,
          }),
          Animated.timing(bubbleScale, {
            toValue: 1.5,
            duration: 15000,
            useNativeDriver: true,
          }),
          Animated.timing(bubbleOpacity, {
            toValue: 0,
            duration: 20000,
            useNativeDriver: true,
          }),
          Animated.timing(bubbleGlow, {
            toValue: 0,
            duration: 20000,
            useNativeDriver: true,
          }),
        ]).start();

        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('lightness');
          }
        }, 20000); // 20 seconds
        break;

      case 'lightness':
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('complete');
            setShowCompletion(true);
          }
        }, 10000); // 10 seconds
        break;
    }

    return () => {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
      if (breathTimerRef.current) {
        clearInterval(breathTimerRef.current);
        breathTimerRef.current = null;
      }
    };
  }, [currentPhase, sessionStarted]);

  const handleStart = () => {
    setSessionStarted(true);
    setCurrentPhase('identify');
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
      console.error('Error saving letting go practice:', error);
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
    setCurrentBreathIndex(0);
    bubbleY.setValue(SCREEN_HEIGHT * 0.6);
    bubbleScale.setValue(1);
    bubbleOpacity.setValue(0.8);
    bubbleGlow.setValue(0.3);
    breathingScale.setValue(1);
    breathingGlow.setValue(0.3);
    instructionFade.setValue(1);
    fadeAnim.setValue(0);
  };

  const cleanup = () => {
    isActiveRef.current = false;
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    if (breathTimerRef.current) {
      clearInterval(breathTimerRef.current);
      breathTimerRef.current = null;
    }
    if (breathingAnimRef.current) {
      breathingAnimRef.current.stop();
      breathingAnimRef.current = null;
    }
  };

  const getCurrentInstruction = () => {
    switch (currentPhase) {
      case 'identify':
        return language === 'en'
          ? 'Bring to mind something heavy…\na worry, emotion, or thought.'
          : 'එක්තරා බරක් මතකට ගන්න…\nකරදරයක්, හැඟීමක්, හෝ සිතක්.';
      case 'hold':
        return language === 'en'
          ? 'Don\'t push it away.\nJust hold it gently in awareness.'
          : 'එය තල්ලු කරන්න එපා.\nසැලකිලිමත්ව මෘදුවෙන් එය රඳවා ගන්න.';
      case 'breathing':
        return BREATHING_INSTRUCTIONS[currentBreathIndex][language === 'en' ? 'en' : 'si'];
      case 'release':
        return language === 'en' ? 'Now let it go.' : 'දැන් එය මුදා හරින්න.';
      case 'lightness':
        return language === 'en'
          ? 'Notice the space that remains.\nYou don\'t have to carry everything.'
          : 'ඉතිරිව ඇති අවකාශය නිරීක්ෂණය කරන්න.\nඔබට සියල්ල රැගෙන යාමට අවශ්‍ය නැත.';
      default:
        return '';
    }
  };

  const styles = createStyles(colors);

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
              backgroundColor: '#C8B8E6',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.completionContainer}>
          <Animated.View style={[styles.completionCard, { opacity: fadeAnim }]}>
            <Text style={styles.completionIcon}>✨</Text>
            <Text style={[styles.completionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Beautiful' : 'සුන්දර'}
            </Text>
            <Text style={[styles.completionSubtitle, { color: colors.text }]}>
              {language === 'en'
                ? 'You released something today.'
                : 'ඔබ අද යමක් මුදා හැරියේය.'}
            </Text>
            <Text style={[styles.completionText, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Letting go is a skill — and you\'re practising it well.'
                : 'මුදා හැරීම යනු කුසලතාවකි — සහ ඔබ එය හොඳින් පුරුදු කරනවා.'}
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
                style={[styles.completionButton, { backgroundColor: '#C8B8E6' }]}
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
              backgroundColor: '#C8B8E6',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.introContainer}>
          <Animated.View style={[styles.introCard, { opacity: fadeAnim }]}>
            <View style={[styles.introIcon, { backgroundColor: '#C8B8E6' + '30' }]}>
              <Cloud size={48} color="#C8B8E6" strokeWidth={1.5} />
            </View>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              {language === 'en' ? 'Letting Go Practice' : 'මුදා හැරීමේ පුරුදුව'}
            </Text>
            <Text style={[styles.introSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? '1–2 minute release and lightness practice'
                : 'විනාඩි 1–2 ක මුදා හැරීම සහ සැහැල්ලුකම පුරුදුව'}
            </Text>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: '#C8B8E6' }]}
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
      {/* Dark Theme Background with Subtle Lavender Tint */}
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[colors.background, colors.background + 'F0', colors.background + 'E0']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Subtle Lavender Overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#C8B8E6',
            opacity: 0.05,
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
                { scale: particle.scale },
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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {language === 'en' ? 'Letting Go Practice' : 'මුදා හැරීමේ පුරුදුව'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Sense the tension… release gently.'
                : 'තනතුර දැනෙන්න… මෘදුවෙන් මුදා හරින්න.'}
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Inspired by Buddhist letting-go (vossagga) teachings.'
                : 'බෞද්ධ මුදා හැරීමේ (වොස්සග්ග) උගැන්වීම්වලින් පෙළඹීම.'}
            </Text>
          </View>

          {/* Bubble/Balloon Animation */}
          <View style={styles.bubbleContainer}>
            {/* Breathing Circle (during breathing phase) */}
            {currentPhase === 'breathing' && (
              <Animated.View
                style={[
                  styles.breathingCircle,
                  {
                    width: 160,
                    height: 160,
                    borderRadius: 80,
                    opacity: breathingGlow,
                    backgroundColor: '#C8B8E6' + '30',
                    transform: [{ scale: breathingScale }],
                  },
                ]}
              />
            )}

            {/* Rising Bubble/Balloon */}
            <Animated.View
              style={[
                styles.bubble,
                {
                  transform: [
                    { translateY: bubbleY },
                    { scale: bubbleScale },
                  ],
                  opacity: bubbleOpacity,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.bubbleGlow,
                  {
                    opacity: bubbleGlow,
                    backgroundColor: '#C8B8E6',
                  },
                ]}
              />
              <View style={styles.bubbleInner}>
                <Cloud size={50} color="#C8B8E6" strokeWidth={1.5} />
              </View>
            </Animated.View>
          </View>

          {/* Instruction Text */}
          <Animated.View style={[styles.instructionContainer, { opacity: instructionFade }]}>
            <Text style={[styles.instructionText, { color: colors.text }]}>
              {getCurrentInstruction()}
            </Text>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: 20,
    },
    backButton: {
      marginBottom: 16,
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      marginBottom: 48,
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      opacity: 0.7,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 12,
      textAlign: 'center',
      fontStyle: 'italic',
      opacity: 0.6,
    },
    bubbleContainer: {
      width: SCREEN_WIDTH,
      height: 300,
      position: 'relative',
      marginVertical: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    breathingCircle: {
      position: 'absolute',
    },
    bubble: {
      position: 'absolute',
      width: 100,
      height: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubbleGlow: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    bubbleInner: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#C8B8E6' + '40',
      alignItems: 'center',
      justifyContent: 'center',
    },
    particle: {
      position: 'absolute',
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: '#C8B8E6',
    },
    instructionContainer: {
      marginBottom: 32,
      paddingHorizontal: 20,
      minHeight: 100,
      justifyContent: 'center',
    },
    instructionText: {
      fontSize: 24,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 32,
    },
    introContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    introCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      width: '100%',
      maxWidth: SCREEN_WIDTH - 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
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
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    introSubtitle: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: 32,
    },
    startButton: {
      paddingVertical: 16,
      paddingHorizontal: 48,
      borderRadius: 16,
      minWidth: 200,
    },
    startButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
    completionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    completionCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    completionIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    completionTitle: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    completionSubtitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      textAlign: 'center',
    },
    completionText: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: 32,
    },
    completionActions: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    completionButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
    },
    completionButtonSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
    },
    completionButtonText: {
      fontSize: 16,
      fontWeight: '700',
    },
    repeatButton: {
      marginTop: 16,
      paddingVertical: 12,
    },
    repeatButtonText: {
      fontSize: 14,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  });

