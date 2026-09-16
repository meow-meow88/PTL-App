import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  Camera,
  Layers,
  FileText,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { InspectionJob } from '../types';
import { PhotoEvidenceDoc } from './docs/PhotoEvidenceDoc';
import { FindingsReportDoc } from './docs/FindingsReportDoc';
import { QuotationDoc } from './docs/QuotationDoc';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: InspectionJob;
  initialDoc?: 'photo-evidence' | 'findings-report' | 'quotation';
  activeDoc?: 'photo-evidence' | 'findings-report' | 'quotation';
  onChangeDoc?: (doc: 'photo-evidence' | 'findings-report' | 'quotation') => void;
  docSubMode?: 'quotation' | 'invoice';
  separateTermsPage?: boolean;
  onToggleSeparateTermsPage?: (separate: boolean) => void;
  onDownloadDoc?: (doc: 'photo-evidence' | 'findings-report' | 'quotation', sourceElement?: HTMLElement | null) => void;
  onDownloadPdf?: () => void;
  onShareDoc?: () => void;
  onShare?: () => void;
  onTriggerMolly?: () => void;
  isGenerating?: boolean;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  job,
  initialDoc = 'photo-evidence',
  activeDoc: propActiveDoc,
  onChangeDoc,
  docSubMode = 'quotation',
  separateTermsPage,
  onToggleSeparateTermsPage,
  onDownloadDoc,
  onDownloadPdf,
  onShareDoc,
  onShare,
  onTriggerMolly,
  isGenerating = false,
}) => {
  // Always guarantee an active document even if props mismatch
  const [currentDoc, setCurrentDoc] = useState<'photo-evidence' | 'findings-report' | 'quotation'>(
    propActiveDoc || initialDoc || 'photo-evidence'
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  useEffect(() => {
    if (propActiveDoc) {
      setCurrentDoc(propActiveDoc);
    } else if (initialDoc) {
      setCurrentDoc(initialDoc);
    }
  }, [propActiveDoc, initialDoc, isOpen]);

  // Reset zoom on document change or open
  useEffect(() => {
    if (isOpen) {
      // Set comfortable initial zoom on mobile vs desktop
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        setZoomLevel(88);
      } else {
        setZoomLevel(100);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectDoc = (doc: 'photo-evidence' | 'findings-report' | 'quotation') => {
    setCurrentDoc(doc);
    if (onChangeDoc) {
      onChangeDoc(doc);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Locate the modal's specific rendered document element
    const modalEl = document.querySelector('#modal-document-viewer #quotation-doc') as HTMLElement
      || document.querySelector('#modal-document-viewer #invoice-doc') as HTMLElement
      || document.querySelector('#modal-document-viewer #photo-evidence-doc') as HTMLElement
      || document.querySelector('#modal-document-viewer #findings-report-doc') as HTMLElement
      || null;

    if (onDownloadDoc) {
      onDownloadDoc(currentDoc, modalEl);
    } else if (onDownloadPdf) {
      onDownloadPdf();
    }
  };

  const handleShare = () => {
    if (onShareDoc) {
      onShareDoc();
    } else if (onShare) {
      onShare();
    }
  };

  const getDocTitle = () => {
    switch (currentDoc) {
      case 'photo-evidence':
        return '1. Photo Evidence Log (ภาพถ่ายหลักฐาน)';
      case 'findings-report':
        return '2. Site Inspection Report (รายงานตรวจสภาพหน้างาน)';
      case 'quotation':
        return docSubMode === 'invoice'
          ? '3. Official Invoice (ใบแจ้งหนี้รับเงิน)'
          : '3. Official Quotation (ใบเสนอราคา & รับประกัน 1 ปี)';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Header Bar */}
      <header
        className="bg-[#102a4e] text-white px-3 sm:px-6 py-2.5 border-b border-sky-950 flex items-center justify-between shadow-md shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 10px)' }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-900/90 text-sky-300 flex items-center justify-center shrink-0 border border-sky-700/50">
            {currentDoc === 'photo-evidence' && <Camera className="w-4 h-4" />}
            {currentDoc === 'findings-report' && <Layers className="w-4 h-4" />}
            {currentDoc === 'quotation' && <FileText className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate">
              {getDocTitle()}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-sky-200 truncate">
              {job.villaName || job.customerName} • {job.id}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom Controls */}
          <div className="hidden md:flex items-center bg-sky-950/80 rounded-lg p-0.5 border border-sky-800/40 text-xs mr-1">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 15, 60))}
              className="p-1.5 text-sky-200 hover:text-white rounded hover:bg-sky-800 transition-colors"
              title="ย่อขนาด"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-sky-200">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 15, 140))}
              className="p-1.5 text-sky-200 hover:text-white rounded hover:bg-sky-800 transition-colors"
              title="ขยายขนาด"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="p-1.5 text-sky-200 hover:text-white rounded hover:bg-sky-800 transition-colors"
              title="รีเซ็ต 100%"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-sky-900/80 hover:bg-sky-800 text-sky-100 text-xs font-semibold rounded-lg border border-sky-600/40 transition-colors cursor-pointer"
            title="พิมพ์เอกสาร หรือ บันทึกเป็น PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">พิมพ์ / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="ดาวน์โหลดไฟล์ PDF คุณภาพสูง"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ดาวน์โหลด</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 bg-sky-800/60 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            title="แชร์สรุปงาน"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">แชร์</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-sky-900/60 hover:bg-red-900/70 text-sky-200 hover:text-white transition-colors cursor-pointer ml-1"
            title="ปิดหน้าต่างพรีวิว"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Sub-Tabs Selector (100% visible on all mobile screens) */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-3 py-2 shrink-0">
        <div className="max-w-xl mx-auto grid grid-cols-3 gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => handleSelectDoc('photo-evidence')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate cursor-pointer ${
              currentDoc === 'photo-evidence'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Camera className="w-3 h-3 shrink-0" />
            <span className="truncate">1. Photo Log</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectDoc('findings-report')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate cursor-pointer ${
              currentDoc === 'findings-report'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3 h-3 shrink-0" />
            <span className="truncate">2. Site Report</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectDoc('quotation')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate cursor-pointer ${
              currentDoc === 'quotation'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3 h-3 shrink-0" />
            <span className="truncate">3. Quotation</span>
          </button>
        </div>
      </div>

      {/* Mobile Swipe / Zoom Helper Banner */}
      <div className="bg-slate-950 px-3 py-1 text-[10px] text-slate-400 border-b border-slate-800 flex items-center justify-between sm:hidden">
        <span>📱 เลื่อนขึ้น-ลง หรือปัดซ้าย-ขวาเพื่อดูเอกสาร A4 เต็มหน้า</span>
        <button
          type="button"
          onClick={() => setZoomLevel((z) => (z === 100 ? 75 : 100))}
          className="text-sky-300 font-semibold px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800"
        >
          {zoomLevel === 100 ? 'ย่อหน้าจอ (75%)' : 'ขนาดเต็ม (100%)'}
        </button>
      </div>

      {/* Scrollable Document Viewer Area */}
      <main className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-6 bg-slate-900/90 touch-pan-x touch-pan-y flex justify-center items-start">
        <div
          id="modal-document-viewer"
          className="w-full max-w-[860px] bg-white rounded-xl shadow-2xl overflow-hidden p-2 sm:p-6 transition-transform duration-150 origin-top my-2 sm:my-4"
          style={{
            transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
            minWidth: typeof window !== 'undefined' && window.innerWidth < 640 ? '680px' : 'auto',
          }}
        >
          {currentDoc === 'photo-evidence' && <PhotoEvidenceDoc job={job} />}
          {currentDoc === 'findings-report' && <FindingsReportDoc job={job} />}
          {currentDoc === 'quotation' && (
            <QuotationDoc
              job={job}
              docType={docSubMode}
              separateTermsPage={separateTermsPage}
              onToggleSeparateTermsPage={onToggleSeparateTermsPage}
              onTriggerMolly={onTriggerMolly}
            />
          )}
        </div>
      </main>

      {/* Bottom Floating Bar */}
      <footer
        className="bg-slate-950 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 shrink-0"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 10px)' }}
      >
        <span className="truncate font-medium text-slate-300">
          📄 คุณภาพไฟล์ A4 มาตรฐานวิศวกรรมพร้อมส่งมอบ • Phuket Trusted Local
        </span>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs active:scale-95"
        >
          เสร็จสิ้น (Done)
        </button>
      </footer>
    </div>
  );
};
