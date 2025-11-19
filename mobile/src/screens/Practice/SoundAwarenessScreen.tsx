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
import { 
  useAudioRecorder, 
  useAudioRecorderState, 
  RecordingPresets,
  requestRecordingPermissionsAsync,
  PermissionStatus,
} from 'expo-audio';
import { Waves } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { emotionService } from '../../services/emotion.service';
import { EmotionType } from '../../utils/emotions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PracticePhase = 'idle' | 'settling' | 'openDoor' | 'mindfulness' | 'returning' | 'complete';

const MINDFULNESS_INSTRUCTIONS = [
  { en: 'Notice sounds... just as sounds.', si: 'ශබ්ද නිරීක්ෂණය කරන්න... ශබ්ද ලෙසම.' },
  { en: 'Don\'t name them.', si: 'ඒවා නම් නොකරන්න.' },
  { en: 'Don\'t judge them.', si: 'ඒවා විනිශ්චය නොකරන්න.' },
  { en: 'Let them arise... and pass away.', si: 'ඒවා ඇති වීමට ඉඩ දෙන්න... සහ අතුරුදහන් වීමට.' },
  { en: 'Sound comes, sound goes. The mind stays awake.', si: 'ශබ්දය එනවා, ශබ්දය යනවා. මනස නිදි නැතිව සිටී.' },
];

const SOUND_THRESHOLD = -30; // Decibels threshold for triggering ripples

