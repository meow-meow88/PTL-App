import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  FileText,
  DollarSign,
  Key,
  Bot,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { InspectionJob, Customer, Property, Invoice, Expense } from '../../types';
import { getLocalizedServiceName } from '../../utils/serviceWorkflow';

interface BeforeInspectionWorkspaceViewProps {
  job: InspectionJob;
  customer?: Customer;
  property?: Property;
  formattedDate: string;
  formattedTime: string;
  isApptConfirmed: boolean;
  isTh: boolean;
  lang: 'en' | 'th';
  invoices?: Invoice[];
  expenses?: Expense[];
  onConfirmAppointment: () => void;
  onStartInspection: () => void;
  onOpenQuotation: (jobId: string, action?: 'view' | 'edit' | 'send' | 'preview') => void;
  onOpenScheduleModal?: () => void;
  onOpenQuickEstimate?: () => void;
  onUpdateJob: (updater: (prev: InspectionJob) => InspectionJob) => void;
}

export const BeforeInspectionWorkspaceView: React.FC<BeforeInspectionWorkspaceViewProps> = ({
  job,
  customer,
  property,
  formattedDate,
  formattedTime,
  isApptConfirmed,
  isTh,
  lang,
  invoices = [],
  expenses = [],
  onConfirmAppointment,
  onStartInspection,
  onOpenQuotation,
  onOpenScheduleModal,
  onOpenQuickEstimate,
  onUpdateJob,
}) => {
  // Collapsible drawers state (Section 10: Collapse secondary tools)
  const [openSection, setOpenSection] = useState<'none' | 'docs' | 'finance' | 'access' | 'ai' | 'history'>('none');
  const [copiedDraft, setCopiedDraft] = useState<string | null>(null);

  const toggleSection = (section: 'docs' | 'finance' | 'access' | 'ai' | 'history') => {
    setOpenSection((prev) => (prev === section ? 'none' : section));
  };

  const reportedIssue =
    job.requestDescription ||
    job.notes ||
    (isTh ? 'แจ้งปัญหาเข้ามาเบื้องต้น' : 'Customer reported issue');

  const phoneVal = customer?.phone || job.customerPhone;
  const cleaned = phoneVal ? phoneVal.replace(/[^0-9+]/g, '') : '';
  const waVal = customer?.lineWhatsapp || job.customerWhatsApp || phoneVal;
  const waCleaned = waVal ? waVal.replace(/[^0-9]/g, '') : '';
  const waUrl = waCleaned ? `https://wa.me/${waCleaned}` : undefined;

  const quoteTotal =
    job.quotation?.serviceItems?.reduce((s, i) => s + (i.amount || 0), 0) ??
    (job.quotation?.hardwareItems?.reduce((s, i) => s + (i.amount || 0), 0) ?? 2500);

  const paymentTerm =
    job.quotation?.paymentTerm ||
    (job.quotation?.depositPercent === 0
      ? isTh ? 'จ่ายหลังตรวจเสร็จ (มัดจำ 0%)' : 'Pay After Inspection (0% Deposit)'
      : isTh ? 'มัดจำ 50% / จ่ายวันส่งมอบ 50%' : '50% Deposit / 50% on completion');

  const accessNote =
    property?.accessInformation ||
    property?.accessInfo ||
    property?.notes ||
    (isTh ? 'ไม่มีข้อมูลการเข้าสถานที่พิเศษ' : 'Standard villa access');

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(label);
    setTimeout(() => setCopiedDraft(null), 2500);
  };

  const preVisitReminderTextEn = `Hello ${customer?.name || job.customerName}, this is Phuket Trusted Local confirming our inspection appointment for ${job.serviceType} at ${job.villaName || property?.name || 'your villa'} on ${formattedDate} at ${formattedTime || '10:00 AM'}. Our technician team is preparing to arrive on time. Please let us know if there are any specific gate access codes. Thank you!`;

  const preVisitReminderTextTh = `สวัสดีครับคุณ ${customer?.name || job.customerName} ทาง Phuket Trusted Local ขอคอนเฟิร์มนัดหมายเข้าตรวจเช็กระบบ ${getLocalizedServiceName(job.serviceType, 'th')} ณ ${job.villaName || property?.name || 'สถานที่'} ในวันที่ ${formattedDate} เวลา ${formattedTime || '10:00 น.'} ทีมช่างเตรียมพร้อมเข้าตรวจตามเวลา หากมีรหัสเข้าประตูหรือข้อมูลเพิ่มเติมสามารถแจ้งได้เลยครับ ขอบคุณครับ`;

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full">
      {/* ========================================================================= */}
      {/* 1. PRIMARY STAGE CARD (Strictly Section 2: Show only relevant info) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        {/* Reported Issue Callout */}
        <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200/70">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black tracking-wider uppercase text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-md">
              {isTh ? 'ปัญหาที่แจ้งเข้ามา' : 'REPORTED ISSUE'}
            </span>
            <span className="text-xs text-amber-800 font-semibold">• {getLocalizedServiceName(job.serviceType, lang)}</span>
          </div>
          <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {reportedIssue}
          </p>
        </div>

        {/* Essential Job Context Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Customer & Location */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              {isTh ? 'ข้อมูลลูกค้าและสถานที่' : 'Customer & Location'}
            </span>
            <div className="font-extrabold text-slate-900 text-sm">
              {customer?.name || job.customerName}
            </div>
            <div className="text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{job.villaName || property?.name || job.propertyLocation}</span>
            </div>
            {job.propertyLocation && job.propertyLocation !== job.villaName && (
              <div className="text-[11px] text-slate-500 truncate pl-4.5">
                {job.propertyLocation}
              </div>
            )}
          </div>

          {/* Appointment & Status */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              {isTh ? 'เวลานัดหมายและสถานะ' : 'Appointment & Stage'}
            </span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedDate}</span>
              <Clock className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <span>{formattedTime ? `${formattedTime} (24h)` : isTh ? 'ตามตกลง' : 'TBD'}</span>
            </div>
            <div className="pt-1">
              {isApptConfirmed ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isTh ? 'ยืนยันนัดหมายแล้ว • พร้อมเข้าตรวจ' : 'Appointment Confirmed • Ready'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isTh ? 'ยังไม่ยืนยันนัด • รอยืนยันกับลูกค้า' : 'Appointment Not Confirmed'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Primary Action Box & 1-2 Secondary Actions */}
        <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
              {isTh ? 'การดำเนินการถัดไป (NEXT ACTION)' : 'NEXT ACTION'}
            </span>
            <div className="text-sm sm:text-base font-bold text-white mt-0.5">
              {!isApptConfirmed
                ? isTh ? 'ยืนยันวันเวลานัดหมายกับลูกค้า' : 'Confirm scheduled appointment with customer'
                : isTh ? 'เริ่มเข้าตรวจเมื่อถึงสถานที่' : 'Start technical inspection upon arrival'}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              {!isApptConfirmed
                ? isTh ? 'โทรหรือทัก WhatsApp เพื่อยืนยันเวลาเข้าตรวจ' : 'Reach out via WhatsApp/Phone to lock schedule'
                : isTh ? 'ระบบจะเริ่มบันทึกเวลาเข้าตรวจจริงหน้างาน' : 'Will record actual on-site arrival timestamp'}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* ONE DOMINANT PRIMARY ACTION */}
            {!isApptConfirmed ? (
              <button
                type="button"
                id="btn-confirm-appointment-dominant"
                onClick={onConfirmAppointment}
                className="min-h-[44px] px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>{isTh ? 'ยืนยันนัดหมาย' : 'Confirm Appointment'}</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-start-inspection-dominant"
                onClick={onStartInspection}
                className="min-h-[44px] px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-slate-950" />
                <span>{isTh ? 'เริ่มเข้าตรวจ' : 'Start Inspection'}</span>
              </button>
            )}

            {/* ONE OR TWO SMALL SECONDARY ACTIONS */}
            <button
              type="button"
              onClick={() => onOpenQuotation(job.id, 'preview')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-300" />
              <span>{isTh ? 'ดูใบเสนอราคา' : 'View Inspection Quote'}</span>
            </button>

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                title="WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECTION 10: COLLAPSED SECONDARY TOOLS (Drawers at the bottom) */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
          {isTh ? 'เครื่องมือและข้อมูลเพิ่มเติม (แตะเพื่อเปิด)' : 'More Tools & Information (Tap to expand)'}
        </div>

        {/* Drawer 1: Documents */}
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('docs')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">
                {isTh ? 'เอกสารและใบเสนอราคา (Documents)' : 'Documents & Quotations'}
              </span>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {job.quotation?.refNo || 'QT-001'}
              </span>
            </div>
            {openSection === 'docs' ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSection === 'docs' && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                <div>
                  <div className="font-bold text-slate-900">
                    {isTh ? 'ใบเสนอราคาค่าตรวจเช็กหน้างาน (Inspection Quote)' : 'On-Site Diagnostic Quote'}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    {isTh ? 'รหัสเอกสาร:' : 'Ref:'} {job.quotation?.refNo || 'QT-2026-MARK'} • ฿{quoteTotal.toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenQuotation(job.id, 'preview')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{isTh ? 'เปิดดูเอกสาร' : 'Open Preview'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer 2: Finance */}
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('finance')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">
                {isTh ? 'การเงินและเงื่อนไขการชำระ (Finance & Terms)' : 'Finance & Payment Terms'}
              </span>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                ฿{quoteTotal.toLocaleString()}
              </span>
            </div>
            {openSection === 'finance' ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSection === 'finance' && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    {isTh ? 'ค่าบริการประเมิน' : 'Inspection Fee'}
                  </span>
                  <span className="text-base font-black text-slate-900">
                    ฿{quoteTotal.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    {isTh ? 'เงื่อนไขชำระเงิน' : 'Payment Term'}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {paymentTerm}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer 3: Property & Access Notes */}
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('access')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Key className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-800">
                {isTh ? 'ข้อมูลการเข้าวิลล่าและรหัสผ่าน (Villa Access)' : 'Property & Villa Access Notes'}
              </span>
            </div>
            {openSection === 'access' ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSection === 'access' && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-500">
                  {isTh ? 'ข้อมูลการเข้าถึง / กุญแจ / รหัสกลอน' : 'Access Code & Key Information'}
                </div>
                <p className="text-slate-800 font-medium">
                  {accessNote}
                </p>
                {property?.contactPerson && (
                  <div className="pt-1 text-slate-600">
                    <span className="font-bold">{isTh ? 'ผู้ดูแลสถานที่:' : 'Contact:'}</span> {property.contactPerson}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer 4: AI & Communication Drafts */}
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('ai')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Bot className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-800">
                {isTh ? 'ข้อความแจ้งเตือนลูกค้าและเครื่องมือ AI' : 'Communication Drafts & AI Tools'}
              </span>
            </div>
            {openSection === 'ai' ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSection === 'ai' && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
              {/* Context Actions (Section 9: AI should not dominate screen) */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = isTh ? preVisitReminderTextTh : preVisitReminderTextEn;
                    handleCopyText(text, 'draft');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{copiedDraft === 'draft' ? (isTh ? 'คัดลอกแล้ว!' : 'Copied!') : (isTh ? 'คัดลอกข้อความยืนยันนัด' : 'Copy Pre-Visit Message')}</span>
                </button>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800 block mb-0.5">
                  {isTh ? 'ตัวอย่างข้อความแจ้งลูกค้า:' : 'Client Message Preview:'}
                </span>
                {isTh ? preVisitReminderTextTh : preVisitReminderTextEn}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
