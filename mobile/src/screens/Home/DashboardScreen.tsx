import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { contentService, World, ProgressSummary } from '../../services/content.service';
import { logger } from '../../utils/logger';

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  xpText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  streakIcon: {
    fontSize: 16,
  },
  streakText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  mainActionContainer: {
    padding: 20,
  },
  continueButton: {
    backgroundColor: colors.button,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: colors.button,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.buttonText,
    marginBottom: 8,
  },
  continueButtonArrow: {
    fontSize: 24,
    color: colors.buttonText,
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  progressCards: {
    flexDirection: 'row',
    gap: 12,
  },
  progressCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  progressCardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dailyGoalCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dailyGoalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  shortcutsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  worldCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  worldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  worldName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  chapterCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default function DashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const { language, t } = useLanguage();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [worldsData, progressData] = await Promise.all([
        contentService.getWorlds(),
        contentService.getProgressSummary(),
      ]);
      setWorlds(worldsData);
      setProgress(progressData);
    } catch (error) {
      logger.error('Error loading dashboard data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from quiz)
  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadData();
      }
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>🧘</Text>
          </View>
          <View>
            <Text style={styles.greeting}>{t('welcome')},</Text>
            <Text style={styles.userName}>{user?.name || 'Learner'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.xpText}>{progress?.totalXP || 0} XP</Text>
          {progress && progress.streak.current > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakText}>{progress.streak.current}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Continue Today's Journey Button */}
      <View style={styles.mainActionContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            // Navigate to next incomplete lesson
            if (worlds.length > 0) {
              navigation.navigate('World', { worldId: worlds[0].id });
            }
          }}
        >
          <Text style={styles.continueButtonText}>{t('continueJourney')}</Text>
          <Text style={styles.continueButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Progress */}
      {progress && (
        <View style={styles.progressSection}>
          <Text style={styles.progressSectionTitle}>{t('todayProgress')}</Text>
          <View style={styles.progressCards}>
            <View style={styles.progressCard}>
              <Text style={styles.progressCardValue}>{progress.completedLessons}</Text>
              <Text style={styles.progressCardLabel}>{t('lessonsDone')}</Text>
            </View>
            <View style={styles.progressCard}>
              <Text style={styles.progressCardValue}>{progress.dailyGoal.current}</Text>
              <Text style={styles.progressCardLabel}>{t('xpEarned')}</Text>
            </View>
            <View style={styles.progressCard}>
              <Text style={styles.progressCardValue}>{progress.streak.current}</Text>
              <Text style={styles.progressCardLabel}>{t('streak')}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Daily Goal */}
      {progress && (
        <View style={styles.dailyGoalCard}>
          <Text style={styles.dailyGoalTitle}>
            {language === 'en' ? 'Daily Goal' : 'දෛනික ඉලක්කය'}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress.dailyGoal.progress}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {progress.dailyGoal.current} / {progress.dailyGoal.target} XP
          </Text>
        </View>
      )}

      {/* Secondary Shortcuts */}
      <View style={styles.shortcutsSection}>
        {/* Shortcuts removed - now using bottom tabs */}
      </View>

      {/* Worlds */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {language === 'en' ? 'Learning Paths' : 'ඉගෙනීමේ මාර්ග'}
        </Text>
        {worlds.map((world) => (
          <TouchableOpacity
            key={world.id}
            style={styles.worldCard}
            onPress={() => navigation.navigate('World', { worldId: world.id })}
          >
            <View style={styles.worldHeader}>
              <Text style={styles.worldName}>
                {language === 'en' ? world.nameEn : world.nameSi}
              </Text>
            </View>
            <Text style={styles.chapterCount}>
              {world.chapters.length} {language === 'en' 
                ? (world.chapters.length === 1 ? 'Chapter' : 'Chapters')
                : 'පරිච්ඡේද'}
            </Text>
          </TouchableOpacity>
        ))}
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for bottom tab bar
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  xpText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  streakIcon: {
    fontSize: 16,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  mainActionContainer: {
    padding: 20,
  },
  continueButton: {
    backgroundColor: colors.button,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.button,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.buttonText,
  },
  continueButtonArrow: {
    fontSize: 24,
    color: colors.buttonText,
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  progressCards: {
    flexDirection: 'row',
    gap: 12,
  },
  progressCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  progressCardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dailyGoalCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dailyGoalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  shortcutsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  shortcutIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  worldCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  worldHeader: {
    marginBottom: 8,
  },
  worldName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  chapterCount: {
    fontSize: 14,
    color: colors.primary,
  },
});

