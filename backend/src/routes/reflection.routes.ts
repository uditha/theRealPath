import { Router } from 'express';
import { submitReflection } from '../controllers/reflection.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateReflection } from '../middleware/validation.middleware';

const router = Router();

// Reflection routes require authentication
router.post('/lessons/:id/reflection', authenticateToken, validateReflection, submitReflection);

export default router;

