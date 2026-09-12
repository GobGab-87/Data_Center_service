import React, { useState, useEffect, useRef } from 'react';
import { roomApi, equipmentApi, inspectionApi, uploadApi } from '../services/api';
import { offlineDb } from '../services/offlineDb';
import { Room, Equipment, EquipmentType, InspectionRound, FieldConfig } from '../types';
import { QRScannerModal } from '../components/QRScannerModal';
import { ProgressRing } from '../components/ProgressRing';
import {
  Camera,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Building,
  Server,
  Upload,
  Clock,
  X,
  RefreshCw,
  WifiOff,
  ListChecks,
  ChevronRight,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';

export const Inspection: React.FC = () => {
  // State
  const [activeRound, setActiveRound] = useState<InspectionRound | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // Form Readings & Defect
  const [readings, setReadings] = useState<Record<string, any>>({});
  const [isDefect, setIsDefect] = useState<boolean>(false);
  const [defectNote, setDefectNote] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Checklist Filter & UI states
  const [checklistFilter, setChecklistFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});

  // Status & Modals
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'offline'; text: string } | null>(null);
  const [newShiftName, setNewShiftName] = useState('กะเช้า (08:00 - 16:00 น.)');
  const [recordedEquipmentIds, setRecordedEquipmentIds] = useState<Set<string>>(new Set());
  const [recordedDataMap, setRecordedDataMap] = useState<Record<string, {
    readings: Record<string, any>;
    isDefect: boolean;
    defectNote?: string;
    photoPreview?: string | null;
  }>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    initInspection();
  }, []);

  const showToast = (type: 'success' | 'error' | 'offline', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const initInspection = async () => {
    setLoading(true);
    try {
      const dataMap: Record<string, any> = {};
      const loggedIds = new Set<string>();

      try {
        const roundRes = await inspectionApi.getActiveRound();
        if (roundRes.data.round) {
          setActiveRound(roundRes.data.round);
          roundRes.data.round.logs?.forEach((l) => {
            loggedIds.add(l.equipmentId);
            try {
              dataMap[l.equipmentId] = {
                readings: typeof l.readings === 'string' ? JSON.parse(l.readings) : l.readings,
                isDefect: l.isDefect,
                defectNote: l.defectNote || '',
                photoPreview: l.photos?.[0]?.photoUrl || null,
              };
            } catch (e) {}
          });
        }
      } catch (e) {
        console.warn('Offline or round fetch error');
      }

      // Also restore from offline pending logs
      try {
        const pending = await offlineDb.getAllPendingLogs();
        pending.forEach((l) => {
          loggedIds.add(l.equipmentId);
          dataMap[l.equipmentId] = {
            readings: l.readings,
            isDefect: l.isDefect,
            defectNote: l.defectNote || '',
            photoPreview: l.photos?.[0]?.photoUrl || null,
          };
        });
      } catch (e) {}

      setRecordedEquipmentIds(loggedIds);
      setRecordedDataMap(dataMap);

      let loadedRooms: Room[] = [];
      if (navigator.onLine) {
        const roomsRes = await roomApi.getRooms();
        loadedRooms = roomsRes.data.rooms;
        setRooms(loadedRooms);
        await offlineDb.cacheRooms(loadedRooms);

        const eqRes = await equipmentApi.getEquipments();
        await offlineDb.cacheEquipments(eqRes.data.equipments);
      } else {
        loadedRooms = await offlineDb.getCachedRooms();
        setRooms(loadedRooms);
      }

      const initialExpanded: Record<string, boolean> = {};
      loadedRooms.forEach((r) => {
        initialExpanded[r.id] = true;
      });
      setExpandedRooms(initialExpanded);

      const allEqs = loadedRooms.flatMap((r) => r.equipments || []);
      if (allEqs.length > 0) {
        selectEquipment(allEqs[0], dataMap);
      }
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectEquipment = (eq: Equipment, customDataMap?: Record<string, any>) => {
    setSelectedEquipment(eq);
    const mapToUse = customDataMap || recordedDataMap;
    const saved = mapToUse[eq.id];

    if (saved) {
      setReadings(saved.readings ? { ...saved.readings } : {});
      setIsDefect(Boolean(saved.isDefect));
      setDefectNote(saved.defectNote || '');
      setPhotoPreview(saved.photoPreview || null);
      setPhotoFile(null);
    } else {
      setReadings({});
      setIsDefect(false);
      setDefectNote('');
      setPhotoFile(null);
      setPhotoPreview(null);
    }

    if (eq.roomId) {
      setExpandedRooms((prev) => ({ ...prev, [eq.roomId]: true }));
    }
  };

  const toggleRoomExpand = (roomId: string) => {
    setExpandedRooms((prev) => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  const handleStartRound = async () => {
    setLoading(true);
    try {
      const res = await inspectionApi.startRound({ shiftName: newShiftName });
      setActiveRound(res.data.round);
      showToast('success', 'เริ่มรอบการเดินตรวจเรียบร้อยแล้ว');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'ไม่สามารถเริ่มรอบตรวจได้');
    } finally {
      setLoading(false);
    }
  };

  // Helper stats
  const allEquipmentsList = rooms.flatMap((r) =>
    (r.equipments || []).map((eq) => ({
      ...eq,
      roomName: r.name,
      roomId: r.id,
      roomCode: r.code,
    }))
  );
  const totalEquipmentsCount = allEquipmentsList.length;
  const loggedEquipmentsCount = allEquipmentsList.filter((eq) => recordedEquipmentIds.has(eq.id)).length;
  const overallPercent = totalEquipmentsCount > 0 ? Math.round((loggedEquipmentsCount / totalEquipmentsCount) * 100) : 0;

  const getRoomStats = (room: Room) => {
    const roomEqs = room.equipments || [];
    const total = roomEqs.length;
    const logged = roomEqs.filter((eq) => recordedEquipmentIds.has(eq.id)).length;
    const isComplete = total > 0 && logged === total;
    const isPartial = logged > 0 && !isComplete;
    const percent = total > 0 ? Math.round((logged / total) * 100) : 0;
    return { total, logged, isComplete, isPartial, percent };
  };

  const completedRoomsCount = rooms.filter((r) => getRoomStats(r).isComplete).length;
  const isAllRoomsComplete = rooms.length > 0 && completedRoomsCount === rooms.length;
  const nextUninspectedEquipment = allEquipmentsList.find((eq) => !recordedEquipmentIds.has(eq.id));

  const handleCompleteRound = async () => {
    if (!activeRound) return;

    const uninspected = allEquipmentsList.filter((eq) => !recordedEquipmentIds.has(eq.id));

    if (uninspected.length > 0) {
      const uninspectedSummary = uninspected
        .map((eq) => `• [${eq.roomCode}] ${eq.name}`)
        .slice(0, 8)
        .join('\n');
      const moreCount = uninspected.length > 8 ? `\n...และอีก ${uninspected.length - 8} รายการ` : '';

      const confirmMsg =
        `แจ้งเตือน: การเดินตรวจยังไม่ครบถ้วนทุกจุด\n\n` +
        `สถานะปัจจุบัน: ตรวจแล้ว ${completedRoomsCount}/${rooms.length} ห้อง (${loggedEquipmentsCount}/${totalEquipmentsCount} อุปกรณ์)\n\n` +
        `รายการที่ยังไม่ได้บันทึก:\n${uninspectedSummary}${moreCount}\n\n` +
        `ต้องการยืนยันการปิดรอบตรวจก่อนกำหนดหรือไม่?`;

      if (!window.confirm(confirmMsg)) return;
    } else {
      if (
        !window.confirm(
          `การเดินตรวจครบถ้วนทุกรายการ (${totalEquipmentsCount}/${totalEquipmentsCount} อุปกรณ์)\n\nต้องการยืนยันการปิดรอบตรวจนี้หรือไม่?`
        )
      ) {
        return;
      }
    }

    setLoading(true);
    try {
      await inspectionApi.completeRound(activeRound.id);
      setActiveRound(null);
      setRecordedEquipmentIds(new Set());
      showToast('success', 'ปิดรอบการเดินตรวจเรียบร้อยแล้ว');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'เกิดข้อผิดพลาดในการปิดรอบ');
    } finally {
      setLoading(false);
    }
  };

  const handleQrScanned = async (code: string) => {
    try {
      let found: Equipment | undefined;
      if (navigator.onLine) {
        const res = await equipmentApi.getEquipmentByQr(code);
        found = res.data.equipment;
      } else {
        found = await offlineDb.findEquipmentByQr(code);
      }

      if (found) {
        selectEquipment(found);
        showToast('success', `ระบุอุปกรณ์: ${found.name} (${found.code})`);
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        showToast('error', `ไม่พบข้อมูลอุปกรณ์รหัส "${code}" ในระบบ`);
      }
    } catch (err) {
      showToast('error', `ไม่พบอุปกรณ์สำหรับรหัส QR: ${code}`);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
              setPhotoFile(compressedFile);
              setPhotoPreview(URL.createObjectURL(blob));
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) return;

    setLoading(true);

    try {
      let photoUrl: string | undefined;

      if (navigator.onLine && photoFile) {
        try {
          const uploadRes = await uploadApi.uploadPhoto(photoFile);
          photoUrl = uploadRes.data.photoUrl;
        } catch (uploadErr) {
          console.error('Photo upload failed', uploadErr);
        }
      }

      // Auto-start active round if user records while online but no round is active yet
      let currentRound = activeRound;
      if (navigator.onLine && !currentRound) {
        try {
          const autoRoundRes = await inspectionApi.startRound({
            shiftName: newShiftName || 'รอบเดินตรวจ (กำลังดำเนินการ)',
          });
          currentRound = autoRoundRes.data.round;
          setActiveRound(currentRound);
        } catch (roundErr) {
          console.warn('Auto start round error', roundErr);
        }
      }

      const logPayload = {
        roundId: currentRound?.id || 'temp-round',
        equipmentId: selectedEquipment.id,
        equipmentName: selectedEquipment.name,
        roomName: rooms.find((r) => r.id === selectedEquipment.roomId)?.name || '',
        readings,
        isDefect,
        defectNote: isDefect ? defectNote : undefined,
        photos: photoUrl ? [{ photoUrl }] : (photoPreview ? [{ photoUrl: photoPreview }] : undefined),
        recordedAt: new Date().toISOString(),
      };

      // Save into memory map so clicking this equipment always retains the values
      setRecordedDataMap((prev) => ({
        ...prev,
        [selectedEquipment.id]: {
          readings: { ...readings },
          isDefect,
          defectNote,
          photoPreview: photoPreview || photoUrl || null,
        },
      }));

      if (navigator.onLine && currentRound) {
        await inspectionApi.recordLog(logPayload);
        setRecordedEquipmentIds((prev) => new Set(prev).add(selectedEquipment.id));
        showToast('success', `บันทึกข้อมูล ${selectedEquipment.name} สำเร็จ`);
      } else {
        await offlineDb.savePendingLog(logPayload);
        setRecordedEquipmentIds((prev) => new Set(prev).add(selectedEquipment.id));
        showToast(
          'offline',
          `บันทึกข้อมูลในโหมดออฟไลน์แล้ว ระบบจะนำส่งข้อมูลอัตโนมัติเมื่อเชื่อมต่อเครือข่าย`
        );
      }

      const remainingEqs = allEquipmentsList.filter(
        (eq) => !recordedEquipmentIds.has(eq.id) && eq.id !== selectedEquipment.id
      );
      if (remainingEqs.length > 0) {
        selectEquipment(remainingEqs[0]);
      } else {
        setIsDefect(false);
        setDefectNote('');
        setPhotoFile(null);
        setPhotoPreview(null);
      }
    } catch (err: any) {
      console.error('Save log error:', err);
      showToast('error', err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  let fields: FieldConfig[] = [];
  if (selectedEquipment?.type?.fieldsConfig) {
    try {
      fields =
        typeof selectedEquipment.type.fieldsConfig === 'string'
          ? JSON.parse(selectedEquipment.type.fieldsConfig)
          : selectedEquipment.type.fieldsConfig;
    } catch (e) {
      fields = [];
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-3.5 rounded-xl shadow-lg flex items-center gap-3 border text-xs sm:text-sm animate-fadeIn bg-white ${
            toastMessage.type === 'success'
              ? 'border-emerald-200 text-emerald-800'
              : toastMessage.type === 'offline'
              ? 'border-amber-200 text-amber-800'
              : 'border-rose-200 text-rose-800'
          }`}
        >
          {toastMessage.type === 'offline' ? (
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span className="font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner: Round Controls & Overall Progress */}
      <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {activeRound ? (
          <div className="flex items-center gap-4 flex-1">
            <ProgressRing
              value={overallPercent}
              size={56}
              thickness={5}
              fillColor={isAllRoomsComplete ? '#10b981' : '#2563eb'}
              trackColor="#f1f5f9"
              ariaLabel="ความคืบหน้าการตรวจรอบปัจจุบัน"
            >
              <span className="text-xs font-bold font-mono tabular-nums text-slate-900">
                {overallPercent}%
              </span>
            </ProgressRing>

            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  รอบการเดินตรวจ: {activeRound.shiftName}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  เริ่มตรวจ: {new Date(activeRound.startedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                </span>
                <span>•</span>
                <span className="text-slate-700 font-medium">
                  เสร็จสิ้น {completedRoomsCount} จาก {rooms.length} ห้อง
                </span>
                <span>•</span>
                <span className="text-blue-700 font-mono font-semibold">
                  {loggedEquipmentsCount} / {totalEquipmentsCount} อุปกรณ์
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-600" />
              <span>ยังไม่มีรอบตรวจที่กำลังดำเนินการ</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เลือกรอบเวลาการเดินตรวจเพื่อเริ่มต้นบันทึกผล
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsQrOpen(true)}
            className="h-10 px-4 rounded-hp-md bg-white hover:bg-hp-cloud border border-hp-steel text-hp-ink text-xs uppercase tracking-hp-btn font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-hp-primary" />
            <span>สแกน QR Code</span>
          </button>

          {activeRound ? (
            <button
              onClick={handleCompleteRound}
              disabled={loading}
              className={`h-10 px-5 rounded-hp-md text-xs uppercase tracking-hp-btn font-semibold transition-all flex items-center gap-2 shadow-2xs cursor-pointer ${
                isAllRoomsComplete
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-white hover:bg-hp-cloud border border-hp-steel text-hp-ink'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isAllRoomsComplete ? 'ปิดรอบการตรวจ (ครบถ้วน)' : 'เสร็จสิ้นและปิดรอบ'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={newShiftName}
                onChange={(e) => setNewShiftName(e.target.value)}
                className="h-10 px-3 rounded-hp-md bg-white border border-hp-steel text-xs text-hp-ink shadow-2xs cursor-pointer focus:outline-none focus:border-hp-ink"
              >
                <option value="กะเช้า (08:00 - 16:00 น.)">กะเช้า (08:00 - 16:00 น.)</option>
                <option value="กะบ่าย (16:00 - 24:00 น.)">กะบ่าย (16:00 - 24:00 น.)</option>
                <option value="กะดึก (00:00 - 08:00 น.)">กะดึก (00:00 - 08:00 น.)</option>
              </select>
              <button
                onClick={handleStartRound}
                disabled={loading}
                className="hp-btn-primary h-10 px-4 text-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>เริ่มรอบตรวจ</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Direct Equipment Selector Bar */}
      <div className="p-4 rounded-hp-xl bg-white border border-hp-hairline shadow-hp-soft flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-hp-charcoal uppercase tracking-wide shrink-0">
          <Server className="w-4 h-4 text-hp-primary" />
          <span>เลือกอุปกรณ์:</span>
        </div>

        <div className="relative flex-1">
          <select
            value={selectedEquipment?.id || ''}
            onChange={(e) => {
              const found = allEquipmentsList.find((eq) => eq.id === e.target.value);
              if (found) selectEquipment(found);
            }}
            className="w-full h-10 px-3.5 rounded-hp-md bg-white border border-hp-steel text-hp-ink text-xs sm:text-sm focus:outline-none focus:border-hp-ink cursor-pointer"
          >
            <option value="" disabled>-- เลือกอุปกรณ์ที่ต้องการตรวจสอบ --</option>
            {rooms.map((room) => (
              <optgroup key={room.id} label={`ห้อง: ${room.name} (${room.code})`}>
                {(room.equipments || []).map((eq) => {
                  const isLogged = recordedEquipmentIds.has(eq.id);
                  return (
                    <option key={eq.id} value={eq.id}>
                      {isLogged ? '[ตรวจแล้ว] ' : '[รอตรวจ] '} {eq.name} ({eq.code})
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
        </div>

        {nextUninspectedEquipment && (
          <button
            type="button"
            onClick={() => selectEquipment(nextUninspectedEquipment)}
            className="h-10 px-4 rounded-hp-md bg-hp-cloud hover:bg-hp-fog border border-hp-steel text-hp-ink text-xs uppercase tracking-hp-btn font-semibold flex items-center justify-center gap-2 shrink-0 transition-colors cursor-pointer shadow-2xs"
          >
            <span>ตรวจจุดถัดไป</span>
            <ArrowRight className="w-3.5 h-3.5 text-hp-primary" />
          </button>
        )}
      </div>

      {/* Main Checklist & Form Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT: Complete Checklist */}
        <div className="lg:col-span-5 bg-white border border-hp-hairline rounded-hp-xl shadow-hp-soft overflow-hidden flex flex-col">
          {/* Header & Filter */}
          <div className="p-4 border-b border-hp-hairline bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-hp-primary" />
                <h3 className="font-semibold text-xs text-hp-ink uppercase tracking-wider">
                  รายการตรวจประจำรอบ (Checklist)
                </h3>
              </div>
              <span className="text-[11px] font-mono font-medium text-hp-ink px-2 py-0.5 rounded-hp-xs bg-hp-cloud border border-hp-hairline shadow-2xs">
                {loggedEquipmentsCount}/{totalEquipmentsCount}
              </span>
            </div>

            {/* Filter Tabs (HP category-tab style: rounded-full) */}
            <div className="flex items-center gap-1 p-1 bg-hp-cloud rounded-full border border-hp-hairline text-xs">
              <button
                type="button"
                onClick={() => setChecklistFilter('ALL')}
                className={`flex-1 py-1.5 px-2 rounded-full text-xs font-semibold transition-all ${
                  checklistFilter === 'ALL'
                    ? 'bg-hp-ink text-white shadow-2xs'
                    : 'text-hp-charcoal hover:text-hp-ink'
                }`}
              >
                ทั้งหมด ({totalEquipmentsCount})
              </button>
              <button
                type="button"
                onClick={() => setChecklistFilter('PENDING')}
                className={`flex-1 py-1.5 px-2 rounded-full text-xs font-semibold transition-all ${
                  checklistFilter === 'PENDING'
                    ? 'bg-hp-ink text-white shadow-2xs'
                    : 'text-hp-charcoal hover:text-hp-ink'
                }`}
              >
                ยังไม่ตรวจ ({totalEquipmentsCount - loggedEquipmentsCount})
              </button>
              <button
                type="button"
                onClick={() => setChecklistFilter('COMPLETED')}
                className={`flex-1 py-1.5 px-2 rounded-full text-xs font-semibold transition-all ${
                  checklistFilter === 'COMPLETED'
                    ? 'bg-hp-ink text-white shadow-2xs'
                    : 'text-hp-charcoal hover:text-hp-ink'
                }`}
              >
                ตรวจแล้ว ({loggedEquipmentsCount})
              </button>
            </div>
          </div>

          {/* Rooms and Equipments List */}
          <div className="max-h-[calc(100vh-290px)] overflow-y-auto p-2 space-y-3">
            {rooms.map((room) => {
              const stats = getRoomStats(room);
              const isExpanded = expandedRooms[room.id] ?? true;

              let visibleEqs = room.equipments || [];
              if (checklistFilter === 'PENDING') {
                visibleEqs = visibleEqs.filter((eq) => !recordedEquipmentIds.has(eq.id));
              } else if (checklistFilter === 'COMPLETED') {
                visibleEqs = visibleEqs.filter((eq) => recordedEquipmentIds.has(eq.id));
              }

              if (visibleEqs.length === 0 && checklistFilter !== 'ALL') {
                return null;
              }

              return (
                <div
                  key={room.id}
                  className="rounded-hp-xl bg-white border border-hp-hairline shadow-hp-soft p-3 space-y-2"
                >
                  <div
                    onClick={() => toggleRoomExpand(room.id)}
                    className="cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-4 bg-hp-primary rounded-hp-xs shrink-0" />
                      <span className="text-xs font-bold text-hp-ink tracking-tight uppercase">{room.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-hp-xs bg-hp-cloud text-hp-charcoal border border-hp-hairline">
                        {room.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono">
                      <span className={`px-2 py-0.5 rounded-hp-xs font-semibold ${
                        stats.isComplete
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-hp-cloud text-hp-graphite border border-hp-hairline'
                      }`}>
                        {stats.logged}/{stats.total}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-hp-steel" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-hp-steel" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="grid grid-cols-1 gap-1.5 pt-1">
                      {visibleEqs.map((eq) => {
                        const isLogged = recordedEquipmentIds.has(eq.id);
                        const isSelected = selectedEquipment?.id === eq.id;

                        return (
                          <div
                            key={eq.id}
                            onClick={() => selectEquipment(eq)}
                            className={`p-2.5 rounded-hp-md cursor-pointer transition-all flex items-center justify-between gap-2 border ${
                              isSelected
                                ? 'bg-white border-hp-primary ring-2 ring-hp-primary/20 shadow-hp-soft'
                                : isLogged
                                ? 'bg-hp-cloud/50 border-hp-hairline/80 text-hp-graphite hover:bg-hp-cloud'
                                : 'bg-white border-hp-hairline text-hp-ink hover:border-hp-steel'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                isLogged ? 'bg-emerald-600 text-white' : 'border border-hp-steel bg-white'
                              }`}>
                                {isLogged && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-hp-ink truncate">{eq.name}</div>
                                <div className="text-[10px] text-hp-graphite font-mono">{eq.code}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] shrink-0">
                              {isLogged ? (
                                <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-hp-xs">ตรวจแล้ว</span>
                              ) : (
                                <span className="text-hp-graphite">รอตรวจ</span>
                              )}
                              <ChevronRight className={`w-3 h-3 ${isSelected ? 'text-hp-primary' : 'text-hp-steel'}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Active Form */}
        <div ref={formRef} className="lg:col-span-7">
          {selectedEquipment ? (
            <form
              onSubmit={handleSaveLog}
              className="p-6 sm:p-7 rounded-hp-xl bg-white border border-hp-hairline shadow-hp-soft space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-hp-hairline">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-medium text-hp-ink">{selectedEquipment.name}</h3>
                    <span className="px-2 py-0.5 rounded-hp-xs text-[10px] font-mono bg-hp-cloud text-hp-ink border border-hp-hairline font-medium">
                      {selectedEquipment.code}
                    </span>
                    {recordedEquipmentIds.has(selectedEquipment.id) && (
                      <span className="text-[10px] text-emerald-800 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-hp-xs border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        บันทึกแล้ว (แสดงค่าที่บันทึกไว้)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-hp-graphite mt-1">
                    ห้อง: {rooms.find((r) => r.id === selectedEquipment.roomId)?.name} • หมวดหมู่: {selectedEquipment.type?.name}
                  </p>
                </div>

                <div className="text-[11px] font-mono text-hp-charcoal bg-hp-cloud px-3 py-1 rounded-hp-sm border border-hp-hairline flex items-center gap-1.5 shadow-2xs">
                  <QrCode className="w-3.5 h-3.5 text-hp-primary" />
                  <span>{selectedEquipment.qrCode}</span>
                </div>
              </div>

              {/* Dynamic Measurement Fields */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-hp-charcoal mb-3">
                  พารามิเตอร์การตรวจวัด (Measurements)
                </h4>

                {fields.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fields.map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <label className="block text-xs text-hp-ink font-medium">
                          {f.label} {f.unit ? `(${f.unit})` : ''}
                        </label>
                        <div className="relative">
                          <input
                            type={f.type === 'number' ? 'number' : 'text'}
                            step="any"
                            required
                            value={readings[f.key] ?? ''}
                            onChange={(e) =>
                              setReadings({
                                ...readings,
                                [f.key]:
                                  f.type === 'number'
                                    ? parseFloat(e.target.value) || ''
                                    : e.target.value,
                              })
                            }
                            placeholder={`ระบุค่า ${f.unit || ''}`}
                            className="w-full h-11 px-3.5 rounded-hp-md bg-white border border-hp-steel text-hp-ink placeholder:text-hp-graphite text-sm focus:outline-none focus:border-hp-ink focus:ring-1 focus:ring-hp-ink transition-all"
                          />
                          {f.unit && (
                            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-hp-graphite font-mono pointer-events-none">
                              {f.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-hp-md bg-hp-cloud border border-hp-hairline text-xs text-hp-graphite">
                    ไม่มีรายการวัดค่าเฉพาะสำหรับอุปกรณ์นี้
                  </div>
                )}
              </div>

              {/* Defect Reporting */}
              <div className="pt-4 border-t border-hp-hairline space-y-3">
                <div className="flex items-center justify-between p-4 rounded-hp-md bg-hp-cloud border border-hp-hairline">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className={`w-4 h-4 ${isDefect ? 'text-hp-coral' : 'text-hp-graphite'}`} />
                    <div>
                      <div className="text-xs font-semibold text-hp-ink">
                        รายงานความผิดปกติ / Defect
                      </div>
                      <div className="text-[11px] text-hp-graphite">
                        เปิดเพื่อระบุอาการและแนบภาพถ่ายจุดชำรุด
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDefect}
                    onChange={(e) => setIsDefect(e.target.checked)}
                    className="w-4 h-4 rounded border-hp-steel text-hp-primary focus:ring-hp-primary cursor-pointer"
                  />
                </div>

                {isDefect && (
                  <div className="p-4 rounded-hp-md bg-rose-50/60 border border-hp-coral/30 space-y-3 animate-fadeIn">
                    <div>
                      <label className="block text-xs text-hp-bloom-deep font-semibold mb-1">
                        รายละเอียดอาการหรือความผิดปกติที่พบ *
                      </label>
                      <textarea
                        rows={3}
                        required={isDefect}
                        value={defectNote}
                        onChange={(e) => setDefectNote(e.target.value)}
                        placeholder="ระบุอาการผิดปกติ เช่น มีเสียงดังผิดปกติ, อุณหภูมิสูง, สายไฟชำรุด หรือมีน้ำรั่วซึม"
                        className="w-full p-3 rounded-hp-md bg-white border border-hp-coral/40 text-hp-ink placeholder:text-hp-graphite text-xs focus:outline-none focus:border-hp-bloom-deep focus:ring-1 focus:ring-hp-bloom-deep"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-hp-bloom-deep font-semibold mb-1">
                        ภาพถ่ายหลักฐาน (บีบอัดอัตโนมัติก่อนนำส่ง)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={fileInputRef}
                        onChange={handlePhotoCapture}
                        className="hidden"
                      />

                      {photoPreview ? (
                        <div className="relative inline-block mt-1">
                          <img
                            src={photoPreview}
                            alt="Defect Preview"
                            className="w-28 h-28 object-cover rounded-hp-md border border-hp-coral/40 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoFile(null);
                              setPhotoPreview(null);
                            }}
                            className="absolute -top-1.5 -right-1.5 p-1 bg-white text-hp-bloom-deep rounded-full border border-hp-coral/40 hover:bg-rose-50 shadow-xs cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-10 px-4 rounded-hp-md bg-white hover:bg-hp-cloud border border-hp-steel text-hp-ink text-xs uppercase tracking-hp-btn font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-hp-primary" />
                          <span>ถ่ายรูปหรือเลือกไฟล์ภาพ</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-hp-hairline flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="hp-btn-primary w-full sm:w-auto"
                >
                  {loading ? (
                    <span>กำลังบันทึกข้อมูล...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{recordedEquipmentIds.has(selectedEquipment.id) ? 'อัปเดตผลการตรวจสอบ' : 'บันทึกผลการตรวจสอบ'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-12 text-center bg-white rounded-hp-xl border border-hp-hairline shadow-hp-soft text-hp-graphite text-xs">
              <ListChecks className="w-8 h-8 text-hp-steel mx-auto mb-2" />
              <p className="font-medium text-hp-ink">เลือกอุปกรณ์จากรายการทางซ้าย หรือสแกน QR Code เพื่อเริ่มบันทึก</p>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        onScanSuccess={handleQrScanned}
      />
    </div>
  );
};
