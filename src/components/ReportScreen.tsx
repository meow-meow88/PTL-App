import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Printer,
  Download,
  FileText,
  Camera,
  Layers,
  CheckCircle,
  Loader2,
  Share2,
  ExternalLink,
  Copy,
  Check,
  SlidersHorizontal,
  FolderOpen,
  Edit3,
  X,
  MessageSquare,
  Send,
  AlertTriangle,
  Info,
  Zap,
  Plus,
  Upload,
  Eye,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { InspectionJob } from '../types';
import { PhotoEvidenceDoc } from './docs/PhotoEvidenceDoc';
import { FindingsReportDoc } from './docs/FindingsReportDoc';
import { QuotationDoc } from './docs/QuotationDoc';
import { QuickEstimateModal } from './QuickEstimateModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import {
  generatePdfFromElement,
  openPdfInNewTab,
  triggerNativePrint,
  GeneratedPdfResult,
} from '../utils/pdfGenerator';
import { useCustomLogo } from '../utils/useCustomLogo';

interface ReportScreenProps {
  job: InspectionJob;
  onBack: () => void;
  onUpdateQuotation?: (updatedQuotation: any) => void;
  onUpdateDriveFolder?: (url: string) => void;
  onOpenMollyHardware?: () => void;
  onOpenMollyExpress?: () => void;
  onOpenGoogleDrive?: () => void;
  initialTab?: ActiveDocTab;
  initialAction?: 'view' | 'edit' | 'send' | 'preview';
}

type ActiveDocTab = 'photo-evidence' | 'findings-report' | 'quotation';

