import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { contentService, World, ProgressSummary } from '../../services/content.service';
import { logger } from '../../utils/logger';
import { getWorldTheme, getThemeColors } from '../../utils/worldThemes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animated Particles Component (Bodhi leaves and dots) - OPTIMIZED
function AnimatedParticles({ themeColors, particleType }: { themeColors: any; particleType?: 'leaves' | 'petals' | 'clouds' | 'none' }) {
  const [particles] = useState(() => {
    const count = 5; // Reduced from 15 to 5 for better performance
    return Array.from({ length: count }, (_, i) => {
      const initialX = Math.random() * SCREEN_WIDTH;
      const initialY = Math.random() * SCREEN_HEIGHT;
      return {
        id: i,
        initialX,
        initialY,
        translateX: new Animated.Value(0),
        translateY: new Animated.Value(0),
        opacity: new Animated.Value(0.1 + Math.random() * 0.15),
        scale: new Animated.Value(0.3 + Math.random() * 0.4),
        duration: 8000 + Math.random() * 12000,
        delay: Math.random() * 2000,
      };
    });
  });

  const animationRefs = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    if (particleType === 'none') {
      // Cleanup all animations
      animationRefs.current.forEach(anim => anim.stop());
      animationRefs.current = [];
      return;
    }

    // Cleanup previous animations
    animationRefs.current.forEach(anim => anim.stop());
    animationRefs.current = [];

    particles.forEach((particle) => {
      const animate = () => {
        const animation = Animated.sequence([
          Animated.delay(particle.delay),
          Animated.parallel([
            Animated.timing(particle.translateX, {
              toValue: (Math.random() * SCREEN_WIDTH) - particle.initialX,
              duration: particle.duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateY, {
              toValue: (Math.random() * SCREEN_HEIGHT) - particle.initialY,
              duration: particle.duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 0.2 + Math.random() * 0.1,
                duration: particle.duration / 2,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0.1,
                duration: particle.duration / 2,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]);
        
        animationRefs.current.push(animation);
        
        animation.start(() => {
          // Reset to new starting position
          const newX = Math.random() * SCREEN_WIDTH;
          const newY = Math.random() * SCREEN_HEIGHT;
          particle.initialX = newX;
          particle.initialY = newY;
          particle.translateX.setValue(0);
          particle.translateY.setValue(0);
          animate();
        });
      };
      animate();
    });

    // Cleanup on unmount
    return () => {
      animationRefs.current.forEach(anim => anim.stop());
      animationRefs.current = [];
    };
  }, [particleType, particles]);

  if (particleType === 'none') return null;

  const getParticleSymbol = () => {
    switch (particleType) {
      case 'leaves':
        return '🍃';
      case 'petals':
        return '🌸';
      case 'clouds':
        return '☁️';
      default:
        return '•';
    }
  };

  return (
    <>
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={{
            position: 'absolute',
            left: particle.initialX,
            top: particle.initialY,
            opacity: particle.opacity,
            transform: [
              { translateX: particle.translateX },
              { translateY: particle.translateY },
              { scale: particle.scale },
            ],
            zIndex: 1,
          }}
        >
          <Text style={{ fontSize: 12, color: themeColors.glow || '#FFFFFF' }}>
            {getParticleSymbol()}
          </Text>
        </Animated.View>
      ))}
    </>
  );
}

// Monk Breathing Animation Component - OPTIMIZED with cleanup
function MonkBreathing({ themeColors }: { themeColors: any }) {
  const [breathAnim] = useState(new Animated.Value(1));
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.2,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    
    animationRef.current = animation;
    animation.start();

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [breathAnim]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        right: -50,
        top: '50%',
        transform: [{ translateY: -12 }, { scale: breathAnim }],
        zIndex: 10,
      }}
    >
      <Text style={{ fontSize: 20, opacity: 0.6 }}>🧘</Text>
    </Animated.View>
  );
}

// Chapter Book Node Component
function ChapterBookNode({ chapter, language, themeColors, styles }: any) {
  return (
    <View style={styles.chapterNode}>
      <View
        style={[
          styles.chapterCircle,
          {
            backgroundColor: themeColors.secondary + '50',
            borderColor: themeColors.primary,
            shadowColor: themeColors.glow,
          },
        ]}
      />
      <View style={styles.chapterLabelContainer}>
        <View style={styles.chapterLabelLine} />
        <Text style={styles.chapterLabel}>
          {language === 'en' ? chapter.nameEn : chapter.nameSi}
        </Text>
      </View>
    </View>
  );
}

