import React from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { InspectionJob } from '../../types';
import { useCustomLogo } from '../../utils/useCustomLogo';

interface QuotationDocProps {
  job: InspectionJob;
  printMode?: boolean;
  docType?: 'quotation' | 'invoice';
  separateTermsPage?: boolean;
  onToggleSeparateTermsPage?: (separate: boolean) => void;
  onTriggerMolly?: () => void;
  onDeleteHardwareItem?: (index: number) => void;
  onDeleteServiceItem?: (index: number) => void;
  onEditHardwareItem?: (index: number) => void;
  onEditServiceItem?: (index: number) => void;
  onOpenQuickEstimate?: () => void;
}

export const QuotationDoc: React.FC<QuotationDocProps> = ({
  job,
  printMode = false,
  docType = 'quotation',
  separateTermsPage,
  onToggleSeparateTermsPage,
  onTriggerMolly,
  onDeleteHardwareItem,
  onDeleteServiceItem,
  onEditHardwareItem,
  onEditServiceItem,
  onOpenQuickEstimate,
}) => {
  const { logoUrl, fallbackLogoUrl } = useCustomLogo();
  const q = job.quotation || {};
  const isInvoice = docType === 'invoice';

  // Toggle for separate page for Terms & Guarantee + Signatures with bi-directional synchronization
  const [internalSeparatePage, setInternalSeparatePage] = React.useState<boolean>(
    separateTermsPage ?? (job.quotation?.termsLayoutVersion === 2 && job.quotation.separateTermsPage === true)
  );

  React.useEffect(() => {
    if (separateTermsPage !== undefined) {
      setInternalSeparatePage(separateTermsPage);
    } else {
      setInternalSeparatePage(job.quotation?.termsLayoutVersion === 2 && job.quotation.separateTermsPage === true);
    }
  }, [separateTermsPage, job.quotation?.separateTermsPage, job.quotation?.termsLayoutVersion]);

  const useSeparateTermsPage = separateTermsPage !== undefined
    ? separateTermsPage
    : internalSeparatePage;

  const handleToggleLayout = (val: boolean) => {
    setInternalSeparatePage(val);
    if (onToggleSeparateTermsPage) {
      onToggleSeparateTermsPage(val);
    }
  };

  const refNumber =
    q.refNo ||
    (job.id ? `PTL-QT-${job.id.replace('job-', '')}` : 'PTL-QT-2026-001');
  const docDate = q.date || job.date || new Date().toISOString().split('T')[0];
  const inspectionRefNumber = q.inspectionRef || job.id || 'INSP-PTL-001';
  const validityText = q.validity || '30 Days / 30 วัน';
  const paymentTermText = q.paymentTerm || '50% Deposit, 50% Upon Completion';

  const defaultServiceItems = [
    {
      item: 1,
      description: 'On-Site Technical Diagnostics & Investigation',
      detail: 'งานช่างเทคนิคลงพื้นที่ตรวจสอบและวิเคราะห์สาเหตุปัญหา (Technical Inspection & Diagnostics)',
      estimatedSchedule: 'Immediate / Completed',
      qty: '1 Job',
      amount: 2500,
    },
  ];

  const displayedServiceItems =
    q.serviceItems && q.serviceItems.length > 0
      ? q.serviceItems
      : (!q.hardwareItems || q.hardwareItems.length === 0)
      ? defaultServiceItems
      : [];

  const hardwareItemsList = q.hardwareItems || [];
  const hardwareSubtotal = hardwareItemsList.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const procurementFeeRate = q.procurementFeeRate ?? 0.15;
  const procurementFee = hardwareSubtotal * procurementFeeRate;
  const servicesSubtotal = displayedServiceItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const grandTotal = hardwareSubtotal + procurementFee + servicesSubtotal;

  const invoiceNumber = q.invoiceNo || refNumber.replace('PTL-QT-', 'PTL-INV-');
  const depositPct =
    q.depositPercent !== undefined
      ? q.depositPercent
      : paymentTermText.toLowerCase().includes('after inspection') ||
        (paymentTermText.toLowerCase().includes('completion') && !paymentTermText.includes('50%'))
      ? 0
      : paymentTermText.toLowerCase().includes('100%') || paymentTermText.toLowerCase().includes('advance')
      ? 100
      : 50;
  const depositAmount = grandTotal * (depositPct / 100);
  const balanceAmount = grandTotal - depositAmount;

  const termsList = Array.isArray(q.terms) && q.terms.length > 0
    ? q.terms
    : [
        'Workmanship Guarantee / การรับประกันงานช่าง: All on-site labor, technical installations, and system configurations are warrantied for 90 days from handover.',
        'Equipment & Parts Warranty / การรับประกันอุปกรณ์: Hardware and replacement items carry original manufacturer warranties (minimum 1 year for new electronic equipment).',
        depositPct === 0
          ? `Payment Terms & Settlement / เงื่อนไขการชำระเงิน: 100% payable upon completion of service / inspection and report delivery (${paymentTermText}).`
          : depositPct === 100
          ? 'Payment Terms & Advance / เงื่อนไขการชำระเงิน: 100% advance payment required prior to technician mobilization.'
          : `Payment Terms & Mobilization / เงื่อนไขการชำระเงิน: ${depositPct}% mobilization deposit upon quote confirmation; remaining ${100 - depositPct}% payable upon final testing and client handover.`,
        'Site Access & Utilities / การเข้าพื้นที่และสาธารณูปโภค: Client or villa management provides safe access, electricity, and water supply during work hours.',
        'Rescheduling Notice / การเลื่อนนัดหมาย: At least 24 hours advance notification is kindly requested for any appointment adjustments.',
      ];

  const contingenciesList = Array.isArray(q.contingencies) && q.contingencies.length > 0
    ? q.contingencies
    : [
        'Concealed Site Conditions / สภาพหน้างานแฝง: Latent structural defects, concealed wiring damages, or piping flaws discovered during disassembly will be photographed and quoted separately before proceeding.',
        'Original Parts Standards / มาตรฐานอะไหล่แท้: All procured equipment is original, tested, and compliant with Thai & international safety standards.',
      ];

  const formatCurrency = (val: number) => {
    return (val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Structured term renderer: bold title with bullet, explanation cleanly indented on a NEW LINE
  const renderStructuredTerm = (term: string, idx: number) => {
    let title = '';
    let detail = term;

    const colonIndex = term.indexOf(':');
    if (colonIndex > 0 && colonIndex <= 60) {
      title = term.substring(0, colonIndex).replace(/^[-*•]\s*/, '').trim();
      detail = term.substring(colonIndex + 1).trim();
    } else {
      const dashIndex = term.indexOf(' - ');
      if (dashIndex > 0 && dashIndex <= 45) {
        title = term.substring(0, dashIndex).replace(/^[-*•]\s*/, '').trim();
        detail = term.substring(dashIndex + 3).trim();
      } else {
        title = `Condition / ข้อกำหนด ${idx + 1}`;
      }
    }

    return (
      <div key={idx} className="mb-2 last:mb-0">
        <div className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5 mb-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0f294a] shrink-0" />
          <span>{title}</span>
        </div>
        <div className="text-slate-600 text-[10.5px] leading-relaxed pl-3 border-l-2 border-slate-200 ml-0.5">
          {detail}
        </div>
      </div>
    );
  };

  return (
    <div id={isInvoice ? 'invoice-doc' : 'quotation-doc'} className="w-full">
      {/* Layout Mode Selector (Interactive only, hidden in print and PDF) */}
      <div
        data-no-print="true"
        className="mb-4 p-2 sm:p-2.5 bg-slate-100 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
      >
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="font-bold">📄 การจัดหน้าเอกสาร (Page Layout):</span>
          <span className="text-[11px] text-slate-500">
            {useSeparateTermsPage ? 'แยกเงื่อนไขและลายเซ็นขึ้นหน้าใหม่' : 'เงื่อนไขและการรับประกันต่อใต้สรุปราคา'}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-slate-300 shadow-2xs">
          <button
            type="button"
            onClick={() => handleToggleLayout(false)}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
              !useSeparateTermsPage
                ? 'bg-[#102a4e] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ต่อใต้สรุปราคา
          </button>
          <button
            type="button"
            onClick={() => handleToggleLayout(true)}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
              useSeparateTermsPage
                ? 'bg-[#102a4e] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📑 แยกหน้าเงื่อนไข
          </button>
        </div>
      </div>

      <div
        data-pdf-page="1"
        id={isInvoice ? 'invoice-page-1' : 'quotation-page-1'}
        className={`bg-white text-slate-900 mx-auto font-sans ${
          printMode ? 'w-full p-0 shadow-none' : 'w-full max-w-4xl p-4 sm:p-8 md:p-10 shadow-lg border border-slate-200 rounded-xl'
        }`}
        style={{
          minHeight: useSeparateTermsPage ? '1060px' : 'auto',
          display: useSeparateTermsPage ? 'flex' : 'block',
          flexDirection: 'column',
          justifyContent: useSeparateTermsPage ? 'space-between' : 'flex-start'
        }}
      >
      {/* Header */}
      <div
        style={{ borderBottom: '2px solid #0f294a', paddingBottom: '16px', marginBottom: '20px' }}
        className={`flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-5 gap-3 ${
          printMode ? 'flex-row' : 'flex-col sm:flex-row'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <img
            src={logoUrl || fallbackLogoUrl}
            onError={(e) => {
              if (e.currentTarget.src !== fallbackLogoUrl) {
                e.currentTarget.src = fallbackLogoUrl;
              }
            }}
            alt="PTL Logo"
            width={56}
            height={56}
            style={{ width: '56px', height: '56px', maxWidth: '56px', maxHeight: '56px', objectFit: 'contain' }}
            className="w-14 h-14 max-w-[56px] max-h-[56px] rounded-xl border border-slate-300 object-contain p-0.5 bg-slate-50 shrink-0"
          />
          <div>
            <h1 style={{ color: '#0f294a', fontWeight: 900, letterSpacing: 'normal' }} className="text-lg sm:text-2xl font-black text-[#0f294a]">
              PHUKET TRUSTED LOCAL
            </h1>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-700">
              Villa Inspection, Property Care &amp; On-Ground Representation
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500">
              Phuket, Thailand • info@phukettrustedlocal.com • Comprehensive Villa Audits &amp; Maintenance
            </p>
          </div>
        </div>
        <div
          style={{
            backgroundColor: isInvoice ? '#064e3b' : '#0f294a',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '8px 24px',
            textAlign: 'center',
            fontWeight: 800,
            letterSpacing: 'normal',
            flexShrink: 0
          }}
          className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-center font-bold text-sm sm:text-base shadow-xs text-white shrink-0 ${
            isInvoice ? 'bg-emerald-900' : 'bg-[#0f294a]'
          }`}
        >
          {isInvoice ? 'TAX INVOICE / BILLING' : 'OFFICIAL QUOTATION'}
        </div>
      </div>

      {/* Info Boxes (Guaranteed 2 columns for clean A4 print) */}
      <div
        className="grid grid-cols-2 gap-3 sm:gap-4 text-xs mb-5"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '20px' }}
      >
        {/* Customer Info */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxSizing: 'border-box'
          }}
          className="bg-slate-50 p-3.5 sm:p-4 rounded-lg border border-slate-200"
        >
          <div
            style={{
              color: '#0f294a',
              fontWeight: 700,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: 'normal',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '4px',
              marginBottom: '8px'
            }}
            className="font-bold text-[#0f294a] uppercase text-[11px] mb-2 border-b border-slate-200 pb-1"
          >
            CLIENT &amp; PROPERTY DETAILS / ข้อมูลลูกค้าและสถานที่
          </div>
          <div className="space-y-1.5 text-slate-800">
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 shrink-0">Client Name:</span>
              <span className="font-semibold text-slate-900 text-right truncate">{job.customerName || 'Valued Client'}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 shrink-0">Property / Villa:</span>
              <span className="font-medium text-slate-800 text-right truncate">{job.villaName || job.propertyLocation || 'Phuket Villa'}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 shrink-0">Scope of Work:</span>
              <span className="font-medium text-slate-800 text-right truncate">{job.serviceType || 'Field Technical Inspection & Rectification'}</span>
            </div>
            {job.driveFolderUrl && (
              <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-blue-700 font-medium">
                <span className="text-slate-500 shrink-0">Cloud Evidence:</span>
                <a
                  href={job.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:underline flex items-center gap-1 text-right"
                >
                  <span>📁 Google Drive Digital Folder</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Service Provider Info */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxSizing: 'border-box'
          }}
          className="bg-slate-50 p-3.5 sm:p-4 rounded-lg border border-slate-200"
        >
          <div
            style={{
              color: '#0f294a',
              fontWeight: 700,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: 'normal',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '4px',
              marginBottom: '8px'
            }}
            className="font-bold text-[#0f294a] uppercase text-[11px] mb-2 border-b border-slate-200 pb-1"
          >
            {isInvoice ? 'INVOICE SPECIFICATIONS / ข้อมูลใบแจ้งหนี้' : 'DOCUMENT SPECIFICATIONS / ข้อมูลใบเสนอราคา'}
          </div>
          <div className="space-y-1.5 text-slate-800">
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500 shrink-0">{isInvoice ? 'Invoice Ref:' : 'Quotation Ref:'}</span>
              <span className="font-mono font-bold text-slate-900 text-right">
                {isInvoice ? invoiceNumber : refNumber}
              </span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500 shrink-0">{isInvoice ? 'Invoice Date:' : 'Issue Date:'}</span>
              <span className="font-medium text-right">{q.invoiceDate || docDate}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500 shrink-0">Audit Reference:</span>
              <span className="font-mono text-right">{inspectionRefNumber}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500 shrink-0">{isInvoice ? 'Payment Due:' : 'Validity:'}</span>
              <span className="font-semibold text-emerald-800 text-right">
                {isInvoice ? (q.dueDate || 'Upon Completion / Within 7 Days') : validityText}
              </span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500 shrink-0">Payment Terms:</span>
              <span className="font-medium text-blue-700 text-right">{paymentTermText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Molly Helper Callout if hardware is empty (Interactive only, NEVER printed) */}
      {!printMode && hardwareItemsList.length === 0 && onTriggerMolly && (
        <div data-no-print="true" className="mb-5 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-xs">
              ⚡
            </div>
            <div>
              <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <span>ยังไม่มีรายการจัดซื้ออุปกรณ์ในใบเสนอราคานี้</span>
                <span className="text-[10px] bg-blue-200/80 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                  Auto Sourcing
                </span>
              </div>
              <p className="text-[11px] text-blue-800 mt-0.5">
                ดึงรายการอุปกรณ์และอะไหล่มาตรฐานภูเก็ต พร้อมคำนวณค่าจัดหาและค่าแรงอัตโนมัติ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onTriggerMolly}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#102a4e] hover:bg-blue-900 text-white font-bold rounded-lg text-xs transition-colors shrink-0 shadow-xs cursor-pointer active:scale-95"
          >
            <span>⚡ คำนวณรายการอุปกรณ์อัตโนมัติ</span>
          </button>
        </div>
      )}

      {/* Section 1: Hardware & Equipment Supply */}
      <div className="mb-5" style={{ marginBottom: '20px' }}>
        <div
          style={{
            backgroundColor: '#0f294a',
            color: '#ffffff',
            padding: '8px 14px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          className="flex items-center justify-between bg-[#0f294a] text-white px-3 py-2 text-xs font-bold rounded-t-lg"
        >
          <div className="flex items-center gap-2">
            <span>1. HARDWARE &amp; MATERIALS SUPPLY / รายการอุปกรณ์และอะไหล่</span>
            <span className="text-[10px] text-blue-200 font-normal hidden sm:inline">
              Original Equipment • Quality Assured
            </span>
          </div>
          {!printMode && onOpenQuickEstimate && (
            <button
              type="button"
              onClick={onOpenQuickEstimate}
              data-no-print="true"
              className="text-[10px] bg-blue-900/80 hover:bg-blue-800 text-blue-100 font-bold px-2 py-0.5 rounded border border-blue-400/40 transition-colors"
            >
              + จัดการ/เพิ่มรายการ
            </button>
          )}
        </div>
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderTop: 'none',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            overflow: 'hidden'
          }}
          className="border border-slate-200 border-t-0 rounded-b-lg overflow-x-auto"
        >
          <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse', tableLayout: 'fixed' }} className="w-full text-xs text-left min-w-[560px]">
            <thead>
              <tr
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  fontWeight: 600,
                  borderBottom: '1px solid #e2e8f0'
                }}
                className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200"
              >
                <th style={{ width: '6%', textAlign: 'center', padding: '8px 6px' }}>#</th>
                <th style={{ width: '46%', textAlign: 'left', padding: '8px 10px' }}>Item Description &amp; Specifications / รายละเอียดอุปกรณ์</th>
                <th style={{ width: '8%', textAlign: 'center', padding: '8px 6px' }}>Qty</th>
                <th style={{ width: '10%', textAlign: 'center', padding: '8px 6px' }}>Unit</th>
                <th style={{ width: '15%', textAlign: 'right', padding: '8px 10px' }}>Unit Price (THB)</th>
                <th style={{ width: '15%', textAlign: 'right', padding: '8px 10px' }}>Amount (THB)</th>
                {!printMode && (onDeleteHardwareItem || onEditHardwareItem) && (
                  <th style={{ width: '10%', textAlign: 'center', padding: '8px 6px' }} data-no-print="true">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {hardwareItemsList.length > 0 ? (
                hardwareItemsList.map((item, idx) => (
                  <tr key={`hw-${item.item}-${idx}`} className="hover:bg-slate-50/50">
                    <td style={{ textAlign: 'center', padding: '8px 6px', color: '#64748b' }}>{item.item}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <div className="font-bold text-slate-900">{item.descriptionEn}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.descriptionTh}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 6px' }} className="font-medium">{item.qty}</td>
                    <td style={{ textAlign: 'center', padding: '8px 6px', color: '#475569' }}>{item.unit}</td>
                    <td style={{ textAlign: 'right', padding: '8px 10px' }} className="font-mono">{formatCurrency(item.unitPrice)}</td>
                    <td style={{ textAlign: 'right', padding: '8px 10px' }} className="font-mono font-bold text-slate-900">
                      {formatCurrency(item.amount)}
                    </td>
                    {!printMode && (onDeleteHardwareItem || onEditHardwareItem) && (
                      <td style={{ textAlign: 'center', padding: '8px 6px' }} data-no-print="true">
                        <div className="flex items-center justify-center gap-1">
                          {onEditHardwareItem && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditHardwareItem(idx);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title={`แก้ไขรายการ ${item.descriptionEn}`}
                              aria-label={`แก้ไขรายการ ${item.descriptionEn}`}
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                          )}
                          {onDeleteHardwareItem && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteHardwareItem(idx);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title={`ลบรายการ ${item.descriptionEn} ออก`}
                              aria-label={`ลบรายการ ${item.descriptionEn}`}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={!printMode && (onDeleteHardwareItem || onEditHardwareItem) ? 7 : 6} className="py-5 px-4 text-center bg-slate-50/50">
                    <div className="max-w-md mx-auto py-1">
                      <p className="text-slate-600 text-xs font-medium">
                        — No additional equipment or hardware required for this quote (Labor &amp; On-Site Services Only) —
                      </p>
                      <p className="text-slate-400 text-[10.5px] mt-0.5">
                        — ไม่มีรายการอุปกรณ์เพิ่มเติม (คิดเฉพาะค่าบริการช่างเทคนิคและงานแก้ไขระบบหน้างาน) —
                      </p>
                      {!printMode && onTriggerMolly && (
                        <button
                          type="button"
                          data-no-print="true"
                          onClick={onTriggerMolly}
                          className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                        >
                          <span>⚡ คำนวณและดึงรายการอุปกรณ์มาตรฐานอัตโนมัติ</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: On-Site Technical Services */}
      <div className="mb-5" style={{ marginBottom: '20px' }}>
        <div
          style={{
            backgroundColor: '#0f294a',
            color: '#ffffff',
            padding: '8px 14px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          className="flex items-center justify-between bg-[#0f294a] text-white px-3 py-2 text-xs font-bold rounded-t-lg"
        >
          <div className="flex items-center gap-2">
            <span>2. ON-SITE TECHNICAL SERVICES &amp; LABOR / ค่าบริการช่างเทคนิคและงานแก้ไขระบบ</span>
            <span className="text-[10px] text-blue-200 font-normal hidden sm:inline">
              PTL Workmanship Guarantee
            </span>
          </div>
          {!printMode && onOpenQuickEstimate && (
            <button
              type="button"
              onClick={onOpenQuickEstimate}
              data-no-print="true"
              className="text-[10px] bg-blue-900/80 hover:bg-blue-800 text-blue-100 font-bold px-2 py-0.5 rounded border border-blue-400/40 transition-colors"
            >
              + จัดการ/เพิ่มรายการ
            </button>
          )}
        </div>
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderTop: 'none',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            overflow: 'hidden'
          }}
          className="border border-slate-200 border-t-0 rounded-b-lg overflow-x-auto"
        >
          <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse', tableLayout: 'fixed' }} className="w-full text-xs text-left min-w-[560px]">
            <thead>
              <tr
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  fontWeight: 600,
                  borderBottom: '1px solid #e2e8f0'
                }}
                className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200"
              >
                <th style={{ width: '6%', textAlign: 'center', padding: '8px 6px' }}>#</th>
                <th style={{ width: '56%', textAlign: 'left', padding: '8px 10px' }}>Service Scope &amp; Technical Description / รายละเอียดงานบริการ</th>
                <th style={{ width: '18%', textAlign: 'center', padding: '8px 6px' }}>Qty / Unit</th>
                <th style={{ width: '20%', textAlign: 'right', padding: '8px 10px' }}>Total Amount (THB)</th>
                {!printMode && (onDeleteServiceItem || onEditServiceItem) && (
                  <th style={{ width: '10%', textAlign: 'center', padding: '8px 6px' }} data-no-print="true">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedServiceItems.map((item, idx) => (
                <tr key={`service-${item.item}-${idx}`} className="hover:bg-slate-50/50">
                  <td style={{ textAlign: 'center', padding: '8px 6px', color: '#64748b' }}>{item.item}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <div className="font-bold text-slate-900">{item.description}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{item.detail}</div>
                    {item.estimatedSchedule && (
                      <div className="text-[10px] text-blue-700 font-medium mt-1 flex items-center gap-1">
                        <span>📅 Schedule:</span>
                        <span>{item.estimatedSchedule}</span>
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px 6px', color: '#475569' }} className="font-medium">{item.qty}</td>
                  <td style={{ textAlign: 'right', padding: '8px 10px' }} className="font-mono font-bold text-slate-900">
                    {formatCurrency(item.amount)}
                  </td>
                  {!printMode && (onDeleteServiceItem || onEditServiceItem) && (
                    <td className="py-2.5 px-2 text-center" data-no-print="true">
                      <div className="flex items-center justify-center gap-1">
                        {onEditServiceItem && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditServiceItem(idx);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title={`แก้ไขรายการ ${item.description}`}
                            aria-label={`แก้ไขรายการ ${item.description}`}
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                        )}
                        {onDeleteServiceItem && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteServiceItem(idx);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title={`ลบรายการ ${item.description} ออก`}
                            aria-label={`ลบรายการ ${item.description}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Summary Box */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          boxSizing: 'border-box'
        }}
        className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 sm:p-4 mb-5"
      >
        <div
          style={{
            color: '#0f294a',
            fontWeight: 700,
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: 'normal',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '4px',
            marginBottom: '8px'
          }}
          className="text-xs font-bold text-[#0f294a] uppercase mb-2 border-b border-slate-200 pb-1"
        >
          {isInvoice ? 'FINANCIAL SUMMARY & BREAKDOWN / สรุปยอดเรียกเก็บเงิน' : 'FINANCIAL SUMMARY & BREAKDOWN / สรุปมูลค่าใบเสนอราคา'}
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-700">
            <span>1. Hardware &amp; Materials Subtotal (รวมค่าอุปกรณ์และอะไหล่)</span>
            <span className="font-mono font-semibold">{formatCurrency(hardwareSubtotal)} THB</span>
          </div>
          {procurementFee > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>
                2. Sourcing, Quality Inspection &amp; Logistics {Math.round(procurementFeeRate * 100)}% (ค่าจัดหาและตรวจรับอุปกรณ์)
              </span>
              <span className="font-mono font-semibold">{formatCurrency(procurementFee)} THB</span>
            </div>
          )}
          <div className="flex justify-between text-slate-700">
            <span>
              {procurementFee > 0 ? '3.' : '2.'} On-Site Technical Services &amp; Engineering Labor (รวมค่าบริการช่างเทคนิคและงานระบบ)
            </span>
            <span className="font-mono font-semibold">{formatCurrency(servicesSubtotal)} THB</span>
          </div>
          <div
            style={{
              backgroundColor: isInvoice ? '#064e3b' : '#0f294a',
              color: '#ffffff',
              padding: '12px 16px',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '10px'
            }}
            className="flex justify-between items-center p-3 rounded-lg text-white"
          >
            <span style={{ fontWeight: 700, fontSize: '12px', letterSpacing: 'normal' }}>
              {isInvoice ? 'TOTAL AMOUNT DUE (THB) / ยอดเรียกเก็บสุทธิทั้งสิ้น:' : 'TOTAL AMOUNT DUE (THB) / ยอดรวมสุทธิทั้งสิ้น:'}
            </span>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 900,
                fontSize: '18px',
                letterSpacing: 'normal'
              }}
            >
              {formatCurrency(grandTotal)} THB
            </span>
          </div>

          <div className="mt-2.5 pt-2 text-[11px] text-slate-600 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-800">Deposit Schedule / เงื่อนไขการชำระ: </span>
              <span>
                {depositPct === 0
                  ? `Pay After Inspection / Upon Completion (${formatCurrency(grandTotal)} THB)`
                  : depositPct === 100
                  ? `100% Advance Payment (${formatCurrency(grandTotal)} THB)`
                  : `${depositPct}% Mobilization Deposit (${formatCurrency(depositAmount)} THB) • ${100 - depositPct}% Handover Balance (${formatCurrency(balanceAmount)} THB)`}
              </span>
            </div>
            <div className="text-slate-500">
              Currency: Thai Baht (THB)
            </div>
          </div>

          {isInvoice && (
            <div className="mt-3 pt-3 border-t border-emerald-200/80 bg-emerald-50/60 -mx-3.5 sm:-mx-4 -mb-3.5 sm:-mb-4 p-3.5 sm:p-4 rounded-b-lg">
              <div className="text-xs font-bold text-emerald-900 mb-1.5">
                💳 แบ่งงวดการชำระเงินตามข้อตกลง (Payment Schedule):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-300 shadow-2xs">
                  <div className="text-slate-500 text-[11px]">งวดที่ 1: มัดจำก่อนเข้าปฏิบัติงาน ({depositPct}%)</div>
                  <div className="text-sm font-black text-emerald-800 font-mono">
                    {formatCurrency(depositAmount)} THB
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">● ชำระทันทีก่อนเริ่มงานสั่งอุปกรณ์</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-slate-500 text-[11px]">งวดที่ 2: ชำระเมื่อส่งมอบงาน ({100 - depositPct}%)</div>
                  <div className="text-sm font-bold text-slate-800 font-mono">
                    {formatCurrency(balanceAmount)} THB
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">● ชำระหลังทดสอบระบบสมบูรณ์</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Bank Details for Invoice */}
      {isInvoice && (
        <div className="mb-5 bg-gradient-to-br from-slate-50 to-blue-50/50 border border-blue-200 rounded-lg p-3.5 sm:p-4 text-xs">
          <div className="font-bold text-[#102a4e] uppercase tracking-wider text-[11px] mb-2 border-b border-blue-200 pb-1 flex items-center justify-between">
            <span>BANK TRANSFER INSTRUCTIONS / ช่องทางการโอนชำระเงิน</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
              Verified Business Account
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-slate-700">
              <div className="flex">
                <span className="w-28 text-slate-500">ธนาคาร (Bank):</span>
                <span className="font-bold text-slate-900">ธนาคารกสิกรไทย (Kasikornbank - KBANK)</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500">เลขที่บัญชี (Acc No):</span>
                <span className="font-mono font-black text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-300">
                  148-2-94821-0
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500">ชื่อบัญชี (Name):</span>
                <span className="font-semibold text-slate-900">บจก. ภูเก็ต ทรัสตี้ โลคอล (Phuket Trusted Local Co., Ltd.)</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500">สาขา (Branch):</span>
                <span>สาขาฉลอง ภูเก็ต (Chalong, Phuket)</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">PromptPay / QR พร้อมเพย์:</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  098-XXX-XXXX
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                สำหรับเจ้าของวิลล่าชาวต่างชาติ (Overseas Villa Owners):
              </div>
              <div className="text-[10px] font-mono text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200">
                SWIFT: KASITHBK • Accepts Wise &amp; International Wire Transfer
              </div>
              <p className="text-[10px] text-emerald-700 font-medium pt-1">
                ✓ หลังโอนเงิน กรุณาส่งสลิปยืนยันทาง WhatsApp หรือ LINE เพื่อออกใบเสร็จรับเงิน
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer and Terms based on Mode */}
      {useSeparateTermsPage ? (
        <>
          {/* Notice to view Page 2 for Terms & Signatures */}
          <div className="mt-4 p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
            <span className="font-semibold">
              📑 เงื่อนไขและการรับประกัน (Terms &amp; Guarantee) รวมถึงลายเซ็นลงนาม ระบุไว้ในหน้าถัดไป (Page 2)
            </span>
            <span className="text-[10px] bg-blue-200 text-blue-950 font-bold px-2.5 py-1 rounded">
              หน้า 1 จาก 2
            </span>
          </div>

          {/* Page 1 Footer */}
          <div className="mt-auto pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
            <span>{isInvoice ? 'PHUKET TRUSTED LOCAL • Official Invoice / Billing' : 'PHUKET TRUSTED LOCAL • Official Quotation'}</span>
            <span>Page 1 of 2</span>
          </div>
        </>
      ) : (
        /* Inline terms flow after the totals; longer quotations can continue on another PDF page. */
        <>
          {/* Terms & Contingency (Guaranteed 2 columns side-by-side with structured titles) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '12px',
              marginBottom: '16px',
              fontSize: '11px',
              boxSizing: 'border-box'
            }}
            className="grid grid-cols-2 gap-3 text-[11px] text-slate-600 mb-4"
          >
            <div className="border border-slate-200 rounded-lg p-2.5 bg-white shadow-2xs">
              <div className="font-bold text-slate-900 mb-1 border-b border-slate-200 pb-1 text-[11px]">
                {isInvoice ? 'Terms & Guarantee / ข้อกำหนดและเงื่อนไข:' : 'Terms of Service & Guarantee / เงื่อนไขและการรับประกัน:'}
              </div>
              <div className="space-y-0.5 pt-0.5">
                {termsList.map((t, idx) => renderStructuredTerm(t, idx))}
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg p-2.5 bg-white shadow-2xs">
              <div className="font-bold text-slate-900 mb-1 border-b border-slate-200 pb-1 text-[11px]">
                {isInvoice ? 'Payment & Handover Notes / บันทึกการส่งมอบงาน:' : 'Site Contingencies & Boundaries / ข้อกำหนดสภาพหน้างาน:'}
              </div>
              <div className="space-y-0.5 pt-0.5">
                {isInvoice ? (
                  <>
                    <div className="text-slate-600 text-[10.5px] leading-relaxed py-0.5 flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                      <span>This document serves as the official billing record for the authorized scope of work and materials.</span>
                    </div>
                    <div className="text-slate-600 text-[10.5px] leading-relaxed py-0.5 flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                      <span>An official tax receipt will be issued immediately upon settlement of the total invoice balance.</span>
                    </div>
                  </>
                ) : (
                  contingenciesList.map((c, idx) => renderStructuredTerm(c, idx))
                )}
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 pt-4 border-t border-slate-200 text-xs text-center">
            <div className="space-y-4 sm:space-y-6">
              <div className="border-b border-dashed border-slate-400 pb-4">
                <span className="font-bold text-slate-800 block">PHUKET TRUSTED LOCAL CO., LTD.</span>
                <span className="text-slate-500 text-[10px]">
                  {isInvoice ? 'Authorized Representative / Account Manager' : 'Technical Director / Project Engineer'}
                </span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Date: ____ / ____ / ________
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="border-b border-dashed border-slate-400 pb-4">
                <span className="font-bold text-slate-800 block">({job.customerName || 'Authorized Client'})</span>
                <span className="text-slate-500 text-[10px]">
                  {isInvoice ? 'Client / Villa Representative' : 'Client Acceptance / Villa Owner'}
                </span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Date: ____ / ____ / ________
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
            <span>{isInvoice ? 'PHUKET TRUSTED LOCAL • Official Invoice / Billing' : 'PHUKET TRUSTED LOCAL • Official Quotation'}</span>
            <span>{refNumber}</span>
          </div>
        </>
      )}
      </div>

      {/* PAGE 2: Terms, Contingency & Signatures (Dedicated page) */}
      {useSeparateTermsPage && (
        <div
          data-pdf-page="2"
          id={isInvoice ? 'invoice-page-2' : 'quotation-page-2'}
          className={`bg-white text-slate-900 mx-auto font-sans ${
            printMode ? 'w-full p-0 shadow-none' : 'w-full max-w-4xl p-4 sm:p-8 md:p-10 shadow-lg border border-slate-200 rounded-xl mt-6'
          }`}
          style={{
            minHeight: '1060px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          <div>
            {/* Page 2 Header Banner */}
            <div
              style={{
                backgroundColor: '#0f294a',
                color: '#ffffff',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              className="bg-[#0f294a] text-white p-3.5 sm:p-4 rounded-lg mb-5 flex justify-between items-center"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm tracking-normal">
                  PHUKET TRUSTED LOCAL • {isInvoice ? 'TERMS & BILLING CONDITIONS' : 'TERMS OF SERVICE, WARRANTIES & AUTHORIZATION'}
                </span>
              </div>
              <div className="text-right text-[11px] text-sky-200 font-mono">
                Ref: {refNumber} • {docDate}
              </div>
            </div>

            {/* Reference Info Card */}
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between text-slate-700">
              <div>
                <span className="text-slate-500">Client / Project: </span>
                <span className="font-bold text-slate-900">{job.customerName || 'Valued Client'}</span>
                <span className="text-slate-400 mx-2">|</span>
                <span className="text-slate-500">Location: </span>
                <span className="font-medium text-slate-800">{job.villaName || job.propertyLocation || 'Phuket Villa'}</span>
              </div>
              <div>
                <span className="text-slate-500">Proposal Validity: </span>
                <span className="font-semibold text-emerald-800">{validityText}</span>
              </div>
            </div>

            {/* Terms & Guarantee Section (Structured with bold title & detail on new line) */}
            <div className="border border-slate-200 rounded-lg p-4 bg-white mb-4 shadow-2xs">
              <div className="font-bold text-slate-900 text-xs mb-2 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <span className="text-[#0f294a] font-bold uppercase tracking-normal">
                  {isInvoice ? 'INVOICE TERMS & CONDITIONS / ข้อกำหนดและเงื่อนไขการเรียกเก็บเงิน:' : 'TERMS OF SERVICE & QUALITY GUARANTEE / เงื่อนไขและการรับประกันงาน:'}
                </span>
                <span className="text-[10px] text-blue-900 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  PTL Engineering Standards
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                {termsList.map((t, idx) => renderStructuredTerm(t, idx))}
              </div>
            </div>

            {/* Optional Contingency Section */}
            <div className="border border-slate-200 rounded-lg p-4 bg-white mb-5 shadow-2xs">
              <div className="font-bold text-[#0f294a] text-xs mb-2 border-b border-slate-200 pb-1.5 uppercase tracking-normal">
                {isInvoice ? 'PAYMENT & HANDOVER NOTES / บันทึกการส่งมอบงาน:' : 'SITE CONTINGENCIES & SCOPE BOUNDARIES / ข้อกำหนดสภาพหน้างาน:'}
              </div>
              <div className="space-y-1.5 pt-1">
                {isInvoice ? (
                  <>
                    <div className="text-slate-600 text-[10.5px] leading-relaxed py-0.5 flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                      <span>This document serves as the official billing record for the authorized scope of work and materials.</span>
                    </div>
                    <div className="text-slate-600 text-[10.5px] leading-relaxed py-0.5 flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                      <span>An official tax receipt will be issued immediately upon settlement of the total invoice balance.</span>
                    </div>
                  </>
                ) : (
                  contingenciesList.map((c, idx) => renderStructuredTerm(c, idx))
                )}
              </div>
            </div>

            {/* Signatures on Page 2 */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-normal text-center">
                CLIENT ACCEPTANCE &amp; SERVICE AUTHORIZATION / การอนุมัติและลงนามข้อตกลง
              </div>
              <div className="grid grid-cols-2 gap-6 sm:gap-8 pt-2 text-xs text-center">
                <div className="space-y-6 sm:space-y-8">
                  <div className="border-b border-dashed border-slate-400 pb-5">
                    <span className="font-bold text-slate-800 block">PHUKET TRUSTED LOCAL CO., LTD.</span>
                    <span className="text-slate-500 text-[10px]">
                      {isInvoice ? 'Authorized Representative / Account Manager' : 'Technical Director / Project Engineer'}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Date: ____ / ____ / ________
                  </div>
                </div>

                <div className="space-y-6 sm:space-y-8">
                  <div className="border-b border-dashed border-slate-400 pb-5">
                    <span className="font-bold text-slate-800 block">({job.customerName || 'Authorized Client'})</span>
                    <span className="text-slate-500 text-[10px]">
                      {isInvoice ? 'Client / Villa Representative' : 'Client Acceptance / Villa Owner'}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Date: ____ / ____ / ________
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page 2 Footer */}
          <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
            <span>{isInvoice ? 'PHUKET TRUSTED LOCAL • Official Invoice / Billing' : 'PHUKET TRUSTED LOCAL • Official Quotation'}</span>
            <span>Page 2 of 2</span>
          </div>
        </div>
      )}
    </div>
  );
};
