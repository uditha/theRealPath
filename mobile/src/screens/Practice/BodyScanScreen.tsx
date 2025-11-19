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
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { emotionService } from '../../services/emotion.service';
import { EmotionType } from '../../utils/emotions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type BodyScanPhase =
  | 'idle'
  | 'settling'
  | 'head'
  | 'neck'
  | 'arms'
  | 'chest'
  | 'stomach'
  | 'hips'
  | 'legs'
  | 'feet'
  | 'wholeBody'
  | 'complete';

interface BodyPart {
  id: BodyScanPhase;
  instructions: { en: string; si: string }[];
  duration: number;
}

const BODY_PARTS: Record<BodyScanPhase, BodyPart> = {
  idle: { id: 'idle', instructions: [], duration: 0 },
  settling: {
    id: 'settling',
    instructions: [
      { en: 'Sit comfortably.\nClose your eyes if you like…', si: 'සුවපහසුවෙන් වාඩි වන්න.\nඔබට අවශ්‍ය නම් ඇස් වසාගන්න…' },
      { en: 'Take one gentle breath…', si: 'එක් මෘදු හුස්මක් ගන්න…' },
    ],
    duration: 15000, // 15 seconds
  },
  head: {
    id: 'head',
    instructions: [
      { en: 'Notice your forehead… any tension.', si: 'ඔබේ නළල නිරීක්ෂණය කරන්න… ඕනෑම ආතතියක්.' },
      { en: 'Relax the eyes and jaw.', si: 'ඇස් සහ හනුව සන්සුන් කරන්න.' },
      { en: 'Soften the face.', si: 'මුහුණ මෘදු කරන්න.' },
    ],
    duration: 20000, // 20 seconds
  },
  neck: {
    id: 'neck',
    instructions: [
      { en: 'Feel the neck…\nIs there tightness?', si: 'ගෙල දැනෙන්න…\nආතතියක් තිබේද?' },
      { en: 'Let the shoulders soften downward.', si: 'උරහිස් මෘදුවෙන් පහළට යාමට ඉඩ දෙන්න.' },
    ],
    duration: 20000, // 20 seconds
  },
  arms: {
    id: 'arms',
    instructions: [
      { en: 'Notice your arms resting.', si: 'ඔබේ අත් විවේක ගන්නා ආකාරය නිරීක්ෂණය කරන්න.' },
      { en: 'Feel your hands… warm or cool.', si: 'ඔබේ අත් දැනෙන්න… උණුසුම් හෝ සිසිල්.' },
    ],
    duration: 20000, // 20 seconds
  },
  chest: {
    id: 'chest',
    instructions: [
      { en: 'Feel the rise and fall of the chest.', si: 'උරහිසේ නැගීම සහ පහත වැටීම දැනෙන්න.' },
      { en: 'Notice the heartbeat… gently.', si: 'හෘද ස්පන්දනය නිරීක්ෂණය කරන්න… මෘදුවෙන්.' },
    ],
    duration: 20000, // 20 seconds
  },
  stomach: {
    id: 'stomach',
    instructions: [
      { en: 'Observe the belly…\nexpanding and relaxing.', si: 'බඩ නිරීක්ෂණය කරන්න…\nවිහිදීම සහ සන්සුන් වීම.' },
    ],
    duration: 20000, // 20 seconds
  },
  hips: {
    id: 'hips',
    instructions: [
      { en: 'Notice any tension in the hips…\nLet the area soften.', si: 'ඉණෙහි ඕනෑම ආතතියක් නිරීක්ෂණය කරන්න…\nප්‍රදේශය මෘදු වීමට ඉඩ දෙන්න.' },
    ],
    duration: 20000, // 20 seconds
  },
  legs: {
    id: 'legs',
    instructions: [
      { en: 'Feel the weight of your legs.', si: 'ඔබේ කකුල්වල බර දැනෙන්න.' },
      { en: 'Warmth, tingling, lightness — just notice.', si: 'උණුසුම, කම්පනය, සැහැල්ලුකම — නිරීක්ෂණය කරන්න පමණි.' },
    ],
    duration: 20000, // 20 seconds
  },
  feet: {
    id: 'feet',
    instructions: [
      { en: 'Feel the contact with the ground.', si: 'පොළොව සමඟ සම්බන්ධතාවය දැනෙන්න.' },
      { en: 'Let your whole body rest.', si: 'ඔබේ සම්පූර්ණ ශරීරය විවේක ගන්නට ඉඩ දෙන්න.' },
    ],
    duration: 20000, // 20 seconds
  },
  wholeBody: {
    id: 'wholeBody',
    instructions: [
      { en: 'Now feel the whole body as one.', si: 'දැන් සම්පූර්ණ ශරීරය එකක් ලෙස දැනෙන්න.' },
      { en: 'Let the body rest… naturally.', si: 'ශරීරය විවේක ගන්නට ඉඩ දෙන්න… ස්වභාවිකව.' },
    ],
    duration: 15000, // 15 seconds
  },
  complete: { id: 'complete', instructions: [], duration: 0 },
};

