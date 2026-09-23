import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Share2,
  Clock,
  Upload,
  User,
  Building2,
  MapPin,
  ExternalLink,
  Phone,
  Zap,
  Radio,
  Sliders,
} from 'lucide-react';
import {
  InspectionJob,
  Vendor,
  Invoice,
  Expense,
  SmartHomeAssessmentData,
} from '../../types';
import { useLanguage } from '../../i18n/translations';
import { shareJobToTechnician } from '../../utils/technicianShare';

interface SmartHomeWorkspaceViewProps {
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

export const SmartHomeWorkspaceView: React.FC<SmartHomeWorkspaceViewProps> = ({
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

  const [assessment, setAssessment] = useState<SmartHomeAssessmentData>(() => {
    if (job.smartHomeAssessment) return job.smartHomeAssessment;
    return {
      ecosystem: 'Tuya / Smart Life',
      deviceType: 'Smart Wall Switch',
      roomZone: job.villaName || 'Master Bedroom & Living',
      powerConfiguration: 'No-Neutral (Bypass Capacitor Required)',
      physicalSwitchOperating: true,
      gatewayOnline: true,
      rfSignalQuality: 'Strong',
      bypassCapacitorInstalled: true,
      automationTestedOk: true,
    };
  });

  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const updateAssessment = (updater: (prev: SmartHomeAssessmentData) => SmartHomeAssessmentData) => {
    setAssessment((prev) => {
      const updated = updater(prev);
      onUpdateJob((currentJob) => ({
        ...currentJob,
        smartHomeAssessment: updated,
      }));
      return updated;
    });
  };

  useEffect(() => {
    if (!job.smartHomeAssessment) {
      onUpdateJob((prev) => ({
        ...prev,
        smartHomeAssessment: assessment,
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
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-purple-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold shrink-0 border border-purple-500/30">
            <Cpu className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
              {isTh ? 'พื้นที่ทำงานระบบสมาร์ทโฮม PTL' : 'PTL Smart Home Workspace'}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white truncate">
              {assessment.deviceType} • {assessment.ecosystem}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShareToTechnician}
            disabled={isSharing}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 text-purple-200 border border-purple-400/30 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            <span>{isTh ? 'แชร์ให้ช่าง' : 'Share to Technician'}</span>
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
        <div className="bg-purple-50 border border-purple-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {shareFeedback
                ? shareFeedback
                : isTh
                ? `แชร์รายละเอียดให้ช่างแล้ว เมื่อ ${new Date(job.technicianSharedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : `Shared with technician at ${new Date(job.technicianSharedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleShareToTechnician}
            className="text-purple-800 hover:text-purple-950 font-bold underline cursor-pointer text-[11px]"
          >
            {isTh ? 'แชร์ซ้ำ' : 'Share again'}
          </button>
        </div>
      )}

      {/* 2. Client Identity */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-purple-600" />
              <span className="font-extrabold text-slate-900 text-base">{job.customerName}</span>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                SMART HOME
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-800">{job.villaName}</span>
              <span>•</span>
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{job.propertyLocation}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {job.customerPhone && (
              <a
                href={`tel:${job.customerPhone}`}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
              </a>
            )}
            {job.propertyLocation && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${job.villaName}, ${job.propertyLocation}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1"
              >
                <span>Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {onOpenSwitchJob && (
              <button
                onClick={onOpenSwitchJob}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-xl"
              >
                {isTh ? `สลับงาน (${currentJobIndex + 1}/${jobsCount})` : `Switch (${currentJobIndex + 1}/${jobsCount})`}
              </button>
            )}
          </div>
        </div>

        {/* Smart Home Config Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Ecosystem
            </span>
            <span className="font-bold text-slate-900">{assessment.ecosystem}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Power Line
            </span>
            <span className="font-bold text-slate-900">{assessment.powerConfiguration}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Physical Relay
            </span>
            <span className="font-bold text-slate-900">
              {assessment.physicalSwitchOperating ? 'Working' : 'Defective'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Gateway RF
            </span>
            <span className="font-bold text-emerald-700">{assessment.rfSignalQuality}</span>
          </div>
        </div>
      </div>

      {/* 3. Anti-Flicker & Commissioning Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-600" />
          <span>{isTh ? 'การตรวจสอบทางเทคนิค: สวิตช์อัจฉริยะ & ตัวเก็บประจุแก้ไฟกะพริบ' : 'Smart Switch & Anti-Flicker Capacitor Check'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={assessment.bypassCapacitorInstalled || false}
              onChange={(e) => updateAssessment((p) => ({ ...p, bypassCapacitorInstalled: e.target.checked }))}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <div>
              <span className="font-bold text-slate-900 block">{isTh ? 'ติดตั้งตัวเก็บประจุ Bypass ครบถ้วน' : 'Anti-Flicker Capacitor Installed'}</span>
              <span className="text-[10px] text-slate-500">{isTh ? 'ป้องกันหลอด LED กะพริบเมื่อปิดสวิตช์ (สวิตช์ไม่มี N)' : 'Prevents LED ghost glow when switch is OFF'}</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={assessment.automationTestedOk || false}
              onChange={(e) => updateAssessment((p) => ({ ...p, automationTestedOk: e.target.checked }))}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <div>
              <span className="font-bold text-slate-900 block">{isTh ? 'ทดสอบการสั่งการผ่านแอป & ซีนอัตโนมัติ' : 'App & Automation Scene Tested'}</span>
              <span className="text-[10px] text-slate-500">{isTh ? 'สั่งเปิด-ปิดผ่านมือถือและตั้งเวลาสำเร็จ' : 'App remote control and schedules verified'}</span>
            </div>
          </label>
        </div>
      </div>

      {/* 4. Financial Summary */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            {isTh ? 'ราคางานสมาร์ทโฮม' : 'Smart Home Service Price'}
          </span>
          <div className="text-lg font-black text-slate-900">
            ฿{(job.price || 1800).toLocaleString()} THB
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            {isTh ? 'ยอดคงเหลือ' : 'Balance Due'}
          </span>
          <div className="text-lg font-black text-amber-700">
            ฿{(matchingInvoice ? matchingInvoice.balanceDue : (job.price || 1800)).toLocaleString()} THB
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onRecordPayment(job.id, matchingInvoice?.balanceDue || job.price || 1800)}
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
