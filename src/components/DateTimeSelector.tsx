import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle, Check } from 'lucide-react';
import { useLanguage } from '../i18n/translations';
import { formatTime24h, formatDateDisplay } from '../utils/dateTime';

interface DateTimeSelectorProps {
  date: string; // YYYY-MM-DD or 'Today' / 'Tomorrow'
  time: string; // HH:mm 24-hour format
  onChangeDate: (newDate: string) => void;
  onChangeTime: (newTime: string) => void;
  label?: string;
  allowPastTime?: boolean;
}

export const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  date,
  time,
  onChangeDate,
  onChangeTime,
  label,
  allowPastTime = true,
}) => {
  const { lang } = useLanguage();
  const isTh = lang === 'th';

  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [isCustomTimeOpen, setIsCustomTimeOpen] = useState(false);

  // Normalize time to strict 24-hour format
  const normalizedTime = formatTime24h(time) || '10:00';

  // Helper date strings
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  // Normalize current date
  const effectiveDate = date === 'Today' ? todayStr : date === 'Tomorrow' ? tomorrowStr : date || todayStr;

  // Check if selected time is in the past
  const isPastTime = () => {
    if (!effectiveDate || !normalizedTime) return false;
    try {
      if (effectiveDate < todayStr) return true;
      if (effectiveDate === todayStr) {
        const [h, m] = normalizedTime.split(':').map((v) => parseInt(v, 10));
        if (isNaN(h)) return false;
        const targetMinutes = h * 60 + (isNaN(m) ? 0 : m);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        return targetMinutes < currentMinutes;
      }
    } catch {}
    return false;
  };

  const hasPassed = isPastTime();

  // Quick Time Helpers
  const handleSetNow = () => {
    const currentH = String(now.getHours()).padStart(2, '0');
    const currentM = String(now.getMinutes()).padStart(2, '0');
    onChangeTime(`${currentH}:${currentM}`);
  };

  const handleAddMinutes = (mins: number) => {
    const future = new Date(Date.now() + mins * 60 * 1000);
    const futureH = String(future.getHours()).padStart(2, '0');
    const futureM = String(future.getMinutes()).padStart(2, '0');
    onChangeTime(`${futureH}:${futureM}`);
  };

  // 24h presets spanning morning, afternoon, and evening (solo operator flexibility)
  const commonTimePresets = ['09:00', '10:30', '14:00', '16:00', '17:30', '18:00'];

  return (
    <div className="space-y-3 bg-slate-50/90 p-3 sm:p-4 rounded-2xl border border-slate-200">
      {/* Optional Label & Selected Status */}
      {label && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>{label}</span>
          </span>
          <span className="text-xs font-bold text-slate-700 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
            {formatDateDisplay(effectiveDate, lang)} • {normalizedTime}
          </span>
        </div>
      )}

      {/* SECTION 1: QUICK DATE SELECTION */}
      <div>
        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{isTh ? 'วันนัดหมาย' : 'Appointment Date'}</span>
        </label>

        <div className="grid grid-cols-3 gap-2">
          {/* Today Button */}
          <button
            type="button"
            onClick={() => {
              onChangeDate(todayStr);
              setIsCustomDateOpen(false);
            }}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-98 ${
              effectiveDate === todayStr && !isCustomDateOpen
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {effectiveDate === todayStr && !isCustomDateOpen && <Check className="w-3.5 h-3.5" />}
            <span>{isTh ? 'วันนี้' : 'Today'}</span>
          </button>

          {/* Tomorrow Button */}
          <button
            type="button"
            onClick={() => {
              onChangeDate(tomorrowStr);
              setIsCustomDateOpen(false);
            }}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-98 ${
              effectiveDate === tomorrowStr && !isCustomDateOpen
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {effectiveDate === tomorrowStr && !isCustomDateOpen && <Check className="w-3.5 h-3.5" />}
            <span>{isTh ? 'พรุ่งนี้' : 'Tomorrow'}</span>
          </button>

          {/* Choose Date Button */}
          <button
            type="button"
            onClick={() => setIsCustomDateOpen(!isCustomDateOpen)}
            className={`min-h-[44px] px-2 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none active:scale-98 ${
              isCustomDateOpen || (effectiveDate !== todayStr && effectiveDate !== tomorrowStr)
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isTh ? 'เลือกวันที่' : 'Choose Date'}</span>
          </button>
        </div>

        {/* Custom Date Input */}
        {(isCustomDateOpen || (effectiveDate !== todayStr && effectiveDate !== tomorrowStr)) && (
          <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => {
                if (e.target.value) {
                  onChangeDate(e.target.value);
                }
              }}
              className="w-full min-h-[44px] px-3 py-2 bg-white border border-indigo-300 rounded-xl text-base font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {/* SECTION 2: QUICK TIME SELECTION (24-HOUR) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{isTh ? 'เวลา' : 'Time'}</span>
          </label>
          <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {isTh ? `เวลา: ${normalizedTime}` : `Time: ${normalizedTime}`}
          </span>
        </div>

        {/* Quick Instant Time Offsets */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <button
            type="button"
            onClick={handleSetNow}
            className="min-h-[44px] px-2 py-2 rounded-xl text-xs sm:text-sm font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1"
          >
            ⚡ {isTh ? 'ตอนนี้' : 'Now'}
          </button>

          <button
            type="button"
            onClick={() => handleAddMinutes(30)}
            className="min-h-[44px] px-2 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-all cursor-pointer active:scale-98 flex items-center justify-center"
          >
            +30 {isTh ? 'นาที' : 'min'}
          </button>

          <button
            type="button"
            onClick={() => handleAddMinutes(60)}
            className="min-h-[44px] px-2 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-all cursor-pointer active:scale-98 flex items-center justify-center"
          >
            +1 {isTh ? 'ชม.' : 'hour'}
          </button>
        </div>

        {/* Common Field Slots Grid (24-hour format) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2">
          {commonTimePresets.map((slot) => {
            const isSelected = normalizedTime === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  onChangeTime(slot);
                  setIsCustomTimeOpen(false);
                }}
                className={`min-h-[44px] px-1.5 py-2 rounded-xl text-xs font-black font-mono transition-all cursor-pointer select-none active:scale-98 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs ring-2 ring-blue-500'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>

        {/* Pick Other Time Button & Native Time Input */}
        <div>
          <button
            type="button"
            onClick={() => setIsCustomTimeOpen(!isCustomTimeOpen)}
            className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-98 ${
              isCustomTimeOpen || !commonTimePresets.includes(normalizedTime)
                ? 'bg-blue-50 text-blue-800 border-2 border-blue-400 font-black'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-600" />
            <span>{isTh ? '⏰ เลือกเวลาอื่น' : '⏰ Choose Other Time'}</span>
          </button>

          {(isCustomTimeOpen || !commonTimePresets.includes(normalizedTime)) && (
            <div className="mt-2 p-2.5 bg-blue-50/60 rounded-xl border border-blue-200 animate-in fade-in duration-150">
              <label className="block text-[11px] font-bold text-blue-900 mb-1">
                {isTh ? 'ระบุเวลาตามต้องการ (รูปแบบ 24 ชม. เช่น 14:35)' : 'Enter custom time (24h format, e.g. 14:35)'}
              </label>
              <input
                type="time"
                value={normalizedTime}
                onChange={(e) => {
                  if (e.target.value) {
                    onChangeTime(e.target.value);
                  }
                }}
                className="w-full min-h-[44px] px-3 py-2 bg-white border border-blue-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* PAST TIME NOTICE */}
      {hasPassed && allowPastTime && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {isTh
              ? 'เวลานัดหมายนี้ผ่านมาแล้ว (สามารถบันทึกเพื่อบันทึกงานย้อนหลังได้)'
              : 'This scheduled time has already passed (you can still save for past work records).'}
          </span>
        </div>
      )}
    </div>
  );
};
