import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl || req.path,
      method: req.method,
    });
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later.',
    });
  },
  skip: (req: Request) => {
    if (process.env.NODE_ENV !== 'production') {
      const ip = req.ip || '';
      if (ip === '::1' || ip === '127.0.0.1' || ip.includes('::ffff:127.0.0.1')) {
        return true;
      }
    }
    return false;
  },
});

// Strict rate limiter for authentication endpoints
const authRateLimitMax = process.env.AUTH_RATE_LIMIT_MAX 
  ? parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) 
  : (process.env.NODE_ENV === 'production' ? 20 : 50);

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: authRateLimitMax,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email,
      limit: authRateLimitMax,
    });
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Please try again after 15 minutes.',
    });
  },
  skip: (req: Request) => {
    if (process.env.NODE_ENV !== 'production') {
      const ip = req.ip || '';
      if (ip === '::1' || ip === '127.0.0.1' || ip.includes('::ffff:127.0.0.1')) {
        return true;
      }
    }
    return false;
  },
});