export const ReportScreen: React.FC<ReportScreenProps> = ({
  job,
  onBack,
  onUpdateQuotation,
  onUpdateDriveFolder,
  onOpenMollyHardware,
  onOpenMollyExpress,
  onOpenGoogleDrive,
  initialTab,
  initialAction,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveDocTab>(() => {
    if (initialTab) return initialTab;
    if (initialAction === 'edit' || initialAction === 'send' || initialAction === 'preview' || initialAction === 'view') {
      return 'quotation';
    }
    if (job.quotation && ((job.quotation.serviceItems && job.quotation.serviceItems.length > 0) || (job.quotation.hardwareItems && job.quotation.hardwareItems.length > 0))) {
      return 'quotation';
    }
    if (job.status === 'Quoted' || job.status === 'Waiting Approval') {
      return 'quotation';
    }
    return 'quotation';
  });
  const [docSubMode, setDocSubMode] = useState<'quotation' | 'invoice'>('quotation');
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isGeneratingSingle, setIsGeneratingSingle] = useState(false);
  const [isOpeningView, setIsOpeningView] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<{
    photo?: GeneratedPdfResult;
    findings?: GeneratedPdfResult;
    quote?: GeneratedPdfResult;
  } | null>(null);
  const [isMollyLoading, setIsMollyLoading] = useState(false);
  const { logoUrl, updateLogo } = useCustomLogo();
  const reportLogoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingReportLogo, setIsUploadingReportLogo] = useState(false);

  // Sync initial action reactively
  useEffect(() => {
    if (initialAction === 'edit') {
      setActiveTab('quotation');
      setIsQuickEstimateOpen(true);
      setIsShareModalOpen(false);
      setIsDocPreviewModalOpen(false);
    } else if (initialAction === 'send') {
      setActiveTab('quotation');
      setIsShareModalOpen(true);
      setIsQuickEstimateOpen(false);
      setIsDocPreviewModalOpen(false);
    } else if (initialAction === 'preview') {
      setActiveTab('quotation');
      setPreviewModalDoc('quotation');
      setIsDocPreviewModalOpen(true);
      setIsQuickEstimateOpen(false);
      setIsShareModalOpen(false);
    } else if (initialAction === 'view') {
      setActiveTab('quotation');
    }
  }, [initialAction]);

  const handleReportLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingReportLogo(true);
      await updateLogo(file);
      alert('บันทึกรูปโลโก้ต้นฉบับแท้ 100% สำเร็จ (ไม่ดัดแปลง) เอกสารทุกใบอัปเดตเรียบร้อยครับ!');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการโหลดรูปภาพ');
    } finally {
      setIsUploadingReportLogo(false);
      if (reportLogoInputRef.current) reportLogoInputRef.current.value = '';
    }
  };

  // Google Drive states
  const [isEditingDrive, setIsEditingDrive] = useState(false);
  const [driveInput, setDriveInput] = useState(job.driveFolderUrl || '');
  const [copiedDrive, setCopiedDrive] = useState(false);
  const [isDriveWarningModalOpen, setIsDriveWarningModalOpen] = useState(false);
  const [isQuickEstimateOpen, setIsQuickEstimateOpen] = useState(() => initialAction === 'edit');
  const [quickEstimateEditServiceIndex, setQuickEstimateEditServiceIndex] = useState<number | null>(null);
  const [quickEstimateEditHardwareIndex, setQuickEstimateEditHardwareIndex] = useState<number | null>(null);

  const isDemoDrive = (url?: string): boolean => {
    if (!url || !url.trim()) return false;
    return (
      url.includes('1PTL-') ||
      url.includes('PTL-') ||
      url.includes('Evidence-2026') ||
      url.includes('example.com')
    );
  };

  const handleOpenDriveLink = (e: React.MouseEvent) => {
    if (isDemoDrive(job.driveFolderUrl)) {
      e.preventDefault();
      setIsDriveWarningModalOpen(true);
    }
  };

  // WhatsApp share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(() => initialAction === 'send');
  const [copiedShareSummary, setCopiedShareSummary] = useState(false);

  // Fullscreen in-app document preview modal state
  const [isDocPreviewModalOpen, setIsDocPreviewModalOpen] = useState(() => initialAction === 'preview');
  const [previewModalDoc, setPreviewModalDoc] = useState<ActiveDocTab>(initialTab || 'quotation');

  // Quotation Page Layout state (single page vs separate terms page 2)
  const [separateTermsPage, setSeparateTermsPage] = useState<boolean>(() => {
    if (job.quotation?.separateTermsPage !== undefined) {
      return job.quotation.separateTermsPage;
    }
    const termsCount = job.quotation?.terms?.length || 0;
    const itemsCount = (job.quotation?.hardwareItems?.length || 0) + (job.quotation?.serviceItems?.length || 0);
    return termsCount > 2 || itemsCount >= 2;
  });

  const handleToggleSeparateTermsPage = (val: boolean) => {
    setSeparateTermsPage(val);
    if (onUpdateQuotation) {
      onUpdateQuotation({
        ...job.quotation,
        separateTermsPage: val,
      });
    }
  };

  const handleOpenDocPreview = (doc: ActiveDocTab) => {
    setActiveTab(doc);
    setPreviewModalDoc(doc);
    setIsDocPreviewModalOpen(true);
  };

  const scrollToLiveDoc = (doc?: ActiveDocTab) => {
    if (doc) setActiveTab(doc);
    document.getElementById('document-live-view')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-seed quotation service item if empty so grand total is never ฿0
  useEffect(() => {
    if (
      job.quotation &&
      (!job.quotation.hardwareItems || job.quotation.hardwareItems.length === 0) &&
      (!job.quotation.serviceItems || job.quotation.serviceItems.length === 0) &&
      onUpdateQuotation
    ) {
      onUpdateQuotation({
        ...job.quotation,
        serviceItems: [
          {
            item: 1,
            description: 'On-Site Technical Diagnostics & Investigation',
            detail: `งานช่างเทคนิคลงพื้นที่ตรวจสอบและวิเคราะห์สาเหตุปัญหา (${job.items.length || 1} จุดตรวจ)`,
            estimatedSchedule: 'Immediate / Completed',
            qty: '1 Job',
            amount: 2500,
          },
        ],
      });
    }
  }, [job.id]);

  // Current procurement fee rate
  const currentFeeRate = job.quotation.procurementFeeRate ?? 0.15;
  const currentFeePct = Math.round(currentFeeRate * 100);

  // Subtotals for live preview
  const hardwareSubtotal = (job.quotation.hardwareItems || []).reduce((sum, it) => sum + it.amount, 0);
  const currentFeeAmount = hardwareSubtotal * currentFeeRate;
  const rawServicesSubtotal = (job.quotation.serviceItems || []).reduce((sum, it) => sum + it.amount, 0);
  const servicesSubtotal =
    rawServicesSubtotal > 0
      ? rawServicesSubtotal
      : hardwareSubtotal === 0
      ? 2500
      : 0;
  const grandTotal = hardwareSubtotal + currentFeeAmount + servicesSubtotal;

  const handleSaveDriveUrl = () => {
    if (onUpdateDriveFolder) {
      onUpdateDriveFolder(driveInput.trim());
    } else if (onUpdateQuotation) {
      // Fallback
      job.driveFolderUrl = driveInput.trim();
    }
    setIsEditingDrive(false);
  };

  const handleAutoGenerateDriveUrl = () => {
    const generated = `https://drive.google.com/drive/folders/1PTL-${(job.customerName || 'Villa').replace(/\s+/g, '')}-Evidence-${Date.now().toString().slice(-4)}`;
    setDriveInput(generated);
    if (onUpdateDriveFolder) {
      onUpdateDriveFolder(generated);
    }
  };

  const handleCopyDriveUrl = () => {
    if (job.driveFolderUrl) {
      navigator.clipboard.writeText(job.driveFolderUrl);
      setCopiedDrive(true);
      setTimeout(() => setCopiedDrive(false), 2000);
    }
  };

  const handleSetCoordinateFee = (newRate: number) => {
    const clampedRate = Math.min(0.15, Math.max(0.05, Math.round(newRate * 100) / 100));
    if (onUpdateQuotation) {
      onUpdateQuotation({
        ...job.quotation,
        procurementFeeRate: clampedRate,
      });
    }
  };

  const handleMollyRefreshQuotation = async (overrideCustomRequest?: string) => {
    setIsMollyLoading(true);
    try {
      const isMissedRequest = Boolean(
        overrideCustomRequest &&
          (overrideCustomRequest.includes('ผิดนัด') ||
            overrideCustomRequest.includes('เสียเวลา') ||
            overrideCustomRequest.includes('เบี้ยว') ||
            overrideCustomRequest.includes('missed'))
      );

      const res = await fetch('/api/gemini/molly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findings: isMissedRequest ? [] : job.items || [],
          customerName: job.customerName || 'Customer',
          location: job.villaName || job.propertyLocation || 'Phuket',
          villaName: job.villaName || job.propertyLocation || 'Phuket Villa',
          serviceType: isMissedRequest
            ? 'Cancellation / Missed Appointment Fee'
            : job.serviceType || 'Technical Inspection',
          coordinateFeeRate: currentFeeRate,
          customRequest:
            overrideCustomRequest ||
            (job.items && job.items.length > 0
              ? `จัดสรรรายการอุปกรณ์และงานบริการที่ตรงกับจุดตรวจจริงของ Mr. Big จำนวน ${job.items.length} จุด: ${job.items.map((i) => `${i.locationZone || ''} ${i.observationTh || i.observationEn}`).join('; ')}`
              : `จัดสรรรายการอุปกรณ์และงานบริการตามประเภทงาน ${job.serviceType || 'ตรวจเช็กวิลล่าและระบบเทคนิค'} พร้อมราคาตลาดภูเก็ต และคำนวณค่าจัดหา ${currentFeePct}% ตามมาตรฐาน Phuket Trusted Local`),
        }),
      });

      if (res.ok) {
        const mollyData = await res.json();
        if (onUpdateQuotation) {
          const updatedQuotation = {
            ...job.quotation,
            refNo: job.quotation.refNo || (job.id ? `PTL-QT-${job.id.replace('job-', '')}` : 'PTL-QT-001'),
            date: job.quotation.date || job.date || new Date().toISOString().split('T')[0],
            inspectionRef: job.quotation.inspectionRef || job.id,
            hardwareItems: mollyData.hardwareItems || (isMissedRequest ? job.quotation.hardwareItems || [] : []),
            serviceItems: mollyData.serviceItems || job.quotation.serviceItems || [],
            procurementFeeRate: mollyData.procurementFeeRate ?? currentFeeRate,
            terms: mollyData.terms || job.quotation.terms,
            contingencies: mollyData.contingencies || job.quotation.contingencies,
            mollyNotes:
              mollyData.mollyNotes ||
              `คำนวณราคาและตรวจสอบสต็อกโดย Molly (ค่าจัดหา ${Math.round((mollyData.procurementFeeRate ?? currentFeeRate) * 100)}%)`,
          };
          onUpdateQuotation(updatedQuotation);
        }
        confetti({
          particleCount: 30,
          spread: 45,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('Molly calculation error:', err);
    } finally {
      setIsMollyLoading(false);
    }
  };

  // Delete item handlers directly from quotation preview
  const handleDeleteHardwareItem = (index: number) => {
    if (!onUpdateQuotation) return;
    const currentQ = job.quotation;
    const targetItem = (currentQ.hardwareItems || [])[index];
    if (!targetItem) return;

    const remaining = (currentQ.hardwareItems || [])
      .filter((_, i) => i !== index)
      .map((it, i) => ({ ...it, item: i + 1 }));

    onUpdateQuotation({
      ...currentQ,
      hardwareItems: remaining,
    });
  };

  const handleDeleteServiceItem = (index: number) => {
    if (!onUpdateQuotation) return;
    const currentQ = job.quotation;
    const targetItem = (currentQ.serviceItems || [])[index];
    if (!targetItem) return;

    const remaining = (currentQ.serviceItems || [])
      .filter((_, i) => i !== index)
      .map((it, i) => ({ ...it, item: i + 1 }));

    onUpdateQuotation({
      ...currentQ,
      serviceItems: remaining,
    });
  };

  const handleSetMissedFeeDirectly = (keepExisting = false) => {
    if (!onUpdateQuotation) return;
    const currentQ = job.quotation;
    const missedItem = {
      item: keepExisting ? (currentQ.serviceItems?.length || 0) + 1 : 1,
      description: 'Cancellation / Missed Appointment Fee',
      detail: 'ค่าธรรมเนียมสงวนเวลาช่างและจัดสรรเส้นทางเข้าหน้างาน (Dedicated Technician Route & Opportunity Cost - กรณีเข้าวิลล่าไม่ได้/ผู้เช่าไม่มาตามนัด)',
      estimatedSchedule: 'เรียกเก็บตามนโยบายการนัดหมาย (Appointment Policy)',
      qty: '1 ครั้ง (Visit)',
      amount: 1000,
    };

    const newServices = keepExisting
      ? [...(currentQ.serviceItems || []), missedItem]
      : [missedItem];

    const missedTerms = [
      "Appointment Policy: As the technician needs to be scheduled specifically for your property, we kindly ask that someone is available at the agreed appointment time.",
      "Cancellations with less than 24 hours’ notice or missed appointments may be subject to a Cancellation / Missed Appointment Fee of THB 1,000.",
      "สำหรับการนัดหมายครั้งถัดไป ทีมงานแนะนำเรียกเก็บ Appointment Deposit THB 1,000 ก่อนเข้าดำเนินการ: หากมาตามนัด ยอดนี้จะนำไปหักเต็มจำนวนจากค่าติดตั้งจริง แต่หากเบี้ยวนัดโดยไม่แจ้งล่วงหน้า 24 ชม. ขอสงวนสิทธิ์ไม่คืนเงินมัดจำ",
      "Phuket Trusted Local ยึดหลักความโปร่งใส แยก 3 รายการชัดเจน (Replacement/Installation, Travel/Call-out, Missed Appointment Fee) โดยไม่ใช้คำว่า Penalty",
    ];

    onUpdateQuotation({
      ...currentQ,
      hardwareItems: keepExisting ? currentQ.hardwareItems || [] : [],
      serviceItems: newServices,
      terms: missedTerms,
      mollyNotes: 'ออกใบเสนอราคา Cancellation / Missed Appointment Fee 1,000 บาท ตามมาตรฐาน Phuket Trusted Local',
    });
  };

  // WhatsApp shareable text generator
  const generateShareText = () => {
    return `🏛️ *PHUKET TRUSTED LOCAL — Field Inspection & Quotation*
----------------------------------------
📋 *Job ID:* ${job.id}
👤 *Customer:* ${job.customerName}
📍 *Villa:* ${job.villaName || job.propertyLocation}
🗓️ *Inspection Date:* ${job.inspectionDate}
🔧 *Service:* ${job.serviceType}
📊 *Findings:* ${job.items.length} Points Verified

📁 *Google Drive High-Res Photo Archive:*
${job.driveFolderUrl || 'Available on request'}

💰 *Quotation Grand Total:* ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB
${currentFeeRate > 0 ? `(Includes Hardware, Technical Services & ${currentFeePct}% Quality Procurement Fee)` : `(Includes Hardware & On-Site Technical Services)`}

✅ *Official PDF Reports Attached:*
1. Photo Evidence & Technical Log
2. Comprehensive Findings & Action Plan
3. Official Quotation & 1-Year Guarantee

Phuket Trusted Local • Peace of Mind Technical Audits`;
  };

  const handleCopyShareSummary = () => {
    navigator.clipboard.writeText(generateShareText());
    setCopiedShareSummary(true);
    setTimeout(() => setCopiedShareSummary(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Single file generate and view / download handler
  const handleGenerateFile = async (
    docType: 'photo' | 'findings' | 'quote',
    action: 'view' | 'download',
    targetSourceElement?: HTMLElement | null
  ) => {
    const targetDoc: ActiveDocTab =
      docType === 'photo'
        ? 'photo-evidence'
        : docType === 'findings'
        ? 'findings-report'
        : 'quotation';

    // When clicking "เปิดดูพรีวิว" (View Preview):
    // Instantly open the In-App Fullscreen Modal Previewer!
    // No popup blockers, works 100% on iOS Safari/Chrome without errors!
    if (action === 'view') {
      handleOpenDocPreview(targetDoc);
      return;
    }

    // Switch active tab so the preview immediately reflects it
    setActiveTab(targetDoc);
    setIsGeneratingSingle(true);
    const docNameThai =
      docType === 'photo'
        ? 'Photo Evidence Log'
        : docType === 'findings'
        ? 'Site Inspection Report'
        : 'Official Quotation';
    setProgressMsg(`กำลังเตรียม ${docNameThai}...`);

    await new Promise((r) => setTimeout(r, 300));

    let elementId = 'photo-evidence-doc';
    let filename = `1_PTL_Photo_Evidence_Log_${job.id}.pdf`;

    if (docType === 'findings') {
      elementId = 'findings-report-doc';
      filename = `2_PTL_Site_Inspection_Report_${job.id}.pdf`;
    } else if (docType === 'quote') {
      if (docSubMode === 'invoice') {
        elementId = 'invoice-doc';
        const invNo = job.quotation.invoiceNo || job.quotation.refNo.replace('PTL-QT-', 'PTL-INV-');
        filename = `3_PTL_Invoice_${invNo}.pdf`;
      } else {
        elementId = 'quotation-doc';
        filename = `3_PTL_Quotation_${job.quotation.refNo}.pdf`;
      }
    }

    // Prefer source element provided (e.g. from preview modal), otherwise locate in DOM
    const element = targetSourceElement || document.getElementById(elementId);
    if (!element) {
      setIsGeneratingSingle(false);
      setProgressMsg('');
      handleOpenDocPreview(targetDoc);
      return;
    }

    try {
      const result = await generatePdfFromElement(element, filename, (msg) => setProgressMsg(msg));
      setGeneratedResults((prev) => ({
        ...prev,
        [docType]: result,
      }));
      confetti({
        particleCount: 40,
        spread: 55,
        origin: { y: 0.7 },
      });

      // Mobile share sheet if supported on iOS/Android
      if (typeof navigator !== 'undefined' && navigator.canShare && result.blob) {
        try {
          const file = new File([result.blob], filename, { type: 'application/pdf' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: filename,
              text: `เอกสารตรวจหน้างาน Phuket Trusted Local: ${filename}`,
              files: [file],
            });
          }
        } catch (shareErr: any) {
          if (shareErr.name !== 'AbortError') {
            console.warn('Native share notice:', shareErr);
          }
        }
      }
    } catch (err) {
      console.error('Generate file error:', err);
      // Seamlessly open in-app preview reader on failure so user is never blocked
      handleOpenDocPreview(targetDoc);
    } finally {
      setIsGeneratingSingle(false);
      setProgressMsg('');
    }
  };

  // Generate single active PDF
  const handleDownloadSingle = async () => {
    const docType = activeTab === 'photo-evidence' ? 'photo' : activeTab === 'findings-report' ? 'findings' : 'quote';
    await handleGenerateFile(docType, 'download');
  };

  // Open single active PDF directly in in-app reader (100% immune to popup blockers)
  const handleOpenSingleInNewTab = () => {
    handleOpenDocPreview(activeTab);
  };

  // Batch generate and download all 3 documents!
  const handleDownloadAllThree = async () => {
    setIsGeneratingAll(true);
    setDownloadSuccess(false);
    setGeneratedResults(null);

    try {
      const results: {
        photo?: GeneratedPdfResult;
        findings?: GeneratedPdfResult;
        quote?: GeneratedPdfResult;
      } = {};

      // 1. Photo Evidence
      setProgressMsg('1/3 กำลังสร้าง Photo Evidence Log...');
      setActiveTab('photo-evidence');
      await new Promise((r) => setTimeout(r, 250));
      const photoEl = document.getElementById('photo-evidence-doc');
      if (photoEl) {
        try {
          results.photo = await generatePdfFromElement(
            photoEl,
            `1_PTL_Photo_Evidence_Log_${job.id}.pdf`,
            (msg) => setProgressMsg(`1/3 ${msg}`)
          );
        } catch (e1) {
          console.warn('Doc 1 creation notice:', e1);
        }
      }

      await new Promise((r) => setTimeout(r, 250));

      // 2. Site Inspection Report
      setProgressMsg('2/3 กำลังสร้าง Site Inspection Report...');
      setActiveTab('findings-report');
      await new Promise((r) => setTimeout(r, 250));
      const findingsEl = document.getElementById('findings-report-doc');
      if (findingsEl) {
        try {
          results.findings = await generatePdfFromElement(
            findingsEl,
            `2_PTL_Site_Inspection_Report_${job.id}.pdf`,
            (msg) => setProgressMsg(`2/3 ${msg}`)
          );
        } catch (e2) {
          console.warn('Doc 2 creation notice:', e2);
        }
      }

      await new Promise((r) => setTimeout(r, 250));

      // 3. Quotation / Invoice
      setProgressMsg('3/3 กำลังสร้าง Official Quotation & Warranty...');
      setActiveTab('quotation');
      await new Promise((r) => setTimeout(r, 250));
      const quoteEl = document.getElementById(docSubMode === 'invoice' ? 'invoice-doc' : 'quotation-doc');
      if (quoteEl) {
        try {
          const qName =
            docSubMode === 'invoice'
              ? `3_PTL_Invoice_${job.quotation.invoiceNo || job.quotation.refNo.replace('PTL-QT-', 'PTL-INV-')}.pdf`
              : `3_PTL_Quotation_${job.quotation.refNo}.pdf`;
          results.quote = await generatePdfFromElement(
            quoteEl,
            qName,
            (msg) => setProgressMsg(`3/3 ${msg}`)
          );
        } catch (e3) {
          console.warn('Doc 3 creation notice:', e3);
        }
      }

      setGeneratedResults(results);
      setDownloadSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error(err);
      alert('สร้างเอกสารเรียบร้อย คุณสามารถแตะเปิดดูหรือบันทึกทีละฉบับในรายการด้านล่างได้ทันทีครับ');
    } finally {
      setIsGeneratingAll(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16 w-full max-w-full overflow-x-hidden">
      {/* Top Navigation with iOS Safe Area / Notch Support */}
      <nav
        className="bg-[#102a4e] text-white pb-3 px-3.5 sm:px-6 shadow-md sticky top-0 z-40 flex items-center justify-between w-full max-w-full border-b border-sky-950/60"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 18px)' }}
        aria-label="Report Navigation"
      >
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 bg-sky-900/80 hover:bg-sky-800 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-sky-400/40 transition-all active:scale-95 shadow-xs shrink-0 min-h-[44px] cursor-pointer"
          title="กลับไปหน้าหลัก"
        >
          <ArrowLeft className="w-4 h-4 text-sky-300 shrink-0" />
          <span>กลับไปหน้าหลัก (Home)</span>
        </button>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={reportLogoInputRef}
            accept="image/*"
            onChange={handleReportLogoUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => reportLogoInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer min-h-[44px]"
            title="แตะเพื่อเลือกไฟล์รูปต้นฉบับที่คุณอัปโหลด (IMG_4062.JPG) ห้ามดัดแปลง"
          >
            <Upload className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden sm:inline">
              {isUploadingReportLogo ? 'กำลังบันทึก...' : 'อัปโหลดรูปต้นฉบับ (ห้ามดัดแปลง)'}
            </span>
            <span className="sm:hidden">รูปต้นฉบับ</span>
          </button>

          <div className="text-right min-w-0">
            <div className="text-[11px] font-mono text-sky-200 truncate font-semibold">
              Job: {job.id}
            </div>
            <div className="text-[10px] text-sky-300/80 truncate max-w-[140px] sm:max-w-none">
              {job.customerName || 'Villa'}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-5 w-full min-w-0">
        {/* Official Generated Files List matching user's exact specification */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md mb-6 overflow-hidden">
          {/* Top Header Card */}
          <div className="bg-gradient-to-r from-[#102a4e] via-[#163a6b] to-[#1e4b85] text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-sky-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  Official Standard Files
                </span>
                <span className="text-xs text-sky-200 font-medium">3 ไฟล์มาตรฐาน PTL พร้อมส่งลูกค้า</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                📋 รายการไฟล์เอกสารตรวจหน้างาน &amp; ใบเสนอราคา
              </h2>
              <p className="text-xs text-sky-100/80 mt-0.5">
                กดสร้างเสร็จแสดงเป็นไฟล์ลิสต์ทันที สามารถเปิดดู พรีวิว หรือดาวน์โหลดไฟล์ได้โดยตรง
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadAllThree}
                disabled={isGeneratingAll || isGeneratingSingle}
                className="bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 min-h-[40px] cursor-pointer"
              >
                {isGeneratingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{progressMsg || 'กำลังสร้างไฟล์ทั้งหมด...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>⚡ สร้าง PDF ทั้ง 3 ไฟล์</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={triggerNativePrint}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-white/25 transition-colors min-h-[40px] cursor-pointer"
                title="พิมพ์หรือบันทึกเป็น PDF แท้จากเครื่อง"
              >
                <Printer className="w-4 h-4 text-sky-300" />
                <span>🖨️ พิมพ์ / PDF</span>
              </button>
            </div>
          </div>

          {/* 3 Core Official Documents List */}
          <div className="divide-y divide-slate-100">
            {/* File 1: Photo Evidence Log */}
            <div className="p-4 sm:p-4.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      1. Photo Evidence Log (บันทึกภาพถ่ายหลักฐานหน้างาน)
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                      {job.items.length} จุดตรวจ
                    </span>
                    {generatedResults?.photo && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> สร้างแล้ว
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                    1_PTL_Photo_Evidence_Log_{job.id}.pdf
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleGenerateFile('photo', 'view')}
                  disabled={isGeneratingSingle || isGeneratingAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>เปิดดูพรีวิว</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateFile('photo', 'download')}
                  disabled={isGeneratingSingle || isGeneratingAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#102a4e] hover:bg-blue-900 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  title="แชร์สรุปให้ลูกค้า"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* File 2: Site Inspection Report */}
            <div className="p-4 sm:p-4.5 hover:bg-amber-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/15">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      2. Site Inspection Report (รายงานตรวจสภาพหน้างานและข้อบกพร่อง)
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      Engineering Audit
                    </span>
                    {generatedResults?.findings && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> สร้างแล้ว
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                    2_PTL_Site_Inspection_Report_{job.id}.pdf
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleGenerateFile('findings', 'view')}
                  disabled={isGeneratingSingle || isGeneratingAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>เปิดดูพรีวิว</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateFile('findings', 'download')}
                  disabled={isGeneratingSingle || isGeneratingAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#102a4e] hover:bg-blue-900 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  title="แชร์สรุปให้ลูกค้า"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* File 3: Quotation / Invoice */}
            <div className="p-4 sm:p-4.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      3. {docSubMode === 'invoice' ? 'Official Invoice (ใบแจ้งหนี้รับเงิน)' : 'Official Quotation (ใบเสนอราคา & ประกัน 1 ปี)'}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      ฿{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {generatedResults?.quote && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> สร้างแล้ว
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                    {docSubMode === 'invoice'
                      ? `3_PTL_Invoice_${job.quotation.invoiceNo || job.quotation.refNo.replace('PTL-QT-', 'PTL-INV-')}.pdf`
                      : `3_PTL_Quotation_${job.quotation.refNo}.pdf`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleGenerateFile('quote', 'view')}
                  disabled={isGeneratingSingle || isGeneratingAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>เปิดดูพรีวิว</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateFile('quote', 'download')}
                  disabled={isGeneratingSingle || isGeneratingAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#102a4e] hover:bg-blue-900 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  title="แชร์สรุปให้ลูกค้า"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Google Drive Archive & Instant Share Bar */}
        <div className="mb-4 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-800">
                  📁 Google Drive Photo Evidence (Cloud Archive)
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                  RAW High-Res
                </span>
                {job.driveFolderUrl && (
                  isDemoDrive(job.driveFolderUrl) ? (
                    <button
                      type="button"
                      onClick={() => setIsDriveWarningModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300 transition-colors"
                      title="คลิกเพื่อดูคำแนะนำการใส่โฟลเดอร์จริง"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                      <span>ลิงก์จำลอง (Demo Link)</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      <Check className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span>โฟลเดอร์จริงพร้อมใช้งาน</span>
                    </span>
                  )
                )}
              </div>
              <div className="text-[11px] text-slate-500 truncate max-w-md sm:max-w-lg mt-0.5">
                {job.driveFolderUrl ? (
                  <a
                    href={job.driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleOpenDriveLink}
                    className="text-blue-600 hover:underline inline-flex items-center gap-1 font-mono"
                  >
                    <span className="truncate">{job.driveFolderUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-amber-600">ยังไม่ได้ระบุลิงก์โฟลเดอร์ Google Drive</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {onOpenGoogleDrive && (
              <button
                type="button"
                onClick={onOpenGoogleDrive}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#102a4e] hover:bg-blue-900 text-white transition-colors shadow-2xs cursor-pointer"
                title="เปิดระบบจัดการ Google Drive และอัปโหลดภาพอัตโนมัติ"
              >
                <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>⚡ ซิงค์ Drive API</span>
              </button>
            )}

            {job.driveFolderUrl && (
              <>
                <a
                  href={job.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleOpenDriveLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>เปิดไดรฟ์</span>
                </a>
                <button
                  onClick={handleCopyDriveUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="คัดลอกลิงก์ Google Drive"
                >
                  {copiedDrive ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกลิงก์</span>
                    </>
                  )}
                </button>
              </>
            )}

            <button
              onClick={() => setIsEditingDrive(!isEditingDrive)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingDrive ? 'ปิดแก้ไข' : 'แก้ไขลิงก์'}</span>
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>แชร์ WhatsApp / LINE</span>
            </button>
          </div>
        </div>

        {/* Inline Drive Editor */}
        {isEditingDrive && (
          <div className="mb-4 p-4 bg-blue-50/70 rounded-xl border border-blue-200 animate-in fade-in space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">
                กำหนดหรือเปลี่ยนลิงก์ Google Drive Folder สำหรับงานนี้
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="https://drive.google.com/drive/my-drive"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-md border border-blue-300 font-semibold transition-colors shadow-2xs"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>เปิด Google Drive เพื่อสร้าง/คัดลอกลิงก์</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={handleAutoGenerateDriveUrl}
                  className="text-[11px] text-slate-500 hover:text-blue-700 font-semibold underline"
                  title="สร้างลิงก์สมมุติเพื่อใช้พรีวิวเอกสาร"
                >
                  ⚡ สุ่มลิงก์จำลอง (Demo)
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={driveInput}
                onChange={(e) => setDriveInput(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/1abc... (วางลิงก์โฟลเดอร์จริงที่นี่)"
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden bg-white font-mono"
              />
              <button
                onClick={handleSaveDriveUrl}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 shadow-xs"
              >
                บันทึกลิงก์
              </button>
            </div>

            {/* Step-by-step guidance */}
            <div className="text-[11px] text-slate-700 bg-white/90 p-3 rounded-lg border border-blue-100 space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>วิธีนำลิงก์โฟลเดอร์จริงจาก Google Drive มาวาง (แก้ปัญหา File not found):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] pl-1">
                <li>เปิดแอป <strong>Google Drive</strong> บน iPhone หรือเข้าเว็บ <strong>drive.google.com</strong></li>
                <li>สร้างโฟลเดอร์ใหม่ (เช่น <span className="font-mono text-slate-800 font-semibold">Job PTL - {job.customerName}</span>) หรือเลือกโฟลเดอร์ที่มีอยู่</li>
                <li>แตะจุดสามจุด <span className="font-mono font-bold">(...)</span> &gt; เลือก <strong>"จัดการคนและลิงก์" (Share)</strong></li>
                <li>เปลี่ยนสิทธิ์เป็น <strong>"ทุกคนที่มีลิงก์" (Anyone with the link)</strong> แล้วกด <strong>"คัดลอกลิงก์" (Copy Link)</strong></li>
                <li>นำลิงก์มาวางในช่องด้านบน แล้วกด <strong>"บันทึกลิงก์"</strong></li>
              </ol>
            </div>
          </div>
        )}

        {/* Document Tabs & Direct Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div className="grid grid-cols-3 gap-1.5 bg-slate-200/80 p-1.5 rounded-xl border border-slate-300/80 w-full lg:w-auto shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('photo-evidence')}
              className={`flex items-center justify-center gap-1 sm:gap-2 px-2.5 py-2.5 rounded-lg text-xs font-bold transition-all text-center ${
                activeTab === 'photo-evidence'
                  ? 'bg-[#102a4e] text-white shadow-md'
                  : 'bg-white/90 text-slate-700 hover:bg-white hover:text-slate-950'
              }`}
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">1. Photo Log</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('findings-report')}
              className={`flex items-center justify-center gap-1 sm:gap-2 px-2.5 py-2.5 rounded-lg text-xs font-bold transition-all text-center ${
                activeTab === 'findings-report'
                  ? 'bg-[#102a4e] text-white shadow-md'
                  : 'bg-white/90 text-slate-700 hover:bg-white hover:text-slate-950'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">2. Site Report</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quotation')}
              className={`flex items-center justify-center gap-1 sm:gap-2 px-2.5 py-2.5 rounded-lg text-xs font-bold transition-all text-center ${
                activeTab === 'quotation'
                  ? 'bg-[#102a4e] text-white shadow-md'
                  : 'bg-white/90 text-slate-700 hover:bg-white hover:text-slate-950'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                3. {docSubMode === 'invoice' ? 'Invoice' : 'Quotation'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => handleOpenDocPreview(activeTab)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-colors shrink-0 min-h-[42px] cursor-pointer"
              title="เปิดดูเอกสารพรีวิวความคมชัดสูงเต็มจอ พร้อมปุ่มพิมพ์และส่งต่อ"
            >
              <Eye className="w-4 h-4 text-white" />
              <span>เปิดดูพรีวิว (Full Preview)</span>
            </button>

            <button
              type="button"
              onClick={triggerNativePrint}
              className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-300 shadow-xs transition-colors shrink-0 min-h-[42px] cursor-pointer"
              title="สั่งพิมพ์หรือบันทึกเป็น PDF ผ่านระบบมาตรฐานของอุปกรณ์"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">พิมพ์ / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSingle}
              disabled={isGeneratingSingle || isGeneratingAll}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-[#102a4e] hover:bg-blue-900 active:bg-blue-950 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-colors shrink-0 disabled:opacity-50 min-h-[42px] cursor-pointer"
            >
              {isGeneratingSingle ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Download className="w-3.5 h-3.5 text-white" />
              )}
              <span>
                {activeTab === 'quotation' && docSubMode === 'invoice'
                  ? 'ดาวน์โหลด Invoice'
                  : 'ดาวน์โหลด PDF'}
              </span>
            </button>
          </div>
        </div>

        {/* Quotation vs Invoice Sub-mode Selector */}
        {activeTab === 'quotation' && (
          <div className="mb-4 bg-gradient-to-r from-blue-900 to-indigo-950 p-3 sm:p-4 rounded-xl text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  DOCUMENT MODE / โหมดเอกสารการเงิน
                </span>
                <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Molly Ready
                </span>
              </div>
              <p className="text-xs text-blue-100/90 mt-0.5">
                เลือกออก <strong>ใบเสนอราคา (Quotation)</strong> เพื่อให้ลูกค้าอนุมัติ หรืองานเสร็จแล้วออก <strong>ใบแจ้งหนี้ (Invoice)</strong> พร้อมช่องทางโอนเงิน/PromptPay
              </p>
            </div>

            <div className="flex bg-blue-950/80 p-1 rounded-xl border border-blue-700/60 shrink-0 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={() => setDocSubMode('quotation')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  docSubMode === 'quotation'
                    ? 'bg-white text-[#102a4e] shadow-xs'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📄 ใบเสนอราคา (Quotation)</span>
              </button>

              <button
                type="button"
                onClick={() => setDocSubMode('invoice')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  docSubMode === 'invoice'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>💳 ใบแจ้งหนี้ (Invoice / Billing)</span>
              </button>
            </div>

            {onOpenMollyExpress && (
              <button
                id="report-screen-btn-molly-express"
                type="button"
                onClick={onOpenMollyExpress}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer ring-2 ring-amber-300/60 shrink-0 self-stretch sm:self-auto"
                title="คุยกับ Molly เพื่อออกใบเสนอราคาด่วนงานใหม่ใน 5 วินาที"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>💬 คุยกับ Molly (ออกใบเสนอราคาด่วน)</span>
              </button>
            )}
          </div>
        )}

        {/* Coordinate Fee (5% - 15%) Selector Card */}
        {activeTab === 'quotation' && (
          <div className="mb-4 p-4 bg-white rounded-xl border border-slate-200 shadow-xs animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  %
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>Coordinate &amp; Procurement Fee (ค่าจัดหาและประสานงานตรวจรับ)</span>
                    <span className="bg-amber-100 text-amber-900 text-[11px] font-black px-2 py-0.5 rounded-md">
                      {currentFeePct}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    เลือกปรับอัตราค่าดำเนินการได้ 5% – 15% ตามความซับซ้อนของงาน เพื่อความโปร่งใสและสบายใจของลูกค้า
                  </p>
                </div>
              </div>

              {/* Live Calculation summary */}
              <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 self-start sm:self-auto">
                <span>ค่าอุปกรณ์ {hardwareSubtotal.toLocaleString()} ฿</span>
                <span className="text-slate-400">×</span>
                <span className="font-bold text-amber-700">{currentFeePct}%</span>
                <span className="text-slate-400">=</span>
                <span className="font-bold text-slate-900">
                  +{currentFeeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
                </span>
              </div>
            </div>

            {/* Presets and Slider */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 mr-1">เลือกอัตราด่วน:</span>
                {[
                  { rate: 0.05, label: '5% (Basic)' },
                  { rate: 0.08, label: '8% (Standard)' },
                  { rate: 0.10, label: '10% (Silver)' },
                  { rate: 0.12, label: '12% (Gold)' },
                  { rate: 0.15, label: '15% (Peace of Mind ★ แนะนำ)' },
                ].map((preset) => {
                  const isSelected = Math.abs(currentFeeRate - preset.rate) < 0.005;
                  return (
                    <button
                      key={preset.rate}
                      type="button"
                      onClick={() => handleSetCoordinateFee(preset.rate)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#102a4e] text-white shadow-xs scale-102'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-600 shrink-0">สไลเดอร์ปรับละเอียด:</span>
                <input
                  type="range"
                  min="0.05"
                  max="0.15"
                  step="0.01"
                  value={currentFeeRate}
                  onChange={(e) => handleSetCoordinateFee(parseFloat(e.target.value))}
                  className="flex-1 accent-blue-900 cursor-pointer"
                />
                <span className="text-xs font-black text-slate-900 w-10 text-right font-mono">
                  {currentFeePct}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Molly Coordinator Banner for Quotation */}
        {activeTab === 'quotation' && (
          <div className="mb-4 p-3.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-blue-900/10 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                M
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Molly (The Smart Coordinator)</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.2 rounded-full">
                    Sourcing &amp; {currentFeePct}% Procurement Fee
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  สืบราคาตลาดไทย (HomePro, Lazada, Shopee) + ค่าจัดหา {currentFeePct}% + เงื่อนไขรับประกัน Peace of Mind
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onOpenMollyHardware && (
                <button
                  onClick={onOpenMollyHardware}
                  className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black px-3.5 py-2 rounded-lg transition-all shadow-xs shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ ถาม Molly (สืบราคาอุปกรณ์ &amp; งานไฟ)</span>
                </button>
              )}

              <button
                onClick={() => {
                  setQuickEstimateEditServiceIndex(null);
                  setQuickEstimateEditHardwareIndex(null);
                  setIsQuickEstimateOpen(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 bg-[#102a4e] hover:bg-blue-900 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shadow-xs shrink-0"
                title="จัดการรายการในใบเสนอราคา เพิ่มรายการด่วน แก้ไข หรือลบรายการที่ไม่ต้องการออก"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  📋 จัดการ/ลบรายการ (
                  {(job.quotation?.hardwareItems?.length || 0) +
                    (job.quotation?.serviceItems?.length || 0)}
                  )
                </span>
              </button>

              <button
                onClick={handleMollyRefreshQuotation}
                disabled={isMollyLoading}
                className="inline-flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shadow-xs disabled:opacity-50 shrink-0"
              >
                {isMollyLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Molly กำลังคำนวณราคา...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ ให้ Molly คำนวณราคา ({currentFeePct}%)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const hasExisting =
                    (job.quotation?.hardwareItems?.length || 0) > 0 ||
                    (job.quotation?.serviceItems?.length || 0) > 0;
                  if (hasExisting) {
                    const onlyMissed = window.confirm(
                      'คุณต้องการปรับใบเสนอราคาเป็น "ค่าผิดนัดหมาย 1,000 บาท" รายการเดียว (ลบรายการอื่นเดิมออก) หรือไม่?\n\n• กด [ตกลง (OK)]: ตั้งเหลือเฉพาะค่าผิดนัด ฿1,000 รายการเดียวทันที (เหมาะสำหรับส่งลูกค้าค่าผิดนัด)\n• กด [ยกเลิก (Cancel)]: เพิ่มค่าผิดนัด ฿1,000 รวมเข้าไปกับรายการเดิม'
                    );
                    handleSetMissedFeeDirectly(!onlyMissed);
                  } else {
                    handleSetMissedFeeDirectly(false);
                  }
                }}
                disabled={isMollyLoading}
                className="inline-flex items-center justify-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shadow-xs disabled:opacity-50 shrink-0"
                title="ออกใบเสนอราคาค่าผิดนัดหมาย 1,000 บาท (Cancellation / Missed Appointment Fee ตามมาตรฐาน PTL)"
              >
                <span>⏱️ ออกใบเสนอราคาค่าผิดนัด (฿1,000)</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Document Preview Display */}
        <div className="w-full max-w-full min-w-0 mb-8 overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
            <span className="font-semibold text-slate-700">พรีวิวเอกสารขนาดจริง (Standard A4):</span>
            <span className="text-[11px] text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
              📱 ปัดซ้าย-ขวาเพื่อดูเอกสารเต็มแผ่น
            </span>
          </div>
          <div id="document-live-view" className="bg-slate-200/80 p-2 sm:p-6 rounded-2xl border border-slate-300 shadow-inner overflow-x-auto w-full max-w-full touch-pan-x">
            <div className="min-w-[760px] mx-auto">
              {activeTab === 'photo-evidence' && <PhotoEvidenceDoc job={job} />}
              {activeTab === 'findings-report' && <FindingsReportDoc job={job} />}
              {activeTab === 'quotation' && (
                <QuotationDoc
                  job={job}
                  docType={docSubMode}
                  separateTermsPage={separateTermsPage}
                  onToggleSeparateTermsPage={handleToggleSeparateTermsPage}
                  onTriggerMolly={handleMollyRefreshQuotation}
                  onDeleteHardwareItem={handleDeleteHardwareItem}
                  onDeleteServiceItem={handleDeleteServiceItem}
                  onEditHardwareItem={(idx) => {
                    setQuickEstimateEditHardwareIndex(idx);
                    setQuickEstimateEditServiceIndex(null);
                    setIsQuickEstimateOpen(true);
                  }}
                  onEditServiceItem={(idx) => {
                    setQuickEstimateEditServiceIndex(idx);
                    setQuickEstimateEditHardwareIndex(null);
                    setIsQuickEstimateOpen(true);
                  }}
                  onOpenQuickEstimate={() => {
                    setQuickEstimateEditServiceIndex(null);
                    setQuickEstimateEditHardwareIndex(null);
                    setIsQuickEstimateOpen(true);
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp / LINE Share Dialog Modal */}
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    แชร์สรุปผลงานตรวจ &amp; ใบเสนอราคา
                  </h3>
                  <p className="text-xs text-slate-500">
                    ส่งข้อความสรุปงานที่เป็นทางการพร้อมลิงก์ Google Drive ไปยัง WhatsApp หรือ LINE
                  </p>
                </div>
              </div>

              {/* Message preview box */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  พรีวิวข้อความสรุป (ภาษาอังกฤษแบบมืออาชีพสำหรับลูกค้า):
                </label>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-56 overflow-y-auto border border-slate-700 select-all leading-relaxed">
                  {generateShareText()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>เปิดส่งใน WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyShareSummary}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-slate-300"
                >
                  {copiedShareSummary ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">คัดลอกเรียบร้อย!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>คัดลอกข้อความ</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-400 mt-3">
                แนะนำให้แนบไฟล์ PDF ทั้ง 3 ฉบับตามไปด้วยเพื่อความน่าเชื่อถือระดับสูงสุด
              </p>
            </div>
          </div>
        )}

        {/* Google Drive Warning & Fix Explanation Modal */}
        {isDriveWarningModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => setIsDriveWarningModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-3 mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    ทำไม Google Drive ขึ้นว่า "File not found"?
                  </h3>
                  <p className="text-xs text-amber-800 font-semibold mt-0.5">
                    ตรวจพบว่าคุณกำลังเปิดลิงก์โฟลเดอร์ตัวอย่างจำลอง (Demo Link)
                  </p>
                </div>
              </div>

              {/* Problem Breakdown */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 mb-3.5 space-y-1.5 leading-relaxed">
                <p>
                  <strong>สาเหตุ:</strong> ลิงก์ที่แสดงอยู่ (<span className="font-mono text-[11px] bg-white/80 px-1 py-0.5 rounded border border-amber-300 break-all">{job.driveFolderUrl}</span>) เป็น <strong>ลิงก์สมมุติในระบบพรีวิว</strong> ซึ่งยังไม่ได้ถูกสร้างขึ้นจริงบนเซิร์ฟเวอร์ของ Google
                </p>
                <p className="text-[11px] text-amber-900">
                  เมื่อคุณแตะเปิดบน iPhone ตัวระบบ iOS จะเปิดแอป Google Drive โดยอัตโนมัติ และเมื่อแอปค้นหาไม่พบ จึงแสดงหน้าต่างเตือน <em>"File not found: You might have the wrong URL or the owner may have deleted this file"</em> เหมือนในรูปที่ท่านส่งมา
                </p>
              </div>

              {/* Solution Steps */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 mb-4 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>วิธีแก้ไขง่ายๆ เพื่อให้เปิดดูรูปจริงได้ 100%:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-[11px] pl-1">
                  <li>
                    แตะปุ่ม <strong>"เปิด Google Drive เพื่อเลือก/สร้างโฟลเดอร์"</strong> ด้านล่าง
                  </li>
                  <li>
                    เลือกโฟลเดอร์ที่คุณต้องการ (เช่น โฟลเดอร์ <strong className="text-slate-800 font-mono">Job PF</strong> ของคุณ หรือกดสร้างโฟลเดอร์ใหม่)
                  </li>
                  <li>
                    แตะจุด 3 จุด <span className="font-mono font-bold">(...)</span> &gt; เลือก <strong>แชร์ (Share)</strong> &gt; ปรับสิทธิ์เป็น <strong>"ทุกคนที่มีลิงก์" (Anyone with the link)</strong>
                  </li>
                  <li>
                    แตะ <strong>"คัดลอกลิงก์" (Copy Link)</strong> แล้วกลับมากดปุ่ม <strong>"วางลิงก์จริงในระบบ"</strong>
                  </li>
                </ol>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <a
                  href="https://drive.google.com/drive/my-drive"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#102a4e] hover:bg-blue-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <FolderOpen className="w-4 h-4 text-sky-300" />
                  <span>1. เปิด Google Drive เพื่อสร้างหรือคัดลอกลิงก์</span>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-200" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setIsDriveWarningModalOpen(false);
                    setIsEditingDrive(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>2. นำลิงก์จริงมาวางในระบบ</span>
                </button>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setIsDriveWarningModalOpen(false)}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    ปิดหน้าต่างนี้
                  </button>

                  <a
                    href={job.driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsDriveWarningModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 underline"
                  >
                    ยังคงต้องการลองเปิดลิงก์เดิม &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Estimate Modal */}
        {isQuickEstimateOpen && (
          <QuickEstimateModal
            job={job}
            initialTab="items"
            initialEditServiceIndex={quickEstimateEditServiceIndex}
            initialEditHardwareIndex={quickEstimateEditHardwareIndex}
            onClose={() => {
              setIsQuickEstimateOpen(false);
              setQuickEstimateEditServiceIndex(null);
              setQuickEstimateEditHardwareIndex(null);
            }}
            onSaveQuotation={(updatedJob) => {
              if (onUpdateQuotation) {
                onUpdateQuotation(updatedJob.quotation);
              }
            }}
          />
        )}

        {/* Fullscreen In-App Document Preview Modal */}
        <DocumentPreviewModal
          isOpen={isDocPreviewModalOpen}
          onClose={() => setIsDocPreviewModalOpen(false)}
          initialDoc={previewModalDoc}
          activeDoc={previewModalDoc}
          onChangeDoc={(doc) => {
            setPreviewModalDoc(doc);
            setActiveTab(doc);
          }}
          job={job}
          docSubMode={docSubMode}
          separateTermsPage={separateTermsPage}
          onToggleSeparateTermsPage={handleToggleSeparateTermsPage}
          onDownloadDoc={(docType, sourceElement) => {
            const type = docType === 'photo-evidence' ? 'photo' : docType === 'findings-report' ? 'findings' : 'quote';
            handleGenerateFile(type, 'download', sourceElement);
          }}
          onDownloadPdf={() => {
            const type = previewModalDoc === 'photo-evidence' ? 'photo' : previewModalDoc === 'findings-report' ? 'findings' : 'quote';
            handleGenerateFile(type, 'download');
          }}
          onShareDoc={() => setIsShareModalOpen(true)}
          onTriggerMolly={handleMollyRefreshQuotation}
        />
      </div>

      {/* Floating Quick Back Button on Mobile for Easy Return to Main List */}
      <aside
        className="fixed bottom-5 left-4 z-40 sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Quick Navigation"
      >
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 bg-[#102a4e] hover:bg-[#163a6b] text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl border-2 border-sky-400/60 active:scale-95 transition-all cursor-pointer backdrop-blur-xs"
        >
          <ArrowLeft className="w-4 h-4 text-sky-300" />
          <span>กลับหน้าแรก</span>
        </button>
      </aside>
    </div>
  );
};
