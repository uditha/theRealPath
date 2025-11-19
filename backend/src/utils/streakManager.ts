/**
 * Streak management utilities (Duolingo-style)
 */

/**
 * Check if date is today in user's timezone
 */
export function isToday(date: Date, timezone: string = 'UTC'): boolean {
  const now = new Date();
  const userDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const userNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  
  return (
    userDate.getFullYear() === userNow.getFullYear() &&
    userDate.getMonth() === userNow.getMonth() &&
    userDate.getDate() === userNow.getDate()
  );
}

/**
 * Check if date is yesterday in user's timezone
 */
export function isYesterday(date: Date, timezone: string = 'UTC'): boolean {
  const now = new Date();
  const userDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const userNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  
  const yesterday = new Date(userNow);
  yesterday.setDate(yesterday.getDate() - 1);
  
  return (
    userDate.getFullYear() === yesterday.getFullYear() &&
    userDate.getMonth() === yesterday.getMonth() &&
    userDate.getDate() === yesterday.getDate()
  );
}

/**
 * Calculate streak status
 * @param lastActiveDate Last active date (or null)
 * @param currentStreak Current streak count
 * @param timezone User's timezone
 * @returns Updated streak info
 */
export function calculateStreak(
  lastActiveDate: Date | null,
  currentStreak: number,
  timezone: string = 'UTC'
): {
  currentStreak: number;
  shouldIncrement: boolean;
  shouldReset: boolean;
  lastActiveDate: Date;
} {
  const now = new Date();
  
  // No previous activity
  if (!lastActiveDate) {
    return {
      currentStreak: 1,
      shouldIncrement: true,
      shouldReset: false,
      lastActiveDate: now,
    };
  }

  // Activity today - maintain streak
  if (isToday(lastActiveDate, timezone)) {
    return {
      currentStreak,
      shouldIncrement: false,
      shouldReset: false,
      lastActiveDate,
    };
  }

  // Activity yesterday - increment streak
  if (isYesterday(lastActiveDate, timezone)) {
    return {
      currentStreak: currentStreak + 1,
      shouldIncrement: true,
      shouldReset: false,
      lastActiveDate: now,
    };
  }

  // Activity was more than 1 day ago - reset streak
  return {
    currentStreak: 1,
    shouldIncrement: true,
    shouldReset: true,
    lastActiveDate: now,
  };
}

/**
 * Check if streak milestone reached
 */
export function isStreakMilestone(streakDays: number): boolean {
  return streakDays === 7 || streakDays === 30 || streakDays === 100 || streakDays === 365;
}

/**
 * Get streak milestone name
 */
export function getStreakMilestoneName(streakDays: number): string | null {
  if (streakDays === 7) return 'Week Warrior';
  if (streakDays === 30) return 'Monthly Master';
  if (streakDays === 100) return 'Century Champion';
  if (streakDays === 365) return 'Year Legend';
  return null;
}










