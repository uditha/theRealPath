import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { WeeklyGrid, EmotionTile } from '../../services/emotion.service';
import { EmotionType, getEmotion, EMOTIONS } from '../../utils/emotions';
import { weatherTransition } from '../../utils/gardenAnimations';
import { calculatePondColor } from '../../utils/colorBlending';

interface WeatherCardsProps {
  weeklyGrid?: WeeklyGrid;
  onDayPress?: (dayIndex: number, tiles: EmotionTile[]) => void;
}

type WeatherType = 'sunny' | 'rain' | 'lightning' | 'fog' | 'wind' | 'drought';

interface WeatherConfig {
  type: WeatherType;
  icon: string;
  colors: string[];
  emotion: EmotionType;
}

/**
 * Maps dominant emotion to weather type
 */
const getWeatherForEmotion = (emotion: EmotionType): WeatherConfig => {
  switch (emotion) {
    case EmotionType.JOY:
      return {
        type: 'sunny',
        icon: 'sunny',
        colors: ['#FFD700', '#FFA500'],
        emotion,
      };
    case EmotionType.CALM_CLARITY:
      return {
        type: 'sunny',
        icon: 'sunny',
        colors: ['#87CEEB', '#B0E0E6'],
        emotion,
      };
    case EmotionType.SADNESS_GRIEF:
      return {
        type: 'rain',
        icon: 'rainy',
        colors: ['#5B9BD5', '#4A90E2'],
        emotion,
      };
    case EmotionType.ANGER_AVERSION:
      return {
        type: 'lightning',
        icon: 'flash',
        colors: ['#FF6B6B', '#FF4444'],
        emotion,
      };
    case EmotionType.FEAR_CONFUSION:
      return {
        type: 'fog',
        icon: 'cloudy',
        colors: ['#9B59B6', '#8E44AD'],
        emotion,
      };
    case EmotionType.CRAVING:
      return {
        type: 'wind',
        icon: 'leaf',
        colors: ['#FF8C42', '#FF7F50'],
        emotion,
      };
    default:
      return {
        type: 'sunny',
        icon: 'sunny',
        colors: ['#D4E4BC', '#C4D4BC'],
        emotion,
      };
  }
};

/**
 * Weekly Weather Cards View
 * Each day becomes a weather card based on dominant emotion
 * Enhanced with insights and patterns
 */
