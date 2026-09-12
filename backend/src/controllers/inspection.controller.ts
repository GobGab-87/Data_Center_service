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

    const round = await prisma.inspectionRound.findUnique({ where: { id: roundId } });
    if (!round) {
      res.status(404).json({ message: 'ไม่พบรอบการเดินตรวจนี้' });
      return;
    }

    if (round.status === 'COMPLETED' && req.user?.role !== 'ADMIN') {
      res.status(403).json({ message: 'รอบการเดินตรวจนี้เสร็จสิ้นและปิดรอบแล้ว ไม่สามารถแก้ไขข้อมูลได้' });
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

// Delete equipment log in an active round (or by Admin)
export const deleteEquipmentLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roundId = req.params.roundId as string;
    const equipmentId = req.params.equipmentId as string;

    const round = await prisma.inspectionRound.findUnique({ where: { id: roundId } });
    if (!round) {
      res.status(404).json({ message: 'ไม่พบรอบการเดินตรวจนี้' });
      return;
    }

    if (round.status === 'COMPLETED' && req.user?.role !== 'ADMIN') {
      res.status(403).json({ message: 'รอบการเดินตรวจนี้ปิดรอบเสร็จสิ้นแล้ว ไม่สามารถลบข้อมูลได้' });
      return;
    }

    const log = await prisma.inspectionLog.findFirst({
      where: { roundId, equipmentId },
    });

    if (!log) {
      res.status(404).json({ message: 'ไม่พบบันทึกการตรวจของอุปกรณ์นี้ในรอบปัจจุบัน' });
      return;
    }

    await prisma.inspectionLog.delete({ where: { id: log.id } });

    res.json({ message: 'ลบผลการตรวจจุดนี้เรียบร้อยแล้ว', equipmentId });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบผลการตรวจ', error: error.message });
  }
};

// Admin Edit with Audit Trail
export const adminEditLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logId = req.params.logId as string;
    const { readings, isDefect, defectNote, reason } = req.body;

    const existingLog = await prisma.inspectionLog.findUnique({
      where: { id: logId },
      include: {
        equipment: { include: { room: true, type: true } },
      },
    });

    if (!existingLog) {
      res.status(404).json({ message: 'ไม่พบบันทึกข้อมูลที่ต้องการแก้ไข' });
      return;
    }

    let oldReadings: any = {};
    try {
      oldReadings = typeof existingLog.readings === 'string' ? JSON.parse(existingLog.readings) : existingLog.readings;
    } catch (e) {}

    const newReadings = readings || oldReadings;
    const newReadingsStr = typeof newReadings === 'string' ? newReadings : JSON.stringify(newReadings);

    // Calculate detailed diff
    const diff: Record<string, { old: any; new: any }> = {};
    const allKeys = Array.from(new Set([...Object.keys(oldReadings), ...Object.keys(newReadings)]));
    for (const key of allKeys) {
      if (oldReadings[key] !== newReadings[key]) {
        diff[key] = { old: oldReadings[key] ?? null, new: newReadings[key] ?? null };
      }
    }

    if (existingLog.isDefect !== Boolean(isDefect)) {
      diff['isDefect'] = { old: existingLog.isDefect, new: Boolean(isDefect) };
    }
    if ((existingLog.defectNote || '') !== (defectNote || '')) {
      diff['defectNote'] = { old: existingLog.defectNote || '', new: defectNote || '' };
    }

    // Parse existing editHistory
    let editHistoryList: any[] = [];
    if (existingLog.editHistory) {
      try {
        editHistoryList = JSON.parse(existingLog.editHistory);
      } catch (e) {
        editHistoryList = [];
      }
    }

    const auditEntry = {
      editedBy: req.user?.username || 'Admin',
      editedAt: new Date().toISOString(),
      reason: reason || 'แก้ไขบันทึกย้อนหลังโดยผู้ดูแลระบบ',
      diff,
    };

    editHistoryList.unshift(auditEntry);

    const updatedLog = await prisma.inspectionLog.update({
      where: { id: logId },
      data: {
        readings: newReadingsStr,
        isDefect: Boolean(isDefect),
        defectNote: defectNote !== undefined ? defectNote : existingLog.defectNote,
        editHistory: JSON.stringify(editHistoryList),
      },
      include: {
        equipment: { include: { room: true, type: true } },
        photos: true,
      },
    });

    res.json({ message: 'บันทึกการแก้ไขและจัดเก็บประวัติ Audit Log เรียบร้อยแล้ว', log: updatedLog });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล', error: error.message });
  }
};

// Admin Delete Entire Round
export const deleteRound = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roundId = req.params.roundId as string;

    const existingRound = await prisma.inspectionRound.findUnique({
      where: { id: roundId },
    });

    if (!existingRound) {
      res.status(404).json({ message: 'ไม่พบรอบการเดินตรวจนี้' });
      return;
    }

    await prisma.inspectionRound.delete({
      where: { id: roundId },
    });

    res.json({ message: `ลบรอบการเดินตรวจ ${existingRound.shiftName} เรียบร้อยแล้ว` });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบรอบตรวจ', error: error.message });
  }
};

