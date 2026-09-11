import { Router } from 'express';
import { upload, handlePhotoUpload } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/photo', upload.single('photo'), handlePhotoUpload);

export default router;
