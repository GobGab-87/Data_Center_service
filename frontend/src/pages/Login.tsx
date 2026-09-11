import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon, AlertCircle, Clock, ShieldCheck, Wrench, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPendingNotice, setIsPendingNotice] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPendingNotice(false);
    setLoading(true);

    try {
      await login({ username, password });
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      const status = err.response?.data?.status;

      if (status === 'PENDING') {
        setIsPendingNotice(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-100 font-sans">
      {/* High-Tech Data Center Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url('/images/datacenter_bg.jpg')` }}
      />

      {/* Subtle HP Ambient Film Overlay for optimal contrast */}
      <div className="absolute inset-0 bg-gradient-to-tr from-hp-ink/50 via-hp-ink/25 to-hp-ink/45 backdrop-blur-[1px]" />

      <div className="relative z-10 w-full max-w-lg my-8 flex items-center justify-center">
        {/* HP Hero Promo Card (16px radius, Soft Lift, Pure White Canvas) */}
        <div className="w-full bg-white border border-hp-hairline rounded-hp-xl p-8 sm:p-10 shadow-hp-soft sm:shadow-hp-modal">
          {/* HP Brand Lockup */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center gap-1 mb-3">
              <span className="w-2 h-7 bg-hp-primary -skew-x-[24deg]" />
              <span className="w-2 h-7 bg-hp-primary -skew-x-[24deg]" />
            </div>
            <h1 className="text-2xl font-medium text-hp-ink tracking-tight">
              DATA CENTER OPERATIONS
            </h1>
            <p className="text-xs text-hp-graphite mt-1">
              DCIM Patrol & Routine Inspection Management
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-5 p-3.5 rounded-hp-md bg-rose-50 border border-hp-bloom-deep/30 flex items-start gap-2.5 text-hp-bloom-deep text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isPendingNotice && (
            <div className="mb-5 p-3.5 rounded-hp-md bg-amber-50 border border-amber-300 flex items-start gap-2.5 text-amber-900 text-xs">
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
              <div>
                <p className="font-semibold">บัญชีอยู่ระหว่างรอการอนุมัติสิทธิ์</p>
                <p className="text-amber-800 mt-1">
                  ระบบได้รับคำขอลงทะเบียนแล้ว เจ้าหน้าที่ผู้ดูแลระบบ (Admin) กำลังตรวจสอบสิทธิ์ก่อนเปิดการใช้งาน
                </p>
              </div>
            </div>
          )}

          {/* HP Text Inputs & Form (44px height, 4px sharp radius) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-hp-charcoal mb-1.5 uppercase tracking-wide text-[11px]">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-hp-graphite">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin หรือ technician1"
                  className="w-full h-11 pl-10 pr-3.5 rounded-hp-md bg-white border border-hp-steel text-hp-ink placeholder:text-hp-graphite text-sm focus:outline-none focus:border-hp-ink focus:ring-1 focus:ring-hp-ink transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-hp-charcoal mb-1.5 uppercase tracking-wide text-[11px]">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-hp-graphite">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-3.5 rounded-hp-md bg-white border border-hp-steel text-hp-ink placeholder:text-hp-graphite text-sm focus:outline-none focus:border-hp-ink focus:ring-1 focus:ring-hp-ink transition-all"
                />
              </div>
            </div>

            {/* HP Button Primary (HP Electric Blue #024ad8, 44px, 4px radius, uppercase tracking-hp-btn) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 hp-btn-primary"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังตรวจสอบสิทธิ์...</span>
                </>
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 pt-4 border-t border-hp-hairline text-center">
            <p className="text-xs text-hp-charcoal">
              ยังไม่มีสิทธิ์เข้าใช้งาน?{' '}
              <Link to="/register" className="text-hp-primary hover:text-hp-primary-deep font-semibold transition-colors">
                ลงทะเบียนขอสิทธิ์พนักงาน
              </Link>
            </p>
          </div>

          {/* Quick Demo Switcher Cards */}
          <div className="mt-6 p-4 rounded-hp-lg bg-hp-cloud border border-hp-hairline text-xs">
            <div className="font-semibold text-hp-ink mb-2.5 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-hp-primary" />
              <span>บัญชีทดสอบระบบ (คลิกเพื่อเลือกทันที):</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillDemo('admin', 'admin123')}
                className="p-3 rounded-hp-md bg-white hover:bg-hp-primary-soft/30 border border-hp-hairline hover:border-hp-primary text-left transition-all group cursor-pointer shadow-2xs"
              >
                <div className="font-semibold text-hp-ink flex items-center gap-1.5 group-hover:text-hp-primary">
                  <ShieldCheck className="w-3.5 h-3.5 text-hp-primary" />
                  <span>Admin</span>
                </div>
                <div className="text-[11px] text-hp-graphite font-mono mt-0.5">admin / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('technician1', 'tech123')}
                className="p-3 rounded-hp-md bg-white hover:bg-hp-primary-soft/30 border border-hp-hairline hover:border-hp-primary text-left transition-all group cursor-pointer shadow-2xs"
              >
                <div className="font-semibold text-hp-ink flex items-center gap-1.5 group-hover:text-hp-primary">
                  <Wrench className="w-3.5 h-3.5 text-hp-storm" />
                  <span>Operator</span>
                </div>
                <div className="text-[11px] text-hp-graphite font-mono mt-0.5">technician1 / tech123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
