/**
 * Fixed: 8pt Grid System for consistent spacing
 * All spacing values are multiples of 8px for visual consistency
 * 
 * Usage:
 * import { spacing } from '../utils/spacing';
 * 
 * padding: spacing.xs,    // 4px
 * margin: spacing.sm,    // 8px
 * gap: spacing.md,       // 16px
 * padding: spacing.lg,     // 24px
 * margin: spacing.xl,      // 32px
 * padding: spacing.xxl,   // 40px
 */

export const spacing = {
  // Extra small - 4px (0.5 * 8)
  xs: 4,
  
  // Small - 8px (1 * 8) - Base unit
  sm: 8,
  
  // Medium - 16px (2 * 8) - Most common spacing
  md: 16,
  
  // Large - 24px (3 * 8) - Section spacing
  lg: 24,
  
  // Extra large - 32px (4 * 8) - Major section spacing
  xl: 32,
  
  // Extra extra large - 40px (5 * 8) - Screen edge spacing
  xxl: 40,
  
  // Extra extra extra large - 48px (6 * 8) - Large section spacing
  xxxl: 48,
  
  // Extra extra extra extra large - 64px (8 * 8) - Maximum spacing
  xxxxl: 64,
} as const;

/**
 * Helper function to get spacing value
 * Useful for dynamic spacing calculations
 */
export const getSpacing = (multiplier: number): number => {
  return multiplier * 8;
};

/**
 * Common spacing combinations
 */
export const spacingHelpers = {
  // Card padding
  cardPadding: spacing.md, // 16px
  
  // Screen padding
  screenPadding: spacing.md, // 16px
  
  // Section spacing
  sectionSpacing: spacing.lg, // 24px
  
  // Component gap
  componentGap: spacing.sm, // 8px
  
  // List item spacing
  listItemSpacing: spacing.md, // 16px
  
  // Button padding
  buttonPadding: {
    vertical: spacing.sm, // 8px
    horizontal: spacing.md, // 16px
  },
  
  // Input padding
  inputPadding: {
    vertical: spacing.sm, // 8px
    horizontal: spacing.md, // 16px
  },
} as const;


