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
import { Cloud } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { emotionService } from '../../services/emotion.service';
import { EmotionType } from '../../utils/emotions';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Label {
  id: string;
  en: string;
  si: string;
  category: 'thought' | 'emotion' | 'sensation' | 'urge';
  color: string;
}

const LABELS: Label[] = [
  // Thought Labels
  { id: 'thinking', en: 'Thinking', si: 'සිතනවා', category: 'thought', color: '#87CEEB' },
  { id: 'planning', en: 'Planning', si: 'සැලසුම් කරනවා', category: 'thought', color: '#98D8C8' },
  { id: 'remembering', en: 'Remembering', si: 'මතක් කරනවා', category: 'thought', color: '#A8DADC' },
  { id: 'imagining', en: 'Imagining', si: 'කල්පනා කරනවා', category: 'thought', color: '#B8E0D2' },
  { id: 'judging', en: 'Judging', si: 'විනිශ්චය කරනවා', category: 'thought', color: '#C8E6C9' },
  { id: 'distracted', en: 'Distracted', si: 'විසුරුවා හරිනවා', category: 'thought', color: '#D8E6E3' },
  
  // Emotion Labels
  { id: 'joy', en: 'Joy', si: 'සතුට', category: 'emotion', color: '#FFD93D' },
  { id: 'sad', en: 'Sad', si: 'කණගාටු', category: 'emotion', color: '#6BCAE2' },
  { id: 'angry', en: 'Angry', si: 'කෝපය', category: 'emotion', color: '#FF6B6B' },
  { id: 'fearful', en: 'Fearful', si: 'බිය', category: 'emotion', color: '#9B59B6' },
  { id: 'anxious', en: 'Anxious', si: 'කරදර', category: 'emotion', color: '#E67E22' },
  { id: 'calm', en: 'Calm', si: 'සන්සුන්', category: 'emotion', color: '#52B788' },
  
  // Sensation Labels
  { id: 'tense', en: 'Tense', si: 'තදින්', category: 'sensation', color: '#C77DFF' },
  { id: 'relaxed', en: 'Relaxed', si: 'සුවපහසු', category: 'sensation', color: '#A8D5BA' },
  { id: 'restless', en: 'Restless', si: 'අසන්සුන්', category: 'sensation', color: '#D4A5A5' },
  { id: 'heavy', en: 'Heavy', si: 'බර', category: 'sensation', color: '#95A5A6' },
  { id: 'light', en: 'Light', si: 'සැහැල්ලු', category: 'sensation', color: '#E8F5E9' },
  
  // Urge Labels
  { id: 'wanting', en: 'Wanting', si: 'අවශ්‍ය', category: 'urge', color: '#FF9800' },
  { id: 'not-wanting', en: 'Not Wanting', si: 'අවශ්‍ය නැත', category: 'urge', color: '#FF6F00' },
  { id: 'avoiding', en: 'Avoiding', si: 'වළකනවා', category: 'urge', color: '#FFB74D' },
];

const TIPS = [
  {
    en: 'Noticing is enough. You don\'t need to change anything.',
    si: 'නිරීක්ෂණය කිරීම ප්‍රමාණවත්ය. ඔබට කිසිවක් වෙනස් කිරීමට අවශ්‍ය නැත.',
  },
  {
    en: 'Thoughts are just thoughts — let them pass like clouds.',
    si: 'සිතුවිලි යනු සිතුවිලි පමණි — ඒවා වලාකුළු මෙන් ගමන් කරන්නට ඉඩ දෙන්න.',
  },
  {
    en: 'The goal is awareness, not perfection.',
    si: 'ඉලක්කය නම් සැලකිල්ල, පරිපූර්ණත්වය නොවේ.',
  },
  {
    en: 'Label the mind with kindness.',
    si: 'මනස කරුණාවෙන් නම් කරන්න.',
  },
];

const SESSION_DURATION = 60; // 1 minute default

