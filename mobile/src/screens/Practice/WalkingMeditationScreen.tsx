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
import { Footprints } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { emotionService } from '../../services/emotion.service';
import { EmotionType } from '../../utils/emotions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PracticePhase = 'idle' | 'walking' | 'complete';
type StepPhase = 'lift' | 'move' | 'place';

const GUIDANCE_TEXTS = [
  { en: 'Let each step be gentle.', si: 'සෑම පියවරක්ම මෘදු වීමට ඉඩ දෙන්න.' },
  { en: 'Don\'t rush. Let the body lead the mind.', si: 'ඉක්මන් නොකරන්න. ශරීරය මනසට මග පෙන්වීමට ඉඩ දෙන්න.' },
  { en: 'Feel the movement, not the destination.', si: 'ගමනාගමනය දැනෙන්න, ගමනාන්තය නොවේ.' },
  { en: 'Walk as if you are kissing the earth.', si: 'ඔබ පොළොවට චුම්බනය කරනවා වැනිව ඇවිදින්න.' },
  { en: 'Awareness with movement brings peace.', si: 'ගමනාගමනය සමඟ සැලකිල්ල සාමකාමීකම ගෙන එයි.' },
];

const STEP_DURATION = 1500; // 1.5 seconds per phase
const CYCLE_DURATION = STEP_DURATION * 3; // 4.5 seconds per complete step cycle

