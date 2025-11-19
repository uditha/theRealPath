/**
 * Level calculation utilities (Duolingo-style exponential growth)
 */

// Level thresholds (exponential curve like Duolingo)
// Level 1: 0 XP, Level 2: 100 XP, Level 3: 250 XP, Level 4: 500 XP, etc.
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  1000,   // Level 5
  2000,   // Level 6
  3500,   // Level 7
  5500,   // Level 8
  8000,   // Level 9
  12000,  // Level 10
  17000,  // Level 11
  25000,  // Level 12
  35000,  // Level 13
  50000,  // Level 14
  70000,  // Level 15
];

/**
 * Calculate level from total XP
 * @param totalXP User's total XP
 * @returns Current level (1-based)
 */
export function calculateLevel(totalXP: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get XP required for next level
 * @param currentLevel Current level (1-based)
 * @returns XP required for next level, or null if max level
 */
export function getXPForNextLevel(currentLevel: number): number | null {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return null; // Max level
  }
  return LEVEL_THRESHOLDS[currentLevel];
}

/**
 * Get XP progress toward next level
 * @param totalXP User's total XP
 * @returns Object with current level, XP progress, and XP needed for next level
 */
export function getLevelProgress(totalXP: number): {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number | null;
  progressPercentage: number;
} {
  const currentLevel = calculateLevel(totalXP);
  const xpForCurrentLevel = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const xpForNextLevel = getXPForNextLevel(currentLevel);
  
  const xpInCurrentLevel = totalXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel ? xpForNextLevel - xpForCurrentLevel : 0;
  const progressPercentage = xpForNextLevel 
    ? Math.min(100, Math.round((xpInCurrentLevel / xpNeeded) * 100))
    : 100;

  return {
    currentLevel,
    xpInCurrentLevel,
    xpForNextLevel,
    progressPercentage,
  };
}

/**
 * Get level name (for display)
 */
export function getLevelName(level: number): string {
  if (level <= 5) return `Beginner ${level}`;
  if (level <= 10) return `Intermediate ${level - 5}`;
  if (level <= 15) return `Advanced ${level - 10}`;
  return `Master ${level - 15}`;
}










