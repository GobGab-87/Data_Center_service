import React, { useState, useEffect } from 'react';
import { authApi } from '../../services/api';
import { User } from '../../types';
import {
  UserCheck,
  Shield,
  Check,
  X,
  Clock,
  AlertCircle,
  RefreshCw,
  User as UserIcon,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export const UserApproval: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<{
    fullName: string;
    employeeId: string;
    department: string;
    username: string;
    role: 'ADMIN' | 'OPERATOR';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  }>({
    fullName: '',
    employeeId: '',
    department: '',
    username: '',
    role: 'OPERATOR',
    status: 'APPROVED',
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);

  // Delete Confirmation State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

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

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName || '',
      employeeId: user.employeeId || '',
      department: user.department || '',
      username: user.username || '',
      role: user.role || 'OPERATOR',
      status: user.status || 'APPROVED',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setEditLoading(true);
      const res = await authApi.updateUser(editingUser.id, editForm);
      setFeedback({ type: 'success', text: res.data.message || 'บันทึกการแก้ไขข้อมูลผู้ใช้สำเร็จ' });
      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' });
    } finally {
      setEditLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setDeleteLoading(true);
      const res = await authApi.deleteUser(deletingUser.id);
      setFeedback({ type: 'success', text: res.data.message || 'ลบผู้ใช้งานสำเร็จ' });
      setDeletingUser(null);
      await loadUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน' });
    } finally {
      setDeleteLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const pendingUsers = users.filter((u) => u.status === 'PENDING');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hp-hairline pb-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-1 mt-1">
            <span className="w-1.5 h-6 bg-hp-primary -skew-x-[24deg]" />
            <span className="w-1.5 h-6 bg-hp-primary -skew-x-[24deg]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-hp-ink flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-hp-primary" />
              <span>ระบบอนุมัติผู้ใช้งาน (User Access & Permissions)</span>
            </h1>
            <p className="text-xs text-hp-graphite mt-1">
              ตรวจสอบคำขอเข้าใช้งาน แก้ไขข้อมูลผู้ใช้ กำหนดระดับสิทธิ์ และลบบัญชีผู้ใช้งานในระบบ
            </p>
          </div>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="h-9 px-3.5 rounded-hp-md bg-white hover:bg-hp-cloud border border-hp-steel text-hp-ink transition-colors self-start text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer font-semibold"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-hp-primary' : ''}`} />
          <span>รีเฟรช</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-hp-md border text-xs flex items-center gap-2 animate-fadeIn bg-white ${
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
      <div className="bg-white border border-amber-200 rounded-hp-xl shadow-hp-soft overflow-hidden">
        <div className="p-4 border-b border-amber-100 bg-amber-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>รายการที่รอการอนุมัติสิทธิ์ (Pending Approval)</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-hp-xs text-[11px] font-mono font-bold bg-white text-amber-800 border border-amber-200 shadow-2xs">
            {pendingUsers.length} รายการ
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingUsers.length > 0 ? (
            pendingUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-hp-cloud transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-hp-md bg-hp-cloud border border-hp-hairline flex items-center justify-center text-hp-primary shrink-0 shadow-2xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-hp-ink text-sm flex items-center gap-2">
                      <span>{u.fullName}</span>
                      {u.employeeId && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-hp-xs bg-hp-cloud text-hp-primary border border-hp-hairline font-semibold">
                          ID: {u.employeeId}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-hp-graphite mt-0.5">
                      Username: <span className="font-mono font-semibold text-hp-ink">{u.username}</span> | แผนก: {u.department || '-'}
                    </div>
                    <div className="text-[11px] text-hp-graphite font-mono mt-0.5">
                      ขอสิทธิ์เมื่อ:{' '}
                      {u.createdAt ? new Date(u.createdAt).toLocaleString('th-TH') : '-'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => openEditModal(u)}
                    className="px-3 py-1.5 rounded-hp-md text-xs font-semibold text-hp-ink hover:bg-hp-cloud border border-hp-steel transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="แก้ไขข้อมูล"
                  >
                    <Pencil className="w-3.5 h-3.5 text-hp-graphite" />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(u.id, 'REJECTED')}
                    disabled={actionLoading === u.id}
                    className="px-3 py-1.5 rounded-hp-md text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>ปฏิเสธ</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(u.id, 'APPROVED', 'OPERATOR')}
                    disabled={actionLoading === u.id}
                    className="px-3.5 py-1.5 rounded-hp-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>อนุมัติ (Operator)</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-hp-graphite text-xs">
              ไม่มีผู้ใช้ที่รอการอนุมัติในขณะนี้
            </div>
          )}
        </div>
      </div>

      {/* All Users List */}
      <div className="bg-white border border-hp-hairline rounded-hp-xl shadow-hp-soft overflow-hidden">
        <div className="p-4 border-b border-hp-hairline bg-hp-cloud flex items-center justify-between">
          <div className="flex items-center gap-2 text-hp-ink font-semibold text-xs sm:text-sm">
            <Shield className="w-4 h-4 text-hp-primary" />
            <span>บัญชีผู้ใช้งานทั้งหมด ({users.length} คน)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-hp-charcoal">
            <thead className="bg-hp-cloud text-hp-graphite font-semibold border-b border-hp-hairline">
              <tr>
                <th className="px-4 py-3">ชื่อ-นามสกุล / Username</th>
                <th className="px-4 py-3">แผนก</th>
                <th className="px-4 py-3">ระดับสิทธิ์ (Role)</th>
                <th className="px-4 py-3">สถานะ (Status)</th>
                <th className="px-4 py-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hp-hairline">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-hp-cloud/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-hp-ink flex items-center gap-1.5">
                      <span>{u.fullName}</span>
                      {u.employeeId && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-hp-xs bg-hp-cloud border border-hp-hairline text-hp-primary font-semibold">
                          {u.employeeId}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-hp-graphite font-mono">@{u.username}</div>
                  </td>
                  <td className="px-4 py-3.5 text-hp-charcoal">{u.department || '-'}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-hp-xs text-[10px] font-mono font-semibold ${
                        u.role === 'ADMIN'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-hp-cloud text-hp-charcoal border border-hp-hairline'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-hp-xs text-[10px] font-mono font-semibold ${
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
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 rounded-hp-sm hover:bg-hp-cloud text-hp-ink border border-hp-steel transition-colors cursor-pointer"
                        title="แก้ไขข้อมูลผู้ใช้"
                      >
                        <Pencil className="w-3.5 h-3.5 text-hp-primary" />
                      </button>
                      <button
                        onClick={() => setDeletingUser(u)}
                        className="p-1.5 rounded-hp-sm hover:bg-rose-50 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                        title="ลบผู้ใช้นี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hp-ink/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-hp-hairline rounded-hp-xl shadow-hp-modal overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-hp-hairline bg-hp-cloud">
              <div className="flex items-center gap-2 text-hp-ink font-semibold">
                <Pencil className="w-4 h-4 text-hp-primary" />
                <span>แก้ไขข้อมูลผู้ใช้งาน: {editingUser.fullName}</span>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-hp-graphite hover:text-hp-ink hover:bg-hp-fog rounded-hp-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-hp-ink mb-1">
                    ชื่อ - นามสกุล *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-hp-md bg-white border border-hp-steel text-hp-ink text-xs focus:outline-none focus:border-hp-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-hp-ink mb-1">
                    รหัสพนักงาน (Employee ID)
                  </label>
                  <input
                    type="text"
                    value={editForm.employeeId}
                    onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                    placeholder="เช่น EMP-001"
                    className="w-full h-10 px-3.5 rounded-hp-md bg-white border border-hp-steel text-hp-ink text-xs focus:outline-none focus:border-hp-ink font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-hp-ink mb-1">
                    ชื่อผู้ใช้ (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-hp-md bg-white border border-hp-steel text-hp-ink text-xs focus:outline-none focus:border-hp-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-hp-ink mb-1">
                    แผนก / ฝ่ายงาน
                  </label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-hp-md bg-white border border-hp-steel text-hp-ink text-xs focus:outline-none focus:border-hp-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-hp-ink mb-1">
                    ระดับสิทธิ์ (Role)
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                    className="w-full h-10 px-3.5 rounded-hp-md bg-white border border-hp-steel text-hp-ink text-xs focus:outline-none focus:border-hp-ink cursor-pointer"
                  >
                    <option value="OPERATOR">OPERATOR (ผู้ตรวจการ)</option>
                    <option value="ADMIN">ADMIN (ผู้ดูแลระบบ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-hp-ink mb-1">
                    สถานะการใช้งาน (Status)
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full h-10 px-3.5 rounded-hp-md bg-white border border-hp-steel text-hp-ink text-xs focus:outline-none focus:border-hp-ink cursor-pointer"
                  >
                    <option value="APPROVED">APPROVED (อนุมัติใช้งาน)</option>
                    <option value="PENDING">PENDING (รออนุมัติ)</option>
                    <option value="REJECTED">REJECTED (ระงับ / ไม่อนุมัติ)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-hp-hairline flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="h-10 px-4 rounded-hp-md border border-hp-steel text-hp-ink text-xs font-semibold hover:bg-hp-cloud transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="hp-btn-primary h-10 px-5 text-xs"
                >
                  {editLoading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hp-ink/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-rose-200 rounded-hp-xl shadow-hp-modal overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-hp-md bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-hp-ink">ยืนยันการลบบัญชีผู้ใช้</h3>
                <p className="text-xs text-hp-graphite">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <p className="text-xs text-hp-charcoal leading-relaxed bg-hp-cloud p-3 rounded-hp-md border border-hp-hairline">
              ต้องการลบบัญชีของ <strong className="text-hp-ink">{deletingUser.fullName}</strong> (@{deletingUser.username}) ออกจากระบบอย่างถาวรหรือไม่?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="h-9 px-4 rounded-hp-md border border-hp-steel text-hp-ink text-xs font-semibold hover:bg-hp-cloud transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="h-9 px-4 rounded-hp-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteLoading ? 'กำลังลบ...' : 'ยืนยันลบผู้ใช้'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
