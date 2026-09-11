import React, { useState, useEffect } from 'react';
import { inspectionApi } from '../services/api';
import { InspectionRound } from '../types';
import {
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  X,
  Server,
} from 'lucide-react';

export const InspectionHistory: React.FC = () => {
  const [rounds, setRounds] = useState<InspectionRound[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRound, setSelectedRound] = useState<InspectionRound | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
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
                <h3 className="text-lg font-medium text-hp-ink">
                  บันทึกรอบตรวจ: {selectedRound.shiftName}
                </h3>
                <p className="text-xs text-hp-graphite mt-0.5 font-mono">
                  Inspector: {selectedRound.inspector?.fullName} | Timestamp:{' '}
                  {new Date(selectedRound.startedAt).toLocaleString('th-TH')}
                </p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-2 text-hp-graphite hover:text-hp-ink hover:bg-hp-fog rounded-hp-md transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Table of Equipment Logs */}
            <div className="p-6 overflow-y-auto space-y-4">
              {selectedRound.notes && (
                <div className="p-4 rounded-hp-md bg-hp-cloud border border-hp-hairline text-xs text-hp-charcoal">
                  <span className="font-semibold text-hp-ink">หมายเหตุประจำรอบ: </span>
                  {selectedRound.notes}
                </div>
              )}

              <div className="space-y-3.5">
                {selectedRound.logs && selectedRound.logs.length > 0 ? (
                  selectedRound.logs.map((log) => {
                    let readingsObj: Record<string, any> = {};
                    try {
                      readingsObj = typeof log.readings === 'string' ? JSON.parse(log.readings) : log.readings;
                    } catch (e) {}

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
                          <span className="text-xs text-hp-graphite">
                            ห้อง: {log.equipment?.room?.name}
                          </span>
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
