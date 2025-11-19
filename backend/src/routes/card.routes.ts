import { Router } from 'express';
import { getAllCards, getUserCards } from '../controllers/card.controller';
import { optionalAuthenticateToken, authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Cards routes
router.get('/', optionalAuthenticateToken, getAllCards); // All cards (optional auth)
router.get('/users/me/cards', authenticateToken, getUserCards); // User's cards (auth required)

export default router;










