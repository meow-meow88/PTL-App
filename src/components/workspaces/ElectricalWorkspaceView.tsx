import React, { useState, useEffect } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Share2,
  Clock,
  Sparkles,
  Camera,
  Upload,
  User,
  Building2,
  MapPin,
  ExternalLink,
  Phone,
  MessageCircle,
  Wrench,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Info,
  Activity,
  Check,
  Copy,
  HelpCircle,
  CheckSquare,
  ArrowRight,
  DollarSign,
  Layers,
} from 'lucide-react';
import {
  InspectionJob,
  Vendor,
  Invoice,
  Expense,
  ElectricalAssessmentData,
  EvidencePhoto,
} from '../../types';
import { useLanguage } from '../../i18n/translations';
import { generateMrBigElectricalAssessment } from '../../utils/mrBigLocalAnalyzer';
import { shareJobToTechnician } from '../../utils/technicianShare';

interface ElectricalWorkspaceViewProps {
  job: InspectionJob;
  vendors: Vendor[];
  invoices: Invoice[];
  expenses?: Expense[];
  onUpdateJob: (updater: (prev: InspectionJob) => InspectionJob) => void;
  onRecordPayment: (jobId: string, amount: number) => void;
  onAssignVendor: (vendor: Vendor) => void;
  onCompleteJob: () => void;
  onOpenReport: () => void;
  onOpenQuotation?: (jobId: string, action?: 'view' | 'edit' | 'send' | 'preview') => void;
  onOpenQuickEstimate: () => void;
  onAddExpense?: (jobId: string) => void;
  onOpenSwitchJob?: () => void;
  jobsCount?: number;
  currentJobIndex?: number;
}

