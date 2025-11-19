/**
 * Card unlock condition checking utilities
 */

import prisma from '../config/database';
import { logger } from './logger';

export interface UnlockCondition {
  type: string;
  [key: string]: any;
}

/**
 * Check if a card unlock condition is met
 * @param condition Unlock condition JSON
 * @param userId User ID
 * @param context Additional context (lessonId, chapterId, score, etc.)
 * @returns Whether condition is met
 */
export async function checkUnlockCondition(
  condition: UnlockCondition,
  userId: string,
  context: {
    lessonId?: string;
    chapterId?: string;
    score?: number;
    streakDays?: number;
    totalXP?: number;
    level?: number;
    consecutiveDailyGoals?: number;
  }
): Promise<boolean> {
  try {
    switch (condition.type) {
      case 'first_lesson':
        // Check if user has completed any lesson
        const firstLessonProgress = await prisma.userProgress.findFirst({
          where: {
            userId,
            status: 'completed',
          },
        });
        return !!firstLessonProgress;

      case 'chapter_complete':
        const chapterIdToCheck = context.chapterId || condition.chapterId;
        if (!chapterIdToCheck) return false;
        // Check if all lessons in chapter are completed
        const chapter = await prisma.chapter.findUnique({
          where: { id: chapterIdToCheck },
          include: {
            lessons: {
              where: { isActive: true },
            },
          },
        });
        if (!chapter) return false;

        const completedLessons = await prisma.userProgress.count({
          where: {
            userId,
            lessonId: { in: chapter.lessons.map((l) => l.id) },
            status: 'completed',
          },
        });
        return completedLessons === chapter.lessons.length;

      case 'perfect_quiz':
        // Check if current lesson has perfect score, or check if user has any perfect score
        if (context.lessonId && context.score === 100) {
          return true;
        }
        // Fallback: check if user has any perfect score
        const perfectProgress = await prisma.userProgress.findFirst({
          where: {
            userId,
            bestScore: 100,
            status: 'completed',
          },
        });
        return !!perfectProgress;

      case 'streak':
        const days = condition.days || 7;
        return (context.streakDays || 0) >= days;

      case 'xp_threshold':
        const xp = condition.xp || 1000;
        return (context.totalXP || 0) >= xp;

      case 'level_up':
        const level = condition.level || 5;
        return (context.level || 0) >= level;

      case 'daily_goal':
        const consecutiveDays = condition.consecutiveDays || 7;
        return (context.consecutiveDailyGoals || 0) >= consecutiveDays;

      case 'lesson_count':
        const count = condition.count || 10;
        const lessonCount = await prisma.userProgress.count({
          where: {
            userId,
            status: 'completed',
          },
        });
        return lessonCount >= count;

      default:
        logger.warn('Unknown unlock condition type', { type: condition.type });
        return false;
    }
  } catch (error) {
    logger.error('Error checking unlock condition', error);
    return false;
  }
}

/**
 * Check and unlock cards for a user
 * @param userId User ID
 * @param context Context for condition checking
 * @returns Array of unlocked card IDs
 */
export async function checkAndUnlockCards(
  userId: string,
  context: {
    lessonId?: string;
    chapterId?: string;
    score?: number;
    streakDays?: number;
    totalXP?: number;
    level?: number;
    consecutiveDailyGoals?: number;
  }
): Promise<string[]> {
  try {
    // Get all cards user doesn't have yet
    const userCards = await prisma.userCard.findMany({
      where: { userId },
      select: { cardId: true },
    });
    const ownedCardIds = new Set(userCards.map((uc) => uc.cardId));

    // Get all cards
    const allCards = await prisma.card.findMany();

    const unlockedCardIds: string[] = [];

    for (const card of allCards) {
      // Skip if already owned
      if (ownedCardIds.has(card.id)) continue;

      // Check unlock condition
      const condition = card.unlockCondition as UnlockCondition;
      const shouldUnlock = await checkUnlockCondition(condition, userId, context);

      if (shouldUnlock) {
        // Unlock card
        await prisma.userCard.create({
          data: {
            userId,
            cardId: card.id,
          },
        });
        unlockedCardIds.push(card.id);
        logger.info('Card unlocked', { userId, cardId: card.id, cardName: card.nameEn });
      }
    }

    return unlockedCardIds;
  } catch (error) {
    logger.error('Error checking and unlocking cards', error);
    return [];
  }
}

