import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { DailyGrid, WeeklyGrid, EmotionTile as EmotionTileType } from '../../services/emotion.service';
import { EmotionType, getEmotion, EMOTIONS } from '../../utils/emotions';
import EmotionTile from './EmotionTile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOUR_WIDTH = 50;
const SQUARE_SIZE = 24; // Size of each emotion square (24x24)
const EMOTION_SQUARE_GAP = 8; // Increased gap between squares (was 4)
const ROW_LABEL_WIDTH = 80; // Width for row labels on the left

interface EmotionGridProps {
  mode: 'daily' | 'weekly';
  dailyGrid?: DailyGrid;
  weeklyGrid?: WeeklyGrid;
  onTilePress?: (tile: EmotionTileType) => void;
  highlightEmotion?: EmotionType;
}

const EmotionGrid = React.memo(function EmotionGrid({
  mode,
  dailyGrid,
  weeklyGrid,
  onTilePress,
  highlightEmotion,
}: EmotionGridProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const dailyScrollRef = useRef<ScrollView>(null);

  // Auto-scroll to current hour when daily grid updates
  useEffect(() => {
    if (mode === 'daily' && dailyGrid && dailyScrollRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = currentHour * (HOUR_WIDTH + 8) - SCREEN_WIDTH / 2 + HOUR_WIDTH / 2;
      setTimeout(() => {
        dailyScrollRef.current?.scrollTo({
          x: Math.max(0, scrollPosition),
          animated: true,
        });
      }, 100);
    }
  }, [mode, dailyGrid]);

  const dailyView = React.useMemo(() => {
    if (!dailyGrid) return null;

    // Get first 6 emotions
    const sixEmotions = EMOTIONS.slice(0, 6);
    
    // Create 24-hour grid
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const currentHour = new Date().getHours();

    return (
      <View style={styles.dailyViewContainer}>
        {/* Row labels on the left */}
        <View style={styles.rowLabelsContainer}>
          <View style={styles.rowLabelHeaderPlaceholder} />
          <View style={styles.rowLabelsList}>
            {sixEmotions.map((emotion) => (
              <View key={emotion.type} style={styles.rowLabelWrapper}>
                <View style={styles.rowLabelContent}>
                  <Text style={styles.rowLabelEmoji}>{emotion.emoji}</Text>
                  <Text style={[styles.rowLabelText, { color: colors.text }]}>
                    {language === 'en' ? emotion.labelEn : emotion.labelSi}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Scrollable hours */}
        <ScrollView
          ref={dailyScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dailyScrollContent}
          style={styles.scrollView}
        >
        {hours.map((hour) => {
          const isCurrentHour = hour === currentHour;
          
          // Count taps per emotion for this hour
          const emotionCounts = sixEmotions.map(emotion => {
            const count = dailyGrid.tiles.filter(
              tile => tile.emotion === emotion.type && tile.hour === hour
            ).length;
            return {
              emotion: emotion.type,
              count,
              definition: emotion,
            };
          });

          // Calculate intensity: flat colors, darker for more taps
          const maxCountInHour = Math.max(...emotionCounts.map(e => e.count), 1);

          return (
            <View 
              key={hour} 
              style={[
                styles.hourColumn,
                isCurrentHour && styles.currentHourColumn,
                isCurrentHour && { borderColor: colors.primary },
              ]}
            >
              <View style={styles.hourLabelContainer}>
                <View style={styles.indicatorPlaceholder}>
                  {isCurrentHour && (
                    <View style={[styles.currentHourIndicator, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <Text style={[
                  styles.hourLabel,
                  { 
                    color: isCurrentHour ? colors.primary : colors.textTertiary,
                    fontWeight: isCurrentHour ? '700' : '600',
                  },
                ]}>
                  {hour.toString().padStart(2, '0')}
                </Text>
              </View>
              
              {/* 6 emotion squares stacked vertically */}
              <View style={styles.emotionSquaresContainer}>
                {emotionCounts.map(({ emotion, count, definition }, index) => {
                  const isHighlighted = highlightEmotion === emotion;
                  const hasNoTaps = count === 0;
                  
                  // Flat colors: use base color with opacity for intensity
                  let squareOpacity = 1;
                  if (!hasNoTaps && maxCountInHour > 1) {
                    // More taps = higher opacity (brighter)
                    squareOpacity = 0.6 + (count / maxCountInHour) * 0.4;
                  } else if (hasNoTaps) {
                    squareOpacity = 0.2;
                  }

                  return (
                    <TouchableOpacity
                      key={emotion}
                      style={styles.emotionSquareWrapper}
                      onPress={() => {
                        // Find first tile of this emotion in this hour
                        const tile = dailyGrid.tiles.find(
                          t => t.emotion === emotion && t.hour === hour
                        );
                        if (tile) onTilePress?.(tile);
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.emotionSquare,
                          {
                            backgroundColor: hasNoTaps ? 'transparent' : definition.color,
                            opacity: squareOpacity,
                            borderWidth: hasNoTaps ? 1.5 : (isHighlighted ? 2.5 : 0),
                            borderColor: hasNoTaps 
                              ? definition.color 
                              : (isHighlighted ? colors.primary : 'transparent'),
                            shadowColor: isCurrentHour && !hasNoTaps ? definition.color : 'transparent',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: isCurrentHour && !hasNoTaps ? 0.4 : 0,
                            shadowRadius: 4,
                            elevation: isCurrentHour && !hasNoTaps ? 3 : 0,
                          },
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
        </ScrollView>
      </View>
    );
  }, [dailyGrid, highlightEmotion, colors, onTilePress, language]);

  const weeklyView = React.useMemo(() => {
    if (!weeklyGrid) return null;

    const dayNames = language === 'en'
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['ඉ', 'ස', 'අ', 'බ', 'බ්', 'සි', 'සෙ'];

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.weeklyScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {weeklyGrid.days.map((day, dayIndex) => {
          const date = new Date(day.date);
          const dayName = dayNames[date.getDay()];
          const emotionCounts = day.tiles.reduce((acc, tile) => {
            acc[tile.emotion] = (acc[tile.emotion] || 0) + 1;
            return acc;
          }, {} as Record<EmotionType, number>);

          return (
            <View key={day.date} style={[styles.dayRow, { backgroundColor: colors.surface }]}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayName, { color: colors.text }]}>{dayName}</Text>
                <Text style={[styles.dayDate, { color: colors.textSecondary }]}>
                  {date.getDate()}/{date.getMonth() + 1}
                </Text>
              </View>
              <View style={styles.dayTiles}>
                {day.tiles.length === 0 ? (
                  <Text style={[styles.emptyDayText, { color: colors.textTertiary }]}>
                    {language === 'en' ? 'No emotions noted' : 'හැඟීම් සටහන් නොකළේය'}
                  </Text>
                ) : (
                  Object.entries(emotionCounts).map(([emotion, count]) => (
                    <View key={emotion} style={styles.emotionSummary}>
                      <EmotionTile
                        emotion={emotion as EmotionType}
                        size={24}
                        animated={false}
                      />
                      <Text style={[styles.countText, { color: colors.textSecondary }]}>
                        {count}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  }, [weeklyGrid, colors, language]);

  if (mode === 'daily') {
    if (!dailyGrid) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {language === 'en'
              ? 'Tap an emotion below to start noting'
              : 'සටහන් කිරීම ආරම්භ කිරීමට පහත හැඟීමක් තට්ටු කරන්න'}
          </Text>
        </View>
      );
    }
    return <View style={styles.container}>{dailyView}</View>;
  }

  if (mode === 'weekly') {
    if (!weeklyGrid) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {language === 'en'
              ? 'No weekly data available'
              : 'සතික දත්ත නොමැත'}
          </Text>
        </View>
      );
    }
    return <View style={styles.container}>{weeklyView}</View>;
  }

  return null;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dailyViewContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  rowLabelsContainer: {
    width: ROW_LABEL_WIDTH,
    paddingLeft: 16,
    paddingRight: 8,
    paddingTop: 20,
    paddingBottom: 20,
  },
  rowLabelHeaderPlaceholder: {
    height: 24,
    marginBottom: 8,
  },
  rowLabelsList: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    height: (SQUARE_SIZE + EMOTION_SQUARE_GAP) * 6 - EMOTION_SQUARE_GAP,
  },
  rowLabelWrapper: {
    height: SQUARE_SIZE,
    marginBottom: EMOTION_SQUARE_GAP,
    justifyContent: 'center',
  },
  rowLabelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowLabelEmoji: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
  },
  rowLabelText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  dailyScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  weeklyScrollContent: {
    padding: 16,
  },
  dayColumn: {
    width: HOUR_WIDTH,
    alignItems: 'center',
    marginRight: 8,
  },
  dayLabelContainer: {
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentDayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  hourColumn: {
    width: HOUR_WIDTH,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  currentHourColumn: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 2,
    borderStyle: 'solid',
  },
  hourLabelContainer: {
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  indicatorPlaceholder: {
    width: 4,
    height: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 2,
  },
  hourLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 20,
  },
  currentHourIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  emotionSquaresContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: (SQUARE_SIZE + EMOTION_SQUARE_GAP) * 6 - EMOTION_SQUARE_GAP,
  },
  emotionSquareWrapper: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    marginBottom: EMOTION_SQUARE_GAP,
  },
  emotionSquare: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    borderRadius: 6,
  },
  dayRow: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
  },
  dayDate: {
    fontSize: 12,
  },
  dayTiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
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
  emptyDayText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default EmotionGrid;

