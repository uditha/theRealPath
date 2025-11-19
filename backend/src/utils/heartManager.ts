/**
 * Heart management utilities (Duolingo-style lives system)
 */

const HEART_REFILL_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours per heart
const MAX_HEARTS = 5;

/**
 * Calculate hearts regeneration
 * @param currentHearts Current number of hearts
 * @param maxHearts Maximum hearts (default 5)
 * @param lastRefillAt Last heart refill timestamp
 * @returns Updated hearts count and next refill time
 */
export function calculateHearts(
  currentHearts: number,
  maxHearts: number = MAX_HEARTS,
  lastRefillAt: Date | null
): {
  hearts: number;
  nextRefillAt: Date | null;
  heartsToRefill: number;
} {
  if (currentHearts >= maxHearts) {
    return {
      hearts: maxHearts,
      nextRefillAt: null,
      heartsToRefill: 0,
    };
  }

  if (!lastRefillAt) {
    // First time, set refill time to now
    return {
      hearts: currentHearts,
      nextRefillAt: new Date(Date.now() + HEART_REFILL_INTERVAL_MS),
      heartsToRefill: 0,
    };
  }

  const now = new Date();
  const timeSinceLastRefill = now.getTime() - lastRefillAt.getTime();
  const heartsToRefill = Math.floor(timeSinceLastRefill / HEART_REFILL_INTERVAL_MS);
  
  if (heartsToRefill === 0) {
    // No hearts to refill yet
    const timeUntilNextRefill = HEART_REFILL_INTERVAL_MS - (timeSinceLastRefill % HEART_REFILL_INTERVAL_MS);
    return {
      hearts: currentHearts,
      nextRefillAt: new Date(now.getTime() + timeUntilNextRefill),
      heartsToRefill: 0,
    };
  }

  // Hearts to refill
  const newHearts = Math.min(currentHearts + heartsToRefill, maxHearts);
  const remainingTime = timeSinceLastRefill % HEART_REFILL_INTERVAL_MS;
  const nextRefillAt = newHearts >= maxHearts 
    ? null 
    : new Date(now.getTime() + (HEART_REFILL_INTERVAL_MS - remainingTime));

  return {
    hearts: newHearts,
    nextRefillAt,
    heartsToRefill: newHearts - currentHearts,
  };
}

/**
 * Check if user has enough hearts to start a lesson
 */
export function hasEnoughHearts(hearts: number, requiredHearts: number = 1): boolean {
  return hearts >= requiredHearts;
}

/**
 * Calculate hearts lost from quiz
 * @param incorrectAnswers Number of incorrect answers
 * @param maxHeartsToLose Maximum hearts to lose per quiz (default 5)
 * @returns Hearts lost
 */
export function calculateHeartsLost(incorrectAnswers: number, maxHeartsToLose: number = 5): number {
  return Math.min(incorrectAnswers, maxHeartsToLose);
}










