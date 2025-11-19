import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countLessons() {
  try {
    // Count total lessons
    const totalLessons = await prisma.lesson.count();
    
    // Count active lessons
    const activeLessons = await prisma.lesson.count({
      where: { isActive: true },
    });
    
    // Count inactive lessons
    const inactiveLessons = await prisma.lesson.count({
      where: { isActive: false },
    });
    
    // Get lessons grouped by chapter
    const lessonsByChapter = await prisma.lesson.groupBy({
      by: ['chapterId'],
      _count: {
        id: true,
      },
    });
    
    // Get lessons grouped by world (through chapter)
    const chapters = await prisma.chapter.findMany({
      include: {
        lessons: true,
        world: true,
      },
    });
    
    // Group by world
    const lessonsByWorld: { [worldName: string]: number } = {};
    chapters.forEach((chapter) => {
      const worldName = chapter.world.nameEn;
      if (!lessonsByWorld[worldName]) {
        lessonsByWorld[worldName] = 0;
      }
      lessonsByWorld[worldName] += chapter.lessons.length;
    });
    
    console.log('\n📚 LESSON STATISTICS\n');
    console.log(`Total Lessons: ${totalLessons}`);
    console.log(`Active Lessons: ${activeLessons}`);
    console.log(`Inactive Lessons: ${inactiveLessons}`);
    
    console.log('\n📖 Lessons by Chapter:');
    for (const group of lessonsByChapter) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: group.chapterId },
        include: { world: true },
      });
      if (chapter) {
        console.log(`  - ${chapter.world.nameEn} > ${chapter.nameEn}: ${group._count.id} lessons`);
      }
    }
    
    console.log('\n🌍 Lessons by World:');
    Object.entries(lessonsByWorld).forEach(([worldName, count]) => {
      console.log(`  - ${worldName}: ${count} lessons`);
    });
    
    // Get total chapters
    const totalChapters = await prisma.chapter.count();
    const totalWorlds = await prisma.world.count();
    
    console.log('\n📊 SUMMARY:');
    console.log(`  Worlds: ${totalWorlds}`);
    console.log(`  Chapters: ${totalChapters}`);
    console.log(`  Lessons: ${totalLessons}`);
    console.log(`  Average lessons per chapter: ${(totalLessons / totalChapters).toFixed(2)}`);
    console.log(`  Average lessons per world: ${(totalLessons / totalWorlds).toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error counting lessons:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

countLessons()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });









