import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLessonSlides() {
  try {
    // Get all lessons with their slides, ordered by chapter and orderIndex
    const lessons = await prisma.lesson.findMany({
      include: {
        chapter: {
          include: {
            world: true,
          },
        },
        slides: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: [
        { chapter: { orderIndex: 'asc' } },
        { orderIndex: 'asc' },
      ],
    });
    
    console.log('\n📚 LESSON SLIDES CHECK\n');
    
    lessons.forEach((lesson, index) => {
      const slideCount = lesson.slides.length;
      const status = slideCount > 0 ? '✅' : '❌';
      
      console.log(`${status} Lesson ${index + 1}: ${lesson.titleEn}`);
      console.log(`   Chapter: ${lesson.chapter.nameEn}`);
      console.log(`   Order: ${lesson.chapter.orderIndex}.${lesson.orderIndex}`);
      console.log(`   Slides: ${slideCount}`);
      
      if (slideCount === 0) {
        console.log(`   ⚠️  WARNING: No slides found!`);
      } else {
        console.log(`   Slide types: ${lesson.slides.map(s => s.type).join(', ')}`);
      }
      console.log('');
    });
    
    // Summary
    const lessonsWithoutSlides = lessons.filter(l => l.slides.length === 0);
    const lessonsWithSlides = lessons.filter(l => l.slides.length > 0);
    
    console.log('\n📊 SUMMARY:');
    console.log(`  Total lessons: ${lessons.length}`);
    console.log(`  Lessons with slides: ${lessonsWithSlides.length}`);
    console.log(`  Lessons without slides: ${lessonsWithoutSlides.length}`);
    
    if (lessonsWithoutSlides.length > 0) {
      console.log('\n⚠️  Lessons missing slides:');
      lessonsWithoutSlides.forEach((lesson, index) => {
        console.log(`  ${index + 1}. ${lesson.titleEn} (Chapter: ${lesson.chapter.nameEn}, Order: ${lesson.chapter.orderIndex}.${lesson.orderIndex})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking lessons:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkLessonSlides()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });









