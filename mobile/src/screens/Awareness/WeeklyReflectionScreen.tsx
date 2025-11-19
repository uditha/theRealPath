import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { emotionService, WeeklyGrid } from '../../services/emotion.service';
import { EmotionType, EMOTIONS, getEmotionLabel, getEmotion } from '../../utils/emotions';
import EmotionTile from '../../components/Awareness/EmotionTile';
import { generatePoeticInsights, PoeticInsight } from '../../utils/poeticReflection';
import { getEmotionLessons, EmotionLesson } from '../../utils/emotionLessons';

export default function WeeklyReflectionScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [weeklyGrid, setWeeklyGrid] = useState<WeeklyGrid | null>(null);
  const [insights, setInsights] = useState<PoeticInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const weekStart = emotionService.getWeekStart(today);
      const grid = await emotionService.getWeeklyGrid(weekStart);
      setWeeklyGrid(grid);
      generateInsights(grid);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (grid: WeeklyGrid) => {
    // Use poetic reflection generator
    const poeticInsights = generatePoeticInsights(grid, language);
    setInsights(poeticInsights);
  };

  // Get emotion-specific lessons
  const emotionLessons = useMemo(() => {
    if (!weeklyGrid) return [];
    return getEmotionLessons(weeklyGrid, language);
  }, [weeklyGrid, language]);

  const handleExploreLessons = () => {
    navigation.navigate('PathTab');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {language === 'en' ? 'Loading reflection...' : 'පරාවර්තනය පූරණය වෙමින්...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel={language === 'en' ? 'Go back' : 'ආපසු යන්න'}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {language === 'en' ? 'Weekly Reflection' : 'සතික පරාවර්තනය'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            {language === 'en' ? 'This Week' : 'මෙම සතිය'}
          </Text>
          {weeklyGrid && (
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
              {language === 'en'
                ? `${weeklyGrid.days.reduce((sum, day) => sum + day.tiles.length, 0)} emotions noted across ${weeklyGrid.days.filter(d => d.tiles.length > 0).length} days`
                : `${weeklyGrid.days.reduce((sum, day) => sum + day.tiles.length, 0)} හැඟීම් ${weeklyGrid.days.filter(d => d.tiles.length > 0).length} දිනවල සටහන් කරන ලදී`}
            </Text>
          )}
        </View>

        {/* Poetic Insights */}
        {insights.map((insight, index) => {
          const isOpening = insight.type === 'opening';
          const isClosing = insight.type === 'closing';
          const isDominant = insight.type === 'dominant';
          
          return (
            <View
              key={index}
              style={[
                styles.insightCard,
                {
                  backgroundColor: colors.card,
                  marginBottom: isClosing ? 20 : 12,
                },
              ]}
            >
              <View style={styles.insightHeader}>
                {isOpening && <Text style={styles.poeticIcon}>🌱</Text>}
                {isDominant && <Text style={styles.poeticIcon}>🌸</Text>}
                {insight.type === 'pattern' && <Text style={styles.poeticIcon}>🍃</Text>}
                {isClosing && <Text style={styles.poeticIcon}>🪷</Text>}
                {insight.type === 'observation' && <Text style={styles.poeticIcon}>✨</Text>}
                <Text
                  style={[
                    styles.insightText,
                    {
                      color: colors.text,
                      fontStyle: isOpening || isClosing ? 'italic' : 'normal',
                      fontSize: isOpening || isClosing ? 16 : 14,
                      fontWeight: isOpening || isClosing ? '400' : '500',
                    },
                  ]}
                >
                  {language === 'en' ? insight.textEn : insight.textSi}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Emotion-Specific Lessons */}
        {emotionLessons.length > 0 && (
          <View style={styles.lessonsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Lessons from Your Week' : 'ඔබේ සතියෙන් පාඩම්'}
            </Text>
            
            {emotionLessons.map((lesson, index) => {
              const emotionDef = getEmotion(lesson.emotion);
              return (
                <View
                  key={lesson.emotion}
                  style={[
                    styles.lessonCard,
                    {
                      backgroundColor: colors.card,
                      borderLeftWidth: 4,
                      borderLeftColor: emotionDef.color,
                    },
                  ]}
                >
                  <View style={styles.lessonHeader}>
                    <Text style={styles.lessonIcon}>{lesson.icon}</Text>
                    <View style={styles.lessonTitleContainer}>
                      <Text style={[styles.lessonEmotion, { color: colors.text }]}>
                        {language === 'en' ? emotionDef.labelEn : emotionDef.labelSi}
                      </Text>
                      <Text style={[styles.lessonPoetic, { color: colors.textSecondary }]}>
                        {language === 'en' ? lesson.poeticInsight.en : lesson.poeticInsight.si}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.lessonContent}>
                    <Text style={[styles.lessonLabel, { color: colors.textSecondary }]}>
                      {language === 'en' ? 'Mini Lesson' : 'කුඩා පාඩම'}
                    </Text>
                    <Text style={[styles.lessonText, { color: colors.text }]}>
                      {language === 'en' ? lesson.miniLesson.en : lesson.miniLesson.si}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* CTA to Lessons */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleExploreLessons}
          accessibilityLabel={language === 'en' ? 'Explore lessons' : 'පාඩම් ගවේෂණය කරන්න'}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="book" size={20} color="#FFFFFF" />
            <Text style={styles.ctaText}>
              {language === 'en' ? 'Explore Lessons' : 'පාඩම් ගවේෂණය කරන්න'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  insightCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  poeticIcon: {
    fontSize: 20,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lessonsSection: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  lessonCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  lessonIcon: {
    fontSize: 24,
  },
  lessonTitleContainer: {
    flex: 1,
  },
  lessonEmotion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lessonPoetic: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  lessonContent: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  lessonLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  lessonText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
