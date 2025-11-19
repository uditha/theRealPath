import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculateXP } from '../utils/xpCalculator';
import { calculateLevel, getLevelProgress } from '../utils/levelCalculator';
import { calculateStreak, isStreakMilestone } from '../utils/streakManager';
import { calculateHearts, calculateHeartsLost, hasEnoughHearts } from '../utils/heartManager';
import { calculateMasteryLevel, calculateNextReviewDate } from '../utils/masteryCalculator';
import { checkAndUnlockCards } from '../utils/cardUnlocker';

/**
 * Start a lesson (mark as in_progress)
 */
export const startLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id: lessonId } = req.params;

    // OPTIMIZED: Run all queries in parallel
    const [lesson, user, existingProgress] = await Promise.all([
      prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true }, // Only need to check if exists
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { hearts: true, maxHearts: true, lastHeartRefillAt: true },
      }),
      prisma.userProgress.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
        select: { status: true }, // Only need status
      }),
    ]);

    if (!lesson) {
      res.status(404).json({
        success: false,
        error: 'Lesson not found',
      });
      return;
    }

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Regenerate hearts if needed
    const heartStatus = calculateHearts(
      user.hearts,
      user.maxHearts,
      user.lastHeartRefillAt
    );

    if (!hasEnoughHearts(heartStatus.hearts)) {
      res.status(403).json({
        success: false,
        error: 'Not enough hearts to start lesson',
        hearts: heartStatus.hearts,
        nextRefillAt: heartStatus.nextRefillAt,
      });
      return;
    }

    const isAlreadyCompleted = existingProgress?.status === 'completed';

    // Update or create progress
    // If lesson is already completed (for review/legendary), preserve the completed status
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        status: isAlreadyCompleted ? 'completed' : 'in_progress',
        lastAttemptAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        status: 'in_progress',
        lastAttemptAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        progress,
        hearts: heartStatus.hearts,
      },
    });
  } catch (error) {
    logger.error('Error starting lesson', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start lesson',
    });
  }
};

/**
 * Complete a lesson (update progress, award XP, update streak, check cards)
 */
