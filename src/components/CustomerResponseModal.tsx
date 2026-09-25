import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  FileEdit,
  Clock,
  XCircle,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Send,
  Calendar,
} from 'lucide-react';
import { InspectionJob } from '../types';
import { useLanguage } from '../i18n/translations';
import { getLocalizedServiceName } from '../utils/serviceWorkflow';

interface CustomerResponseModalProps {
  isOpen: boolean;
  job: InspectionJob | null;
  onClose: () => void;
  onApprove: (jobId: string) => void;
  onRequestRevision: (jobId: string, notes?: string) => void;
  onMarkUndecided: (jobId: string, notes?: string, followUpDate?: string) => void;
  onDecline: (jobId: string, reason?: string) => void;
}

export const CustomerResponseModal: React.FC<CustomerResponseModalProps> = ({
  isOpen,
  job,
  onClose,
  onApprove,
  onRequestRevision,
  onMarkUndecided,
  onDecline,
}) => {
  const { lang } = useLanguage();
  const isTh = lang === 'th';

  const [selectedOutcome, setSelectedOutcome] = useState<
    'approved' | 'revision' | 'undecided' | 'declined' | null
  >(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  if (!isOpen || !job) return null;

  const serviceName = getLocalizedServiceName(job.serviceType, lang);

  const handleConfirmAction = () => {
    if (!selectedOutcome) return;

    switch (selectedOutcome) {
      case 'approved':
        onApprove(job.id);
        break;
      case 'revision':
        onRequestRevision(job.id, responseNotes.trim() || undefined);
        break;
      case 'undecided':
        onMarkUndecided(job.id, responseNotes.trim() || undefined, followUpDate || undefined);
        break;
      case 'declined':
        onDecline(job.id, responseNotes.trim() || undefined);
        break;
    }
    onClose();
  };

  return (
    <div
      id="customer-response-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="customer-response-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {isTh ? 'บันทึกคำตอบลูกค้า' : 'Record Customer Response'}
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[240px] sm:max-w-xs">
                {serviceName} • {job.villaName || job.customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 4 Clear Choices */}
        <div className="p-5 space-y-3.5 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-600">
            {isTh
              ? 'เลือกว่าลูกค้าตอบรับใบเสนอราคาอย่างไร เพื่อให้ระบบตั้งขั้นตอนถัดไปอัตโนมัติ:'
              : 'Select how the customer responded to automatically route the next operational step:'}
          </p>

          <div className="space-y-2.5">
            {/* OPTION 1: อนุมัติ (Approved) */}
            <button
              type="button"
              onClick={() => setSelectedOutcome('approved')}
              className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                selectedOutcome === 'approved'
                  ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80 bg-white'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedOutcome === 'approved'
                    ? 'bg-emerald-600 text-white font-black'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-slate-900">
                    {isTh ? '1. อนุมัติราคา (Approved)' : '1. Approved'}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {isTh ? 'ไปนัดหมาย' : 'Schedule Next'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isTh
                    ? 'ลูกค้ายืนยันราคาแล้ว พร้อมนัดหมายวันเข้าทำงานจริง'
                    : 'Customer approved price. Ready to schedule appointment and start work.'}
                </p>
              </div>
            </button>

            {/* OPTION 2: ขอแก้ราคา (Request Revision) */}
            <button
              type="button"
              onClick={() => setSelectedOutcome('revision')}
              className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                selectedOutcome === 'revision'
                  ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50/80 bg-white'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedOutcome === 'revision'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                <FileEdit className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-slate-900">
                    {isTh ? '2. ขอแก้ราคา (Request Revision)' : '2. Request Revision'}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {isTh ? 'แก้ใบเสนอราคา' : 'Edit Quote'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isTh
                    ? 'ลูกค้าขอต่อรอง ปรับลดราคา หรือเปลี่ยนสเปกอุปกรณ์ กลับไปแก้และส่งใหม่'
                    : 'Customer requested discount or scope changes. Return to edit & resend quote.'}
                </p>
              </div>
            </button>

            {/* OPTION 3: ยังไม่ตัดสินใจ (Undecided / Follow up) */}
            <button
              type="button"
              onClick={() => setSelectedOutcome('undecided')}
              className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                selectedOutcome === 'undecided'
                  ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 bg-white'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedOutcome === 'undecided'
                    ? 'bg-blue-600 text-white font-black'
                    : 'bg-blue-100 text-blue-900'
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-slate-900">
                    {isTh ? '3. ยังไม่ตัดสินใจ (Considering)' : '3. Still Considering'}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                    {isTh ? 'รอติดตาม' : 'Follow Up'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isTh
                    ? 'รอลูกค้าพิจารณา / รอปรึกษาคนในบ้าน ระบุว่ารอติดตามลูกค้า'
                    : 'Waiting for client review or consultation. Marked as awaiting follow-up.'}
                </p>
              </div>
            </button>

            {/* OPTION 4: ไม่รับราคา (Declined / Rejected) */}
            <button
              type="button"
              onClick={() => setSelectedOutcome('declined')}
              className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                selectedOutcome === 'declined'
                  ? 'border-slate-600 bg-slate-100 ring-2 ring-slate-400/20'
                  : 'border-slate-200 hover:border-rose-300 hover:bg-slate-50/80 bg-white'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedOutcome === 'declined'
                    ? 'bg-slate-800 text-white font-black'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                <XCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-slate-900">
                    {isTh ? '4. ไม่รับราคา (Declined)' : '4. Declined / Rejected'}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                    {isTh ? 'ปิดงานได้' : 'Close Job'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isTh
                    ? 'ลูกค้าปฏิเสธราคา ไม่ประสงค์ทำต่อ ปิดงานได้ทันที โดยไม่บังคับให้ติดตามต่อ'
                    : 'Customer declined quotation. Close job immediately without forced follow-up.'}
                </p>
              </div>
            </button>
          </div>

          {/* Optional notes input */}
          {selectedOutcome && (
            <div className="pt-2 animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {selectedOutcome === 'revision'
                  ? isTh
                    ? 'สิ่งที่ลูกค้าขอให้แก้ไข (ทางเลือก):'
                    : 'Revision details requested by customer (optional):'
                  : selectedOutcome === 'undecided'
                  ? isTh
                    ? 'บันทึกการนัดคุยต่อ / กำหนดติดตาม (ทางเลือก):'
                    : 'Follow-up timeline or client notes (optional):'
                  : selectedOutcome === 'declined'
                  ? isTh
                    ? 'เหตุผลที่ไม่รับราคา (ทางเลือก):'
                    : 'Reason for declining (optional):'
                  : isTh
                  ? 'หมายเหตุเพิ่มเติม (ทางเลือก):'
                  : 'Additional notes (optional):'}
              </label>
              <input
                type="text"
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder={
                  selectedOutcome === 'revision'
                    ? isTh
                      ? 'เช่น ขอเปลี่ยนรุ่นสวิตช์, ลดค่าบริการ 500'
                      : 'e.g. Change model, discount 500 THB'
                    : selectedOutcome === 'undecided'
                    ? isTh
                      ? 'เช่น ลูกค้าจะให้คำตอบวันศุกร์นี้'
                      : 'e.g. Will decide by Friday'
                    : selectedOutcome === 'declined'
                    ? isTh
                      ? 'เช่น งบประมาณไม่พอ, ตัดสินใจทำเอง'
                      : 'e.g. Over budget'
                    : isTh
                    ? 'บันทึกเพิ่มเติม'
                    : 'Notes'
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {selectedOutcome === 'undecided' && (
                <label className="block mt-3 text-xs font-bold text-slate-700">
                  {isTh ? 'วันที่จะติดตาม (ถ้าทราบ)' : 'Follow-up date (optional)'}
                  <input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)}
                    className="block mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm" />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            {isTh ? 'ยกเลิก' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={!selectedOutcome}
            onClick={handleConfirmAction}
            className={`min-h-[44px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              !selectedOutcome
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : selectedOutcome === 'approved'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : selectedOutcome === 'revision'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                : selectedOutcome === 'undecided'
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            <span>
              {selectedOutcome === 'approved'
                ? isTh
                  ? 'อนุมัติ & ไปนัดหมาย'
                  : 'Approve & Schedule'
                : selectedOutcome === 'revision'
                ? isTh
                  ? 'บันทึก & แก้ใบเสนอราคา'
                  : 'Save & Edit Quote'
                : selectedOutcome === 'undecided'
                ? isTh
                  ? 'บันทึกรอติดตาม'
                  : 'Save Follow-up'
                : selectedOutcome === 'declined'
                ? isTh
                  ? 'ปิดงานทันที'
                  : 'Close Job Now'
                : isTh
                ? 'โปรดเลือกผล'
                : 'Select outcome'}
            </span>
            {selectedOutcome && <ChevronRight className="w-4 h-4 stroke-[3]" />}
          </button>
        </div>
      </div>
    </div>
  );
};
