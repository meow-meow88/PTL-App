import React, { useState } from 'react';
import type { Customer, Invoice, Payment } from '../types';
import { safeGetLocalStorage, safeSetLocalStorage } from '../utils/storage';
import { Copy, Check, Printer, X, FileText, CheckCircle2, User, Calendar, Save, Edit3 } from 'lucide-react';

interface Props {
  payment: Payment;
  invoice?: Invoice;
  customer?: Customer;
  onClose: () => void;
  onUpdatePayment?: (updatedPayment: Payment) => void;
}

// Helper to filter out internal Molly prompt / instruction notes from customer-facing receipt
const isInternalMollyNote = (text?: string): boolean => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return lower.includes('molly express') || lower.includes('molly:') || lower.startsWith('molly ');
};

const cleanCustomerNotes = (rawNotes?: string): string => {
  if (!rawNotes) return '';
  if (isInternalMollyNote(rawNotes)) return '';
  return rawNotes.trim();
};

export const PaymentReceiptModal: React.FC<Props> = ({
  payment,
  invoice,
  customer,
  onClose,
  onUpdatePayment,
}) => {
  // Customer details - user can freely edit to override demo/incorrect names
  const [customerName, setCustomerName] = useState(() =>
    payment.customerName ||
    customer?.fullName ||
    customer?.name ||
    customer?.preferredName ||
    (payment.customerId && !payment.customerId.startsWith('CUST-') ? payment.customerId : '') ||
    'คุณลูกค้า / Client'
  );
  const [customerPhone, setCustomerPhone] = useState(() =>
    payment.customerPhone || customer?.phone || ''
  );
  const [customerAddress, setCustomerAddress] = useState(() =>
    payment.customerAddress || customer?.address || ''
  );

  // Receipt & payment metadata
  const [dateReceived, setDateReceived] = useState(() => payment.date || new Date().toISOString().slice(0, 10));
  const [receiptNumber, setReceiptNumber] = useState(() => payment.receiptNumber || payment.id);
  const [reference, setReference] = useState(() => payment.reference || '');
  // Filter out any internal Molly notes so customer never sees Molly's internal analysis/prompt
  const [notes, setNotes] = useState(() => cleanCustomerNotes(payment.notes));

  // Issuer details (Tax ID removed per user requirement as company is not registered yet)
  const [issuerName, setIssuerName] = useState(() => safeGetLocalStorage('ptl_receipt_issuer_name') || 'Phuket Trusted Local');
  const [issuerAddress, setIssuerAddress] = useState(() => safeGetLocalStorage('ptl_receipt_issuer_address') || 'Rawai, Phuket 83130, Thailand');

  // UI state
  const [isEditingMeta, setIsEditingMeta] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    safeSetLocalStorage('ptl_receipt_issuer_name', issuerName.trim() || 'Phuket Trusted Local');
    safeSetLocalStorage('ptl_receipt_issuer_address', issuerAddress.trim() || 'Rawai, Phuket 83130, Thailand');

    const updatedPayment: Payment = {
      ...payment,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      date: dateReceived,
      receiptNumber: receiptNumber.trim(),
      reference: reference.trim(),
      notes: cleanCustomerNotes(notes),
    };

    if (onUpdatePayment) {
      onUpdatePayment(updatedPayment);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handlePrint = () => {
    handleSave();
    window.print();
  };

  const handleCopyLineSummary = () => {
    const lines = payment.allocations?.length
      ? payment.allocations.map((a, i) => `${i + 1}. ${a.description}: ฿${a.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`).join('\n')
      : `• ${invoice?.items.map((i) => i.description).join(', ') || 'Payment for Technical Services'}: ฿${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    const displayNote = cleanCustomerNotes(notes);

    const text = `🧾 ใบเสร็จรับเงิน / Payment Receipt: ${receiptNumber}
วันที่: ${dateReceived}
ลูกค้า: ${customerName} ${customerPhone ? `(${customerPhone})` : ''}
------------------------------------
${lines}
------------------------------------
💰 ยอดรับชำระทั้งสิ้น: ฿${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
วิธีชำระ: ${payment.paymentMethod} ${reference ? `(อ้างอิง: ${reference})` : ''}${displayNote ? `\nหมายเหตุ: ${displayNote}` : ''}

Phuket Trusted Local ขอขอบพระคุณเป็นอย่างยิ่งค่ะ 🙏`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const visibleNote = cleanCustomerNotes(notes);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-xs flex justify-center overflow-y-auto p-2 sm:p-4">
      <style>{`@media print { body * { visibility: hidden !important; } #ptl-payment-receipt, #ptl-payment-receipt * { visibility: visible !important; } #ptl-payment-receipt { position: absolute !important; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; } .receipt-controls { display: none !important; } }`}</style>
      <div className="bg-white max-w-2xl w-full my-auto rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-2xl space-y-4">
        {/* Controls Bar */}
        <div className="receipt-controls bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">ใบเสร็จรับเงิน / Official Receipt</h3>
                <p className="text-[11px] text-slate-500">
                  เลขที่: <span className="font-mono font-bold text-slate-700">{receiptNumber}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditingMeta(!isEditingMeta)}
                className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>{isEditingMeta ? 'ซ่อนฟอร์มแก้ไข' : '✏️ แก้ไขข้อมูลลูกค้า'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Editable Details Form */}
          {isEditingMeta && (
            <div className="space-y-3 pt-1">
              {/* Customer Info Card */}
              <div className="bg-white p-3 rounded-xl border border-blue-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>ข้อมูลลูกค้า / ผู้ชำระเงิน (แก้ไขได้อิสระ)</span>
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                    💡 แก้ไขชื่อที่นี่หากชื่อเดิมไม่ถูกต้อง
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    ชื่อลูกค้า / Customer Name *
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="เช่น คุณสมชาย, Mazen, Villa 5 Owner"
                      className="w-full mt-1 p-2 text-xs border border-blue-300 rounded-lg bg-blue-50/20 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </label>

                  <label className="text-[11px] font-bold text-slate-700 block">
                    เบอร์โทรศัพท์ / LINE / ข้อมูลติดต่อ
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="เช่น 081-234-5678, Line: @client"
                      className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </label>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      วิลล่า / สถานที่ / ที่อยู่ลูกค้า
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="เช่น Green Mile Villa, Kathu"
                        className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Receipt & Payment Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="text-[11px] font-bold text-slate-600 block">
                  วันที่รับเงิน / Date
                  <input
                    type="date"
                    value={dateReceived}
                    onChange={(e) => setDateReceived(e.target.value)}
                    className="w-full mt-1 p-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </label>
                <label className="text-[11px] font-bold text-slate-600 block">
                  เลขที่ใบเสร็จ / Receipt No.
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    className="w-full mt-1 p-1.5 text-xs border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-blue-500"
                  />
                </label>
                <label className="text-[11px] font-bold text-slate-600 block">
                  เลขอ้างอิง / Ref
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="เช่น สลิปโอน, เช็ค"
                    className="w-full mt-1 p-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </label>
              </div>

              {/* Issuer Company Details (No Tax ID) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                <label className="text-[11px] font-bold text-slate-600 block">
                  ชื่อผู้ออกใบเสร็จ / Issuer Name
                  <input
                    type="text"
                    value={issuerName}
                    onChange={(e) => setIssuerName(e.target.value)}
                    className="w-full mt-1 p-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </label>
                <label className="text-[11px] font-bold text-slate-600 block">
                  ที่อยู่ / Issuer Address
                  <input
                    type="text"
                    value={issuerAddress}
                    onChange={(e) => setIssuerAddress(e.target.value)}
                    className="w-full mt-1 p-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </label>
              </div>

              {/* Save & Feedback Action */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {savedSuccess && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>บันทึกข้อมูลใบเสร็จเรียบร้อยแล้ว ✓</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3.5 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกข้อมูลใบเสร็จ</span>
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-rose-700 font-semibold">{error}</p>}

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleCopyLineSummary}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-emerald-600" />}
              <span>{copied ? 'คัดลอกส่ง LINE แล้ว ✓' : 'คัดลอกส่ง LINE / WhatsApp'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-500 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ / บันทึก PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <article id="ptl-payment-receipt" className="border border-slate-200/90 rounded-2xl p-5 sm:p-8 text-slate-900 bg-white shadow-xs">
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">ใบรับชำระเงิน / Payment Receipt</h1>
              <p className="mt-1 text-sm font-bold text-blue-900">{issuerName || 'Phuket Trusted Local'}</p>
              <p className="text-xs text-slate-600">{issuerAddress || 'Rawai, Phuket 83130, Thailand'}</p>
            </div>
            <div className="text-right">
              <div className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black">
                PAID / ชำระแล้ว
              </div>
              <p className="text-xs font-mono font-bold text-slate-700 mt-2">{receiptNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5 text-xs sm:text-sm">
            <div>
              <span className="text-slate-500 font-semibold">Receipt No. / เลขที่:</span><br />
              <strong className="font-mono">{receiptNumber}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Date issued / วันที่ออก:</span><br />
              <strong>{new Date().toLocaleDateString('en-CA')}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Date received / วันที่รับเงิน:</span><br />
              <strong>{dateReceived}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Received from / ได้รับเงินจาก:</span><br />
              <strong className="text-blue-950 font-black text-sm">{customerName}</strong>
              {(customerPhone || customerAddress) && (
                <div className="text-[11px] text-slate-500 mt-0.5 font-normal">
                  {customerAddress ? `${customerAddress} ` : ''}
                  {customerPhone ? `• โทร ${customerPhone}` : ''}
                </div>
              )}
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 font-semibold">Reference / อ้างอิง:</span><br />
              <strong>
                {reference
                  ? reference
                  : payment.purpose === 'material_advance'
                  ? `Job Advance · ${payment.jobId}`
                  : invoice?.invoiceNumber
                  ? `Invoice ${invoice.invoiceNumber}`
                  : payment.invoiceId || 'Official Direct Receipt'}
              </strong>
            </div>
          </div>

          <table className="w-full text-xs sm:text-sm mt-6 border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-700 font-bold">
                <th className="text-left py-2">Paid for / รายการที่รับชำระ</th>
                <th className="text-right py-2">Received (THB)</th>
              </tr>
            </thead>
            <tbody>
              {(payment.allocations?.length
                ? payment.allocations
                : [{ description: invoice?.items.map((i) => i.description).join(', ') || 'Payment for Technical Services', amount: payment.amount }]
              ).map((line, index) => (
                <tr key={index} className="border-b border-slate-100">
                  <td className="py-2.5 font-medium text-slate-800">{line.description}</td>
                  <td className="text-right py-2.5 font-mono font-bold text-slate-900">
                    ฿{line.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right mt-4 pt-3 border-t-2 border-slate-300 text-base sm:text-lg font-black text-slate-900 flex justify-between items-center">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
              Total received / ยอดรับชำระทั้งสิ้น:
            </span>
            <span className="text-emerald-700 font-mono text-xl sm:text-2xl">
              ฿{payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {payment.purpose === 'material_advance' && (
            <p className="text-xs mt-3 p-2 bg-blue-50/70 border border-blue-200/80 rounded-lg text-blue-900 font-bold">
              เงินมัดจำจัดซื้อวัสดุอุปกรณ์ (Material Advance) ได้รับเรียบร้อยแล้ว {payment.appliedInvoiceId ? `และนำไปหักลบในใบแจ้งหนี้ ${invoice?.invoiceNumber || payment.appliedInvoiceId}` : 'จะนำไปหักลบในใบแจ้งหนี้รอบปิดงาน'}
            </p>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
            <p>
              <strong>ช่องทางชำระเงิน / Payment Method:</strong> {payment.paymentMethod} {reference ? `· เลขอ้างอิง: ${reference}` : ''}
            </p>
            {!!payment.slips?.length && (
              <p>
                <strong>หลักฐานสลิป / Slips:</strong> {payment.slips.map((slip) => `${slip.reference || slip.fileName} (฿${slip.amount.toLocaleString()})`).join(' · ')}
              </p>
            )}
            {visibleNote && (
              <p>
                <strong>หมายเหตุ / Remarks:</strong> {visibleNote}
              </p>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-dashed border-slate-300 flex justify-between items-end text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-700">{issuerName}</p>
              <p>Phuket Trusted Local • Premier Property Care & Villa Inspection</p>
            </div>
            <div className="text-right">
              <div className="h-10 border-b border-slate-300 w-36 mb-1"></div>
              <p>Authorized Signature / ผู้มีอำนาจลงนาม</p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