export const ElectricalWorkspaceView: React.FC<ElectricalWorkspaceViewProps> = ({
  job,
  vendors,
  invoices,
  expenses = [],
  onUpdateJob,
  onRecordPayment,
  onAssignVendor,
  onCompleteJob,
  onOpenReport,
  onOpenQuotation,
  onOpenQuickEstimate,
  onAddExpense,
  onOpenSwitchJob,
  jobsCount = 1,
  currentJobIndex = 0,
}) => {
  const { lang, t } = useLanguage();
  const isTh = lang === 'th';

  // Initialize or fetch Electrical Assessment from job
  const [assessment, setAssessment] = useState<ElectricalAssessmentData>(() => {
    if (job.electricalAssessment) {
      return job.electricalAssessment;
    }
    return generateMrBigElectricalAssessment({
      rawInput: `${job.requestDescription || ''} ${job.notes || ''} ${job.siteNotes || ''}`,
      zone: job.villaName,
    });
  });

  // State for sharing feedback
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Determine if actual field information exists
  const hasActualFieldInfo = Boolean(
    job.scopeConfirmed ||
    assessment.hasAssessmentStarted ||
    (assessment.observedFact && assessment.observedFact.trim().length > 0) ||
    (assessment.confirmedFinding && assessment.confirmedFinding.trim().length > 0) ||
    (assessment.testPerformed && assessment.testPerformed.trim().length > 0) ||
    (job.evidencePhotos && job.evidencePhotos.length > 0)
  );

  // Field screen mode: 'simple' for focused initial field arrival vs 'full' for complete engineering workspace
  const [fieldScreenMode, setFieldScreenMode] = useState<'simple' | 'full'>(() => {
    return hasActualFieldInfo && job.scopeConfirmed ? 'full' : 'simple';
  });

  const [showExistingInfo, setShowExistingInfo] = useState(false);
  const [isAddFindingOpen, setIsAddFindingOpen] = useState(false);
  const [newFindingCategory, setNewFindingCategory] = useState<'finding' | 'observed' | 'test'>('finding');
  const [newFindingText, setNewFindingText] = useState('');
  const fieldPhotoInputRef = React.useRef<HTMLInputElement>(null);

  const hasSufficientFieldFactsForCases = Boolean(
    job.scopeConfirmed ||
    (
      Boolean(assessment.confirmedFinding && assessment.confirmedFinding.trim().length > 0) &&
      Boolean(assessment.testPerformed && assessment.testPerformed.trim().length > 0)
    )
  );

  const handleAddFindingSubmit = () => {
    if (!newFindingText.trim()) return;
    const text = newFindingText.trim();
    if (newFindingCategory === 'finding') {
      const updatedFinding = assessment.confirmedFinding
        ? `${assessment.confirmedFinding}\n• ${text}`
        : `• ${text}`;
      updateAssessment((prev) => ({
        ...prev,
        confirmedFinding: updatedFinding,
        hasAssessmentStarted: true,
      }));
      onUpdateJob((prev) => ({
        ...prev,
        confirmedFindings: updatedFinding,
      }));
    } else if (newFindingCategory === 'observed') {
      const updatedObserved = assessment.observedFact
        ? `${assessment.observedFact}\n• ${text}`
        : `• ${text}`;
      updateAssessment((prev) => ({
        ...prev,
        observedFact: updatedObserved,
        hasAssessmentStarted: true,
      }));
      onUpdateJob((prev) => ({
        ...prev,
        observedFact: updatedObserved,
      }));
    } else {
      const updatedTest = assessment.testPerformed
        ? `${assessment.testPerformed}\n• ${text}`
        : `• ${text}`;
      updateAssessment((prev) => ({
        ...prev,
        testPerformed: updatedTest,
        hasAssessmentStarted: true,
      }));
      onUpdateJob((prev) => ({
        ...prev,
        testPerformed: updatedTest,
      }));
    }
    setNewFindingText('');
    setIsAddFindingOpen(false);
    setShareFeedback(isTh ? '✓ บันทึกข้อเท็จจริงหน้างานเรียบร้อย' : '✓ Field finding recorded');
    setTimeout(() => setShareFeedback(null), 3000);
  };

  // Sync assessment to job when changed
  const updateAssessment = (updater: (prev: ElectricalAssessmentData) => ElectricalAssessmentData) => {
    setAssessment((prev) => {
      const updated = updater(prev);
      onUpdateJob((currentJob) => ({
        ...currentJob,
        electricalAssessment: updated,
      }));
      return updated;
    });
  };

  // Ensure initial assessment is saved to job if absent
  useEffect(() => {
    if (!job.electricalAssessment) {
      onUpdateJob((prev) => ({
        ...prev,
        electricalAssessment: assessment,
      }));
    }
  }, []);

  const matchingInvoice = invoices.find((inv) => inv.jobId === job.id);

  // Share to Technician handler
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
        caption: `Electrical ${assessment.component || 'Evidence'}`,
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

  const hasInspectionQuotation = Boolean(
    job.quotation &&
    ((job.quotation.serviceItems && job.quotation.serviceItems.length > 0) ||
     (job.quotation.hardwareItems && job.quotation.hardwareItems.length > 0))
  );
  const isInspectionApproved =
    job.status === 'Approved' ||
    job.status === 'Scheduled' ||
    job.status === 'In Progress' ||
    job.status === 'Completed' ||
    Boolean(job.customerApprovedAt);
  const isScopeConfirmed = Boolean(job.scopeConfirmed);

  const handleConfirmScope = () => {
    const nowIso = new Date().toISOString();
    updateAssessment((prev) => ({
      ...prev,
      hasAssessmentStarted: true,
      observedFact: prev.observedFact || prev.confirmedFactTh,
      confirmedFinding: prev.confirmedFinding || prev.confirmedFactTh,
      testPerformed: prev.testPerformed || 'วัดแรงดันไฟฟ้า AC (L-N) และตรวจสอบขั้ว/สวิตช์',
      testResultText: prev.testResultText || (prev.testResult === 'Passed' ? 'แรงดันไฟฟ้าปกติ 228V' : 'รอเปลี่ยนอะไหล่เพื่อทดสอบ'),
    }));
    onUpdateJob((prev) => ({
      ...prev,
      scopeConfirmed: true,
      scopeConfirmedAt: nowIso,
      observedFact: assessment.observedFact || assessment.confirmedFactTh,
      confirmedFindings: assessment.confirmedFinding || assessment.confirmedFactTh,
      testPerformed: assessment.testPerformed || 'วัดแรงดันไฟฟ้า AC (L-N) และตรวจสอบขั้ว/สวิตช์',
      testResultText: assessment.testResultText || (assessment.testResult === 'Passed' ? 'แรงดันไฟฟ้าปกติ 228V' : 'รอเปลี่ยนอะไหล่เพื่อทดสอบ'),
      recommendedNextTest: assessment.recommendedNextTest,
      unknownItems: assessment.unknownItems,
    }));
    setShareFeedback(isTh ? '✓ ยืนยันขอบเขตงานเทคนิคแล้ว พร้อมส่งต่อให้ Molly ทำราคาซ่อม' : '✓ Technical scope confirmed! Ready for Molly repair pricing.');
    setTimeout(() => setShareFeedback(null), 3500);
  };

  const handleReopenScope = () => {
    onUpdateJob((prev) => ({
      ...prev,
      scopeConfirmed: false,
      scopeConfirmedAt: undefined,
    }));
  };

  if (fieldScreenMode === 'simple') {
    return (
      <div className="space-y-4 pb-20 max-w-3xl mx-auto">
        {/* Simple Field Screen Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-amber-100 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span>{job.jobPurpose === 'REPLACEMENT'
                    ? (isTh ? 'งานเปลี่ยนอุปกรณ์ไฟฟ้า' : 'Electrical Replacement')
                    : job.jobPurpose === 'INSTALLATION'
                    ? (isTh ? 'งานติดตั้งไฟฟ้า' : 'Electrical Installation')
                    : (isTh ? 'งานตรวจเช็กระบบไฟฟ้า' : 'Electrical Inspection')}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Job #{job.id}</span>
              </div>
              <h1 className="text-base sm:text-xl font-black text-slate-900 mt-1">
                {job.villaName || job.propertyLocation}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setFieldScreenMode('full')}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors self-start sm:self-auto cursor-pointer"
            >
              {isTh ? 'ดูมุมมองเชิงช่างเต็มรูปแบบ →' : 'Full Technical View →'}
            </button>
          </div>

          {/* Feedback banner if any */}
          {shareFeedback && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{shareFeedback}</span>
            </div>
          )}

          {/* Essential Information Grid (Customer, Location, Reported Issue, Date/Time) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-black text-slate-500 block mb-0.5">
                {isTh ? 'ลูกค้า (Customer):' : 'Customer:'}
              </span>
              <div className="font-bold text-slate-900 text-sm">{job.customerName}</div>
              {job.customerPhone && (
                <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{job.customerPhone}</span>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-black text-slate-500 block mb-0.5">
                {isTh ? 'วันและเวลานัดหมาย (Date / Time):' : 'Date / Time:'}
              </span>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{job.scheduledDate || job.inspectionDate || 'Today'}</span>
                <span>•</span>
                <span className="text-blue-700">{job.scheduledTime || 'Scheduled Visit'}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 sm:col-span-2">
              <span className="text-[10px] uppercase font-black text-slate-500 block mb-0.5">
                {isTh ? 'อาการที่ลูกค้าแจ้ง (Reported Issue):' : 'Reported Issue:'}
              </span>
              <div className="font-semibold text-slate-800 text-xs leading-relaxed">
                {job.requestDescription || job.notes || 'Sub-breaker trips / On-site electrical inspection required'}
              </div>
            </div>
          </div>

          {/* Primary Actions (Talk to Mr. Big, Add Finding, Take Photo) */}
          <div className="pt-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
              {isTh ? 'การดำเนินการหลักหน้างาน (Primary Field Actions)' : 'Primary Field Actions'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Talk to Mr. Big */}
              <button
                type="button"
                onClick={() => {
                  updateAssessment((prev) => ({ ...prev, hasAssessmentStarted: true }));
                  setFieldScreenMode('full');
                }}
                className="p-3.5 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-xs transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-center"
              >
                <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
                <span className="text-xs">{job.jobPurpose === 'REPLACEMENT' ? (isTh ? 'ตรวจหน้างานก่อนเปลี่ยน' : 'Verify before replacement') : (isTh ? 'บันทึกผลตรวจ' : 'Record findings')}</span>
                <span className="text-[10px] font-semibold text-amber-950/80">{isTh ? 'ยืนยันข้อมูลวงจรและขอบเขตงาน' : 'Confirm circuit and work scope'}</span>
              </button>

              {/* Add Finding */}
              <button
                type="button"
                onClick={() => setIsAddFindingOpen(true)}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-center"
              >
                <Plus className="w-5 h-5 text-emerald-400" />
                <span className="text-xs">➕ เพิ่มข้อเท็จจริง (Add Finding)</span>
                <span className="text-[10px] text-slate-400">จดผลที่ตรวจพบ</span>
              </button>

              {/* Take Photo */}
              <button
                type="button"
                onClick={() => fieldPhotoInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="p-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xs transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 text-center"
              >
                <Camera className="w-5 h-5 text-white" />
                <span className="text-xs">
                  {isUploadingPhoto ? 'กำลังบันทึกรูป...' : '📷 ถ่ายรูปหลักฐาน (Take Photo)'}
                </span>
                <span className="text-[10px] text-blue-200">ถ่ายรูปตู้ไฟ/จุดที่มีปัญหา</span>
              </button>
              <input
                type="file"
                ref={fieldPhotoInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
            </div>
          </div>

          {/* Existing Evidence Photos */}
          {job.evidencePhotos && job.evidencePhotos.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700">
                  📷 รูปถ่ายหลักฐานหน้างาน ({job.evidencePhotos.length} รูป)
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {job.evidencePhotos.map((p, idx) => (
                  <img
                    key={p.id || idx}
                    src={p.photoUrl}
                    alt={p.caption || 'Evidence'}
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Secondary Action: View Existing Info Collapsible */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowExistingInfo(!showExistingInfo)}
              className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>{isTh ? 'ดูข้อมูลงานเดิม (View Existing Info)' : 'View Existing Info'}</span>
              </div>
              {showExistingInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showExistingInfo && (
              <div className="mt-2 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">ที่ตั้ง / โลเคชั่น:</span>
                  <span className="font-semibold text-slate-800 text-right">{job.propertyLocation || 'Phuket'}</span>
                </div>
                {job.quotation && (
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                    <span className="text-slate-500">ใบเสนอราคาเดิม:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-700">{job.quotation.refNo}</span>
                      <button
                        type="button"
                        onClick={() => onOpenQuotation?.(job.id, 'preview')}
                        className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                      >
                        เปิดดูเอกสาร
                      </button>
                    </div>
                  </div>
                )}
                {job.siteNotes && (
                  <div className="pt-1.5 border-t border-slate-200">
                    <span className="text-slate-500 block mb-0.5">หมายเหตุหน้างานเดิม:</span>
                    <p className="text-slate-700 leading-relaxed">{job.siteNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Compact Add Finding Modal */}
        {isAddFindingOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>{isTh ? 'เพิ่มข้อเท็จจริงหน้างาน' : 'Add Field Finding'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddFindingOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">หมวดหมู่ข้อเท็จจริง:</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewFindingCategory('finding')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      newFindingCategory === 'finding'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ข้อเท็จจริงยืนยันได้
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFindingCategory('observed')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      newFindingCategory === 'observed'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    สิ่งที่พบเห็นจริง
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFindingCategory('test')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      newFindingCategory === 'test'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ผลการทดสอบ
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  รายละเอียดข้อเท็จจริง:
                </label>
                <textarea
                  rows={3}
                  value={newFindingText}
                  onChange={(e) => setNewFindingText(e.target.value)}
                  placeholder="ระบุสิ่งที่ตรวจพบจริง เช่น วัดแรงดันได้ 228V, มีไฟมาที่ขั้วหลอด, ไส้หลอดขาด..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddFindingOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleAddFindingSubmit}
                  disabled={!newFindingText.trim()}
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  บันทึกข้อเท็จจริง
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. PRIMARY ELECTRICAL WORKSPACE HEADER & NEXT ACTION (Visual Calm) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0 border border-amber-200">
            <Zap className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
              <span>{isTh ? 'พื้นที่ทำงานช่างไฟฟ้า PTL' : 'PTL Electrical Workspace'}</span>
              {job.scopeConfirmed && (
                <>
                  <span>•</span>
                  <span className="text-slate-600">{assessment.activeCase || 'Case A'}</span>
                </>
              )}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
              {job.scopeConfirmed
                ? assessment.activeCase === 'Case B'
                  ? isTh ? 'ดำเนินการตรวจสอบวงจรเพิ่มเติม (Case B)' : 'Conduct In-Depth Circuit Investigation (Case B)'
                  : isTh ? 'เปลี่ยนอะไหล่และทดสอบการทำงาน (Case A)' : 'Replace Component & Test Operation (Case A)'
                : isTh ? 'การตรวจสอบและวิเคราะห์ข้อเท็จจริงหน้างาน' : 'Field Inspection & Fact Preservation'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setFieldScreenMode(fieldScreenMode === 'simple' ? 'full' : 'simple')}
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>{fieldScreenMode === 'simple' ? (isTh ? 'มุมมองเต็ม' : 'Full View') : (isTh ? 'หน้าตรวจย่อ' : 'Simple View')}</span>
          </button>

          <button
            type="button"
            onClick={handleShareToTechnician}
            disabled={isSharing}
            className="text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-600" />
            <span>{isTh ? 'แชร์ให้ช่าง' : 'Share to Technician'}</span>
          </button>

          {job.status !== 'Completed' ? (
            (job.scopeConfirmed || (assessment.confirmedFinding && assessment.confirmedFinding.trim().length > 0)) && (
              <button
                type="button"
                onClick={onCompleteJob}
                className="text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isTh ? 'เสร็จสิ้นงาน' : 'Complete Job'}</span>
              </button>
            )
          ) : (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              ✓ {isTh ? 'งานเสร็จแล้ว' : 'Job Completed'}
            </span>
          )}
        </div>
      </div>

      {/* Share to Technician Status Banner */}
      {(job.technicianSharedAt || shareFeedback) && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-amber-900">
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
            className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer text-[11px]"
          >
            {isTh ? 'แชร์ซ้ำ' : 'Share again'}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1.1 TWO-STAGE TECHNICAL WORKFLOW & REPAIR SCOPE LIFECYCLE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">
              {isTh ? 'ลำดับขั้นตอนงานบริการทางเทคนิค PTL' : 'PTL Technical Service Lifecycle'}
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              {isTh ? 'แยก "ค่าตรวจหน้างาน" กับ "ราคาซ่อมจริง" ตามข้อเท็จจริง' : 'Two-Stage Protocol: Inspection Fee vs. Fact-Based Repair Scope'}
            </h2>
          </div>
          <div className="text-xs text-slate-500">
            {isScopeConfirmed ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isTh ? 'สรุปขอบเขตงานซ่อมแล้ว' : 'Repair Scope Confirmed'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{isTh ? 'รอตรวจหน้างาน & ยืนยันข้อเท็จจริง' : 'Diagnostic in Progress'}</span>
              </span>
            )}
          </div>
        </div>

        {/* 3 Step Indicator */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 text-xs">
          {/* Step 1: Inspection Quote */}
          <div className={`p-3 rounded-xl border transition-all ${
            isInspectionApproved
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
              : hasInspectionQuotation
              ? 'bg-amber-50/60 border-amber-200 text-amber-950'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-black">1</span>
                <span>{isTh ? 'ใบเสนอราคาค่าตรวจ' : '1. Inspection Quote'}</span>
              </span>
              {isInspectionApproved ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-300">✓ อนุมัติแล้ว</span>
              ) : hasInspectionQuotation ? (
                <span className="text-[10px] font-bold text-amber-700 bg-white px-2 py-0.5 rounded-full border border-amber-300">รออนุมัติ</span>
              ) : (
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">ยังไม่ออก</span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              {isTh
                ? 'ค่าเดินทางและวิเคราะห์ระบบด่วนหน้างาน (ไม่รวมอะไหล่)'
                : 'Call-out visit & diagnostic fee (parts quoted separately)'}
            </p>
            {onOpenQuotation && (
              <button
                type="button"
                onClick={() => onOpenQuotation(job.id)}
                className="mt-2 text-[11px] font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1 cursor-pointer"
              >
                <span>{isTh ? 'เปิดใบเสนอราคาค่าตรวจ' : 'View Inspection Quote'}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Step 2: Diagnostic & Facts by Mr. Big */}
          <div className={`p-3 rounded-xl border transition-all ${
            isScopeConfirmed
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
              : 'bg-blue-50/60 border-blue-200 text-blue-950'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-black">2</span>
                <span>{isTh ? 'ตรวจเช็กหน้างาน (Mr. Big)' : '2. Field Diagnostic'}</span>
              </span>
              {isScopeConfirmed ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-300">✓ สรุปผลแล้ว</span>
              ) : (
                <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-300">กำลังตรวจ</span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              {isTh
                ? 'ช่างทดสอบหน้างาน แยกสิ่งที่เห็นจริง vs สิ่งที่ยืนยันได้'
                : 'On-site multimeter testing, separating observed facts from unconfirmed items.'}
            </p>
            {!isScopeConfirmed ? (
              <button
                type="button"
                onClick={handleConfirmScope}
                className="mt-2 text-[11px] font-extrabold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>{isTh ? 'กดยืนยันขอบเขตงานเทคนิค' : 'Confirm Technical Scope'}</span>
              </button>
            ) : (
              <div className="mt-2 text-[10px] text-emerald-700 font-bold flex items-center justify-between">
                <span>{job.scopeConfirmedAt ? `ยืนยันเมื่อ ${new Date(job.scopeConfirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'ยืนยันแล้ว'}</span>
                <button
                  type="button"
                  onClick={handleReopenScope}
                  className="text-slate-500 hover:text-slate-800 underline text-[10px] font-normal cursor-pointer"
                >
                  {isTh ? 'แก้ไขผลตรวจ' : 'Edit facts'}
                </button>
              </div>
            )}
          </div>

          {/* Step 3: Repair Quote by Molly */}
          <div className={`p-3 rounded-xl border transition-all ${
            isScopeConfirmed
              ? 'bg-amber-50/70 border-amber-300 text-amber-950 ring-1 ring-amber-400/30'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] flex items-center justify-center font-black">3</span>
                <span>{isTh ? 'ใบเสนอราคาซ่อม (Molly)' : '3. Repair Quote'}</span>
              </span>
              {isScopeConfirmed ? (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                  ⚡ พร้อมเสนอราคา
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  รอขั้นตอน 2
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              {isTh
                ? 'Molly คำนวณค่าอะไหล่ + ค่าแรงซ่อมมาตรฐานตาม Case A / B'
                : 'Molly prices replacement parts & labor based on confirmed scope.'}
            </p>
            {isScopeConfirmed && (
              <button
                type="button"
                onClick={onOpenQuickEstimate}
                className="mt-2 w-full text-[11px] font-black text-slate-950 bg-amber-400 hover:bg-amber-300 px-2.5 py-1.5 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                <span>{isTh ? 'เปิด Molly คำนวณราคาซ่อม' : 'Launch Molly Repair Pricing'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CLIENT & SITE IDENTITY */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-amber-600" />
              <span className="font-extrabold text-slate-900 text-base">{job.customerName}</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                ELECTRICAL
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
                title="Call"
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

        {/* Confirmed Fact Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'จุดที่พบปัญหา' : 'Inspection Zone'}
            </span>
            <span className="font-bold text-slate-900">{assessment.area}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'อุปกรณ์ / ชิ้นส่วน' : 'Component'}
            </span>
            <span className="font-bold text-slate-900">{assessment.component}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'จำนวน' : 'Quantity'}
            </span>
            <span className="font-bold text-slate-900">{assessment.quantity}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'อาการที่พบ' : 'Condition'}
            </span>
            <span className="font-bold text-rose-700">{assessment.condition}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MR. BIG TECHNICAL BRAIN & CUSTOMER-FACING REPORT */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
              MB
            </span>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {isTh ? 'Mr. Big — ข้อเท็จจริงและรายงานสำหรับลูกค้า' : 'Mr. Big — Fact Preservation & Field Report'}
              </h3>
              <p className="text-[10px] text-slate-500">
                {isTh ? 'แยกข้อเท็จจริงจริง ไม่บิดเบือนข้อมูล ภาษาเข้าใจง่ายสำหรับลูกค้า' : 'Preserves field facts, no technical jargon for client'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            {isTh ? 'วิเคราะห์เชิงเทคนิค' : 'Technical Brain'}
          </span>
        </div>

        {/* Bilingual Customer Report */}
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              {isTh ? 'ภาษาไทยสำหรับลูกค้า:' : 'Thai Customer Report:'}
            </span>
            <p className="font-bold text-slate-900">{assessment.customerReportTh}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              {isTh ? 'ภาษาอังกฤษสำหรับลูกค้า:' : 'English Customer Report:'}
            </span>
            <p className="font-bold text-slate-900">{assessment.customerReportEn}</p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FACT PRESERVATION LOG — SEPARATION OF CONFIRMED FACTS VS UNKNOWN/SUSPICION */}
        {/* ========================================================================= */}
        <div className="mt-4 pt-4 border-t border-amber-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>{isTh ? 'บันทึกข้อเท็จจริงหน้างาน (Fact Preservation Log)' : 'Fact Preservation Field Log'}</span>
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              {isTh ? 'แยกสิ่งที่พบจริง vs สิ่งที่ยืนยันได้' : 'Separating facts from assumptions'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* 1. Customer Reported Issue */}
            <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/80">
              <label className="text-[10px] uppercase font-black text-amber-900 block mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-amber-700" />
                <span>{isTh ? 'สิ่งที่ลูกค้าแจ้ง (Customer Reported Issue):' : 'Customer Reported Issue:'}</span>
              </label>
              <textarea
                rows={2}
                value={assessment.customerReportedIssue || ''}
                onChange={(e) => updateAssessment((prev) => ({ ...prev, customerReportedIssue: e.target.value }))}
                placeholder={isTh ? 'เช่น ไฟส่องสว่างไม่ติด 1 ดวง / มีเสียงหึ่งๆ ที่ตู้ไฟ' : 'e.g. 1 light fixture not turning on'}
                className="w-full text-xs font-medium text-slate-900 bg-white p-2 rounded-lg border border-amber-200/90 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
              />
            </div>

            {/* 2. Observed Field Fact */}
            <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200/80">
              <label className="text-[10px] uppercase font-black text-blue-900 block mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-700" />
                <span>{isTh ? 'สิ่งที่พบเห็นจริงหน้างาน (Observed Fact):' : 'Observed Fact:'}</span>
              </label>
              <textarea
                rows={2}
                value={assessment.observedFact || ''}
                onChange={(e) => updateAssessment((prev) => ({ ...prev, observedFact: e.target.value }))}
                placeholder={isTh ? 'เช่น หลอดไฟไม่ติด ขั้วหลอดมีรอยไหม้เล็กน้อย สวิตช์ยังเปิดได้ปกติ' : 'e.g. Fixture unresponsive, slight scorch on socket'}
                className="w-full text-xs font-medium text-slate-900 bg-white p-2 rounded-lg border border-blue-200/90 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* 3. Confirmed Technical Finding */}
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80">
              <label className="text-[10px] uppercase font-black text-emerald-900 block mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>{isTh ? 'ข้อเท็จจริงที่ตรวจพบยืนยันได้ (Confirmed Finding):' : 'Confirmed Finding:'}</span>
              </label>
              <textarea
                rows={2}
                value={assessment.confirmedFinding || ''}
                onChange={(e) => updateAssessment((prev) => ({ ...prev, confirmedFinding: e.target.value }))}
                placeholder={isTh ? 'เช่น มีไฟ 220V จ่ายมาที่ขั้วหลอดปกติ ไส้หลอดขาด' : 'e.g. 228V power delivered to socket, lamp filament blown'}
                className="w-full text-xs font-medium text-slate-900 bg-white p-2 rounded-lg border border-emerald-200/90 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* 4. Test Performed & Result */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-[10px] uppercase font-black text-slate-700 block mb-1 flex items-center gap-1">
                <Wrench className="w-3 h-3 text-slate-600" />
                <span>{isTh ? 'การทดสอบที่ดำเนินการ (Test Performed):' : 'Test Performed:'}</span>
              </label>
              <input
                type="text"
                value={assessment.testPerformed || ''}
                onChange={(e) => updateAssessment((prev) => ({ ...prev, testPerformed: e.target.value }))}
                placeholder={isTh ? 'เช่น วัดแรงดันไฟฟ้า AC (L-N) ด้วยดิจิตอลมัลติมิเตอร์' : 'e.g. Digital Multimeter AC voltage check'}
                className="w-full text-xs font-medium text-slate-900 bg-white p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 mb-2"
              />

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500">{isTh ? 'ผลการวัด:' : 'Result:'}</span>
                <select
                  value={assessment.testResult || 'Passed'}
                  onChange={(e) => updateAssessment((prev) => ({ ...prev, testResult: e.target.value as any }))}
                  className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 font-bold text-slate-800"
                >
                  <option value="Passed">{isTh ? '✓ ผ่านเกณฑ์ปกติ (Passed)' : '✓ Passed'}</option>
                  <option value="Action Required">{isTh ? '⚠️ ต้องซ่อม/เปลี่ยนอะไหล่ (Action Required)' : '⚠️ Action Required'}</option>
                  <option value="Not Measured / Unknown">{isTh ? '— ยังไม่ได้วัด/ไม่ทราบค่า (Not Measured)' : '— Not Measured'}</option>
                </select>
              </div>
            </div>

            {/* 5. Recommended Next Test */}
            <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-200/80">
              <label className="text-[10px] uppercase font-black text-indigo-900 block mb-1 flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-indigo-700" />
                <span>{isTh ? 'การทดสอบขั้นต่อไปที่แนะนำ (Next Test):' : 'Recommended Next Test:'}</span>
              </label>
              <textarea
                rows={2}
                value={assessment.recommendedNextTest || ''}
                onChange={(e) => updateAssessment((prev) => ({ ...prev, recommendedNextTest: e.target.value }))}
                placeholder={isTh ? 'เช่น ติดตั้งหลอดทดสอบเพื่อวัดกระแสขณะทำงาน' : 'e.g. Install test lamp and verify current load'}
                className="w-full text-xs font-medium text-slate-900 bg-white p-2 rounded-lg border border-indigo-200/90 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* 6. Unknown Items */}
            <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-200/80">
              <label className="text-[10px] uppercase font-black text-rose-900 block mb-1 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-rose-700" />
                <span>{isTh ? 'สิ่งที่ไม่รู้ / ยังยืนยันไม่ได้ (Unknown Items):' : 'Unknown Items (Not Yet Confirmed):'}</span>
              </label>
              <textarea
                rows={2}
                value={assessment.unknownItems || ''}
                onChange={(e) => updateAssessment((prev) => ({ ...prev, unknownItems: e.target.value }))}
                placeholder={isTh ? 'เช่น ยังไม่ทราบประวัติไฟกระชาก / ต้องรอเปิดโหลดเพื่อทดสอบเบรกเกอร์' : 'e.g. Unknown surge history / pending load test'}
                className="w-full text-xs font-medium text-slate-900 bg-white p-2 rounded-lg border border-rose-200/90 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
              />
            </div>
          </div>

          {/* Scope Confirmation & Molly Handoff Bar */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                isScopeConfirmed ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
              }`}>
                {isScopeConfirmed ? '✓' : '!'}
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-xs text-white">
                  {isScopeConfirmed
                    ? isTh ? 'ขอบเขตงานเทคนิคได้รับการยืนยันแล้ว' : 'Technical Scope Confirmed'
                    : isTh ? 'ขั้นตอนสำคัญ: ยืนยันข้อเท็จจริงก่อนส่งให้ Molly ทำราคาซ่อม' : 'Confirm facts before Molly prices repair'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {isScopeConfirmed && job.scopeConfirmedAt
                    ? isTh ? `บันทึกยืนยันเมื่อ ${new Date(job.scopeConfirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : `Confirmed at ${new Date(job.scopeConfirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : isTh ? 'เพื่อป้องกันการเสนอราคาผิดพลาดหรือปั้นตัวเลข' : 'Prevents inaccurate quotes and preserves genuine field facts'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isScopeConfirmed ? (
                <button
                  type="button"
                  onClick={handleConfirmScope}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isTh ? 'ยืนยันขอบเขตงานซ่อม' : 'Confirm Scope'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReopenScope}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-all cursor-pointer"
                >
                  {isTh ? 'แก้ไขข้อเท็จจริง' : 'Re-open Facts'}
                </button>
              )}

              <button
                type="button"
                onClick={onOpenQuickEstimate}
                className="px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-900" />
                <span>{isTh ? 'ส่งต่อให้ Molly ทำราคาซ่อม' : 'Open Molly Repair Quote'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Possible Causes vs. Recommended On-site Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
            <span className="text-[10px] uppercase font-extrabold text-amber-900 block mb-1.5 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              <span>{isTh ? 'สาเหตุที่เป็นไปได้ (ยังไม่ยืนยัน):' : 'Possible Causes (Not Yet Confirmed):'}</span>
            </span>
            <ul className="space-y-1.5 text-slate-700">
              {assessment.possibleCauses.map((c, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px]">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{isTh ? c.th : c.en}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            <span className="text-[10px] uppercase font-extrabold text-blue-900 block mb-1.5 flex items-center gap-1">
              <Activity className="w-3 h-3 text-blue-600" />
              <span>{isTh ? 'การทดสอบหน้างานที่แนะนำ:' : 'Recommended On-Site Tests:'}</span>
            </span>
            <ul className="space-y-1.5 text-slate-700">
              {assessment.recommendedTests.map((t, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px]">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>{isTh ? t.th : t.en}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CASE A / CASE B LOGIC MATRIX (Shows only when technical facts exist) */}
      {/* ========================================================================= */}
      {hasSufficientFieldFactsForCases && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isTh ? 'แผนการซ่อม: กรณี A vs กรณี B' : 'Repair Strategy: Case A vs. Case B'}</span>
            </h3>
            <p className="text-[10px] text-slate-500">
              {isTh
                ? 'Mr. Big กำหนดขอบเขตเทคนิค • Molly กำหนดราคา • แยกการแก้ไขธรรมดา ออกจากปัญหาสายไฟ'
                : 'Mr. Big defines technical scope • Molly prices • Isolates simple swap from deep circuit fault'}
            </p>
          </div>

          {/* Case Toggle Buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => updateAssessment((prev) => ({ ...prev, activeCase: 'Case A' }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                assessment.activeCase === 'Case A'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isTh ? 'เลือก กรณี A' : 'Select Case A'}
            </button>
            <button
              type="button"
              onClick={() => updateAssessment((prev) => ({ ...prev, activeCase: 'Case B' }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                assessment.activeCase === 'Case B'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isTh ? 'เลือก กรณี B' : 'Select Case B'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* CASE A CARD */}
          <div
            className={`rounded-xl p-4 border transition-all ${
              assessment.activeCase === 'Case A'
                ? 'bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-black text-emerald-900 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isTh ? assessment.caseA.titleTh : assessment.caseA.titleEn}</span>
              </span>
              {assessment.activeCase === 'Case A' && (
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                  {isTh ? 'กำลังใช้งาน' : 'Active'}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-600 mb-2.5">
              {isTh ? 'ขอบเขตงานเปลี่ยนอะไหล่ตรงจุด:' : 'Scope of component replacement:'}
            </p>

            <ul className="space-y-1.5 text-[11px] text-slate-800 mb-3">
              {(isTh ? assessment.caseA.scopeTh : assessment.caseA.scopeEn).map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">1.{idx + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-[11px] text-emerald-900 font-semibold mb-3">
              <span className="block text-[10px] text-emerald-700 font-bold uppercase">
                {isTh ? 'เกณฑ์ปิดงานสำเร็จ:' : 'Completion Criteria:'}
              </span>
              {isTh ? assessment.caseA.completionCriteriaTh : assessment.caseA.completionCriteriaEn}
            </div>

            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">{isTh ? 'ราคาเสนอ Molly (Case A):' : 'Molly Price (Case A):'}</span>
              <button
                type="button"
                onClick={onOpenQuickEstimate}
                className="font-extrabold text-emerald-700 hover:underline cursor-pointer"
              >
                ฿{(job.price || 1500).toLocaleString()} THB &rarr;
              </button>
            </div>
          </div>

          {/* CASE B CARD */}
          <div
            className={`rounded-xl p-4 border transition-all ${
              assessment.activeCase === 'Case B'
                ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-black text-amber-950 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{isTh ? assessment.caseB.titleTh : assessment.caseB.titleEn}</span>
              </span>
              {assessment.activeCase === 'Case B' && (
                <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full">
                  {isTh ? 'กำลังใช้งาน' : 'Active'}
                </span>
              )}
            </div>

            {/* Condition Box */}
            <div className="p-2 bg-amber-100/70 border border-amber-300 rounded-lg text-[11px] text-amber-950 font-medium mb-2.5">
              <span className="font-bold block text-[10px] uppercase text-amber-800">
                {isTh ? 'เงื่อนไขที่จะเริ่ม Case B:' : 'Trigger Condition:'}
              </span>
              {isTh ? assessment.caseB.triggerConditionTh : assessment.caseB.triggerConditionEn}
            </div>

            <ul className="space-y-1.5 text-[11px] text-slate-800 mb-3">
              {(isTh ? assessment.caseB.additionalScopeTh : assessment.caseB.additionalScopeEn).map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">2.{idx + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* Strict Warning Box */}
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-900 leading-tight mb-3">
              <span className="font-extrabold block uppercase text-rose-700 mb-0.5">
                {isTh ? 'คำเตือนความถูกต้องทางเทคนิค:' : 'Strict Technical Safeguard:'}
              </span>
              {isTh ? assessment.caseB.cautionNoticeTh : assessment.caseB.cautionNoticeEn}
            </div>

            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">{isTh ? 'ประเมินราคาซ่อมลึก Molly:' : 'Molly Investigation Scope:'}</span>
              <button
                type="button"
                onClick={onOpenQuickEstimate}
                className="font-extrabold text-amber-800 hover:underline cursor-pointer"
              >
                {isTh ? 'ประเมินราคาตามงานจริง &rarr;' : 'Quote Custom Work &rarr;'}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MEASUREMENTS & BOQ RESOURCES (FACT-BASED, NO FABRICATION) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field Measurements Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>{isTh ? 'ผลการวัดหน้างานจริง' : 'Real Field Measurements'}</span>
            </h4>
            <span className="text-[10px] text-slate-400 italic">
              {isTh ? 'ไม่มีการปั้นตัวเลข' : 'No fabricated readings'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                AC Voltage (L-N)
              </span>
              <input
                type="text"
                value={assessment.measurements.voltageAc || ''}
                placeholder="e.g. 228V"
                onChange={(e) =>
                  updateAssessment((prev) => ({
                    ...prev,
                    measurements: { ...prev.measurements, voltageAc: e.target.value },
                  }))
                }
                className="w-full font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                Earth Ground
              </span>
              <input
                type="text"
                value={assessment.measurements.earthResistance || ''}
                placeholder="e.g. < 5 Ω"
                onChange={(e) =>
                  updateAssessment((prev) => ({
                    ...prev,
                    measurements: { ...prev.measurements, earthResistance: e.target.value },
                  }))
                }
                className="w-full font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                Insulation Megger
              </span>
              <input
                type="text"
                value={assessment.measurements.insulationResistance || ''}
                placeholder="e.g. > 2.0 MΩ"
                onChange={(e) =>
                  updateAssessment((prev) => ({
                    ...prev,
                    measurements: { ...prev.measurements, insulationResistance: e.target.value },
                  }))
                }
                className="w-full font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                RCCB Trip Time/Current
              </span>
              <input
                type="text"
                value={assessment.measurements.rccbTripCurrent || ''}
                placeholder="e.g. 30mA / 22ms"
                onChange={(e) =>
                  updateAssessment((prev) => ({
                    ...prev,
                    measurements: { ...prev.measurements, rccbTripCurrent: e.target.value },
                  }))
                }
                className="w-full font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* BOQ Materials & Tools */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-indigo-600" />
              <span>{isTh ? 'วัสดุและเครื่องมือ BOQ' : 'BOQ Materials & Tools'}</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-bold">
              {isTh ? `เวลาประมาณ: ${assessment.estimatedDuration}` : `Est: ${assessment.estimatedDuration}`}
            </span>
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {isTh ? 'วัสดุ / อะไหล่ที่ต้องใช้:' : 'Materials:'}
              </span>
              {assessment.materials.map((m, i) => (
                <div key={i} className="flex justify-between items-center p-1.5 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-800">{isTh ? m.nameTh : m.nameEn}</span>
                  <span className="font-bold text-slate-900">{m.qty} {m.unit}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-1.5 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {isTh ? 'เครื่องมือช่างและกำลังพล:' : 'Tools & Resources:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {assessment.resources.map((r, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                    {isTh ? r.nameTh : r.nameEn}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. PHOTO EVIDENCE & SITE LOG */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-blue-600" />
            <span>{isTh ? 'รูปถ่ายหลักฐานหน้างาน' : 'Visual Evidence & Work Photos'}</span>
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
                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white p-1 text-[9px] truncate text-center">
                  {photo.caption || (photo.capturedAt ? new Date(photo.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
            {isTh ? 'ยังไม่มีรูปถ่ายหน้างาน ถ่ายรูปเพื่อแนบในรายงาน PDF' : 'No photos uploaded yet. Take photos for PDF report.'}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 7. FINANCIAL SUMMARY & QUICK ACTIONS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              {isTh ? 'ราคางานไฟฟ้า (Molly Quotation)' : 'Electrical Service Price'}
            </span>
            <div className="text-lg font-black text-slate-900">
              ฿{(job.price || 1500).toLocaleString()} THB
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              {isTh ? 'ยอดคงเหลือที่ต้องชำระ' : 'Balance Due'}
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
    </div>
  );
};
