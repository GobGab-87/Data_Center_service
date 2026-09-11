import { Request, Response } from 'express';
import prisma from '../prisma.js';

export const getDashboardSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalRooms,
      totalEquipments,
      roundsToday,
      totalDefects,
      recentLogs,
    ] = await Promise.all([
      prisma.room.count(),
      prisma.equipment.count(),
      prisma.inspectionRound.count({
        where: { startedAt: { gte: today } },
      }),
      prisma.inspectionLog.count({
        where: { isDefect: true },
      }),
      prisma.inspectionLog.findMany({
        take: 50,
        orderBy: { recordedAt: 'desc' },
        include: {
          equipment: { include: { room: true, type: true } },
        },
      }),
    ]);

    // Calculate Hotspots & Overcooling from recent logs
    let totalTemp = 0;
    let tempCount = 0;
    let hotspotCount = 0;
    let overcoolingCount = 0;

    for (const log of recentLogs) {
      try {
        const readings = JSON.parse(log.readings);
        const temp = readings.temp !== undefined ? Number(readings.temp) : (readings.return_temp !== undefined ? Number(readings.return_temp) : null);
        if (temp !== null && !isNaN(temp)) {
          totalTemp += temp;
          tempCount++;
          // ASHRAE / DC guideline: > 26°C is Hotspot risk, < 19°C is Overcooling (energy waste)
          if (temp >= 26.0) hotspotCount++;
          if (temp <= 19.0) overcoolingCount++;
        }
      } catch (e) {
        // ignore parse error
      }
    }

    const avgDcTemp = tempCount > 0 ? (totalTemp / tempCount).toFixed(1) : '22.5';

    res.json({
      totalRooms,
      totalEquipments,
      roundsToday,
      totalDefects,
      avgDcTemp: Number(avgDcTemp),
      hotspotCount,
      overcoolingCount,
    });
  } catch (error: any) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard', error: error.message });
  }
};

export const getTempHumidityTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId, days = '7' } = req.query;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - parseInt(String(days), 10));

    const whereClause: any = {
      recordedAt: { gte: sinceDate },
    };

    if (roomId) {
      whereClause.equipment = { roomId: String(roomId) };
    }

    const logs = await prisma.inspectionLog.findMany({
      where: whereClause,
      include: {
        equipment: { include: { room: true } },
      },
      orderBy: { recordedAt: 'asc' },
    });

    // Group logs into time points for graph
    const trendMap = new Map<string, {
      timestamp: string;
      displayTime: string;
      tempValues: number[];
      humidityValues: number[];
      hotspots: { equipment: string; temp: number }[];
      overcoolings: { equipment: string; temp: number }[];
    }>();

    for (const log of logs) {
      try {
        const readings = JSON.parse(log.readings);
        const temp = readings.temp !== undefined ? Number(readings.temp) : (readings.return_temp !== undefined ? Number(readings.return_temp) : null);
        const hum = readings.humidity !== undefined ? Number(readings.humidity) : null;

        const timeKey = new Date(log.recordedAt).toISOString().slice(0, 13) + ':00'; // group by hour
        const displayTime = new Date(log.recordedAt).toLocaleString('th-TH', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        if (!trendMap.has(timeKey)) {
          trendMap.set(timeKey, {
            timestamp: timeKey,
            displayTime,
            tempValues: [],
            humidityValues: [],
            hotspots: [],
            overcoolings: [],
          });
        }

        const bucket = trendMap.get(timeKey)!;
        if (temp !== null && !isNaN(temp)) {
          bucket.tempValues.push(temp);
          if (temp >= 26.0) bucket.hotspots.push({ equipment: log.equipment.name, temp });
          if (temp <= 19.0) bucket.overcoolings.push({ equipment: log.equipment.name, temp });
        }
        if (hum !== null && !isNaN(hum)) {
          bucket.humidityValues.push(hum);
        }
      } catch (e) {
        // ignore
      }
    }

    const trends = Array.from(trendMap.values()).map(b => ({
      timestamp: b.timestamp,
      displayTime: b.displayTime,
      avgTemp: b.tempValues.length > 0 ? Number((b.tempValues.reduce((a, c) => a + c, 0) / b.tempValues.length).toFixed(1)) : null,
      maxTemp: b.tempValues.length > 0 ? Math.max(...b.tempValues) : null,
      minTemp: b.tempValues.length > 0 ? Math.min(...b.tempValues) : null,
      avgHumidity: b.humidityValues.length > 0 ? Number((b.humidityValues.reduce((a, c) => a + c, 0) / b.humidityValues.length).toFixed(1)) : null,
      hotspotCount: b.hotspots.length,
      overcoolingCount: b.overcoolings.length,
      hotspots: b.hotspots,
      overcoolings: b.overcoolings,
    }));

    res.json({ trends });
  } catch (error: any) {
    console.error('Trends error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลกราฟ', error: error.message });
  }
};

export const getPowerTrends = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 7);

    const logs = await prisma.inspectionLog.findMany({
      where: {
        recordedAt: { gte: sinceDate },
      },
      include: {
        equipment: { include: { type: true, room: true } },
      },
      orderBy: { recordedAt: 'asc' },
    });

    const powerMap = new Map<string, { displayTime: string; totalKw: number; count: number }>();

    for (const log of logs) {
      try {
        const readings = JSON.parse(log.readings);
        const kw = readings.kw !== undefined ? Number(readings.kw) : null;
        if (kw !== null && !isNaN(kw)) {
          const timeKey = new Date(log.recordedAt).toISOString().slice(0, 13) + ':00';
          const displayTime = new Date(log.recordedAt).toLocaleString('th-TH', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
          });

          if (!powerMap.has(timeKey)) {
            powerMap.set(timeKey, { displayTime, totalKw: 0, count: 0 });
          }
          const item = powerMap.get(timeKey)!;
          item.totalKw += kw;
          item.count++;
        }
      } catch (e) {
        // ignore
      }
    }

    const powerTrends = Array.from(powerMap.values()).map(p => ({
      displayTime: p.displayTime,
      totalKw: Number(p.totalKw.toFixed(1)),
      avgKw: Number((p.totalKw / (p.count || 1)).toFixed(1)),
    }));

    res.json({ powerTrends });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

export const getRecentDefects = async (_req: Request, res: Response): Promise<void> => {
  try {
    const defects = await prisma.inspectionLog.findMany({
      where: { isDefect: true },
      take: 20,
      orderBy: { recordedAt: 'desc' },
      include: {
        equipment: { include: { room: true, type: true } },
        round: { include: { inspector: { select: { fullName: true, username: true } } } },
        photos: true,
      },
    });

    res.json({ defects });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดรายการความผิดปกติ', error: error.message });
  }
};
