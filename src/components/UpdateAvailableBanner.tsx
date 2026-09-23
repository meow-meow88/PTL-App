import React, { useState } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { applyPWAUpdate } from '../utils/pwaManager';
import { BUILD_VERSION } from '../utils/buildVersion';

interface UpdateAvailableBannerProps {
  newVersion?: string;
  isTh?: boolean;
  onDismiss?: () => void;
}

export const UpdateAvailableBanner: React.FC<UpdateAvailableBannerProps> = ({
  newVersion,
  isTh = true,
  onDismiss,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleUpdate = async () => {
    setIsUpdating(true);
    await applyPWAUpdate();
  };

  return (
    <div
      role="alert"
      className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-slate-900/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-sky-400/40 backdrop-blur-md animate-in slide-in-from-top duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
              <span>{isTh ? 'มีเวอร์ชันใหม่พร้อมใช้งาน' : 'New version available'}</span>
              <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-600/50 px-1.5 py-0.2 rounded-md font-mono">
                {newVersion || BUILD_VERSION}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              {isTh
                ? 'กดอัปเดตเพื่อรับฟีเจอร์ล่าสุด (ข้อมูลงานในเครื่องไม่สูญหาย)'
                : 'Tap update to load the latest features. Your field data is safe.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            if (onDismiss) onDismiss();
          }}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            if (onDismiss) onDismiss();
          }}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {isTh ? 'ไว้ทีหลัง' : 'Later'}
        </button>
        <button
          type="button"
          disabled={isUpdating}
          onClick={handleUpdate}
          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
          <span>{isUpdating ? (isTh ? 'กำลังอัปเดต...' : 'Updating...') : isTh ? 'อัปเดตตอนนี้' : 'Update now'}</span>
        </button>
      </div>
    </div>
  );
};
