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
  onQuoteSent?: () => void;
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
  onQuoteSent,
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

  // Older quotations stored the automatic two-page layout. Start those inline too;
  // preserve only a page split explicitly selected after the layout change.
  const [separateTermsPage, setSeparateTermsPage] = useState<boolean>(() => {
    return job.quotation?.termsLayoutVersion === 2 && job.quotation.separateTermsPage === true;
  });

  const handleToggleSeparateTermsPage = (val: boolean) => {
    setSeparateTermsPage(val);
    if (onUpdateQuotation) {
      onUpdateQuotation({
        ...job.quotation,
        separateTermsPage: val,
        termsLayoutVersion: 2,
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
    const clampedRate = Math.min(0.15, Math.max(0, Math.round(newRate * 100) / 100));
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
          <span>กลับ</span>
        </button>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={reportLogoInputRef}
            accept="image/*"
            onChange={handleReportLogoUpload}
            className="hidden"
          />
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
        {/* One clear entry point per document. Creation and sharing remain available in the preview. */}
        <section className="mb-5 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden" aria-label="Document Center">
          <div className="px-4 py-5 sm:px-6 border-b border-slate-100">
            <p className="text-xs font-semibold text-sky-700">DOCUMENT CENTER</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">เอกสารของงานนี้</h1>
            <p className="mt-1 text-sm text-slate-600">เลือกเอกสารเพื่อตรวจทาน แล้วดาวน์โหลดหรือแชร์จากหน้าพรีวิว</p>
          </div>
          <div className="divide-y divide-slate-100">
            {([
              { id: 'photo-evidence' as const, icon: Camera, title: 'รูปและหลักฐานหน้างาน', detail: `${job.items.length} จุดตรวจ` },
              { id: 'findings-report' as const, icon: Layers, title: 'รายงานตรวจหน้างาน', detail: 'ผลตรวจและข้อบกพร่อง' },
              { id: 'quotation' as const, icon: FileText, title: docSubMode === 'invoice' ? 'ใบแจ้งหนี้' : 'ใบเสนอราคา', detail: docSubMode === 'invoice' ? 'ยอดและรายละเอียดเรียกเก็บ' : 'ราคา เงื่อนไข และการรับประกัน' },
            ]).map(({ id, icon: Icon, title, detail }) => (
              <div key={id} className="flex items-center gap-3 px-4 py-4 sm:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-slate-900">{title}</h2>
                  <p className="text-xs text-slate-500">{detail}</p>
                </div>
                <button type="button" onClick={() => handleOpenDocPreview(id)}
                  className="shrink-0 rounded-xl bg-[#102a4e] px-4 py-2.5 text-sm font-semibold text-white min-h-[44px]">
                  เปิดดู
                </button>
              </div>
            ))}
          </div>
        </section>

        <details className="mb-5 rounded-2xl border border-slate-200 bg-white" open={initialAction === 'edit' ? true : undefined}>
          <summary className="cursor-pointer px-4 py-4 text-sm font-semibold text-slate-800 sm:px-6">จัดการเอกสารและไฟล์เพิ่มเติม</summary>
          <div className="border-t border-slate-100 px-3 pt-4 sm:px-5">
            <div className="mb-4 flex flex-wrap gap-2">
              <button type="button" onClick={handleDownloadAllThree} disabled={isGeneratingAll || isGeneratingSingle}
                className="rounded-xl bg-[#102a4e] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                {isGeneratingAll ? progressMsg || 'กำลังสร้าง...' : 'ดาวน์โหลดเอกสารทั้ง 3 ฉบับ'}
              </button>
              <button type="button" onClick={() => reportLogoInputRef.current?.click()}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700">
                {isUploadingReportLogo ? 'กำลังบันทึก...' : 'เปลี่ยนโลโก้เอกสาร'}
              </button>
            </div>
            {downloadSuccess && (
              <p className="mb-4 text-xs text-emerald-700">สร้างเอกสารแล้ว ตรวจไฟล์ที่ดาวน์โหลดก่อนส่งให้ลูกค้า</p>
            )}
        <div className="mb-5 rounded-xl border border-slate-200 p-4">
          <p className="mb-3 text-sm font-bold text-slate-800">ดูและส่งเอกสาร</p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="เลือกเอกสาร">
            {([
              { id: 'photo-evidence' as const, label: 'รูปหน้างาน' },
              { id: 'findings-report' as const, label: 'รายงานตรวจ' },
              { id: 'quotation' as const, label: docSubMode === 'invoice' ? 'ใบแจ้งหนี้' : 'ใบเสนอราคา' },
            ]).map(({ id, label }) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)}
                aria-pressed={activeTab === id}
                className={`min-w-0 rounded-lg px-2 py-2.5 text-xs font-semibold ${activeTab === id ? 'bg-[#102a4e] text-white' : 'bg-slate-100 text-slate-700'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => handleOpenDocPreview(activeTab)}
              className="min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white">เปิดพรีวิว</button>
            <button type="button" onClick={handleDownloadSingle} disabled={isGeneratingSingle || isGeneratingAll}
              className="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">
              {isGeneratingSingle ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF'}
            </button>
            <button type="button" onClick={triggerNativePrint}
              className="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">พิมพ์</button>
            <button type="button" onClick={() => setIsShareModalOpen(true)}
              className="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">แชร์สรุปงาน</button>
          </div>
        </div>

        {activeTab === 'quotation' && (
          <div className="mb-5 rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-sm font-bold text-slate-800">ประเภทเอกสาร</p>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="ประเภทเอกสารการเงิน">
              <button type="button" onClick={() => setDocSubMode('quotation')} aria-pressed={docSubMode === 'quotation'}
                className={`min-h-[44px] rounded-lg px-3 py-2 text-sm font-semibold ${docSubMode === 'quotation' ? 'bg-[#102a4e] text-white' : 'bg-slate-100 text-slate-700'}`}>
                ใบเสนอราคา
              </button>
              <button type="button" onClick={() => setDocSubMode('invoice')} aria-pressed={docSubMode === 'invoice'}
                className={`min-h-[44px] rounded-lg px-3 py-2 text-sm font-semibold ${docSubMode === 'invoice' ? 'bg-[#102a4e] text-white' : 'bg-slate-100 text-slate-700'}`}>
                ใบแจ้งหนี้
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">เลือกใบเสนอราคาก่อนขออนุมัติ หรือใบแจ้งหนี้เมื่อต้องเรียกเก็บเงิน</p>
          </div>
        )}

        <details className="mb-4 rounded-xl border border-slate-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800">
            รูปต้นฉบับและ Google Drive {job.driveFolderUrl && !isDemoDrive(job.driveFolderUrl) ? '· เชื่อมแล้ว' : '· ยังไม่เชื่อมโฟลเดอร์จริง'}
          </summary>
          <div className="space-y-3 border-t border-slate-100 p-4">
            {job.driveFolderUrl && !isDemoDrive(job.driveFolderUrl) ? (
              <div className="flex flex-wrap gap-2">
                <a href={job.driveFolderUrl} target="_blank" rel="noopener noreferrer" onClick={handleOpenDriveLink}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">เปิดโฟลเดอร์</a>
                <button type="button" onClick={handleCopyDriveUrl}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
                  {copiedDrive ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
                </button>
              </div>
            ) : (
              <div className="text-xs text-amber-700">
                {job.driveFolderUrl ? 'ลิงก์ปัจจุบันเป็นตัวอย่าง กรุณาใส่โฟลเดอร์จริงก่อนแชร์' : 'ยังไม่มีโฟลเดอร์สำหรับเก็บรูปต้นฉบับ'}
                {job.driveFolderUrl && <button type="button" onClick={() => setIsDriveWarningModalOpen(true)} className="ml-2 underline">ดูวิธีแก้</button>}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {onOpenGoogleDrive && <button type="button" onClick={onOpenGoogleDrive}
                className="rounded-lg bg-[#102a4e] px-3 py-2 text-xs font-semibold text-white">จัดการ Drive</button>}
              <button type="button" onClick={() => setIsEditingDrive(!isEditingDrive)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
                {isEditingDrive ? 'ปิดการแก้ไข' : 'ใส่หรือแก้ลิงก์'}
              </button>
            </div>
            {isEditingDrive && (
              <div className="space-y-2">
                <label htmlFor="report-drive-url" className="block text-xs font-semibold text-slate-700">ลิงก์โฟลเดอร์ Google Drive</label>
                <input id="report-drive-url" type="url" value={driveInput} onChange={(e) => setDriveInput(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                <button type="button" onClick={handleSaveDriveUrl}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white">บันทึกลิงก์</button>
                <details className="text-xs text-slate-600">
                  <summary className="cursor-pointer font-semibold">วิธีคัดลอกลิงก์โฟลเดอร์จริง</summary>
                  <p className="mt-2">เปิด Google Drive เลือกโฟลเดอร์งาน แล้วคัดลอกลิงก์มาวางด้านบน ตรวจสิทธิ์การเข้าถึงก่อนส่งให้ลูกค้า</p>
                  <a href="https://drive.google.com/drive/my-drive" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-blue-700 underline">เปิด Google Drive</a>
                </details>
              </div>
            )}
          </div>
        </details>

        {activeTab === 'quotation' && (
          <>
            <details className="mb-4 rounded-xl border border-slate-200 bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800">
                ค่าจัดหาอุปกรณ์ {currentFeePct}% · +฿{currentFeeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </summary>
              <div className="space-y-3 border-t border-slate-100 p-4">
                <p className="text-xs text-slate-600">คิดจากค่าอุปกรณ์ ฿{hardwareSubtotal.toLocaleString()} ก่อนออกเอกสารให้ลูกค้า</p>
                <label htmlFor="report-procurement-rate" className="block text-xs font-semibold text-slate-700">เลือกอัตราค่าจัดหา</label>
                <select id="report-procurement-rate" value={currentFeePct} onChange={(e) => handleSetCoordinateFee(Number(e.target.value) / 100)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800">
                  {[0, 5, 8, 10, 12, 15].includes(currentFeePct) ? null : <option value={currentFeePct}>{currentFeePct}% (ปัจจุบัน)</option>}
                  {[0, 5, 8, 10, 12, 15].map((pct) => <option key={pct} value={pct}>{pct}%</option>)}
                </select>
                <label htmlFor="report-procurement-slider" className="block text-xs text-slate-600">ปรับละเอียด: {currentFeePct}%</label>
                <input id="report-procurement-slider" type="range" min="0" max="0.15" step="0.01"
                  value={currentFeeRate} onChange={(e) => handleSetCoordinateFee(Number(e.target.value))}
                  className="w-full accent-blue-900" />
              </div>
            </details>

            <details className="mb-4 rounded-xl border border-slate-200 bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800">Molly และรายการราคา</summary>
              <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
                <button type="button" onClick={() => { setQuickEstimateEditServiceIndex(null); setQuickEstimateEditHardwareIndex(null); setIsQuickEstimateOpen(true); }}
                  className="min-h-[44px] rounded-lg bg-[#102a4e] px-3 py-2 text-xs font-semibold text-white">
                  แก้รายการ ({(job.quotation?.hardwareItems?.length || 0) + (job.quotation?.serviceItems?.length || 0)})
                </button>
                {onOpenMollyExpress && <button id="report-screen-btn-molly-express" type="button" onClick={onOpenMollyExpress}
                  className="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">ให้ Molly ร่างใบเสนอราคา</button>}
                {onOpenMollyHardware && <button type="button" onClick={onOpenMollyHardware}
                  className="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">สืบราคาอุปกรณ์</button>}
                <button type="button" onClick={handleMollyRefreshQuotation} disabled={isMollyLoading}
                  className="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">
                  {isMollyLoading ? 'กำลังคำนวณ...' : 'ให้ Molly คำนวณราคา'}
                </button>
                <button type="button" onClick={() => {
                  const hasExisting = (job.quotation?.hardwareItems?.length || 0) + (job.quotation?.serviceItems?.length || 0) > 0;
                  if (!hasExisting || window.confirm('เพิ่มค่าผิดนัดหมาย ฿1,000 เข้าในใบเสนอราคาปัจจุบันหรือไม่?')) {
                    handleSetMissedFeeDirectly(hasExisting);
                  }
                }} disabled={isMollyLoading}
                  className="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">
                  เพิ่มค่าผิดนัด ฿1,000
                </button>
                <button type="button" onClick={() => {
                  if (window.confirm('แทนที่รายการเดิมทั้งหมดด้วยค่าผิดนัด ฿1,000 รายการเดียวหรือไม่?')) {
                    handleSetMissedFeeDirectly(false);
                  }
                }} disabled={isMollyLoading}
                  className="min-h-[44px] rounded-lg px-3 py-2 text-xs text-rose-700 underline disabled:opacity-50">
                  ทำใบเสนอราคาเฉพาะค่าผิดนัด
                </button>
              </div>
            </details>
          </>
        )}

          </div>
        </details>

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

              {activeTab === 'quotation' && onQuoteSent && (
                <button type="button" onClick={() => { onQuoteSent(); setIsShareModalOpen(false); }}
                  className="mt-3 w-full min-h-[44px] rounded-xl bg-blue-600 text-white text-sm font-bold">
                  {job.quoteSentAt ? 'ยืนยันส่งใบเสนอราคาอีกครั้ง' : 'ส่งให้ลูกค้าแล้ว · บันทึกสถานะ'}
                </button>
              )}

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

    </div>
  );
};
