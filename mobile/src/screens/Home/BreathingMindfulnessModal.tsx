import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { emotionService } from '../../services/emotion.service';
import { EmotionType } from '../../utils/emotions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type MeditationState = 'idle' | 'inhale' | 'exhale' | 'complete';
type SessionDuration = 60 | 180; // 1 minute or 3 minutes

interface BreathingMindfulnessModalProps {
  visible: boolean;
  onClose: () => void;
}

interface FocusCue {
  en: string;
  si: string;
}

const FOCUS_CUES: FocusCue[] = [
  { en: 'Tip of the nose', si: 'නාසයේ කෙළවර' },
  { en: 'Air touching the nostrils', si: 'නාසයට ස්පර්ශ වන වාතය' },
  { en: 'Rising and falling', si: 'ඉහළට හා පහළට' },
  { en: 'Whole breath body', si: 'සම්පූර්ණ හුස්ම ශරීරය' },
  { en: 'Relaxing the shoulders', si: 'උරහිස් සුවපහසු කිරීම' },
  { en: 'Softening the face', si: 'මුහුණ මෘදු කිරීම' },
];

export default function BreathingMindfulnessModal({
  visible,
  onClose,
}: BreathingMindfulnessModalProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [sessionDuration, setSessionDuration] = useState<SessionDuration>(60);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [meditationState, setMeditationState] = useState<MeditationState>('idle');
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  // Animation refs
  const breathingScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Timer refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false); // Track if meditation is active

  const INHALE_DURATION = 4000; // 4 seconds
  const EXHALE_DURATION = 6000; // 6 seconds

  // Reset all timers
  const clearAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    timerRef.current = null;
    phaseTimerRef.current = null;
    focusTimerRef.current = null;
  };

  // Animate breathing cycle based on state changes
  useEffect(() => {
    // Only animate if we're in an active breathing state
    if (meditationState !== 'inhale' && meditationState !== 'exhale') {
      return;
    }

    if (meditationState === 'inhale') {
      // Inhale: expand (soft blue)
      Animated.parallel([
        Animated.timing(breathingScale, {
          toValue: 1.4,
          duration: INHALE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.6,
          duration: INHALE_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After inhale completes, switch to exhale if still active
        if (isActiveRef.current) {
          setMeditationState('exhale');
        }
      });
    } else if (meditationState === 'exhale') {
      // Exhale: contract (soft purple)
      Animated.parallel([
        Animated.timing(breathingScale, {
          toValue: 1,
          duration: EXHALE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: EXHALE_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After exhale completes, switch back to inhale if still active
        if (isActiveRef.current) {
          setMeditationState('inhale');
        }
      });
    }
  }, [meditationState]); // Only depend on meditationState

  // Start meditation
  const handleStart = () => {
    setTimeRemaining(sessionDuration);
    setShowCompletion(false);
    progressAnim.setValue(0);
    isActiveRef.current = true; // Mark as active

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          isActiveRef.current = false; // Mark as inactive
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set initial state to inhale to start the cycle
    setMeditationState('inhale');

    // Start progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: sessionDuration * 1000,
      useNativeDriver: false,
    }).start();

    // Breathing cycle will start automatically via useEffect when state changes to 'inhale'

    // Rotate focus cues every 20 seconds
    focusTimerRef.current = setInterval(() => {
      setCurrentFocusIndex(prev => (prev + 1) % FOCUS_CUES.length);
    }, 20000);
  };

  // Complete meditation
  const handleComplete = async () => {
    isActiveRef.current = false; // Mark as inactive
    clearAllTimers();
    setMeditationState('complete');
    setShowCompletion(true);

    // Log mindful moment to Awareness
    try {
      await emotionService.saveEmotionTile(EmotionType.CALM_CLARITY);
    } catch (error) {
      console.error('Error logging mindful moment:', error);
    }
  };

  // Reset meditation
  const handleReset = () => {
    isActiveRef.current = false; // Mark as inactive
    clearAllTimers();
    setMeditationState('idle');
    setTimeRemaining(sessionDuration);
    setShowCompletion(false);
    setCurrentFocusIndex(0);
    breathingScale.setValue(1);
    glowOpacity.setValue(0.3);
    progressAnim.setValue(0);
  };

  // Close modal
  const handleClose = () => {
    clearAllTimers();
    handleReset();
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      handleReset();
    }
  }, [visible]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getInstructionText = () => {
    if (meditationState === 'idle') {
      return language === 'en' ? 'Ready to begin' : 'ආරම්භ කිරීමට සූදානම්';
    }
    if (meditationState === 'complete') {
      return '';
    }
    if (meditationState === 'inhale') {
      return language === 'en'
        ? 'Breathing in… know you are breathing in.'
        : 'හුස්ම ගන්න… ඔබ හුස්ම ගන්නා බව දැනගන්න.';
    }
    if (meditationState === 'exhale') {
      return language === 'en'
        ? 'Breathing out… know you are breathing out.'
        : 'හුස්ම මුදා හරින්න… ඔබ හුස්ම මුදා හරින බව දැනගන්න.';
    }
    return '';
  };

  const getBreathColor = () => {
    if (meditationState === 'inhale') {
      return '#87CEEB'; // Soft blue
    }
    if (meditationState === 'exhale') {
      return '#B19CD9'; // Soft purple
    }
    return colors.primaryLight;
  };

  const progressPercentage = ((sessionDuration - timeRemaining) / sessionDuration) * 100;

  if (showCompletion) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.overlay}>
            {/* Background blur and gradient */}
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={['rgba(135, 206, 235, 0.1)', 'rgba(177, 156, 217, 0.1)']}
              style={StyleSheet.absoluteFill}
            />

            <View style={[styles.content, { backgroundColor: colors.card }]}>
              <Text style={styles.completionIcon}>🙏</Text>
              <Text style={[styles.completionTitle, { color: colors.text }]}>
                {language === 'en' ? 'Well done' : 'හොඳයි'}
              </Text>
              <Text style={[styles.completionText, { color: colors.textSecondary }]}>
                {language === 'en'
                  ? 'You practised mindfulness of breathing.\nObserve how your mind feels now.'
                  : 'ඔබ හුස්ම සැලකිල්ල පුරුදු කළේය.\nදැන් ඔබේ මනස දැනෙන ආකාරය නිරීක්ෂණය කරන්න.'}
              </Text>

              <View style={styles.completionButtons}>
                <TouchableOpacity
                  style={[styles.completionButton, { backgroundColor: colors.primary }]}
                  onPress={handleClose}
                >
                  <Text style={styles.completionButtonText}>
                    {language === 'en' ? 'Continue' : 'දිගටම'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.completionButton, styles.completionButtonSecondary, { borderColor: colors.primary }]}
                  onPress={() => {
                    setSessionDuration(60);
                    handleReset();
                    handleStart();
                  }}
                >
                  <Text style={[styles.completionButtonTextSecondary, { color: colors.primary }]}>
                    {language === 'en' ? 'Repeat 1 min' : '1 විනාඩිය නැවත'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.completionButton, styles.completionButtonSecondary, { borderColor: colors.primary }]}
                  onPress={() => {
                    setSessionDuration(180);
                    setTimeRemaining(180);
                    handleReset();
                    handleStart();
                  }}
                >
                  <Text style={[styles.completionButtonTextSecondary, { color: colors.primary }]}>
                    {language === 'en' ? 'Try 3 min session' : '3 විනාඩි සැසිය උත්සාහ කරන්න'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.overlay}>
          {/* Background blur and gradient */}
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(135, 206, 235, 0.15)', 'rgba(177, 156, 217, 0.15)']}
            style={StyleSheet.absoluteFill}
          />
          {/* Vignette effect */}
          <View style={styles.vignette} />

          <View style={[styles.content, { backgroundColor: colors.card }]}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>
              {language === 'en' ? 'Mindful Breathing' : 'සැලකිලිමත් හුස්ම'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Ānāpānasati' : 'ආනාපානසති'}
            </Text>

            {/* Breathing circle with progress ring */}
            <View style={styles.breathingContainer}>
              {/* Progress ring */}
              <View style={styles.progressRingContainer}>
                <Animated.View
                  style={[
                    styles.progressRing,
                    {
                      borderColor: getBreathColor(),
                      borderRightColor: 'transparent',
                      borderBottomColor: 'transparent',
                      transform: [
                        {
                          rotate: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['-90deg', '270deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>

              {/* Outer glow ring */}
              <Animated.View
                style={[
                  styles.glowRing,
                  {
                    width: 200,
                    height: 200,
                    borderRadius: 100,
                    backgroundColor: getBreathColor(),
                    opacity: glowOpacity,
                    transform: [{ scale: breathingScale }],
                  },
                ]}
              />

              {/* Inner core circle */}
              <Animated.View
                style={[
                  styles.breathingCircle,
                  {
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: getBreathColor(),
                    transform: [{ scale: breathingScale }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.innerCircle,
                    {
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: colors.background,
                      opacity: 0.8,
                    },
                  ]}
                />
              </Animated.View>
            </View>

            {/* Instruction text */}
            <Text style={[styles.instructionText, { color: colors.text }]}>
              {getInstructionText()}
            </Text>

            {/* Timer */}
            <Text style={[styles.timer, { color: colors.textSecondary }]}>
              {formatTime(timeRemaining)}
            </Text>

            {/* Focus cue */}
            {meditationState !== 'idle' && (
              <View style={styles.focusContainer}>
                <Text style={[styles.focusLabel, { color: colors.textSecondary }]}>
                  {language === 'en' ? 'Focus:' : 'අවධානය:'}
                </Text>
                <Text style={[styles.focusCue, { color: colors.text }]}>
                  {language === 'en'
                    ? FOCUS_CUES[currentFocusIndex].en
                    : FOCUS_CUES[currentFocusIndex].si}
                </Text>
              </View>
            )}

            {/* Session duration selector (only when idle) */}
            {meditationState === 'idle' && (
              <View style={styles.durationSelector}>
                <TouchableOpacity
                  style={[
                    styles.durationButton,
                    sessionDuration === 60 && { backgroundColor: colors.primary },
                    { borderColor: colors.primary },
                  ]}
                  onPress={() => {
                    setSessionDuration(60);
                    setTimeRemaining(60);
                  }}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      sessionDuration === 60 && { color: '#FFFFFF' },
                      sessionDuration !== 60 && { color: colors.primary },
                    ]}
                  >
                    1 {language === 'en' ? 'min' : 'විනාඩිය'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.durationButton,
                    sessionDuration === 180 && { backgroundColor: colors.primary },
                    { borderColor: colors.primary },
                  ]}
                  onPress={() => {
                    setSessionDuration(180);
                    setTimeRemaining(180);
                  }}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      sessionDuration === 180 && { color: '#FFFFFF' },
                      sessionDuration !== 180 && { color: colors.primary },
                    ]}
                  >
                    3 {language === 'en' ? 'min' : 'විනාඩි'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Controls */}
            <View style={styles.controls}>
              {meditationState === 'idle' ? (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={handleStart}
                >
                  <Text style={styles.buttonText}>
                    {language === 'en' ? 'Start' : 'ආරම්භ කරන්න'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.border }]}
                  onPress={handleReset}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>
                    {language === 'en' ? 'Reset' : 'නැවත සැකසීම'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  content: {
    borderRadius: 32,
    padding: 32,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    padding: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 32,
    textAlign: 'center',
  },
  breathingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
    height: 220,
    width: 220,
    position: 'relative',
  },
  progressRingContainer: {
    position: 'absolute',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
  },
  glowRing: {
    position: 'absolute',
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  breathingCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  timer: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 2,
  },
  focusContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  focusLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  focusCue: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  durationSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  durationButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    width: '100%',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  completionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  completionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  completionButtons: {
    width: '100%',
    gap: 12,
  },
  completionButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  completionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  completionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completionButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
});
