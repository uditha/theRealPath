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
import { Mountain } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { emotionService } from '../../services/emotion.service';
import { EmotionType } from '../../utils/emotions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type EquanimityPhase = 'idle' | 'settling' | 'teaching' | 'phrases' | 'stability' | 'final' | 'complete';

const EQUANIMITY_PHRASES = [
  // Set A (Beginner-friendly)
  { en: 'May I remain calm.', si: 'මම සන්සුන්ව සිටීමට ඉඩ දෙමි.' },
  { en: 'May I accept things as they are.', si: 'දේවල් ඒවා ඇති ආකාරයට පිළිගන්නට ඉඩ දෙමි.' },
  { en: 'May I be balanced in mind.', si: 'මනසේ සමතුලිත වීමට ඉඩ දෙමි.' },
  // Set B (Wisdom-focused)
  { en: 'Pleasant things come and go.', si: 'සතුටුදායක දේවල් එනවා සහ යනවා.' },
  { en: 'Unpleasant things come and go.', si: 'අසතුටුදායක දේවල් එනවා සහ යනවා.' },
  { en: 'I rest in the middle.', si: 'මම මැද තුළ විවේක ගනිමි.' },
  // Set C (Non-self reflection)
  { en: 'Thoughts arise and pass.', si: 'සිතුවිලි ඇති වනවා සහ අතුරුදහන් වනවා.' },
  { en: 'Emotions rise and fade.', si: 'හැඟීම් නැගීම සහ මැකී යාම.' },
  { en: 'This is just nature.', si: 'මෙය ස්වභාවය පමණි.' },
];

const PHASE_DURATIONS = {
  settling: 15000, // 15 seconds
  teaching: 15000, // 15 seconds
  phrases: 60000, // 60 seconds (rotating phrases)
  stability: 20000, // 20 seconds
  final: 15000, // 15 seconds
};

const PHRASE_DURATION = 8000; // 8 seconds per phrase

