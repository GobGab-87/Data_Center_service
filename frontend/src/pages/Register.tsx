import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon, Building, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    department: 'Data Center Facilities & Operations',
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);

    try {
      const msg = await register({
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        department: formData.department,
      });
      setSuccessMessage(msg);
    } catch (err: any) {
      setError(err.response?.data?.message || 'การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-hp-cloud font-sans">
      <div className="w-full max-w-md my-8">
        {/* Brand Header with HP Parallel Slashes */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-1 mb-2.5">
            <span className="w-2 h-7 bg-hp-primary -skew-x-[24deg]" />
            <span className="w-2 h-7 bg-hp-primary -skew-x-[24deg]" />
          </div>
          <h1 className="text-2xl font-medium text-hp-ink tracking-tight">ลงทะเบียนขอสิทธิ์ใช้งาน</h1>
          <p className="text-xs text-hp-graphite mt-1">
            Data Center Inspection System Access Request
          </p>
        </div>

        <div className="bg-white border border-hp-hairline rounded-hp-xl p-8 shadow-hp-soft">
          {error && (
            <div className="mb-5 p-3.5 rounded-hp-md bg-rose-50 border border-hp-coral/30 flex items-start gap-2.5 text-hp-bloom-deep text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-medium text-hp-ink">ส่งคำขอลงทะเบียนเรียบร้อย</h3>
              <p className="text-xs text-hp-charcoal leading-relaxed max-w-xs mx-auto">
                {successMessage}
              </p>
              <div className="pt-3">
                <Link
                  to="/login"
                  className="hp-btn-primary inline-flex"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>กลับไปหน้าเข้าสู่ระบบ</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-hp-charcoal mb-1 uppercase tracking-wide text-[11px]">
                  ชื่อ-นามสกุลจริง *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="เช่น นายธนากร มั่นคง"
                  className="w-full h-11 px-3.5 rounded-hp-md bg-white border border-hp-steel text-hp-ink placeholder:text-hp-graphite text-sm focus:outline-none focus:border-hp-ink focus:ring-1 focus:ring-hp-ink transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-hp-charcoal mb-1 uppercase tracking-wide text-[11px]">
                  สังกัด / แผนก / กะการทำงาน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-hp-graphite">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="เช่น แผนก Facilities / กะ A"
                    className="w-full h-11 pl-10 pr-3.5 rounded-hp-md bg-white border border-hp-steel text-hp-ink placeholder:text-hp-graphite text-sm focus:outline-none focus:border-hp-ink focus:ring-1 focus:ring-hp-ink transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-hp-charcoal mb-1 uppercase tracking-wide text-[11px]">
                  ชื่อผู้ใช้งาน (Username) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-hp-graphite">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="เช่น thanakorn_m"
                    className="w-full h-11 pl-10 pr-3.5 rounded-hp-md bg-white border border-hp-steel text-hp-ink placeholder:text-hp-graphite text-sm focus:outline-none focus:border-hp-ink focus:ring-1 focus:ring-hp-ink transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-hp-charcoal mb-1 uppercase tracking-wide text-[11px]">
                    รหัสผ่าน *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-hp-graphite">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="อย่างน้อย 6 ตัว"
                      className="w-full h-11 pl-9 pr-3 rounded-hp-md bg-white border border-hp-steel text-hp-ink placeholder:text-hp-graphite text-sm focus:outline-none focus:border-hp-ink focus:ring-1 focus:ring-hp-ink transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-hp-charcoal mb-1 uppercase tracking-wide text-[11px]">
                    ยืนยันรหัสผ่าน *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-hp-graphite">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="พิมพ์ซ้ำอีกครั้ง"
                      className="w-full h-11 pl-9 pr-3 rounded-hp-md bg-white border border-hp-steel text-hp-ink placeholder:text-hp-graphite text-sm focus:outline-none focus:border-hp-ink focus:ring-1 focus:ring-hp-ink transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="hp-btn-primary w-full mt-3"
              >
                {loading ? 'กำลังบันทึกข้อมูล...' : 'ส่งคำขอลงทะเบียน'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-hp-hairline text-center">
            <Link to="/login" className="text-xs text-hp-primary hover:text-hp-primary-deep font-semibold transition-colors">
              ← กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
