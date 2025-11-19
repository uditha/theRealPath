import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Star, BookOpen, Flame, Flower2, User, Waves, Clock } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { contentService } from '../../services/content.service';
import { emotionService, DailyGrid, WeeklyGrid } from '../../services/emotion.service';
import { logger } from '../../utils/logger';
import DailyWisdom from '../../components/Home/DailyWisdom';
import MonkCircle from '../../components/Home/MonkCircle';
import { getWisdomQuoteForDate } from '../../utils/wisdomQuotes';
import { calculateMindfulGrowth } from '../../utils/mindfulGrowthCalculator';

export default function ProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language, t } = useLanguage();
  const { user, logout } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dailyGrid, setDailyGrid] = useState<DailyGrid | null>(null);
  const [weeklyGrid, setWeeklyGrid] = useState<WeeklyGrid | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfile();
  }, []);

  // Refresh profile when screen is focused (e.g., after completing a lesson)
  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadProfile();
      }
    }, [loading])
  );

  const loadProfile = async () => {
    try {
      const today = new Date();
      const [progressData, dailyData, weeklyData] = await Promise.all([
        contentService.getProgressSummary(),
        emotionService.getDailyGrid(today),
        emotionService.getWeeklyGrid(emotionService.getWeekStart(today)),
      ]);
      setProgress(progressData);
      setDailyGrid(dailyData);
      setWeeklyGrid(weeklyData);
    } catch (error) {
      logger.error('Error loading profile', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate mindful growth stats
  const mindfulStats = useMemo(() => {
    if (!weeklyGrid) return null;
    return calculateMindfulGrowth(weeklyGrid);
  }, [weeklyGrid]);

  // Get journey reflection quote
  const journeyQuote = useMemo(() => {
    const quote = getWisdomQuoteForDate();
    return language === 'en' ? quote.en : quote.si;
  }, [language]);

  // Fade in animation
  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

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
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerTop}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primaryLight }]}>
            <User size={40} color={colors.primary} strokeWidth={2} />
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('PracticeTab', { screen: 'Practice' })}
            activeOpacity={0.8}
            style={styles.monkCircleContainer}
          >
            <MonkCircle size={60} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>
          {user?.name || (language === 'en' ? 'Practitioner' : 'පුරුදුකරු')}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
          {user?.email}
        </Text>
        <View style={styles.wisdomContainer}>
          <DailyWisdom style={{ color: colors.textSecondary }} />
        </View>
      </Animated.View>

      {/* Journey Reflection */}
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <View style={[styles.journeyCard, { backgroundColor: colors.card }]}>
          <View style={styles.journeyIconContainer}>
            <Flower2 size={32} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.journeyTitle, { color: colors.text }]}>
            {language === 'en' ? 'Your Journey' : 'ඔබේ ගමන'}
          </Text>
          <Text style={[styles.journeyQuote, { color: colors.textSecondary }]}>
            {journeyQuote}
          </Text>
        </View>
      </Animated.View>

      {/* Stats Grid */}
      {progress && (
        <Animated.View style={[styles.statsGrid, { opacity: fadeAnim }]}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={styles.statIconContainer}>
              <Star size={24} color={colors.primary} strokeWidth={2} fill={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {progress.totalXP}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Total XP' : 'සම්පූර්ණ XP'}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={styles.statIconContainer}>
              <BookOpen size={24} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {progress.level}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Level' : 'මට්ටම'}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={styles.statIconContainer}>
              <Flame size={24} color={colors.primary} strokeWidth={2} fill={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {progress.streak.current}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('streak')}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={styles.statIconContainer}>
              <Flower2 size={24} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {progress.completedLessons}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Lessons' : 'පාඩම්'}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Practice Insights */}
      {mindfulStats && mindfulStats.totalEmotions > 0 && (
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'en' ? 'Practice Insights' : 'පුරුදු අවබෝධයන්'}
          </Text>
          <View style={[styles.insightsCard, { backgroundColor: colors.card }]}>
            <View style={styles.insightRow}>
              <View style={[styles.insightIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Flower2 size={20} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.insightContent}>
                <Text style={[styles.insightValue, { color: colors.text }]}>
                  {mindfulStats.mindfulPauses}
                </Text>
                <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>
                  {language === 'en' ? 'Mindful Pauses' : 'සැලකිලිමත් නැවතුම්'}
                </Text>
              </View>
            </View>
            <View style={styles.insightRow}>
              <View style={[styles.insightIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Waves size={20} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.insightContent}>
                <Text style={[styles.insightValue, { color: colors.text }]}>
                  {mindfulStats.calmHours}
                </Text>
                <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>
                  {language === 'en' ? 'Calm Hours' : 'සන්සුන් පැය'}
                </Text>
              </View>
            </View>
            {mindfulStats.mostAwareTime && (
              <View style={styles.insightRow}>
                <View style={[styles.insightIconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <Clock size={20} color={colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={[styles.insightValue, { color: colors.text }]}>
                    {mindfulStats.mostAwareTime}
                  </Text>
                  <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>
                    {language === 'en' ? 'Most Aware Time' : 'වැඩියෙන් සැලකිලිමත් වේලාව'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      )}

      {/* Streak Info */}
      {progress && (
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('streak')}
          </Text>
          <View style={[styles.streakCard, { backgroundColor: colors.card }]}>
            <View style={styles.streakIconContainer}>
              <Flame size={32} color={colors.primary} strokeWidth={2} fill={colors.primary} />
            </View>
            <View style={styles.streakInfo}>
              <Text style={[styles.streakCurrent, { color: colors.text }]}>
                {progress.streak.current} {language === 'en' ? 'days' : 'දින'}
              </Text>
              <Text style={[styles.streakLongest, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Longest' : 'දිගම'}: {progress.streak.longest} {language === 'en' ? 'days' : 'දින'}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Quick Actions */}
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {language === 'en' ? 'Quick Actions' : 'ක්ෂණික ක්‍රියා'}
        </Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('PracticeTab', { screen: 'Practice' })}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="leaf-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Mindful Pause' : 'සැලකිලිමත් නැවතුම'}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Take a moment to breathe' : 'හුස්ම ගැනීමට මොහොතක් ගන්න'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="settings-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Settings' : 'සැකසීම්'}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Preferences and options' : 'අභිමතාර්ථ සහ විකල්ප'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>
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
    backgroundColor: colors.background,
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
  contentContainer: {
    padding: 20,
    paddingBottom: 100, // Extra padding for bottom tab bar
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyIconContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  streakIconContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monkCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  wisdomContainer: {
    marginTop: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  journeyCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  journeyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  journeyQuote: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  insightsCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  insightLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  streakCard: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  streakInfo: {
    flex: 1,
  },
  streakCurrent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  streakLongest: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  linkCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  linkIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  linkSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  linkArrow: {
    fontSize: 24,
    color: colors.primary,
  },
  settingsButton: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingsIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  settingsText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  settingsArrow: {
    fontSize: 24,
    color: colors.primary,
  },
});

