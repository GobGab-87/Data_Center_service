import React, { useState, useEffect } from 'react';
import { inspectionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { InspectionRound, InspectionLog } from '../types';
import {
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  X,
  Server,
  Trash2,
  Pencil,
  History as HistoryIcon,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';

export const InspectionHistory: React.FC = () => {
  const { isAdmin } = useAuth();
  const [rounds, setRounds] = useState<InspectionRound[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRound, setSelectedRound] = useState<InspectionRound | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin Delete Round
  const [isDeletingRound, setIsDeletingRound] = useState<boolean>(false);
  const [deleteRoundLoading, setDeleteRoundLoading] = useState<boolean>(false);

  // Admin Edit Log
  const [editingLog, setEditingLog] = useState<InspectionLog | null>(null);
  const [editLogForm, setEditLogForm] = useState<{
    readings: Record<string, any>;
    isDefect: boolean;
    defectNote: string;
    reason: string;
  }>({
    readings: {},
    isDefect: false,
    defectNote: '',
    reason: '',
  });
  const [editLogLoading, setEditLogLoading] = useState<boolean>(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await inspectionApi.getHistory({ page: 1, limit: 30 });
      setRounds(res.data.rounds);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (roundId: string) => {
    try {
      const res = await inspectionApi.getRoundDetails(roundId);
      setSelectedRound(res.data.round);
      setDetailModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDeleteRound = async () => {
    if (!selectedRound) return;
    try {
      setDeleteRoundLoading(true);
      const res = await inspectionApi.deleteRound(selectedRound.id);
      showFeedback('success', res.data.message || 'ลบรอบการเดินตรวจสำเร็จ');
      setIsDeletingRound(false);
      setDetailModalOpen(false);
      setSelectedRound(null);
      await loadHistory();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบรอบการเดินตรวจ');
    } finally {
      setDeleteRoundLoading(false);
    }
  };

  const openEditLog = (log: InspectionLog) => {
    let readingsObj: Record<string, any> = {};
    try {
      readingsObj = typeof log.readings === 'string' ? JSON.parse(log.readings) : log.readings;
    } catch (e) {}

    setEditingLog(log);
    setEditLogForm({
      readings: { ...readingsObj },
      isDefect: Boolean(log.isDefect),
      defectNote: log.defectNote || '',
      reason: '',
    });
  };

  const handleSaveEditLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    try {
      setEditLogLoading(true);
      const res = await inspectionApi.adminEditLog(editingLog.id!, editLogForm);
      showFeedback('success', 'แก้ไขบันทึกและบันทึก Audit Log สำเร็จ');

      // Update in selectedRound state
      if (selectedRound && selectedRound.logs) {
        setSelectedRound({
          ...selectedRound,
          logs: selectedRound.logs.map((l) => (l.id === editingLog.id ? res.data.log : l)),
        });
      }
      setEditingLog(null);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'เกิดข้อผิดพลาดในการแก้ไขบันทึก');
    } finally {
      setEditLogLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-hp-md border text-xs flex items-center gap-2 animate-fadeIn bg-white shadow-xs fixed bottom-5 right-5 z-50 ${
            feedback.type === 'success'
              ? 'border-emerald-200 text-emerald-800'
              : 'border-rose-200 text-rose-800'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* Header with HP Parallel Slashes */}
      <div className="border-b border-hp-hairline pb-5">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-1 mt-1">
            <span className="w-1.5 h-6 bg-hp-primary -skew-x-[24deg]" />
            <span className="w-1.5 h-6 bg-hp-primary -skew-x-[24deg]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-hp-ink tracking-tight">
              ประวัติรอบการเดินตรวจ (Inspection Audit Log)
            </h1>
            <p className="text-xs text-hp-graphite mt-1">
              บันทึกการตรวจวัดอุปกรณ์และรายงานจุดบกพร่องย้อนหลังตามระเบียบ Data Center มาตรฐาน ASHRAE TC 9.9
            </p>
          </div>
        </div>
      </div>

      {/* Rounds List (HP Card Style: 16px soft radius, hairline border, soft lift) */}
      <div className="bg-white border border-hp-hairline rounded-hp-xl shadow-hp-soft overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-hp-graphite text-xs">กำลังโหลดประวัติ...</div>
        ) : rounds.length > 0 ? (
          <div className="divide-y divide-hp-hairline">
            {rounds.map((r) => (
              <div
                key={r.id}
                onClick={() => handleViewDetails(r.id)}
                className="p-5 hover:bg-hp-cloud cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-hp-md bg-hp-cloud border border-hp-hairline flex items-center justify-center text-hp-primary shrink-0 mt-0.5 shadow-2xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-medium text-hp-ink">
                        {r.shiftName}
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-hp-xs font-mono font-medium ${
                          r.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {r.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-hp-graphite mt-1.5">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-hp-graphite" />
                        <span>ผู้ตรวจ: <strong className="text-hp-charcoal font-medium">{r.inspector?.fullName}</strong></span>
                      </div>
                      <div className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-hp-graphite" />
                        <span>
                          {new Date(r.startedAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <div className="text-hp-charcoal font-medium">
                        อุปกรณ์ที่ตรวจ: <span className="font-mono text-hp-ink font-semibold">{r._count?.logs ?? 0}</span> รายการ
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-hp-charcoal hover:text-hp-ink font-medium">
                  <span className="hidden sm:inline uppercase tracking-hp-btn text-[11px] font-semibold">ดูบันทึก</span>
                  <ChevronRight className="w-4 h-4 text-hp-primary shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-hp-graphite text-xs">
            ยังไม่มีประวัติการเดินตรวจในระบบ
          </div>
        )}
      </div>

      {/* Round Details Modal */}
      {detailModalOpen && selectedRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hp-ink/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-hp-hairline rounded-hp-xl shadow-hp-modal flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-hp-hairline bg-hp-cloud">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-medium text-hp-ink">
                    บันทึกรอบตรวจ: {selectedRound.shiftName}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-hp-xs font-mono font-medium ${
                      selectedRound.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {selectedRound.status}
                  </span>
                </div>
                <p className="text-xs text-hp-graphite mt-0.5 font-mono">
                  Inspector: {selectedRound.inspector?.fullName} | Started:{' '}
                  {new Date(selectedRound.startedAt).toLocaleString('th-TH')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setIsDeletingRound(true)}
                    className="h-8 px-3 rounded-hp-md bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="ลบรอบการตรวจนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ลบรอบตรวจนี้</span>
                  </button>
                )}
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-2 text-hp-graphite hover:text-hp-ink hover:bg-hp-fog rounded-hp-md transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Table of Equipment Logs */}
            <div className="p-6 overflow-y-auto space-y-4">
              {selectedRound.notes && (
                <div className="p-4 rounded-hp-md bg-hp-cloud border border-hp-hairline text-xs text-hp-charcoal">
                  <span className="font-semibold text-hp-ink">หมายเหตุประจำรอบ: </span>
                  {selectedRound.notes}
                </div>
              )}

              <div className="space-y-4">
                {selectedRound.logs && selectedRound.logs.length > 0 ? (
                  selectedRound.logs.map((log) => {
                    let readingsObj: Record<string, any> = {};
                    try {
                      readingsObj = typeof log.readings === 'string' ? JSON.parse(log.readings) : log.readings;
                    } catch (e) {}

                    let auditList: any[] = [];
                    if (log.editHistory) {
                      try {
                        auditList = JSON.parse(log.editHistory);
                      } catch (e) {}
                    }

                    return (
                      <div
                        key={log.id}
                        className={`p-5 rounded-hp-md border transition-all ${
                          log.isDefect
                            ? 'bg-rose-50/50 border-hp-coral/30'
                            : 'bg-white border-hp-hairline shadow-2xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-base font-medium text-hp-ink">
                              {log.equipment?.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-hp-xs bg-hp-cloud text-hp-ink font-mono font-medium border border-hp-hairline">
                              {log.equipment?.code}
                            </span>
                            {log.isDefect && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-hp-xs bg-rose-100 text-hp-bloom-deep font-semibold border border-hp-coral/40">
                                <AlertTriangle className="w-3 h-3 text-hp-coral" />
                                Defect ตรวจพบข้อบกพร่อง
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-hp-graphite">
                              ห้อง: {log.equipment?.room?.name}
                            </span>
                            {isAdmin && (
                              <button
                                onClick={() => openEditLog(log)}
                                className="h-7 px-2.5 rounded-hp-sm bg-white hover:bg-hp-cloud border border-hp-steel text-hp-ink text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                title="แก้ไขข้อมูลจุดนี้ (Admin Audit)"
                              >
                                <Pencil className="w-3 h-3 text-hp-primary" />
                                <span>แก้ไข</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Readings Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5 pt-3.5 border-t border-hp-hairline text-xs">
                          {Object.entries(readingsObj).map(([key, val]) => (
                            <div key={key} className="p-3 rounded-hp-md bg-hp-cloud border border-hp-hairline">
                              <div className="text-[10px] text-hp-graphite font-mono uppercase">{key}</div>
                              <div className="font-semibold text-hp-ink mt-0.5 font-mono tabular-nums">{String(val)}</div>
                            </div>
                          ))}
                        </div>

                        {/* Defect note & photos */}
                        {log.isDefect && (
                          <div className="mt-3.5 pt-2 text-xs text-hp-bloom-deep">
                            <div className="font-semibold mb-1">รายละเอียดข้อบกพร่อง:</div>
                            <p className="p-3 rounded-hp-md bg-white border border-hp-coral/40 text-hp-ink leading-relaxed">
                              {log.defectNote || '-'}
                            </p>
                            {log.photos && log.photos.length > 0 && (
                              <div className="flex gap-2.5 mt-3">
                                {log.photos.map((p) => (
                                  <img
                                    key={p.id}
                                    src={p.photoUrl}
                                    alt="Defect Record"
                                    onClick={() => setSelectedImage(p.photoUrl)}
                                    className="w-16 h-16 rounded-hp-md object-cover border border-hp-steel hover:border-hp-ink cursor-pointer shadow-2xs transition-all"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Audit Trail History Box */}
                        {auditList.length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-hp-hairline/80">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-hp-primary mb-2">
                              <HistoryIcon className="w-3.5 h-3.5" />
                              <span>ประวัติการแก้ไขโดยผู้ดูแลระบบ (Audit Trail Log)</span>
                            </div>
                            <div className="space-y-2">
                              {auditList.map((entry, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-hp-md bg-hp-cloud border border-hp-hairline text-xs space-y-1"
                                >
                                  <div className="flex flex-wrap items-center justify-between text-[11px] text-hp-graphite">
                                    <span>
                                      แก้ไขโดย: <strong className="text-hp-ink">{entry.editedBy}</strong>
                                    </span>
                                    <span className="font-mono">
                                      {new Date(entry.editedAt).toLocaleString('th-TH')}
                                    </span>
                                  </div>
                                  {entry.reason && (
                                    <div className="text-hp-charcoal text-[11px]">
                                      <span className="font-medium text-hp-ink">เหตุผล: </span>
                                      {entry.reason}
                                    </div>
                                  )}
                                  {entry.diff && Object.keys(entry.diff).length > 0 && (
                                    <div className="pt-1 mt-1 border-t border-hp-hairline/60 flex flex-wrap gap-2 text-[11px] font-mono">
                                      {Object.entries(entry.diff).map(([k, d]: [string, any]) => (
                                        <span
                                          key={k}
                                          className="px-2 py-0.5 rounded-hp-xs bg-white border border-hp-hairline text-hp-ink"
                                        >
                                          <strong>{k}</strong>: <span className="text-rose-600 line-through">{String(d.old)}</span> → <span className="text-emerald-700 font-bold">{String(d.new)}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-hp-graphite text-xs">
                    ไม่มีรายการบันทึกอุปกรณ์ในรอบนี้
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit Log Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hp-ink/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-hp-hairline rounded-hp-xl shadow-hp-modal overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-hp-hairline bg-hp-cloud">
              <div>
                <h3 className="text-base font-semibold text-hp-ink flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-hp-primary" />
                  <span>แก้ไขบันทึกผลตรวจ: {editingLog.equipment?.name}</span>
                </h3>
                <p className="text-xs text-hp-graphite font-mono">
                  {editingLog.equipment?.code} • {editingLog.equipment?.room?.name}
                </p>
              </div>
              <button
                onClick={() => setEditingLog(null)}
                className="p-1.5 text-hp-graphite hover:text-hp-ink hover:bg-hp-fog rounded-hp-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLog} className="p-6 space-y-4">
              {/* Readings Inputs */}
              <div>
                <label className="block text-xs font-semibold text-hp-ink mb-2 uppercase tracking-wide">
                  พารามิเตอร์ตรวจวัด (Readings)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {Object.keys(editLogForm.readings).map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-28 text-xs font-mono text-hp-graphite uppercase truncate">
                        {key}:
                      </span>
                      <input
                        type="text"
                        value={editLogForm.readings[key] ?? ''}
                        onChange={(e) =>
                          setEditLogForm({
                            ...editLogForm,
                            readings: {
                              ...editLogForm.readings,
                              [key]: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value),
                            },
                          })
                        }
                        className="flex-1 h-9 px-3 rounded-hp-md bg-white border border-hp-steel text-hp-ink text-xs font-mono focus:outline-none focus:border-hp-ink"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Defect Toggle */}
              <div className="pt-3 border-t border-hp-hairline space-y-2">
                <div className="flex items-center justify-between p-3 rounded-hp-md bg-hp-cloud border border-hp-hairline">
                  <span className="text-xs font-semibold text-hp-ink">พบข้อบกพร่อง (Defect)</span>
                  <input
                    type="checkbox"
                    checked={editLogForm.isDefect}
                    onChange={(e) => setEditLogForm({ ...editLogForm, isDefect: e.target.checked })}
                    className="w-4 h-4 rounded border-hp-steel text-hp-primary cursor-pointer"
                  />
                </div>

                {editLogForm.isDefect && (
                  <div>
                    <label className="block text-xs text-hp-bloom-deep font-semibold mb-1">
                      รายละเอียดข้อบกพร่อง *
                    </label>
                    <textarea
                      rows={2}
                      value={editLogForm.defectNote}
                      onChange={(e) => setEditLogForm({ ...editLogForm, defectNote: e.target.value })}
                      placeholder="ระบุอาการผิดปกติ"
                      className="w-full p-2.5 rounded-hp-md bg-white border border-hp-coral/40 text-hp-ink text-xs focus:outline-none focus:border-hp-bloom-deep"
                    />
                  </div>
                )}
              </div>

              {/* Audit Reason */}
              <div className="pt-3 border-t border-hp-hairline">
                <label className="block text-xs font-semibold text-hp-ink mb-1">
                  เหตุผลในการแก้ไข (บันทึก Audit Log) *
                </label>
                <input
                  type="text"
                  required
                  value={editLogForm.reason}
                  onChange={(e) => setEditLogForm({ ...editLogForm, reason: e.target.value })}
                  placeholder="เช่น ตรวจสอบความถูกต้องกับเกจวัดรอบบ่าย หรือปรับแก้ค่าที่พิมพ์ผิด"
                  className="w-full h-9 px-3 rounded-hp-md bg-white border border-hp-steel text-hp-ink text-xs focus:outline-none focus:border-hp-ink"
                />
              </div>

              <div className="pt-4 border-t border-hp-hairline flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="h-9 px-4 rounded-hp-md border border-hp-steel text-hp-ink text-xs font-semibold hover:bg-hp-cloud transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={editLogLoading}
                  className="hp-btn-primary h-9 px-4 text-xs"
                >
                  {editLogLoading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข (Audit)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Round Confirmation Modal */}
      {isDeletingRound && selectedRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hp-ink/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-rose-200 rounded-hp-xl shadow-hp-modal overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-hp-md bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-hp-ink">ยืนยันการลบรอบการเดินตรวจ</h3>
                <p className="text-xs text-hp-graphite">การกระทำนี้จะลบประวัติการตรวจทั้งหมดในรอบนี้</p>
              </div>
            </div>

            <p className="text-xs text-hp-charcoal leading-relaxed bg-hp-cloud p-3 rounded-hp-md border border-hp-hairline">
              ต้องการลบรอบตรวจ <strong className="text-hp-ink">{selectedRound.shiftName}</strong> ที่บันทึกเมื่อ {new Date(selectedRound.startedAt).toLocaleString('th-TH')} ออกจากฐานข้อมูลใช่หรือไม่?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeletingRound(false)}
                className="h-9 px-4 rounded-hp-md border border-hp-steel text-hp-ink text-xs font-semibold hover:bg-hp-cloud transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteRound}
                disabled={deleteRoundLoading}
                className="h-9 px-4 rounded-hp-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteRoundLoading ? 'กำลังลบ...' : 'ยืนยันลบรอบตรวจ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Zoom */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hp-ink/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-3xl max-h-[90vh] overflow-hidden rounded-hp-xl border border-hp-hairline bg-white p-4 shadow-hp-modal">
            <img src={selectedImage} alt="Defect Zoom" className="max-w-full max-h-[80vh] rounded-hp-md object-contain" />
            <p className="text-center text-xs text-hp-graphite mt-2">คลิกเพื่อปิด</p>
          </div>
        </div>
      )}
    </div>
  );
};
