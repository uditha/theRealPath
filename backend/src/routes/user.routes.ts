import { Router } from 'express';
import {
  getMe,
  updateMe,
  getUserStats,
  getHearts,
  refillHearts,
} from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateUserUpdate } from '../middleware/validation.middleware';

const router = Router();

// All user routes require authentication
router.get('/me', authenticateToken, getMe);
router.patch('/me', authenticateToken, validateUserUpdate, updateMe);
router.get('/me/stats', authenticateToken, getUserStats);
router.get('/me/hearts', authenticateToken, getHearts);
router.post('/me/hearts/refill', authenticateToken, refillHearts);

export default router;

