import React, { useState } from 'react';
import {
  User,
  Building2,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Phone,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Camera,
  FileText,
  Plus,
  Sparkles,
  Zap,
  Wrench,
  Receipt,
  Upload,
  Layers,
  ChevronRight,
  Share2,
  ShieldAlert,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { InspectionJob, Vendor, Invoice, Expense, InspectionItem, EvidencePhoto, ElectricalAssessmentData } from '../types';
import {
  getCapabilitiesForJob,
  getPrimaryJobAction,
  PTL_SERVICES,
  isElectricalService,
} from '../utils/serviceWorkflow';
import { useLanguage } from '../i18n/translations';
import { FindingCard } from './FindingCard';
import { shareJobToTechnician } from '../utils/technicianShare';
import { generateMrBigElectricalAssessment } from '../utils/mrBigLocalAnalyzer';

interface FlexibleJobWorkflowViewProps {
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
  onOpenFindingModal?: (item?: InspectionItem) => void;
  onDeleteFinding?: (itemId: string) => void;
  onAddExpense?: (jobId: string) => void;
  onOpenSwitchJob?: () => void;
  jobsCount?: number;
  currentJobIndex?: number;
}

export const FlexibleJobWorkflowView: React.FC<FlexibleJobWorkflowViewProps> = ({
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
  onOpenFindingModal,
  onDeleteFinding,
  onAddExpense,
  onOpenSwitchJob,
  jobsCount = 1,
  currentJobIndex = 0,
}) => {
  const { lang, t } = useLanguage();
  const fw = t.flexibleWorkflow;
  const capabilities = getCapabilitiesForJob(job);
  const primaryAct = getPrimaryJobAction(job);
  const actionLabel = lang === 'th' ? primaryAct.labelTh : primaryAct.labelEn;

  const [isAssigningVendor, setIsAssigningVendor] = useState(false);
  const [siteNotesInput, setSiteNotesInput] = useState(job.siteNotes || job.notes || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Share to Technician handler
  const handleShareToTechnician = async () => {
    setIsSharing(true);
    const result = await shareJobToTechnician(job, undefined, undefined, lang === 'th' ? 'th' : 'en');
    setIsSharing(false);

    if (result.success) {
      const nowIso = new Date().toISOString();
      onUpdateJob((prev) => ({
        ...prev,
        technicianSharedAt: nowIso,
      }));
      setShareFeedback(
        result.method === 'share_api'
          ? lang === 'th' ? 'เปิดหน้าต่างแชร์เรียบร้อย' : 'Share sheet opened'
          : lang === 'th' ? 'คัดลอกรายละเอียดงานลงคลิปบอร์ดแล้ว พร้อมส่งต่อ' : 'Copied job details to clipboard!'
      );
    } else {
      setShareFeedback(result.error || (lang === 'th' ? 'ไม่สามารถแชร์ได้' : 'Sharing failed'));
    }

    setTimeout(() => setShareFeedback(null), 4000);
  };

  // Job matching invoice & expenses
  const matchingInvoice = invoices.find((inv) => inv.jobId === job.id);
  const jobExpenses = expenses.filter((exp) => exp.jobId === job.id);
  const totalExpenses = jobExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Service definition lookup for localized name
  const serviceDef = PTL_SERVICES.find(
    (s) =>
      s.name.toLowerCase() === (job.serviceType || '').toLowerCase() ||
      s.id.toLowerCase() === (job.serviceType || '').toLowerCase()
  );
  const localizedServiceName = serviceDef
    ? lang === 'th'
      ? serviceDef.nameTh
      : serviceDef.nameEn
    : job.serviceType || 'Service Job';

  // Handle Photo Upload
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
        caption: `${job.serviceType} evidence`,
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

  // Save site notes on blur
  const handleSaveNotes = () => {
    onUpdateJob((prev) => ({
      ...prev,
      siteNotes: siteNotesInput,
      notes: siteNotesInput,
    }));
  };

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. SMART CONTEXTUAL PRIMARY NEXT ACTION BANNER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-white/10 text-sky-300 flex items-center justify-center font-bold shrink-0 border border-white/15">
            <Sparkles className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-sky-300 uppercase tracking-widest">
              {fw.recommendedNextStep}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white truncate">
              {actionLabel}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShareToTechnician}
            disabled={isSharing}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 text-sky-200 border border-sky-400/30 px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title={lang === 'th' ? 'แชร์รายละเอียดงานให้ช่าง' : 'Share job details to technician'}
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            <span>{lang === 'th' ? 'แชร์ให้ช่าง' : 'Share to Technician'}</span>
          </button>

          <button
            onClick={() => {
              if (primaryAct.key === 'start_job' || primaryAct.key === 'start_visit') {
                onUpdateJob((prev) => ({
                  ...prev,
                  status: 'In Progress',
                  visitStartedAt: prev.visitStartedAt || new Date().toISOString(),
                  siteArrivedAt: prev.siteArrivedAt || new Date().toISOString(),
                }));
              } else if (primaryAct.key === 'complete_job') {
                onCompleteJob();
              } else if (primaryAct.key === 'record_payment') {
                onRecordPayment(job.id, job.price || 1500);
              } else if (primaryAct.key === 'create_quote' || primaryAct.key === 'open_report') {
                onOpenReport();
              }
            }}
            className="text-xs sm:text-sm font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{actionLabel}</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

      {/* Share to Technician Status Banner */}
      {(job.technicianSharedAt || shareFeedback) && (
        <div className="bg-sky-50 border border-sky-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-sky-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {shareFeedback
                ? shareFeedback
                : lang === 'th'
                ? `แชร์รายละเอียดให้ช่างแล้ว เมื่อ ${new Date(job.technicianSharedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : `Shared with technician at ${new Date(job.technicianSharedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleShareToTechnician}
            className="text-sky-800 hover:text-sky-950 font-bold underline cursor-pointer text-[11px]"
          >
            {lang === 'th' ? 'แชร์ซ้ำ' : 'Share again'}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HEADER & CLIENT IDENTITY CARD */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="p-1 bg-blue-50 text-blue-700 rounded-md">
                <User className="w-4 h-4" />
              </span>
              <span className="font-extrabold text-slate-900 text-base sm:text-lg truncate">
                {job.customerName}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold border border-slate-200">
                {job.customerGroup === 'villa_owner'
                  ? 'Villa Owner'
                  : job.customerGroup === 'expat'
                  ? 'Expat'
                  : 'Rental/Airbnb'}
              </span>
              {job.urgency === 'Urgent' && (
                <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-200">
                  <AlertCircle className="w-3 h-3" />
                  <span>URGENT</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-bold text-slate-800 truncate">{job.villaName}</span>
              <span className="text-slate-300">•</span>
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{job.propertyLocation}</span>
            </div>
          </div>

          {/* Quick Communication & Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {job.customerPhone && (
              <a
                href={`tel:${job.customerPhone}`}
                className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.actions.call}</span>
              </a>
            )}

            {job.customerPhone && (
              <a
                href={`https://wa.me/${job.customerPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition-colors shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            {onOpenSwitchJob && (
              <button
                onClick={onOpenSwitchJob}
                className="inline-flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded-xl transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{lang === 'th' ? `สลับงาน (${currentJobIndex + 1}/${jobsCount})` : `Switch (${currentJobIndex + 1}/${jobsCount})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Service Classification & Current Status Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {lang === 'th' ? 'ประเภทบริการ' : 'Service Type'}
            </span>
            <div className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
              <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{localizedServiceName}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {lang === 'th' ? 'กลุ่มงาน (Preset)' : 'Workflow Family'}
            </span>
            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
              {job.workflowPreset || 'GENERAL'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {lang === 'th' ? 'สถานะงาน' : 'Job Status'}
            </span>
            <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] ${
              job.status === 'Completed' || job.status === 'Paid'
                ? 'bg-emerald-100 text-emerald-800'
                : job.status === 'In Progress'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {job.status === 'Completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              <span>{job.status}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {fw.customerPrice}
            </span>
            <div className="font-extrabold text-blue-700 text-sm">
              ฿{(job.price || 0).toLocaleString()} THB
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. APPOINTMENT & SCHEDULE CARD (if capability enabled or date exists) */}
      {/* ========================================================================= */}
      {(capabilities.appointment || job.scheduledDate) && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{fw.appointment}</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateJob((prev) => ({
                    ...prev,
                    appointmentConfirmation:
                      prev.appointmentConfirmation === 'Confirmed' ? 'Not Confirmed' : 'Confirmed',
                  }));
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  job.appointmentConfirmation === 'Confirmed'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {job.appointmentConfirmation === 'Confirmed'
                  ? `✓ ${fw.confirmed}`
                  : fw.confirmAppointment}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Calendar className="w-4 h-4 text-slate-500" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">{fw.appointmentDate}</span>
                <span className="font-bold text-slate-800">{job.scheduledDate || job.inspectionDate || 'Not specified'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Clock className="w-4 h-4 text-slate-500" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">{fw.appointmentTime}</span>
                <span className="font-bold text-slate-800">{job.scheduledTime || 'Flexible / Daytime'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. LOCATION & PROPERTY ACCESS CARD */}
      {/* ========================================================================= */}
      {(capabilities.location || job.propertyLocation) && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>{fw.locationAndAccess}</span>
            </h3>
            {job.propertyLocation && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${job.villaName}, ${job.propertyLocation}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                <span>{fw.openInGoogleMaps}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-800">
              <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">
                {fw.directionsOrAddress}
              </span>
              <p className="font-medium">{job.propertyLocation || 'Phuket, Thailand'}</p>
            </div>

            {job.siteAccessNotes && (
              <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/70 text-amber-950">
                <span className="text-[10px] text-amber-700 font-bold block uppercase mb-0.5">
                  {fw.accessInfo}
                </span>
                <p className="text-xs">{job.siteAccessNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VENDOR / CONTRACTOR COORDINATION CARD */}
      {/* ========================================================================= */}
      {(capabilities.vendor || job.assignedVendorId || isAssigningVendor) && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>{fw.vendorCoordination}</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAssigningVendor(!isAssigningVendor)}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
            >
              {job.assignedVendorId ? fw.changeVendor : fw.assignVendor}
            </button>
          </div>

          {job.assignedVendorId ? (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{job.assignedVendorName}</div>
                  <div className="text-[11px] text-slate-500">{job.vendorPhone || 'No phone recorded'}</div>
                </div>
                <div className="flex items-center gap-2">
                  {job.vendorPhone && (
                    <a
                      href={`tel:${job.vendorPhone}`}
                      className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{fw.callVendor}</span>
                    </a>
                  )}
                  {job.vendorPhone && (
                    <a
                      href={`https://wa.me/${job.vendorPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {job.vendorCostEstimate && (
                <div className="mt-2 pt-2 border-t border-slate-200/70 flex justify-between text-[11px]">
                  <span className="text-slate-500">{fw.vendorCostEst}:</span>
                  <span className="font-bold text-slate-800">฿{job.vendorCostEstimate.toLocaleString()}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-xs text-slate-500 mb-2">{fw.noVendorAssigned}</p>
              <button
                type="button"
                onClick={() => setIsAssigningVendor(true)}
                className="text-xs bg-[#102a4e] hover:bg-blue-900 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs"
              >
                + {fw.assignVendor}
              </button>
            </div>
          )}

          {isAssigningVendor && (
            <div className="mt-3 p-3 bg-blue-50/70 rounded-xl border border-blue-200">
              <span className="text-[11px] font-bold text-blue-950 block mb-2">
                {lang === 'th' ? 'เลือกช่าง / ร้านค้าจากระบบ:' : 'Select Vendor / Partner:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {vendors.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      onAssignVendor(v);
                      setIsAssigningVendor(false);
                    }}
                    className="p-2 bg-white rounded-lg border border-slate-200 hover:border-blue-500 text-left cursor-pointer transition-all"
                  >
                    <div className="font-bold text-slate-900 text-xs">{v.name}</div>
                    <div className="text-[10px] text-slate-500">{v.category} • {v.phone}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SERVICE NOTES & ON-SITE LOG CARD */}
      {/* ========================================================================= */}
      {capabilities.notes && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>{fw.notesAndLog}</span>
          </h3>

          <div className="space-y-3">
            {job.requestDescription && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                  {lang === 'th' ? 'คำขอจากลูกค้า / อาการที่แจ้ง' : 'Client Request / Symptoms'}
                </span>
                <p className="text-slate-800">{job.requestDescription}</p>
              </div>
            )}

            <div>
              <textarea
                rows={3}
                value={siteNotesInput}
                onChange={(e) => setSiteNotesInput(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder={fw.notesPlaceholder}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 italic block mt-1">
                {lang === 'th' ? 'บันทึกอัตโนมัติเมื่อแตะออกจากช่อง' : 'Auto-saved on blur'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6.5. MR. BIG ELECTRICAL TECHNICAL ASSESSMENT (Case A vs Case B) */}
      {/* ========================================================================= */}
      {(isElectricalService(job.serviceType) || job.electricalAssessment) && (() => {
        const ea = job.electricalAssessment || generateMrBigElectricalAssessment({
          rawInput: `${job.requestDescription || ''} ${job.notes || ''} ${job.siteNotes || ''}`,
          zone: job.villaName,
        });

        return (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
                  MB
                </span>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {lang === 'th' ? 'Mr. Big — การวิเคราะห์เชิงเทคนิคงานไฟฟ้า' : 'Mr. Big — Electrical Technical Brain'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {lang === 'th' ? 'แยกข้อเท็จจริงหน้างาน • กำหนดแผน Case A / Case B' : 'Preserves field facts • Defines Case A vs. Case B'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {ea.activeCase || 'Case A'}
              </span>
            </div>

            {/* Confirmed Fact Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-amber-50/40 rounded-xl border border-amber-200/60 mb-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-0.5">
                  {lang === 'th' ? 'จุดตรวจ' : 'Zone'}
                </span>
                <span className="font-bold text-slate-900">{ea.area}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-0.5">
                  {lang === 'th' ? 'อุปกรณ์' : 'Component'}
                </span>
                <span className="font-bold text-slate-900">{ea.component}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-0.5">
                  {lang === 'th' ? 'จำนวน' : 'Quantity'}
                </span>
                <span className="font-bold text-slate-900">{ea.quantity}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-0.5">
                  {lang === 'th' ? 'อาการ' : 'Condition'}
                </span>
                <span className="font-bold text-rose-700">{ea.condition}</span>
              </div>
            </div>

            {/* Customer Facing Report */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3 text-xs">
              <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                {lang === 'th' ? 'รายงานสรุปสำหรับลูกค้า (ภาษาเข้าใจง่าย):' : 'Customer-Facing Report:'}
              </span>
              <p className="font-semibold text-slate-800">
                {lang === 'th' ? ea.customerReportTh : ea.customerReportEn}
              </p>
            </div>

            {/* Case A / Case B Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className={`p-3 rounded-xl border ${
                ea.activeCase === 'Case A' ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-emerald-900 text-xs">
                    {lang === 'th' ? ea.caseA.titleTh : ea.caseA.titleEn}
                  </span>
                  {ea.activeCase === 'Case A' && (
                    <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">ACTIVE</span>
                  )}
                </div>
                <ul className="space-y-1 text-[11px] text-slate-700 mb-2">
                  {(lang === 'th' ? ea.caseA.scopeTh : ea.caseA.scopeEn).map((s, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-[10px] text-emerald-800 font-medium">
                  <strong>{lang === 'th' ? 'เกณฑ์เสร็จสิ้น:' : 'Criteria:'}</strong> {lang === 'th' ? ea.caseA.completionCriteriaTh : ea.caseA.completionCriteriaEn}
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${
                ea.activeCase === 'Case B' ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-400' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-amber-950 text-xs">
                    {lang === 'th' ? ea.caseB.titleTh : ea.caseB.titleEn}
                  </span>
                  {ea.activeCase === 'Case B' && (
                    <span className="text-[9px] bg-amber-600 text-white font-bold px-1.5 py-0.2 rounded">ACTIVE</span>
                  )}
                </div>
                <div className="p-1.5 bg-amber-100/60 rounded text-[10px] text-amber-900 mb-1.5">
                  <strong>{lang === 'th' ? 'เงื่อนไข:' : 'Trigger:'}</strong> {lang === 'th' ? ea.caseB.triggerConditionTh : ea.caseB.triggerConditionEn}
                </div>
                <ul className="space-y-1 text-[11px] text-slate-700 mb-2">
                  {(lang === 'th' ? ea.caseB.additionalScopeTh : ea.caseB.additionalScopeEn).map((s, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
                <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-[9px] text-rose-900">
                  {lang === 'th' ? ea.caseB.cautionNoticeTh : ea.caseB.cautionNoticeEn}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 7. VISUAL EVIDENCE & PHOTOS CARD */}
      {/* ========================================================================= */}
      {(capabilities.photos || capabilities.beforeAfterPhotos) && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>{fw.visualEvidence}</span>
            </h3>
            <label className="text-[11px] font-bold bg-[#102a4e] hover:bg-blue-900 text-white px-3 py-1.5 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-sky-300" />
              <span>{fw.addEvidencePhoto}</span>
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

          {/* Photo Grid */}
          {job.evidencePhotos && job.evidencePhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {job.evidencePhotos.map((photo, i) => (
                <div key={photo.id || i} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100 group">
                  <img
                    src={photo.photoUrl}
                    alt={photo.caption || `Evidence ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white p-1 text-[9px] truncate text-center">
                    {photo.caption || (photo.capturedAt ? new Date(photo.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
              <Camera className="w-6 h-6 mx-auto mb-1 text-slate-300" />
              <p>{lang === 'th' ? 'ยังไม่มีรูปภาพหลักฐาน ถ่ายรูปเพื่อบันทึกในเอกสาร' : 'No photos uploaded yet. Capture evidence for reporting.'}</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. FINDINGS & DIAGNOSTIC ITEMS CARD */}
      {/* ========================================================================= */}
      {capabilities.findings && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>{fw.findingsTitle}</span>
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.2 rounded-full">
                {job.items.length}
              </span>
            </div>

            {onOpenFindingModal && (
              <button
                type="button"
                onClick={() => onOpenFindingModal()}
                className="text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{fw.addFinding}</span>
              </button>
            )}
          </div>

          {job.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {job.items.map((item, idx) => (
                <FindingCard
                  key={item.id || idx}
                  item={item}
                  index={idx}
                  onEdit={(it) => onOpenFindingModal && onOpenFindingModal(it)}
                  onDelete={(id) => onDeleteFinding && onDeleteFinding(id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
              <p>{fw.noFindingsYet}</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MOLLY HARDWARE & MATERIALS SOURCING CARD */}
      {/* ========================================================================= */}
      {(capabilities.mollyHardware || capabilities.materials) && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-indigo-600" />
                <span>{fw.materialsTitle}</span>
              </h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.2 rounded-full">
                Molly Sourcing
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenQuickEstimate}
              className="text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>{fw.addHardwareItem}</span>
            </button>
          </div>

          {job.quotation?.hardwareItems && job.quotation.hardwareItems.length > 0 ? (
            <div className="space-y-2">
              {job.quotation.hardwareItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{item.description}</div>
                    <div className="text-[10px] text-slate-500">{item.detail} • {item.qty}</div>
                  </div>
                  <div className="font-bold text-slate-900 text-right shrink-0">
                    ฿{(item.amount ?? 0).toLocaleString()} THB
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
              {lang === 'th'
                ? 'ยังไม่มีรายการฮาร์ดแวร์ กด "+ เพิ่มอุปกรณ์" เพื่อให้ Molly คำนวณราคาจัดซื้อ'
                : 'No hardware items added yet. Click "+ Add Hardware" to quote materials.'}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. JOB OUT-OF-POCKET EXPENSES CARD */}
      {/* ========================================================================= */}
      {capabilities.expenses && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>{fw.jobExpenses}</span>
              </h3>
              {totalExpenses > 0 && (
                <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.2 rounded-full border border-red-200">
                  ฿{(totalExpenses ?? 0).toLocaleString()} THB
                </span>
              )}
            </div>

            {onAddExpense && (
              <button
                type="button"
                onClick={() => onAddExpense(job.id)}
                className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-slate-600" />
                <span>{fw.addExpense}</span>
              </button>
            )}
          </div>

          {jobExpenses.length > 0 ? (
            <div className="space-y-2 text-xs">
              {jobExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{exp.description}</span>
                    <span className="text-[10px] text-slate-400">{exp.category} • {exp.date}</span>
                  </div>
                  <span className="font-extrabold text-red-700">
                    -฿{(exp.amount ?? 0).toLocaleString()} THB
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
              {lang === 'th' ? 'ยังไม่มีค่าใช้จ่ายที่ผูกกับงานนี้' : 'No out-of-pocket expenses logged for this job.'}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. FINANCIAL STATUS & PAYMENT CARD */}
      {/* ========================================================================= */}
      {(capabilities.quote || capabilities.payment) && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>{fw.financialSummary}</span>
            </h3>
            <span className="text-[11px] text-slate-400 italic">
              {fw.placeholderNotice}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                {fw.customerPrice}
              </span>
              <div className="text-lg font-extrabold text-slate-900">
                ฿{(job.price || 0).toLocaleString()} THB
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                {lang === 'th' ? 'สถานะใบแจ้งหนี้' : 'Invoice Status'}
              </span>
              <div className="font-bold text-slate-800">
                {matchingInvoice ? matchingInvoice.status : 'No Invoice Yet'}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                {fw.balanceDue}
              </span>
              <div className={`text-lg font-extrabold ${
                matchingInvoice && matchingInvoice.balanceDue <= 0
                  ? 'text-emerald-600'
                  : 'text-amber-700'
              }`}>
                ฿{(matchingInvoice ? matchingInvoice.balanceDue : (job.price || 0)).toLocaleString()} THB
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onRecordPayment(job.id, matchingInvoice?.balanceDue || job.price || 1500)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{fw.recordPaymentBtn}</span>
            </button>

            <button
              type="button"
              onClick={onOpenReport}
              className="bg-[#102a4e] hover:bg-blue-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-sky-300" />
              <span>{fw.viewPdfBtn}</span>
            </button>

            <button
              type="button"
              onClick={onOpenQuickEstimate}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{fw.quickEstimateBtn}</span>
            </button>

            {job.status !== 'Completed' && (
              <button
                type="button"
                onClick={onCompleteJob}
                className="ml-auto bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{fw.completeJobBtn}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
