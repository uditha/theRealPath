import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get all active worlds with chapter summaries
 */
export const getWorlds = async (req: Request, res: Response): Promise<void> => {
  try {
    const worlds = await prisma.world.findMany({
      where: { isActive: true },
      include: {
        chapters: {
          where: { world: { isActive: true } },
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

    // Format response with chapter summaries
    const formattedWorlds = worlds.map((world) => ({
      id: world.id,
      nameEn: world.nameEn,
      nameSi: world.nameSi,
      orderIndex: world.orderIndex,
      themeKey: world.themeKey,
      backgroundImageUrl: world.backgroundImageUrl,
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

/**
 * Get world by ID with full chapter/lesson tree
 */
export const getWorldById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const world = await prisma.world.findUnique({
      where: { id },
      include: {
        chapters: {
          include: {
            lessons: {
              where: { isActive: true },
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                slug: true,
                titleEn: true,
                titleSi: true,
                orderIndex: true,
                xpReward: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!world) {
      res.status(404).json({
        success: false,
        error: 'World not found',
      });
      return;
    }

    res.json({
      success: true,
      data: world,
    });
  } catch (error) {
    logger.error('Error fetching world', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch world',
    });
  }
};

/**
 * Get chapter by ID with lessons
 */
export const getChapterById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        world: {
          select: {
            id: true,
            nameEn: true,
            nameSi: true,
            themeKey: true,
          },
        },
        lessons: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            slug: true,
            titleEn: true,
            titleSi: true,
            orderIndex: true,
            xpReward: true,
          },
        },
      },
    });

    if (!chapter) {
      res.status(404).json({
        success: false,
        error: 'Chapter not found',
      });
      return;
    }

    res.json({
      success: true,
      data: chapter,
    });
  } catch (error) {
    logger.error('Error fetching chapter', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chapter',
    });
  }
};

/**
 * Get lesson by ID with slides and questions
 */
export const getLessonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).userId;

    // OPTIMIZED: Run lesson and userProgress queries in parallel
    const [lesson, userProgress] = await Promise.all([
      prisma.lesson.findUnique({
        where: { id },
        select: {
          id: true,
          chapterId: true,
          titleEn: true,
          titleSi: true,
          xpReward: true,
          chapter: {
            select: {
              world: {
                select: {
                  id: true,
                  nameEn: true,
                  nameSi: true,
                  themeKey: true,
                  backgroundImageUrl: true,
                },
              },
            },
          },
          slides: {
            select: {
              orderIndex: true,
              type: true,
              contentEn: true,
              contentSi: true,
              imageUrl: true,
              videoUrlEn: true,
              videoUrlSi: true,
            },
            orderBy: { orderIndex: 'asc' },
          },
          questions: {
            select: {
              orderIndex: true,
              type: true,
              promptEn: true,
              promptSi: true,
              configJson: true,
            },
            orderBy: { orderIndex: 'asc' },
          },
          reflectionQuestions: {
            where: { isActive: true },
            select: {
              category: true,
              promptEn: true,
              promptSi: true,
              optionsEn: true,
              optionsSi: true,
              orderIndex: true,
            },
            orderBy: { orderIndex: 'asc' },
          },
        },
      }),
      userId
        ? prisma.userProgress.findUnique({
            where: {
              userId_lessonId: {
                userId,
                lessonId: id,
              },
            },
            select: {
              status: true,
              bestScore: true,
              masteryLevel: true,
              lastAttemptAt: true,
              completedAt: true,
            },
          })
        : Promise.resolve(null),
    ]);

    if (!lesson) {
      res.status(404).json({
        success: false,
        error: 'Lesson not found',
      });
      return;
    }

    // Format response to match example structure
    const response: any = {
      lesson_id: lesson.id,
      chapter_id: lesson.chapterId,
      type: 'core', // Default type, can be added to schema later
      title: {
        en: lesson.titleEn,
        si: lesson.titleSi,
      },
      world: lesson.chapter?.world ? {
        id: lesson.chapter.world.id,
        nameEn: lesson.chapter.world.nameEn,
        nameSi: lesson.chapter.world.nameSi,
        themeKey: lesson.chapter.world.themeKey,
        backgroundImageUrl: lesson.chapter.world.backgroundImageUrl,
      } : null,
      slides: lesson.slides.map((slide) => ({
        id: slide.orderIndex,
        type: slide.type,
        text: {
          en: slide.contentEn,
          si: slide.contentSi,
        },
        image: slide.imageUrl || null,
        videoUrlEn: slide.videoUrlEn || null,
        videoUrlSi: slide.videoUrlSi || null,
      })),
      quiz: lesson.questions.map((q) => {
        // OPTIMIZED: Parse configJson once and reuse
        const config = q.configJson as any;
        const question: any = {
          id: q.orderIndex,
          type: q.type,
          question: {
            en: q.promptEn,
            si: q.promptSi,
          },
        };

        // OPTIMIZED: Simplified question formatting
        if (q.type === 'single_choice' && config?.options) {
          if (Array.isArray(config.options)) {
            question.options = {
              en: config.options.map((opt: any) => opt.textEn || opt.text || ''),
              si: config.options.map((opt: any) => opt.textSi || opt.text || ''),
            };
            question.correct_index = config.options.findIndex(
              (opt: any) => opt.id === (config.correctAnswer || config.correct)
            );
          } else if (config.options.en) {
            question.options = {
              en: config.options.en || [],
              si: config.options.si || [],
            };
            question.correct_index = config.correctIndex ?? config.correct_index ?? 0;
          }
        } else if (q.type === 'multi_select' && config?.options) {
          if (Array.isArray(config.options)) {
            question.options = {
              en: config.options.map((opt: any) => opt.textEn || opt.text || ''),
              si: config.options.map((opt: any) => opt.textSi || opt.text || ''),
            };
            question.correct_indices = config.correctAnswers
              ? config.correctAnswers.map((ans: string) =>
                  config.options.findIndex((opt: any) => opt.id === ans)
                )
              : [];
          } else if (config.options.en) {
            question.options = {
              en: config.options.en || [],
              si: config.options.si || [],
            };
            question.correct_indices = config.correctIndices ?? config.correct_indices ?? [];
          }
        } else if (q.type === 'true_false' && config?.correctAnswer !== undefined) {
          question.answer = {
            en: config.correctAnswer,
            si: config.correctAnswer,
          };
        }

        return question;
      }),
      reflection: (() => {
        // Fetch reflection questions from database
        // Select category based on user progress
        let selectedCategory: 'general' | 'challenging' | 'success' = 'general';
        if (userProgress && userProgress.bestScore !== null && userProgress.bestScore !== undefined) {
          if (userProgress.bestScore < 60) {
            selectedCategory = 'challenging';
          } else if (userProgress.bestScore >= 80) {
            selectedCategory = 'success';
          }
        }

        // Find reflection question for selected category
        const reflectionQuestion = lesson.reflectionQuestions.find(
          (rq) => rq.category === selectedCategory
        );

        // If no question found for category, try general as fallback
        const question = reflectionQuestion || lesson.reflectionQuestions.find(
          (rq) => rq.category === 'general'
        );

        // If still no question, return null (frontend should handle this)
        if (!question) {
          return null;
        }

        return {
          prompt: {
            en: question.promptEn,
            si: question.promptSi,
          },
          options: {
            en: question.optionsEn,
            si: question.optionsSi,
          },
        };
      })(),
      rewards: {
        xp: lesson.xpReward,
        cards_unlocked: [], // Will be populated when lesson is completed
      },
      // Additional metadata
      userProgress: userProgress
        ? {
            status: userProgress.status,
            bestScore: userProgress.bestScore,
            masteryLevel: userProgress.masteryLevel,
            lastAttemptAt: userProgress.lastAttemptAt,
            completedAt: userProgress.completedAt,
          }
        : null,
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Error fetching lesson', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lesson',
    });
  }
};

/**
 * Get lessons by chapter ID
 */
export const getLessonsByChapter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chapterId } = req.query;

    if (!chapterId || typeof chapterId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'chapterId query parameter is required',
      });
      return;
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        chapterId,
        isActive: true,
      },
      include: {
        chapter: {
          select: {
            id: true,
            nameEn: true,
            nameSi: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    res.json({
      success: true,
      data: lessons,
    });
  } catch (error) {
    logger.error('Error fetching lessons by chapter', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lessons',
    });
  }
};

