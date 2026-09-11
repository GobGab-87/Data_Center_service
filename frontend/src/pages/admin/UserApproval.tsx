import React, { useState, useEffect } from 'react';
import { authApi } from '../../services/api';
import { User } from '../../types';
import { UserCheck, Shield, Check, X, Clock, AlertCircle, RefreshCw, User as UserIcon } from 'lucide-react';

export const UserApproval: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await authApi.getAllUsers();
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, status: 'APPROVED' | 'REJECTED', role?: string) => {
    try {
      setActionLoading(userId);
      const res = await authApi.updateUserStatus(userId, { status, role });
      setFeedback({ type: 'success', text: res.data.message });
      await loadUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const pendingUsers = users.filter((u) => u.status === 'PENDING');
  const otherUsers = users.filter((u) => u.status !== 'PENDING');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <span>ระบบอนุมัติผู้ใช้งาน (User Access & Permissions)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ตรวจสอบคำขอเข้าใช้งานของพนักงาน และกำหนดระดับสิทธิ์ Admin / Operator
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors self-start text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer font-semibold"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>รีเฟรช</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn bg-white ${
            feedback.type === 'success'
              ? 'border-emerald-200 text-emerald-800'
              : 'border-rose-200 text-rose-800'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* Pending Approval Section */}
      <div className="bg-white border border-amber-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-amber-100 bg-amber-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>รายการที่รอการอนุมัติสิทธิ์ (Pending Approval)</span>
          </div>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-white text-amber-800 border border-amber-200 shadow-2xs">
            {pendingUsers.length} รายการ
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingUsers.length > 0 ? (
            pendingUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{u.fullName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Username: <span className="font-mono font-semibold text-slate-800">{u.username}</span> | แผนก: {u.department || '-'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      ขอสิทธิ์เมื่อ:{' '}
                      {u.createdAt ? new Date(u.createdAt).toLocaleString('th-TH') : '-'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleUpdateStatus(u.id, 'REJECTED')}
                    disabled={actionLoading === u.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>ปฏิเสธ</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(u.id, 'APPROVED', 'OPERATOR')}
                    disabled={actionLoading === u.id}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>อนุมัติ (Operator)</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              ไม่มีผู้ใช้ที่รอการอนุมัติในขณะนี้
            </div>
          )}
        </div>
      </div>

      {/* All Users List */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>บัญชีผู้ใช้งานทั้งหมด ({users.length} คน)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ชื่อ-นามสกุล / Username</th>
                <th className="px-4 py-3">แผนก</th>
                <th className="px-4 py-3">ระดับสิทธิ์ (Role)</th>
                <th className="px-4 py-3">สถานะ (Status)</th>
                <th className="px-4 py-3 text-right">จัดการสิทธิ์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{u.fullName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{u.department || '-'}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        u.role === 'ADMIN'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        u.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : u.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {u.role !== 'ADMIN' ? (
                      <button
                        onClick={() => handleUpdateStatus(u.id, 'APPROVED', 'ADMIN')}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        แต่งตั้งเป็น Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(u.id, 'APPROVED', 'OPERATOR')}
                        className="text-[11px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                      >
                        ปรับเป็น Operator
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