// Individual Lesson Node Component - OPTIMIZED (reduced animations, added cleanup)
const LessonNode = React.memo(({ 
  lesson, 
  index,
  status,
  onPress,
  styles,
  themeColors
}: any) => {
  const isCurrent = status === 'current';
  const isCompleted = status === 'completed';
  const isLocked = status === 'locked';
  const lessonId = lesson.id || lesson.lesson_id;

  const [pulseAnim] = useState(new Animated.Value(1));
  const [ringAnim] = useState(new Animated.Value(0));
  const animationRefs = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    // Cleanup previous animations
    animationRefs.current.forEach(anim => anim.stop());
    animationRefs.current = [];

    if (isCurrent) {
      // Pulsing animation for current lesson (kept - essential visual feedback)
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animationRefs.current.push(pulseAnimation);
      pulseAnimation.start();

      // Pulsing ring around active node (kept - subtle visual feedback)
      const ringAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animationRefs.current.push(ringAnimation);
      ringAnimation.start();
    }

    // Removed sparkles, orbit particles, and fog particles for better performance
    // These were causing significant performance issues

    // Cleanup on unmount or status change
    return () => {
      animationRefs.current.forEach(anim => anim.stop());
      animationRefs.current = [];
    };
  }, [isCurrent, pulseAnim, ringAnim]);

  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.6],
  });

  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  return (
    <View style={styles.lessonNodeWrapper}>
      {/* Pulsing ring for active node */}
      {isCurrent && (
        <Animated.View
          style={[
            styles.pulsingRing,
            {
              borderColor: themeColors.glow,
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            },
          ]}
        />
      )}

      {/* Soft outer glow for completed nodes */}
      {isCompleted && (
        <View style={styles.completedGlow} />
      )}

      <TouchableOpacity
        style={[
          styles.lessonNode,
          // Only current lesson gets full color
          isCurrent && {
            borderColor: themeColors.glow,
            backgroundColor: themeColors.primary + '30',
            shadowColor: themeColors.glow,
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 8,
            transform: [{ scale: pulseAnim }],
          },
          // Completed lessons get gold/green styling with glow
          isCompleted && {
            borderColor: '#FFD700', // Gold border
            backgroundColor: '#FFD70020', // Light gold background
            shadowColor: '#FFD700',
            shadowOpacity: 0.5,
            shadowRadius: 12,
            elevation: 6,
          },
          // Locked lessons are desaturated/grey
          isLocked && styles.lessonNodeDesaturated,
        ]}
        onPress={() => onPress(lessonId, status)}
        disabled={isLocked}
      >
        {isCompleted && (
          <Text style={styles.checkmarkCompleted}>✓</Text>
        )}
        {isLocked && (
          <Ionicons name="lock-closed" size={18} color="#999999" />
        )}
        {!isCompleted && !isLocked && (
          <View style={[
            styles.lessonDot, 
            isCurrent 
              ? { backgroundColor: themeColors.primary }
              : { backgroundColor: '#CCCCCC' } // Grey for non-active
          ]} />
        )}
      </TouchableOpacity>
      
      {/* Removed sparkles, orbit particles, and fog particles for better performance */}

      {/* Monk breathing animation for active node - removed for performance */}
    </View>
  );
});

// Character/Mascot Component
function PathCharacter({ themeColors, position, styles }: { themeColors: any; position: 'left' | 'right'; styles: any }) {
  return (
    <View style={[
      styles.characterContainer,
      position === 'left' ? styles.characterLeft : styles.characterRight
    ]}>
      <View style={styles.characterImageContainer}>
        <Text style={styles.characterEmoji}>🧘</Text>
        {/* Progress stars below character */}
        <View style={styles.characterStars}>
          <Text style={[styles.starEmoji, { marginRight: 4 }]}>⭐</Text>
          <Text style={[styles.starEmoji, { marginRight: 4 }]}>⭐</Text>
          <Text style={styles.starEmoji}>⭐</Text>
        </View>
      </View>
    </View>
  );
}

// Curved Path Connector Component
function CurvedPathConnector({ 
  fromIndex, 
  toIndex, 
  totalLessons, 
  themeColors,
  styles,
  centerX,
  nodeSpacing,
  startYOffset = 0
}: { 
  fromIndex: number; 
  toIndex: number; 
  totalLessons: number;
  themeColors: any;
  styles: any;
  centerX: number;
  nodeSpacing: number;
  startYOffset?: number;
}) {
  if (toIndex >= totalLessons) return null;

  // Calculate curved path positions
  const curveOffset = 60; // Horizontal offset for curves
  const startY = startYOffset + (fromIndex * nodeSpacing) + 20 + 35; // Center of first node (offset + padding + center)
  const endY = startYOffset + (toIndex * nodeSpacing) + 20 + 35; // Center of second node
  
  // Alternate curve direction for winding effect
  const curveDirection = fromIndex % 2 === 0 ? 1 : -1;

  // Create path using View with border (simpler than SVG)
  const pathHeight = endY - startY;

  // Return null to hide the path connector lines
  return null;
  
  // Original code kept for reference (commented out)
  /*
  return (
    <View
      style={[
        styles.pathConnector,
        {
          left: centerX - 2, // Center line of the path
          top: startY,
          width: 4,
          height: pathHeight,
          backgroundColor: themeColors.path || themeColors.primary,
          opacity: 0.3,
        },
      ]}
    >
      <View style={[
        styles.pathCurveDot,
        {
          left: (curveDirection * curveOffset) - 4,
          top: pathHeight / 2 - 4,
          backgroundColor: themeColors.path || themeColors.primary,
        }
      ]} />
    </View>
  );
  */
}

