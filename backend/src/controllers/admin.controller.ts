import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculateLevel } from '../utils/levelCalculator';

// ==================== WORLDS ====================

export const getWorlds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const worlds = await prisma.world.findMany({
      include: {
        chapters: {
          include: {
            _count: {
              select: { lessons: true },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    // Format response
    const formattedWorlds = worlds.map((world) => ({
      id: world.id,
      nameEn: world.nameEn,
      nameSi: world.nameSi,
      orderIndex: world.orderIndex,
      themeKey: world.themeKey,
      backgroundImageUrl: world.backgroundImageUrl,
      isActive: world.isActive,
      chapters: world.chapters.map((chapter) => ({
        id: chapter.id,
        nameEn: chapter.nameEn,
        nameSi: chapter.nameSi,
        orderIndex: chapter.orderIndex,
        lessonCount: chapter._count.lessons,
      })),
    }));

    res.json({
      success: true,
      data: formattedWorlds,
    });
  } catch (error) {
    logger.error('Error fetching worlds', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch worlds',
    });
  }
};

export const createWorld = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nameEn, nameSi, orderIndex, themeKey, backgroundImageUrl } = req.body;

    const world = await prisma.world.create({
      data: {
        nameEn,
        nameSi,
        orderIndex: orderIndex || 0,
        themeKey: themeKey || 'default',
        backgroundImageUrl: backgroundImageUrl && backgroundImageUrl.trim() !== '' 
          ? backgroundImageUrl.trim() 
          : null,
        isActive: true,
      },
    });

    res.json({
      success: true,
      data: world,
    });
  } catch (error) {
    logger.error('Error creating world', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create world',
    });
  }
};

export const updateWorld = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nameEn, nameSi, orderIndex, themeKey, backgroundImageUrl, isActive } = req.body;

    const updateData: any = {
      nameEn,
      nameSi,
      orderIndex,
      themeKey,
      isActive,
    };

    // Handle backgroundImageUrl - convert empty string to null
    if (backgroundImageUrl !== undefined) {
      updateData.backgroundImageUrl = backgroundImageUrl && backgroundImageUrl.trim() !== '' 
        ? backgroundImageUrl.trim() 
        : null;
    }

    const world = await prisma.world.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: world,
    });
  } catch (error) {
    logger.error('Error updating world', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update world',
    });
  }
};

export const deleteWorld = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.world.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'World deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting world', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete world',
    });
  }
};

// ==================== CHAPTERS ====================

export const createChapter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { worldId, nameEn, nameSi, orderIndex } = req.body;

    const chapter = await prisma.chapter.create({
      data: {
        worldId,
        nameEn,
        nameSi,
        orderIndex: orderIndex || 0,
      },
    });

    res.json({
      success: true,
      data: chapter,
    });
  } catch (error) {
    logger.error('Error creating chapter', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create chapter',
    });
  }
};

export const updateChapter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nameEn, nameSi, orderIndex, worldId } = req.body;

    const chapter = await prisma.chapter.update({
      where: { id },
      data: {
        nameEn,
        nameSi,
        orderIndex,
        worldId,
      },
    });

    res.json({
      success: true,
      data: chapter,
    });
  } catch (error) {
    logger.error('Error updating chapter', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update chapter',
    });
  }
};

export const deleteChapter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.chapter.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Chapter deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting chapter', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete chapter',
    });
  }
};

// ==================== LESSONS ====================