export default function WalkingMeditationScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [currentPhase, setCurrentPhase] = useState<PracticePhase>('idle');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentStepPhase, setCurrentStepPhase] = useState<StepPhase>('lift');
  const [currentGuidanceIndex, setCurrentGuidanceIndex] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(60); // Default 1 minute

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const guidanceFade = useRef(new Animated.Value(1)).current;
  
  // Left foot animations
  const leftFootY = useRef(new Animated.Value(0)).current;
  const leftFootX = useRef(new Animated.Value(-60)).current; // Start behind (left side)
  const leftFootGlow = useRef(new Animated.Value(0)).current;
  
  // Right foot animations
  const rightFootY = useRef(new Animated.Value(0)).current;
  const rightFootX = useRef(new Animated.Value(60)).current; // Start ahead (right side)
  const rightFootGlow = useRef(new Animated.Value(0)).current;
  
  // Particle animations
  const particleAnimations = useRef(
    Array.from({ length: 8 }, () => ({
      translateY: new Animated.Value(SCREEN_HEIGHT),
      translateX: new Animated.Value(Math.random() * SCREEN_WIDTH),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const isActiveRef = useRef(false);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const guidanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentFootRef = useRef<'left' | 'right'>('left');

  // Initialize intro fade
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Animate particles
  useEffect(() => {
    if (!sessionStarted) return;

    particleAnimations.forEach((particle, index) => {
      const delay = index * 500;
      const duration = 8000 + Math.random() * 4000;
      
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(particle.translateY, {
              toValue: -100,
              duration,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 0.3,
                duration: duration / 3,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: duration / 3,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ])
      ).start();
    });
  }, [sessionStarted]);

  // Step animation cycle
  useEffect(() => {
    if (!sessionStarted || currentPhase !== 'walking') return;

    isActiveRef.current = true;
    const isLeftFoot = currentFootRef.current === 'left';
    const footY = isLeftFoot ? leftFootY : rightFootY;
    const footX = isLeftFoot ? leftFootX : rightFootX;
    const footGlow = isLeftFoot ? leftFootGlow : rightFootGlow;

    const animateStep = () => {
      if (!isActiveRef.current) return;

      switch (currentStepPhase) {
        case 'lift':
          // Lift foot
          Animated.parallel([
            Animated.timing(footY, {
              toValue: -30,
              duration: STEP_DURATION,
              useNativeDriver: true,
            }),
            Animated.timing(footGlow, {
              toValue: 0.6,
              duration: STEP_DURATION,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (isActiveRef.current) {
              setCurrentStepPhase('move');
            }
          });
          break;

        case 'move':
          // Move foot forward: left foot moves to +60 (ahead), right foot moves to -60 (behind)
          Animated.parallel([
            Animated.timing(footX, {
              toValue: isLeftFoot ? 60 : -60,
              duration: STEP_DURATION,
              useNativeDriver: true,
            }),
            Animated.timing(footGlow, {
              toValue: 0.8,
              duration: STEP_DURATION,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (isActiveRef.current) {
              setCurrentStepPhase('place');
            }
          });
          break;

        case 'place':
          // Place foot down (keep X position - foot stays in new position)
          Animated.parallel([
            Animated.timing(footY, {
              toValue: 0,
              duration: STEP_DURATION,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(footGlow, {
                toValue: 1,
                duration: STEP_DURATION / 2,
                useNativeDriver: true,
              }),
              Animated.timing(footGlow, {
                toValue: 0,
                duration: STEP_DURATION / 2,
                useNativeDriver: true,
              }),
            ]),
          ]).start(() => {
            if (isActiveRef.current) {
              // Switch to other foot
              currentFootRef.current = isLeftFoot ? 'right' : 'left';
              setCurrentStepPhase('lift');
            }
          });
          break;
      }
    };

    animateStep();
  }, [currentStepPhase, sessionStarted, currentPhase]);

  // Rotate guidance texts
  useEffect(() => {
    if (!sessionStarted || currentPhase !== 'walking') return;

    guidanceTimerRef.current = setInterval(() => {
      if (!isActiveRef.current) return;

      guidanceFade.setValue(0);
      Animated.timing(guidanceFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      setCurrentGuidanceIndex((prev) => (prev + 1) % GUIDANCE_TEXTS.length);
    }, 10000); // Every 10 seconds

    return () => {
      if (guidanceTimerRef.current) {
        clearInterval(guidanceTimerRef.current);
        guidanceTimerRef.current = null;
      }
    };
  }, [sessionStarted, currentPhase]);

  // Session timer
  useEffect(() => {
    if (!sessionStarted || currentPhase !== 'walking') return;

    sessionTimerRef.current = setTimeout(() => {
      if (isActiveRef.current) {
        setCurrentPhase('complete');
        setShowCompletion(true);
      }
    }, sessionDuration * 1000);

    return () => {
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    };
  }, [sessionStarted, currentPhase, sessionDuration]);

  const handleStart = () => {
    setSessionStarted(true);
    setCurrentPhase('walking');
    setCurrentStepPhase('lift');
    currentFootRef.current = 'left';
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
      console.error('Error saving walking meditation:', error);
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
    setCurrentStepPhase('lift');
    currentFootRef.current = 'left';
    leftFootY.setValue(0);
    leftFootX.setValue(-60);
    leftFootGlow.setValue(0);
    rightFootY.setValue(0);
    rightFootX.setValue(60);
    rightFootGlow.setValue(0);
    guidanceFade.setValue(1);
    fadeAnim.setValue(0);
  };

  const cleanup = () => {
    isActiveRef.current = false;
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    if (guidanceTimerRef.current) {
      clearInterval(guidanceTimerRef.current);
      guidanceTimerRef.current = null;
    }
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  };

  const getStepText = () => {
    switch (currentStepPhase) {
      case 'lift':
        return language === 'en' ? 'Lifting…' : 'ඔසවනවා…';
      case 'move':
        return language === 'en' ? 'Moving…' : 'ගමන් කරනවා…';
      case 'place':
        return language === 'en' ? 'Placing…' : 'තබනවා…';
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
              backgroundColor: '#7EA87C',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.completionContainer}>
          <Animated.View style={[styles.completionCard, { opacity: fadeAnim }]}>
            <Text style={styles.completionIcon}>💚</Text>
            <Text style={[styles.completionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Well done' : 'හොඳයි'}
            </Text>
            <Text style={[styles.completionSubtitle, { color: colors.text }]}>
              {language === 'en'
                ? 'You walked with full awareness.'
                : 'ඔබ සම්පූර්ණ සැලකිල්ලකින් ඇවිදින ලදී.'}
            </Text>
            <Text style={[styles.completionText, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Mindfulness in movement brings peace into daily life.'
                : 'ගමනාගමනයේ සැලකිල්ල දෛනික ජීවිතයට සාමකාමීකම ගෙන එයි.'}
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
                style={[styles.completionButton, { backgroundColor: '#7EA87C' }]}
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
              backgroundColor: '#7EA87C',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.introContainer}>
          <Animated.View style={[styles.introCard, { opacity: fadeAnim }]}>
            <View style={[styles.introIcon, { backgroundColor: '#7EA87C' + '30' }]}>
              <Footprints size={48} color="#7EA87C" strokeWidth={1.5} />
            </View>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              {language === 'en' ? 'Walking Meditation' : 'ඇවිදීමේ භාවනාව'}
            </Text>
            <Text style={[styles.introSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? '1–3 minute movement mindfulness practice'
                : 'විනාඩි 1–3 ක ගමනාගමන සැලකිලි පුරුදුව'}
            </Text>
            <View style={styles.durationSelector}>
              <TouchableOpacity
                style={[
                  styles.durationButton,
                  sessionDuration === 60 && { backgroundColor: '#7EA87C' + '30' },
                ]}
                onPress={() => setSessionDuration(60)}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    { color: sessionDuration === 60 ? '#7EA87C' : colors.textSecondary },
                  ]}
                >
                  1 min
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.durationButton,
                  sessionDuration === 120 && { backgroundColor: '#7EA87C' + '30' },
                ]}
                onPress={() => setSessionDuration(120)}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    { color: sessionDuration === 120 ? '#7EA87C' : colors.textSecondary },
                  ]}
                >
                  2 min
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.durationButton,
                  sessionDuration === 180 && { backgroundColor: '#7EA87C' + '30' },
                ]}
                onPress={() => setSessionDuration(180)}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    { color: sessionDuration === 180 ? '#7EA87C' : colors.textSecondary },
                  ]}
                >
                  3 min
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: '#7EA87C' }]}
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
      {/* Dark Theme Background with Subtle Green Tint */}
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[colors.background, colors.background + 'F0', colors.background + 'E0']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Subtle Green Overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#7EA87C',
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
              {language === 'en' ? 'Walking Meditation' : 'ඇවිදීමේ භාවනාව'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Feel each step. Let the mind walk with the body.'
                : 'සෑම පියවරක්ම දැනෙන්න. මනස ශරීරය සමඟ ඇවිදීමට ඉඩ දෙන්න.'}
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Based on Satipaṭṭhāna — mindfulness of posture and movement.'
                : 'සතිපට්ඨාන මත පදනම්ව — තනතුර සහ ගමනාගමනයේ සැලකිල්ල.'}
            </Text>
          </View>

          {/* Footstep Animation */}
          <View style={styles.animationContainer}>
            {/* Left Foot */}
            <Animated.View
              style={[
                styles.footprint,
                styles.leftFootprint,
                {
                  transform: [
                    { translateX: leftFootX },
                    { translateY: leftFootY },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.footprintGlow,
                  {
                    opacity: leftFootGlow,
                    backgroundColor: '#7EA87C' + '60',
                  },
                ]}
              />
              <Footprints size={60} color="#7EA87C" strokeWidth={2.5} />
            </Animated.View>

            {/* Right Foot */}
            <Animated.View
              style={[
                styles.footprint,
                styles.rightFootprint,
                {
                  transform: [
                    { translateX: rightFootX },
                    { translateY: rightFootY },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.footprintGlow,
                  {
                    opacity: rightFootGlow,
                    backgroundColor: '#7EA87C' + '60',
                  },
                ]}
              />
              <Footprints size={60} color="#7EA87C" strokeWidth={2.5} />
            </Animated.View>
          </View>

          {/* Step Instruction */}
          <Animated.View style={[styles.instructionContainer, { opacity: fadeAnim }]}>
            <Text style={[styles.instructionText, { color: colors.text }]}>
              {getStepText()}
            </Text>
          </Animated.View>

          {/* Guidance Text */}
          <Animated.View style={[styles.guidanceContainer, { opacity: guidanceFade }]}>
            <Text style={[styles.guidanceText, { color: colors.textSecondary }]}>
              {GUIDANCE_TEXTS[currentGuidanceIndex][language === 'en' ? 'en' : 'si']}
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
    animationContainer: {
      width: SCREEN_WIDTH,
      height: 200,
      position: 'relative',
      marginVertical: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footprint: {
      position: 'absolute',
      width: 80,
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    leftFootprint: {
      left: SCREEN_WIDTH / 2 - 40, // Center position, will be offset by translateX
    },
    rightFootprint: {
      left: SCREEN_WIDTH / 2 - 40, // Same center position, offset by translateX
    },
    footprintGlow: {
      position: 'absolute',
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    particle: {
      position: 'absolute',
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#7EA87C',
    },
    instructionContainer: {
      marginBottom: 32,
      paddingHorizontal: 20,
    },
    instructionText: {
      fontSize: 28,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 36,
    },
    guidanceContainer: {
      marginTop: 32,
      paddingHorizontal: 40,
    },
    guidanceText: {
      fontSize: 14,
      textAlign: 'center',
      fontStyle: 'italic',
      opacity: 0.6,
      lineHeight: 20,
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
      marginBottom: 24,
    },
    durationSelector: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 32,
    },
    durationButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    durationButtonText: {
      fontSize: 16,
      fontWeight: '600',
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