export const completeLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id: lessonId } = req.params;
    const { score, correctCount, totalQuestions, heartsLost = 0, review = false, legendary = false } = req.body;

    if (score === undefined || correctCount === undefined || totalQuestions === undefined) {
      res.status(400).json({
        success: false,
        error: 'score, correctCount, and totalQuestions are required',
      });
      return;
    }

    // Get lesson
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: true },
    });

    if (!lesson) {
      res.status(404).json({
        success: false,
        error: 'Lesson not found',
      });
      return;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { streak: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Get existing progress
    const existingProgress = await prisma.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    const wasCompleted = existingProgress?.status === 'completed';
    const previousBestScore = existingProgress?.bestScore || 0;
    const previousMastery = existingProgress?.masteryLevel || 0;

    // Calculate new mastery level
    // For legendary, require perfect score (100%) to increase mastery
    // For review, mastery can increase normally
    let newMasteryLevel = previousMastery;
    if (legendary) {
      // Legendary: only increase mastery if perfect score
      if (score === 100) {
        newMasteryLevel = Math.min(5, previousMastery + 1); // Cap at 5
      }
    } else {
      // Normal or review: calculate mastery normally
      newMasteryLevel = calculateMasteryLevel(score, previousMastery);
    }

    // Update hearts
    const heartStatus = calculateHearts(
      user.hearts,
      user.maxHearts,
      user.lastHeartRefillAt
    );
    const newHearts = Math.max(0, heartStatus.hearts - heartsLost);
    const lastHeartRefillAt = newHearts < user.maxHearts 
      ? (user.lastHeartRefillAt || new Date())
      : new Date();

    // Calculate XP
    const streakDays = user.streak?.currentStreak || 0;
    let xpEarned = 0;
    let xpBreakdown: any = { baseXP: 0, bonusXP: 0, streakBonus: 0, totalXP: 0 };
    
    if (legendary) {
      // Legendary: +40 XP bonus (even if already completed)
      xpEarned = 40;
      xpBreakdown = { baseXP: 40, bonusXP: 0, streakBonus: 0, totalXP: 40 };
    } else if (review) {
      // Review: +5 XP bonus (even if already completed)
      xpEarned = 5;
      xpBreakdown = { baseXP: 5, bonusXP: 0, streakBonus: 0, totalXP: 5 };
    } else if (!wasCompleted) {
      // First time completion: normal XP calculation
      // Check today's XP to determine if daily goal will be reached
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayProgress = await prisma.userProgress.findMany({
        where: {
          userId,
          completedAt: { gte: todayStart },
          status: 'completed',
          lessonId: { not: lessonId }, // Exclude current lesson to avoid double counting
        },
        include: { lesson: true },
      });
      const todayXP = todayProgress.reduce((sum, p) => sum + p.lesson.xpReward, 0);
      
      // First calculate base XP to check daily goal
      const baseXPCalculation = calculateXP(
        lesson.xpReward,
        score,
        false, // Will recalculate with correct value
        streakDays
      );
      
      // Check if adding this lesson's XP will reach the daily goal
      const isDailyGoalReached = (todayXP + baseXPCalculation.totalXP) >= user.dailyGoalXP;

      // Recalculate XP with correct daily goal status
      const xpCalculation = calculateXP(
        lesson.xpReward,
        score,
        isDailyGoalReached,
        streakDays
      );
      xpEarned = xpCalculation.totalXP;
      xpBreakdown = xpCalculation;
    }
    // If wasCompleted and not review/legendary, xpEarned stays 0

    // Update user XP and hearts
    const newTotalXP = user.totalXP + xpEarned;
    const newLevel = calculateLevel(newTotalXP);

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalXP: newTotalXP,
        hearts: newHearts,
        lastHeartRefillAt,
      },
    });

    // Update streak
    const streakInfo = calculateStreak(
      user.streak?.lastActiveDate || null,
      user.streak?.currentStreak || 0,
      user.timezone || 'UTC'
    );

    if (streakInfo.shouldIncrement) {
      await prisma.streak.upsert({
        where: { userId },
        update: {
          currentStreak: streakInfo.currentStreak,
          longestStreak: Math.max(
            user.streak?.longestStreak || 0,
            streakInfo.currentStreak
          ),
          lastActiveDate: streakInfo.lastActiveDate,
        },
        create: {
          userId,
          currentStreak: streakInfo.currentStreak,
          longestStreak: streakInfo.currentStreak,
          lastActiveDate: streakInfo.lastActiveDate,
        },
      });
    }

    // Update progress
    const now = new Date();
    const nextReviewAt = calculateNextReviewDate(
      newMasteryLevel,
      existingProgress?.lastAttemptAt || null
    );

    const updatedProgress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        status: 'completed',
        bestScore: Math.max(previousBestScore, score),
        masteryLevel: newMasteryLevel,
        lastAttemptAt: now,
        completedAt: wasCompleted ? existingProgress?.completedAt : now,
        nextReviewAt,
      },
      create: {
        userId,
        lessonId,
        status: 'completed',
        bestScore: score,
        masteryLevel: newMasteryLevel,
        lastAttemptAt: now,
        completedAt: now,
        nextReviewAt,
      },
    });

    // Check for card unlocks
    const unlockedCards = await checkAndUnlockCards(userId, {
      lessonId,
      chapterId: lesson.chapterId,
      score,
      streakDays: streakInfo.currentStreak,
      totalXP: newTotalXP,
      level: newLevel,
    });

    // Get updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { streak: true },
    });

    const levelProgress = getLevelProgress(newTotalXP);

    res.json({
      success: true,
      data: {
        progress: updatedProgress,
        xpEarned: xpEarned,
        xpBreakdown: xpBreakdown,
        totalXP: newTotalXP,
        level: newLevel,
        levelProgress,
        hearts: newHearts,
        streak: {
          current: streakInfo.currentStreak,
          longest: updatedUser?.streak?.longestStreak || 0,
          milestone: isStreakMilestone(streakInfo.currentStreak),
        },
        masteryLevel: newMasteryLevel,
        unlockedCards,
      },
    });
  } catch (error) {
    logger.error('Error completing lesson', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete lesson',
    });
  }
};

/**
 * Practice a lesson (no hearts lost, no mastery change)
 */