const WeatherCards: React.FC<WeatherCardsProps> = ({ weeklyGrid, onDayPress }) => {
  const { colors } = useTheme();
  const { language } = useLanguage();

  const { dayData, weeklyInsights } = useMemo(() => {
    if (!weeklyGrid) return { dayData: [], weeklyInsights: null };

    const dayNames = language === 'en'
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['ඉ', 'ස', 'අ', 'බ', 'බ්', 'සි', 'සෙ'];

    const allTiles = weeklyGrid.days.flatMap(day => day.tiles);
    const totalWeeklyEmotions = allTiles.length;
    const daysWithData = weeklyGrid.days.filter(day => day.tiles.length > 0).length;

    // Calculate weekly emotion totals
    const weeklyEmotionCounts: Record<EmotionType, number> = {} as Record<EmotionType, number>;
    EMOTIONS.forEach((emotion) => {
      weeklyEmotionCounts[emotion.type] = 0;
    });
    allTiles.forEach((tile) => {
      weeklyEmotionCounts[tile.emotion] = (weeklyEmotionCounts[tile.emotion] || 0) + 1;
    });

    // Find most common emotion this week
    const mostCommonEmotion = Object.entries(weeklyEmotionCounts).reduce((a, b) =>
      weeklyEmotionCounts[a[0] as EmotionType] > weeklyEmotionCounts[b[0] as EmotionType] ? a : b
    )[0] as EmotionType;

    // Calculate average per day
    const avgPerDay = daysWithData > 0 ? (totalWeeklyEmotions / daysWithData).toFixed(1) : '0';

    // Find most active day
    const dayTotals = weeklyGrid.days.map(day => day.tiles.length);
    const maxDayTotal = Math.max(...dayTotals);
    const mostActiveDayIndex = dayTotals.indexOf(maxDayTotal);

    const dayData = weeklyGrid.days.map((day, index) => {
      const date = new Date(day.date);
      const dayName = dayNames[date.getDay()];

      // Calculate emotion counts
      const emotionCounts: Record<EmotionType, number> = {} as Record<EmotionType, number>;
      EMOTIONS.forEach((emotion) => {
        emotionCounts[emotion.type] = 0;
      });

      day.tiles.forEach((tile) => {
        emotionCounts[tile.emotion] = (emotionCounts[tile.emotion] || 0) + 1;
      });

      const totalCount = day.tiles.length;

      // Find dominant emotion
      const dominantEntry = Object.entries(emotionCounts).reduce((a, b) =>
        emotionCounts[a[0] as EmotionType] > emotionCounts[b[0] as EmotionType] ? a : b
      );
      const dominantEmotion = totalCount > 0 
        ? (dominantEntry[0] as EmotionType)
        : EmotionType.JOY; // Default for empty days

      const weather = getWeatherForEmotion(dominantEmotion);

      // Get all secondary emotions (all emotions except dominant)
      const secondaryEmotions = Object.entries(emotionCounts)
        .filter(([emotion]) => emotion !== dominantEmotion && emotionCounts[emotion as EmotionType] > 0)
        .sort((a, b) => emotionCounts[b[0] as EmotionType] - emotionCounts[a[0] as EmotionType])
        .map(([emotion]) => emotion as EmotionType);

      // Calculate emotion diversity (how many different emotions)
      const uniqueEmotions = Object.values(emotionCounts).filter(count => count > 0).length;

      return {
        dayName,
        date,
        tiles: day.tiles,
        dominantEmotion,
        weather,
        totalCount,
        secondaryEmotions,
        emotionCounts,
        uniqueEmotions,
        isMostActive: index === mostActiveDayIndex && totalCount > 0,
      };
    });

    const weeklyInsights = {
      totalEmotions: totalWeeklyEmotions,
      daysWithData,
      avgPerDay,
      mostCommonEmotion,
      mostActiveDayIndex,
    };

    return { dayData, weeklyInsights };
  }, [weeklyGrid, language]);

  if (!weeklyGrid || weeklyGrid.days.every((day) => day.tiles.length === 0)) {
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Weekly Insights Header */}
      {weeklyInsights && weeklyInsights.totalEmotions > 0 && (
        <View style={[styles.insightsCard, { backgroundColor: colors.card }]}>
          <View style={styles.insightsHeader}>
            <Text style={[styles.insightsTitle, { color: colors.text }]}>
              {language === 'en' ? 'This Week' : 'මෙම සතිය'}
            </Text>
            <View style={[styles.insightsBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.insightsBadgeText, { color: colors.primary }]}>
                {weeklyInsights.totalEmotions} {language === 'en' ? 'emotions' : 'හැඟීම්'}
              </Text>
            </View>
          </View>
          <View style={styles.insightsStats}>
            <View style={styles.insightItem}>
              <Text style={[styles.insightValue, { color: colors.text }]}>
                {weeklyInsights.avgPerDay}
              </Text>
              <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Avg/Day' : 'සාමාන්‍ය/දින'}
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightEmoji}>
                {getEmotion(weeklyInsights.mostCommonEmotion).emoji}
              </Text>
              <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Most Common' : 'වැඩියෙන්'}
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={[styles.insightValue, { color: colors.text }]}>
                {weeklyInsights.daysWithData}
              </Text>
              <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>
                {language === 'en' ? 'Active Days' : 'සක්‍රිය දින'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Day Cards */}
      {dayData.map((day, index) => {
        return (
          <WeatherCard
            key={day.date.toISOString()}
            day={day}
            index={index}
            colors={colors}
            language={language}
            onPress={() => onDayPress?.(index, day.tiles)}
          />
        );
      })}
    </ScrollView>
  );
};

