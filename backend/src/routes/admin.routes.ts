import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  // Worlds
  getWorlds,
  createWorld,
  updateWorld,
  deleteWorld,
  // Chapters
  createChapter,
  updateChapter,
  deleteChapter,
  // Lessons
  createLesson,
  updateLesson,
  deleteLesson,
  // Cards
  createCard,
  updateCard,
  deleteCard,
  // Users
  getUsers,
  // Stats
  getAdminStats,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication
router.use(authenticateToken);

// Check if user is admin (you can add role checking middleware here)
// For now, we'll allow any authenticated user to access admin routes
// In production, add: router.use(requireAdminRole);

// Stats
router.get('/stats', getAdminStats);

// Worlds
router.get('/worlds', getWorlds);
router.post('/worlds', createWorld);
router.put('/worlds/:id', updateWorld);
router.delete('/worlds/:id', deleteWorld);

// Chapters
router.post('/chapters', createChapter);
router.put('/chapters/:id', updateChapter);
router.delete('/chapters/:id', deleteChapter);

// Lessons
router.post('/lessons', createLesson);
router.put('/lessons/:id', updateLesson);
router.delete('/lessons/:id', deleteLesson);

// Cards
router.post('/cards', createCard);
router.put('/cards/:id', updateCard);
router.delete('/cards/:id', deleteCard);

// Users
router.get('/users', getUsers);

export default router;


