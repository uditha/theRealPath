import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import contentRoutes from './routes/content.routes';
import progressRoutes from './routes/progress.routes';
import cardRoutes from './routes/card.routes';
import reflectionRoutes from './routes/reflection.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import { logger } from './utils/logger';
import { apiLimiter } from './middleware/rateLimiter.middleware';
import prisma from './config/database';

dotenv.config();

// Log startup information
logger.info('Starting server...', {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || '3000',
  hasDatabaseUrl: !!process.env.DATABASE_URL,
});

const app: Express = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Simple health check - MUST be before any middleware that could block it
app.get('/health', async (req: Request, res: Response) => {
  const healthStatus = {
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    database: 'unknown' as 'connected' | 'disconnected' | 'unknown',
    environment: process.env.NODE_ENV || 'development',
  };

  // Check database connection with timeout
  try {
    const dbCheck = prisma.$queryRaw`SELECT 1`;
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database check timeout')), 5000)
    );
    
    await Promise.race([dbCheck, timeout]);
    healthStatus.database = 'connected';
  } catch (error) {
    logger.warn('Health check - database connection check failed', error);
    healthStatus.database = 'disconnected';
  }

  res.status(200).json(healthStatus);
});

// Parse CORS origins from environment
const getCorsOrigins = (): string | string[] => {
  const corsOrigin = process.env.CORS_ORIGIN;
  if (!corsOrigin) {
    logger.warn('CORS_ORIGIN not set, allowing all origins (NOT RECOMMENDED FOR PRODUCTION)');
    return '*';
  }
  if (corsOrigin.includes(',')) {
    return corsOrigin.split(',').map((origin) => origin.trim());
  }
  return corsOrigin;
};

// Trust proxy - required for Railway and other cloud platforms
app.set('trust proxy', true);

// Middleware
app.use(cors({
  origin: getCorsOrigins(),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use('/api', apiLimiter);

// Routes - versioned under /api/v1/
app.use('/api/auth', authRoutes); // Keep auth routes at /api/auth for backward compatibility
app.use('/api/v1', contentRoutes); // /api/v1/worlds, /api/v1/lessons, etc.
app.use('/api/v1/progress', progressRoutes); // /api/v1/progress/...
app.use('/api/v1/cards', cardRoutes); // /api/v1/cards/...
app.use('/api/v1', reflectionRoutes); // /api/v1/lessons/:id/reflection
app.use('/api/v1/users', userRoutes); // /api/v1/users/me, etc.
app.use('/api/v1/admin', adminRoutes); // /api/v1/admin/...

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });
  
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl || req.path,
    ip: req.ip,
  });
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server is running on ${HOST}:${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    host: HOST,
  });
}).on('error', (error: Error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});

export default app;

