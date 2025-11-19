import { PixelRatio } from 'react-native';

/**
 * Utility functions for handling Dynamic Type / Font Scaling
 * Ensures text scales properly with user's system font size preferences
 */

/**
 * Get scaled font size based on user's system font scale preference
 * @param baseSize - Base font size in points (e.g., 16)
 * @returns Scaled font size that respects user's accessibility settings
 */
export const getScaledFontSize = (baseSize: number): number => {
  const fontScale = PixelRatio.getFontScale();
  return Math.round(baseSize * fontScale);
};

/**
 * Get scaled font size but cap it at a maximum to prevent UI breaking
 * @param baseSize - Base font size in points
 * @param maxScale - Maximum scale multiplier (default: 1.3)
 * @returns Scaled font size capped at maximum
 */
export const getScaledFontSizeCapped = (
  baseSize: number,
  maxScale: number = 1.3
): number => {
  const fontScale = PixelRatio.getFontScale();
  const cappedScale = Math.min(fontScale, maxScale);
  return Math.round(baseSize * cappedScale);
};

/**
 * Standard font sizes that respect Dynamic Type
 * Use these constants instead of hardcoded font sizes
 */
export const FontSizes = {
  // Body text - minimum 16sp for accessibility
  body: getScaledFontSize(16),
  bodySmall: getScaledFontSize(14),
  bodyLarge: getScaledFontSize(18),
  
  // Labels - minimum 12sp
  label: getScaledFontSize(12),
  labelSmall: getScaledFontSize(10),
  
  // Headings
  h1: getScaledFontSize(32),
  h2: getScaledFontSize(24),
  h3: getScaledFontSize(20),
  h4: getScaledFontSize(18),
  
  // Special
  caption: getScaledFontSize(12),
  overline: getScaledFontSize(10),
};

/**
 * Helper to create text style with proper font scaling
 * @param baseSize - Base font size
 * @param options - Additional style options
 */
export const createScaledTextStyle = (
  baseSize: number,
  options: {
    fontWeight?: '400' | '500' | '600' | '700';
    lineHeight?: number;
    maxScale?: number;
  } = {}
) => {
  const { fontWeight = '400', lineHeight, maxScale } = options;
  const fontSize = maxScale
    ? getScaledFontSizeCapped(baseSize, maxScale)
    : getScaledFontSize(baseSize);
  
  return {
    fontSize,
    fontWeight,
    lineHeight: lineHeight
      ? (maxScale
          ? getScaledFontSizeCapped(lineHeight, maxScale)
          : getScaledFontSize(lineHeight))
      : undefined,
  };
};


