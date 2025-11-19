import { Router } from 'express';
import {
  startLesson,
  completeLesson,
  practiceLesson,
  getProgressSummary,
  getUserProgress,
  getReviewQueue,
  getDailyProgress,
} from '../controllers/progress.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateCompleteLesson } from '../middleware/validation.middleware';

const router = Router();

// All progress routes require authentication
router.post('/lesson/:id/start', authenticateToken, startLesson);
router.post('/lesson/:id/complete', authenticateToken, validateCompleteLesson, completeLesson);
router.post('/lesson/:id/practice', authenticateToken, practiceLesson);
router.get('/summary', authenticateToken, getProgressSummary);
router.get('/', authenticateToken, getUserProgress);
router.get('/review-queue', authenticateToken, getReviewQueue);
router.get('/daily', authenticateToken, getDailyProgress);

export default router;

