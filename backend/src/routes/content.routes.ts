import { Router } from 'express';
import {
  getWorlds,
  getWorldById,
  getChapterById,
  getLessonById,
  getLessonsByChapter,
} from '../controllers/content.controller';
import { optionalAuthenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Content routes - optional auth (guest mode supported)
router.get('/worlds', optionalAuthenticateToken, getWorlds);
router.get('/worlds/:id', optionalAuthenticateToken, getWorldById);
router.get('/chapters/:id', optionalAuthenticateToken, getChapterById);
router.get('/lessons/:id', optionalAuthenticateToken, getLessonById);
router.get('/lessons', optionalAuthenticateToken, getLessonsByChapter);

export default router;










