import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, DollarSign, Calendar, CreditCard, FileText, AlertCircle } from 'lucide-react';
import { Invoice, PaymentMethod, Payment, InspectionJob } from '../types';
import { useLanguage } from '../i18n/translations';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  payments?: Payment[];
  jobs?: InspectionJob[];
  presetInvoiceId?: string | null;
  presetAdvanceJobId?: string | null;
  onRecordPayment: (params: {
    invoiceId: string;
    jobId: string;
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    notes?: string;
    date?: string;
    slips?: Payment['slips'];
    allocations?: Payment['allocations'];
  }) => void | Promise<unknown>;
  onRecordAdvance: (params: {jobId: string; customerId: string; amount: number; paymentMethod: PaymentMethod;
    reference?: string; notes?: string; date?: string; slips?: Payment['slips']}) => void | Promise<unknown>;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'PromptPay',
  'Bank Transfer',
  'Cash',
  'Credit Card',
  'Other',
];
const TH_METHODS: Record<PaymentMethod, string> = {
  PromptPay: 'พร้อมเพย์', 'Bank Transfer': 'โอนธนาคาร', Cash: 'เงินสด',
  'Credit Card': 'บัตรเครดิต', Other: 'อื่น ๆ',
};

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoices,
  payments = [],
  jobs = [],
  presetInvoiceId,
  presetAdvanceJobId,
  onRecordPayment,
  onRecordAdvance,
}) => {
  const { lang } = useLanguage();
  const th = lang === 'th';
  const label = (thai: string, english: string) => th ? thai : english;
  const [mode, setMode] = useState<'invoice' | 'advance'>(presetAdvanceJobId ? 'advance' : 'invoice');
  const [advanceJobId, setAdvanceJobId] = useState(presetAdvanceJobId || '');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    presetInvoiceId || invoices[0]?.id || ''
  );
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PromptPay');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [slips, setSlips] = useState<NonNullable<Payment['slips']>>([]);
  const [allocations, setAllocations] = useState<Record<number, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const targetInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);
  const linkedJob = jobs.find((j) => j.id === targetInvoice?.jobId);
  const quoteTotal = (linkedJob?.quotation?.serviceItems || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
    (linkedJob?.quotation?.hardwareItems || []).reduce((sum, item) => sum + (item.amount || 0), 0);
  const round = (n: number) => Math.round(n * 100) / 100;
  const slipTotal = round(slips.reduce((sum, slip) => sum + (Number(slip.amount) || 0), 0));
  const allocatedTotal = round(Object.values(allocations).reduce<number>((sum, value) => sum + (Number(value) || 0), 0));

  const suggestAllocations = () => {
    if (!targetInvoice) return;
    let remaining = round(Number(amount) || 0);
    const proposal: Record<number, string> = {};
    targetInvoice.items.forEach((item, index) => {
      const previouslyAllocated = payments.filter((p) => p.invoiceId === targetInvoice.id)
        .flatMap((p) => p.allocations || []).filter((line) => line.itemIndex === index)
        .reduce((sum, line) => sum + line.amount, 0);
      const available = Math.max(0, round(item.amount - previouslyAllocated));
      const assigned = Math.min(remaining, available);
      if (assigned > 0) proposal[index] = String(round(assigned));
      remaining = round(remaining - assigned);
    });
    if (remaining > 0) proposal[-1] = String(remaining);
    setAllocations(proposal);
  };

  const handleSlipFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const converted = await Promise.all(Array.from(files).map((file) => new Promise<NonNullable<Payment['slips']>[number]>((resolve, reject) => {
        if (!file.type.startsWith('image/')) return reject(new Error(label('กรุณาเลือกรูปสลิป', 'Please select image files.')));
        const reader = new FileReader();
        reader.onerror = () => reject(new Error(label('อ่านรูปสลิปไม่ได้', 'Could not read the slip image.')));
        reader.onload = () => {
          const img = new Image();
          img.onerror = () => reject(new Error(label('เปิดรูปสลิปไม่ได้', 'Could not open the slip image.')));
          img.onload = () => {
            const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.72);
            resolve({ id: crypto.randomUUID(), fileName: file.name, imageDataUrl, amount: 0 });
          };
          img.src = String(reader.result);
        };
        reader.readAsDataURL(file);
      })));
      setSlips((prev) => [...prev, ...converted]);
    } catch (error) { setValidationError(error instanceof Error ? error.message : 'Could not attach slips.'); }
  };

  useEffect(() => {
    setValidationError(null);
    if (presetAdvanceJobId) {
      setAdvanceJobId(presetAdvanceJobId);
      setMode('advance');
      setAmount('');
    } else if (presetInvoiceId) {
      setSelectedInvoiceId(presetInvoiceId);
      const inv = invoices.find((i) => i.id === presetInvoiceId);
      if (inv) {
        setAmount(String(inv.balanceDue > 0 ? inv.balanceDue : 0));
      }
    } else if (invoices.length > 0 && !selectedInvoiceId) {
      setSelectedInvoiceId(invoices[0].id);
      setAmount(String(invoices[0].balanceDue > 0 ? invoices[0].balanceDue : 0));
    }
  }, [presetInvoiceId, presetAdvanceJobId, invoices]);

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    setAllocations({});
    setSlips([]);
    setValidationError(null);
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      setAmount(String(inv.balanceDue > 0 ? inv.balanceDue : 0));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (mode === 'invoice' && !targetInvoice) {
      setValidationError(label('กรุณาเลือกใบแจ้งหนี้ที่มีอยู่ในระบบ', 'Please select a valid invoice'));
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError(label('ยอดรับเงินต้องมากกว่า 0', 'Payment amount must be greater than 0.'));
      return;
    }

    if (mode === 'invoice' && targetInvoice && targetInvoice.balanceDue <= 0) {
      setValidationError(label('ใบแจ้งหนี้นี้ไม่มียอดค้างชำระ', 'Payment cannot exceed the outstanding balance of ฿0.'));
      return;
    }

    if (mode === 'invoice' && targetInvoice && parsedAmount > (targetInvoice.balanceDue ?? 0)) {
      setValidationError(
        label(`ยอดรับเกินยอดคงค้าง ฿${(targetInvoice.balanceDue ?? 0).toLocaleString()}`, `Payment cannot exceed the outstanding balance of ฿${(targetInvoice.balanceDue ?? 0).toLocaleString()}.`)
      );
      return;
    }
    if (slips.length && slipTotal !== round(parsedAmount)) {
      setValidationError(label('ยอดรวมในสลิปต้องเท่ากับยอดรับเงิน', 'Sum of slip amounts must match the received amount.')); return;
    }
    if (mode === 'invoice' && allocatedTotal !== round(parsedAmount)) {
      setValidationError(label('กรุณาแยกยอดรับให้ครบตามรายการในใบแจ้งหนี้', 'Please allocate the full received amount to the invoice items.')); return;
    }

    setSaving(true);
    try {
      if (mode === 'advance') {
        const job = jobs.find((j) => j.id === advanceJobId);
        if (!job) { setValidationError(label('เลือกงานที่จะรับมัดจำ', 'Select the new job for this material advance.')); return; }
        await onRecordAdvance({jobId: job.id, customerId: job.customerId || job.clientId,
          amount: parsedAmount, paymentMethod, reference, notes, date, slips: slips.length ? slips : undefined});
        onClose(); return;
      }
      if (!targetInvoice) return;
      await onRecordPayment({
        invoiceId: targetInvoice.id,
        jobId: targetInvoice.jobId,
        customerId: targetInvoice.customerId,
        amount: parsedAmount,
        paymentMethod,
        reference: reference.trim(),
        notes: notes.trim(),
        date,
        slips: slips.length ? slips : undefined,
        allocations: Object.entries(allocations).filter(([, value]) => Number(value) > 0).map(([index, value]) => ({
          itemIndex: Number(index),
          description: Number(index) === -1 ? 'Invoice adjustments' : targetInvoice.items[Number(index)]?.description || 'Invoice item',
          amount: round(Number(value)),
        })),
      });
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || label('บันทึกรับเงินไม่สำเร็จ', 'Failed to record payment.'));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain p-4 sm:p-6 shadow-2xl relative border border-slate-200 min-w-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </span>
            <h2 className="text-lg font-black text-slate-900 pr-9">{label('บันทึกรับเงิน', 'Record Payment')}</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {label('แยกชำระใบแจ้งหนี้เดิมกับเงินมัดจำงานใหม่', 'Record an invoice payment or a separate material advance for a continuing job')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button type="button" onClick={() => setMode('invoice')} className={`min-w-0 px-2 py-2 rounded-lg ${mode === 'invoice' ? 'bg-blue-700 text-white' : 'bg-slate-100'}`}>{label('ชำระใบแจ้งหนี้', 'Invoice payment')}</button>
            <button type="button" onClick={() => {setMode('advance'); setAmount(''); setAllocations({}); setSlips([]);}} className={`min-w-0 px-2 py-2 rounded-lg ${mode === 'advance' ? 'bg-blue-700 text-white' : 'bg-slate-100'}`}>{label('มัดจำงานใหม่', 'New job · material advance')}</button>
          </div>
          {mode === 'advance' && <label className="block text-xs font-bold">{label('งานที่รับมัดจำ *', 'Job receiving the advance *')}
            <select required value={advanceJobId} onChange={(e) => setAdvanceJobId(e.target.value)} className="w-full min-w-0 p-2 border rounded-lg mt-1">
              <option value="">{label('เลือกงาน', 'Choose the new job')}</option>{jobs.map((j) => <option key={j.id} value={j.id}>{j.customerName} · {j.villaName} · {j.serviceType}</option>)}
            </select><span className="block font-normal text-slate-500 mt-1">{label('ใบเสร็จจะแสดงเป็นเงินมัดจำ แยกจากยอดงานเก่า', 'A separate receipt will show this as an advance. Apply it to this job’s final invoice later.')}</span>
          </label>}
          {/* Invoice Selection */}
          {mode === 'invoice' && <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {label('เลือกใบแจ้งหนี้ *', 'Select Invoice *')}
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {!invoices.length && <option value="">{label('ไม่มีใบแจ้งหนี้ — สร้างก่อนบันทึกยอดงานเก่า', 'No invoice — create one first')}</option>}
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} • {label('คงค้าง', 'Due')} ฿{(inv.balanceDue ?? 0).toLocaleString()}
                </option>
              ))}
            </select>
            {!invoices.length && <p className="mt-1 text-xs text-amber-800">{label('ถ้าเป็นยอดงานเก่า กรุณาสร้างใบแจ้งหนี้ในแท็บการเงินก่อน ไม่ควรบันทึกเป็นเงินมัดจำ', 'Create the prior job invoice in Financial first; do not record old debt as an advance.')}</p>}
            {targetInvoice && (
              <div className="mt-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500">{label('ยอดรวม: ', 'Invoice Total: ')}</span>
                  <strong className="text-slate-900">฿{(targetInvoice.total ?? 0).toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-500">{label('คงค้าง: ', 'Balance Due: ')}</span>
                  <strong className={(targetInvoice.balanceDue ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    ฿{(targetInvoice.balanceDue ?? 0).toLocaleString()}
                  </strong>
                </div>
              </div>
            )}
            {targetInvoice && <details className="mt-2 text-xs text-slate-700 space-y-1"><summary className="cursor-pointer">{label('ดูรายละเอียดเอกสาร', 'Document details')}</summary>
              <p>Invoice: subtotal ฿{targetInvoice.subtotal.toLocaleString()} · discount ฿{targetInvoice.discount.toLocaleString()} · tax ฿{targetInvoice.tax.toLocaleString()}</p>
              <p>Received before ฿{targetInvoice.amountPaid.toLocaleString()} · remaining ฿{targetInvoice.balanceDue.toLocaleString()}</p>
              {quoteTotal > 0 && <p>Linked quotation total: ฿{quoteTotal.toLocaleString()}{Math.abs(quoteTotal - targetInvoice.total) > 0.01 ? ' · Differs from invoice: review document versions' : ''}</p>}
            </details>}
          </div>}

          {/* Payment Method */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
              {label('วิธีรับเงิน *', 'Payment Method *')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  type="button"
                  key={pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
                    paymentMethod === pm
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {th ? TH_METHODS[pm] : pm}
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="min-w-0">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                {label('ยอดรับจริง (บาท) *', 'Amount Received (฿) *')}
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setValidationError(null);
                }}
                placeholder="5000"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-extrabold focus:ring-2 focus:ring-emerald-500"
              />
              {mode === 'invoice' && targetInvoice && (
                <p className="text-[10px] text-slate-500 mt-1">
                  {label('รับได้สูงสุด', 'Max payable')}: ฿{(targetInvoice.balanceDue ?? 0).toLocaleString()}
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                {label('วันที่รับเงิน', 'Date Received')}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-w-0 max-w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              />
            </div>
          </div>

          {/* Molly compares the invoice with confirmed transfer amounts. Image text is never guessed. */}
          {mode === 'invoice' && targetInvoice && <details className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 space-y-2">
            <summary className="cursor-pointer text-sm font-bold text-blue-800">{label('แยกยอดตามรายการใบแจ้งหนี้', 'Allocate invoice items')} · ฿{allocatedTotal.toLocaleString()} / ฿{(Number(amount) || 0).toLocaleString()}</summary>
            <div className="flex items-center justify-between gap-2">
              <strong className="text-sm text-slate-900">Molly · {targetInvoice.invoiceNumber}</strong>
              <button type="button" onClick={suggestAllocations} className="text-xs font-bold text-blue-700 underline">{label('แนะนำการแยกยอด', 'Suggest allocation')}</button>
            </div>
            <p className="text-xs text-slate-600">{label('ตรวจแต่ละรายการก่อนยืนยัน ยอดที่รับอาจชำระเพียงบางรายการ', 'Check each invoice line before confirming. A partial payment may cover only some items.')}</p>
            {targetInvoice?.items.map((item, index) => (
              <label key={`${targetInvoice.id}-${index}`} className="flex items-center justify-between gap-2 text-xs text-slate-700">
                <span className="min-w-0 flex-1 truncate">{item.description} · ฿{item.amount.toLocaleString()}</span>
                <input type="number" min="0" step="0.01" inputMode="decimal" aria-label={`${label('ยอดรับ', 'Received for')} ${item.description}`}
                  value={allocations[index] || ''} onChange={(e) => setAllocations((prev) => ({ ...prev, [index]: e.target.value }))}
                  placeholder={label('รับ ฿', 'Paid ฿')} className="w-24 min-w-0 p-2 border rounded-lg text-right" />
              </label>
            ))}
            <label className="flex items-center justify-between gap-2 text-xs text-slate-700">
              <span>{label('ยอดอื่น / ส่วนลด / ภาษี', 'Other invoice adjustments (discount/tax if applicable)')}</span>
              <input type="number" min="0" step="0.01" inputMode="decimal" value={allocations[-1] || ''}
                onChange={(e) => setAllocations((prev) => ({ ...prev, [-1]: e.target.value }))}
                placeholder={label('รับ ฿', 'Paid ฿')} className="w-24 min-w-0 p-2 border rounded-lg text-right" />
            </label>
            <div className="text-xs font-bold text-right">{label('แยกแล้ว', 'Allocated')} ฿{allocatedTotal.toLocaleString()} / {label('รับ', 'Received')} ฿{(Number(amount) || 0).toLocaleString()}</div>
          </details>}

          <div className="rounded-xl border border-slate-200 p-3 space-y-2">
            <label className="block text-xs font-bold">{label('รูปสลิปโอนเงิน (หลายใบได้)', 'Transfer slips (multiple images)')}</label>
            <input type="file" accept="image/*" multiple onChange={(e) => { void handleSlipFiles(e.target.files); e.target.value = ''; }}
              className="block w-full min-w-0 text-xs" />
            {slips.map((slip) => (
              <div key={slip.id} className="flex flex-wrap items-center gap-2 text-xs min-w-0">
                <img src={slip.imageDataUrl} alt={slip.fileName} className="w-10 h-10 object-cover rounded" />
                <span className="truncate flex-1 min-w-0">{slip.fileName}</span>
                <input type="number" min="0" step="0.01" inputMode="decimal" value={slip.amount || ''} placeholder="฿"
                  aria-label={`Amount for ${slip.fileName}`} onChange={(e) => setSlips((prev) => prev.map((s) => s.id === slip.id ? { ...s, amount: Number(e.target.value) } : s))}
                  className="w-24 p-2 border rounded-lg" />
                <input type="text" value={slip.reference || ''} placeholder={label('เลขอ้างอิง', 'Transfer ref')}
                  aria-label={`Reference for ${slip.fileName}`} onChange={(e) => setSlips((prev) => prev.map((s) => s.id === slip.id ? { ...s, reference: e.target.value } : s))}
                  className="w-28 p-2 border rounded-lg" />
                <button type="button" onClick={() => setSlips((prev) => prev.filter((s) => s.id !== slip.id))} className="text-rose-600 font-bold">×</button>
              </div>
            ))}
            {slips.length > 0 && <p className="text-xs text-slate-600">{label('ยอดรวมสลิป', 'Slips total')}: ฿{slipTotal.toLocaleString()} · {label('โปรดตรวจยอดจากภาพ', 'Please verify the amounts against the images.')}</p>}
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Reference & Notes */}
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                {label('เลขอ้างอิงการโอน / เช็ค', 'Transfer Ref / Slip / Check No.')}
              </label>
              <input
                type="text"
                placeholder={label('เช่น เลขอ้างอิงในสลิป', 'e.g. KBANK-88491, PP-9921, or Cash on site')}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                {label('หมายเหตุ', 'Notes')}
              </label>
              <input
                type="text"
                placeholder={label('เช่น มัดจำค่าวัสดุ', 'e.g. 50% deposit received before parts procurement')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
            >
              {label('ยกเลิก', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving || (mode === 'invoice' && !targetInvoice)}
              className="px-5 py-2.5 text-xs sm:text-sm font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {saving ? label('กำลังบันทึก…', 'Saving…') : label('ยืนยันรับเงิน', 'Confirm Payment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
