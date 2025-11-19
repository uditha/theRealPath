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
import { Pause } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { emotionService } from '../../services/emotion.service';
import { EmotionType } from '../../utils/emotions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PracticeStep = 'idle' | 'trigger' | 'pause' | 'breatheIn' | 'breatheOut' | 'notice' | 'respond' | 'complete';

const FEELINGS = [
  { en: 'Anger', si: 'කෝපය' },
  { en: 'Fear', si: 'බිය' },
  { en: 'Hurt', si: 'වේදනාව' },
  { en: 'Stress', si: 'තනතුර' },
  { en: 'Desire', si: 'ආශාව' },
  { en: 'Irritation', si: 'කෝපය' },
];

export default function PausePracticeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState<PracticeStep>('idle');
  const [showCompletion, setShowCompletion] = useState(false);
  const [pauseProgress, setPauseProgress] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(1)).current;
  const circleGlow = useRef(new Animated.Value(0.3)).current;
  const radialProgress = useRef(new Animated.Value(0)).current;
  const feelingFade = useRef(new Animated.Value(0)).current;

  // Initialize intro fade
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Step progression
  useEffect(() => {
    if (currentStep === 'idle' || currentStep === 'complete') return;

    let timer: NodeJS.Timeout;

    switch (currentStep) {
      case 'trigger':
        timer = setTimeout(() => {
          setCurrentStep('pause');
        }, 2000);
        break;

      case 'pause':
        // 3-second pause with radial timer
        setPauseProgress(0);
        radialProgress.setValue(0);
        
        Animated.timing(radialProgress, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }).start();

        timer = setTimeout(() => {
          setCurrentStep('breatheIn');
        }, 3000);
        break;

      case 'breatheIn':
        // 3-second inhale
        Animated.parallel([
          Animated.timing(circleScale, {
            toValue: 1.3,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(circleGlow, {
            toValue: 0.6,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]).start();

        timer = setTimeout(() => {
          setCurrentStep('breatheOut');
        }, 3000);
        break;

      case 'breatheOut':
        // 4-second exhale
        Animated.parallel([
          Animated.timing(circleScale, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(circleGlow, {
            toValue: 0.3,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]).start();

        timer = setTimeout(() => {
          setCurrentStep('notice');
        }, 4000);
        break;

      case 'notice':
        // Show feelings list with fade-in
        Animated.timing(feelingFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

        timer = setTimeout(() => {
          setCurrentStep('respond');
        }, 3000);
        break;

      case 'respond':
        timer = setTimeout(() => {
          setCurrentStep('complete');
          setShowCompletion(true);
        }, 2000);
        break;
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentStep]);

  const handleStart = () => {
    setCurrentStep('trigger');
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleDone = async () => {
    navigation.goBack();
  };

  const handleReflect = async () => {
    try {
      await emotionService.saveEmotionTile(EmotionType.CALM_CLARITY);
    } catch (error) {
      console.error('Error saving pause practice:', error);
    }
    navigation.goBack();
    setTimeout(() => {
      navigation.getParent()?.navigate('AwarenessTab');
    }, 300);
  };

  const handleRepeat = () => {
    setShowCompletion(false);
    setCurrentStep('trigger');
    setPauseProgress(0);
    radialProgress.setValue(0);
    circleScale.setValue(1);
    circleGlow.setValue(0.3);
    feelingFade.setValue(0);
    fadeAnim.setValue(1);
  };

  const getStepText = () => {
    switch (currentStep) {
      case 'trigger':
        return language === 'en' ? 'When a reaction arises…' : 'ප්‍රතික්‍රියාවක් ඇති වන විට…';
      case 'pause':
        return language === 'en' ? 'Pause…' : 'නවත්වන්න…';
      case 'breatheIn':
        return language === 'en' ? 'Breathe in…' : 'හුස්ම ඇතුළු කරන්න…';
      case 'breatheOut':
        return language === 'en' ? 'Breathe out…' : 'හුස්ම පිටතට දමන්න…';
      case 'notice':
        return language === 'en' ? 'Notice the feeling.' : 'හැඟීම නිරීක්ෂණය කරන්න.';
      case 'respond':
        return language === 'en' ? 'Now respond — not react.' : 'දැන් ප්‍රතික්‍රියා නොකර ප්‍රතිචාර දක්වන්න.';
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
        <View style={styles.completionContainer}>
          <Animated.View style={[styles.completionCard, { opacity: fadeAnim }]}>
            <Text style={styles.completionIcon}>✨</Text>
            <Text style={[styles.completionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Well done' : 'හොඳයි'}
            </Text>
            <Text style={[styles.completionSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'You just broke an automatic reaction.'
                : 'ඔබ දැන් ස්වයංක්‍රීය ප්‍රතික්‍රියාවක් බිඳ දැම්මේය.'}
            </Text>
            <Text style={[styles.completionText, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Every pause builds wisdom.'
                : 'සෑම නැවතුමක්ම ඥානය ගොඩනඟයි.'}
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
                style={[styles.completionButton, { backgroundColor: '#9FB8D0' }]}
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

  if (currentStep === 'idle') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <BlurView intensity={80} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[colors.background + 'F0', colors.background + 'E0']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.introContainer}>
          <Animated.View style={[styles.introCard, { opacity: fadeAnim }]}>
            <View style={[styles.introIcon, { backgroundColor: '#9FB8D0' + '30' }]}>
              <Pause size={48} color="#9FB8D0" strokeWidth={1.5} fill="#9FB8D0" />
            </View>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              {language === 'en' ? 'Pause Before Reaction' : 'ප්‍රතික්‍රියාවට පෙර නවත්වන්න'}
            </Text>
            <Text style={[styles.introSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? '10–20 second micro-practice'
                : 'තත්පර 10–20 ක කුඩා පුරුදුව'}
            </Text>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: '#9FB8D0' }]}
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
      {/* Calm Grey-Blue Background */}
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[colors.background, colors.background + 'F0', colors.background + 'E0']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Subtle Grey-Blue Overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#9FB8D0',
            opacity: 0.05,
          },
        ]}
      />

      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {language === 'en' ? 'Pause Before Reaction' : 'ප්‍රතික්‍රියාවට පෙර නවත්වන්න'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'This simple pause weakens anger, craving, and stress.'
                : 'මෙම සරල නැවතුම කෝපය, ආශාව සහ තනතුර දුබල කරයි.'}
            </Text>
          </View>

          {/* Center Circle Animation */}
          <View style={styles.circleContainer}>
            {/* Radial Progress Ring (for pause step) */}
            {currentStep === 'pause' && (
              <View style={styles.radialContainer}>
                {/* Background Circle */}
                <View
                  style={[
                    styles.radialBackground,
                    {
                      borderColor: '#9FB8D0' + '30',
                      borderWidth: 4,
                      borderRadius: 100,
                      width: 200,
                      height: 200,
                    },
                  ]}
                />
                {/* Progress Circle */}
                <Animated.View
                  style={[
                    styles.radialProgress,
                    {
                      borderColor: '#9FB8D0',
                      borderWidth: 4,
                      borderRadius: 100,
                      width: 200,
                      height: 200,
                      borderRightColor: 'transparent',
                      borderBottomColor: 'transparent',
                      transform: [
                        {
                          rotate: radialProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['-90deg', '270deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            )}

            {/* Glow Ring */}
            <Animated.View
              style={[
                styles.glowRing,
                {
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  opacity: circleGlow,
                  backgroundColor: '#9FB8D0' + '40',
                  transform: [{ scale: circleScale }],
                },
              ]}
            />
            
            {/* Main Circle */}
            <Animated.View
              style={[
                styles.mainCircle,
                {
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  backgroundColor: '#9FB8D0' + '20',
                  transform: [{ scale: circleScale }],
                },
              ]}
            >
              {currentStep === 'pause' && (
                <Pause size={60} color="#9FB8D0" strokeWidth={2} />
              )}
            </Animated.View>
          </View>

          {/* Instruction Text */}
          <Animated.View style={[styles.instructionContainer, { opacity: fadeAnim }]}>
            <Text style={[styles.instructionText, { color: colors.text }]}>
              {getStepText()}
            </Text>
          </Animated.View>

          {/* Feelings List (for notice step) */}
          {currentStep === 'notice' && (
            <Animated.View style={[styles.feelingsContainer, { opacity: feelingFade }]}>
              {FEELINGS.map((feeling, index) => (
                <View key={index} style={styles.feelingItem}>
                  <View style={[styles.feelingDot, { backgroundColor: '#9FB8D0' + '40' }]} />
                  <Text style={[styles.feelingText, { color: colors.textSecondary }]}>
                    {language === 'en' ? feeling.en : feeling.si}
                  </Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Info Text */}
          {currentStep !== 'notice' && currentStep !== 'respond' && (
            <View style={styles.infoContainer}>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {language === 'en'
                  ? 'Rooted in the Vitakka-Saṇṭhāna Sutta.'
                  : 'විතක්ක-සංඨාන සූත්‍රයේ මූලයන්.'}
              </Text>
            </View>
          )}
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
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      opacity: 0.7,
    },
    circleContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 60,
      height: 220,
      position: 'relative',
    },
    radialContainer: {
      position: 'absolute',
      width: 200,
      height: 200,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radialBackground: {
      position: 'absolute',
    },
    radialProgress: {
      position: 'absolute',
    },
    glowRing: {
      position: 'absolute',
    },
    mainCircle: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
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
    feelingsContainer: {
      marginTop: 24,
      paddingHorizontal: 40,
      alignItems: 'center',
    },
    feelingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    feelingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 12,
    },
    feelingText: {
      fontSize: 16,
      fontWeight: '500',
    },
    infoContainer: {
      marginTop: 40,
      paddingHorizontal: 20,
    },
    infoText: {
      fontSize: 12,
      textAlign: 'center',
      fontStyle: 'italic',
      opacity: 0.6,
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

