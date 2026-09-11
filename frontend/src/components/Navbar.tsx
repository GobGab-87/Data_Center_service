import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { offlineDb } from '../services/offlineDb';
import {
  LayoutDashboard,
  ClipboardCheck,
  History,
  LogOut,
  Wifi,
  WifiOff,
  RefreshCw,
  Menu,
  X,
  Server,
  UserCheck,
  MapPin,
  Clock,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerAutoSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkPendingLogs();
    const interval = setInterval(checkPendingLogs, 5000);

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  const checkPendingLogs = async () => {
    const count = await offlineDb.getPendingLogsCount();
    setPendingCount(count);
  };

  const triggerAutoSync = async () => {
    setIsSyncing(true);
    try {
      await offlineDb.syncPendingLogs();
      await checkPendingLogs();
    } finally {
      setIsSyncing(false);
    }
  };

  const navigateWithTransition = (path: string) => {
    if (location.pathname === path) return;
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        navigate(path);
      });
    } else {
      navigate(path);
    }
  };

  const handleLogout = () => {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        logout();
        navigate('/login');
      });
    } else {
      logout();
      navigate('/login');
    }
  };

  const navLinks = [
    { name: 'แดชบอร์ดภาพรวม', path: '/dashboard', icon: LayoutDashboard },
    { name: 'บันทึกเดินตรวจรอบ', path: '/inspection', icon: ClipboardCheck },
    { name: 'ประวัติการตรวจ', path: '/history', icon: History },
  ];

  if (isAdmin) {
    navLinks.push({ name: 'จัดการอุปกรณ์ & QR', path: '/admin/equipments', icon: Server });
    navLinks.push({ name: 'อนุมัติผู้ใช้งาน', path: '/admin/users', icon: UserCheck });
  }

  return (
    <header className="sticky top-0 z-40">
      {/* HP Utility Strip (36px, Dark Ink #1a1a1a) */}
      <div className="bg-hp-ink text-white h-9 px-4 sm:px-6 lg:px-8 text-[11px] sm:text-xs flex items-center justify-between border-b border-[#292929]">
        <div className="flex items-center gap-3 text-slate-300">
          <div className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-3 h-3 text-hp-primary-bright" />
            <span>Facility: DC Campus Zone A (BKK-01)</span>
          </div>
          <span className="hidden md:inline text-slate-600">•</span>
          <div className="hidden md:flex items-center gap-1 font-mono text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{currentTime || '00:00:00'} น.</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Online / Offline Sync status indicator */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[10px] tracking-wide text-slate-300">ONLINE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-300">
                <WifiOff className="w-3 h-3" />
                <span className="font-mono text-[10px] tracking-wide font-semibold">OFFLINE</span>
              </div>
            )}

            {/* Pending Offline Logs Indicator */}
            {pendingCount > 0 && (
              <button
                onClick={triggerAutoSync}
                disabled={!isOnline || isSyncing}
                className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-hp-sm bg-[#292929] hover:bg-[#3d3d3d] border border-amber-500/40 text-amber-300 transition-colors cursor-pointer"
                title="คลิกเพื่อส่งข้อมูลขึ้นระบบ"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>ค้างส่ง ({pendingCount})</span>
              </button>
            )}
          </div>

          <div className="hidden lg:inline text-slate-600">|</div>
          <span className="hidden lg:inline text-[10px] text-slate-400 uppercase tracking-wide font-mono">
            ASHRAE TC 9.9 COMPLIANT
          </span>
        </div>
      </div>

      {/* HP Main Top Nav (64px, Pure Canvas #ffffff with 1px hairline border) */}
      <nav className="bg-white border-b border-hp-hairline shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Lockup with Signature Blue Chevrons */}
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  navigateWithTransition('/dashboard');
                }}
                className="flex items-center gap-3 group"
              >
                {/* HP Signature Parallel Slashes */}
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-6 bg-hp-primary -skew-x-[24deg] transition-transform group-hover:scale-y-105" />
                  <span className="w-1.5 h-6 bg-hp-primary -skew-x-[24deg] transition-transform group-hover:scale-y-105" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tracking-wide text-hp-ink uppercase">
                      DC Operation Service
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-hp-primary bg-hp-primary-soft/40 px-1.5 py-0.2 rounded-hp-xs">
                      Enterprise
                    </span>
                  </div>
                  <span className="text-[11px] text-hp-graphite">
                    ระบบบันทึกและตรวจการ Data Center
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation with HP 2px Electric Blue Underline */}
            <div className="hidden md:flex items-center h-16 space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateWithTransition(link.path);
                    }}
                    className={`h-16 px-4 flex items-center gap-2 text-[13px] transition-colors relative border-b-2 ${
                      isActive
                        ? 'border-hp-primary text-hp-ink font-medium'
                        : 'border-transparent text-hp-charcoal hover:text-hp-ink'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-hp-primary' : 'text-hp-graphite'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right User Profile & Sharp 4px Logout Button */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 border-l border-hp-hairline pl-4">
                <div className="text-right">
                  <div className="text-xs font-medium text-hp-ink">{user?.fullName}</div>
                  <div className="text-[10px] text-hp-graphite">
                    {isAdmin ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่ปฏิบัติการ (Operator)'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="h-8 px-3 rounded-hp-md border border-hp-hairline hover:border-hp-ink text-hp-ink text-[11px] uppercase tracking-hp-btn font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-3.5 h-3.5 text-hp-graphite" />
                  <span>ออก</span>
                </button>
              </div>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-hp-md text-hp-ink hover:bg-hp-cloud transition-colors"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-hp-hairline px-4 pt-2 pb-4 space-y-1 shadow-hp-modal animate-fadeIn">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    navigateWithTransition(link.path);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-hp-md text-sm transition-colors ${
                    isActive
                      ? 'bg-hp-cloud text-hp-primary font-medium border-l-3 border-hp-primary'
                      : 'text-hp-ink hover:bg-hp-cloud'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-hp-primary' : 'text-hp-graphite'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-hp-hairline flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-hp-ink">{user?.fullName}</div>
                <div className="text-[11px] text-hp-graphite">{user?.department || 'Operations'}</div>
              </div>
              <button
                onClick={handleLogout}
                className="h-8 px-3 rounded-hp-md border border-hp-hairline hover:border-hp-ink text-hp-ink text-xs uppercase tracking-hp-btn font-semibold transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
