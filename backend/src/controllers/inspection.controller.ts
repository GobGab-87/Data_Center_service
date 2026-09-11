import { Response } from 'express';
import prisma from '../prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const startRound = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shiftName, notes } = req.body;
    const inspectorId = req.user?.id;

    if (!inspectorId) {
      res.status(401).json({ message: 'ไม่ได้เข้าสู่ระบบ' });
      return;
    }

    // Check if there is an in-progress round for this user
    let activeRound = await prisma.inspectionRound.findFirst({
      where: {
        inspectorId,
        status: 'IN_PROGRESS',
      },
      include: {
        logs: {
          include: {
            equipment: true,
            photos: true,
          },
        },
      },
    });

    if (activeRound) {
      res.json({
        message: 'คุณมีรอบตรวจที่กำลังดำเนินการอยู่แล้ว',
        round: activeRound,
      });
      return;
    }

    activeRound = await prisma.inspectionRound.create({
      data: {
        shiftName: shiftName || 'รอบปกติ (Routine)',
        inspectorId,
        notes: notes || null,
        status: 'IN_PROGRESS',
      },
      include: {
        logs: {
          include: {
            equipment: true,
            photos: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'เริ่มรอบการเดินตรวจใหม่สำเร็จ',
      round: activeRound,
    });
  } catch (error: any) {
    console.error('Start round error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเริ่มรอบตรวจ', error: error.message });
  }
};

export const getActiveRound = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inspectorId = req.user?.id;
    if (!inspectorId) {
      res.status(401).json({ message: 'ไม่ได้เข้าสู่ระบบ' });
      return;
    }

    const round = await prisma.inspectionRound.findFirst({
      where: {
        inspectorId,
        status: 'IN_PROGRESS',
      },
      include: {
        logs: {
          include: {
            equipment: {
              include: { room: true, type: true },
            },
            photos: true,
          },
        },
      },
    });

    res.json({ round: round || null });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

export const completeRound = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roundId = req.params.roundId as string;
    const { notes } = req.body;

    const round = await prisma.inspectionRound.update({
      where: { id: roundId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        ...(notes ? { notes } : {}),
      },
    });

    res.json({ message: 'ปิดรอบการเดินตรวจเรียบร้อยแล้ว', round });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการปิดรอบตรวจ', error: error.message });
  }
};

export const recordEquipmentLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roundId, equipmentId, readings, isDefect, defectNote, photos } = req.body;

    if (!roundId || !equipmentId || !readings) {
      res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน (roundId, equipmentId, readings)' });
      return;
    }

    // Check if log already exists for this equipment in this round
    const existingLog = await prisma.inspectionLog.findFirst({
      where: { roundId, equipmentId },
    });

    let log;
    const readingsStr = typeof readings === 'string' ? readings : JSON.stringify(readings);

    if (existingLog) {
      log = await prisma.inspectionLog.update({
        where: { id: existingLog.id },
        data: {
          readings: readingsStr,
          isDefect: Boolean(isDefect),
          defectNote: defectNote || null,
          recordedAt: new Date(),
        },
      });
    } else {
      log = await prisma.inspectionLog.create({
        data: {
          roundId,
          equipmentId,
          readings: readingsStr,
          isDefect: Boolean(isDefect),
          defectNote: defectNote || null,
        },
      });
    }

    // If photos are provided
    if (photos && Array.isArray(photos) && photos.length > 0) {
      for (const photo of photos) {
        if (photo.photoUrl) {
          await prisma.defectPhoto.create({
            data: {
              logId: log.id,
              photoUrl: photo.photoUrl,
              caption: photo.caption || null,
            },
          });
        }
      }
    }

    const fullLog = await prisma.inspectionLog.findUnique({
      where: { id: log.id },
      include: {
        equipment: { include: { room: true, type: true } },
        photos: true,
      },
    });

    res.status(201).json({ message: 'บันทึกข้อมูลอุปกรณ์สำเร็จ', log: fullLog });
  } catch (error: any) {
    console.error('Record log error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกค่า', error: error.message });
  }
};

// ============ Batch Sync (for Offline Mode) ============
export const batchSyncLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { round, logs } = req.body;
    const inspectorId = req.user?.id;

    if (!inspectorId) {
      res.status(401).json({ message: 'ไม่ได้เข้าสู่ระบบ' });
      return;
    }

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      res.status(400).json({ message: 'ไม่มีรายการข้อมูลสำหรับซิงค์' });
      return;
    }

    // Find or create the round
    let targetRoundId = round?.id;
    if (!targetRoundId) {
      const newRound = await prisma.inspectionRound.create({
        data: {
          shiftName: round?.shiftName || 'รอบเดินตรวจ (Offline Sync)',
          inspectorId,
          notes: round?.notes || 'ซิงค์จากโหมดออฟไลน์',
          status: round?.status || 'IN_PROGRESS',
        },
      });
      targetRoundId = newRound.id;
    }

    let syncedCount = 0;
    for (const item of logs) {
      const readingsStr = typeof item.readings === 'string' ? item.readings : JSON.stringify(item.readings);

      const savedLog = await prisma.inspectionLog.create({
        data: {
          roundId: targetRoundId,
          equipmentId: item.equipmentId,
          readings: readingsStr,
          isDefect: Boolean(item.isDefect),
          defectNote: item.defectNote || null,
          recordedAt: item.recordedAt ? new Date(item.recordedAt) : new Date(),
        },
      });

      if (item.photos && Array.isArray(item.photos)) {
        for (const p of item.photos) {
          if (p.photoUrl) {
            await prisma.defectPhoto.create({
              data: {
                logId: savedLog.id,
                photoUrl: p.photoUrl,
                caption: p.caption || null,
              },
            });
          }
        }
      }
      syncedCount++;
    }

    res.json({
      message: `ซิงค์ข้อมูลสำเร็จจำนวน ${syncedCount} รายการ`,
      roundId: targetRoundId,
      syncedCount,
    });
  } catch (error: any) {
    console.error('Batch sync error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการซิงค์ข้อมูล', error: error.message });
  }
};

export const getRoundsHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);

    const [total, rounds] = await Promise.all([
      prisma.inspectionRound.count(),
      prisma.inspectionRound.findMany({
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          inspector: {
            select: { id: true, fullName: true, username: true },
          },
          _count: {
            select: { logs: true },
          },
        },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    res.json({
      rounds,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงประวัติรอบตรวจ', error: error.message });
  }
};

export const getRoundDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roundId = req.params.roundId as string;

    const round = await prisma.inspectionRound.findUnique({
      where: { id: roundId },
      include: {
        inspector: { select: { id: true, fullName: true, username: true } },
        logs: {
          include: {
            equipment: {
              include: { room: true, type: true },
            },
            photos: true,
          },
          orderBy: { recordedAt: 'asc' },
        },
      },
    });

    if (!round) {
      res.status(404).json({ message: 'ไม่พบข้อมูลรอบตรวจนี้' });
      return;
    }

    res.json({ round });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};
