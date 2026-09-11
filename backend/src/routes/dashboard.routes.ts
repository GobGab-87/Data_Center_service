import { Router } from 'express';
import {
  getDashboardSummary,
  getTempHumidityTrends,
  getPowerTrends,
  getRecentDefects,
} from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/summary', getDashboardSummary);
router.get('/trends/temp-humidity', getTempHumidityTrends);
router.get('/trends/power', getPowerTrends);
router.get('/defects', getRecentDefects);

export default router;
