import Dexie, { type EntityTable } from 'dexie';
import { Room, Equipment, InspectionLog } from '../types';
import { inspectionApi } from './api';

export interface PendingLogItem {
  id?: number;
  roundId?: string;
  equipmentId: string;
  equipmentName: string;
  roomName: string;
  readings: Record<string, any>;
  isDefect: boolean;
  defectNote?: string;
  photos?: { photoUrl: string; caption?: string }[];
  recordedAt: string;
}

// Define Dexie Database
const db = new Dexie('DCOpsOfflineDB') as Dexie & {
  cachedRooms: EntityTable<Room, 'id'>;
  cachedEquipments: EntityTable<Equipment, 'id'>;
  pendingLogs: EntityTable<PendingLogItem, 'id'>;
};

db.version(1).stores({
  cachedRooms: 'id, code, name',
  cachedEquipments: 'id, code, qrCode, roomId, typeId',
  pendingLogs: '++id, equipmentId, recordedAt',
});

export const offlineDb = {
  // Cache rooms
  async cacheRooms(rooms: Room[]) {
    await db.cachedRooms.clear();
    await db.cachedRooms.bulkPut(rooms);
  },

  async getCachedRooms(): Promise<Room[]> {
    return await db.cachedRooms.toArray();
  },

  // Cache equipments
  async cacheEquipments(equipments: Equipment[]) {
    await db.cachedEquipments.clear();
    await db.cachedEquipments.bulkPut(equipments);
  },

  async getCachedEquipments(roomId?: string): Promise<Equipment[]> {
    if (roomId) {
      return await db.cachedEquipments.where('roomId').equals(roomId).toArray();
    }
    return await db.cachedEquipments.toArray();
  },

  async findEquipmentByQr(qrCode: string): Promise<Equipment | undefined> {
    return await db.cachedEquipments.where('qrCode').equals(qrCode.trim()).first() ||
           await db.cachedEquipments.where('code').equals(qrCode.trim().toUpperCase()).first();
  },

  // Pending logs for offline sync
  async savePendingLog(item: Omit<PendingLogItem, 'id'>) {
    const id = await db.pendingLogs.add(item);
    return id;
  },

  async getPendingLogsCount(): Promise<number> {
    return await db.pendingLogs.count();
  },

  async getAllPendingLogs(): Promise<PendingLogItem[]> {
    return await db.pendingLogs.toArray();
  },

  async clearPendingLogs() {
    await db.pendingLogs.clear();
  },

  // Auto sync process
  async syncPendingLogs(): Promise<{ success: boolean; syncedCount: number; message: string }> {
    if (!navigator.onLine) {
      return { success: false, syncedCount: 0, message: 'ขณะนี้อยู่ในโหมดออฟไลน์ ไม่สามารถซิงค์ได้' };
    }

    const logs = await db.pendingLogs.toArray();
    if (logs.length === 0) {
      return { success: true, syncedCount: 0, message: 'ไม่มีข้อมูลค้างซิงค์' };
    }

    try {
      const payload = {
        round: { shiftName: 'รอบเดินตรวจ (Auto Sync จากโหมดออฟไลน์)' },
        logs: logs.map(l => ({
          equipmentId: l.equipmentId,
          readings: l.readings,
          isDefect: l.isDefect,
          defectNote: l.defectNote,
          recordedAt: l.recordedAt,
          photos: l.photos,
        })),
      };

      const res = await inspectionApi.batchSync(payload);
      await db.pendingLogs.clear();
      return { success: true, syncedCount: res.data.syncedCount, message: res.data.message };
    } catch (error: any) {
      console.error('Offline sync failed:', error);
      return { success: false, syncedCount: 0, message: error.response?.data?.message || 'การซิงค์ล้มเหลว' };
    }
  },
};

export default db;
