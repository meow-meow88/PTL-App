import React, { useState } from 'react';
import { Smartphone, Copy, Check, ExternalLink, Sparkles, AlertCircle, Share2, PlusSquare, RefreshCw } from 'lucide-react';
import { BUILD_VERSION, BUILD_DATE } from '../utils/buildVersion';
import { clearAppCachesAndReload } from '../utils/pwaManager';

interface MobileGuideModalProps {
  onClose: () => void;
}

export const MobileGuideModal: React.FC<MobileGuideModalProps> = ({ onClose }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Dynamically resolve current origin so desktop and mobile always align
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-klrxb5ncvun5xg2n7pxeyo-552343100979.asia-southeast1.run.app';
  const directAppUrl = currentOrigin;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  const handleForceClearCache = async () => {
    setIsClearing(true);
    await clearAppCachesAndReload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              📱
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                วิธีเปิดบน iPhone / มือถือแบบลื่นไหล (ไม่ค้าง)
              </h3>
              <p className="text-xs text-slate-500">
                เข้าตรงผ่าน Standalone Web App โดยไม่ต้องผ่านกรอบ AI Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 pt-3 text-xs">
          {/* Why it froze explanation */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1.5 text-amber-950">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>ทำไมเปิดใน Google AI Studio บน iPhone แล้วค้าง?</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-900/90 font-sans">
              หน้าต่างของ Google AI Studio มีระบบคอนโซลนักพัฒนาและโปรแกรมเขียนโค้ดหลังบ้านที่ใช้หน่วยความจำ (RAM) สูงมาก ทำให้เบราว์เซอร์บนมือถือหน่วงหรือค้างครับ
            </p>
            <p className="font-bold text-[11px] text-amber-950">
              👉 วิธีแก้: ให้เปิดผ่าน <strong>&quot;ลิงก์เว็บแอปโดยตรง (Standalone URL)&quot;</strong> ด้านล่างนี้ จะโหลดเร็วมาก ลื่นไหล ไม่กินแรม และไม่ค้าง 100%!
            </p>
          </div>

          {/* Clean URL Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <span>🔗 ลิงก์สำหรับเปิดบน iPhone / Safari / Chrome:</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                แนะนำ (Production URL)
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-300 font-mono text-[11px] text-slate-700 break-all select-all flex items-center justify-between gap-2">
              <span className="truncate">{directAppUrl}</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleCopy(directAppUrl)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-xs active:scale-95"
              >
                {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedUrl ? 'คัดลอกลิงก์สำเร็จแล้ว!' : 'คัดลอกลิงก์นี้ (Copy URL)'}</span>
              </button>

              <a
                href={directAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs shrink-0"
              >
                <span>เปิดแท็บใหม่</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* iOS Add to Home Screen Step-by-Step */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <span>📲 วิธีทำเป็นไอคอนแอปบนหน้าจอโฮม iPhone (เปิดเต็มจอเหมือนแอปจริง):</span>
            </h4>

            <div className="space-y-2 text-[11px] text-slate-700 font-sans">
              <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  เปิดลิงก์ข้างต้นใน <strong>Safari บน iPhone</strong>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  กดปุ่ม <strong>แชร์ (Share)</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" /> ที่แถบด้านล่างของหน้าจอ
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  เลื่อนลงมาแล้วเลือก <strong>&quot;เพิ่มไปยังหน้าจอโฮม&quot; (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-slate-700" />
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </span>
                <div className="font-semibold text-emerald-900 flex-1">
                  เสร็จสิ้น! จะได้ไอคอนแอป <strong>PTL Inspect</strong> บนหน้าจอโฮมของคุณ เปิดใช้งานแบบ Full Screen ไร้กรอบ URL ลื่นไหล 100%
                  <div className="mt-2 flex items-center gap-3 bg-emerald-50/70 p-2 rounded-xl border border-emerald-200">
                    <img
                      src="/apple-touch-icon.png"
                      alt="PTL App Icon"
                      className="w-12 h-12 rounded-2xl shadow-md border border-slate-200 bg-white"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">PTL Inspect</div>
                      <div className="text-[10px] text-slate-500">Phuket Trusted Local Field App</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Build Identifier & Cache Recovery */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 mt-3 text-xs">
          <div className="text-slate-500 font-mono text-[10px] text-center sm:text-left">
            <span className="font-semibold text-slate-700">Build {BUILD_VERSION}</span> ({BUILD_DATE})
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleForceClearCache}
              disabled={isClearing}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="ล้างแคชไฟล์เบราว์เซอร์เพื่อดึงโค้ดล่าสุด (ข้อมูลงานไม่หาย)"
            >
              <RefreshCw className={`w-3 h-3 ${isClearing ? 'animate-spin' : ''}`} />
              <span>{isClearing ? 'กำลังล้างแคช...' : 'ล้างแคช & รีเฟรช'}</span>
            </button>

            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              เข้าใจแล้ว (ปิดหน้าต่าง)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
