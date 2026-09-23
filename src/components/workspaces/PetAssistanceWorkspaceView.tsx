import React, { useState, useEffect } from 'react';
import {
  Heart,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Share2,
  Clock,
  User,
  Building2,
  MapPin,
  ExternalLink,
  Phone,
  Receipt,
  Plus,
} from 'lucide-react';
import {
  InspectionJob,
  Vendor,
  Invoice,
  Expense,
  PetAssistanceData,
} from '../../types';
import { useLanguage } from '../../i18n/translations';
import { shareJobToTechnician } from '../../utils/technicianShare';

interface PetAssistanceWorkspaceViewProps {
  job: InspectionJob;
  vendors: Vendor[];
  invoices: Invoice[];
  expenses?: Expense[];
  onUpdateJob: (updater: (prev: InspectionJob) => InspectionJob) => void;
  onRecordPayment: (jobId: string, amount: number) => void;
  onAssignVendor: (vendor: Vendor) => void;
  onCompleteJob: () => void;
  onOpenReport: () => void;
  onOpenQuickEstimate: () => void;
  onAddExpense?: (jobId: string) => void;
  onOpenSwitchJob?: () => void;
  jobsCount?: number;
  currentJobIndex?: number;
}

export const PetAssistanceWorkspaceView: React.FC<PetAssistanceWorkspaceViewProps> = ({
  job,
  vendors,
  invoices,
  expenses = [],
  onUpdateJob,
  onRecordPayment,
  onAssignVendor,
  onCompleteJob,
  onOpenReport,
  onOpenQuickEstimate,
  onAddExpense,
  onOpenSwitchJob,
  jobsCount = 1,
  currentJobIndex = 0,
}) => {
  const { lang } = useLanguage();
  const isTh = lang === 'th';

  const [details, setDetails] = useState<PetAssistanceData>(() => {
    if (job.petAssistanceDetails) return job.petAssistanceDetails;
    return {
      petName: 'Milo',
      petType: 'Dog',
      breed: 'Golden Retriever',
      clinicName: 'Thalang Animal Hospital',
      clinicLocation: 'Thepkasattri Rd, Thalang',
      serviceRequired: 'Vaccination',
      appointmentDate: job.scheduledDate || 'Today',
      appointmentTime: job.scheduledTime || '14:00',
      petCarrierProvided: true,
      specialInstructions: 'Bring vaccination booklet located in villa entrance cabinet.',
      vetExpensesThb: 0,
    };
  });

  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const updateDetails = (updater: (prev: PetAssistanceData) => PetAssistanceData) => {
    setDetails((prev) => {
      const updated = updater(prev);
      onUpdateJob((currentJob) => ({
        ...currentJob,
        petAssistanceDetails: updated,
      }));
      return updated;
    });
  };

  useEffect(() => {
    if (!job.petAssistanceDetails) {
      onUpdateJob((prev) => ({
        ...prev,
        petAssistanceDetails: details,
      }));
    }
  }, []);

  const handleShareToTechnician = async () => {
    setIsSharing(true);
    const result = await shareJobToTechnician(job, undefined, undefined, isTh ? 'th' : 'en');
    setIsSharing(false);

    if (result.success) {
      const nowIso = new Date().toISOString();
      onUpdateJob((prev) => ({
        ...prev,
        technicianSharedAt: nowIso,
      }));
      setShareFeedback(
        result.method === 'share_api'
          ? isTh ? 'เปิดหน้าต่างแชร์เรียบร้อย' : 'Share sheet opened'
          : isTh ? 'คัดลอกรายละเอียดงานลงคลิปบอร์ดแล้ว พร้อมส่งต่อ' : 'Copied job details to clipboard!'
      );
    } else {
      setShareFeedback(result.error || (isTh ? 'ไม่สามารถแชร์ได้' : 'Sharing failed'));
    }

    setTimeout(() => setShareFeedback(null), 4000);
  };

  const matchingInvoice = invoices.find((inv) => inv.jobId === job.id);
  const jobExpenses = expenses.filter((e) => e.jobId === job.id);
  const totalOutPocket = jobExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto">
      {/* 1. Header */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-rose-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold shrink-0 border border-rose-500/30">
            <Heart className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
              {isTh ? 'บริการดูแลและพาสัตว์เลี้ยงพบแพทย์ PTL' : 'PTL Pet & Veterinary Assistance'}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white truncate">
              {details.petName} ({details.petType}) &rarr; {details.clinicName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShareToTechnician}
            disabled={isSharing}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 text-rose-200 border border-rose-400/30 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{isTh ? 'แชร์ให้ผู้ช่วย/คนขับ' : 'Share to Driver'}</span>
          </button>

          {job.status !== 'Completed' ? (
            <button
              type="button"
              onClick={onCompleteJob}
              className="text-xs font-black bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isTh ? 'เสร็จสิ้นงาน' : 'Complete Job'}</span>
            </button>
          ) : (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              ✓ {isTh ? 'งานเสร็จแล้ว' : 'Job Completed'}
            </span>
          )}
        </div>
      </div>

      {/* Share Status */}
      {(job.technicianSharedAt || shareFeedback) && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {shareFeedback
                ? shareFeedback
                : isTh
                ? `แชร์รายละเอียดให้ผู้ช่วยแล้ว เมื่อ ${new Date(job.technicianSharedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : `Shared with assistant at ${new Date(job.technicianSharedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleShareToTechnician}
            className="text-rose-800 hover:text-rose-950 font-bold underline cursor-pointer text-[11px]"
          >
            {isTh ? 'แชร์ซ้ำ' : 'Share again'}
          </button>
        </div>
      )}

      {/* 2. Pet & Vet Appointment Details */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'ชื่อสัตว์เลี้ยง' : 'Pet Name'}
            </span>
            <span className="font-bold text-slate-900">{details.petName} ({details.breed || details.petType})</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'คลินิก / โรงพยาบาล' : 'Clinic Name'}
            </span>
            <span className="font-bold text-slate-900">{details.clinicName}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'เวลานัดหมาย' : 'Appointment Time'}
            </span>
            <span className="font-bold text-slate-900">{details.appointmentDate} • {details.appointmentTime}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'กรง / สายจูง' : 'Carrier / Leash'}
            </span>
            <span className="font-bold text-emerald-700">
              {details.petCarrierProvided ? 'Provided by Owner' : 'PTL Carrier Needed'}
            </span>
          </div>
        </div>

        {details.specialInstructions && (
          <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950">
            <span className="font-bold block text-[10px] uppercase text-amber-800 mb-0.5">
              {isTh ? 'คำแนะนำพิเศษจากเจ้าของสัตว์เลี้ยง:' : 'Special Instructions:'}
            </span>
            {details.specialInstructions}
          </div>
        )}
      </div>

      {/* 3. Out of Pocket Expenses */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>{isTh ? 'ค่าใช้จ่ายคลินิกสำรองจ่าย (บิลสัตวแพทย์)' : 'Vet Clinic Expenses (Out-of-Pocket)'}</span>
          </h3>
          {onAddExpense && (
            <button
              type="button"
              onClick={() => onAddExpense(job.id)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isTh ? '+ บันทึกบิล' : '+ Log Expense'}</span>
            </button>
          )}
        </div>

        {totalOutPocket > 0 ? (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
            <span className="font-bold text-slate-800">{isTh ? 'ยอดสำรองจ่ายรวม:' : 'Total Out-of-Pocket:'}</span>
            <span className="font-black text-rose-700 text-sm">฿{totalOutPocket.toLocaleString()} THB</span>
          </div>
        ) : (
          <div className="text-center py-4 text-slate-400">
            {isTh ? 'ยังไม่มีรายการสำรองจ่ายค่าหมอหรือค่ายา' : 'No veterinary clinic expenses logged yet.'}
          </div>
        )}
      </div>

      {/* 4. Financial Summary */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            {isTh ? 'ค่าบริการ PTL' : 'Service Price'}
          </span>
          <div className="text-lg font-black text-slate-900">
            ฿{(job.price || 1200).toLocaleString()} THB
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            {isTh ? 'ยอดคงเหลือ' : 'Balance Due'}
          </span>
          <div className="text-lg font-black text-amber-700">
            ฿{(matchingInvoice ? matchingInvoice.balanceDue : (job.price || 1200)).toLocaleString()} THB
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onRecordPayment(job.id, matchingInvoice?.balanceDue || job.price || 1200)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            {isTh ? 'บันทึกการชำระเงิน' : 'Record Payment'}
          </button>
          <button
            type="button"
            onClick={onOpenReport}
            className="bg-[#102a4e] hover:bg-blue-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            {isTh ? 'ดูรายงาน PDF' : 'View PDF Report'}
          </button>
        </div>
      </div>
    </div>
  );
};
