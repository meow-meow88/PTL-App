import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Plus, Building2, FolderOpen, CheckCircle2, Upload, Sparkles } from 'lucide-react';
import { InspectionJob } from '../types';
import { User } from 'firebase/auth';
import { subscribeAuthChange, getCurrentUser } from '../services/googleAuth';
import { useCustomLogo } from '../utils/useCustomLogo';

interface HeaderProps {
  job: InspectionJob;
  totalJobsCount?: number;
  lastSyncStatus?: string;
  onOpenMultiJob: () => void;
  onOpenNewJob: () => void;
  onOpenDashboard?: () => void;
  onOpenVarvaraSocial?: () => void;
  onOpenMollyHardware?: () => void;
  onOpenMollyExpress?: () => void;
  onOpenMobileGuide?: () => void;
  onOpenGoogleDrive?: () => void;
  onOpenBackupModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  job,
  totalJobsCount = 1,
  lastSyncStatus,
  onOpenMultiJob,
  onOpenNewJob,
  onOpenDashboard,
  onOpenVarvaraSocial,
  onOpenMollyHardware,
  onOpenMollyExpress,
  onOpenMobileGuide,
  onOpenGoogleDrive,
  onOpenBackupModal,
}) => {
  const [online] = useState(true);
  const [googleUser, setGoogleUser] = useState<User | null>(getCurrentUser());
  const [hasToken, setHasToken] = useState(false);
  const { logoUrl, fallbackLogoUrl, updateLogo } = useCustomLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    const unsub = subscribeAuthChange((user, token) => {
      setGoogleUser(user);
      setHasToken(Boolean(token));
    });
    return () => unsub();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      await updateLogo(file);
      alert('บันทึกรูปโลโก้ต้นฉบับแท้ 100% สำเร็จ (ไม่ดัดแปลง) นำไปใช้กับเอกสารทุกใบและไอคอนเรียบร้อยครับ!');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการโหลดรูปภาพ');
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header
      className="bg-[#102a4e] text-white pb-5 px-4 sm:px-6 shadow-md border-b border-sky-950"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 18px)' }}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2">
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              onClick={() => fileInputRef.current?.click()}
              title="Phuket Trusted Local - Official Crest"
              className="relative cursor-pointer"
            >
              <img
                src={logoUrl || fallbackLogoUrl}
                onError={(e) => {
                  if (e.currentTarget.src !== fallbackLogoUrl) {
                    e.currentTarget.src = fallbackLogoUrl;
                  }
                }}
                alt="Phuket Trusted Local Crest"
                className="w-11 h-11 rounded-xl shadow-md border border-sky-300/40 object-contain bg-white p-0.5 hover:border-amber-400 transition-all"
              />
            </div>
            <div>
              <div className="text-[12px] font-extrabold tracking-widest text-sky-200 uppercase flex items-center gap-1.5">
                <span>PHUKET TRUSTED LOCAL</span>
                <span className="text-[9px] bg-sky-900/80 text-amber-300 font-semibold px-1.5 py-0.5 rounded border border-amber-400/30">
                  YOUR TRUSTED CONTACT
                </span>
              </div>
              <div className="text-[10px] text-sky-200/90 font-medium">
                Villa Inspection &amp; Property Care Management
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenMollyExpress && (
              <button
                id="header-btn-molly-express"
                onClick={onOpenMollyExpress}
                className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black px-3.5 py-1.5 rounded-full shadow-md transition-all cursor-pointer ring-2 ring-amber-300/70 hover:scale-105"
                title="คุยกับ Molly ออกใบเสนอราคาด่วนทันที คำนวณราคากลาง กำไร และสร้าง PDF พร้อมส่งใน 5 วินาที"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>💬 คุยกับ Molly (ออกใบเสนอราคาด่วน)</span>
              </button>
            )}

            {onOpenMollyHardware && (
              <button
                onClick={onOpenMollyHardware}
                className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black px-3 py-1.5 rounded-full shadow-xs transition-all cursor-pointer"
                title="ถาม Molly สรุปราคากลางอะไหล่และอุปกรณ์งานดูแลวิลล่า (Sourcing & Procurement)"
              >
                <span>⚡ ถาม Molly (สืบราคากลางอะไหล่วิลล่า)</span>
              </button>
            )}

            {onOpenDashboard && (
              <button
                onClick={onOpenDashboard}
                className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-full shadow-xs transition-all cursor-pointer"
                title="เปิดแดชบอร์ดสรุปรายรับ-รายจ่าย-กำไร และระบบติดตามงาน/จ่ายเงิน (Emily)"
              >
                <span>📊 แดชบอร์ด &amp; Emily</span>
              </button>
            )}

            {onOpenVarvaraSocial && (
              <button
                onClick={onOpenVarvaraSocial}
                className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold px-3 py-1.5 rounded-full shadow-xs transition-all cursor-pointer border border-pink-400/30"
                title="เปิดสตูดิโอสร้างโพสต์ Social Media สำหรับงานนี้โดย AI Varvara"
              >
                <span>📸 AI Varvara โซเชียล</span>
              </button>
            )}

            {onOpenGoogleDrive && (
              <button
                onClick={onOpenGoogleDrive}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full shadow-xs transition-all cursor-pointer border ${
                  hasToken && googleUser
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
                    : 'bg-slate-800 text-sky-200 border-slate-700 hover:bg-slate-700'
                }`}
                title="จัดการเชื่อมต่อ Google Drive และระบบซิงค์ภาพอัตโนมัติ"
              >
                <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  {hasToken && googleUser
                    ? '📁 Google Drive (ซิงค์แล้ว)'
                    : '📁 ซิงค์ Google Drive'}
                </span>
                {hasToken && googleUser && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                )}
              </button>
            )}

            {onOpenBackupModal && (
              <button
                onClick={onOpenBackupModal}
                className="flex items-center gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-full shadow-xs transition-all cursor-pointer border border-emerald-500/40"
                title="ระบบสำรองและกู้คืนข้อมูล 3 ชั้น (เซิร์ฟเวอร์ + เครื่อง)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>💾 สำรอง/กู้คืนข้อมูล</span>
              </button>
            )}

            <button
              onClick={onOpenMultiJob}
              className="flex items-center gap-1.5 text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-3 py-1.5 rounded-full shadow-xs transition-all"
              title="ดูตารางงานตรวจวันนี้และสลับวิลล่า"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-950" />
              <span>ตารางงานวันนี้ ({totalJobsCount} หลัง)</span>
            </button>

            <button
              onClick={onOpenNewJob}
              className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-sky-200 font-semibold px-2.5 py-1.5 rounded-full border border-slate-700 transition-colors"
              title="เพิ่มงานตรวจวิลล่าใหม่"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span>เพิ่มงานตรวจ</span>
            </button>
          </div>
        </div>

        {/* Current Villa & ID Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <button
            onClick={onOpenMultiJob}
            className="inline-flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-full text-sky-200 font-mono text-[11px] transition-colors"
            title="คลิกเพื่อสลับงานตรวจ"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{job.id}</span>
            <span className="text-sky-400 font-sans text-[10px]">▾ สลับ</span>
          </button>

          {onOpenMobileGuide && (
            <button
              onClick={onOpenMobileGuide}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 border border-blue-400/60 px-2.5 py-1 rounded-full text-white font-bold text-[11px] transition-all shadow-xs cursor-pointer"
              title="คลิกเพื่อดูวิธีเปิดบน iPhone หรือ Chrome ตรงๆ แบบลื่นไหล ไม่ค้าง"
            >
              <span>📱 ลิงก์มือถือ (ไม่ค้าง)</span>
            </button>
          )}

          <div className="inline-flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/80 px-2.5 py-1 rounded-full text-slate-200 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{online ? 'ระบบพร้อมใช้งาน' : 'โหมดออฟไลน์'}</span>
          </div>

          {onOpenBackupModal && (
            <button
              onClick={onOpenBackupModal}
              className="inline-flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-full text-emerald-300 text-[11px] cursor-pointer hover:bg-emerald-900/80 transition-colors"
              title="คลิกเพื่อดูสถานะการสำรองและกู้คืนข้อมูล 3 ชั้น"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{lastSyncStatus || '🛡️ ข้อมูลปลอดภัย 100% (เซิร์ฟเวอร์ + เครื่อง)'}</span>
            </button>
          )}

          <div className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-full text-amber-200 text-[11px]">
            <span>🤖 AI: Mr. Big • Molly • Emily • Varvara</span>
          </div>
        </div>
      </div>
    </header>
  );
};


