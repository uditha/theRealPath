/**
 * Fixed: Standardized Corner Radius System
 * Consistent border radius values for visual harmony
 * 
 * Usage:
 * import { cornerRadius } from '../utils/cornerRadius';
 * 
 * borderRadius: cornerRadius.sm,   // 8px - Small components (badges, small buttons)
 * borderRadius: cornerRadius.md,   // 12px - Medium components (cards, inputs)
 * borderRadius: cornerRadius.lg,  // 16px - Large components (cards, modals)
 * borderRadius: cornerRadius.xl,  // 20px - Extra large components (sections, large cards)
 * borderRadius: cornerRadius.xxl, // 24px - Maximum radius (full cards, screens)
 */

export const cornerRadius = {
  // Extra Small - 4px - Thin progress bars, small elements
  xs: 4,
  
  // Small - 8px - Badges, small buttons, chips
  sm: 8,
  
  // Medium - 12px - Standard cards, inputs, buttons
  md: 12,
  
  // Large - 16px - Large cards, modals, containers
  lg: 16,
  
  // Extra Large - 20px - Section cards, prominent containers
  xl: 20,
  
  // Extra Extra Large - 24px - Maximum radius for full cards
  xxl: 24,
  
  // Extra Extra Extra Large - 28px - Special cases (rarely used)
  xxxl: 28,
  
  // Full circle - 50% (for circular avatars, icons)
  full: 9999,
} as const;

/**
 * Helper function to get corner radius value
 * Useful for dynamic radius calculations
 */
export const getCornerRadius = (size: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl'): number => {
  return cornerRadius[size];
};

/**
 * Common corner radius combinations
 */
export const cornerRadiusHelpers = {
  // Button radius
  button: cornerRadius.md, // 12px
  
  // Card radius
  card: cornerRadius.lg, // 16px
  
  // Large card radius
  cardLarge: cornerRadius.xl, // 20px
  
  // Input radius
  input: cornerRadius.md, // 12px
  
  // Badge radius
  badge: cornerRadius.sm, // 8px
  
  // Modal radius
  modal: cornerRadius.xl, // 20px
  
  // Avatar radius (circular)
  avatar: cornerRadius.full, // 9999 (circular)
} as const;

