import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Keyboard, AlertCircle } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [useManual, setUseManual] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScannerRunningRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    // Reset state
    setScannerError(null);
    setManualCode('');

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleSuccess(decodedText);
          },
          () => {
            // scan failure callback, keep scanning silently
          }
        );
        isScannerRunningRef.current = true;
      } catch (err: any) {
        console.warn('Camera scan failed to start:', err);
        setScannerError(
          'ไม่สามารถเปิดกล้องได้ (อาจต้องอนุญาตสิทธิ์เข้าถึงกล้อง หรืออุปกรณ์ไม่มีกล้อง) กรุณากรอกรหัสด้วยตนเองด้านล่าง'
        );
        setUseManual(true);
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (scannerRef.current && isScannerRunningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      } finally {
        isScannerRunningRef.current = false;
        scannerRef.current = null;
      }
    }
  };

  const handleSuccess = async (text: string) => {
    await stopScanner();
    onScanSuccess(text);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleSuccess(manualCode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2 text-slate-900">
            <Camera className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">สแกน QR Code ประจำอุปกรณ์</h3>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="p-5 flex flex-col items-center">
          {!useManual ? (
            <div className="w-full relative">
              <div
                id="qr-reader"
                className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-black min-h-[280px]"
              />
              <p className="text-center text-xs text-slate-500 mt-2.5 font-medium">
                จัดตำแหน่ง QR Code ให้อยู่ในกรอบเพื่อระบุอุปกรณ์อัตโนมัติ
              </p>
            </div>
          ) : (
            <div className="w-full py-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-2 shadow-2xs">
                <Keyboard className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-800">กรอกรหัสอุปกรณ์ (Equipment Code) เพื่อระบุตัวตน</p>
            </div>
          )}

          {scannerError && (
            <div className="w-full mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
              <span>{scannerError}</span>
            </div>
          )}

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="w-full mt-4 space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="เช่น DCEQ-CRAC-SR1-01 หรือ CRAC-SR1-01"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50/80 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUseManual(!useManual)}
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {useManual ? (
                  <>
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>ใช้กล้องสแกน</span>
                  </>
                ) : (
                  <>
                    <Keyboard className="w-3.5 h-3.5 text-slate-500" />
                    <span>ระบุรหัสด้วยตนเอง</span>
                  </>
                )}
              </button>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors shadow-xs cursor-pointer"
              >
                ยืนยันรหัสอุปกรณ์
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
