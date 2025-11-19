import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { WeeklyGrid } from '../../services/emotion.service';
import { calculateMindfulGrowth, compareWeeklyGrowth } from '../../utils/mindfulGrowthCalculator';

interface MindfulGrowthProps {
  currentWeek: WeeklyGrid;
  previousWeek?: WeeklyGrid;
}

export default function MindfulGrowth({ currentWeek, previousWeek }: MindfulGrowthProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const currentStats = calculateMindfulGrowth(currentWeek);
  const comparison = previousWeek
    ? compareWeeklyGrowth(currentWeek, previousWeek)
    : null;

  if (currentStats.totalEmotions === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>🌤️</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {language === 'en' ? 'Your Mindful Growth' : 'ඔබේ සැලකිලිමත් වර්ධනය'}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {/* Current week stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {currentStats.calmHours}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Calm Hours' : 'සන්සුන් පැය'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {currentStats.mindfulPauses}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Mindful Pauses' : 'සැලකිලිමත් නැවතුම්'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {currentStats.reactiveEpisodes}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Reactive Episodes' : 'ප්‍රතික්‍රියාකාරී සිදුවීම්'}
              </Text>
            </View>
          </View>

          {/* Improvements */}
          {comparison && (
            <View style={styles.improvements}>
              <Text style={[styles.improvementsTitle, { color: colors.text }]}>
                {language === 'en' ? 'This Week' : 'මෙම සතිය'}
              </Text>
              {comparison.improvement.calmIncrease > 0 && (
                <Text style={[styles.improvement, { color: colors.textSecondary }]}>
                  {language === 'en'
                    ? `+${comparison.improvement.calmIncrease} more calm moments`
                    : `+${comparison.improvement.calmIncrease} සන්සුන් මොහොතු වැඩියෙන්`}
                </Text>
              )}
              {comparison.improvement.reactiveDecrease > 0 && (
                <Text style={[styles.improvement, { color: colors.textSecondary }]}>
                  {language === 'en'
                    ? `${comparison.improvement.reactiveDecrease} fewer reactive episodes`
                    : `ප්‍රතික්‍රියාකාරී සිදුවීම් ${comparison.improvement.reactiveDecrease} ක් අඩු`}
                </Text>
              )}
              {comparison.improvement.awarenessIncrease > 0 && (
                <Text style={[styles.improvement, { color: colors.textSecondary }]}>
                  {language === 'en'
                    ? `Awareness increased ${comparison.improvement.awarenessIncrease}%`
                    : `සැලකිල්ල ${comparison.improvement.awarenessIncrease}% කින් වැඩි විය`}
                </Text>
              )}
              {comparison.improvement.awarenessIncrease === 0 &&
                comparison.improvement.calmIncrease === 0 &&
                comparison.improvement.reactiveDecrease === 0 && (
                  <Text style={[styles.improvement, { color: colors.textSecondary }]}>
                    {language === 'en'
                      ? 'Continue observing—awareness grows with practice.'
                      : 'නිරීක්ෂණය දිගටම කරන්න—සැලකිල්ල පුරුදුවෙන් වර්ධනය වේ.'}
                  </Text>
                )}
            </View>
          )}

          {/* Time insights */}
          {(currentStats.mostAwareTime || currentStats.mostReactiveTime) && (
            <View style={styles.insights}>
              {currentStats.mostAwareTime && (
                <Text style={[styles.insight, { color: colors.textSecondary }]}>
                  {language === 'en'
                    ? `Most aware at ${currentStats.mostAwareTime}`
                    : `${currentStats.mostAwareTime} වන විට වැඩියෙන් සැලකිලිමත්`}
                </Text>
              )}
              {currentStats.mostReactiveTime && (
                <Text style={[styles.insight, { color: colors.textSecondary }]}>
                  {language === 'en'
                    ? `Most reactive at ${currentStats.mostReactiveTime}`
                    : `${currentStats.mostReactiveTime} වන විට වැඩියෙන් ප්‍රතික්‍රියාකාරී`}
                </Text>
              )}
            </View>
          )}
        </View>
      )}
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
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    marginTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  improvements: {
    marginBottom: 12,
  },
  improvementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  improvement: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  insights: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  insight: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
  },
});


