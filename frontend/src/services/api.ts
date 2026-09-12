import axios from 'axios';
import { User, Room, Equipment, EquipmentType, InspectionRound, InspectionLog, DashboardSummary } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getMediaUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
  return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Attach JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dc_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if invalid or expired
      localStorage.removeItem('dc_token');
      localStorage.removeItem('dc_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post<{ token: string; user: User; message: string }>('/auth/login', data),
  register: (data: any) => api.post<{ message: string; user: User }>('/auth/register', data),
  getMe: () => api.get<{ user: User }>('/auth/me'),
  getPendingUsers: () => api.get<{ users: User[] }>('/auth/pending'),
  getAllUsers: () => api.get<{ users: User[] }>('/auth/users'),
  updateUserStatus: (userId: string, data: { status: string; role?: string }) =>
    api.patch(`/auth/users/${userId}/status`, data),
  updateUser: (userId: string, data: { fullName?: string; department?: string; username?: string; role?: string; status?: string }) =>
    api.put<{ message: string; user: User }>(`/auth/users/${userId}`, data),
  deleteUser: (userId: string) => api.delete<{ message: string }>(`/auth/users/${userId}`),
};

export const roomApi = {
  getRooms: () => api.get<{ rooms: Room[] }>('/rooms'),
  createRoom: (data: Partial<Room>) => api.post<{ message: string; room: Room }>('/rooms', data),
  updateRoom: (id: string, data: Partial<Room>) => api.put<{ message: string; room: Room }>(`/rooms/${id}`, data),
  deleteRoom: (id: string) => api.delete(`/rooms/${id}`),
};

export const equipmentApi = {
  getTypes: () => api.get<{ types: EquipmentType[] }>('/equipments/types'),
  createType: (data: any) => api.post('/equipments/types', data),
  updateType: (id: string, data: any) => api.put(`/equipments/types/${id}`, data),
  getEquipments: (params?: { roomId?: string; typeId?: string }) =>
    api.get<{ equipments: Equipment[] }>('/equipments', { params }),
  getEquipmentByQr: (qrCode: string) => api.get<{ equipment: Equipment }>(`/equipments/qr/${encodeURIComponent(qrCode)}`),
  createEquipment: (data: any) => api.post<{ message: string; equipment: Equipment }>('/equipments', data),
  updateEquipment: (id: string, data: any) => api.put<{ message: string; equipment: Equipment }>(`/equipments/${id}`, data),
  deleteEquipment: (id: string) => api.delete(`/equipments/${id}`),
};

export const inspectionApi = {
  startRound: (data: { shiftName?: string; notes?: string }) =>
    api.post<{ message: string; round: InspectionRound }>('/inspections/start', data),
  getActiveRound: () => api.get<{ round: InspectionRound | null }>('/inspections/active'),
  completeRound: (roundId: string, notes?: string) =>
    api.post(`/inspections/complete/${roundId}`, { notes }),
  recordLog: (data: {
    roundId: string;
    equipmentId: string;
    readings: Record<string, any>;
    isDefect: boolean;
    defectNote?: string;
    photos?: { photoUrl: string; caption?: string }[];
  }) => api.post('/inspections/log', data),
  deleteEquipmentLog: (roundId: string, equipmentId: string) =>
    api.delete<{ message: string; equipmentId: string }>(`/inspections/round/${roundId}/equipment/${equipmentId}`),
  adminEditLog: (logId: string, data: { readings?: any; isDefect?: boolean; defectNote?: string; reason?: string }) =>
    api.put<{ message: string; log: InspectionLog }>(`/inspections/log/${logId}/admin-edit`, data),
  deleteRound: (roundId: string) =>
    api.delete<{ message: string }>(`/inspections/round/${roundId}`),
  batchSync: (data: { round?: any; logs: any[] }) =>
    api.post<{ message: string; syncedCount: number; roundId: string }>('/inspections/sync', data),
  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get<{ rounds: InspectionRound[]; pagination: any }>('/inspections/history', { params }),
  getRoundDetails: (roundId: string) => api.get<{ round: InspectionRound }>(`/inspections/round/${roundId}`),
};

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>('/dashboard/summary'),
  getTempHumidityTrends: (params?: { roomId?: string; days?: number }) =>
    api.get<{ trends: any[] }>('/dashboard/trends/temp-humidity', { params }),
  getPowerTrends: () => api.get<{ powerTrends: any[] }>('/dashboard/trends/power'),
  getDefects: () => api.get<{ defects: any[] }>('/dashboard/defects'),
};

export const uploadApi = {
  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post<{ photoUrl: string; filename: string }>('/upload/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
