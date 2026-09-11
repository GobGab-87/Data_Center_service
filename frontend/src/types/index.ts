export interface User {
  id: string;
  username: string;
  fullName: string;
  department?: string;
  role: 'ADMIN' | 'OPERATOR';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  floor?: string;
  description?: string;
  _count?: { equipments: number };
  equipments?: Equipment[];
}

export interface FieldConfig {
  key: string;
  label: string;
  type: 'number' | 'text' | 'select';
  unit?: string;
  min?: number;
  max?: number;
  options?: string[];
}

export interface EquipmentType {
  id: string;
  name: string;
  category: 'ELECTRICAL' | 'COOLING' | 'ENVIRONMENT' | 'OTHER';
  fieldsConfig: string | FieldConfig[];
  _count?: { equipments: number };
}

export interface Equipment {
  id: string;
  name: string;
  code: string;
  qrCode: string;
  roomId: string;
  room?: Room;
  typeId: string;
  type?: EquipmentType;
  normalRanges?: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

export interface DefectPhoto {
  id?: string;
  logId?: string;
  photoUrl: string;
  caption?: string;
  uploadedAt?: string;
}

export interface InspectionLog {
  id?: string;
  roundId?: string;
  equipmentId: string;
  equipment?: Equipment;
  readings: Record<string, any>;
  isDefect: boolean;
  defectNote?: string;
  recordedAt?: string;
  photos?: DefectPhoto[];
}

export interface InspectionRound {
  id: string;
  shiftName: string;
  inspectorId: string;
  inspector?: { id: string; fullName: string; username: string };
  status: 'IN_PROGRESS' | 'COMPLETED';
  startedAt: string;
  completedAt?: string;
  notes?: string;
  logs?: InspectionLog[];
  _count?: { logs: number };
}

export interface DashboardSummary {
  totalRooms: number;
  totalEquipments: number;
  roundsToday: number;
  totalDefects: number;
  avgDcTemp: number;
  hotspotCount: number;
  overcoolingCount: number;
}