export const createLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      chapterId,
      titleEn,
      titleSi,
      orderIndex,
      xpReward,
      slides,
      questions,
      reflectionQuestions,
    } = req.body;

    const lesson = await prisma.lesson.create({
      data: {
        chapterId,
        titleEn,
        titleSi,
        orderIndex: orderIndex || 0,
        xpReward: xpReward || 10,
        isActive: true,
        slides: {
          create: slides?.map((slide: any, index: number) => {
            // Handle imageUrl - convert empty string to null, preserve valid URLs
            const imageUrl = slide.image || slide.imageUrl;
            const finalImageUrl = (imageUrl && imageUrl.trim() !== '') ? imageUrl.trim() : null;
            
            return {
              orderIndex: slide.orderIndex ?? index + 1,
              type: slide.type || 'explanation',
              contentEn: slide.text?.en || slide.contentEn || '',
              contentSi: slide.text?.si || slide.contentSi || '',
              imageUrl: finalImageUrl,
              videoUrlEn: (slide.videoUrlEn && slide.videoUrlEn.trim() !== '') ? slide.videoUrlEn.trim() : null,
              videoUrlSi: (slide.videoUrlSi && slide.videoUrlSi.trim() !== '') ? slide.videoUrlSi.trim() : null,
            };
          }) || [],
        },
        questions: {
          create: questions?.map((q: any, index: number) => {
            const configJson: any = {};
            
            if (q.type === 'single_choice') {
              configJson.options = {
                en: q.options?.en || [],
                si: q.options?.si || [],
              };
              configJson.correctIndex = q.correct_index ?? q.correctIndex ?? 0;
            } else if (q.type === 'multi_select') {
              configJson.options = {
                en: q.options?.en || [],
                si: q.options?.si || [],
              };
              configJson.correctIndices = q.correct_indices ?? q.correctIndices ?? [];
            } else if (q.type === 'true_false') {
              configJson.answer = q.answer?.en ?? q.answer ?? false;
            }

            return {
              orderIndex: q.orderIndex ?? index + 1,
              type: q.type,
              promptEn: q.question?.en || q.promptEn || '',
              promptSi: q.question?.si || q.promptSi || '',
              configJson,
            };
          }) || [],
        },
        reflectionQuestions: {
          create: reflectionQuestions?.map((rq: any, index: number) => ({
            category: rq.category || 'general',
            promptEn: rq.prompt?.en || rq.promptEn || '',
            promptSi: rq.prompt?.si || rq.promptSi || '',
            optionsEn: rq.options?.en || rq.optionsEn || [],
            optionsSi: rq.options?.si || rq.optionsSi || [],
            orderIndex: rq.orderIndex ?? index,
            isActive: rq.isActive !== undefined ? rq.isActive : true,
          })) || [],
        },
      },
      include: {
        slides: true,
        questions: true,
        reflectionQuestions: true,
      },
    });

    res.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    logger.error('Error creating lesson', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create lesson',
    });
  }
};

export const updateLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      titleEn,
      titleSi,
      orderIndex,
      xpReward,
      isActive,
      chapterId,
      slides,
      questions,
      reflectionQuestions,
    } = req.body;

    // Update lesson basic info
    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        titleEn,
        titleSi,
        orderIndex,
        xpReward,
        isActive,
        chapterId,
      },
    });

    // Update slides if provided
    if (slides) {
      // Delete existing slides
      await prisma.slide.deleteMany({
        where: { lessonId: id },
      });

      // Create new slides
      await prisma.slide.createMany({
        data: slides.map((slide: any, index: number) => {
          // Handle imageUrl - convert empty string to null, preserve valid URLs
          const imageUrl = slide.image || slide.imageUrl;
          const finalImageUrl = (imageUrl && imageUrl.trim() !== '') ? imageUrl.trim() : null;
          
          return {
            lessonId: id,
            orderIndex: slide.orderIndex ?? index + 1,
            type: slide.type || 'explanation',
            contentEn: slide.text?.en || slide.contentEn || '',
            contentSi: slide.text?.si || slide.contentSi || '',
            imageUrl: finalImageUrl,
            videoUrlEn: (slide.videoUrlEn && slide.videoUrlEn.trim() !== '') ? slide.videoUrlEn.trim() : null,
            videoUrlSi: (slide.videoUrlSi && slide.videoUrlSi.trim() !== '') ? slide.videoUrlSi.trim() : null,
          };
        }),
      });
    }

    // Update questions if provided
    if (questions) {
      // Delete existing questions
      await prisma.question.deleteMany({
        where: { lessonId: id },
      });

      // Create new questions
      await prisma.question.createMany({
        data: questions.map((q: any, index: number) => {
          const configJson: any = {};
          
          if (q.type === 'single_choice') {
            configJson.options = {
              en: q.options?.en || [],
              si: q.options?.si || [],
            };
            configJson.correctIndex = q.correct_index ?? q.correctIndex ?? 0;
          } else if (q.type === 'multi_select') {
            configJson.options = {
              en: q.options?.en || [],
              si: q.options?.si || [],
            };
            configJson.correctIndices = q.correct_indices ?? q.correctIndices ?? [];
          } else if (q.type === 'true_false') {
            configJson.answer = q.answer?.en ?? q.answer ?? false;
          }

          return {
            lessonId: id,
            orderIndex: q.orderIndex ?? index + 1,
            type: q.type,
            promptEn: q.question?.en || q.promptEn || '',
            promptSi: q.question?.si || q.promptSi || '',
            configJson,
          };
        }),
      });
    }

    // Update reflection questions if provided
    if (reflectionQuestions !== undefined) {
      // Delete existing reflection questions
      await prisma.reflectionQuestion.deleteMany({
        where: { lessonId: id },
      });

      // Create new reflection questions
      if (reflectionQuestions.length > 0) {
        await prisma.reflectionQuestion.createMany({
          data: reflectionQuestions.map((rq: any, index: number) => ({
            lessonId: id,
            category: rq.category || 'general',
            promptEn: rq.prompt?.en || rq.promptEn || '',
            promptSi: rq.prompt?.si || rq.promptSi || '',
            optionsEn: rq.options?.en || rq.optionsEn || [],
            optionsSi: rq.options?.si || rq.optionsSi || [],
            orderIndex: rq.orderIndex ?? index,
            isActive: rq.isActive !== undefined ? rq.isActive : true,
          })),
        });
      }
    }

    const updatedLesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        slides: { orderBy: { orderIndex: 'asc' } },
        questions: { orderBy: { orderIndex: 'asc' } },
        reflectionQuestions: { orderBy: { orderIndex: 'asc' } },
      },
    });

    res.json({
      success: true,
      data: updatedLesson,
    });
  } catch (error) {
    logger.error('Error updating lesson', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lesson',
    });
  }
};