// Lesson Nodes Component with Curved Path
function LessonNodes({ 
  chapterId, 
  chapterIndex,
  worldIndex,
  onLessonPress, 
  getLessonStatus, 
  styles,
  themeColors,
  startYOffset = 0
}: any) {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessons();
  }, [chapterId]);

  const loadLessons = async () => {
    try {
      const lessonsData = await contentService.getLessonsByChapter(chapterId);
      // Sort lessons by orderIndex to ensure correct sequence
      const sortedLessons = [...lessonsData].sort((a: any, b: any) => {
        const aIndex = a.orderIndex ?? a.order_index ?? 0;
        const bIndex = b.orderIndex ?? b.order_index ?? 0;
        return aIndex - bIndex;
      });
      setLessons(sortedLessons);
    } catch (error) {
      logger.error('Error loading lessons', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.lessonsContainer}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  // Calculate curved positions for each lesson - centered as a set
  const nodeSpacing = 100;
  const curveOffset = 40; // Reduced curve offset for centered layout
  // Calculate center relative to the parent container (curvedPathContainer)
  // curvedPathContainer is inside worldContent which has padding: 20
  // curvedPathContainer has width: '100%', so its width = SCREEN_WIDTH - 40 (20px padding each side)
  // Nodes are absolutely positioned relative to curvedPathContainer
  // To center the set of nodes, center = container width / 2 = (SCREEN_WIDTH - 40) / 2
  const worldContentPadding = 20; // padding from worldContent
  const containerWidth = SCREEN_WIDTH - (worldContentPadding * 2); // Account for left and right padding
  const centerXRelative = containerWidth / 2; // Center of the visible container area
  
  // Calculate total height needed for this chapter's path
  const chapterTitleHeight = 120; // Approximate height of chapter title
  const chapterPathHeight = lessons.length * nodeSpacing + 40; // Height of all lessons + padding
  const totalChapterHeight = chapterTitleHeight + chapterPathHeight;

  // Don't render a wrapper here - nodes will be rendered directly into parent container
  return (
    <>
      {lessons.map((lesson: any, index: number) => {
        const lessonId = lesson.id || lesson.lesson_id;
        const status = getLessonStatus(lessonId, index, chapterIndex, lessons, worldIndex, chapterId);
        
        // Calculate curved position (alternating left/right from center)
        // Position is relative to the parent container, not a wrapper
        // Add startYOffset to position after previous chapters
        const curveDirection = index % 2 === 0 ? 1 : -1;
        const nodeX = centerXRelative + (curveDirection * curveOffset);
        const nodeY = startYOffset + (index * nodeSpacing); // No extra padding - lessons start right after title
        
        return (
          <React.Fragment key={lessonId || index}>
            {/* Path connector to next node */}
            {index < lessons.length - 1 && (
              <CurvedPathConnector
                fromIndex={index}
                toIndex={index + 1}
                totalLessons={lessons.length}
                themeColors={themeColors}
                styles={styles}
                centerX={centerXRelative}
                nodeSpacing={nodeSpacing}
                startYOffset={startYOffset}
              />
            )}
            
            {/* Lesson Node */}
            <View style={[
              styles.curvedLessonNodeWrapper,
              {
                left: nodeX - 35, // Center the node (35 = half of 70px width)
                top: nodeY,
              }
            ]}>
              <LessonNode
                lesson={lesson}
                index={index}
                status={status}
                onPress={(lessonId: string, status: string) => onLessonPress(lessonId, status, lesson)}
                styles={styles}
                themeColors={themeColors}
              />
            </View>
          </React.Fragment>
        );
      })}
    </>
  );
}

export default function PathScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [userProgress, setUserProgress] = useState<ProgressSummary | null>(null);
  const [lessonProgressMap, setLessonProgressMap] = useState<{ [lessonId: string]: { status: string } }>({});
  const [chapterCompletionMap, setChapterCompletionMap] = useState<{ [chapterId: string]: boolean }>({});
  const [chapterLessonCounts, setChapterLessonCounts] = useState<{ [chapterId: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [activeWorldIndex, setActiveWorldIndex] = useState(0);
  const [previousWorldIndex, setPreviousWorldIndex] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const backgroundOpacity = useRef(new Animated.Value(1)).current;
  const previousBackgroundOpacity = useRef(new Animated.Value(0)).current;
  const worldRefs = useRef<{ [key: number]: { y: number; height: number } }>({});
  const [statsBarBottom, setStatsBarBottom] = useState<number>(0);
  const [hasScrolledToActive, setHasScrolledToActive] = useState(false);

  useEffect(() => {
    loadPath();
  }, []);

  // Fixed: Handle navigation to lesson from HomeScreen
  useEffect(() => {
    const navigateToLessonId = route.params?.navigateToLessonId;
    if (navigateToLessonId && !loading && worlds.length > 0) {
      // Find the lesson and navigate to it
      const findAndNavigateToLesson = async () => {
        let foundLesson: any = null;
        for (const world of worlds) {
          for (const chapter of world.chapters) {
            try {
              const chapterLessons = await contentService.getLessonsByChapter(chapter.id);
              const lesson = chapterLessons.find((l: any) => (l.id || l.lesson_id) === navigateToLessonId);
              if (lesson) {
                foundLesson = lesson;
                break;
              }
            } catch (error) {
              logger.error(`Error finding lesson ${navigateToLessonId}`, error);
            }
          }
          if (foundLesson) break;
        }
        
        if (foundLesson) {
          // Clear the param to prevent re-navigation
          navigation.setParams({ navigateToLessonId: undefined });
          // Navigate to the lesson
          navigation.navigate('LessonFlow', {
            screen: 'LessonSlides',
            params: { lessonId: navigateToLessonId },
          });
        }
      };
      
      findAndNavigateToLesson();
    }
  }, [route.params?.navigateToLessonId, loading, worlds, navigation]);

  // Refresh path when screen is focused (e.g., after completing a lesson)
  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadPath();
        setHasScrolledToActive(false); // Reset scroll flag on refresh
      }
    }, [loading])
  );

  // Scroll to active lesson after path loads
  useEffect(() => {
    if (!loading && !hasScrolledToActive && worlds.length > 0 && chapterLessonCounts && Object.keys(chapterLessonCounts).length > 0) {
      // Wait for layout to complete
      setTimeout(() => {
        scrollToActiveLesson();
      }, 500);
    }
  }, [loading, hasScrolledToActive, worlds, chapterLessonCounts, lessonProgressMap]);

  const loadPath = async () => {
    try {
      const [worldsData, progressData, progressRecords] = await Promise.all([
        contentService.getWorlds(),
        contentService.getProgressSummary(),
        contentService.getUserProgress(),
      ]);
      setWorlds(worldsData);
      setUserProgress(progressData);
      
      // Create a map of lessonId -> progress status
      const progressMap: { [lessonId: string]: { status: string } } = {};
      progressRecords.forEach((record: any) => {
        if (record.lessonId) {
          progressMap[record.lessonId] = {
            status: record.status || 'not_started',
          };
        }
      });
      setLessonProgressMap(progressMap);
      
      // Pre-calculate chapter completion status and lesson counts
      const chapterCompletion: { [chapterId: string]: boolean } = {};
      const lessonCounts: { [chapterId: string]: number } = {};
      for (const world of worldsData) {
        for (const chapter of world.chapters) {
          try {
            const chapterLessons = await contentService.getLessonsByChapter(chapter.id);
            lessonCounts[chapter.id] = chapterLessons.length;
            const allCompleted = chapterLessons.every((lesson: any) => {
              const lessonId = lesson.id || lesson.lesson_id;
              const progress = progressMap[lessonId];
              return progress && progress.status === 'completed';
            });
            chapterCompletion[chapter.id] = allCompleted && chapterLessons.length > 0;
          } catch (error) {
            logger.error(`Error checking chapter ${chapter.id} completion`, error);
            chapterCompletion[chapter.id] = false;
            lessonCounts[chapter.id] = 0;
          }
        }
      }
      setChapterCompletionMap(chapterCompletion);
      setChapterLessonCounts(lessonCounts);
    } catch (error) {
      logger.error('Error loading path', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if all lessons in a chapter are completed
  const isChapterCompleted = (chapterLessons: any[]): boolean => {
    if (!chapterLessons || chapterLessons.length === 0) return false;
    
    return chapterLessons.every((lesson: any) => {
      const lessonId = lesson.id || lesson.lesson_id;
      const progress = lessonProgressMap[lessonId];
      return progress && progress.status === 'completed';
    });
  };

  // Helper to find the first available (current) lesson in a chapter
  // Returns the index of the lesson that should be "current", or null if all are completed
  // Note: This function doesn't check cross-chapter completion - that's handled in getLessonStatus
  // IMPORTANT: This function should NEVER return an index for a completed lesson
  const findCurrentLessonIndex = (chapterLessons: any[], chapterIndex: number): number | null => {
    if (!chapterLessons || chapterLessons.length === 0) return null;
    
    for (let i = 0; i < chapterLessons.length; i++) {
      const lessonId = chapterLessons[i]?.id || chapterLessons[i]?.lesson_id;
      const progress = lessonProgressMap[lessonId];
      
      // CRITICAL: If lesson is completed, skip it - never mark as current
      if (progress && progress.status === 'completed') {
        continue;
      }
      
      // If lesson is in progress, this is the current one
      if (progress && progress.status === 'in_progress') {
        return i;
      }
      
      // If no progress or status is 'not_started', check if this lesson should be unlocked
      if (i === 0) {
        // First lesson of chapter
        if (chapterIndex === 0) {
          // First lesson of first chapter is always available (if not completed)
          if (!progress || progress.status !== 'completed') {
            return 0;
          }
        }
        // For other chapters, we don't check here - getLessonStatus will handle it
        // Return null so getLessonStatus can check previous chapter completion
        return null;
      } else {
        // Check if all previous lessons in this chapter are completed
        let allPreviousCompleted = true;
        for (let j = 0; j < i; j++) {
          const prevLessonId = chapterLessons[j]?.id || chapterLessons[j]?.lesson_id;
          const prevProgress = lessonProgressMap[prevLessonId];
          if (!prevProgress || prevProgress.status !== 'completed') {
            allPreviousCompleted = false;
            break;
          }
        }
        
        // If all previous are completed AND this lesson is not completed, this is the FIRST current lesson
        if (allPreviousCompleted && (!progress || progress.status !== 'completed')) {
          return i; // Return immediately - this is the first available
        }
      }
    }
    
    return null; // All lessons are completed or no valid current lesson found
  };

  // Helper to check if previous chapter is completed (synchronous using pre-calculated map)
  const isPreviousChapterCompleted = (worldIndex: number, currentChapterIndex: number, currentChapterId: string): boolean => {
    if (currentChapterIndex === 0) {
      // First chapter - check if it's the first world
      if (worldIndex === 0) {
        return true; // First chapter of first world is always available
      }
      // For other worlds, check if previous world's last chapter is completed
      if (worldIndex > 0 && worlds.length > worldIndex - 1) {
        const prevWorld = worlds[worldIndex - 1];
        if (prevWorld.chapters.length > 0) {
          const lastChapter = prevWorld.chapters[prevWorld.chapters.length - 1];
          return chapterCompletionMap[lastChapter.id] === true;
        }
      }
      return false;
    }
    
    // Check if previous chapter in same world is completed
    if (worlds.length > worldIndex && worlds[worldIndex].chapters.length > currentChapterIndex - 1) {
      const prevChapter = worlds[worldIndex].chapters[currentChapterIndex - 1];
      return chapterCompletionMap[prevChapter.id] === true;
    }
    
    return false;
  };

  // Memoized lesson status calculation to prevent unnecessary recalculations
  const getLessonStatus = useCallback((lessonId: string, lessonIndex: number, chapterIndex: number, chapterLessons?: any[], worldIndex: number = 0, chapterId?: string): 'locked' | 'current' | 'completed' => {
    // FIRST: Always check if lesson has progress - this takes priority
    const progress = lessonProgressMap[lessonId];
    
    // If lesson is completed, ALWAYS return completed (never current or locked)
    if (progress && progress.status === 'completed') {
      return 'completed';
    }
    
    // If lesson is in progress, return current
    if (progress && progress.status === 'in_progress') {
      return 'current';
    }
    
    // If no progress or status is 'not_started', find which lesson should be current
    if (chapterLessons) {
      // Find the first available lesson that should be "current" in this chapter
      const currentLessonIndex = findCurrentLessonIndex(chapterLessons, chapterIndex);
      
      // IMPORTANT: Double-check that the lesson at currentLessonIndex is not completed
      // This prevents completed lessons from being marked as current
      if (currentLessonIndex !== null) {
        const currentLesson = chapterLessons[currentLessonIndex];
        const currentLessonId = currentLesson?.id || currentLesson?.lesson_id;
        const currentLessonProgress = lessonProgressMap[currentLessonId];
        
        // If the "current" lesson is actually completed, find the next one
        if (currentLessonProgress && currentLessonProgress.status === 'completed') {
          // Find the next non-completed lesson
          for (let i = currentLessonIndex + 1; i < chapterLessons.length; i++) {
            const nextLesson = chapterLessons[i];
            const nextLessonId = nextLesson?.id || nextLesson?.lesson_id;
            const nextProgress = lessonProgressMap[nextLessonId];
            if (!nextProgress || nextProgress.status !== 'completed') {
              // This is the actual current lesson
              if (i === lessonIndex) {
                return 'current';
              }
              break;
            }
          }
          // If all remaining lessons are completed, check next chapter
          // But for now, return locked for this lesson
        } else if (currentLessonIndex === lessonIndex) {
          // This lesson is the current one and it's not completed
          return 'current';
        }
      }
      
      // Check if this is the first lesson (index 0) of a chapter
      if (lessonIndex === 0) {
        if (chapterIndex === 0 && worldIndex === 0) {
          // First lesson of first chapter of first world - always available (if not completed)
          if (!progress || progress.status !== 'completed') {
            return 'current';
          }
        }
        
        // First lesson of a chapter - check if previous chapter is completed
        if (chapterId && isPreviousChapterCompleted(worldIndex, chapterIndex, chapterId)) {
          // Previous chapter is completed, so this first lesson should be current
          // But only if there's no other current lesson in this chapter AND this lesson is not completed
          if (currentLessonIndex === null && (!progress || progress.status !== 'completed')) {
            return 'current';
          }
        }
      }
      
      // Otherwise, this lesson is locked
      return 'locked';
    }
    
    // If no chapter lessons data, default to locked
    return 'locked';
  }, [lessonProgressMap, chapterCompletionMap, worlds]);

  const handleLessonPress = (lessonId: string, status: string, lesson: any) => {
    if (status === 'locked') {
      return; // Don't show modal for locked lessons
    }
    setSelectedLesson({ ...lesson, status, lessonId });
    setShowLessonModal(true);
  };

  const handleStartLesson = () => {
    if (selectedLesson) {
      setShowLessonModal(false);
      // Check if this is a legendary attempt (completed lesson)
      const isLegendary = selectedLesson.status === 'completed';
      navigation.navigate('LessonFlow', {
        screen: 'LessonSlides',
        params: { 
          lessonId: selectedLesson.lessonId,
          legendary: isLegendary,
        },
      });
    }
  };

  const handleReviewLesson = () => {
    if (selectedLesson) {
      setShowLessonModal(false);
      navigation.navigate('LessonFlow', {
        screen: 'LessonSlides',
        params: { lessonId: selectedLesson.lessonId, review: true },
      });
    }
  };

  // Find and scroll to the active lesson
  const scrollToActiveLesson = async () => {
    if (!scrollViewRef.current || !worlds.length) return;

    const nodeSpacing = 100;
    const chapterTitleHeight = 60;
    const chapterSpacing = 20;
    const statsBarAndHeaderHeight = statsBarBottom || insets.top + 60 + 20; // Stats bar + sticky header + padding

    // Find the active lesson across all worlds
    for (let worldIndex = 0; worldIndex < worlds.length; worldIndex++) {
      const world = worlds[worldIndex];
      
      for (let chapterIndex = 0; chapterIndex < world.chapters.length; chapterIndex++) {
        const chapter = world.chapters[chapterIndex];
        
        try {
          const chapterLessons = await contentService.getLessonsByChapter(chapter.id);
          if (!chapterLessons || chapterLessons.length === 0) continue;

          // Sort lessons by orderIndex
          const sortedLessons = [...chapterLessons].sort((a: any, b: any) => {
            const aIndex = a.orderIndex ?? a.order_index ?? 0;
            const bIndex = b.orderIndex ?? b.order_index ?? 0;
            return aIndex - bIndex;
          });

          // Find the current lesson in this chapter
          for (let lessonIndex = 0; lessonIndex < sortedLessons.length; lessonIndex++) {
            const lesson = sortedLessons[lessonIndex];
            const lessonId = lesson.id || lesson.lesson_id;
            const status = getLessonStatus(lessonId, lessonIndex, chapterIndex, sortedLessons, worldIndex, chapter.id);
            
            if (status === 'current') {
              // Calculate Y position for this lesson
              // First, calculate cumulative height of previous worlds
              let worldYOffset = 0;
              for (let w = 0; w < worldIndex; w++) {
                const prevWorld = worlds[w];
                let worldHeight = 0;
                for (const prevChapter of prevWorld.chapters) {
                  const prevLessonCount = chapterLessonCounts[prevChapter.id] || 0;
                  worldHeight += chapterTitleHeight + chapterSpacing + (prevLessonCount * nodeSpacing);
                }
                worldYOffset += worldHeight;
              }

              // Calculate cumulative height of previous chapters in current world
              let chapterYOffset = 0;
              for (let c = 0; c < chapterIndex; c++) {
                const prevChapter = world.chapters[c];
                const prevLessonCount = chapterLessonCounts[prevChapter.id] || 0;
                chapterYOffset += chapterTitleHeight + chapterSpacing + (prevLessonCount * nodeSpacing);
              }

              // Calculate lesson position within chapter
              const lessonYOffset = chapterTitleHeight + chapterSpacing + (lessonIndex * nodeSpacing);

              // Total Y position
              const totalY = worldYOffset + chapterYOffset + lessonYOffset;

              // Calculate scroll position to center the lesson
              const screenHeight = SCREEN_HEIGHT;
              const scrollY = totalY - (screenHeight / 2) + (nodeSpacing / 2) + statsBarAndHeaderHeight;

              // Scroll to active lesson
              scrollViewRef.current.scrollTo({
                y: Math.max(0, scrollY),
                animated: true,
              });

              setHasScrolledToActive(true);
              return; // Found and scrolled to active lesson
            }
          }
        } catch (error) {
          logger.error(`Error loading lessons for chapter ${chapter.id}`, error);
        }
      }
    }
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading path...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get background theme from active world (no images, just colors)
  const activeWorld = worlds.length > 0 ? worlds[activeWorldIndex] : null;
  const backgroundTheme = activeWorld 
    ? getWorldTheme(activeWorld.themeKey)
    : getWorldTheme('default');

  // Get previous world background for smooth crossfade
  const previousWorld = worlds.length > 0 && previousWorldIndex !== activeWorldIndex 
    ? worlds[previousWorldIndex] 
    : null;
  const previousBackgroundTheme = previousWorld 
    ? getWorldTheme(previousWorld.themeKey)
    : null;

  // Handle scroll to detect which world is in view
  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const screenHeight = event.nativeEvent.layoutMeasurement.height;
    const viewportCenter = scrollY + screenHeight / 2;
    
    // Find which world section is currently in the center of the viewport
    let newActiveIndex = activeWorldIndex;
    
    // Check each world's position
    for (let i = 0; i < worlds.length; i++) {
      const worldPos = worldRefs.current[i];
      if (worldPos) {
        const worldTop = worldPos.y;
        const worldBottom = worldTop + worldPos.height;
        
        // If viewport center is within this world's bounds
        if (viewportCenter >= worldTop && viewportCenter <= worldBottom) {
          newActiveIndex = i;
          break;
        }
        // If we've scrolled past this world, use the next one
        if (viewportCenter > worldBottom && i < worlds.length - 1) {
          newActiveIndex = i + 1;
        }
      }
    }
    
    // Fallback: if no world positions are measured yet, use estimated calculation
    if (Object.keys(worldRefs.current).length === 0) {
      const estimatedWorldHeight = 600;
      const calculatedIndex = Math.floor((scrollY + screenHeight / 2) / estimatedWorldHeight);
      newActiveIndex = Math.max(0, Math.min(calculatedIndex, worlds.length - 1));
    }
    
    // Clamp to valid range
    newActiveIndex = Math.max(0, Math.min(newActiveIndex, worlds.length - 1));
    
    if (newActiveIndex !== activeWorldIndex && newActiveIndex < worlds.length) {
      // Smooth crossfade transition
      setPreviousWorldIndex(activeWorldIndex);
      
      // Haptic feedback when world changes
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Reset previous background opacity to 1 and new background to 0
      previousBackgroundOpacity.setValue(1);
      backgroundOpacity.setValue(0);
      
      // Crossfade: previous fades out while new fades in simultaneously
      Animated.parallel([
        Animated.timing(previousBackgroundOpacity, {
          toValue: 0,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 1000,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
      
      setActiveWorldIndex(newActiveIndex);
    }
  };

  // Measure world section positions
  const handleWorldLayout = (worldIndex: number, event: any) => {
    const { y, height } = event.nativeEvent.layout;
    // y is relative to ScrollView content, which is what we need
    worldRefs.current[worldIndex] = { y, height };
  };

  // Get spiritual gradient colors based on world theme
  const getSpiritualGradient = (theme: any) => {
    // Dark → deep brown/monk orange gradient
    // Option 1: Dark brown (temple at night)
    // Option 2: Monk orange (warm spiritual)
    // Option 3: Midnight blue (calm)
    const gradients: { [key: string]: string[] } = {
      foundations: ['#111111', '#1E1A18', '#2A1F1A'], // Dark → deep brown
      four_noble_truths: ['#131313', '#2A1F15', '#4A3728'], // Dark → monk orange
      eightfold_path: ['#0F0F1A', '#1A1A2E', '#16213E'], // Dark → midnight blue
      dhammapada: ['#1A1A0F', '#2A2A1A', '#3A2F1A'], // Dark → golden brown
      sutta_stories: ['#0F1A1A', '#1A2A2A', '#1E2F2F'], // Dark → teal night
      mindfulness: ['#1A0F1A', '#2A1A2A', '#2F1E2F'], // Dark → purple night
      default: ['#111111', '#1E1A18', '#2A1F1A'], // Default dark brown
    };
    const themeKey = theme?.id || 'default';
    return gradients[themeKey] || gradients.default;
  };

  const currentGradient = getSpiritualGradient(backgroundTheme);
  const previousGradient = previousBackgroundTheme ? getSpiritualGradient(previousBackgroundTheme) : null;

  return (
    <View style={styles.fullScreenContainer}>
      {/* Previous Background (for smooth crossfade) */}
      {previousGradient && (
        <Animated.View 
          style={[
            styles.fullScreenBackground, 
            { 
              opacity: previousBackgroundOpacity,
              zIndex: 0,
            }
          ]}
        >
          <LinearGradient
            colors={previousGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {previousBackgroundTheme && (
            <AnimatedParticles 
              themeColors={getThemeColors(previousBackgroundTheme)} 
              particleType={previousBackgroundTheme.particles?.type || 'leaves'}
            />
          )}
        </Animated.View>
      )}
      
      {/* Current Background with fade animation */}
      <Animated.View 
        style={[
          styles.fullScreenBackground, 
          { 
            opacity: backgroundOpacity,
            zIndex: 1,
          }
        ]}
      >
        <LinearGradient
          colors={currentGradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <AnimatedParticles 
          themeColors={getThemeColors(backgroundTheme)} 
          particleType={backgroundTheme.particles?.type || 'leaves'}
        />
      </Animated.View>

      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea} edges={[]}>
        {/* Stats Bar - Duolingo Style */}
        <View 
          style={[styles.statsBar, { paddingTop: insets.top, zIndex: 20 }]}
          onLayout={(event) => {
            const { height, y } = event.nativeEvent.layout;
            setStatsBarBottom(height + y);
          }}
        >
          {/* Language/Level */}
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🇱🇰</Text>
            <Text style={styles.statValue}>{userProgress?.level || 1}</Text>
          </View>
          
          {/* Streak - Always show, even if 0 */}
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{userProgress?.streak?.current || 0}</Text>
          </View>
          
          {/* Gems/XP */}
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>💎</Text>
            <Text style={styles.statValue}>{userProgress?.totalXP || 0}</Text>
          </View>
          
          {/* Hearts */}
          <View style={[styles.statItem, { marginRight: 0 }]}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={styles.statValue}>
              {userProgress?.hearts?.current || 5}/{userProgress?.hearts?.max || 5}
            </Text>
          </View>
        </View>

        {/* Sticky World Header - Enhanced with world theme */}
        {activeWorld && (() => {
          const activeWorldTheme = getWorldTheme(activeWorld.themeKey);
          const activeThemeColors = getThemeColors(activeWorldTheme);
          
          // Get world icon based on theme
          const getWorldIcon = (themeKey: string) => {
            const icons: { [key: string]: string } = {
              foundations: '🌱',
              four_noble_truths: '☸️',
              eightfold_path: '🕉️',
              dhammapada: '📜',
              sutta_stories: '📖',
              mindfulness: '🧘',
            };
            return icons[themeKey] || '📚';
          };

          const worldIcon = getWorldIcon(activeWorldTheme.id);
          
          return (
            <LinearGradient
              colors={[activeThemeColors.primary, activeThemeColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.stickyWorldHeader, 
                { 
                  top: statsBarBottom || insets.top + 60, // Below stats bar
                }
              ]}
            >
              <View style={styles.stickyWorldHeaderContent}>
                <View style={styles.stickyWorldHeaderText}>
                  <Text style={styles.stickyWorldSubtitle}>
                    {language === 'en' ? `SECTION ${activeWorldIndex + 1}, WORLD ${activeWorldIndex + 1}` : `කොටස ${activeWorldIndex + 1}, ලෝකය ${activeWorldIndex + 1}`}
                  </Text>
                  <Text style={styles.stickyWorldTitle}>
                    {language === 'en' ? activeWorld.nameEn : activeWorld.nameSi}
                  </Text>
                </View>
                <View style={styles.stickyWorldHeaderDivider} />
                <View style={styles.stickyWorldHeaderIcon}>
                  <Text style={{ fontSize: 28 }}>{worldIcon}</Text>
                </View>
              </View>
            </LinearGradient>
          );
        })()}

        <ScrollView 
          ref={scrollViewRef}
          style={[styles.container, { zIndex: 2 }]} 
          contentContainerStyle={[
            styles.scrollContent, 
            { paddingTop: (statsBarBottom || insets.top + 60) + 20 } // Padding for stats bar + sticky header (reduced)
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={200}
        >
        {worlds.map((world, worldIndex) => {
          const worldTheme = getWorldTheme(world.themeKey);
          const themeColors = getThemeColors(worldTheme);
          
          return (
            <View 
              key={world.id} 
              style={styles.worldSection}
              onLayout={(event) => handleWorldLayout(worldIndex, event)}
            >
              {/* World Content - Directly on background */}
              <View style={styles.worldContent}>
                {/* World Header - Duolingo-style banner (hidden, sticky header shows instead) */}
                <View style={[styles.worldHeader, { backgroundColor: themeColors.primary, opacity: 0, height: 0 }]}>
                  {/* This is kept for spacing but hidden - sticky header shows instead */}
                </View>

                {/* Path Nodes - Single absolute container for all chapters to prevent overlap */}
                <View style={styles.pathContainer}>
                  {/* Calculate total height needed for all chapters */}
                  {(() => {
                    const nodeSpacing = 100;
                    const chapterTitleHeight = 60; // Height for chapter title text
                    const chapterSpacing = 20; // Space between chapter title and lessons
                    let totalHeight = 0;
                    
                    // Calculate total height
                    world.chapters.forEach((chapter) => {
                      const lessonCount = chapterLessonCounts[chapter.id] || 0;
                      const chapterPathHeight = lessonCount * nodeSpacing;
                      totalHeight += chapterTitleHeight + chapterSpacing + chapterPathHeight;
                    });
                    
                    let cumulativeYOffset = 0;
                    
                    return (
                      <View style={[styles.curvedPathContainer, { minHeight: totalHeight }]}>
                        {/* Single container for all chapters - everything absolutely positioned here */}
                        {/* Render all chapters with calculated offsets */}
                        {world.chapters.map((chapter, chapterIndex) => {
                          const lessonCount = chapterLessonCounts[chapter.id] || 0;
                          const chapterPathHeight = lessonCount * nodeSpacing;
                          
                          // Calculate offset for this chapter
                          // First chapter starts at 0
                          const currentChapterOffset = cumulativeYOffset;
                          
                          // Calculate lesson start offset (after chapter title + spacing)
                          const lessonStartOffset = currentChapterOffset + chapterTitleHeight + chapterSpacing;
                          
                          // Update cumulative offset for next chapter (AFTER using it)
                          cumulativeYOffset += chapterTitleHeight + chapterSpacing + chapterPathHeight;
                          
                          return (
                            <React.Fragment key={chapter.id}>
                              {/* Chapter Title - Text with decorative lines on both sides */}
                              <View style={[
                                styles.chapterTitleContainerAbsolute,
                                { 
                                  top: currentChapterOffset,
                                  left: 0,
                                  right: 0,
                                }
                              ]}>
                                <View style={styles.chapterTitleWithLines}>
                                  <View style={styles.chapterTitleLine} />
                                  <Text style={styles.chapterTitleText}>
                                    {language === 'en' ? chapter.nameEn : chapter.nameSi}
                                  </Text>
                                  <View style={styles.chapterTitleLine} />
                                </View>
                              </View>

                              {/* Lesson Nodes with Curved Path */}
                              <LessonNodes 
                                chapterId={chapter.id}
                                chapterIndex={chapterIndex}
                                worldIndex={worldIndex}
                                onLessonPress={handleLessonPress}
                                getLessonStatus={getLessonStatus}
                                styles={styles}
                                themeColors={themeColors}
                                startYOffset={lessonStartOffset}
                              />
                            </React.Fragment>
                          );
                        })}
                      </View>
                    );
                  })()}
                </View>
              </View>
            </View>
          );
        })}
        </ScrollView>
      </SafeAreaView>

      {/* Lesson Detail Modal */}
      <Modal
        visible={showLessonModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLessonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowLessonModal(false)}
          />
          {selectedLesson && (() => {
            // Find the world that contains this lesson's chapter
            const lessonChapter = worlds
              .flatMap(w => w.chapters.map(c => ({ ...c, world: w })))
              .find(c => c.id === selectedLesson.chapterId || c.id === selectedLesson.chapter?.id);
            
            const lessonThemeColors = lessonChapter?.world
              ? getThemeColors(getWorldTheme(lessonChapter.world.themeKey))
              : getThemeColors(getWorldTheme('default'));
            
            return (
              <View style={[styles.lessonCard, { backgroundColor: lessonThemeColors.primary }]}>
              <Text style={styles.lessonCardTitle}>
                {language === 'en' 
                  ? (selectedLesson.titleEn || selectedLesson.title?.en || selectedLesson.nameEn || 'Lesson')
                  : (selectedLesson.titleSi || selectedLesson.title?.si || selectedLesson.nameSi || 'පාඩම')}
              </Text>
              
              {selectedLesson.status === 'current' ? (
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={handleStartLesson}
                >
                  <Text style={styles.startButtonText}>
                    {language === 'en' ? 'START' : 'ආරම්භ කරන්න'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={styles.lessonCardSubtitle}>
                    {language === 'en' ? 'Prove your proficiency with Legendary' : 'ප්‍රවීණතාවය ඔප්පු කරන්න'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.reviewButton}
                    onPress={handleReviewLesson}
                  >
                    <Text style={[styles.reviewButtonText, { color: lessonThemeColors.primary }]}>
                      {language === 'en' ? 'REVIEW +5 XP' : 'සමාලෝචනය +5 XP'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.legendaryButton}
                    onPress={handleStartLesson}
                  >
                    <Text style={styles.legendaryButtonText}>
                      {language === 'en' ? 'LEGENDARY +40 XP' : 'පුරාණ +40 XP'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              </View>
            );
          })()}
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  fullScreenBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  stickyWorldHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 0,
    zIndex: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  stickyWorldHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stickyWorldHeaderText: {
    flex: 1,
    marginRight: 16,
  },
  stickyWorldHeaderDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginRight: 16,
  },
  stickyWorldHeaderIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyWorldTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'left',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    lineHeight: 26,
  },
  stickyWorldSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  scrollContent: {
    paddingBottom: 100,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  worldSection: {
    marginBottom: 40,
    marginHorizontal: 16,
    marginTop: 0,
    position: 'relative',
    zIndex: 2,
  },
  worldContent: {
    padding: 20,
    paddingTop: 8,
    position: 'relative',
    zIndex: 2,
  },
  worldHeader: {
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginHorizontal: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  worldHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  worldHeaderText: {
    flex: 1,
    marginRight: 12,
  },
  worldHeaderIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    paddingLeft: 12,
  },
  worldTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'left',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    lineHeight: 24,
  },
  worldSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  pathContainer: {
    width: '100%',
  },
  chapterTitleContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  chapterTitleContainerAbsolute: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    paddingVertical: 10,
  },
  chapterTitleWithLines: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  chapterTitleLine: {
    height: 1,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    maxWidth: 60,
  },
  chapterTitleText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginHorizontal: 12,
    flexShrink: 0,
  },
  chapterNode: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 24,
    position: 'relative',
    width: '100%',
  },
  chapterCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  chapterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
    paddingHorizontal: 0,
  },
  chapterLabelLine: {
    height: 1,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
  },
  chapterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    flexShrink: 0,
  },
  lessonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 36,
    paddingHorizontal: 20,
  },
  lessonNodeWrapper: {
    position: 'relative',
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonNode: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  lessonNodeLocked: {
    opacity: 0.4,
    borderColor: '#CCCCCC',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  lessonNodeDesaturated: {
    opacity: 0.5,
    borderColor: '#999999',
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  desaturatedIcon: {
    opacity: 0.6,
  },
  lessonDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  checkmark: {
    fontSize: 28,
    color: '#999999', // Grey for completed lessons (deprecated, use checkmarkCompleted)
    fontWeight: 'bold',
  },
  checkmarkCompleted: {
    fontSize: 32,
    color: '#FFD700', // Gold color for completed lessons
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sparkle: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleText: {
    fontSize: 16,
  },
  pulsingRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  completedGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    opacity: 0.15,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  orbitParticle: {
    position: 'absolute',
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fogParticle: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  lessonCard: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 1000,
  },
  lessonCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  lessonCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  reviewButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  legendaryButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  legendaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  // Curved Path Styles
  curvedPathContainer: {
    flexDirection: 'row',
    position: 'relative',
    minHeight: 400,
    marginBottom: 40,
    width: '100%',
  },
  curvedPathWrapper: {
    flex: 1,
    position: 'relative',
    marginLeft: 80, // Space for character
    width: SCREEN_WIDTH - 80 - 40, // Account for character and padding
  },
  curvedPathWrapperCentered: {
    position: 'relative',
    width: SCREEN_WIDTH - 40, // Account for padding only (centered)
    alignSelf: 'center',
    height: '100%', // Take full height of parent
  },
  curvedLessonNodeWrapper: {
    position: 'absolute',
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pathConnector: {
    position: 'absolute',
    zIndex: 1,
  },
  pathCurveDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Character Styles
  characterContainer: {
    position: 'absolute',
    zIndex: 5,
    top: 0,
  },
  characterLeft: {
    left: 0,
  },
  characterRight: {
    right: 0,
  },
  characterImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterEmoji: {
    fontSize: 60,
  },
  characterStars: {
    flexDirection: 'row',
    marginTop: 8,
  },
  starEmoji: {
    fontSize: 16,
    opacity: 0.6,
  },
});

