import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get all cards (metadata for collection screen)
 */
export const getAllCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const cards = await prisma.card.findMany({
      orderBy: [
        { rarity: 'asc' },
        { nameEn: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: cards,
    });
  } catch (error) {
    logger.error('Error fetching cards', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cards',
    });
  }
};

/**
 * Get cards unlocked by current user
 */
export const getUserCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const userCards = await prisma.userCard.findMany({
      where: { userId },
      include: {
        card: true,
      },
      orderBy: { unlockedAt: 'desc' },
    });

    res.json({
      success: true,
      data: userCards.map((uc) => ({
        id: uc.id,
        card: uc.card,
        unlockedAt: uc.unlockedAt,
      })),
    });
  } catch (error) {
    logger.error('Error fetching user cards', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user cards',
    });
  }
};










