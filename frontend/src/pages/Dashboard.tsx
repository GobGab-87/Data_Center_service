import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, roomApi, getMediaUrl } from '../services/api';
import { DashboardSummary, Room } from '../types';
import { ProgressRing } from '../components/ProgressRing';
import {
  Thermometer,
  Zap,
  AlertTriangle,
  Flame,
  Snowflake,
  Activity,
  CheckCircle2,
  RefreshCw,
  TrendingDown,
  Info,
  Calendar,
  ClipboardCheck,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  HelpCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [powerTrends, setPowerTrends] = useState<any[]>([]);
  const [defects, setDefects] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleNavigateWithTransition = (path: string) => {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        navigate(path);
      });
    } else {
      navigate(path);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRoom]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, trendRes, powerRes, defectRes, roomsRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getTempHumidityTrends({ roomId: selectedRoom || undefined }),
        dashboardApi.getPowerTrends(),
        dashboardApi.getDefects(),
        roomApi.getRooms(),
      ]);

      setSummary(sumRes.data);
      setTrends(trendRes.data.trends);
      setPowerTrends(powerRes.data.powerTrends);
      setDefects(defectRes.data.defects);
      setRooms(roomsRes.data.rooms);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      {/* Top Header & Filter with HP Brand Slashes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-hp-hairline">
        <div className="flex items-start gap-3">
          {/* HP Signature Chevron Slashes Motif */}
          <div className="flex items-center gap-1 mt-1">
            <span className="w-1.5 h-6 bg-hp-primary -skew-x-[24deg]" />
            <span className="w-1.5 h-6 bg-hp-primary -skew-x-[24deg]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-hp-ink tracking-tight">
              ศูนย์ควบคุมและวิเคราะห์สภาวะแวดล้อม (Operations & Energy Analytics)
            </h1>
            <p className="text-xs text-hp-graphite mt-1">
              ข้อมูลตรวจวัดสภาวะแวดล้อม กำลังไฟฟ้า และการอนุรักษ์พลังงานในศูนย์ข้อมูลตามมาตรฐาน ASHRAE TC 9.9
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="h-10 px-3.5 rounded-hp-md bg-white border border-hp-steel text-xs text-hp-ink focus:outline-none focus:border-hp-ink shadow-2xs cursor-pointer"
          >
            <option value="">ทุกพื้นที่ในศูนย์ข้อมูล (All Facilities)</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.code})
              </option>
            ))}
          </select>

          <button
            onClick={loadData}
            disabled={loading}
            className="h-10 w-10 rounded-hp-md bg-white hover:bg-hp-cloud border border-hp-steel text-hp-ink transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-hp-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Daily Patrol Cycle Progress Ring - HP Enterprise Style */}
      {(() => {
        const roundsToday = summary?.roundsToday ?? 0;
        const targetRounds = 4;
        const completionPct = Math.min(100, Math.round((roundsToday / targetRounds) * 100));
        const isTargetMet = roundsToday >= targetRounds;

        return (
          <div className="p-6 rounded-hp-xl bg-white border border-hp-hairline shadow-hp-soft flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5 w-full sm:w-auto">
              <ProgressRing
                value={completionPct}
                size={80}
                thickness={8}
                fillColor={isTargetMet ? '#10b981' : '#024ad8'}
                trackColor="#f7f7f7"
                ariaLabel="อัตราความสำเร็จรอบการเดินตรวจ Data Center ประจำวัน"
              >
                <div className="flex flex-col items-center justify-center">
                  <span className="text-base font-medium font-mono tabular-nums text-hp-ink">
                    {completionPct}%
                  </span>
                </div>
              </ProgressRing>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-wide uppercase text-hp-primary bg-hp-primary-soft/40 px-2 py-0.5 rounded-hp-xs">
                    รอบการเดินตรวจวันนี้
                  </span>
                  <span className="text-xs text-hp-graphite font-mono tabular-nums">เป้าหมาย {targetRounds} กะ/วัน</span>
                </div>
                <h2 className="text-lg font-medium text-hp-ink mt-1 text-balance">
                  สถานะการตรวจรอบศูนย์ข้อมูล ({roundsToday}/{targetRounds} รอบ)
                </h2>
                <p className="text-xs text-hp-charcoal mt-0.5 text-pretty">
                  {isTargetMet
                    ? 'ตรวจวัดครบถ้วนทุกช่วงกะตามมาตรฐาน ASHRAE TC 9.9 ประจำวันแล้ว'
                    : 'เจ้าหน้าที่ปฏิบัติการเวรควรบันทึกตรวจวัดอุณหภูมิและความชื้นตามจุดเสี่ยงให้ครบตามรอบ'}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto flex justify-end">
              <button
                onClick={() => handleNavigateWithTransition('/inspection')}
                className="w-full sm:w-auto hp-btn-primary"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>เริ่มบันทึกเดินตรวจรอบ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* KPI Cards Grid (HP Product Card Style: 16px soft radius, Soft Lift shadow, weight 500) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avg DC Temp */}
        <div className="p-5 rounded-hp-xl bg-white border border-hp-hairline shadow-hp-soft hover:border-hp-steel transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-hp-charcoal uppercase tracking-wide">
              อุณหภูมิเฉลี่ยรวม
            </span>
            <div className="w-8 h-8 rounded-hp-md bg-hp-cloud border border-hp-hairline flex items-center justify-center text-hp-primary">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-medium text-hp-ink font-mono tabular-nums">
              {summary?.avgDcTemp ?? '--'}
            </span>
            <span className="text-xs text-hp-graphite font-medium">°C</span>
          </div>
          <div className="mt-2.5 text-[11px] text-emerald-800 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-hp-xs w-fit border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>ASHRAE (18 - 27°C)</span>
          </div>
        </div>

        {/* Hotspots */}
        <div className="p-5 rounded-hp-xl bg-white border border-hp-hairline shadow-hp-soft hover:border-hp-steel transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-hp-charcoal uppercase tracking-wide">
              จุดความร้อนสะสม
            </span>
            <div className="w-8 h-8 rounded-hp-md bg-rose-50 border border-hp-coral/30 flex items-center justify-center text-hp-coral">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-medium font-mono tabular-nums text-hp-ink">
              {summary?.hotspotCount ?? 0}
            </span>
            <span className="text-xs text-hp-graphite">จุดเสี่ยง (&gt; 26°C)</span>
          </div>
          <div className="mt-2.5 text-[11px] font-medium">
            {summary?.hotspotCount ? (
              <span className="text-hp-bloom-deep bg-rose-50 px-2 py-0.5 rounded-hp-xs border border-rose-200">
                ตรวจพบจุดเสี่ยง Airflow
              </span>
            ) : (
              <span className="text-hp-graphite">สภาวะอุณหภูมิปกติ</span>
            )}
          </div>
        </div>

        {/* Overcooling */}
        <div className="p-5 rounded-hp-xl bg-white border border-hp-hairline shadow-hp-soft hover:border-hp-steel transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-hp-charcoal uppercase tracking-wide">
              ทำความเย็นเกิน
            </span>
            <div className="w-8 h-8 rounded-hp-md bg-sky-50 border border-hp-storm-mist/30 flex items-center justify-center text-hp-storm">
              <Snowflake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-medium font-mono tabular-nums text-hp-ink">
              {summary?.overcoolingCount ?? 0}
            </span>
            <span className="text-xs text-hp-graphite">จุดต่ำกว่าเกณฑ์ (&lt; 19°C)</span>
          </div>
          <div className="mt-2.5 text-[11px] text-hp-storm font-medium flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded-hp-xs w-fit border border-sky-200">
            <TrendingDown className="w-3 h-3 text-hp-storm" />
            <span>โอกาสปรับ Setpoint ประหยัดไฟ</span>
          </div>
        </div>

        {/* Defects */}
        <div className="p-5 rounded-hp-xl bg-white border border-hp-hairline shadow-hp-soft hover:border-hp-steel transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-hp-charcoal uppercase tracking-wide">
              ความผิดปกติที่บันทึก
            </span>
            <div className="w-8 h-8 rounded-hp-md bg-hp-cloud border border-hp-hairline flex items-center justify-center text-hp-charcoal">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-medium font-mono tabular-nums text-hp-ink">
              {summary?.totalDefects ?? 0}
            </span>
            <span className="text-xs text-hp-graphite">รายการ</span>
          </div>
          <div className="mt-2.5 text-[11px] text-hp-graphite">
            ตรวจแล้ววันนี้ <span className="font-medium text-hp-ink font-mono">{summary?.roundsToday ?? 0}</span> รอบ
          </div>
        </div>
      </div>

      {/* Energy Efficiency Note Banner (HP Cloud Band #f7f7f7) */}
      <div className="p-5 rounded-hp-xl bg-hp-cloud border border-hp-hairline flex items-start sm:items-center gap-3.5">
        <div className="w-7 h-7 rounded-hp-sm bg-hp-primary-soft/60 flex items-center justify-center text-hp-primary shrink-0 mt-0.5 sm:mt-0">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs text-hp-charcoal leading-relaxed">
          <span className="font-semibold text-hp-ink">ข้อเสนอแนะด้านการประหยัดพลังงาน (Energy Optimization): </span>
          การเพิ่มอุณหภูมิ Setpoint เครื่องปรับอากาศ (CRAC/CRAH) ขึ้น 1°C ในจุดที่ตรวจพบ Overcooling สามารถลดการใช้พลังงานของระบบทำความเย็นได้ประมาณ 4-5% โดยไม่ส่งผลกระทบต่ออุปกรณ์ IT ตามข้อกำหนด ASHRAE TC 9.9
        </div>
      </div>

      {/* Temperature & Humidity Trend Chart */}
      <div className="p-6 sm:p-7 rounded-hp-xl bg-white border border-hp-hairline shadow-hp-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-6">
          <div>
            <h3 className="text-base font-medium text-hp-ink flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-hp-primary" />
              <span>แนวโน้มอุณหภูมิและความชื้นสัมพัทธ์ (Temperature & Humidity Trends)</span>
            </h3>
            <p className="text-xs text-hp-graphite mt-0.5">
              เส้นประสีแดง = เกณฑ์อุณหภูมิสูง Hotspot (26°C), เส้นประสีฟ้า = เกณฑ์อุณหภูมิต่ำ Overcooling (19°C)
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f7f7f7" vertical={false} />
                <XAxis dataKey="displayTime" stroke="#636363" fontSize={11} tickLine={false} />
                <YAxis yAxisId="temp" domain={[15, 32]} stroke="#636363" fontSize={11} tickLine={false} />
                <YAxis yAxisId="hum" orientation="right" domain={[30, 80]} stroke="#636363" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e8e8e8',
                    borderRadius: '4px',
                    color: '#1a1a1a',
                    fontSize: '11px',
                    boxShadow: '0 2px 8px rgba(26, 26, 26, 0.08)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                <ReferenceLine yAxisId="temp" y={26} stroke="#ff5050" strokeDasharray="3 3" label={{ value: 'Hotspot (26°C)', fill: '#b3262b', fontSize: 10 }} />
                <ReferenceLine yAxisId="temp" y={19} stroke="#356373" strokeDasharray="3 3" label={{ value: 'Overcooling (19°C)', fill: '#356373', fontSize: 10 }} />

                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="avgTemp"
                  name="อุณหภูมิเฉลี่ย (°C)"
                  stroke="#024ad8"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#024ad8' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="hum"
                  type="monotone"
                  dataKey="avgHumidity"
                  name="ความชื้นสัมพัทธ์ (%RH)"
                  stroke="#7fadbe"
                  strokeWidth={1.5}
                  dot={{ r: 3, fill: '#7fadbe' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-hp-graphite text-xs">
              ไม่มีข้อมูลการตรวจวัดในช่วงเวลานี้
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Power & Defect Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Power Trends */}
        <div className="p-6 sm:p-7 rounded-hp-xl bg-white border border-hp-hairline shadow-hp-soft">
          <h3 className="text-base font-medium text-hp-ink flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>แนวโน้มกำลังไฟฟ้าที่ใช้งาน (Active Power kW)</span>
          </h3>

          <div className="h-60 w-full">
            {powerTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={powerTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f7f7f7" vertical={false} />
                  <XAxis dataKey="displayTime" stroke="#636363" fontSize={11} tickLine={false} />
                  <YAxis stroke="#636363" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e8e8e8',
                      borderRadius: '4px',
                      fontSize: '11px',
                      boxShadow: '0 2px 8px rgba(26, 26, 26, 0.08)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalKw"
                    name="กำลังไฟฟ้ารวม (kW)"
                    stroke="#024ad8"
                    strokeWidth={2}
                    fill="#c9e0fc"
                    fillOpacity={0.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-hp-graphite text-xs">
                ไม่มีข้อมูลการบันทึกกำลังไฟฟ้า
              </div>
            )}
          </div>
        </div>

        {/* Defect Logs Table */}
        <div className="p-6 sm:p-7 rounded-hp-xl bg-white border border-hp-hairline shadow-hp-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-hp-ink flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-hp-coral" />
              <span>บันทึกความผิดปกติและภาพถ่าย (Defects Log)</span>
            </h3>
            <span className="text-[11px] text-hp-graphite font-medium">ล่าสุด</span>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {defects.length > 0 ? (
              defects.map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-hp-md bg-hp-cloud hover:bg-hp-fog/60 border border-hp-hairline text-xs space-y-1.5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-hp-ink">
                      {d.equipment?.name} <span className="font-mono text-hp-graphite font-normal">({d.equipment?.code})</span>
                    </span>
                    <span className="text-[10px] text-hp-graphite font-mono">
                      {new Date(d.recordedAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className="text-[11px] text-hp-graphite">
                    ห้อง: {d.equipment?.room?.name} • ผู้ตรวจ: {d.round?.inspector?.fullName}
                  </div>
                  <div className="text-xs text-hp-bloom-deep bg-rose-50 p-2 rounded-hp-xs border border-rose-200/60 leading-relaxed">
                    {d.defectNote || 'พบความผิดปกติในการตรวจสอบ'}
                  </div>

                  {d.photos && d.photos.length > 0 && (
                    <div className="flex gap-2 pt-1">
                      {d.photos.map((p: any) => (
                        <img
                          key={p.id}
                          src={getMediaUrl(p.photoUrl)}
                          alt="Defect"
                          onClick={() => setSelectedImage(getMediaUrl(p.photoUrl))}
                          className="w-12 h-12 rounded-hp-md object-cover border border-hp-steel hover:border-hp-ink cursor-pointer shadow-2xs transition-all"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-hp-graphite text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-hp-ink font-medium">ไม่พบรายการความผิดปกติ ระบบอยู่ในเกณฑ์มาตรฐาน</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HP Signature Dark Ink Closing Slab (help-band-dark #1a1a1a) */}
      <div className="bg-hp-ink text-white rounded-hp-xl p-8 sm:p-10 border border-[#292929] flex flex-col md:flex-row items-center justify-between gap-6 shadow-hp-soft">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <ShieldCheck className="w-5 h-5 text-hp-primary-bright" />
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold font-mono">
              DATA CENTER INFRASTRUCTURE STANDARDS
            </span>
          </div>
          <h4 className="text-xl font-medium text-white tracking-tight">
            ต้องการความช่วยเหลือหรือรายงานเหตุฉุกเฉินในศูนย์ข้อมูล?
          </h4>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            ติดต่อศูนย์เฝ้าระวัง Operations Command Center (OCC) โทรสายด่วน 24 ชม. หรืออ้างอิงเกณฑ์ควบคุมสภาพแวดล้อมตามคู่มือ ASHRAE TC 9.9 Thermal Guidelines
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="tel:021234567"
            className="h-11 px-5 rounded-hp-md bg-[#292929] hover:bg-[#3d3d3d] border border-slate-700 text-white text-xs uppercase tracking-hp-btn font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-hp-primary-bright" />
            <span>สายด่วน OCC (Ext. 911)</span>
          </a>
          <button
            onClick={() => handleNavigateWithTransition('/inspection')}
            className="hp-btn-primary"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>เริ่มตรวจรอบ</span>
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hp-ink/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-3xl max-h-[90vh] overflow-hidden rounded-hp-xl border border-hp-hairline bg-white p-4 shadow-hp-modal">
            <img src={selectedImage} alt="Defect" className="max-w-full max-h-[80vh] rounded-hp-lg object-contain" />
            <p className="text-center text-xs text-hp-graphite mt-3">คลิกที่ใดก็ได้เพื่อปิด</p>
          </div>
        </div>
      )}
    </div>
  );
};
