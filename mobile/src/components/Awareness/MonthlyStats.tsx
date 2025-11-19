import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { MonthlyGrid, EmotionTile } from '../../services/emotion.service';
import { EmotionType, getEmotion, EMOTIONS } from '../../utils/emotions';
import { calculatePondColor } from '../../utils/colorBlending';

interface MonthlyStatsProps {
  monthlyGrid?: MonthlyGrid;
  onDayPress?: (dayIndex: number, tiles: EmotionTile[]) => void;
}

/**
 * Monthly Statistics View
 * Shows emotion statistics for the current month
 */
const MonthlyStats: React.FC<MonthlyStatsProps> = ({ monthlyGrid, onDayPress }) => {
  const { colors } = useTheme();
  const { language } = useLanguage();

  const monthData = useMemo(() => {
    if (!monthlyGrid) return null;

    // Calculate total statistics
    const totalTiles = monthlyGrid.days.reduce((sum, day) => sum + day.tiles.length, 0);
    
    // Count emotions by type
    const emotionCounts: Record<EmotionType, number> = {} as Record<EmotionType, number>;
    EMOTIONS.forEach((emotion) => {
      emotionCounts[emotion.type] = 0;
    });

    monthlyGrid.days.forEach((day) => {
      day.tiles.forEach((tile) => {
        emotionCounts[tile.emotion] = (emotionCounts[tile.emotion] || 0) + 1;
      });
    });

    // Get top emotions
    const topEmotions = Object.entries(emotionCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => emotionCounts[b[0] as EmotionType] - emotionCounts[a[0] as EmotionType])
      .slice(0, 5)
      .map(([emotion]) => emotion as EmotionType);

    // Calculate average per day
    const daysWithData = monthlyGrid.days.filter((day) => day.tiles.length > 0).length;
    const avgPerDay = daysWithData > 0 ? (totalTiles / daysWithData).toFixed(1) : '0';

    // Get most active day
    const dayCounts = monthlyGrid.days.map((day) => day.tiles.length);
    const maxDayCount = Math.max(...dayCounts);
    const mostActiveDayIndex = dayCounts.indexOf(maxDayCount);
    const mostActiveDay = mostActiveDayIndex >= 0 ? new Date(monthlyGrid.days[mostActiveDayIndex].date) : null;

    // Calculate pond color for the month
    const allTiles = monthlyGrid.days.flatMap((day) => day.tiles);
    const monthPondColor = calculatePondColor(allTiles);

    return {
      totalTiles,
      daysWithData,
      avgPerDay,
      topEmotions,
      emotionCounts,
      mostActiveDay,
      maxDayCount,
      monthPondColor,
    };
  }, [monthlyGrid]);

  if (!monthlyGrid || !monthData || monthData.totalTiles === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {language === 'en'
            ? 'No monthly data available'
            : 'මාසික දත්ත නොමැත'}
        </Text>
      </View>
    );
  }

  const monthStart = new Date(monthlyGrid.monthStart);
  const monthName = language === 'en'
    ? monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : monthStart.toLocaleDateString('si-LK', { month: 'long', year: 'numeric' });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Combined Month Header with Stats */}
      <View style={[styles.monthHeader, { backgroundColor: colors.card }]}>
        <View style={styles.monthHeaderTop}>
          <Text style={[styles.monthTitle, { color: colors.text }]}>{monthName}</Text>
          <View style={[styles.pondColorPreview, { backgroundColor: monthData.monthPondColor }]} />
        </View>
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {monthData.totalTiles}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Total Emotions' : 'සම්පූර්ණ හැඟීම්'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {monthData.daysWithData}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Active Days' : 'සක්‍රිය දින'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {monthData.avgPerDay}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Avg/Day' : 'සාමාන්‍ය/දින'}
            </Text>
          </View>
        </View>
      </View>

      {/* Calendar Grid */}
      <View style={[styles.calendarCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {language === 'en' ? 'Calendar View' : 'දින දර්ශකය'}
        </Text>
        <View style={styles.calendarGrid}>
          {/* Day labels */}
          <View style={styles.weekDayLabels}>
            {language === 'en'
              ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <View key={idx} style={styles.weekDayLabel}>
                    <Text style={[styles.weekDayText, { color: colors.textTertiary }]}>
                      {day}
                    </Text>
                  </View>
                ))
              : ['ඉ', 'ස', 'අ', 'බ', 'බ්', 'සි', 'සෙ'].map((day, idx) => (
                  <View key={idx} style={styles.weekDayLabel}>
                    <Text style={[styles.weekDayText, { color: colors.textTertiary }]}>
                      {day}
                    </Text>
                  </View>
                ))}
          </View>

          {/* Calendar days */}
          <View style={styles.calendarDays}>
            {(() => {
              const monthStart = new Date(monthlyGrid.monthStart);
              const year = monthStart.getFullYear();
              const month = monthStart.getMonth();
              const firstDay = new Date(year, month, 1);
              const lastDay = new Date(year, month + 1, 0);
              const daysInMonth = lastDay.getDate();
              const startingDayOfWeek = firstDay.getDay();

              const days = [];

              // Empty cells for days before month starts
              for (let i = 0; i < startingDayOfWeek; i++) {
                days.push(
                  <View key={`empty-${i}`} style={styles.calendarDay}>
                    <View style={[styles.dayCircle, styles.emptyDayCircle]} />
                  </View>
                );
              }

              // Days of the month
              for (let day = 1; day <= daysInMonth; day++) {
                const dayDate = new Date(year, month, day);
                const dayStr = dayDate.toISOString().split('T')[0];
                const dayData = monthlyGrid.days.find((d) => d.date === dayStr);
                const hasData = dayData && dayData.tiles.length > 0;
                const pondColor = hasData ? calculatePondColor(dayData.tiles) : '#2A2A2A';
                const isToday =
                  dayDate.toDateString() === new Date().toDateString();

                days.push(
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={styles.calendarDay}
                    onPress={() => {
                      if (hasData && onDayPress) {
                        const dayIndex = monthlyGrid.days.findIndex(
                          (d) => d.date === dayStr
                        );
                        onDayPress(dayIndex, dayData.tiles);
                      }
                    }}
                    activeOpacity={hasData ? 0.7 : 1}
                  >
                    <View
                      style={[
                        styles.dayCircle,
                        {
                          backgroundColor: pondColor,
                          borderColor: pondColor,
                          borderWidth: 2,
                          opacity: hasData ? 1 : 0.3,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDayNumber,
                          {
                            color: hasData ? '#FFFFFF' : colors.textSecondary,
                            fontWeight: isToday ? '700' : '600',
                          },
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }

              return days;
            })()}
          </View>
        </View>
      </View>

      {/* Top Emotions */}
      <View style={[styles.topEmotionsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {language === 'en' ? 'Top Emotions' : 'ප්‍රධාන හැඟීම්'}
        </Text>
        <View style={styles.emotionsList}>
          {monthData.topEmotions.map((emotion, index) => {
            const emotionDef = getEmotion(emotion);
            const count = monthData.emotionCounts[emotion];
            const percentage = ((count / monthData.totalTiles) * 100).toFixed(0);

            return (
              <View key={emotion} style={styles.emotionRow}>
                <View style={styles.emotionInfo}>
                  <Text style={styles.emotionEmoji}>{emotionDef.emoji}</Text>
                  <View style={styles.emotionDetails}>
                    <Text style={[styles.emotionName, { color: colors.text }]}>
                      {language === 'en' ? emotionDef.labelEn : emotionDef.labelSi}
                    </Text>
                    <Text style={[styles.emotionCount, { color: colors.textSecondary }]}>
                      {count} {language === 'en' ? 'times' : 'වතාවක්'} ({percentage}%)
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={[emotionDef.color, `${emotionDef.color}DD`]}
                    style={[
                      styles.progressFill,
                      {
                        width: `${percentage}%`,
                      },
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Most Active Day */}
      {monthData.mostActiveDay && (
        <View style={[styles.activeDayCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'en' ? 'Most Active Day' : 'වැඩියෙන් සක්‍රිය දිනය'}
          </Text>
          <Text style={[styles.activeDayText, { color: colors.textSecondary }]}>
            {monthData.mostActiveDay.toLocaleDateString(
              language === 'en' ? 'en-US' : 'si-LK',
              { weekday: 'long', day: 'numeric', month: 'long' }
            )}
          </Text>
          <Text style={[styles.activeDayCount, { color: colors.primary }]}>
            {monthData.maxDayCount} {language === 'en' ? 'emotions' : 'හැඟීම්'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  monthHeader: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  monthHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  pondColorPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  topEmotionsCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  emotionsList: {
    gap: 16,
  },
  emotionRow: {
    marginBottom: 4,
  },
  emotionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  emotionEmoji: {
    fontSize: 24,
  },
  emotionDetails: {
    flex: 1,
  },
  emotionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  emotionCount: {
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  activeDayCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  activeDayText: {
    fontSize: 16,
    marginBottom: 8,
  },
  activeDayCount: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  calendarCard: {
    padding: 16,
    paddingBottom: 12,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  calendarGrid: {
    marginTop: 12,
  },
  weekDayLabels: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDayLabel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  weekDayText: {
    fontSize: 10,
    fontWeight: '600',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  calendarDayNumber: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyDayCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default MonthlyStats;

