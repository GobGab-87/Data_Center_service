import { Router } from 'express';
import {
  startRound,
  getActiveRound,
  completeRound,
  recordEquipmentLog,
  batchSyncLogs,
  getRoundsHistory,
  getRoundDetails,
} from '../controllers/inspection.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/start', startRound);
router.get('/active', getActiveRound);
router.post('/complete/:roundId', completeRound);
router.post('/log', recordEquipmentLog);
router.post('/sync', batchSyncLogs);
router.get('/history', getRoundsHistory);
router.get('/round/:roundId', getRoundDetails);

export default router;
