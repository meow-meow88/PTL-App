import React, { useState, useEffect } from 'react';
import {
  Wifi,
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
  Activity,
  Gauge,
  Router,
  Radio,
} from 'lucide-react';
import {
  InspectionJob,
  Vendor,
  Invoice,
  Expense,
  NetworkAssessmentData,
  EvidencePhoto,
} from '../../types';
import { useLanguage } from '../../i18n/translations';
import { shareJobToTechnician } from '../../utils/technicianShare';

interface NetworkWifiWorkspaceViewProps {
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

export const NetworkWifiWorkspaceView: React.FC<NetworkWifiWorkspaceViewProps> = ({
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

  const [assessment, setAssessment] = useState<NetworkAssessmentData>(() => {
    if (job.networkAssessment) return job.networkAssessment;
    return {
      issueType: 'Wi-Fi Dead Zone',
      ispName: 'AIS Fibre',
      routerModel: 'Wi-Fi 6 Mesh System',
      accessPointCount: 2,
      switchType: 'PoE Gigabit Switch',
      cableStatus: 'Good',
      speedtestDownloadMbps: 350,
      speedtestUploadMbps: 300,
      speedtestPingMs: 6,
      wifiTestedOk: true,
    };
  });

  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const updateAssessment = (updater: (prev: NetworkAssessmentData) => NetworkAssessmentData) => {
    setAssessment((prev) => {
      const updated = updater(prev);
      onUpdateJob((currentJob) => ({
        ...currentJob,
        networkAssessment: updated,
      }));
      return updated;
    });
  };

  useEffect(() => {
    if (!job.networkAssessment) {
      onUpdateJob((prev) => ({
        ...prev,
        networkAssessment: assessment,
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
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-cyan-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold shrink-0 border border-cyan-500/30">
            <Wifi className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
              {isTh ? 'พื้นที่ทำงานระบบเครือข่าย & Wi-Fi PTL' : 'PTL Wi-Fi & Network Workspace'}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white truncate">
              {assessment.issueType} • {assessment.ispName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShareToTechnician}
            disabled={isSharing}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 text-cyan-200 border border-cyan-400/30 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
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
        <div className="bg-cyan-50 border border-cyan-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-cyan-900">
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
            className="text-cyan-800 hover:text-cyan-950 font-bold underline cursor-pointer text-[11px]"
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
              <User className="w-4 h-4 text-cyan-600" />
              <span className="font-extrabold text-slate-900 text-base">{job.customerName}</span>
              <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2 py-0.5 rounded-full">
                NETWORK & WI-FI
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

        {/* Network Equipment Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              ISP Provider
            </span>
            <span className="font-bold text-slate-900">{assessment.ispName}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Access Points
            </span>
            <span className="font-bold text-slate-900">{assessment.accessPointCount} APs</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Switch / PoE
            </span>
            <span className="font-bold text-slate-900">{assessment.switchType}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Cable Status
            </span>
            <span className="font-bold text-slate-900">{assessment.cableStatus}</span>
          </div>
        </div>
      </div>

      {/* 3. Speedtest & Performance Metrics */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-600" />
          <span>{isTh ? 'ผลการทดสอบความเร็ว & แบนด์วิดธ์ (Speedtest)' : 'Speedtest & Latency Verification'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
              Download Speed
            </span>
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                value={assessment.speedtestDownloadMbps || ''}
                onChange={(e) => updateAssessment((p) => ({ ...p, speedtestDownloadMbps: Number(e.target.value) }))}
                className="font-black text-xl text-cyan-700 bg-white border border-slate-200 rounded px-2 py-0.5 w-24"
              />
              <span className="font-bold text-slate-600">Mbps</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
              Upload Speed
            </span>
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                value={assessment.speedtestUploadMbps || ''}
                onChange={(e) => updateAssessment((p) => ({ ...p, speedtestUploadMbps: Number(e.target.value) }))}
                className="font-black text-xl text-emerald-700 bg-white border border-slate-200 rounded px-2 py-0.5 w-24"
              />
              <span className="font-bold text-slate-600">Mbps</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
              Ping / Latency
            </span>
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                value={assessment.speedtestPingMs || ''}
                onChange={(e) => updateAssessment((p) => ({ ...p, speedtestPingMs: Number(e.target.value) }))}
                className="font-black text-xl text-slate-900 bg-white border border-slate-200 rounded px-2 py-0.5 w-24"
              />
              <span className="font-bold text-slate-600">ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Financial Summary */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            {isTh ? 'ราคางานระบบเครือข่าย' : 'Network Service Price'}
          </span>
          <div className="text-lg font-black text-slate-900">
            ฿{(job.price || 2000).toLocaleString()} THB
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            {isTh ? 'ยอดคงเหลือ' : 'Balance Due'}
          </span>
          <div className="text-lg font-black text-amber-700">
            ฿{(matchingInvoice ? matchingInvoice.balanceDue : (job.price || 2000)).toLocaleString()} THB
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onRecordPayment(job.id, matchingInvoice?.balanceDue || job.price || 2000)}
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
