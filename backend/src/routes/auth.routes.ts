import { Router } from 'express';
import {
  register,
  login,
  getMe,
  getPendingUsers,
  getAllUsers,
  updateUserStatus,
  updateUserProfile,
  deleteUser,
} from '../controllers/auth.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);

// Admin-only management
router.get('/pending', authenticate, requireAdmin, getPendingUsers);
router.get('/users', authenticate, requireAdmin, getAllUsers);
router.patch('/users/:userId/status', authenticate, requireAdmin, updateUserStatus);
router.put('/users/:userId', authenticate, requireAdmin, updateUserProfile);
router.delete('/users/:userId', authenticate, requireAdmin, deleteUser);

export default router;
