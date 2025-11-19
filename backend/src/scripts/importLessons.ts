import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface LessonData {
  chapterId?: string;
  slug: string;
  titleEn: string;
  titleSi: string;
  orderIndex: number;
  xpReward: number;
  slides?: Array<{
    orderIndex: number;
    type: string;
    contentEn: string;
    contentSi: string;
    imageUrl: string | null;
    videoUrlEn: string | null;
    videoUrlSi: string | null;
  }>;
  questions?: Array<{
    orderIndex: number;
    type: string;
    promptEn: string;
    promptSi: string;
    configJson: any;
  }>;
  reflection?: {
    prompt: {
      en: string;
      si: string;
    };
    options: {
      en: string[];
      si: string[];
    };
  };
}

async function main() {
  console.log('📚 Importing lessons to first chapter...\n');

  try {
    // Find the first chapter (orderIndex 1 in the first world)
    const firstWorld = await prisma.world.findFirst({
      where: { orderIndex: 1, isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    if (!firstWorld) {
      throw new Error('First world not found. Please run seed script first.');
    }

    const firstChapter = await prisma.chapter.findFirst({
      where: {
        worldId: firstWorld.id,
        orderIndex: 1,
      },
      orderBy: { orderIndex: 'asc' },
    });

    if (!firstChapter) {
      throw new Error('First chapter not found. Please run seed script first.');
    }

    console.log(`✅ Found chapter: ${firstChapter.nameEn} (ID: ${firstChapter.id})\n`);

    // Read the JSON file
    const jsonPath = path.join(__dirname, '../../../lessons_1_to_10_template.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(jsonContent);

    if (!data.lessons || !Array.isArray(data.lessons)) {
      throw new Error('Invalid JSON format. Expected "lessons" array.');
    }

    const lessons: LessonData[] = data.lessons;

    console.log(`📖 Found ${lessons.length} lessons to import\n`);

    // Delete existing lessons in this chapter (optional - comment out if you want to keep existing)
    const existingLessons = await prisma.lesson.findMany({
      where: { chapterId: firstChapter.id },
    });

    if (existingLessons.length > 0) {
      console.log(`⚠️  Found ${existingLessons.length} existing lessons in this chapter.`);
      console.log('   Deleting existing lessons to replace with new ones...\n');
      
      // Delete questions, slides, and lessons
      for (const lesson of existingLessons) {
        await prisma.question.deleteMany({ where: { lessonId: lesson.id } });
        await prisma.slide.deleteMany({ where: { lessonId: lesson.id } });
        await prisma.lesson.delete({ where: { id: lesson.id } });
      }
    }

    // Create each lesson
    for (const lessonData of lessons) {
      console.log(`Creating lesson ${lessonData.orderIndex}: ${lessonData.titleEn}`);

      // Prepare slides
      const slidesData = lessonData.slides?.map((slide) => ({
        orderIndex: slide.orderIndex,
        type: slide.type || 'explanation',
        contentEn: slide.contentEn || '',
        contentSi: slide.contentSi || '',
        imageUrl: slide.imageUrl || null,
        videoUrlEn: slide.videoUrlEn || null,
        videoUrlSi: slide.videoUrlSi || null,
      })) || [];

      // Prepare questions
      const questionsData = lessonData.questions?.map((q) => {
        const configJson: any = {};

        if (q.type === 'single_choice') {
          // Convert from { en: [...], si: [...] } to [{ id, textEn, textSi }]
          const optionsObj = q.configJson.options || { en: [], si: [] };
          if (optionsObj.en && Array.isArray(optionsObj.en)) {
            // Convert to array format
            configJson.options = optionsObj.en.map((textEn: string, index: number) => ({
              id: String.fromCharCode(97 + index), // 'a', 'b', 'c', 'd'
              textEn: textEn,
              textSi: optionsObj.si?.[index] || textEn,
            }));
            // Convert correctIndex to correctAnswer (id)
            const correctIndex = q.configJson.correctIndex ?? 0;
            configJson.correctAnswer = configJson.options[correctIndex]?.id || 'a';
          } else if (Array.isArray(optionsObj)) {
            // Already in correct format
            configJson.options = optionsObj;
            configJson.correctAnswer = q.configJson.correctAnswer || q.configJson.correctIndex || 'a';
          }
        } else if (q.type === 'multi_select') {
          // Convert from { en: [...], si: [...] } to [{ id, textEn, textSi }]
          const optionsObj = q.configJson.options || { en: [], si: [] };
          if (optionsObj.en && Array.isArray(optionsObj.en)) {
            configJson.options = optionsObj.en.map((textEn: string, index: number) => ({
              id: String.fromCharCode(97 + index),
              textEn: textEn,
              textSi: optionsObj.si?.[index] || textEn,
            }));
            // Convert correctIndices to correctAnswers (ids)
            const correctIndices = q.configJson.correctIndices ?? [];
            configJson.correctAnswers = correctIndices.map((idx: number) => 
              configJson.options[idx]?.id || String.fromCharCode(97 + idx)
            );
          } else if (Array.isArray(optionsObj)) {
            configJson.options = optionsObj;
            configJson.correctAnswers = q.configJson.correctAnswers || q.configJson.correctIndices || [];
          }
        } else if (q.type === 'true_false') {
          configJson.correctAnswer = q.configJson.answer ?? false;
        }

        return {
          orderIndex: q.orderIndex,
          type: q.type,
          promptEn: q.promptEn || '',
          promptSi: q.promptSi || '',
          configJson,
        };
      }) || [];

      // Create lesson with slides and questions
      const lesson = await prisma.lesson.create({
        data: {
          chapterId: firstChapter.id,
          slug: lessonData.slug,
          titleEn: lessonData.titleEn,
          titleSi: lessonData.titleSi,
          orderIndex: lessonData.orderIndex,
          xpReward: lessonData.xpReward || 10,
          isActive: true,
          slides: {
            create: slidesData,
          },
          questions: {
            create: questionsData,
          },
        },
        include: {
          slides: true,
          questions: true,
        },
      });

      console.log(`   ✅ Created with ${lesson.slides.length} slides and ${lesson.questions.length} questions`);
    }

    console.log(`\n🎉 Successfully imported ${lessons.length} lessons to chapter: ${firstChapter.nameEn}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Chapter: ${firstChapter.nameEn}`);
    console.log(`   - Lessons: ${lessons.length}`);
    
    const totalSlides = lessons.reduce((sum, l) => sum + (l.slides?.length || 0), 0);
    const totalQuestions = lessons.reduce((sum, l) => sum + (l.questions?.length || 0), 0);
    console.log(`   - Total Slides: ${totalSlides}`);
    console.log(`   - Total Questions: ${totalQuestions}`);

  } catch (error) {
    console.error('❌ Error importing lessons:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

