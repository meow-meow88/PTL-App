import React, { useState, useEffect } from 'react';
import {
  Plane,
  CheckCircle2,
  Share2,
  Clock,
  User,
  Building2,
  MapPin,
  ExternalLink,
  Phone,
  Car,
  Luggage,
} from 'lucide-react';
import {
  InspectionJob,
  Vendor,
  Invoice,
  Expense,
  AirportAssistanceData,
} from '../../types';
import { useLanguage } from '../../i18n/translations';
import { shareJobToTechnician } from '../../utils/technicianShare';

interface AirportAssistanceWorkspaceViewProps {
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

export const AirportAssistanceWorkspaceView: React.FC<AirportAssistanceWorkspaceViewProps> = ({
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

  const [details, setDetails] = useState<AirportAssistanceData>(() => {
    if (job.airportAssistanceDetails) return job.airportAssistanceDetails;
    return {
      serviceDirection: 'Arrival Pickup',
      airportName: 'Phuket International Airport (HKT)',
      flightNumber: 'TG204',
      scheduledDateTime: `${job.scheduledDate || 'Today'} ${job.scheduledTime || '15:30'}`,
      passengerCount: 2,
      luggageCount: 3,
      pickupLocation: 'HKT International Arrivals Exit Gate 3',
      destinationLocation: job.propertyLocation || job.villaName || 'Villa in Rawai',
      signboardName: job.customerName || 'PTL Guest',
      driverName: 'PTL Airport Dispatch',
      flightStatus: 'On Schedule',
    };
  });

  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const updateDetails = (updater: (prev: AirportAssistanceData) => AirportAssistanceData) => {
    setDetails((prev) => {
      const updated = updater(prev);
      onUpdateJob((currentJob) => ({
        ...currentJob,
        airportAssistanceDetails: updated,
      }));
      return updated;
    });
  };

  useEffect(() => {
    if (!job.airportAssistanceDetails) {
      onUpdateJob((prev) => ({
        ...prev,
        airportAssistanceDetails: details,
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

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto">
      {/* 1. Header */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-sky-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0 border border-sky-500/30">
            <Plane className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-sky-400 uppercase tracking-widest">
              {isTh ? 'บริการรับ-ส่งสนามบินภูเก็ต PTL' : 'PTL Airport Transfer & Logistics'}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white truncate">
              {details.serviceDirection} • {details.flightNumber || 'Direct Transfer'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShareToTechnician}
            disabled={isSharing}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 text-sky-200 border border-sky-400/30 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            <span>{isTh ? 'แชร์ให้คนขับ' : 'Share to Driver'}</span>
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
        <div className="bg-sky-50 border border-sky-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-sky-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {shareFeedback
                ? shareFeedback
                : isTh
                ? `แชร์รายละเอียดให้คนขับแล้ว เมื่อ ${new Date(job.technicianSharedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : `Shared with driver at ${new Date(job.technicianSharedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleShareToTechnician}
            className="text-sky-800 hover:text-sky-950 font-bold underline cursor-pointer text-[11px]"
          >
            {isTh ? 'แชร์ซ้ำ' : 'Share again'}
          </button>
        </div>
      )}

      {/* 2. Flight & Transfer Details */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'เที่ยวบิน' : 'Flight Number'}
            </span>
            <span className="font-bold text-slate-900">{details.flightNumber || 'Private Transfer'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'เวลานัดหมาย' : 'Scheduled Time'}
            </span>
            <span className="font-bold text-slate-900">{details.scheduledDateTime}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'ผู้โดยสาร / กระเป๋า' : 'Pax / Luggage'}
            </span>
            <span className="font-bold text-slate-900">
              {details.passengerCount} ท่าน • {details.luggageCount} ใบ
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'ป้ายชื่อต้อนรับ' : 'Welcome Sign'}
            </span>
            <span className="font-bold text-sky-800">{details.signboardName}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">
              {isTh ? 'จุดรับ' : 'Pickup Point'}
            </span>
            <span className="font-bold text-slate-900">{details.pickupLocation}</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">
              {isTh ? 'จุดส่งปลายทาง' : 'Destination'}
            </span>
            <span className="font-bold text-slate-900">{details.destinationLocation}</span>
          </div>
        </div>
      </div>

      {/* 3. Financial Summary */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            {isTh ? 'ค่าบริการรับ-ส่ง' : 'Transfer Price'}
          </span>
          <div className="text-lg font-black text-slate-900">
            ฿{(job.price || 1500).toLocaleString()} THB
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            {isTh ? 'ยอดคงเหลือ' : 'Balance Due'}
          </span>
          <div className="text-lg font-black text-amber-700">
            ฿{(matchingInvoice ? matchingInvoice.balanceDue : (job.price || 1500)).toLocaleString()} THB
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onRecordPayment(job.id, matchingInvoice?.balanceDue || job.price || 1500)}
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
