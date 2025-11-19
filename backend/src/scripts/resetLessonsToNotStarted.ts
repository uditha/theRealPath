import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetLessonsToNotStarted(email: string) {
  try {
    console.log(`🔄 Resetting all lessons to "not_started" for user: ${email}`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.id})`);

    // Update all progress records to "not_started"
    const updatedProgress = await prisma.userProgress.updateMany({
      where: { userId: user.id },
      data: {
        status: 'not_started',
        bestScore: 0,
        masteryLevel: 0,
        lastAttemptAt: null,
        completedAt: null,
        nextReviewAt: null,
      },
    });

    console.log(`🔄 Updated ${updatedProgress.count} progress records to "not_started"`);

    console.log(`✅ Successfully reset all lessons to "not_started" for ${email}`);
  } catch (error) {
    console.error('❌ Error resetting lessons:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: npx tsx src/scripts/resetLessonsToNotStarted.ts <email>');
  process.exit(1);
}

resetLessonsToNotStarted(email)
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });








