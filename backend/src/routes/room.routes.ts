import { Router } from 'express';
import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/room.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, getRooms);
router.post('/', authenticate, requireAdmin, createRoom);
router.put('/:roomId', authenticate, requireAdmin, updateRoom);
router.delete('/:roomId', authenticate, requireAdmin, deleteRoom);

export default router;
