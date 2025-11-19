import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculateLevel, getLevelProgress } from '../utils/levelCalculator';
import { calculateHearts } from '../utils/heartManager';

/**
 * Get current user profile with enhanced data
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        streak: true,
        _count: {
          select: {
            cards: true,
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
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
        languagePreference: user.languagePreference,
        dailyGoalXP: user.dailyGoalXP,
        totalXP: user.totalXP,
        level,
        levelProgress,
        hearts: {
          current: heartStatus.hearts,
          max: user.maxHearts,
          nextRefillAt: heartStatus.nextRefillAt,
        },
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
        stats: {
          cardsCollected: user._count.cards,
          lessonsCompleted: user._count.progress,
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error fetching user profile', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    });
  }
};

/**
 * Update current user profile
 */
export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { languagePreference, dailyGoalXP, name, timezone } = req.body;

    const updateData: any = {};
    
    if (languagePreference !== undefined) {
      if (!['en', 'si'].includes(languagePreference)) {
        res.status(400).json({
          success: false,
          error: 'languagePreference must be "en" or "si"',
        });
        return;
      }
      updateData.languagePreference = languagePreference;
    }

    if (dailyGoalXP !== undefined) {
      if (![10, 20, 30, 50].includes(dailyGoalXP)) {
        res.status(400).json({
          success: false,
          error: 'dailyGoalXP must be 10, 20, 30, or 50',
        });
        return;
      }
      updateData.dailyGoalXP = dailyGoalXP;
    }

    if (name !== undefined) {
      updateData.name = name;
    }

    if (timezone !== undefined) {
      updateData.timezone = timezone;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        error: 'No valid fields to update',
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        languagePreference: true,
        dailyGoalXP: true,
        timezone: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    logger.error('Error updating user profile', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
    });
  }
};

/**
 * Get detailed user stats
 */
export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        streak: true,
        progress: {
          where: { status: 'completed' },
          include: { lesson: true },
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

    // Calculate stats
    const totalLessons = user.progress.length;
    const averageScore = totalLessons > 0
      ? Math.round(user.progress.reduce((sum, p) => sum + p.bestScore, 0) / totalLessons)
      : 0;

    const masteryDistribution = {
      0: user.progress.filter((p) => p.masteryLevel === 0).length,
      1: user.progress.filter((p) => p.masteryLevel === 1).length,
      2: user.progress.filter((p) => p.masteryLevel === 2).length,
      3: user.progress.filter((p) => p.masteryLevel === 3).length,
      4: user.progress.filter((p) => p.masteryLevel === 4).length,
      5: user.progress.filter((p) => p.masteryLevel === 5).length,
    };

    // Get cards with card details
    const userCardsWithDetails = await prisma.userCard.findMany({
      where: { userId },
      include: { card: true },
    });

    const cardsByRarity = {
      common: userCardsWithDetails.filter((uc) => uc.card.rarity === 'common').length,
      rare: userCardsWithDetails.filter((uc) => uc.card.rarity === 'rare').length,
      epic: userCardsWithDetails.filter((uc) => uc.card.rarity === 'epic').length,
      legendary: userCardsWithDetails.filter((uc) => uc.card.rarity === 'legendary').length,
    };

    // Calculate XP history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentProgress = user.progress.filter(
      (p) => p.completedAt && p.completedAt >= thirtyDaysAgo
    );

    const xpHistory = recentProgress.map((p) => ({
      date: p.completedAt!.toISOString().split('T')[0],
      xp: p.lesson.xpReward,
    }));

    res.json({
      success: true,
      data: {
        totalXP: user.totalXP,
        level: calculateLevel(user.totalXP),
        streak: {
          current: user.streak?.currentStreak || 0,
          longest: user.streak?.longestStreak || 0,
        },
        lessons: {
          completed: totalLessons,
          averageScore,
        },
        mastery: {
          distribution: masteryDistribution,
        },
        cards: {
          total: userCardsWithDetails.length,
          byRarity: cardsByRarity,
        },
        xpHistory: xpHistory.slice(-30), // Last 30 days
      },
    });
  } catch (error) {
    logger.error('Error fetching user stats', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user stats',
    });
  }
};

/**
 * Get hearts status
 */
export const getHearts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hearts: true, maxHearts: true, lastHeartRefillAt: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const heartStatus = calculateHearts(
      user.hearts,
      user.maxHearts,
      user.lastHeartRefillAt
    );

    res.json({
      success: true,
      data: {
        hearts: heartStatus.hearts,
        max: user.maxHearts,
        nextRefillAt: heartStatus.nextRefillAt,
        heartsToRefill: heartStatus.heartsToRefill,
      },
    });
  } catch (error) {
    logger.error('Error fetching hearts', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hearts',
    });
  }
};

/**
 * Refill hearts (premium/gems feature)
 */
export const refillHearts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hearts: true, maxHearts: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Refill to max hearts
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        hearts: user.maxHearts,
        lastHeartRefillAt: new Date(),
      },
      select: {
        hearts: true,
        maxHearts: true,
        lastHeartRefillAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        hearts: updatedUser.hearts,
        max: updatedUser.maxHearts,
        message: 'Hearts refilled successfully',
      },
    });
  } catch (error) {
    logger.error('Error refilling hearts', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refill hearts',
    });
  }
};

