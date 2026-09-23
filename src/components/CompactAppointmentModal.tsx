import React from 'react';
import { X, Calendar, Clock, CheckCircle2, AlertCircle, Phone, MessageSquare, MapPin, User } from 'lucide-react';
import { InspectionJob } from '../types';
import { useLanguage } from '../i18n/translations';
import { formatDateDisplay, formatTime24h } from '../utils/dateTime';

interface CompactAppointmentModalProps {
  isOpen: boolean;
  job: InspectionJob | null;
  onClose: () => void;
  onConfirmAppointment: (jobId: string) => void;
  onOpenReschedule: (job: InspectionJob) => void;
}

export const CompactAppointmentModal: React.FC<CompactAppointmentModalProps> = ({
  isOpen,
  job,
  onClose,
  onConfirmAppointment,
  onOpenReschedule,
}) => {
  const { lang } = useLanguage();
  const isTh = lang === 'th';

  if (!isOpen || !job) return null;

  const isConfirmed =
    job.appointmentConfirmation === 'Confirmed' ||
    job.isConfirmed === true;

  const formattedDate = formatDateDisplay(job.scheduledDate || job.inspectionDate, lang) || (isTh ? 'ตามตกลง' : 'TBD');
  const formattedTime = formatTime24h(job.scheduledTime) || '10:00';
  const customerPhone = job.customerPhone;
  const cleanPhone = (customerPhone || '').replace(/[^0-9+]/g, '');

  const handleNotifyCustomer = () => {
    const waText = isTh
      ? `สวัสดีครับคุณ ${job.customerName || ''} จาก Phuket Trusted Local ขอเรียนยืนยันนัดหมายเข้าตรวจสอบ ${job.serviceType} ที่ ${job.villaName || job.propertyLocation} ในวันที่ ${formattedDate} เวลา ${formattedTime} น. ครับ`
      : `Hello ${job.customerName || ''}, this is Phuket Trusted Local confirming our appointment for ${job.serviceType} at ${job.villaName || job.propertyLocation} on ${formattedDate} at ${formattedTime}. Thank you!`;

    const cleanNoPlus = cleanPhone.replace(/^\+/, '');
    if (cleanNoPlus) {
      window.open(`https://wa.me/${cleanNoPlus}?text=${encodeURIComponent(waText)}`, '_blank');
    } else {
      window.alert(isTh ? 'ไม่พบเบอร์โทรศัพท์ลูกค้า' : 'No customer phone number available');
    }
  };

  const handleConfirmClick = () => {
    onConfirmAppointment(job.id);
    onClose();
  };

  const handleRescheduleClick = () => {
    onClose();
    onOpenReschedule(job);
  };

  return (
    <div
      id="compact-appointment-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="compact-appointment-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150"
      >
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
              isConfirmed ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
            }`}>
              {isConfirmed ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {isTh ? 'นัดหมายการเข้าตรวจ' : 'Appointment Details'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {job.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Details: Clean, compact summary */}
        <div className="p-5 space-y-3.5">
          {/* Date & Time Row */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 border border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs font-black text-blue-900">
              <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>{formattedTime} (24h)</span>
            </div>
          </div>

          {/* Customer & Location */}
          <div className="space-y-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1 shrink-0">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{isTh ? 'ลูกค้า:' : 'Customer:'}</span>
              </span>
              <span className="font-extrabold text-slate-900 text-right truncate">
                {job.customerName || 'Customer'}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{isTh ? 'สถานที่:' : 'Location:'}</span>
              </span>
              <span className="font-semibold text-slate-800 text-right truncate">
                {job.villaName || job.propertyLocation || 'Location TBD'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <span className="text-slate-500">{isTh ? 'สถานะนัด:' : 'Status:'}</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                isConfirmed
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-amber-100 text-amber-950 border border-amber-300'
              }`}>
                {isConfirmed ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{isTh ? 'ยืนยันนัดหมายแล้ว' : 'Confirmed'}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-amber-700" />
                    <span>{isTh ? 'ยังไม่ยืนยันนัด' : 'Not Confirmed'}</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: 3 clean, direct actions (Confirm, Reschedule, Notify Customer) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
          {!isConfirmed ? (
            <button
              id="btn-confirm-appointment-action"
              type="button"
              onClick={handleConfirmClick}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{isTh ? 'ยืนยันนัดหมาย' : 'Confirm Appointment'}</span>
            </button>
          ) : (
            <div className="w-full py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{isTh ? 'นัดหมายนี้ได้รับการยืนยันแล้ว' : 'Appointment is confirmed'}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleRescheduleClick}
              className="min-h-[40px] py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{isTh ? 'เลื่อนนัด' : 'Reschedule'}</span>
            </button>

            <button
              type="button"
              onClick={handleNotifyCustomer}
              className="min-h-[40px] py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isTh ? 'แจ้งลูกค้า' : 'Notify Customer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