export default function NotingPracticeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [sessionStarted, setSessionStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATION);
  const [isPaused, setIsPaused] = useState(false); // Fixed: Added pause state
  const [notedCount, setNotedCount] = useState(0);
  const [notedLabels, setNotedLabels] = useState<{ label: Label; timestamp: number }[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  // Shuffled labels for this session
  const [shuffledLabels] = useState(() => {
    const shuffled = [...LABELS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 16); // Show 16 labels max
  });


  // Create floating animations for each balloon
  const balloonAnimations = useRef(
    Array.from({ length: 16 }, () => ({
      translateY: new Animated.Value(0),
      scale: new Animated.Value(1),
    }))
  ).current;

  // Ring animations for each balloon (expands on tap)
  const ringAnimations = useRef(
    Array.from({ length: 16 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  // Initialize intro fade
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);


  // Floating balloon animations
  useEffect(() => {
    if (!sessionStarted) return;

    const floatingAnimations = balloonAnimations.map((anim, index) => {
      // Each balloon floats with different timing and amplitude
      const duration = 2000 + (index % 3) * 500; // 2000-3000ms
      const amplitude = 8 + (index % 4) * 2; // 8-14px
      const delay = index * 100; // Stagger start times

      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(anim.translateY, {
                toValue: -amplitude,
                duration: duration,
                useNativeDriver: true,
              }),
              Animated.timing(anim.translateY, {
                toValue: amplitude,
                duration: duration,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(anim.scale, {
                toValue: 1.05,
                duration: duration,
                useNativeDriver: true,
              }),
              Animated.timing(anim.scale, {
                toValue: 0.98,
                duration: duration,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ])
      );
    });

    floatingAnimations.forEach((anim) => anim.start());

    return () => {
      floatingAnimations.forEach((anim) => anim.stop());
    };
  }, [sessionStarted]);

  // Timer - Fixed: Added pause functionality
  useEffect(() => {
    if (!sessionStarted || timeRemaining <= 0 || isPaused) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Fixed: Added haptic feedback for practice completion
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowCompletion(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStarted, timeRemaining, isPaused]);

  // Rotating tips
  useEffect(() => {
    if (!sessionStarted) return;

    const tipTimer = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 10000); // Change tip every 10 seconds

    return () => clearInterval(tipTimer);
  }, [sessionStarted]);

  const handleLabelTap = async (label: Label, index: number) => {
    // Fixed: Added haptic feedback for label tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Ripple animation
    rippleAnim.setValue(0);
    Animated.sequence([
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(rippleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Ring effect animation
    const ringAnim = ringAnimations[index];
    ringAnim.scale.setValue(0);
    ringAnim.opacity.setValue(1);
    
    Animated.parallel([
      Animated.timing(ringAnim.scale, {
        toValue: 2.5,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(ringAnim.opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const timestamp = Date.now();
    setNotedLabels((prev) => [...prev, { label, timestamp }]);
    setNotedCount((prev) => prev + 1);

    // Map label to emotion type and save
    try {
      let emotionType: EmotionType | null = null;
      
      if (label.category === 'emotion') {
        switch (label.id) {
          case 'joy':
            emotionType = EmotionType.JOY;
            break;
          case 'sad':
            emotionType = EmotionType.SADNESS_GRIEF;
            break;
          case 'angry':
            emotionType = EmotionType.ANGER_AVERSION;
            break;
          case 'fearful':
          case 'anxious':
            emotionType = EmotionType.FEAR_CONFUSION;
            break;
          case 'calm':
            emotionType = EmotionType.CALM_CLARITY;
            break;
        }
      } else if (label.category === 'thought' && label.id === 'judging') {
        emotionType = EmotionType.ANGER_AVERSION;
      } else if (label.category === 'urge') {
        emotionType = EmotionType.CRAVING;
      }

      if (emotionType) {
        await emotionService.saveEmotionTile(emotionType);
      }
    } catch (error) {
      console.error('Error saving noting practice:', error);
    }
  };

  const handleStart = () => {
    // Fixed: Added haptic feedback for practice start
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSessionStarted(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleDone = () => {
    navigation.goBack();
  };

  const handleReflect = () => {
    navigation.goBack();
    setTimeout(() => {
      navigation.getParent()?.navigate('AwarenessTab');
    }, 300);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMostCommonLabel = () => {
    if (notedLabels.length === 0) return null;
    const counts: { [key: string]: number } = {};
    notedLabels.forEach(({ label }) => {
      counts[label.id] = (counts[label.id] || 0) + 1;
    });
    const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return LABELS.find((l) => l.id === mostCommon[0]);
  };

  const styles = createStyles(colors);

  if (showCompletion) {
    const mostCommon = getMostCommonLabel();
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <BlurView intensity={80} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[colors.background + 'F0', colors.background + 'E0']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.completionContainer}>
          <Animated.View style={[styles.completionCard, { opacity: fadeAnim }]}>
            <Text style={styles.completionIcon}>🎉</Text>
            <Text style={[styles.completionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Well Done' : 'හොඳයි'}
            </Text>
            <Text style={[styles.completionSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'You Noticed Your Mind Clearly'
                : 'ඔබේ මනස පැහැදිලිව දුටුවේය'}
            </Text>
            <Text style={[styles.completionText, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Every label strengthens awareness.\nThis is the essence of Satipaṭṭhāna.'
                : 'සෑම නම් කිරීමක්ම සැලකිල්ල ශක්තිමත් කරයි.\nමෙය සතිපට්ඨානයේ සාරයයි.'}
            </Text>
            
            <View style={styles.summaryContainer}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {language === 'en' ? 'You noted' : 'ඔබ නම් කළේ'}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {notedCount} {language === 'en' ? 'mental events' : 'මානසික සිදුවීම්'}
              </Text>
              {mostCommon && (
                <>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary, marginTop: 8 }]}>
                    {language === 'en' ? 'Most common:' : 'වැඩියෙන්:'}
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text, fontSize: 16 }]}>
                    {language === 'en' ? mostCommon.en : mostCommon.si}
                  </Text>
                </>
              )}
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
                style={[styles.completionButton, { backgroundColor: colors.primary }]}
                onPress={handleReflect}
              >
                <Text style={[styles.completionButtonText, { color: '#FFFFFF' }]}>
                  {language === 'en' ? 'Reflect' : 'සිතා බලන්න'}
                </Text>
              </TouchableOpacity>
            </View>
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
        <View style={styles.introContainer}>
          <Animated.View style={[styles.introCard, { opacity: fadeAnim }]}>
            <View style={[styles.introIcon, { backgroundColor: '#8EC6C5' + '30' }]}>
              <Cloud size={48} color="#8EC6C5" strokeWidth={1.5} />
            </View>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              {language === 'en' ? 'Ready to Begin' : 'ආරම්භ කිරීමට සූදානම්'}
            </Text>
            <Text style={[styles.introSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? '1–2 minute gentle awareness practice'
                : 'විනාඩි 1–2 ක මෘදු සැලකිලි පුරුදුව'}
            </Text>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: '#8EC6C5' }]}
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
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[colors.background + 'F0', colors.background + 'D0']}
        style={StyleSheet.absoluteFill}
      />
      
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
              {language === 'en' ? 'Noting Practice' : 'නම් කිරීමේ පුරුදුව'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Gently name your mind\'s activity — without judgment.'
                : 'විනිශ්චයකින් තොරව ඔබේ මනසේ ක්‍රියාකාරකම් මෘදුවෙන් නම් කරන්න.'}
            </Text>
          </View>
        </View>

        {/* Fixed: Prominent Timer Display */}
        {sessionStarted && timeRemaining > 0 && (
          <View style={styles.prominentTimerContainer}>
            <View style={[styles.prominentTimerCard, { backgroundColor: colors.card }]}>
              {/* Circular Progress Indicator */}
              <View style={styles.timerProgressContainer}>
                <View
                  style={[
                    styles.timerProgressCircle,
                    {
                      borderColor: colors.primary,
                      borderWidth: 4,
                    },
                  ]}
                >
                  <Text style={[styles.prominentTimerText, { color: colors.text }]}>
                    {formatTime(timeRemaining)}
                  </Text>
                  {isPaused && (
                    <Text style={[styles.pauseIndicator, { color: colors.textSecondary }]}>
                      {language === 'en' ? 'Paused' : 'විරාම'}
                    </Text>
                  )}
                </View>
                {/* Progress ring */}
                <View
                  style={[
                    styles.timerProgressRing,
                    {
                      borderColor: colors.primary + '40',
                      borderWidth: 4,
                      transform: [
                        {
                          rotate: `${((SESSION_DURATION - timeRemaining) / SESSION_DURATION) * 360}deg`,
                        },
                      ],
                    },
                  ]}
                />
              </View>
              
              {/* Pause/Resume Button */}
              <TouchableOpacity
                style={[styles.pauseButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  // Fixed: Added haptic feedback for pause/resume
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsPaused(!isPaused);
                }}
                accessibilityLabel={isPaused ? (language === 'en' ? 'Resume' : 'අඛණ්ඩ කරන්න') : (language === 'en' ? 'Pause' : 'විරාම')}
                accessibilityRole="button"
              >
                <Ionicons
                  name={isPaused ? 'play' : 'pause'}
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Instruction - Simple and centered */}
        <View style={styles.instructionContainer}>
          <Text style={[styles.instructionText, { color: colors.text }]}>
            {language === 'en'
              ? 'Notice what\'s happening. Give it a name.'
              : 'සිදුවන දේ නිරීක්ෂණය කරන්න. නම් කරන්න.'}
          </Text>
        </View>

        {/* Balloons Grid */}
        <View style={styles.balloonsGrid}>
          {shuffledLabels.map((label, index) => {
            const balloonAnim = balloonAnimations[index];
            const rippleScale = rippleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.15],
            });
            const rippleOpacity = rippleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.6, 0],
            });

            return (
              <Animated.View
                key={label.id}
                style={[
                  styles.balloonWrapper,
                  {
                    transform: [
                      { translateY: balloonAnim.translateY },
                      { scale: balloonAnim.scale },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleLabelTap(label, index)}
                  activeOpacity={0.8}
                  style={styles.balloonTouchable}
                >
                  {/* Ring Effect */}
                  <Animated.View
                    style={[
                      styles.ring,
                      {
                        borderColor: label.color,
                        transform: [{ scale: ringAnimations[index].scale }],
                        opacity: ringAnimations[index].opacity,
                      },
                    ]}
                  />
                  
                  {/* Balloon */}
                  <View
                    style={[
                      styles.balloon,
                      {
                        backgroundColor: label.color,
                        shadowColor: label.color,
                      },
                    ]}
                  >
                    <Animated.View
                      style={[
                        StyleSheet.absoluteFill,
                        {
                          borderRadius: 40,
                          backgroundColor: label.color,
                          opacity: rippleOpacity,
                          transform: [{ scale: rippleScale }],
                        },
                      ]}
                    />
                    <Text style={styles.balloonText}>
                      {language === 'en' ? label.en : label.si}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Rotating Tips */}
        {sessionStarted && (
          <Animated.View style={[styles.tipContainer, { opacity: fadeAnim }]}>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              {language === 'en' ? TIPS[currentTipIndex].en : TIPS[currentTipIndex].si}
            </Text>
          </Animated.View>
        )}
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
      marginBottom: 24,
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
    timerContainer: {
      marginTop: 8,
      alignItems: 'flex-end',
    },
    timerText: {
      fontSize: 14,
      fontWeight: '600',
    },
    // Fixed: Prominent timer styles
    prominentTimerContainer: {
      alignItems: 'center',
      marginBottom: 24,
      marginTop: 8,
    },
    prominentTimerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      gap: 16,
    },
    timerProgressContainer: {
      width: 100,
      height: 100,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    timerProgressCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    timerProgressRing: {
      position: 'absolute',
      width: 100,
      height: 100,
      borderRadius: 50,
      borderTopColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    prominentTimerText: {
      fontSize: 24,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    pauseIndicator: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
    },
    pauseButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    instructionContainer: {
      marginBottom: 32,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    instructionText: {
      fontSize: 18,
      lineHeight: 26,
      textAlign: 'center',
      fontWeight: '500',
    },
    balloonsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 10,
      marginBottom: 40,
    },
    balloonWrapper: {
      width: 80,
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    balloonTouchable: {
      width: 80,
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    ring: {
      position: 'absolute',
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 3,
      borderColor: '#8EC6C5',
    },
    balloon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 8,
      overflow: 'hidden',
    },
    balloonText: {
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
      paddingHorizontal: 6,
      color: '#2C3E50',
      zIndex: 1,
    },
    tipContainer: {
      marginTop: 32,
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    tipText: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      fontStyle: 'italic',
      opacity: 0.8,
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
  });