export default function EquanimityScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [currentPhase, setCurrentPhase] = useState<EquanimityPhase>('idle');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const phraseFade = useRef(new Animated.Value(1)).current;
  const breathingAnim = useRef(new Animated.Value(0)).current;
  const mountainScale = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

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

  // Breathing animation (mountain pulse)
  useEffect(() => {
    if (!sessionStarted || currentPhase === 'idle' || currentPhase === 'complete') {
      return;
    }

    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnim, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    );

    breathing.start();
    return () => breathing.stop();
  }, [sessionStarted, currentPhase]);

  // Mountain scale animation (gentle pulse)
  useEffect(() => {
    if (!sessionStarted || currentPhase === 'idle' || currentPhase === 'complete') {
      return;
    }

    const scaleAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(mountainScale, {
          toValue: 1.02,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(mountainScale, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    );

    scaleAnim.start();
    return () => scaleAnim.stop();
  }, [sessionStarted, currentPhase]);

  // Wave animation (during stability phase)
  useEffect(() => {
    if (currentPhase === 'stability') {
      const wave = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      );

      wave.start();
      return () => wave.stop();
    } else {
      waveAnim.setValue(0);
    }
  }, [currentPhase]);

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
            setCurrentPhase('teaching');
          }
        }, PHASE_DURATIONS.settling);
        break;

      case 'teaching':
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('phrases');
            setCurrentPhraseIndex(0);
          }
        }, PHASE_DURATIONS.teaching);
        break;

      case 'phrases':
        // Rotate phrases
        setCurrentPhraseIndex(0);
        phraseFade.setValue(1);

        phraseTimerRef.current = setInterval(() => {
          if (!isActiveRef.current) return;

          setCurrentPhraseIndex((prev) => {
            const next = (prev + 1) % EQUANIMITY_PHRASES.length;
            
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

        // Move to stability phase after all phrases
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('stability');
          }
        }, PHASE_DURATIONS.phrases);
        break;

      case 'stability':
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('final');
          }
        }, PHASE_DURATIONS.stability);
        break;

      case 'final':
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('complete');
            setShowCompletion(true);
          }
        }, PHASE_DURATIONS.final);
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
      console.error('Error saving equanimity practice:', error);
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
    mountainScale.setValue(1);
    waveAnim.setValue(0);
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
          ? 'Sit comfortably…\nLet your breath be natural.\n\nLet the body rest.'
          : 'සුවපහසුවෙන් වාඩි වන්න…\nඔබේ හුස්ම ස්වභාවික වීමට ඉඩ දෙන්න.\n\nශරීරය විවේක ගන්නට ඉඩ දෙන්න.';
      case 'teaching':
        return language === 'en'
          ? 'Notice whatever feelings are here…\n\nPleasant or unpleasant…\njust let them be.'
          : 'මෙහි ඇති ඕනෑම හැඟීම් නිරීක්ෂණය කරන්න…\n\nසතුටුදායක හෝ අසතුටුදායක…\nඒවා එලෙසම තබන්න.';
      case 'phrases':
        return EQUANIMITY_PHRASES[currentPhraseIndex]
          ? language === 'en'
            ? EQUANIMITY_PHRASES[currentPhraseIndex].en
            : EQUANIMITY_PHRASES[currentPhraseIndex].si
          : '';
      case 'stability':
        return language === 'en'
          ? 'Be steady like a mountain.\nLet everything pass around you.'
          : 'පර්වතයක් මෙන් ස්ථාවර වන්න.\nසෑම දෙයක්ම ඔබ වටා ගමන් කිරීමට ඉඩ දෙන්න.';
      case 'final':
        return language === 'en'
          ? 'You cannot control everything.\nYou can choose how you hold it.'
          : 'ඔබට සියල්ල පාලනය කළ නොහැක.\nඔබට එය රඳවා ගන්නේ කෙසේදැයි තෝරා ගත හැකිය.';
      default:
        return '';
    }
  };

  // Wave opacity animation
  const waveOpacity = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.4],
  });

  const waveScale = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
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
              backgroundColor: '#8FA3B8',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.completionContainer}>
          <Animated.View style={[styles.completionCard, { opacity: fadeAnim }]}>
            <Text style={styles.completionIcon}>🌿</Text>
            <Text style={[styles.completionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Well done' : 'හොඳට කළා'}
            </Text>
            <Text style={[styles.completionSubtitle, { color: colors.text }]}>
              {language === 'en'
                ? 'You practised stillness and balance.'
                : 'ඔබ ස්ථාවරත්වය සහ සමතුලිතතාවය පුරුදු කළා.'}
            </Text>
            <Text style={[styles.completionText, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Equanimity is the highest peace — you are training it gently.'
                : 'සමතුලිතතාවය උත්තරීතර සාමකාමීකමයි — ඔබ එය මෘදුවෙන් පුහුණු කරනවා.'}
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
                style={[styles.completionButton, { backgroundColor: '#8FA3B8' }]}
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
              backgroundColor: '#8FA3B8',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.introContainer}>
          <Animated.View style={[styles.introCard, { opacity: fadeAnim }]}>
            <View style={[styles.introIcon, { backgroundColor: '#8FA3B8' + '30' }]}>
              <Mountain size={48} color="#8FA3B8" strokeWidth={1.5} />
            </View>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              {language === 'en' ? 'Equanimity (Upekkhā)' : 'සමතුලිතතාවය (උපේක්ඛා)'}
            </Text>
            <Text style={[styles.introSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? '1–2 minute balance and acceptance practice'
                : 'විනාඩි 1–2 ක සමතුලිතතාවය සහ පිළිගැනීමේ පුරුදුව'}
            </Text>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: '#8FA3B8' }]}
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
      {/* Dark Theme Background with Subtle Slate Blue Tint */}
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[colors.background, colors.background + 'F0', colors.background + 'E0']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Subtle Slate Blue Overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#8FA3B8',
            opacity: 0.05,
          },
        ]}
      />

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
            {language === 'en' ? 'Equanimity (Upekkhā)' : 'සමතුලිතතාවය (උපේක්ඛා)'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {language === 'en'
              ? 'Be still, like a mountain. Let experiences pass.'
              : 'පර්වතයක් මෙන් ස්ථාවර වන්න. අත්දැකීම් ගමන් කිරීමට ඉඩ දෙන්න.'}
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {language === 'en'
              ? 'Based on Brahmavihāra: the practice of balanced mind.'
              : 'බ්‍රහ්මවිහාර මත පදනම්ව: සමතුලිත මනසේ පුරුදුව.'}
          </Text>
        </View>

        {/* Mountain Animation */}
        <View style={styles.mountainContainer}>
          {/* Waves (during stability phase) */}
          {currentPhase === 'stability' && (
            <Animated.View
              style={[
                styles.wave,
                {
                  opacity: waveOpacity,
                  transform: [{ scale: waveScale }],
                },
              ]}
            />
          )}

          {/* Mountain Icon */}
          <Animated.View
            style={[
              styles.mountainWrapper,
              {
                transform: [{ scale: mountainScale }],
              },
            ]}
          >
            <Mountain size={120} color="#8FA3B8" strokeWidth={2} />
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
  mountainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  mountainWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  wave: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#8FA3B8',
    zIndex: 1,
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


