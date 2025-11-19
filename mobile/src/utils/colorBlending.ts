import { EmotionType, getEmotion, EMOTIONS } from './emotions';
import { EmotionTile } from '../services/emotion.service';

/**
 * Color blending utilities for pond visualization
 * Blends emotion colors based on frequency and intensity
 */

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

/**
 * Convert RGB to hex
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${[r, g, b].map((x) => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
};

/**
 * Blend multiple colors with weights
 * Only blends emotion colors - no brown base color
 */
const blendColors = (colors: Array<{ color: string; weight: number }>): string => {
  if (colors.length === 0) return '#000000'; // Transparent black when empty

  let totalWeight = 0;
  let r = 0;
  let g = 0;
  let b = 0;

  colors.forEach(({ color, weight }) => {
    const rgb = hexToRgb(color);
    totalWeight += weight;
    r += rgb.r * weight;
    g += rgb.g * weight;
    b += rgb.b * weight;
  });

  if (totalWeight === 0) return '#000000';

  r = r / totalWeight;
  g = g / totalWeight;
  b = b / totalWeight;

  return rgbToHex(r, g, b);
};

/**
 * Calculate pond color from emotion tiles
 * Blends all emotions based on their frequency
 * Pure emotion colors only - no brown blending
 */
export const calculatePondColor = (tiles: EmotionTile[]): string => {
  if (tiles.length === 0) {
    return '#000000'; // Transparent black when empty
  }

  // Count emotions
  const emotionCounts: Record<EmotionType, number> = {} as Record<EmotionType, number>;
  EMOTIONS.forEach((emotion) => {
    emotionCounts[emotion.type] = 0;
  });

  tiles.forEach((tile) => {
    // Handle migration of old emotion types
    const emotionType = tile.emotion as EmotionType;
    if (emotionCounts.hasOwnProperty(emotionType)) {
      emotionCounts[emotionType] = (emotionCounts[emotionType] || 0) + 1;
    } else {
      // If emotion type doesn't exist, skip it (it's an old unmigrated type)
      // The migration should happen at the service level
      console.warn(`Unknown emotion type: ${emotionType}`);
    }
  });

  // Create color-weight pairs
  const colorWeights: Array<{ color: string; weight: number }> = [];

  Object.entries(emotionCounts).forEach(([emotion, count]) => {
    if (count > 0) {
      const emotionDef = getEmotion(emotion as EmotionType);
      colorWeights.push({
        color: emotionDef.color,
        weight: count,
      });
    }
  });

  return blendColors(colorWeights);
};

/**
 * Get dominant emotion from tiles
 */
export const getDominantEmotion = (tiles: EmotionTile[]): EmotionType | null => {
  if (tiles.length === 0) return null;

  const emotionCounts: Record<EmotionType, number> = {} as Record<EmotionType, number>;
  EMOTIONS.forEach((emotion) => {
    emotionCounts[emotion.type] = 0;
  });

  tiles.forEach((tile) => {
    // Handle migration of old emotion types
    const emotionType = tile.emotion as EmotionType;
    if (emotionCounts.hasOwnProperty(emotionType)) {
      emotionCounts[emotionType] = (emotionCounts[emotionType] || 0) + 1;
    } else {
      // If emotion type doesn't exist, skip it (it's an old unmigrated type)
      // The migration should happen at the service level
      console.warn(`Unknown emotion type: ${emotionType}`);
    }
  });

  const dominant = Object.entries(emotionCounts).reduce((a, b) =>
    emotionCounts[a[0] as EmotionType] > emotionCounts[b[0] as EmotionType] ? a : b
  );

  return dominant[1] > 0 ? (dominant[0] as EmotionType) : null;
};

/**
 * Calculate color intensity (0-1) based on number of emotions
 */
export const calculateColorIntensity = (tiles: EmotionTile[]): number => {
  if (tiles.length === 0) return 0.3; // Subtle default
  return Math.min(0.3 + (tiles.length * 0.05), 0.9); // Scale from 0.3 to 0.9
};