export default function SoundAwarenessScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [currentPhase, setCurrentPhase] = useState<PracticePhase>('idle');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState(false);
  const [soundDetected, setSoundDetected] = useState(false);
  
  // Create audio recorder with metering enabled
  const audioRecorder = useAudioRecorder(
    {
      ...RecordingPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
    },
    (status) => {
      // Status updates handled by useAudioRecorderState hook
    }
  );
  
  // Get real-time recorder state for metering
  const recorderState = useAudioRecorderState(audioRecorder, 100); // Update every 100ms

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const instructionFade = useRef(new Animated.Value(1)).current;
  const breathingScale = useRef(new Animated.Value(1)).current;
  const breathingGlow = useRef(new Animated.Value(0.3)).current;
  
  // Ripple animations (5 ripples)
  const rippleAnimations = useRef(
    Array.from({ length: 5 }, () => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0),
      x: Math.random() * SCREEN_WIDTH * 0.6 - SCREEN_WIDTH * 0.3,
      y: Math.random() * SCREEN_HEIGHT * 0.4 - SCREEN_HEIGHT * 0.2,
    }))
  ).current;

  const isActiveRef = useRef(false);
  const instructionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const instructionCountRef = useRef(0);

  // Request microphone permission
  useEffect(() => {
    requestMicrophonePermission();
    return () => {
      cleanup();
    };
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      setHasMicrophonePermission(granted);
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      setHasMicrophonePermission(false);
    }
  };

  // Monitor audio levels from recorder state
  useEffect(() => {
    if (sessionStarted && recorderState.isRecording && recorderState.metering !== undefined && isActiveRef.current) {
      const decibels = recorderState.metering;
      if (decibels > SOUND_THRESHOLD) {
        triggerRipple();
      }
    }
  }, [recorderState.metering, sessionStarted]);

  const startAudioRecording = async () => {
    if (!hasMicrophonePermission) return;

    try {
      if (recorderState.canRecord) {
        audioRecorder.record();
      }
    } catch (error) {
      console.error('Error starting audio recording:', error);
    }
  };

  const stopAudioRecording = async () => {
    if (audioRecorder.isRecording) {
      try {
        await audioRecorder.stop();
      } catch (error) {
        console.error('Error stopping audio recording:', error);
      }
    }
  };

  const cleanup = async () => {
    isActiveRef.current = false;
    if (instructionTimerRef.current) {
      clearInterval(instructionTimerRef.current);
      instructionTimerRef.current = null;
    }
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    await stopAudioRecording();
  };

  // Trigger ripple animation when sound detected
  const triggerRipple = () => {
    const randomRipple = rippleAnimations[Math.floor(Math.random() * rippleAnimations.length)];
    
    Animated.parallel([
      Animated.timing(randomRipple.scale, {
        toValue: 2.5,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(randomRipple.opacity, {
          toValue: 0.6,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(randomRipple.opacity, {
          toValue: 0,
          duration: 1700,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      randomRipple.scale.setValue(1);
      randomRipple.opacity.setValue(0);
    });
  };

  // Breathing animation (continuous)
  useEffect(() => {
    if (!sessionStarted || currentPhase === 'idle' || currentPhase === 'complete') {
      return;
    }

    const breathing = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(breathingScale, {
            toValue: 1.2,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(breathingGlow, {
            toValue: 0.6,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(breathingScale, {
            toValue: 1,
            duration: 6000,
            useNativeDriver: true,
          }),
          Animated.timing(breathingGlow, {
            toValue: 0.3,
            duration: 6000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    breathing.start();
    return () => breathing.stop();
  }, [sessionStarted, currentPhase]);

  // Phase progression
  useEffect(() => {
    if (!sessionStarted || currentPhase === 'idle' || currentPhase === 'complete') {
      return;
    }

    isActiveRef.current = true;

    switch (currentPhase) {
      case 'settling':
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('openDoor');
          }
        }, 10000); // 10 seconds
        break;

      case 'openDoor':
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('mindfulness');
            setCurrentInstructionIndex(0);
          }
        }, 20000); // 20 seconds
        break;

      case 'mindfulness':
        // Reset instruction count when entering mindfulness phase
        instructionCountRef.current = 0;
        
        // Rotate instructions every 10 seconds
        instructionTimerRef.current = setInterval(() => {
          if (!isActiveRef.current) return;

          instructionFade.setValue(0);
          Animated.timing(instructionFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();

          instructionCountRef.current++;
          setCurrentInstructionIndex((prev) => {
            const next = (prev + 1) % MINDFULNESS_INSTRUCTIONS.length;
            // After showing all 5 instructions (50 seconds), move to returning phase
            if (instructionCountRef.current >= MINDFULNESS_INSTRUCTIONS.length) {
              setTimeout(() => {
                if (isActiveRef.current) {
                  setCurrentPhase('returning');
                }
              }, 10000);
            }
            return next;
          });
        }, 10000); // 10 seconds per instruction

        // Fallback: move to returning after 60 seconds total
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('returning');
          }
        }, 60000);
        break;

      case 'returning':
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('complete');
            setShowCompletion(true);
            stopAudioRecording();
          }
        }, 15000); // 15 seconds
        break;
    }

    return () => {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
      if (instructionTimerRef.current) {
        clearInterval(instructionTimerRef.current);
        instructionTimerRef.current = null;
      }
    };
  }, [currentPhase, sessionStarted]);

  const handleStart = async () => {
    setSessionStarted(true);
    setCurrentPhase('settling');
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (hasMicrophonePermission) {
      await startAudioRecording();
    }
  };

  const handleDone = async () => {
    await cleanup();
    navigation.goBack();
  };

  const handleReflect = async () => {
    try {
      await emotionService.saveEmotionTile(EmotionType.CALM_CLARITY);
    } catch (error) {
      console.error('Error saving sound practice:', error);
    }
    await cleanup();
    navigation.goBack();
    setTimeout(() => {
      navigation.getParent()?.navigate('AwarenessTab');
    }, 300);
  };

  const handleRepeat = async () => {
    await cleanup();
    setShowCompletion(false);
    setSessionStarted(false);
    setCurrentPhase('idle');
    setCurrentInstructionIndex(0);
    breathingScale.setValue(1);
    breathingGlow.setValue(0.3);
    instructionFade.setValue(1);
    fadeAnim.setValue(0);
  };

  const getCurrentInstruction = () => {
    if (currentPhase === 'settling') {
      return language === 'en'
        ? 'Sit comfortably.\nLet the body relax…'
        : 'සුවපහසුවෙන් වාඩි වන්න.\nශරීරය සන්සුන් වීමට ඉඩ දෙන්න…';
    }
    if (currentPhase === 'openDoor') {
      return language === 'en'
        ? 'Listen…\nDon\'t search for sounds.\nLet them come to you.'
        : 'අසන්න…\nශබ්ද සොයන්න එපා.\nඒවා ඔබ වෙතට එන්නට ඉඩ දෙන්න.';
    }
    if (currentPhase === 'mindfulness') {
      return MINDFULNESS_INSTRUCTIONS[currentInstructionIndex][language === 'en' ? 'en' : 'si'];
    }
    if (currentPhase === 'returning') {
      return language === 'en'
        ? 'Let go of the sounds now…\nReturn to the breath gently.'
        : 'දැන් ශබ්ද අත්හැර දමන්න…\nහුස්මට මෘදුවෙන් ආපසු එන්න.';
    }
    return '';
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
              backgroundColor: '#4A5F8A',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.completionContainer}>
          <Animated.View style={[styles.completionCard, { opacity: fadeAnim }]}>
            <Text style={styles.completionIcon}>🌿</Text>
            <Text style={[styles.completionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Well done' : 'හොඳයි'}
            </Text>
            <Text style={[styles.completionSubtitle, { color: colors.text }]}>
              {language === 'en'
                ? 'You observed sound with clarity.'
                : 'ඔබ ශබ්ද පැහැදිලිව නිරීක්ෂණය කළේය.'}
            </Text>
            <Text style={[styles.completionText, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'When we stop reacting to sounds, the mind becomes peaceful.'
                : 'අපි ශබ්දවලට ප්‍රතික්‍රියා කිරීම නවත්වන විට, මනස සාමකාමී වේ.'}
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
                style={[styles.completionButton, { backgroundColor: '#4A5F8A' }]}
                onPress={handleReflect}
              >
                <Text style={[styles.completionButtonText, { color: '#FFFFFF' }]}>
                  {language === 'en' ? 'Add to Awareness' : 'සැලකිල්ලට එක් කරන්න'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.repeatButton} onPress={handleRepeat}>
              <Text style={[styles.repeatButtonText, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Repeat (1 min)' : 'නැවත කරන්න (විනාඩි 1)'}
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
              backgroundColor: '#4A5F8A',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.introContainer}>
          <Animated.View style={[styles.introCard, { opacity: fadeAnim }]}>
            <View style={[styles.introIcon, { backgroundColor: '#4A5F8A' + '30' }]}>
              <Waves size={48} color="#4A5F8A" strokeWidth={1.5} />
            </View>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              {language === 'en' ? 'Sound Awareness' : 'ශබ්ද සැලකිල්ල'}
            </Text>
            <Text style={[styles.introSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? '1–2 minute sensory mindfulness practice'
                : 'විනාඩි 1–2 ක සංවේදී සැලකිලි පුරුදුව'}
            </Text>
            {!hasMicrophonePermission && (
              <Text style={[styles.permissionWarning, { color: colors.textSecondary }]}>
                {language === 'en'
                  ? 'Microphone permission needed for sound detection. You can still practice without it.'
                  : 'ශබ්ද හඳුනාගැනීම සඳහා මයික්‍රොෆෝන අවසරය අවශ්‍යයි. එය නොමැතිව ඔබට තවමත් පුරුදු කළ හැකිය.'}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: '#4A5F8A' }]}
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
      {/* Dark Navy Gradient Background */}
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['#1a1f3a', '#2d3a5a', colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating Ripples */}
      {rippleAnimations.map((ripple, index) => (
        <Animated.View
          key={index}
          style={[
            styles.ripple,
            {
              left: SCREEN_WIDTH / 2 + ripple.x,
              top: SCREEN_HEIGHT / 2 + ripple.y,
              transform: [{ scale: ripple.scale }],
              opacity: ripple.opacity,
              borderColor: '#4A5F8A',
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
              {language === 'en' ? 'Sound Awareness' : 'ශබ්ද සැලකිල්ල'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Let sounds come and go, like waves.'
                : 'ශබ්ද එනවා, යනවා, රළ මෙන්.'}
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Based on Satipaṭṭhāna — mindfulness through the senses.'
                : 'සතිපට්ඨාන මත පදනම්ව — සංවේදී අවයව හරහා සැලකිල්ල.'}
            </Text>
          </View>

          {/* Center Breathing Circle */}
          <View style={styles.circleContainer}>
            <Animated.View
              style={[
                styles.glowRing,
                {
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  opacity: breathingGlow,
                  backgroundColor: '#4A5F8A' + '40',
                  transform: [{ scale: breathingScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.mainCircle,
                {
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  backgroundColor: '#4A5F8A' + '20',
                  transform: [{ scale: breathingScale }],
                },
              ]}
            >
              <Waves size={60} color="#4A5F8A" strokeWidth={1.5} />
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
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 16,
      lineHeight: 24,
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
    circleContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 60,
      height: 220,
      position: 'relative',
    },
    glowRing: {
      position: 'absolute',
    },
    mainCircle: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ripple: {
      position: 'absolute',
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 2,
    },
    instructionContainer: {
      marginBottom: 32,
      paddingHorizontal: 20,
      minHeight: 120,
      justifyContent: 'center',
    },
    instructionText: {
      fontSize: 24,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 36,
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
      marginBottom: 16,
    },
    permissionWarning: {
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
      marginBottom: 24,
      fontStyle: 'italic',
      opacity: 0.7,
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

