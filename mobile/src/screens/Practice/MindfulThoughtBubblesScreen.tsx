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
import { MessageCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { emotionService } from '../../services/emotion.service';
import { EmotionType } from '../../utils/emotions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PracticePhase = 'idle' | 'settling' | 'observing' | 'stillness' | 'complete';

const THOUGHT_LABELS = [
  { en: 'Planning', si: 'සැලසුම්' },
  { en: 'Worry', si: 'කරදර' },
  { en: 'Memory', si: 'මතකය' },
  { en: 'Fear', si: 'බිය' },
  { en: 'Hope', si: 'අපේක්ෂාව' },
  { en: 'Idea', si: 'අදහස' },
  { en: 'Regret', si: 'පසුතැවිල්ල' },
  { en: 'Judging', si: 'විනිශ්චය' },
];

const OBSERVING_INSTRUCTIONS = [
  { en: 'Watch each bubble…\nlike a thought arising.', si: 'සෑම බුබුළුවක්ම නිරීක්ෂණය කරන්න…\nසිතක් ඇති වනවා වැනි.' },
  { en: 'Don\'t follow the story.', si: 'කතාව අනුගමනය නොකරන්න.' },
  { en: 'Just see the bubble…', si: 'බුබුළුව දැක්ම පමණක්…' },
  { en: 'Thoughts pass on their own.', si: 'සිතුවිලි තමන්ගේම අතුරුදහන් වේ.' },
  { en: 'You are not your thoughts.', si: 'ඔබ ඔබේ සිතුවිලි නොවේ.' },
  { en: 'Let every bubble float away.', si: 'සෑම බුබුළුවක්ම පාවීමට ඉඩ දෙන්න.' },
];

const BUBBLE_SPAWN_INTERVAL_OBSERVING = 3000; // 3 seconds between bubbles (slower spawn)
const BUBBLE_SPAWN_INTERVAL_STILLNESS = 6000; // 6 seconds between bubbles (slower)

// Diverse soft color palette matching the theme
const BUBBLE_COLORS = [
  // Soft Blues
  '#A7D3F5', // Base soft blue
  '#B8DDF7', // Lighter blue
  '#C7E5F9', // Very light blue
  '#9BC8E8', // Slightly deeper blue
  '#B0D4ED', // Medium light blue
  // Soft Purples/Lavenders
  '#C8B8E6', // Soft lavender
  '#D4C4F0', // Light purple
  '#E0D4F5', // Pale lavender
  // Soft Greens
  '#A8D5BA', // Soft mint
  '#B8E0C8', // Light green
  '#C8E8D4', // Pale green
  // Soft Pinks/Roses
  '#E8B8C8', // Soft rose
  '#F0C8D4', // Light pink
  '#F5D4E0', // Pale pink
  // Soft Yellows/Peaches
  '#F5D4A7', // Soft peach
  '#F5E0B8', // Light yellow
  '#F5E8C8', // Pale yellow
  // Soft Teals
  '#A8D5C8', // Soft teal
  '#B8E0D4', // Light teal
];

interface Bubble {
  id: string;
  x: number;
  size: number;
  label?: { en: string; si: string };
  color: string;
  translateY: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
}

export default function MindfulThoughtBubblesScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [currentPhase, setCurrentPhase] = useState<PracticePhase>('idle');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [sessionDuration, setSessionDuration] = useState(90); // Default 1.5 minutes

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const instructionFade = useRef(new Animated.Value(1)).current;
  
  // Particle animations
  const particleAnimations = useRef(
    Array.from({ length: 15 }, () => ({
      translateY: new Animated.Value(SCREEN_HEIGHT),
      translateX: new Animated.Value(Math.random() * SCREEN_WIDTH),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.3 + Math.random() * 0.4),
    }))
  ).current;

  const isActiveRef = useRef(false);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const instructionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleSpawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleIdCounter = useRef(0);

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
      const delay = index * 200;
      const duration = 12000 + Math.random() * 8000;
      
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
                toValue: 0.3,
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

  // Helper function to get text color (slightly darker version of bubble color for better visibility)
  const getTextColor = (bubbleColor: string): string => {
    // Convert hex to RGB
    const hex = bubbleColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Darken by 30% for better contrast
    const darkerR = Math.max(0, Math.floor(r * 0.7));
    const darkerG = Math.max(0, Math.floor(g * 0.7));
    const darkerB = Math.max(0, Math.floor(b * 0.7));
    
    return `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
  };

  // Create a new bubble
  const createBubble = (): Bubble => {
    const hasLabel = Math.random() < 0.25; // 25% chance of having a label
    const size = 40 + Math.random() * 60; // 40-100px
    const x = 40 + Math.random() * (SCREEN_WIDTH - 80 - size); // Random X position
    const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]; // Random color from palette
    
    const bubble: Bubble = {
      id: `bubble-${bubbleIdCounter.current++}`,
      x,
      size,
      label: hasLabel ? THOUGHT_LABELS[Math.floor(Math.random() * THOUGHT_LABELS.length)] : undefined,
      color,
      translateY: new Animated.Value(SCREEN_HEIGHT + 50),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5),
    };

    // Animate bubble rising and fading
    const riseDuration = 15000 + Math.random() * 10000; // 15-25 seconds (longer visibility)
    const fadeStart = riseDuration * 0.85; // Start fading at 85% of rise (visible longer)

    Animated.parallel([
      Animated.timing(bubble.translateY, {
        toValue: -100,
        duration: riseDuration,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(bubble.opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(bubble.opacity, {
          toValue: 0.8,
          duration: fadeStart - 800,
          useNativeDriver: true,
        }),
        Animated.timing(bubble.opacity, {
          toValue: 0,
          duration: riseDuration - fadeStart,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(bubble.scale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bubble.scale, {
          toValue: 1.05,
          duration: riseDuration - 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Remove bubble after animation completes
      setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
    });

    return bubble;
  };

  // Spawn bubbles during observing and stillness phases
  useEffect(() => {
    if (!sessionStarted || (currentPhase !== 'observing' && currentPhase !== 'stillness')) {
      if (bubbleSpawnTimerRef.current) {
        clearInterval(bubbleSpawnTimerRef.current);
        bubbleSpawnTimerRef.current = null;
      }
      return;
    }

    const interval = currentPhase === 'observing' 
      ? BUBBLE_SPAWN_INTERVAL_OBSERVING 
      : BUBBLE_SPAWN_INTERVAL_STILLNESS;

    bubbleSpawnTimerRef.current = setInterval(() => {
      if (isActiveRef.current) {
        const newBubble = createBubble();
        setBubbles((prev) => [...prev, newBubble]);
      }
    }, interval);

    return () => {
      if (bubbleSpawnTimerRef.current) {
        clearInterval(bubbleSpawnTimerRef.current);
        bubbleSpawnTimerRef.current = null;
      }
    };
  }, [currentPhase, sessionStarted]);

  // Rotate instructions during observing phase
  useEffect(() => {
    if (!sessionStarted || currentPhase !== 'observing') return;

    instructionTimerRef.current = setInterval(() => {
      if (!isActiveRef.current) return;

      instructionFade.setValue(0);
      Animated.timing(instructionFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      setCurrentInstructionIndex((prev) => (prev + 1) % OBSERVING_INSTRUCTIONS.length);
    }, 10000); // Every 10 seconds

    return () => {
      if (instructionTimerRef.current) {
        clearInterval(instructionTimerRef.current);
        instructionTimerRef.current = null;
      }
    };
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
            setCurrentPhase('observing');
            setCurrentInstructionIndex(0);
          }
        }, 10000); // 10 seconds
        break;

      case 'observing':
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('stillness');
          }
        }, 70000); // 70 seconds (1 min 10 sec)
        break;

      case 'stillness':
        phaseTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            setCurrentPhase('complete');
            setShowCompletion(true);
          }
        }, 15000); // 15 seconds
        break;
    }

    return () => {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
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
      console.error('Error saving thought awareness practice:', error);
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
    setBubbles([]);
    bubbleIdCounter.current = 0;
    instructionFade.setValue(1);
    fadeAnim.setValue(0);
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
    if (bubbleSpawnTimerRef.current) {
      clearInterval(bubbleSpawnTimerRef.current);
      bubbleSpawnTimerRef.current = null;
    }
    setBubbles([]);
  };

  const getCurrentInstruction = () => {
    switch (currentPhase) {
      case 'settling':
        return language === 'en'
          ? 'Let your mind rest…\nThoughts may appear.'
          : 'ඔබේ මනසට විවේකයක් දෙන්න…\nසිතුවිලි දිස්විය හැකිය.';
      case 'observing':
        return OBSERVING_INSTRUCTIONS[currentInstructionIndex][language === 'en' ? 'en' : 'si'];
      case 'stillness':
        return language === 'en'
          ? 'Rest in the space between thoughts.'
          : 'සිතුවිලි අතර අවකාශයේ විවේකයක් ගන්න.';
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
              backgroundColor: '#A7D3F5',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.completionContainer}>
          <Animated.View style={[styles.completionCard, { opacity: fadeAnim }]}>
            <Text style={styles.completionIcon}>🫧</Text>
            <Text style={[styles.completionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Beautiful' : 'සුන්දර'}
            </Text>
            <Text style={[styles.completionSubtitle, { color: colors.text }]}>
              {language === 'en'
                ? 'You watched thoughts without getting caught.'
                : 'ඔබ සිතුවිලි නිරීක්ෂණය කළේය, අල්ලාගෙන නොසිට.'}
            </Text>
            <Text style={[styles.completionText, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Thoughts arise and pass.\nYou don\'t need to fight them.'
                : 'සිතුවිලි ඇති වනවා සහ අතුරුදහන් වනවා.\nඔබට ඒවාට එරෙහිව සටන් කිරීමට අවශ්‍ය නැත.'}
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
                style={[styles.completionButton, { backgroundColor: '#A7D3F5' }]}
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
              backgroundColor: '#A7D3F5',
              opacity: 0.05,
            },
          ]}
        />
        <View style={styles.introContainer}>
          <Animated.View style={[styles.introCard, { opacity: fadeAnim }]}>
            <View style={[styles.introIcon, { backgroundColor: '#A7D3F5' + '30' }]}>
              <MessageCircle size={48} color="#A7D3F5" strokeWidth={1.5} />
            </View>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              {language === 'en' ? 'Mindful Thought Bubbles' : 'සැලකිලිමත් සිතුවිලි බුබුළු'}
            </Text>
            <Text style={[styles.introSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? '1–2 minute thought observation practice'
                : 'විනාඩි 1–2 ක සිතුවිලි නිරීක්ෂණ පුරුදුව'}
            </Text>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: '#A7D3F5' }]}
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
      {/* Dark Bluish Gradient Background */}
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[colors.background, '#1a2332', colors.background + 'E0']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Subtle Blue Overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#A7D3F5',
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

      {/* Thought Bubbles */}
      {bubbles.map((bubble) => (
        <Animated.View
          key={bubble.id}
          style={[
            styles.bubble,
            {
              left: bubble.x,
              width: bubble.size,
              height: bubble.size,
              borderRadius: bubble.size / 2,
              borderColor: bubble.color + '80',
              transform: [
                { translateY: bubble.translateY },
                { scale: bubble.scale },
              ],
              opacity: bubble.opacity,
            },
          ]}
        >
          <View 
            style={[
              styles.bubbleInner, 
              { 
                borderRadius: bubble.size / 2,
                backgroundColor: bubble.color + '30',
                borderColor: bubble.color + '50',
              }
            ]}
          >
            {bubble.label && (
              <Text style={[styles.bubbleLabel, { fontSize: bubble.size * 0.2, color: getTextColor(bubble.color) }]}>
                {language === 'en' ? bubble.label.en : bubble.label.si}
              </Text>
            )}
          </View>
        </Animated.View>
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
              {language === 'en' ? 'Mindful Thought Bubbles' : 'සැලකිලිමත් සිතුවිලි බුබුළු'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {language === 'en'
                ? 'Watch thoughts arise and pass like bubbles in the mind.'
                : 'සිතුවිලි මනසේ බුබුළු මෙන් ඇති වීම සහ අතුරුදහන් වීම නිරීක්ෂණය කරන්න.'}
            </Text>
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
    },
    instructionContainer: {
      marginTop: 60,
      paddingHorizontal: 20,
      minHeight: 100,
      justifyContent: 'center',
    },
    instructionText: {
      fontSize: 22,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 30,
    },
    bubble: {
      position: 'absolute',
      borderWidth: 2,
    },
    bubbleInner: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    bubbleLabel: {
      fontWeight: '500',
      textAlign: 'center',
    },
    particle: {
      position: 'absolute',
      width: 2,
      height: 2,
      borderRadius: 1,
      backgroundColor: '#A7D3F5',
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