interface WeatherCardProps {
  day: {
    dayName: string;
    date: Date;
    tiles: EmotionTile[];
    dominantEmotion: EmotionType;
    weather: WeatherConfig;
    totalCount: number;
    secondaryEmotions: EmotionType[];
    emotionCounts: Record<EmotionType, number>;
    uniqueEmotions: number;
    isMostActive: boolean;
  };
  index: number;
  colors: any;
  language: 'en' | 'si';
  onPress: () => void;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ day, index, colors, language, onPress }) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    weatherTransition(opacityAnim, scaleAnim, { delay: index * 100 }).start();
  }, []);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.cardWrapper}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
            borderWidth: day.isMostActive ? 2 : 0,
            borderColor: day.isMostActive ? day.weather.colors[0] : 'transparent',
          },
        ]}
        >
        {/* Weather gradient background - only show if there's data */}
        {day.totalCount > 0 && (
          <LinearGradient
            colors={[
              `${day.weather.colors[0]}40`,
              `${day.weather.colors[1] || day.weather.colors[0]}30`,
              `${day.weather.colors[0]}15`,
              'transparent'
            ]}
            style={styles.weatherBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}

        {/* Most Active Badge */}
        {day.isMostActive && (
          <View style={[styles.mostActiveBadge, { backgroundColor: day.weather.colors[0] + '30' }]}>
            <Text style={[styles.mostActiveText, { color: day.weather.colors[0] }]}>
              {language === 'en' ? 'Most Active' : 'වැඩියෙන් සක්‍රිය'}
            </Text>
          </View>
        )}

        {/* Pond color preview - positioned to not conflict with weather icon */}
        {day.totalCount > 0 && (
          <View style={styles.pondPreview}>
            <View
              style={[
                styles.pondColorCircle,
                {
                  backgroundColor: calculatePondColor(day.tiles),
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                },
              ]}
            />
          </View>
        )}

        {/* Card content */}
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.dayInfo}>
              <Text style={[styles.dayName, { color: colors.text }]}>{day.dayName}</Text>
              <Text style={[styles.dayDate, { color: colors.textSecondary }]}>
                {day.date.getDate()}/{day.date.getMonth() + 1}
              </Text>
            </View>

            {/* Right side icons container */}
            {day.totalCount > 0 && (
              <View style={styles.rightIconsContainer}>
                {/* Weather icon */}
                <View style={styles.weatherIconContainer}>
                  <Ionicons
                    name={day.weather.icon as any}
                    size={28}
                    color={day.weather.colors[0]}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Emotion info */}
          {day.totalCount > 0 ? (
            <View style={styles.emotionInfo}>
              <View style={styles.dominantEmotion}>
                <Text style={[styles.emotionLabel, { color: colors.textSecondary }]}>
                  {language === 'en' ? 'Dominant' : 'ප්‍රධාන'}
                </Text>
                <View style={styles.emotionBadge}>
                  <Text style={styles.emotionEmoji}>
                    {getEmotion(day.dominantEmotion).emoji}
                  </Text>
                  <Text style={[styles.emotionName, { color: colors.text }]}>
                    {language === 'en'
                      ? getEmotion(day.dominantEmotion).labelEn
                      : getEmotion(day.dominantEmotion).labelSi}
                  </Text>
                </View>
              </View>

              {/* Secondary emotions */}
              {day.secondaryEmotions.length > 0 && (
                <View style={styles.secondaryEmotions}>
                  {day.secondaryEmotions.map((emotion) => (
                    <View key={emotion} style={styles.secondaryBadge}>
                      <Text style={styles.secondaryEmoji}>
                        {getEmotion(emotion).emoji}
                      </Text>
                      <Text style={[styles.secondaryCount, { color: colors.textSecondary }]}>
                        {day.emotionCounts[emotion]}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Emotion Diversity Indicator */}
              {day.uniqueEmotions > 1 && (
                <View style={styles.diversityBadge}>
                  <Text style={[styles.diversityText, { color: colors.textTertiary }]}>
                    {day.uniqueEmotions} {language === 'en' ? 'types' : 'වර්ග'}
                  </Text>
                </View>
              )}

              {/* Total count */}
              <View style={styles.totalCount}>
                <Text style={[styles.totalCountText, { color: colors.textSecondary }]}>
                  {day.totalCount} {language === 'en' ? 'total' : 'සම්පූර්ණ'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyDayInfo}>
              <Text style={[styles.emptyDayText, { color: colors.textTertiary }]}>
                {language === 'en' ? 'No emotions logged' : 'හැඟීම් නොමැත'}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  insightsCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  insightsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  insightsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  insightsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  insightItem: {
    alignItems: 'center',
    flex: 1,
  },
  insightValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  insightEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  mostActiveBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 3,
  },
  mostActiveText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  weatherBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pondPreview: {
    position: 'absolute',
    top: 12,
    right: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pondColorCircle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardContent: {
    padding: 16,
    minHeight: 120,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingRight: 50, // Make room for pond preview
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  dayDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  rightIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emotionInfo: {
    marginTop: 0,
  },
  dominantEmotion: {
    marginBottom: 12,
  },
  emotionLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emotionEmoji: {
    fontSize: 24,
  },
  emotionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryEmotions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  secondaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  secondaryEmoji: {
    fontSize: 16,
  },
  secondaryCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  diversityBadge: {
    marginTop: 4,
    marginBottom: 8,
  },
  diversityText: {
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  totalCount: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  totalCountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyDayInfo: {
    marginTop: 8,
  },
  emptyDayText: {
    fontSize: 12,
    fontStyle: 'italic',
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
});

export default WeatherCards;

