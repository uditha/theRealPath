import { DailyGrid, WeeklyGrid, EmotionTile } from '../services/emotion.service';
import { EmotionType, getEmotion } from '../utils/emotions';
import { calculateKusalaBalance, getEmotionCounts } from './kusalaCalculator';

export interface MindfulGrowthStats {
  calmHours: number;
  mindfulPauses: number; // Count of calm_clarity emotions
  reactiveEpisodes: number; // Count of unwholesome emotions
  totalEmotions: number;
  awarenessImprovement?: number; // Percentage improvement vs previous week
  mostReactiveTime?: string; // Hour of day with most reactive emotions
  mostAwareTime?: string; // Hour of day with most calm emotions
}

export interface WeeklyComparison {
  currentWeek: MindfulGrowthStats;
  previousWeek?: MindfulGrowthStats;
  improvement: {
    calmIncrease: number;
    reactiveDecrease: number;
    awarenessIncrease: number;
  };
}

/**
 * Calculate mindful growth stats from weekly grid
 */
export function calculateMindfulGrowth(weeklyGrid: WeeklyGrid): MindfulGrowthStats {
  const allTiles = weeklyGrid.days.flatMap(day => day.tiles);
  const balance = calculateKusalaBalance(allTiles);
  const emotionCounts = getEmotionCounts(allTiles);

  // Count calm hours (hours with calm_clarity)
  const calmHours = new Set<number>();
  allTiles.forEach(tile => {
    if (tile.emotion === EmotionType.CALM_CLARITY) {
      calmHours.add(tile.hour);
    }
  });

  // Find most reactive time (hour with most unwholesome emotions)
  const hourReactivity: Record<number, number> = {};
  allTiles.forEach(tile => {
    if (
      tile.emotion === EmotionType.ANGER_AVERSION ||
      tile.emotion === EmotionType.CRAVING ||
      tile.emotion === EmotionType.FEAR_CONFUSION ||
      tile.emotion === EmotionType.SADNESS_GRIEF
    ) {
      hourReactivity[tile.hour] = (hourReactivity[tile.hour] || 0) + 1;
    }
  });

  const mostReactiveHour = Object.entries(hourReactivity).reduce(
    (a, b) => (a[1] > b[1] ? a : b),
    ['0', 0]
  )[0];

  // Find most aware time (hour with most calm_clarity)
  const hourCalmness: Record<number, number> = {};
  allTiles.forEach(tile => {
    if (tile.emotion === EmotionType.CALM_CLARITY) {
      hourCalmness[tile.hour] = (hourCalmness[tile.hour] || 0) + 1;
    }
  });

  const mostAwareHour = Object.entries(hourCalmness).reduce(
    (a, b) => (a[1] > b[1] ? a : b),
    ['0', 0]
  )[0];

  return {
    calmHours: calmHours.size,
    mindfulPauses: emotionCounts[EmotionType.CALM_CLARITY],
    reactiveEpisodes: balance.unwholesome,
    totalEmotions: allTiles.length,
    mostReactiveTime: mostReactiveHour ? formatHour(parseInt(mostReactiveHour)) : undefined,
    mostAwareTime: mostAwareHour ? formatHour(parseInt(mostAwareHour)) : undefined,
  };
}

/**
 * Compare current week with previous week
 */
export function compareWeeklyGrowth(
  currentWeek: WeeklyGrid,
  previousWeek?: WeeklyGrid
): WeeklyComparison {
  const currentStats = calculateMindfulGrowth(currentWeek);
  const previousStats = previousWeek ? calculateMindfulGrowth(previousWeek) : undefined;

  const calmIncrease = previousStats
    ? currentStats.calmHours - previousStats.calmHours
    : 0;

  const reactiveDecrease = previousStats
    ? previousStats.reactiveEpisodes - currentStats.reactiveEpisodes
    : 0;

  const awarenessIncrease = previousStats && previousStats.totalEmotions > 0
    ? Math.round(
        ((currentStats.mindfulPauses / currentStats.totalEmotions) -
          (previousStats.mindfulPauses / previousStats.totalEmotions)) *
          100
      )
    : 0;

  return {
    currentWeek: currentStats,
    previousWeek: previousStats,
    improvement: {
      calmIncrease,
      reactiveDecrease,
      awarenessIncrease,
    },
  };
}

/**
 * Get insights from daily grid
 */
export function getDailyInsights(dailyGrid: DailyGrid): {
  mostReactiveHour?: string;
  dominantEmotion?: EmotionType;
  totalObserved: number;
} {
  const tiles = dailyGrid.tiles;
  if (tiles.length === 0) {
    return { totalObserved: 0 };
  }

  const emotionCounts = getEmotionCounts(tiles);
  const dominantEmotion = Object.entries(emotionCounts).reduce((a, b) =>
    emotionCounts[a[0] as EmotionType] > emotionCounts[b[0] as EmotionType] ? a : b
  )[0] as EmotionType;

  // Find most reactive hour
  const hourReactivity: Record<number, number> = {};
  tiles.forEach(tile => {
    if (
      tile.emotion === EmotionType.ANGER_AVERSION ||
      tile.emotion === EmotionType.CRAVING ||
      tile.emotion === EmotionType.FEAR_CONFUSION ||
      tile.emotion === EmotionType.SADNESS_GRIEF
    ) {
      hourReactivity[tile.hour] = (hourReactivity[tile.hour] || 0) + 1;
    }
  });

  const mostReactiveHour = Object.entries(hourReactivity).reduce(
    (a, b) => (a[1] > b[1] ? a : b),
    ['0', 0]
  )[0];

  return {
    mostReactiveHour: mostReactiveHour ? formatHour(parseInt(mostReactiveHour)) : undefined,
    dominantEmotion,
    totalObserved: tiles.length,
  };
}

/**
 * Format hour to readable time
 */
function formatHour(hour: number): string {
  if (hour === 0) return 'midnight';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return 'noon';
  return `${hour - 12}pm`;
}

