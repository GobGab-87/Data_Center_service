import { Request, Response } from 'express';
import prisma from '../prisma.js';

export const getRooms = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        _count: {
          select: { equipments: true },
        },
        equipments: {
          select: {
            id: true,
            name: true,
            code: true,
            qrCode: true,
            status: true,
            type: {
              select: { id: true, name: true, category: true, fieldsConfig: true },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });
    res.json({ rooms });
  } catch (error: any) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลห้องได้', error: error.message });
  }
};

export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, floor, description } = req.body;
    if (!name || !code) {
      res.status(400).json({ message: 'กรุณาระบุชื่อห้องและรหัสห้อง' });
      return;
    }

    const existing = await prisma.room.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (existing) {
      res.status(400).json({ message: 'รหัสห้องนี้มีอยู่แล้วในระบบ' });
      return;
    }

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        floor: floor?.trim(),
        description: description?.trim(),
      },
    });

    res.status(201).json({ message: 'เพิ่มห้องสำเร็จ', room });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างห้อง', error: error.message });
  }
};

export const updateRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = req.params.roomId as string;
    const { name, code, floor, description } = req.body;

    const room = await prisma.room.update({
      where: { id: roomId },
      data: {
        name: name?.trim(),
        code: code?.trim().toUpperCase(),
        floor: floor?.trim(),
        description: description?.trim(),
      },
    });

    res.json({ message: 'แก้ไขข้อมูลห้องสำเร็จ', room });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล', error: error.message });
  }
};

export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = req.params.roomId as string;
    await prisma.room.delete({
      where: { id: roomId },
    });
    res.json({ message: 'ลบห้องสำเร็จ' });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบห้อง', error: error.message });
  }
};
