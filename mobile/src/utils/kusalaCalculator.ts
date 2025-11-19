import { EmotionType } from '../utils/emotions';
import { EmotionTile } from '../services/emotion.service';

export interface KusalaBalance {
  wholesome: number; // calm_clarity, joy
  unwholesome: number; // anger, craving, fear, sadness
  neutral: number; // Currently not used, but reserved for future
  total: number;
  wholesomePercent: number;
  unwholesomePercent: number;
  neutralPercent: number;
}

/**
 * Calculate Kusala (wholesome) balance from emotion tiles
 * Buddhist concept: wholesome (kusala) vs unwholesome (akusala) states
 */
export function calculateKusalaBalance(tiles: EmotionTile[]): KusalaBalance {
  let wholesome = 0;
  let unwholesome = 0;
  let neutral = 0;

  tiles.forEach(tile => {
    switch (tile.emotion) {
      case EmotionType.CALM_CLARITY:
      case EmotionType.JOY:
        wholesome++;
        break;
      case EmotionType.ANGER_AVERSION:
      case EmotionType.CRAVING:
      case EmotionType.FEAR_CONFUSION:
      case EmotionType.SADNESS_GRIEF:
        unwholesome++;
        break;
      default:
        neutral++;
    }
  });

  const total = tiles.length;
  
  return {
    wholesome,
    unwholesome,
    neutral,
    total,
    wholesomePercent: total > 0 ? Math.round((wholesome / total) * 100) : 0,
    unwholesomePercent: total > 0 ? Math.round((unwholesome / total) * 100) : 0,
    neutralPercent: total > 0 ? Math.round((neutral / total) * 100) : 0,
  };
}

/**
 * Get emotion counts by type
 */
export function getEmotionCounts(tiles: EmotionTile[]): Record<EmotionType, number> {
  const counts: Record<EmotionType, number> = {
    [EmotionType.JOY]: 0,
    [EmotionType.CALM_CLARITY]: 0,
    [EmotionType.CRAVING]: 0,
    [EmotionType.ANGER_AVERSION]: 0,
    [EmotionType.FEAR_CONFUSION]: 0,
    [EmotionType.SADNESS_GRIEF]: 0,
  };

  tiles.forEach(tile => {
    counts[tile.emotion] = (counts[tile.emotion] || 0) + 1;
  });

  return counts;
}

/**
 * Get dominant emotion from tiles
 */
export function getDominantEmotionFromTiles(tiles: EmotionTile[]): EmotionType | null {
  if (tiles.length === 0) return null;
  
  const counts = getEmotionCounts(tiles);
  const dominant = Object.entries(counts).reduce((a, b) =>
    counts[a[0] as EmotionType] > counts[b[0] as EmotionType] ? a : b
  )[0] as EmotionType;

  return dominant;
}