export const deleteLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.lesson.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting lesson', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete lesson',
    });
  }
};

// ==================== CARDS ====================

export const createCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      nameEn,
      nameSi,
      descriptionEn,
      descriptionSi,
      rarity,
      category,
      imageUrl,
      unlockCondition,
    } = req.body;

    const card = await prisma.card.create({
      data: {
        nameEn,
        nameSi,
        descriptionEn,
        descriptionSi,
        rarity: rarity || 'common',
        category: category || null,
        imageUrl: imageUrl || '',
        unlockCondition: unlockCondition || {},
      },
    });

    res.json({
      success: true,
      data: card,
    });
  } catch (error) {
    logger.error('Error creating card', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create card',
    });
  }
};

export const updateCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      nameEn,
      nameSi,
      descriptionEn,
      descriptionSi,
      rarity,
      category,
      imageUrl,
      unlockCondition,
    } = req.body;

    const updateData: any = {
      nameEn,
      nameSi,
      descriptionEn,
      descriptionSi,
      rarity,
    };

    if (category !== undefined) updateData.category = category;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || '';
    if (unlockCondition !== undefined) updateData.unlockCondition = unlockCondition || {};

    const card = await prisma.card.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: card,
    });
  } catch (error) {
    logger.error('Error updating card', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update card',
    });
  }
};

export const deleteCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.card.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Card deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting card', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete card',
    });
  }
};

// ==================== USERS ====================

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        languagePreference: true,
        totalXP: true,
        hearts: true,
        maxHearts: true,
        dailyGoalXP: true,
        createdAt: true,
        updatedAt: true,
        streak: {
          select: {
            currentStreak: true,
            longestStreak: true,
            lastActiveDate: true,
          },
        },
        _count: {
          select: {
            progress: {
              where: { status: 'completed' },
            },
            cards: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate level for each user
    const usersWithLevel = users.map((user) => {
      const level = calculateLevel(user.totalXP);
      return {
        ...user,
        level,
        lessonsCompleted: user._count.progress,
        cardsCollected: user._count.cards,
      };
    });

    res.json({
      success: true,
      data: usersWithLevel,
    });
  } catch (error) {
    logger.error('Error fetching users', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
};

// ==================== ADMIN STATS ====================

export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [worldsCount, chaptersCount, lessonsCount, cardsCount, usersCount] = await Promise.all([
      prisma.world.count(),
      prisma.chapter.count(),
      prisma.lesson.count(),
      prisma.card.count(),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data: {
        worlds: worldsCount,
        chapters: chaptersCount,
        lessons: lessonsCount,
        cards: cardsCount,
        users: usersCount,
      },
    });
  } catch (error) {
    logger.error('Error fetching admin stats', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
    });
  }
};

