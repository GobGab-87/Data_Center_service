import { Router } from 'express';
import {
  getEquipmentTypes,
  createEquipmentType,
  updateEquipmentType,
  getEquipments,
  getEquipmentByQr,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from '../controllers/equipment.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Types
router.get('/types', authenticate, getEquipmentTypes);
router.post('/types', authenticate, requireAdmin, createEquipmentType);
router.put('/types/:typeId', authenticate, requireAdmin, updateEquipmentType);

// Equipments
router.get('/', authenticate, getEquipments);
router.get('/qr/:qrCode', authenticate, getEquipmentByQr);
router.post('/', authenticate, requireAdmin, createEquipment);
router.put('/:equipmentId', authenticate, requireAdmin, updateEquipment);
router.delete('/:equipmentId', authenticate, requireAdmin, deleteEquipment);

export default router;
