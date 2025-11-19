import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { DailyGrid, WeeklyGrid } from '../../services/emotion.service';
import { getDailyInsights, compareWeeklyGrowth } from '../../utils/mindfulGrowthCalculator';
import { EmotionType } from '../../utils/emotions';
import { getEmotion } from '../../utils/emotions';

interface ReflectionsSectionProps {
  dailyGrid: DailyGrid;
  weeklyGrid?: WeeklyGrid;
  previousWeekGrid?: WeeklyGrid;
}

export default function ReflectionsSection({
  dailyGrid,
  weeklyGrid,
  previousWeekGrid,
}: ReflectionsSectionProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  const dailyInsights = getDailyInsights(dailyGrid);
  const weeklyComparison = weeklyGrid && previousWeekGrid
    ? compareWeeklyGrowth(weeklyGrid, previousWeekGrid)
    : null;

  const insights: string[] = [];

  // Daily insights
  if (dailyInsights.mostReactiveHour) {
    insights.push(
      language === 'en'
        ? `You were most reactive at ${dailyInsights.mostReactiveHour}.`
        : `ඔබ ${dailyInsights.mostReactiveHour} වන විට වැඩියෙන් ප්‍රතික්‍රියාකාරී විය.`
    );
  }

  if (dailyInsights.dominantEmotion) {
    const emotion = getEmotion(dailyInsights.dominantEmotion);
    if (dailyInsights.dominantEmotion === EmotionType.ANGER_AVERSION) {
      insights.push(
        language === 'en'
          ? 'You observed anger instead of acting on it—beautiful progress.'
          : 'ඔබ ක්‍රියා කිරීම වෙනුවට කෝපය නිරීක්ෂණය කළේය—සුන්දර ප්‍රගතියකි.'
      );
    } else {
      insights.push(
        language === 'en'
          ? `You noticed ${emotion.labelEn.toLowerCase()} most today—well done for seeing it.`
          : `ඔබ අද ${emotion.labelSi.toLowerCase()} වැඩියෙන් දුටුවේය—එය දැකීමට හොඳයි.`
      );
    }
  }

  // Weekly insights
  if (weeklyComparison) {
    if (weeklyComparison.improvement.awarenessIncrease > 0) {
      insights.push(
        language === 'en'
          ? `Your awareness increased ${weeklyComparison.improvement.awarenessIncrease}% this week.`
          : `ඔබේ සැලකිල්ල මෙම සතියේ ${weeklyComparison.improvement.awarenessIncrease}% කින් වැඩි විය.`
      );
    }

    if (weeklyComparison.improvement.calmIncrease > 0) {
      insights.push(
        language === 'en'
          ? `You had ${weeklyComparison.improvement.calmIncrease} more calm moments this week.`
          : `ඔබට මෙම සතියේ සන්සුන් මොහොතු ${weeklyComparison.improvement.calmIncrease} ක් වැඩියෙන් තිබුණි.`
      );
    }

    if (weeklyComparison.improvement.reactiveDecrease > 0) {
      insights.push(
        language === 'en'
          ? `You observed ${weeklyComparison.improvement.reactiveDecrease} fewer reactive episodes this week.`
          : `ඔබ මෙම සතියේ ප්‍රතික්‍රියාකාරී සිදුවීම් ${weeklyComparison.improvement.reactiveDecrease} ක් අඩුවෙන් නිරීක්ෂණය කළේය.`
      );
    }
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>📿</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {language === 'en' ? 'Reflections' : 'පරාවර්තන'}
        </Text>
      </View>
      {insights.map((insight, index) => (
        <Text
          key={index}
          style={[styles.insight, { color: colors.textSecondary }]}
        >
          {insight}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  insight: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});


