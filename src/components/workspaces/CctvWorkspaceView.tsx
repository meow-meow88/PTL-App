import React, { useState, useEffect } from 'react';
import {
  Camera,
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
  Wrench,
  Shield,
  Activity,
  HardDrive,
  Eye,
  Smartphone,
} from 'lucide-react';
import {
  InspectionJob,
  Vendor,
  Invoice,
  Expense,
  CctvAssessmentData,
  EvidencePhoto,
} from '../../types';
import { useLanguage } from '../../i18n/translations';
import { shareJobToTechnician } from '../../utils/technicianShare';

interface CctvWorkspaceViewProps {
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

export const CctvWorkspaceView: React.FC<CctvWorkspaceViewProps> = ({
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

  const [assessment, setAssessment] = useState<CctvAssessmentData>(() => {
    if (job.cctvAssessment) return job.cctvAssessment;
    return {
      cameraZone: job.villaName || 'Main Entrance & Perimeter',
      cameraType: 'Bullet',
      cameraModel: 'Hikvision / Dahua 4MP IP',
      quantity: 1,
      deploymentType: 'Repair / Swap',
      storageType: 'NVR / Hard Drive',
      powerType: 'PoE (802.3af/at)',
      cableType: 'Cat6 Outdoor',
      mountingHeight: '3.0m (Requires step ladder)',
      missingInfo: [],
      streamingVerified: false,
      recordingVerified: false,
      mobileAppVerified: false,
    };
  });

  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const updateAssessment = (updater: (prev: CctvAssessmentData) => CctvAssessmentData) => {
    setAssessment((prev) => {
      const updated = updater(prev);
      onUpdateJob((currentJob) => ({
        ...currentJob,
        cctvAssessment: updated,
      }));
      return updated;
    });
  };

  useEffect(() => {
    if (!job.cctvAssessment) {
      onUpdateJob((prev) => ({
        ...prev,
        cctvAssessment: assessment,
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newPhoto: EvidencePhoto = {
        id: `photo_${Date.now()}`,
        jobId: job.id,
        photoUrl: dataUrl,
        capturedAt: new Date().toISOString(),
        caption: `CCTV Evidence - ${assessment.cameraZone}`,
      };

      onUpdateJob((prev) => ({
        ...prev,
        evidencePhotos: [...(prev.evidencePhotos || []), newPhoto],
      }));
      setIsUploadingPhoto(false);
    };
    reader.onerror = () => setIsUploadingPhoto(false);
    reader.readAsDataURL(file);
  };

  const matchingInvoice = invoices.find((inv) => inv.jobId === job.id);

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-indigo-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0 border border-indigo-500/30">
            <Camera className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              {isTh ? 'พื้นที่ทำงานระบบกล้องวงจรปิด PTL' : 'PTL CCTV Security Workspace'}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white truncate">
              {assessment.cameraZone} — {assessment.quantity}x {assessment.cameraType}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShareToTechnician}
            disabled={isSharing}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 text-indigo-200 border border-indigo-400/30 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
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
        <div className="bg-indigo-50 border border-indigo-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-indigo-900">
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
            className="text-indigo-800 hover:text-indigo-950 font-bold underline cursor-pointer text-[11px]"
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
              <User className="w-4 h-4 text-indigo-600" />
              <span className="font-extrabold text-slate-900 text-base">{job.customerName}</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                CCTV SECURITY
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

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'ชนิดกล้อง' : 'Camera Type'}
            </span>
            <span className="font-bold text-slate-900">{assessment.cameraType}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'แหล่งจ่ายไฟ' : 'Power Supply'}
            </span>
            <span className="font-bold text-slate-900">{assessment.powerType}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'ระบบบันทึกภาพ' : 'Storage / NVR'}
            </span>
            <span className="font-bold text-slate-900">{assessment.storageType}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'ความสูงจุดติดตั้ง' : 'Mounting Height'}
            </span>
            <span className="font-bold text-slate-900">{assessment.mountingHeight}</span>
          </div>
        </div>
      </div>

      {/* 3. Verification Checklist */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4 text-indigo-600" />
          <span>{isTh ? 'เกณฑ์ตรวจสอบคุณภาพระบบกล้อง (Commissioning)' : 'CCTV Commissioning Verification'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={assessment.streamingVerified || false}
              onChange={(e) => updateAssessment((p) => ({ ...p, streamingVerified: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <div>
              <span className="font-bold text-slate-900 block">{isTh ? 'ภาพสดสตรีมชัดเจน' : 'Live Stream Clear'}</span>
              <span className="text-[10px] text-slate-500">{isTh ? 'ไม่มีกระตุก มุมมองครอบคลุม' : 'No lag, optimal angle'}</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={assessment.recordingVerified || false}
              onChange={(e) => updateAssessment((p) => ({ ...p, recordingVerified: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <div>
              <span className="font-bold text-slate-900 block">{isTh ? 'บันทึกลง NVR/SD ปกติ' : '24/7 Recording OK'}</span>
              <span className="text-[10px] text-slate-500">{isTh ? 'ทดสอบกรอย้อนหลังได้' : 'Playback tested'}</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={assessment.mobileAppVerified || false}
              onChange={(e) => updateAssessment((p) => ({ ...p, mobileAppVerified: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <div>
              <span className="font-bold text-slate-900 block">{isTh ? 'แอปมือถือลูกค้าเปิดดูได้' : 'Mobile App Connected'}</span>
              <span className="text-[10px] text-slate-500">{isTh ? 'เซ็ตแอคเคาท์พร้อมใช้งาน' : 'Account active'}</span>
            </div>
          </label>
        </div>
      </div>

      {/* 4. Evidence & Photos */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>{isTh ? 'รูปถ่ายมุมมองกล้อง & ตำแหน่งติดตั้ง' : 'Camera Angle & Hardware Photos'}</span>
          </h3>

          <label className="text-[11px] font-bold bg-[#102a4e] hover:bg-blue-900 text-white px-3 py-1.5 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-sky-300" />
            <span>{isTh ? '+ เพิ่มรูปถ่าย' : '+ Add Photo'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={isUploadingPhoto}
            />
          </label>
        </div>

        {job.evidencePhotos && job.evidencePhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {job.evidencePhotos.map((photo, i) => (
              <div key={photo.id || i} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                <img
                  src={photo.photoUrl}
                  alt={photo.caption || `Evidence ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
            {isTh ? 'ยังไม่มีรูปถ่ายหน้างาน ควรถ่ายภาพมุมมองที่กล้องมองเห็น' : 'Capture camera field-of-view for client report.'}
          </div>
        )}
      </div>

      {/* 5. Financial Summary */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            {isTh ? 'ราคางานกล้องวงจรปิด' : 'CCTV Service Price'}
          </span>
          <div className="text-lg font-black text-slate-900">
            ฿{(job.price || 2500).toLocaleString()} THB
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            {isTh ? 'ยอดคงเหลือ' : 'Balance Due'}
          </span>
          <div className="text-lg font-black text-amber-700">
            ฿{(matchingInvoice ? matchingInvoice.balanceDue : (job.price || 2500)).toLocaleString()} THB
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onRecordPayment(job.id, matchingInvoice?.balanceDue || job.price || 2500)}
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
