import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, CheckCircle2, User, Truck, FileText, AlertCircle } from 'lucide-react';
import { InspectionJob, Vendor } from '../types';
import { DateTimeSelector } from './DateTimeSelector';
import { useLanguage } from '../i18n/translations';

interface QuickScheduleModalProps {
  isOpen: boolean;
  job: InspectionJob | null;
  vendors: Vendor[];
  onClose: () => void;
  onSaveSchedule: (jobId: string, scheduleData: {
    scheduledDate: string;
    scheduledTime: string;
    scheduledEndTime?: string;
    scheduleNotes?: string;
    vendorId?: string;
    appointmentConfirmation: 'Not Confirmed' | 'Confirmed' | 'Cancelled';
    rescheduledFromDate?: string;
    appointmentOutcome?: 'Completed' | 'Rescheduled' | 'Cancelled by Customer' | 'Cancelled by PTL' | 'No Access / No Show';
  }) => void;
}

export const QuickScheduleModal: React.FC<QuickScheduleModalProps> = ({
  isOpen,
  job,
  vendors,
  onClose,
  onSaveSchedule,
}) => {
  const { lang } = useLanguage();
  const isTh = lang === 'th';

  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledEndTime, setScheduledEndTime] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [vendorId, setVendorId] = useState<string>('');
  const [confirmation, setConfirmation] = useState<'Not Confirmed' | 'Confirmed' | 'Cancelled'>('Not Confirmed');

  useEffect(() => {
    if (job) {
      setScheduledDate(job.scheduledDate || new Date().toISOString().slice(0, 10));
      setScheduledTime(job.scheduledTime || '18:00');
      setScheduledEndTime(job.scheduledEndTime || '');
      setScheduleNotes(job.scheduleNotes || '');
      setVendorId(job.vendorId || job.assignedVendorId || '');
      setConfirmation(job.appointmentConfirmation || (job.isConfirmed ? 'Confirmed' : 'Not Confirmed'));
    }
  }, [job, isOpen]);

  if (!isOpen || !job) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate) return;

    const wasRescheduled =
      job.scheduledDate &&
      scheduledDate &&
      job.scheduledDate !== scheduledDate &&
      job.scheduledDate !== 'Today';

    onSaveSchedule(job.id, {
      scheduledDate,
      scheduledTime,
      scheduledEndTime: scheduledEndTime.trim() || undefined,
      scheduleNotes: scheduleNotes.trim() || undefined,
      vendorId: vendorId || undefined,
      appointmentConfirmation: confirmation,
      rescheduledFromDate: wasRescheduled ? job.scheduledDate : job.rescheduledFromDate,
      appointmentOutcome: wasRescheduled ? 'Rescheduled' : job.appointmentOutcome,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {isTh ? 'นัดหมาย / เลื่อนนัด' : 'Schedule or Reschedule Appointment'}
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-sm">
                {job.villaName || job.propertyLocation} • {job.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Unified DateTimeSelector */}
          <DateTimeSelector
            date={scheduledDate}
            time={scheduledTime}
            onChangeDate={setScheduledDate}
            onChangeTime={setScheduledTime}
            label={isTh ? 'วันและเวลานัดหมาย' : 'Appointment Date & Time'}
          />

          {/* End Time (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'เวลาสิ้นสุดโดยประมาณ (ไม่บังคับ)' : 'Estimated End Time (Optional)'}
            </label>
            <input
              type="text"
              value={scheduledEndTime}
              onChange={(e) => setScheduledEndTime(e.target.value)}
              placeholder="e.g. 19:30"
              className="w-full min-h-[44px] px-3 py-2 border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Customer Confirmation Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'สถานะการยืนยันของลูกค้า *' : 'Customer Confirmation Status *'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setConfirmation('Not Confirmed')}
                className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                  confirmation === 'Not Confirmed'
                    ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400 font-black'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isTh ? '⏳ ยังไม่ยืนยัน' : '⏳ Not Confirmed'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmation('Confirmed')}
                className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                  confirmation === 'Confirmed'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 ring-2 ring-emerald-400 font-black'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isTh ? '✓ ยืนยันแล้ว' : '✓ Confirmed'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmation('Cancelled')}
                className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                  confirmation === 'Cancelled'
                    ? 'bg-rose-100 text-rose-900 border-rose-300 ring-2 ring-rose-400 font-black'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isTh ? '✕ ยกเลิกนัด' : '✕ Cancelled'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {isTh
                ? 'การแยกสถานะการยืนยันช่วยให้เห็นชัดเจนว่าลูกค้าพร้อมรับบริการหรือยัง'
                : 'Confirmation is tracked separately from job status for field clarity.'}
            </p>
          </div>

          {/* Vendor Assignment (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'มอบหมายช่าง / ผู้รับเหมา (ไม่บังคับ)' : 'Assign Subcontractor (Optional)'}
            </label>
            <div className="relative">
              <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full min-h-[44px] pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">{isTh ? '-- ทำเอง / ไม่มีช่างภายนอก --' : '-- No contractor (Self handled) --'}</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.serviceCategory || v.category} — {v.serviceAreas})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'หมายเหตุนัดหมาย / รหัสกุญแจ' : 'Schedule Notes / Access Instructions'}
            </label>
            <textarea
              rows={2}
              value={scheduleNotes}
              onChange={(e) => setScheduleNotes(e.target.value)}
              placeholder={isTh ? 'เช่น รหัสกล่องกุญแจ 1423, แจ้งป้อมยามเลขวิลล่า...' : 'e.g. Key in lockbox code 1423, guard needs villa number.'}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {isTh ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-black rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isTh ? 'บันทึกเวลานัด' : 'Save Schedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
