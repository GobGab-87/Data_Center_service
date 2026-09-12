import { Router } from 'express';
import {
  startRound,
  getActiveRound,
  completeRound,
  recordEquipmentLog,
  batchSyncLogs,
  getRoundsHistory,
  getRoundDetails,
  deleteEquipmentLog,
  adminEditLog,
  deleteRound,
} from '../controllers/inspection.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/start', startRound);
router.get('/active', getActiveRound);
router.post('/complete/:roundId', completeRound);
router.post('/log', recordEquipmentLog);
router.delete('/round/:roundId/equipment/:equipmentId', deleteEquipmentLog);
router.post('/sync', batchSyncLogs);
router.get('/history', getRoundsHistory);
router.get('/round/:roundId', getRoundDetails);

// Admin-only inspection routes
router.put('/logs/:logId/admin-edit', requireAdmin, adminEditLog);
router.delete('/rounds/:roundId', requireAdmin, deleteRound);

export default router;
