import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { roomApi, equipmentApi } from '../../services/api';
import { Room, Equipment, EquipmentType } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import {
  Server,
  Building,
  Plus,
  QrCode,
  Printer,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  Sliders,
} from 'lucide-react';

export const EquipmentManager: React.FC = () => {
  const { isAdmin } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [selectedEqForQr, setSelectedEqForQr] = useState<Equipment | null>(null);

  // Room Form
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomFloor, setRoomFloor] = useState('');
  const [roomDesc, setRoomDesc] = useState('');

  // Equipment Form
  const [eqName, setEqName] = useState('');
  const [eqCode, setEqCode] = useState('');
  const [eqRoomId, setEqRoomId] = useState('');
  const [eqTypeId, setEqTypeId] = useState('');

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [rRes, eRes, tRes] = await Promise.all([
        roomApi.getRooms(),
        equipmentApi.getEquipments(),
        equipmentApi.getTypes(),
      ]);
      setRooms(rRes.data.rooms);
      setEquipments(eRes.data.equipments);
      setTypes(tRes.data.types);

      if (rRes.data.rooms.length > 0) setEqRoomId(rRes.data.rooms[0].id);
      if (tRes.data.types.length > 0) setEqTypeId(tRes.data.types[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await roomApi.createRoom({
        name: roomName,
        code: roomCode,
        floor: roomFloor,
        description: roomDesc,
      });
      setIsRoomModalOpen(false);
      setRoomName('');
      setRoomCode('');
      setRoomFloor('');
      setRoomDesc('');
      showToast('เพิ่มห้องใหม่สำเร็จ');
      await loadAll();
    } catch (err: any) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างห้อง');
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await equipmentApi.createEquipment({
        name: eqName,
        code: eqCode,
        roomId: eqRoomId,
        typeId: eqTypeId,
      });
      setIsEqModalOpen(false);
      setEqName('');
      setEqCode('');
      showToast('เพิ่มอุปกรณ์ใหม่สำเร็จ');
      await loadAll();
    } catch (err: any) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างอุปกรณ์');
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!window.confirm('คุณต้องการลบอุปกรณ์นี้ใช่หรือไม่?')) return;
    try {
      await equipmentApi.deleteEquipment(id);
      showToast('ลบอุปกรณ์สำเร็จ');
      await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintQr = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 p-3.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-xs shadow-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            <span>จัดการห้อง อุปกรณ์ และป้าย QR Code</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ทะเบียนห้อง ตู้ Rack และอุปกรณ์ Data Center พร้อมเครื่องมือพิมพ์ป้าย QR ประจำตำแหน่ง
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRoomModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span>เพิ่มห้องใหม่</span>
            </button>
            <button
              onClick={() => setIsEqModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มอุปกรณ์ใหม่</span>
            </button>
          </div>
        )}
      </div>

      {/* Rooms Overview Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          ห้องทั้งหมดใน Data Center ({rooms.length} ห้อง)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {rooms.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                  {r.code}
                </span>
                <span className="text-xs text-slate-500 font-medium">{r.floor || 'ชั้น 1'}</span>
              </div>
              <h4 className="font-bold text-slate-900 mt-2.5 text-sm truncate">{r.name}</h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.description || '-'}</p>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>อุปกรณ์:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {r._count?.equipments ?? 0} ชิ้น
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment List Table with QR buttons */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
            <Server className="w-4 h-4 text-blue-600" />
            <span>รายการอุปกรณ์ทั้งหมด ({equipments.length} รายการ)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">รหัสอุปกรณ์</th>
                <th className="px-4 py-3">ชื่ออุปกรณ์</th>
                <th className="px-4 py-3">ห้อง</th>
                <th className="px-4 py-3">ประเภท / การวัด</th>
                <th className="px-4 py-3">รหัส QR Code</th>
                <th className="px-4 py-3 text-right">{isAdmin ? 'ป้าย QR / จัดการ' : 'ป้าย QR Code'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipments.map((eq) => (
                <tr key={eq.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{eq.code}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{eq.name}</td>
                  <td className="px-4 py-3.5 text-slate-600">{eq.room?.name}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium border border-slate-200">
                      {eq.type?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">{eq.qrCode}</td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => setSelectedEqForQr(eq)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      <span>พิมพ์ QR</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteEquipment(eq.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="ลบอุปกรณ์"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Sticker Modal */}
      {selectedEqForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 text-center">
            <button
              onClick={() => setSelectedEqForQr(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-900 text-base">ป้ายสแกน QR Code ประจำอุปกรณ์</h3>
            <p className="text-xs text-slate-500 mt-0.5">พิมพ์สติกเกอร์ติดหน้าตู้ Rack หรือตำแหน่งตรวจ</p>

            {/* Printable Sticker Box */}
            <div
              id="printable-qr"
              className="my-5 p-5 bg-white rounded-xl text-slate-900 shadow-sm flex flex-col items-center border border-slate-200"
            >
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 font-mono">
                DATA CENTER ASSET
              </div>
              <QRCodeSVG
                value={selectedEqForQr.qrCode}
                size={180}
                level="H"
                includeMargin={true}
              />
              <div className="text-sm font-bold mt-2 font-mono text-slate-900">{selectedEqForQr.code}</div>
              <div className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                {selectedEqForQr.name}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">ห้อง: {selectedEqForQr.room?.name}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePrintQr}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ป้ายสติกเกอร์ (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {isAdmin && isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">เพิ่มห้องใหม่ใน Data Center</h3>
              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อห้อง (Room Name) *
                </label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="เช่น Server Hall 2 หรือ UPS Room B"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50/70 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสห้อง (Room Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="เช่น SR-02 หรือ UPS-02"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50/70 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชั้นที่ตั้ง (Floor)
                  </label>
                  <input
                    type="text"
                    value={roomFloor}
                    onChange={(e) => setRoomFloor(e.target.value)}
                    placeholder="เช่น ชั้น 1 หรือ ชั้น 2"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50/70 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รายละเอียด / คำอธิบาย
                </label>
                <textarea
                  rows={2}
                  value={roomDesc}
                  onChange={(e) => setRoomDesc(e.target.value)}
                  placeholder="เช่น ห้องเซิร์ฟเวอร์สำรอง หรือห้องแบตเตอรี่"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50/70 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              >
                บันทึกห้อง
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Equipment Modal */}
      {isAdmin && isEqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">เพิ่มอุปกรณ์ใหม่ในระบบ</h3>
              <button
                onClick={() => setIsEqModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEquipment} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เลือกจากอุปกรณ์มาตรฐาน (Preset)
                </label>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const parts = val.split('|');
                    setEqName(parts[0]);
                    setEqCode(parts[1] || '');
                  }}
                  className="w-full px-3.5 py-2 mb-2 rounded-lg bg-slate-50/80 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 font-mono cursor-pointer"
                >
                  <option value="">-- คลิกเพื่อเลือกชื่ออุปกรณ์มาตรฐาน --</option>
                  <optgroup label="[Power Systems] ระบบไฟฟ้า">
                    <option value="PDU Server Hall Row A|PDU-SR1-A">PDU Server Hall Row A (PDU-SR1-A)</option>
                    <option value="PDU Server Hall Row B|PDU-SR1-B">PDU Server Hall Row B (PDU-SR1-B)</option>
                    <option value="PDU Server Hall Row C|PDU-SR1-C">PDU Server Hall Row C (PDU-SR1-C)</option>
                    <option value="UPS System A (500 kVA)|UPS-A-500KVA">UPS System A (500 kVA) (UPS-A-500KVA)</option>
                    <option value="UPS System B (500 kVA)|UPS-B-500KVA">UPS System B (500 kVA) (UPS-B-500KVA)</option>
                    <option value="Main MDB Switchgear Panel|MDB-MAIN-01">Main MDB Switchgear Panel (MDB-MAIN-01)</option>
                    <option value="Battery Bank 01 (VRLA)|BAT-BANK-01">Battery Bank 01 (BAT-BANK-01)</option>
                    <option value="Battery Bank 02 (VRLA)|BAT-BANK-02">Battery Bank 02 (BAT-BANK-02)</option>
                    <option value="Emergency Diesel Generator 01|GEN-01">Emergency Diesel Generator 01 (GEN-01)</option>
                  </optgroup>
                  <optgroup label="[Cooling Systems] ระบบปรับอากาศและทำความเย็น">
                    <option value="Precision AC Unit 01 (Row A)|CRAC-SR1-01">Precision AC Unit 01 (Row A) (CRAC-SR1-01)</option>
                    <option value="Precision AC Unit 02 (Row B)|CRAC-SR1-02">Precision AC Unit 02 (Row B) (CRAC-SR1-02)</option>
                    <option value="Precision AC Unit 03 (Row C)|CRAC-SR1-03">Precision AC Unit 03 (Row C) (CRAC-SR1-03)</option>
                    <option value="Chilled Water Primary Pump 01|CHWP-01">Chilled Water Primary Pump 01 (CHWP-01)</option>
                    <option value="Chilled Water Primary Pump 02|CHWP-02">Chilled Water Primary Pump 02 (CHWP-02)</option>
                  </optgroup>
                </select>

                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่ออุปกรณ์ (Equipment Name) *
                </label>
                <input
                  type="text"
                  required
                  value={eqName}
                  onChange={(e) => setEqName(e.target.value)}
                  placeholder="เช่น PDU Row C หรือ CRAC Unit 03"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50/70 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสอุปกรณ์ (Equipment Code) *
                </label>
                <input
                  type="text"
                  required
                  value={eqCode}
                  onChange={(e) => setEqCode(e.target.value)}
                  placeholder="เช่น PDU-SR1-02 หรือ CRAC-SR1-03"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50/70 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ห้องที่ตั้ง *
                  </label>
                  <select
                    required
                    value={eqRoomId}
                    onChange={(e) => setEqRoomId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50/80 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 cursor-pointer"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ประเภทอุปกรณ์ *
                  </label>
                  <select
                    required
                    value={eqTypeId}
                    onChange={(e) => setEqTypeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50/80 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 cursor-pointer"
                  >
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              >
                บันทึกอุปกรณ์และสร้าง QR Code
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
