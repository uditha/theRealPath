import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Star, Flame, BookOpen, Flower2 } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { contentService, ProgressSummary } from '../../services/content.service';
import { emotionService, DailyGrid, WeeklyGrid } from '../../services/emotion.service';
import { EmotionType, getEmotion } from '../../utils/emotions';
import { calculatePondColor, getDominantEmotion } from '../../utils/colorBlending';
import { logger } from '../../utils/logger';
import { calculateKusalaBalance } from '../../utils/kusalaCalculator';
import { spacing } from '../../utils/spacing';
import { cornerRadius } from '../../utils/cornerRadius';
import DailyWisdom from '../../components/Home/DailyWisdom';
import MonkCircle from '../../components/Home/MonkCircle';
import KusalaMeter from '../../components/Home/KusalaMeter';
import GentleGuidance from '../../components/Home/GentleGuidance';
import KalyanamittaMessage from '../../components/Home/KalyanamittaMessage';
import MicroCoaching from '../../components/Home/MicroCoaching';
import ReflectionsSection from '../../components/Home/ReflectionsSection';
import MindfulGrowth from '../../components/Home/MindfulGrowth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { language, t } = useLanguage();
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [dailyGrid, setDailyGrid] = useState<DailyGrid | null>(null);
  const [weeklyGrid, setWeeklyGrid] = useState<WeeklyGrid | null>(null);
  const [previousWeekGrid, setPreviousWeekGrid] = useState<WeeklyGrid | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const moodGradientAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      const today = new Date();
      const weekStart = emotionService.getWeekStart(today);
      const previousWeekStart = new Date(weekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      
      const [progressData, worldsData, userProgress, dailyData, weeklyData, previousWeekData] = await Promise.all([
        contentService.getProgressSummary(),
        contentService.getWorlds(),
        contentService.getUserProgress(),
        emotionService.getDailyGrid(today),
        emotionService.getWeeklyGrid(weekStart),
        emotionService.getWeeklyGrid(previousWeekStart),
      ]);
      
      setProgress(progressData);
      setDailyGrid(dailyData);
      setWeeklyGrid(weeklyData);
      setPreviousWeekGrid(previousWeekData);
      
      // Find next lesson
      const progressMap: { [key: string]: any } = {};
      userProgress.forEach((p: any) => {
        progressMap[p.lessonId] = p;
      });
      
      let foundNextLesson = null;
      const chapterPromises = worldsData.flatMap(world => 
        world.chapters.map(chapter => 
          contentService.getLessonsByChapter(chapter.id).then(lessons => ({
            world,
            chapter,
            lessons
          }))
        )
      );
      
      const chaptersWithLessons = await Promise.all(chapterPromises);
      
      for (const { world, chapter, lessons } of chaptersWithLessons) {
        for (let i = 0; i < lessons.length; i++) {
          const lesson = lessons[i];
          const lessonId = lesson.id || lesson.lesson_id;
          const progress = progressMap[lessonId];
          
          if (progress && progress.status === 'completed') continue;
          
          if (progress && progress.status === 'in_progress') {
            foundNextLesson = lesson;
            break;
          }
          
          if (i === 0) {
            const worldIndex = worldsData.findIndex(w => w.id === world.id);
            if (worldIndex === 0 && chapter.orderIndex === 0) {
              foundNextLesson = lesson;
              break;
            }
          } else {
            let allPreviousCompleted = true;
            for (let j = 0; j < i; j++) {
              const prevLessonId = lessons[j]?.id || lessons[j]?.lesson_id;
              const prevProgress = progressMap[prevLessonId];
              if (!prevProgress || prevProgress.status !== 'completed') {
                allPreviousCompleted = false;
                break;
              }
            }
            if (allPreviousCompleted) {
              foundNextLesson = lesson;
              break;
            }
          }
        }
        if (foundNextLesson) break;
      }
      
      setNextLesson(foundNextLesson);
    } catch (error) {
      logger.error('Error loading home data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadData();
      }
    }, [loadData, loading])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Calculate today's emotion stats
  const todayStats = useMemo(() => {
    if (!dailyGrid) return null;
    const tiles = dailyGrid.tiles || [];
    const dominantEmotion = getDominantEmotion(tiles);
    const pondColor = calculatePondColor(tiles);
    const totalEmotions = tiles.length;
    
    // Count emotions
    const emotionCounts: Record<EmotionType, number> = {} as Record<EmotionType, number>;
    tiles.forEach(tile => {
      emotionCounts[tile.emotion] = (emotionCounts[tile.emotion] || 0) + 1;
    });
    
    return {
      totalEmotions,
      dominantEmotion,
      pondColor,
      emotionCounts,
      tiles,
    };
  }, [dailyGrid]);

  // Calculate Kusala balance
  const kusalaBalance = useMemo(() => {
    if (!todayStats || !todayStats.tiles) return null;
    return calculateKusalaBalance(todayStats.tiles);
  }, [todayStats]);

  // Calculate mood background gradient
  const moodGradient = useMemo((): [string, string] => {
    if (!todayStats || !todayStats.dominantEmotion) {
      return ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)']; // Transparent
    }

    const emotion = getEmotion(todayStats.dominantEmotion);
    switch (todayStats.dominantEmotion) {
      case EmotionType.CALM_CLARITY:
        return ['rgba(255, 245, 238, 0.3)', 'rgba(255, 235, 215, 0.2)']; // Warm pastel
      case EmotionType.ANGER_AVERSION:
        return ['rgba(255, 200, 200, 0.25)', 'rgba(255, 180, 180, 0.15)']; // Deeper red shade
      case EmotionType.SADNESS_GRIEF:
        return ['rgba(200, 220, 255, 0.25)', 'rgba(180, 200, 255, 0.15)']; // Muted blue
      case EmotionType.JOY:
        return ['rgba(255, 250, 200, 0.3)', 'rgba(255, 235, 180, 0.2)']; // Yellow-peach
      default:
        return ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)'];
    }
  }, [todayStats]);

  // Animate mood gradient changes
  useEffect(() => {
    Animated.timing(moodGradientAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [moodGradient]);

  // Calculate weekly emotion summary
  const weeklySummary = useMemo(() => {
    if (!weeklyGrid) return null;
    const allTiles = weeklyGrid.days.flatMap(day => day.tiles);
    const totalWeekly = allTiles.length;
    const daysWithData = weeklyGrid.days.filter(day => day.tiles.length > 0).length;
    
    const emotionCounts: Record<EmotionType, number> = {} as Record<EmotionType, number>;
    allTiles.forEach(tile => {
      emotionCounts[tile.emotion] = (emotionCounts[tile.emotion] || 0) + 1;
    });
    
    const mostCommon = Object.entries(emotionCounts).reduce((a, b) =>
      emotionCounts[a[0] as EmotionType] > emotionCounts[b[0] as EmotionType] ? a : b
    )[0] as EmotionType;
    
    return {
      totalWeekly,
      daysWithData,
      mostCommon,
    };
  }, [weeklyGrid]);

  const handleContinueJourney = () => {
    if (nextLesson) {
      // Fixed: Navigate to PathTab with lessonId param, so PathScreen can navigate to lesson
      // This ensures back button goes to PathScreen instead of HomeScreen
      navigation.getParent()?.navigate('PathTab', {
        screen: 'Path',
        params: { 
          navigateToLessonId: nextLesson.id,
        },
      });
    } else {
      navigation.getParent()?.navigate('PathTab');
    }
  };

  const handleViewAwareness = () => {
    navigation.getParent()?.navigate('AwarenessTab');
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Mood Background Gradient */}
      {moodGradient[0] !== 'rgba(255, 255, 255, 0)' && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: moodGradientAnim,
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={moodGradient}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      )}
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            accessibilityLabel={language === 'en' ? 'Pull to refresh' : 'නැවත පූරණය කිරීමට ඇදගෙන යන්න'}
          />
        }
        showsVerticalScrollIndicator={false}
        accessibilityLabel={language === 'en' ? 'Home screen content' : 'මුල් පිටුවේ අන්තර්ගතය'}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Welcome back' : 'ආපසු සාදරයෙන් පිළිගනිමු'}
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.name || (language === 'en' ? 'Practitioner' : 'පුරුදුකරු')}
              </Text>
              <DailyWisdom style={{ color: colors.textSecondary }} />
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('PracticeTab', { screen: 'Practice' })}
              activeOpacity={0.8}
              accessibilityLabel={language === 'en' ? 'Open practice screen' : 'පුරුදු තිරය විවෘත කරන්න'}
              accessibilityRole="button"
              accessibilityHint={language === 'en' ? 'Tap to access mindfulness practices' : 'සැලකිලිමත් පුරුදුවන්ට ප්‍රවේශ වීමට තට්ටු කරන්න'}
            >
              <MonkCircle size={60} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Kalyāṇamitta Message */}
        {dailyGrid && dailyGrid.tiles.length > 0 && (
          <View style={styles.section}>
            <KalyanamittaMessage todayTiles={dailyGrid.tiles} />
          </View>
        )}

        {/* Quick Stats Row */}
        <View style={styles.quickStatsRow} accessibilityRole="list">
          <View 
            style={[styles.quickStatCard, { backgroundColor: colors.card }]}
            accessibilityRole="text"
            accessibilityLabel={language === 'en' 
              ? `Total XP: ${progress?.totalXP || 0}` 
              : `සම්පූර්ණ XP: ${progress?.totalXP || 0}`}
          >
            <View style={styles.quickStatIconContainer}>
              <Star size={20} color={colors.primary} strokeWidth={2} fill={colors.primary} />
            </View>
            <Text style={[styles.quickStatValue, { color: colors.text }]}>
              {progress?.totalXP || 0}
            </Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Total XP' : 'සම්පූර්ණ XP'}
            </Text>
          </View>
          
          <View 
            style={[styles.quickStatCard, { backgroundColor: colors.card }]}
            accessibilityRole="text"
            accessibilityLabel={language === 'en' 
              ? `Day streak: ${progress?.streak.current || 0}` 
              : `දින අනුපිළිවෙල: ${progress?.streak.current || 0}`}
          >
            <View style={styles.quickStatIconContainer}>
              <Flame size={20} color={colors.primary} strokeWidth={2} fill={colors.primary} />
            </View>
            <Text style={[styles.quickStatValue, { color: colors.text }]}>
              {progress?.streak.current || 0}
            </Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Day Streak' : 'දින අනුපිළිවෙල'}
            </Text>
          </View>
          
          <View 
            style={[styles.quickStatCard, { backgroundColor: colors.card }]}
            accessibilityRole="text"
            accessibilityLabel={language === 'en' 
              ? `Completed lessons: ${progress?.completedLessons || 0}` 
              : `සම්පූර්ණ පාඩම්: ${progress?.completedLessons || 0}`}
          >
            <View style={styles.quickStatIconContainer}>
              <BookOpen size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.quickStatValue, { color: colors.text }]}>
              {progress?.completedLessons || 0}
            </Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Lessons' : 'පාඩම්'}
            </Text>
          </View>
          
          <View 
            style={[styles.quickStatCard, { backgroundColor: colors.card }]}
            accessibilityRole="text"
            accessibilityLabel={language === 'en' 
              ? `Emotions today: ${todayStats?.totalEmotions || 0}` 
              : `අද හැඟීම්: ${todayStats?.totalEmotions || 0}`}
          >
            <View style={styles.quickStatIconContainer}>
              <Flower2 size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.quickStatValue, { color: colors.text }]}>
              {todayStats?.totalEmotions || 0}
            </Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Today' : 'අද'}
            </Text>
          </View>
        </View>

        {/* Main CTA - Continue Journey */}
        <TouchableOpacity
          style={styles.mainCTA}
          onPress={handleContinueJourney}
          activeOpacity={0.9}
          accessibilityLabel={language === 'en' ? 'Continue your path' : 'ඔබේ මාර්ගය දිගටම කරන්න'}
          accessibilityRole="button"
          accessibilityHint={language === 'en' ? 'Tap to continue your learning journey' : 'ඔබේ ඉගෙනීමේ ගමන දිගටම කිරීමට තට්ටු කරන්න'}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark || colors.primary]}
            style={styles.mainCTAGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.mainCTAContent}>
              <View style={styles.mainCTATextContainer}>
                <Text style={styles.mainCTATitle}>
                  {language === 'en' ? 'Continue Your Path' : 'ඔබේ මාර්ගය දිගටම කරන්න'}
                </Text>
                {nextLesson && (
                  <Text style={styles.mainCTASubtitle}>
                    {language === 'en'
                      ? `Today's Chapter: ${nextLesson.titleEn}`
                      : `අද පරිච්ඡේදය: ${nextLesson.titleSi}`}
                  </Text>
                )}
              </View>
              <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Mind Garden */}
        {todayStats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {language === 'en' ? 'Mind Garden' : 'මනස උයන'}
              </Text>
              <TouchableOpacity 
                onPress={handleViewAwareness}
                accessibilityLabel={language === 'en' ? 'View all emotions' : 'සියලුම හැඟීම් බලන්න'}
                accessibilityRole="button"
                accessibilityHint={language === 'en' ? 'Tap to view all emotion tracking data' : 'සියලුම හැඟීම් නිරීක්ෂණ දත්ත බැලීමට තට්ටු කරන්න'}
              >
                <Text style={[styles.sectionLink, { color: colors.primary }]}>
                  {language === 'en' ? 'View All' : 'සියල්ල බලන්න'} →
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.gardenPreview, { backgroundColor: colors.card }]}>
              {todayStats.totalEmotions > 0 ? (
                <>
                  <View style={styles.gardenPreviewTop}>
                    <View style={styles.pondPreviewContainer}>
                      <View
                        style={[
                          styles.pondPreview,
                          {
                            backgroundColor: todayStats.pondColor,
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.gardenStats}>
                      <Text style={[styles.gardenStatValue, { color: colors.text }]}>
                        {todayStats.totalEmotions}
                      </Text>
                      <Text style={[styles.gardenStatLabel, { color: colors.textSecondary }]}>
                        {language === 'en'
                          ? 'emotions observed today'
                          : 'අද නිරීක්ෂණය කළ හැඟීම්'}
                      </Text>
                      {todayStats.dominantEmotion && (
                        <View style={styles.dominantEmotionBadge}>
                          <Text style={styles.dominantEmoji}>
                            {getEmotion(todayStats.dominantEmotion).emoji}
                          </Text>
                          <Text style={[styles.dominantText, { color: colors.textSecondary }]}>
                            {language === 'en'
                              ? `You noticed ${getEmotion(todayStats.dominantEmotion).labelEn.toLowerCase()} most — well done for seeing it.`
                              : `ඔබ ${getEmotion(todayStats.dominantEmotion).labelSi.toLowerCase()} වැඩියෙන් දුටුවේය — එය දැකීමට හොඳයි.`}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {kusalaBalance && <KusalaMeter balance={kusalaBalance} />}
                </>
              ) : (
                <View style={styles.emptyGarden}>
                  <Text style={styles.emptyGardenIcon}>🌱</Text>
                  <Text style={[styles.emptyGardenText, { color: colors.textSecondary }]}>
                    {language === 'en'
                      ? 'Tap emotions to start your garden'
                      : 'උයන ආරම්භ කිරීමට හැඟීම් තට්ටු කරන්න'}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Micro Coaching */}
            {todayStats.tiles && todayStats.tiles.length > 0 && (
              <MicroCoaching todayTiles={todayStats.tiles} />
            )}
          </View>
        )}

        {/* Gentle Guidance */}
        <View style={styles.section}>
          <GentleGuidance />
        </View>

        {/* Reflections Section */}
        {dailyGrid && (
          <View style={styles.section}>
            <ReflectionsSection
              dailyGrid={dailyGrid}
              weeklyGrid={weeklyGrid || undefined}
              previousWeekGrid={previousWeekGrid || undefined}
            />
          </View>
        )}

        {/* Weekly Summary */}
        {weeklySummary && weeklySummary.totalWeekly > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {language === 'en' ? 'This Week' : 'මෙම සතිය'}
              </Text>
            </View>
            <View style={[styles.weeklyCard, { backgroundColor: colors.card }]}>
              <View style={styles.weeklyStat}>
                <Text style={[styles.weeklyValue, { color: colors.text }]}>
                  {weeklySummary.totalWeekly}
                </Text>
                <Text style={[styles.weeklyLabel, { color: colors.textSecondary }]}>
                  {language === 'en' ? 'total emotions' : 'සම්පූර්ණ හැඟීම්'}
                </Text>
              </View>
              <View style={styles.weeklyDivider} />
              <View style={styles.weeklyStat}>
                <Text style={[styles.weeklyValue, { color: colors.text }]}>
                  {weeklySummary.daysWithData}
                </Text>
                <Text style={[styles.weeklyLabel, { color: colors.textSecondary }]}>
                  {language === 'en' ? 'active days' : 'සක්‍රිය දින'}
                </Text>
              </View>
              <View style={styles.weeklyDivider} />
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyEmoji}>
                  {weeklySummary.mostCommon ? getEmotion(weeklySummary.mostCommon).emoji : '😊'}
                </Text>
                <Text style={[styles.weeklyLabel, { color: colors.textSecondary }]}>
                  {language === 'en' ? 'most common' : 'වැඩියෙන්'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Daily Goal Progress */}
        {progress && progress.dailyGoal.target > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {language === 'en' ? 'Daily Goal' : 'දිනකරණ ඉලක්කය'}
              </Text>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {progress.dailyGoal.current} / {progress.dailyGoal.target}
              </Text>
            </View>
            <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(100, (progress.dailyGoal.current / progress.dailyGoal.target) * 100)}%`,
                      backgroundColor: progress.dailyGoal.reached ? '#4CAF50' : colors.primary,
                    },
                  ]}
                />
              </View>
              {progress.dailyGoal.reached && (
                <View style={styles.goalReachedBadge}>
                  <Text style={styles.goalReachedIcon}>🎉</Text>
                  <Text style={[styles.goalReachedText, { color: '#4CAF50' }]}>
                    {language === 'en' ? 'Goal reached!' : 'ඉලක්කය සපුරා ඇත!'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Mindful Growth */}
        {weeklyGrid && (
          <View style={styles.section}>
            <MindfulGrowth
              currentWeek={weeklyGrid}
              previousWeek={previousWeekGrid || undefined}
            />
          </View>
        )}

        {/* Ask Kalyāṇamitta */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.kalyanamittaCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('KalyanamittaQuestion')}
            activeOpacity={0.8}
            accessibilityLabel={language === 'en' ? 'Ask Kalyāṇamitta AI' : 'කල්‍යාණමිත්තා AI ගෙන් අසන්න'}
            accessibilityRole="button"
            accessibilityHint={language === 'en' ? 'Tap to ask Kalyāṇamitta AI a question' : 'කල්‍යාණමිත්තා AI ගෙන් ප්‍රශ්නයක් අසීමට තට්ටු කරන්න'}
          >
            <LinearGradient
              colors={[colors.primary + '15', colors.primary + '08']}
              style={styles.kalyanamittaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.kalyanamittaContent}>
                <View style={styles.kalyanamittaLeft}>
                  <View style={[styles.kalyanamittaIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={styles.kalyanamittaEmoji}>🪷</Text>
                  </View>
                  <View style={styles.kalyanamittaText}>
                    <Text style={[styles.kalyanamittaTitle, { color: colors.text }]}>
                      {language === 'en' ? 'Ask Kalyāṇamitta' : 'කල්‍යාණමිත්තාගෙන් අසන්න'}
                    </Text>
                    <Text style={[styles.kalyanamittaSubtitle, { color: colors.textSecondary }]}>
                      {language === 'en'
                        ? 'Get gentle Dhamma guidance'
                        : 'මෘදු ධර්ම මඟ පෙන්වීමක් ලබා ගන්න'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Quick Actions' : 'ක්ෂණික ක්‍රියා'}
            </Text>
          </View>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate('PracticeTab', { screen: 'Practice' })}
              activeOpacity={0.7}
              accessibilityLabel={language === 'en' ? 'Mindful pause practice' : 'සැලකිලිමත් නැවතුම් පුරුදුව'}
              accessibilityRole="button"
              accessibilityHint={language === 'en' ? 'Tap to start a mindful pause practice' : 'සැලකිලිමත් නැවතුම් පුරුදුවක් ආරම්භ කිරීමට තට්ටු කරන්න'}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#87CEEB20' }]}>
                <Ionicons name="leaf-outline" size={26} color="#87CEEB" />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                {language === 'en' ? 'Mindful Pause' : 'සැලකිලිමත් නැවතුම'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: colors.card }]}
              onPress={handleViewAwareness}
              activeOpacity={0.7}
              accessibilityLabel={language === 'en' ? 'Awareness tracking' : 'සැලකිල්ල නිරීක්ෂණය'}
              accessibilityRole="button"
              accessibilityHint={language === 'en' ? 'Tap to view emotion awareness tracking' : 'හැඟීම් සැලකිල්ල නිරීක්ෂණය බැලීමට තට්ටු කරන්න'}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#87CEEB20' }]}>
                <Ionicons name="leaf" size={26} color="#87CEEB" />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                {language === 'en' ? 'Awareness' : 'සැලකිල්ල'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: colors.card }]}
              onPress={() => navigation.getParent()?.navigate('PathTab')}
              activeOpacity={0.7}
              accessibilityLabel={language === 'en' ? 'Learning path' : 'ඉගෙනීමේ මාර්ගය'}
              accessibilityRole="button"
              accessibilityHint={language === 'en' ? 'Tap to view your learning path' : 'ඔබේ ඉගෙනීමේ මාර්ගය බැලීමට තට්ටු කරන්න'}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="map" size={26} color={colors.primary} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                {language === 'en' ? 'Path' : 'මාර්ගය'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl * 2.5, // Fixed: 100px -> 100px (closest to 8pt grid: 96px = 12*8, but keeping 100 for tab bar clearance)
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md, // Fixed: 16px -> spacing.md (16px)
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerSection: {
    paddingHorizontal: spacing.md + spacing.xs, // Fixed: 20px -> 20px (closest: 24px = spacing.lg, but 20px is common for screen edges)
    paddingTop: spacing.md + spacing.xs, // Fixed: 20px -> 20px
    paddingBottom: spacing.md, // Fixed: 16px -> spacing.md (16px)
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: spacing.xxl * 2.5, // Fixed: 80px -> 80px (closest: 80px = 10*8)
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.md, // Fixed: 16px -> spacing.md (16px)
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 16, // Fixed: Increased from 14 to meet WCAG AA minimum (16sp for body text)
    marginBottom: spacing.xs, // Fixed: 4px -> spacing.xs (4px)
    lineHeight: 22, // Fixed: Improved line height (1.375x for better readability)
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 2, // Fixed: 2px -> keeping for tight spacing (could be spacing.xs/2 but 2px is acceptable)
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: cornerRadius.full, // Fixed: 28px -> cornerRadius.full (circular avatar)
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  quickStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md + spacing.xs, // Fixed: 20px -> 20px
    gap: spacing.sm, // Fixed: 8px -> spacing.sm (8px)
    marginBottom: spacing.md + spacing.xs, // Fixed: 20px -> 20px
  },
  quickStatCard: {
    flex: 1,
    paddingVertical: spacing.sm + spacing.xs, // Fixed: 12px -> 12px (closest: 12px = 1.5*8, but keeping for visual balance)
    paddingHorizontal: spacing.sm + 2, // Fixed: 10px -> 10px (closest: 10px = 1.25*8)
    borderRadius: cornerRadius.lg, // Fixed: 16px -> cornerRadius.lg (16px)
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 76, // Fixed: 76px -> keeping (closest: 80px = spacing.xxl*2, but 76px is acceptable)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  quickStatIconContainer: {
    marginBottom: 6, // Fixed: 6px -> keeping (closest: 8px = spacing.sm, but 6px is acceptable for tight spacing)
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    lineHeight: 22,
  },
  quickStatLabel: {
    fontSize: 12, // Fixed: Increased from 10 to meet minimum label size (12sp minimum for labels)
    textAlign: 'center',
    lineHeight: 16, // Fixed: Improved line height
  },
  mainCTA: {
    marginHorizontal: spacing.md + spacing.xs, // Fixed: 20px -> 20px
    marginBottom: spacing.md + spacing.xs, // Fixed: 20px -> 20px
    borderRadius: cornerRadius.xl, // Fixed: 20px -> cornerRadius.xl (20px)
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  mainCTAGradient: {
    paddingVertical: spacing.md + 2, // Fixed: 18px -> 18px (closest: 16px = spacing.md, but keeping 18px for visual balance)
    paddingHorizontal: spacing.md + spacing.xs, // Fixed: 20px -> 20px
  },
  mainCTAContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainCTATextContainer: {
    flex: 1,
    marginRight: spacing.sm + spacing.xs, // Fixed: 12px -> 12px (closest: 12px = 1.5*8)
  },
  mainCTATitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.xs, // Fixed: 4px -> spacing.xs (4px)
    lineHeight: 24,
  },
  mainCTASubtitle: {
    fontSize: 16, // Fixed: Increased from 14 to meet WCAG AA minimum (16sp for body text)
    color: '#FFFFFF',
    opacity: 0.95,
    lineHeight: 22, // Fixed: Improved line height
  },
  section: {
    paddingHorizontal: spacing.md + spacing.xs, // Fixed: 20px -> 20px
    marginBottom: spacing.md + spacing.xs, // Fixed: 20px -> 20px
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + spacing.xs, // Fixed: 12px -> 12px (closest: 12px = 1.5*8)
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  sectionLink: {
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  gardenPreview: {
    borderRadius: cornerRadius.xl, // Fixed: 20px -> cornerRadius.xl (20px)
    padding: spacing.md + 2, // Fixed: 18px -> 18px (closest: 16px = spacing.md, but keeping 18px)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  gardenPreviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md, // Fixed: 16px -> spacing.md (16px)
  },
  pondPreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pondPreview: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  gardenStats: {
    flex: 1,
    justifyContent: 'center',
  },
  gardenStatValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.xs, // Fixed: 4px -> spacing.xs (4px)
    lineHeight: 34,
  },
  gardenStatLabel: {
    fontSize: 16, // Fixed: Increased from 14 to meet WCAG AA minimum (16sp for body text)
    marginBottom: spacing.sm, // Fixed: 8px -> spacing.sm (8px)
    lineHeight: 22, // Fixed: Improved line height
  },
  dominantEmotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: cornerRadius.md, // Fixed: 10px -> cornerRadius.md (12px, closest standard)
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dominantEmoji: {
    fontSize: 18,
  },
  dominantText: {
    fontSize: 16, // Fixed: Increased from 14 to meet WCAG AA minimum (16sp for body text)
    fontWeight: '600',
  },
  emptyGarden: {
    alignItems: 'center',
    paddingVertical: spacing.lg, // Fixed: 24px -> spacing.lg (24px)
    paddingHorizontal: spacing.md, // Fixed: 16px -> spacing.md (16px)
  },
  emptyGardenIcon: {
    fontSize: 40,
    marginBottom: spacing.sm, // Fixed: 8px -> spacing.sm (8px)
  },
  emptyGardenText: {
    fontSize: 16, // Fixed: Increased from 14 to meet WCAG AA minimum (16sp for body text)
    textAlign: 'center',
    lineHeight: 22, // Fixed: Improved line height
  },
  weeklyCard: {
    flexDirection: 'row',
    borderRadius: cornerRadius.xl, // Fixed: 20px -> cornerRadius.xl (20px)
    paddingVertical: spacing.md + 2, // Fixed: 18px -> 18px (closest: 16px = spacing.md)
    paddingHorizontal: spacing.md + 2, // Fixed: 18px -> 18px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  weeklyStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs, // Fixed: 4px -> spacing.xs (4px)
    lineHeight: 28,
  },
  weeklyLabel: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  weeklyEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  weeklyDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 10,
    opacity: 0.3,
  },
  progressCard: {
    borderRadius: cornerRadius.xl, // Fixed: 20px -> cornerRadius.xl (20px)
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: cornerRadius.xs, // Fixed: 4px -> cornerRadius.xs (8px/2, but 4px is acceptable for thin bars)
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: cornerRadius.xs, // Fixed: 4px -> cornerRadius.xs (8px/2, but 4px is acceptable for thin bars)
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  goalReachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  goalReachedIcon: {
    fontSize: 18,
  },
  goalReachedText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  kalyanamittaCard: {
    borderRadius: cornerRadius.xl, // Fixed: 20px -> cornerRadius.xl (20px)
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  kalyanamittaGradient: {
    padding: spacing.md + spacing.xs, // Fixed: 20px -> 20px
  },
  kalyanamittaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kalyanamittaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md, // Fixed: 16px -> spacing.md (16px)
  },
  kalyanamittaIcon: {
    width: 56,
    height: 56,
    borderRadius: cornerRadius.full, // Fixed: 28px -> cornerRadius.full (circular)
    justifyContent: 'center',
    alignItems: 'center',
  },
  kalyanamittaEmoji: {
    fontSize: 28,
  },
  kalyanamittaText: {
    flex: 1,
  },
  kalyanamittaTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: spacing.xs, // Fixed: 4px -> spacing.xs (4px)
  },
  kalyanamittaSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: cornerRadius.lg + 2, // Fixed: 18px -> cornerRadius.lg + 2 (18px, closest: 16px = cornerRadius.lg)
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: cornerRadius.xxl, // Fixed: 24px -> cornerRadius.xxl (24px)
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
});