const PHASE_ORDER: BodyScanPhase[] = [
  'settling',
  'head',
  'neck',
  'arms',
  'chest',
  'stomach',
  'hips',
  'legs',
  'feet',
  'wholeBody',
];

export default function BodyScanScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [currentPhase, setCurrentPhase] = useState<BodyScanPhase>('idle');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const instructionFade = useRef(new Animated.Value(1)).current;
  const bodyPartGlow = useRef(new Animated.Value(0)).current;
  const breathingAnim = useRef(new Animated.Value(0)).current;

  const isActiveRef = useRef(false);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const instructionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize intro fade
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Breathing animation
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

  // Phase progression and instruction rotation
  useEffect(() => {
    if (!sessionStarted || currentPhase === 'idle' || currentPhase === 'complete') {
      isActiveRef.current = false;
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
      if (instructionTimerRef.current) {
        clearInterval(instructionTimerRef.current);
        instructionTimerRef.current = null;
      }
      return;
    }

    isActiveRef.current = true;
    const bodyPart = BODY_PARTS[currentPhase];
    const instructions = bodyPart.instructions;
    const instructionDuration = bodyPart.duration / instructions.length;

    // Reset body part glow animation
    bodyPartGlow.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(bodyPartGlow, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bodyPartGlow, {
          toValue: 0.5,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate instructions
    setCurrentInstructionIndex(0);
    instructionFade.setValue(1);

    if (instructions.length > 0) {
      instructionTimerRef.current = setInterval(() => {
        if (!isActiveRef.current) return;

        setCurrentInstructionIndex((prev) => {
          const next = (prev + 1) % instructions.length;
          
          // Fade animation for instruction change
          instructionFade.setValue(0);
          Animated.timing(instructionFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();

          return next;
        });
      }, instructionDuration);
    }

    // Move to next phase after duration
    phaseTimerRef.current = setTimeout(() => {
      if (!isActiveRef.current) return;

      const currentIndex = PHASE_ORDER.indexOf(currentPhase);
      if (currentIndex < PHASE_ORDER.length - 1) {
        setCurrentPhase(PHASE_ORDER[currentIndex + 1]);
      } else {
        setCurrentPhase('complete');
        setShowCompletion(true);
      }
    }, bodyPart.duration);

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
      console.error('Error saving body scan practice:', error);
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
    setCurrentInstructionIndex(0);
    fadeAnim.setValue(0);
    instructionFade.setValue(1);
    bodyPartGlow.setValue(0);
  };

  const cleanup = () => {
    isActiveRef.current = false;
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    if (instructionTimerRef.current) {
      clearInterval(instructionTimerRef.current);
      instructionTimerRef.current = null;
    }
  };

  // Get current instruction
  const currentBodyPart = BODY_PARTS[currentPhase];
  const currentInstruction =
    currentBodyPart && currentBodyPart.instructions && currentBodyPart.instructions.length > 0
      ? currentBodyPart.instructions[currentInstructionIndex] || currentBodyPart.instructions[0]
      : null;

  // Body silhouette component
  const renderBodySilhouette = () => {
    const glowOpacity = bodyPartGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    const breathingScale = breathingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.05],
    });

    const isHighlighted = (part: BodyScanPhase) => {
      return currentPhase === part;
    };

    const getPartColor = (part: BodyScanPhase) => {
      if (isHighlighted(part)) {
        return '#7EA87C' + 'FF'; // Green when highlighted (more focus)
      }
      return '#DCD5C9' + '60'; // Subtle beige when not highlighted
    };

    const getBorderColor = (part: BodyScanPhase) => {
      if (isHighlighted(part)) {
        return '#7EA87C' + 'FF'; // Green border when highlighted
      }
      return '#DCD5C9' + '50'; // Subtle border when not highlighted
    };

    return (
      <View style={styles.bodyContainer}>
        <Animated.View
          style={[
            styles.bodyWrapper,
            {
              transform: [{ scale: breathingScale }],
            },
          ]}
        >
          {/* Head */}
          <View
            style={[
              styles.bodyPart,
              styles.head,
              {
                backgroundColor: getPartColor('head'),
                borderColor: getBorderColor('head'),
              },
            ]}
          >
            {isHighlighted('head') && (
              <Animated.View
                style={[
                  styles.glow,
                  {
                    opacity: glowOpacity,
                    backgroundColor: '#7EA87C',
                  },
                ]}
              />
            )}
          </View>

          {/* Neck */}
          <View
            style={[
              styles.bodyPart,
              styles.neck,
              {
                backgroundColor: getPartColor('neck'),
                borderColor: getBorderColor('neck'),
              },
            ]}
          >
            {isHighlighted('neck') && (
              <Animated.View
                style={[
                  styles.glow,
                  {
                    opacity: glowOpacity,
                    backgroundColor: '#7EA87C',
                  },
                ]}
              />
            )}
          </View>

          {/* Shoulders */}
          <View
            style={[
              styles.bodyPart,
              styles.shoulders,
              {
                backgroundColor: isHighlighted('neck') ? '#7EA87C' + 'FF' : '#DCD5C9' + '60',
                borderColor: isHighlighted('neck') ? '#7EA87C' + 'FF' : '#DCD5C9' + '50',
              },
            ]}
          />

          {/* Arms */}
          <View
            style={[
              styles.bodyPart,
              styles.leftArm,
              {
                backgroundColor: getPartColor('arms'),
                borderColor: getBorderColor('arms'),
              },
            ]}
          >
            {isHighlighted('arms') && (
              <Animated.View
                style={[
                  styles.glow,
                  {
                    opacity: glowOpacity,
                    backgroundColor: '#7EA87C',
                  },
                ]}
              />
            )}
          </View>
          <View
            style={[
              styles.bodyPart,
              styles.rightArm,
              {
                backgroundColor: getPartColor('arms'),
                borderColor: getBorderColor('arms'),
              },
            ]}
          >
            {isHighlighted('arms') && (
              <Animated.View
                style={[
                  styles.glow,
                  {
                    opacity: glowOpacity,
                    backgroundColor: '#7EA87C',
                  },
                ]}
              />
            )}
          </View>

          {/* Chest */}
          <View
            style={[
              styles.bodyPart,
              styles.chest,
              {
                backgroundColor: getPartColor('chest'),
                borderColor: getBorderColor('chest'),
              },
            ]}
          >
            {isHighlighted('chest') && (
              <Animated.View
                style={[
                  styles.glow,
                  {
                    opacity: glowOpacity,
                    backgroundColor: '#7EA87C',
                  },
                ]}
              />
            )}
          </View>

          {/* Stomach */}
          <View
            style={[
              styles.bodyPart,
              styles.stomach,
              {
                backgroundColor: getPartColor('stomach'),
                borderColor: getBorderColor('stomach'),
              },
            ]}
          >
            {isHighlighted('stomach') && (
              <Animated.View
                style={[
                  styles.glow,
                  {
                    opacity: glowOpacity,
                    backgroundColor: '#7EA87C',
                  },
                ]}
              />
            )}
          </View>

          {/* Hips */}
          <View
            style={[
              styles.bodyPart,
              styles.hips,
              {
                backgroundColor: getPartColor('hips'),
                borderColor: getBorderColor('hips'),
              },
            ]}
          >
            {isHighlighted('hips') && (
              <Animated.View
                style={[
                  styles.glow,
                  {
                    opacity: glowOpacity,
                    backgroundColor: '#7EA87C',
                  },
                ]}
              />
            )}
          </View>

          {/* Legs */}
          <View
            style={[
              styles.bodyPart,
              styles.leftLeg,
              {
                backgroundColor: getPartColor('legs'),
                borderColor: getBorderColor('legs'),
              },
            ]}
          >
            {isHighlighted('legs') && (
              <Animated.View
                style={[
                  styles.glow,
                  {
                    opacity: glowOpacity,
                    backgroundColor: '#7EA87C',
                  },
                ]}
              />
            )}
          </View>
          <View
            style={[
              styles.bodyPart,
              styles.rightLeg,
              {
                backgroundColor: getPartColor('legs'),
                borderColor: getBorderColor('legs'),
              },
            ]}
          >
            {isHighlighted('legs') && (
              <Animated.View
                style={[
                  styles.glow,
                  {
                    opacity: glowOpacity,
                    backgroundColor: '#7EA87C',
                  },
                ]}
              />
            )}
          </View>

          {/* Feet */}
          <View
            style={[
              styles.bodyPart,
              styles.leftFoot,
              {
                backgroundColor: getPartColor('feet'),
                borderColor: getBorderColor('feet'),
              },
            ]}
          >
            {isHighlighted('feet') && (
              <Animated.View
                style={[
                  styles.glow,
                  {
                    opacity: glowOpacity,
                    backgroundColor: '#7EA87C',
                  },
                ]}
              />
            )}
          </View>
          <View
            style={[
              styles.bodyPart,
              styles.rightFoot,
              {
                backgroundColor: getPartColor('feet'),
                borderColor: getBorderColor('feet'),
              },
            ]}
          >
            {isHighlighted('feet') && (
              <Animated.View
                style={[
                  styles.glow,
                  {
                    opacity: glowOpacity,
                    backgroundColor: '#7EA87C',
                  },
                ]}
              />
            )}
          </View>

          {/* Whole body glow */}
          {currentPhase === 'wholeBody' && (
            <Animated.View
              style={[
                styles.wholeBodyGlow,
                {
                  opacity: glowOpacity,
                },
              ]}
            />
          )}
        </Animated.View>
      </View>
    );
  };

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
              backgroundColor: '#DCD5C9',
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
                ? 'You brought mindfulness through your whole body.'
                : 'ඔබ සම්පූර්ණ ශරීරය හරහා සැලකිල්ල ගෙන ආවා.'}
            </Text>
            <Text style={[styles.completionText, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'The body relaxes when the mind is kind.'
                : 'මනස කරුණාවන්ත වන විට ශරීරය සන්සුන් වේ.'}
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
                style={[styles.completionButton, { backgroundColor: '#DCD5C9' }]}
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
              backgroundColor: '#DCD5C9',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.introContainer}>
          <Animated.View style={[styles.introCard, { opacity: fadeAnim }]}>
            <View style={[styles.introIcon, { backgroundColor: '#DCD5C9' + '30' }]}>
              <Ionicons name="body-outline" size={48} color="#DCD5C9" />
            </View>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              {language === 'en' ? 'Body Scan' : 'ශරීර ස්කෑන්'}
            </Text>
            <Text style={[styles.introSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? '2–4 minute body awareness practice'
                : 'විනාඩි 2–4 ක ශරීර සැලකිල්ල පුරුදුව'}
            </Text>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: '#DCD5C9' }]}
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
      {/* Dark Theme Background with Subtle Beige Tint */}
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[colors.background, colors.background + 'F0', colors.background + 'E0']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Subtle Beige Overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#DCD5C9',
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
            {language === 'en' ? 'Body Scan' : 'ශරීර ස්කෑන්'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {language === 'en'
              ? 'Move your awareness gently through the body, one area at a time.'
              : 'සැලකිලිමත්ව ශරීරය හරහා ඔබේ සැලකිල්ල ගෙන යන්න, එක් ප්‍රදේශයක් එක් වරක්.'}
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {language === 'en'
              ? 'Inspired by Satipaṭṭhāna — mindfulness of the body.'
              : 'සතිපට්ඨාන මත පදනම්ව — ශරීරයේ සැලකිල්ල.'}
          </Text>
        </View>

        {/* Body Silhouette */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {renderBodySilhouette()}
        </View>

        {/* Instruction Text */}
        {currentInstruction && (
          <Animated.View
            style={[
              styles.instructionContainer,
              {
                opacity: instructionFade,
              },
            ]}
          >
            <Text style={[styles.instructionText, { color: colors.text }]}>
              {language === 'en' ? currentInstruction.en : currentInstruction.si}
            </Text>
          </Animated.View>
        )}
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
  bodyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    minHeight: 400,
    width: '100%',
  },
  bodyWrapper: {
    width: 200,
    height: 400,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bodyPart: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 3,
  },
  head: {
    width: 80,
    height: 80,
    borderRadius: 40,
    top: 0,
    left: 60,
  },
  neck: {
    width: 35,
    height: 30,
    top: 80,
    left: 82.5,
  },
  shoulders: {
    width: 120,
    height: 20,
    top: 110,
    left: 40,
    borderRadius: 10,
  },
  leftArm: {
    width: 20,
    height: 100,
    top: 100,
    left: 20,
    borderRadius: 10,
  },
  rightArm: {
    width: 20,
    height: 100,
    top: 100,
    left: 160,
    borderRadius: 10,
  },
  chest: {
    width: 80,
    height: 60,
    top: 110,
    left: 60,
    borderRadius: 8,
  },
  stomach: {
    width: 70,
    height: 50,
    top: 170,
    left: 65,
    borderRadius: 8,
  },
  hips: {
    width: 90,
    height: 30,
    top: 220,
    left: 55,
    borderRadius: 8,
  },
  leftLeg: {
    width: 25,
    height: 120,
    top: 250,
    left: 70,
    borderRadius: 12,
  },
  rightLeg: {
    width: 25,
    height: 120,
    top: 250,
    left: 105,
    borderRadius: 12,
  },
  leftFoot: {
    width: 30,
    height: 20,
    top: 370,
    left: 65,
    borderRadius: 10,
  },
  rightFoot: {
    width: 30,
    height: 20,
    top: 370,
    left: 105,
    borderRadius: 10,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
  },
  wholeBodyGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#7EA87C',
    borderRadius: 20,
    opacity: 0.4,
  },
  instructionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 32,
  },
  instructionText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
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

