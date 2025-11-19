import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
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

type MettaPhase = 'idle' | 'self' | 'loved' | 'neutral' | 'all' | 'complete';

interface PhraseSet {
  self: { en: string; si: string }[];
  loved: { en: string; si: string }[];
  neutral: { en: string; si: string }[];
  all: { en: string; si: string }[];
}

const PHRASE_SETS: PhraseSet[] = [
  // Set A
  {
    self: [
      { en: 'May I be peaceful.', si: 'මම සාමකාමී වෙමි.' },
      { en: 'May I be safe.', si: 'මම ආරක්ෂිත වෙමි.' },
      { en: 'May I be filled with kindness.', si: 'මම කරුණාවෙන් පිරී යමි.' },
    ],
    loved: [
      { en: 'May you be peaceful.', si: 'ඔබ සාමකාමී වේවා.' },
      { en: 'May you be safe.', si: 'ඔබ ආරක්ෂිත වේවා.' },
      { en: 'May you be well.', si: 'ඔබ සුවපත් වේවා.' },
    ],
    neutral: [
      { en: 'May you be peaceful.', si: 'ඔබ සාමකාමී වේවා.' },
      { en: 'May you be happy.', si: 'ඔබ සතුටු වේවා.' },
    ],
    all: [
      { en: 'May all beings be free from suffering.', si: 'සියලු සත්වයන් දුකින් මිදෙනු ලැබේවා.' },
      { en: 'May all beings be peaceful.', si: 'සියලු සත්වයන් සාමකාමී වේවා.' },
      { en: 'May all beings be well.', si: 'සියලු සත්වයන් සුවපත් වේවා.' },
    ],
  },
  // Set B
  {
    self: [
      { en: 'May I be gentle with myself.', si: 'මම මා සමඟ මෘදු වෙමි.' },
      { en: 'May I be healthy.', si: 'මම සෞඛ්‍ය සම්පන්න වෙමි.' },
      { en: 'May I live with ease.', si: 'මම සැහැල්ලුවෙන් ජීවත් වෙමි.' },
    ],
    loved: [
      { en: 'May you be healthy.', si: 'ඔබ සෞඛ්‍ය සම්පන්න වේවා.' },
      { en: 'May you live with ease.', si: 'ඔබ සැහැල්ලුවෙන් ජීවත් වේවා.' },
      { en: 'May you be peaceful.', si: 'ඔබ සාමකාමී වේවා.' },
    ],
    neutral: [
      { en: 'May you be peaceful.', si: 'ඔබ සාමකාමී වේවා.' },
      { en: 'May you be happy.', si: 'ඔබ සතුටු වේවා.' },
    ],
    all: [
      { en: 'May all beings be free from harm.', si: 'සියලු සත්වයන් හානියෙන් මිදෙනු ලැබේවා.' },
      { en: 'May all beings be free from fear.', si: 'සියලු සත්වයන් බියෙන් මිදෙනු ලැබේවා.' },
      { en: 'May all beings be happy.', si: 'සියලු සත්වයන් සතුටු වේවා.' },
    ],
  },
  // Set C
  {
    self: [
      { en: 'May I be peaceful.', si: 'මම සාමකාමී වෙමි.' },
      { en: 'May I be safe.', si: 'මම ආරක්ෂිත වෙමි.' },
      { en: 'May I be kind to myself.', si: 'මම මා සමඟ කරුණාවෙන් සිටිමි.' },
    ],
    loved: [
      { en: 'May you be safe.', si: 'ඔබ ආරක්ෂිත වේවා.' },
      { en: 'May you be peaceful.', si: 'ඔබ සාමකාමී වේවා.' },
      { en: 'May you be well.', si: 'ඔබ සුවපත් වේවා.' },
    ],
    neutral: [
      { en: 'May you be peaceful.', si: 'ඔබ සාමකාමී වේවා.' },
      { en: 'May you be happy.', si: 'ඔබ සතුටු වේවා.' },
    ],
    all: [
      { en: 'May all beings be free from harm.', si: 'සියලු සත්වයන් හානියෙන් මිදෙනු ලැබේවා.' },
      { en: 'May all beings be free from fear.', si: 'සියලු සත්වයන් බියෙන් මිදෙනු ලැබේවා.' },
      { en: 'May all beings be happy.', si: 'සියලු සත්වයන් සතුටු වේවා.' },
    ],
  },
];