export const practiceLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id: lessonId } = req.params;
    const { score, correctCount, totalQuestions } = req.body;

    // Similar to completeLesson but without updating hearts, mastery, or XP
    // Just track the practice attempt
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        lastAttemptAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        status: 'in_progress',
        lastAttemptAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        progress,
        message: 'Practice completed (no XP or hearts affected)',
      },
    });
  } catch (error) {
    logger.error('Error practicing lesson', error);
    res.status(500).json({
      success: false,
      error: 'Failed to practice lesson',
    });
  }
};

/**
 * Get progress summary (XP, streak, level, daily goal, hearts)
 */
export const getProgressSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        streak: true,
        _count: {
          select: {
            progress: {
              where: { status: 'completed' },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Calculate hearts
    const heartStatus = calculateHearts(
      user.hearts,
      user.maxHearts,
      user.lastHeartRefillAt
    );

    // Calculate level
    const level = calculateLevel(user.totalXP);
    const levelProgress = getLevelProgress(user.totalXP);

    // Calculate daily progress
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayProgress = await prisma.userProgress.findMany({
      where: {
        userId,
        completedAt: { gte: todayStart },
        status: 'completed',
      },
      include: { lesson: true },
    });
    const todayXP = todayProgress.reduce((sum, p) => sum + p.lesson.xpReward, 0);

    res.json({
      success: true,
      data: {
        totalXP: user.totalXP,
        level,
        levelProgress,
        streak: {
          current: user.streak?.currentStreak || 0,
          longest: user.streak?.longestStreak || 0,
          lastActiveDate: user.streak?.lastActiveDate,
        },
        dailyGoal: {
          target: user.dailyGoalXP,
          current: todayXP,
          progress: Math.min(100, Math.round((todayXP / user.dailyGoalXP) * 100)),
          reached: todayXP >= user.dailyGoalXP,
        },
        hearts: {
          current: heartStatus.hearts,
          max: user.maxHearts,
          nextRefillAt: heartStatus.nextRefillAt,
        },
        completedLessons: user._count.progress,
      },
    });
  } catch (error) {
    logger.error('Error fetching progress summary', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress summary',
    });
  }
};

/**
 * Get all user progress records
 */
export const getUserProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const progress = await prisma.userProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            chapter: {
              include: {
                world: {
                  select: {
                    id: true,
                    nameEn: true,
                    nameSi: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    logger.error('Error fetching user progress', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user progress',
    });
  }
};

/**
 * Get review queue (lessons needing review for spaced repetition)
 */
export const getReviewQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const now = new Date();

    const reviewQueue = await prisma.userProgress.findMany({
      where: {
        userId,
        OR: [
          { nextReviewAt: { lte: now } },
          { masteryLevel: { lt: 5 } },
        ],
        status: 'completed',
      },
      include: {
        lesson: {
          select: {
            id: true,
            slug: true,
            titleEn: true,
            titleSi: true,
            xpReward: true,
            chapter: {
              select: {
                id: true,
                nameEn: true,
                nameSi: true,
              },
            },
          },
        },
      },
      orderBy: { nextReviewAt: 'asc' },
    });

    res.json({
      success: true,
      data: reviewQueue,
    });
  } catch (error) {
    logger.error('Error fetching review queue', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch review queue',
    });
  }
};

/**
 * Get today's progress
 */
export const getDailyProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dailyGoalXP: true, timezone: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Get today's start in user timezone
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayProgress = await prisma.userProgress.findMany({
      where: {
        userId,
        completedAt: { gte: todayStart },
        status: 'completed',
      },
      include: {
        lesson: {
          select: {
            id: true,
            titleEn: true,
            titleSi: true,
            xpReward: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    const todayXP = todayProgress.reduce((sum, p) => sum + p.lesson.xpReward, 0);

    res.json({
      success: true,
      data: {
        target: user.dailyGoalXP,
        current: todayXP,
        progress: Math.min(100, Math.round((todayXP / user.dailyGoalXP) * 100)),
        reached: todayXP >= user.dailyGoalXP,
        lessons: todayProgress,
      },
    });
  } catch (error) {
    logger.error('Error fetching daily progress', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily progress',
    });
  }
};

