import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Submit reflection for a lesson
 */
export const submitReflection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id: lessonId } = req.params;
    const { answerText, selectedOptionEn, selectedOptionSi } = req.body;

    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      res.status(404).json({
        success: false,
        error: 'Lesson not found',
      });
      return;
    }

    // Create or update reflection
    const reflection = await prisma.reflection.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        answerText: answerText || null,
        selectedOptionEn: selectedOptionEn || null,
        selectedOptionSi: selectedOptionSi || null,
      },
      create: {
        userId,
        lessonId,
        answerText: answerText || null,
        selectedOptionEn: selectedOptionEn || null,
        selectedOptionSi: selectedOptionSi || null,
      },
    });

    res.json({
      success: true,
      data: reflection,
      message: 'Reflection submitted successfully',
    });
  } catch (error) {
    logger.error('Error submitting reflection', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit reflection',
    });
  }
};