const PHASE_DURATIONS = {
  self: 30000, // 30 seconds
  loved: 30000,
  neutral: 30000,
  all: 45000, // 45 seconds
};

const SESSION_DURATIONS = {
  short: 60, // 1 minute
  medium: 120, // 2 minutes
  long: 180, // 3 minutes
};

export default function MettaPracticeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [sessionDuration, setSessionDuration] = useState<60 | 120 | 180>(180);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<MettaPhase>('idle');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [phrasesCompleted, setPhrasesCompleted] = useState(0);
  
  // Select random phrase set
  const [phraseSet] = useState(() => {
    return PHRASE_SETS[Math.floor(Math.random() * PHRASE_SETS.length)];
  });

  // Animations
  const heartScale = useRef(new Animated.Value(1)).current;
  const heartGlow = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const phraseFade = useRef(new Animated.Value(1)).current;
  const particleAnim = useRef(
    Array.from({ length: 8 }, () => ({
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0.3),
    }))
  ).current;

  // Initialize intro fade
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Heart breathing animation
  useEffect(() => {
    if (!sessionStarted || currentPhase === 'idle' || currentPhase === 'complete') return;

    const breathing = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(heartScale, {
            toValue: 1.3,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(heartGlow, {
            toValue: 0.7,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(heartScale, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: true,
          }),
          Animated.timing(heartGlow, {
            toValue: 0.3,
            duration: 5000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    breathing.start();
    return () => breathing.stop();
  }, [sessionStarted, currentPhase]);

  // Floating particles animation
  useEffect(() => {
    if (!sessionStarted) return;

    const particleAnimations = particleAnim.map((particle, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 500),
          Animated.parallel([
            Animated.timing(particle.translateY, {
              toValue: -SCREEN_HEIGHT,
              duration: 8000 + Math.random() * 4000,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 0.6,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0.2,
                duration: 6000,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ])
      );
    });

    particleAnimations.forEach((anim) => anim.start());

    return () => {
      particleAnimations.forEach((anim) => anim.stop());
    };
  }, [sessionStarted]);

  // Phase progression
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);

  useEffect(() => {
    if (!sessionStarted || currentPhase === 'idle' || currentPhase === 'complete') {
      isActiveRef.current = false;
      if (phaseTimerRef.current) {
        clearInterval(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
      return;
    }

    isActiveRef.current = true;
    const phaseOrder: MettaPhase[] = ['self', 'loved', 'neutral', 'all'];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    
    if (currentIndex === -1) return;

    const currentPhrases = phraseSet[currentPhase];
    const phraseCount = currentPhrases.length;
    const phraseDuration = PHASE_DURATIONS[currentPhase] / phraseCount;
    let localPhraseIndex = currentPhraseIndex;

    // Clear any existing timer
    if (phaseTimerRef.current) {
      clearInterval(phaseTimerRef.current);
    }

    // Rotate through phrases
    phaseTimerRef.current = setInterval(() => {
      if (!isActiveRef.current) return;

      localPhraseIndex = (localPhraseIndex + 1) % phraseCount;
      setCurrentPhraseIndex(localPhraseIndex);
      
      // Fade animation for phrase change
      phraseFade.setValue(0);
      Animated.timing(phraseFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      setPhrasesCompleted((prev) => prev + 1);

      // If we've completed all phrases in this phase
      if (localPhraseIndex === phraseCount - 1) {
        setTimeout(() => {
          if (!isActiveRef.current) return;
          
          if (currentIndex < phaseOrder.length - 1) {
            // Move to next phase
            setCurrentPhase(phaseOrder[currentIndex + 1]);
            setCurrentPhraseIndex(0);
          } else {
            // All phases complete
            setCurrentPhase('complete');
            setShowCompletion(true);
          }
        }, phraseDuration);
      }
    }, phraseDuration);

    return () => {
      isActiveRef.current = false;
      if (phaseTimerRef.current) {
        clearInterval(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
    };
  }, [sessionStarted, currentPhase, phraseSet]);

  const handleStart = () => {
    setSessionStarted(true);
    setCurrentPhase('self');
    setCurrentPhraseIndex(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleDone = async () => {
    // Log kindness/compassion emotion
    try {
      await emotionService.saveEmotionTile(EmotionType.CALM_CLARITY);
    } catch (error) {
      console.error('Error saving metta practice:', error);
    }
    navigation.goBack();
  };

  const handleReflect = async () => {
    try {
      await emotionService.saveEmotionTile(EmotionType.CALM_CLARITY);
    } catch (error) {
      console.error('Error saving metta practice:', error);
    }
    navigation.goBack();
    setTimeout(() => {
      navigation.getParent()?.navigate('AwarenessTab');
    }, 300);
  };

  const handleRepeat = () => {
    setShowCompletion(false);
    setCurrentPhase('self');
    setCurrentPhraseIndex(0);
    setPhrasesCompleted(0);
    setSessionStarted(true);
  };

  const getCurrentPhrase = () => {
    if (currentPhase === 'idle' || currentPhase === 'complete') return null;
    const phrases = phraseSet[currentPhase];
    return phrases[currentPhraseIndex] || phrases[0];
  };

  const getPhaseGuidance = () => {
    if (currentPhase === 'self') {
      return language === 'en'
        ? 'Send kindness to yourself.'
        : 'ඔබටම කරුණාව යවන්න.';
    } else if (currentPhase === 'loved') {
      return language === 'en'
        ? 'Bring to mind someone you care about.'
        : 'ඔබ ගැන සිතන කෙනෙකු මතක් කරන්න.';
    } else if (currentPhase === 'neutral') {
      return language === 'en'
        ? 'Think of someone you hardly notice.'
        : 'ඔබ ගැන අඩුවෙන් සිතන කෙනෙකු සිතන්න.';
    } else if (currentPhase === 'all') {
      return language === 'en'
        ? 'Expand kindness to all beings.'
        : 'සියලු සත්වයන්ට කරුණාව පුළුල් කරන්න.';
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
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#D4A5A5',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.completionContainer}>
          <Animated.View style={[styles.completionCard, { opacity: fadeAnim }]}>
            <Text style={styles.completionIcon}>💝</Text>
            <Text style={[styles.completionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Beautiful' : 'සුන්දර'}
            </Text>
            <Text style={[styles.completionSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'You cultivated kindness today.'
                : 'ඔබ අද කරුණාව වැඩුවේය.'}
            </Text>
            <Text style={[styles.completionText, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'A soft heart leads to a peaceful mind.\nThis is the way of Metta.'
                : 'මෘදු හදවතක් සාමකාමී මනසකට මග පාදයි.\nමෙය මෙත්තාවේ මාර්ගයයි.'}
            </Text>
            
            <View style={styles.summaryContainer}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Phrases completed' : 'සම්පූර්ණ කළ වාක්‍ය'}
              </Text>
              <Text style={[styles.summaryValue, { color: '#D4A5A5' }]}>
                {phrasesCompleted}
              </Text>
            </View>

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
                style={[styles.completionButton, { backgroundColor: '#D4A5A5' }]}
                onPress={handleReflect}
              >
                <Text style={[styles.completionButtonText, { color: '#FFFFFF' }]}>
                  {language === 'en' ? 'Reflect' : 'සිතා බලන්න'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.repeatButton}
              onPress={handleRepeat}
            >
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
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#D4A5A5',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.introContainer}>
          <Animated.View style={[styles.introCard, { opacity: fadeAnim }]}>
            <View style={[styles.introIcon, { backgroundColor: '#D4A5A5' + '30' }]}>
              <Heart size={48} color="#D4A5A5" strokeWidth={1.5} fill="#D4A5A5" />
            </View>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              {language === 'en' ? 'Loving-Kindness (Metta)' : 'කරුණාව (මෙත්තා)'}
            </Text>
            <Text style={[styles.introSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? '1–3 minute heart-opening practice'
                : 'විනාඩි 1–3 ක හදවත විවෘත කරන පුරුදුව'}
            </Text>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: '#D4A5A5' }]}
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

  const currentPhrase = getCurrentPhrase();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Dark Theme Background with Subtle Warm Tint */}
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[colors.background, colors.background + 'F0', colors.background + 'E0']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Subtle Warm Overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#D4A5A5',
            opacity: 0.05,
          },
        ]}
      />
      
      {/* Floating Particles */}
      {particleAnim.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              left: (SCREEN_WIDTH / 8) * (index + 1),
              transform: [{ translateY: particle.translateY }],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {language === 'en' ? 'Loving-Kindness (Metta)' : 'කරුණාව (මෙත්තා)'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Wish well-being for yourself and others — softly and sincerely.'
                : 'ඔබට සහ අනෙක් අයට යහපත පතන්න — මෘදුවෙන් සහ සත්‍යවෙන්.'}
            </Text>
          </View>
        </View>

        {/* Heart Circle Animation */}
        <View style={styles.heartContainer}>
          <Animated.View
            style={[
              styles.heartGlow,
              {
                width: 200,
                height: 200,
                borderRadius: 100,
                opacity: heartGlow,
                backgroundColor: '#D4A5A5' + '40',
                transform: [{ scale: heartScale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.heartCircle,
              {
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: '#D4A5A5' + '30',
                transform: [{ scale: heartScale }],
              },
            ]}
          >
            <Heart size={80} color="#D4A5A5" strokeWidth={2} fill="#D4A5A5" />
          </Animated.View>
        </View>

        {/* Phase Guidance */}
        <View style={styles.guidanceContainer}>
          <Text style={[styles.guidanceText, { color: colors.textSecondary }]}>
            {getPhaseGuidance()}
          </Text>
        </View>

        {/* Current Phrase */}
        {currentPhrase && (
          <Animated.View style={[styles.phraseContainer, { opacity: phraseFade }]}>
            <Text style={[styles.phraseText, { color: colors.text }]}>
              {language === 'en' ? currentPhrase.en : currentPhrase.si}
            </Text>
          </Animated.View>
        )}

        {/* Instruction */}
        <View style={styles.instructionContainer}>
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            {language === 'en'
              ? 'Let the phrases be natural.\nNo need to force emotion — just send goodwill gently.'
              : 'වාක්‍ය ස්වාභාවික වීමට ඉඩ දෙන්න.\nහැඟීම් බල කිරීමට අවශ්‍ය නැත — කරුණාව මෘදුවෙන් යවන්න.'}
          </Text>
        </View>
      </ScrollView>
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
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 100,
    },
    header: {
      marginBottom: 32,
    },
    backButton: {
      marginBottom: 16,
    },
    headerContent: {
      marginBottom: 8,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 15,
      lineHeight: 22,
      fontStyle: 'italic',
    },
    heartContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 40,
      height: 220,
    },
    heartGlow: {
      position: 'absolute',
    },
    heartCircle: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    guidanceContainer: {
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    guidanceText: {
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    phraseContainer: {
      marginBottom: 32,
      paddingHorizontal: 20,
    },
    phraseText: {
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 32,
      textAlign: 'center',
    },
    instructionContainer: {
      marginTop: 24,
      paddingHorizontal: 20,
    },
    instructionText: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      fontStyle: 'italic',
      opacity: 0.7,
    },
    particle: {
      position: 'absolute',
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#D4A5A5',
      opacity: 0.3,
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
      marginBottom: 24,
    },
    summaryContainer: {
      width: '100%',
      alignItems: 'center',
      marginBottom: 32,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border + '40',
    },
    summaryLabel: {
      fontSize: 14,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 24,
      fontWeight: '700',
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

