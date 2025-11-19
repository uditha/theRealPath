import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  logger.warn('DATABASE_URL is not set - database operations will fail');
}

// Configure Prisma with proper settings
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;

