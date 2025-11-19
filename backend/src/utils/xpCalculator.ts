/**
 * XP Calculation utilities (Duolingo-style)
 */

export interface XPCalculationResult {
  baseXP: number;
  bonuses: {
    perfectBonus: number;
    dailyGoalBonus: number;
    streakBonus: number;
  };
  totalXP: number;
}

/**
 * Calculate XP earned from a lesson
 * @param baseXP Base XP from lesson.xpReward
 * @param score Score percentage (0-100)
 * @param isDailyGoalReached Whether user reached daily goal today
 * @param streakDays Current streak in days
 * @returns XP calculation result
 */
export function calculateXP(
  baseXP: number,
  score: number,
  isDailyGoalReached: boolean = false,
  streakDays: number = 0
): XPCalculationResult {
  const bonuses = {
    perfectBonus: 0,
    dailyGoalBonus: 0,
    streakBonus: 0,
  };

  // Perfect lesson bonus (+5 XP for 100% score)
  if (score === 100) {
    bonuses.perfectBonus = 5;
  }

  // Daily goal bonus (+5 XP when daily goal reached)
  if (isDailyGoalReached) {
    bonuses.dailyGoalBonus = 5;
  }

  // Streak bonus (+2 XP per 7-day milestone)
  if (streakDays > 0 && streakDays % 7 === 0) {
    bonuses.streakBonus = 2;
  }

  const totalXP = baseXP + bonuses.perfectBonus + bonuses.dailyGoalBonus + bonuses.streakBonus;

  return {
    baseXP,
    bonuses,
    totalXP,
  };
}

/**
 * Calculate total XP for multiple lessons
 */
export function calculateTotalXP(calculations: XPCalculationResult[]): number {
  return calculations.reduce((sum, calc) => sum + calc.totalXP, 0);
}










