import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetUserProgress(email: string) {
  try {
    console.log(`🔄 Resetting progress for user: ${email}`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        progress: true,
        streak: true,
        cards: true,
        reflections: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.id})`);

    // Delete all progress records
    const deletedProgress = await prisma.userProgress.deleteMany({
      where: { userId: user.id },
    });
    console.log(`🗑️  Deleted ${deletedProgress.count} progress records`);

    // Delete all reflections
    const deletedReflections = await prisma.reflection.deleteMany({
      where: { userId: user.id },
    });
    console.log(`🗑️  Deleted ${deletedReflections.count} reflection records`);

    // Delete all user cards
    const deletedCards = await prisma.userCard.deleteMany({
      where: { userId: user.id },
    });
    console.log(`🗑️  Deleted ${deletedCards.count} card records`);

    // Reset streak
    if (user.streak) {
      await prisma.streak.update({
        where: { userId: user.id },
        data: {
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null,
        },
      });
      console.log(`🔄 Reset streak to 0`);
    }

    // Reset user stats
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalXP: 0,
        hearts: 5,
        maxHearts: 5,
        lastHeartRefillAt: null,
      },
    });
    console.log(`🔄 Reset user stats (XP: 0, Hearts: 5/5)`);

    console.log(`✅ Successfully reset all progress for ${email}`);
  } catch (error) {
    console.error('❌ Error resetting progress:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: npx ts-node src/scripts/resetUserProgress.ts <email>');
  process.exit(1);
}

resetUserProgress(email)
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });









