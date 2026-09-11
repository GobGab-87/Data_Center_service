import { Request, Response } from 'express';
import prisma from '../prisma.js';

// ============ Equipment Types (Dynamic Fields) ============

export const getEquipmentTypes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const types = await prisma.equipmentType.findMany({
      include: {
        _count: { select: { equipments: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ types });
  } catch (error: any) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลประเภทอุปกรณ์ได้', error: error.message });
  }
};

export const createEquipmentType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, category, fieldsConfig } = req.body;
    if (!name || !fieldsConfig) {
      res.status(400).json({ message: 'กรุณาระบุชื่อประเภทและโครงสร้างฟิลด์วัดค่า' });
      return;
    }

    const type = await prisma.equipmentType.create({
      data: {
        name: name.trim(),
        category: category || 'ELECTRICAL',
        fieldsConfig: typeof fieldsConfig === 'string' ? fieldsConfig : JSON.stringify(fieldsConfig),
      },
    });

    res.status(201).json({ message: 'สร้างประเภทอุปกรณ์สำเร็จ', type });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างประเภทอุปกรณ์', error: error.message });
  }
};

export const updateEquipmentType = async (req: Request, res: Response): Promise<void> => {
  try {
    const typeId = req.params.typeId as string;
    const { name, category, fieldsConfig } = req.body;

    const type = await prisma.equipmentType.update({
      where: { id: typeId },
      data: {
        name: name?.trim(),
        category,
        fieldsConfig: typeof fieldsConfig === 'string' ? fieldsConfig : JSON.stringify(fieldsConfig),
      },
    });

    res.json({ message: 'แก้ไขประเภทอุปกรณ์สำเร็จ', type });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขประเภทอุปกรณ์', error: error.message });
  }
};

// ============ Equipments ============

export const getEquipments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId, typeId } = req.query;

    const where: any = {};
    if (roomId) where.roomId = String(roomId);
    if (typeId) where.typeId = String(typeId);

    const equipments = await prisma.equipment.findMany({
      where,
      include: {
        room: { select: { id: true, name: true, code: true } },
        type: { select: { id: true, name: true, category: true, fieldsConfig: true } },
      },
      orderBy: { code: 'asc' },
    });

    res.json({ equipments });
  } catch (error: any) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลอุปกรณ์ได้', error: error.message });
  }
};

export const getEquipmentByQr = async (req: Request, res: Response): Promise<void> => {
  try {
    const qrCode = String(req.params.qrCode || '');

    const equipment = await prisma.equipment.findFirst({
      where: {
        OR: [
          { qrCode: qrCode.trim() },
          { code: qrCode.trim().toUpperCase() },
        ],
      },
      include: {
        room: true,
        type: true,
      },
    });

    if (!equipment) {
      res.status(404).json({ message: 'ไม่พบอุปกรณ์ที่ตรงกับ QR Code นี้ในระบบ' });
      return;
    }

    res.json({ equipment });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการค้นหาอุปกรณ์', error: error.message });
  }
};

export const createEquipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, roomId, typeId, normalRanges, qrCode } = req.body;

    if (!name || !code || !roomId || !typeId) {
      res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ (ชื่อ, รหัส, ห้อง, ประเภท)' });
      return;
    }

    const generatedQr = qrCode?.trim() || `DCEQ-${code.trim().toUpperCase()}`;

    const equipment = await prisma.equipment.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        qrCode: generatedQr,
        roomId,
        typeId,
        normalRanges: normalRanges ? (typeof normalRanges === 'string' ? normalRanges : JSON.stringify(normalRanges)) : null,
      },
      include: {
        room: true,
        type: true,
      },
    });

    res.status(201).json({ message: 'เพิ่มอุปกรณ์สำเร็จ', equipment });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มอุปกรณ์', error: error.message });
  }
};

export const updateEquipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const equipmentId = req.params.equipmentId as string;
    const { name, code, roomId, typeId, normalRanges, qrCode, status } = req.body;

    const equipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        name: name?.trim(),
        code: code?.trim().toUpperCase(),
        qrCode: qrCode?.trim(),
        roomId,
        typeId,
        status,
        normalRanges: normalRanges ? (typeof normalRanges === 'string' ? normalRanges : JSON.stringify(normalRanges)) : undefined,
      },
      include: {
        room: true,
        type: true,
      },
    });

    res.json({ message: 'แก้ไขอุปกรณ์สำเร็จ', equipment });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขอุปกรณ์', error: error.message });
  }
};

export const deleteEquipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const equipmentId = req.params.equipmentId as string;
    await prisma.equipment.delete({
      where: { id: equipmentId },
    });
    res.json({ message: 'ลบอุปกรณ์สำเร็จ' });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบอุปกรณ์', error: error.message });
  }
};
