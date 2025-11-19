/**
 * Mastery level and spaced repetition utilities (Duolingo-style)
 */

const MASTERY_LEVELS = 5; // 0-5 mastery levels
const MASTERY_DECAY_DAYS = [1, 3, 7, 14, 30]; // Days before mastery decays

/**
 * Calculate mastery level from score
 * @param score Score percentage (0-100)
 * @param previousMastery Previous mastery level (0-5)
 * @returns New mastery level
 */
export function calculateMasteryLevel(score: number, previousMastery: number = 0): number {
  if (score === 100) {
    // Perfect score - increase mastery
    return Math.min(Math.floor(previousMastery) + 1, MASTERY_LEVELS);
  } else if (score >= 80) {
    // Good score - maintain or slightly increase
    const currentLevel = Math.floor(previousMastery);
    if (currentLevel < MASTERY_LEVELS) {
      return currentLevel + 1; // Increase to next level
    }
    return currentLevel; // Already at max
  } else if (score >= 60) {
    // Passing score - maintain
    return Math.floor(previousMastery);
  } else {
    // Poor score - decrease mastery
    return Math.max(0, Math.floor(previousMastery) - 1);
  }
}

/**
 * Calculate next review date based on mastery level
 * @param masteryLevel Current mastery level (0-5)
 * @param lastReviewDate Last review date
 * @returns Next review date
 */
export function calculateNextReviewDate(masteryLevel: number, lastReviewDate: Date | null): Date {
  const now = new Date();
  
  if (!lastReviewDate) {
    // First time - review in 1 day
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + MASTERY_DECAY_DAYS[0]);
    return nextDate;
  }

  // Calculate based on mastery level
  const daysIndex = Math.min(masteryLevel, MASTERY_DECAY_DAYS.length - 1);
  const daysToAdd = MASTERY_DECAY_DAYS[daysIndex];
  
  const nextDate = new Date(lastReviewDate);
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  
  // Ensure next review is not in the past
  if (nextDate < now) {
    return now;
  }
  
  return nextDate;
}

/**
 * Check if lesson needs review (spaced repetition)
 * @param nextReviewAt Next review date
 * @param masteryLevel Current mastery level
 * @returns Whether lesson needs review
 */
export function needsReview(nextReviewAt: Date | null, masteryLevel: number): boolean {
  if (!nextReviewAt) {
    return masteryLevel < MASTERY_LEVELS; // Not mastered yet
  }
  
  const now = new Date();
  return nextReviewAt <= now || masteryLevel < MASTERY_LEVELS;
}

/**
 * Calculate mastery decay (for lessons not reviewed)
 * @param masteryLevel Current mastery level
 * @param daysSinceLastReview Days since last review
 * @returns Decayed mastery level
 */
export function calculateMasteryDecay(masteryLevel: number, daysSinceLastReview: number): number {
  if (masteryLevel === 0) return 0;
  
  // Decay by 1 level for each decay period missed
  let decayedLevel = masteryLevel;
  for (let i = masteryLevel - 1; i >= 0; i--) {
    if (daysSinceLastReview > MASTERY_DECAY_DAYS[i]) {
      decayedLevel = i;
      break;
    }
  }
  
  return Math.max(0, decayedLevel);
}

