import React, { useState } from 'react';
import type { Invoice, InspectionJob, Payment } from '../types';

type Transfer = {
  fileIndex: number;
  amount: number;
  reference: string;
  date: string;
  purpose: string;
  invoiceId: string;
  jobId: string;
  reason: string;
  confidence: string;
  target: string;
  saved?: Payment;
};

interface Props {
  invoices: Invoice[];
  jobs: InspectionJob[];
  payments: Payment[];
  onRecord: (transfer: Transfer, file: File) => Promise<Payment>;
  onShowReceipt: (payment: Payment) => void;
  onClose: () => void;
}

export const MollyPaymentEvidenceModal: React.FC<Props> = ({invoices, jobs, payments, onRecord, onShowReceipt, onClose}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [stage, setStage] = useState<'files' | 'request' | ''>('');

  const addManualTransfer = (fileIndex: number) => {
    setTransfers((prev) => [...prev, {fileIndex, amount: 0, reference: '', date: new Date().toISOString().slice(0, 10),
      purpose: 'unmatched', invoiceId: '', jobId: '', reason: 'กรอกตามสลิปและตรวจสอบรายการด้วยตัวเอง', confidence: 'รอตรวจสอบ', target: ''}]);
    setError('');
  };

  const analyze = async () => {
    if (!files.length) {setError('Attach an invoice and/or transfer slips first.'); return;}
    setError(''); setBusy(true); setStage('files'); setTransfers([]);
    try {
      const attachments = await Promise.all(files.map((file) => new Promise<{mimeType: string; data: string}>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read ' + file.name));
        reader.onload = () => {
          const result = typeof reader.result === 'string' ? reader.result : '';
          const data = result.startsWith('data:') ? result.slice(result.indexOf(',') + 1) : '';
          if (!data || !result.includes(',')) reject(new Error('Could not read ' + file.name));
          else resolve({mimeType: file.type, data});
        };
        try { reader.readAsDataURL(file); } catch { reject(new Error('Could not read ' + file.name)); }
      })));
      setStage('request');
      const response = await fetch('/api/gemini/molly-payment-evidence', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({files: attachments, message,
          invoices: invoices.map((i) => ({id: i.id, invoiceNumber: i.invoiceNumber, jobId: i.jobId, customerId: i.customerId,
            balanceDue: i.balanceDue, items: i.items.map((line) => ({description: line.description, amount: line.amount}))})),
          jobs: jobs.map((j) => ({id: j.id, customerId: j.customerId || j.clientId, villaName: j.villaName,
            serviceType: j.serviceType, materialDepositRequested: j.materialDepositRequested}))})});
      const raw = await response.text();
      let result: {error?: string; transfers?: Transfer[]};
      try { result = JSON.parse(raw); } catch { throw new Error(`เซิร์ฟเวอร์ส่งผลตอบกลับที่อ่านไม่ได้ (${response.status}) กรุณาลองใหม่ หรือกรอกยอดจากสลิปเอง`); }
      if (!response.ok) throw new Error(result.error || `ไม่สามารถวิเคราะห์เอกสารได้ (${response.status})`);
      const suggestions: Transfer[] = (result.transfers || []).map((t: Transfer) => ({...t,
        target: t.purpose === 'invoice' && invoices.some((i) => i.id === t.invoiceId && i.balanceDue >= t.amount) ? `invoice:${t.invoiceId}` :
          t.purpose === 'material_advance' && jobs.some((j) => j.id === t.jobId) ? `advance:${t.jobId}` : '',
        reference: t.reference || '', date: /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : new Date().toISOString().slice(0, 10),
      }));
      setTransfers(suggestions);
      if (!suggestions.length) setError('No transfer was identified. Check the attachments and try again.');
    } catch (err) {
      const detail = err instanceof Error ? err.message : '';
      setError(detail.startsWith('Could not read ') ? `${detail} กรุณาเลือกไฟล์ใหม่ หรือกรอกยอดจากสลิปเอง` :
        detail === 'The string did not match the expected pattern.' || err instanceof TypeError ?
          'ส่งไฟล์ไปให้ Molly ไม่สำเร็จ กรุณาลองใหม่ หรือตรวจสลิปและกรอกยอดด้วยตัวเอง' :
          detail || 'วิเคราะห์เอกสารไม่สำเร็จ กรุณาลองใหม่หรือกรอกยอดจากสลิปเอง');
    } finally {setBusy(false); setStage('');}
  };

  const save = async (index: number) => {
    const transfer = transfers[index];
    if (!transfer?.target || !Number.isFinite(transfer.amount) || transfer.amount <= 0 || !files[transfer.fileIndex]) {
      setError('ตรวจสอบยอด เลือกสลิป และเลือกใบแจ้งหนี้หรืองานใหม่ให้ถูกต้อง'); return;
    }
    const [kind, id] = transfer.target.split(':');
    if (kind === 'invoice' && !invoices.some((invoice) => invoice.id === id && invoice.balanceDue >= transfer.amount)) {
      setError('ยอดสูงกว่ายอดค้างชำระของใบแจ้งหนี้ กรุณาตรวจสอบการแยกยอด'); return;
    }
    if (transfer.reference && payments.some((p) => p.reference?.trim().toLowerCase() === transfer.reference.trim().toLowerCase() ||
      p.slips?.some((s) => s.reference?.trim().toLowerCase() === transfer.reference.trim().toLowerCase()))) {
      setError('This transfer reference was already recorded.'); return;
    }
    setError(''); setSaving(index);
    try {
      const payment = await onRecord(transfer, files[transfer.fileIndex]);
      setTransfers((prev) => prev.map((t, i) => i === index ? {...t, saved: payment} : t));
    } catch (err) {setError(err instanceof Error && err.message !== 'The string did not match the expected pattern.' ? err.message : 'บันทึกไม่สำเร็จ กรุณาตรวจสอบไฟล์และลองใหม่');}
    finally {setSaving(null);}
  };

  return <div className="fixed inset-0 z-[90] bg-slate-900/70 p-3 overflow-y-auto flex justify-center items-start">
    <div className="w-full max-w-2xl bg-white rounded-2xl p-5 my-4 space-y-4 shadow-2xl">
      <div className="flex justify-between items-start gap-3"><div><h2 className="text-lg font-black">Molly · ตรวจเอกสารรับเงิน</h2>
        <p className="text-xs text-slate-600">แนบ invoice/PDF และสลิปหลายใบ Molly จะเสนอการแยกยอด ให้ตรวจทานก่อนออกใบเสร็จแต่ละรายการ</p></div>
        <button type="button" onClick={onClose} className="p-2 border rounded-lg">ปิด</button></div>
      <label className="block text-sm font-bold">เอกสารและสลิป (สูงสุด 6 ไฟล์ ไฟล์ละ 4 MB)
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="block mt-1 w-full text-xs" onChange={(e) => {
          const selected: File[] = Array.from(e.target.files || []);
          if (selected.length > 6 || selected.reduce((sum, f) => sum + f.size, 0) > 15_000_000 || selected.some((f) => f.size > 4_000_000 || !['image/jpeg','image/png','image/webp','application/pdf'].includes(f.type))) {
            setError('Choose up to six JPEG, PNG, WebP or PDF files, each under 4 MB, with a total under 15 MB.'); return;
          }
          setFiles(selected); setTransfers([]); setError('');
        }} />
      </label>
      <p className="text-xs text-slate-500">{files.map((f) => f.name).join(' · ')}</p>
      <label className="block text-sm font-bold">บริบทจากข้อความลูกค้า
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} maxLength={2500}
          placeholder="เช่น ยอดเก่างาน Smart Home 8,520.70 บาท และมัดจำค่าวัสดุงานไฟทางเข้า 2,000 บาท"
          className="block w-full mt-1 p-2 border rounded-lg text-sm" />
      </label>
      <button type="button" disabled={busy || !files.length} onClick={analyze} className="p-2.5 rounded-lg bg-blue-700 text-white font-bold disabled:opacity-50">
        {busy ? stage === 'files' ? 'กำลังอ่านไฟล์…' : 'กำลังส่งให้ Molly วิเคราะห์…' : 'ให้ Molly วิเคราะห์'}</button>
      {error && <p role="alert" className="text-sm text-rose-700 font-semibold">{error}</p>}
      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 space-y-2">
        <p>หาก Molly อ่านไม่ได้ คุณยังบันทึกสลิปแต่ละใบได้: เลือกไฟล์สลิป → กรอกยอด/วันที่/เลขอ้างอิง → เลือกใบแจ้งหนี้เดิมหรือมัดจำงานใหม่ → ตรวจสอบกับธนาคารก่อนกดบันทึก</p>
        <div className="flex flex-wrap gap-2">{files.map((file, index) => <button key={`${file.name}-${index}`} type="button"
          disabled={busy} onClick={() => addManualTransfer(index)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 disabled:opacity-50">
          + กรอกสลิปเอง: {file.name}</button>)}</div>
      </div>
      {transfers.map((t, index) => <div key={`${t.fileIndex}-${index}`} className="p-3 border rounded-xl space-y-2">
        <p className="text-sm font-bold">{files[t.fileIndex]?.name} · ข้อเสนอ Molly: {t.purpose === 'invoice' ? 'ชำระ invoice' : t.purpose === 'material_advance' ? 'มัดจำงานต่อเนื่อง' : 'ยังไม่แน่ใจ'}</p>
        <p className="text-xs text-slate-600">{t.reason} · ความมั่นใจ {t.confidence}</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label>ยอดรับจริง (บาท)<input type="number" step="0.01" min="0.01" disabled={!!t.saved} value={t.amount}
            onChange={(e) => setTransfers((prev) => prev.map((x, i) => i === index ? {...x, amount: Number(e.target.value)} : x))} className="block border rounded p-2 w-full" /></label>
          <label>วันที่รับ<input type="date" disabled={!!t.saved} value={t.date} onChange={(e) => setTransfers((prev) => prev.map((x, i) => i === index ? {...x, date: e.target.value} : x))} className="block border rounded p-2 w-full" /></label>
          <label>รหัสอ้างอิง<input value={t.reference} disabled={!!t.saved} onChange={(e) => setTransfers((prev) => prev.map((x, i) => i === index ? {...x, reference: e.target.value} : x))} className="block border rounded p-2 w-full" /></label>
          <label>แยกยอดเข้ารายการ<select disabled={!!t.saved} value={t.target} onChange={(e) => setTransfers((prev) => prev.map((x, i) => i === index ? {...x, target: e.target.value} : x))} className="block border rounded p-2 w-full">
            <option value="">เลือกหลังตรวจสอบ</option>
            {invoices.filter((inv) => inv.balanceDue > 0).map((inv) => <option key={inv.id} value={`invoice:${inv.id}`}>Invoice {inv.invoiceNumber} · คงค้าง ฿{inv.balanceDue}</option>)}
            {jobs.map((job) => <option key={job.id} value={`advance:${job.id}`}>มัดจำงานใหม่ · {job.villaName} · {job.serviceType}</option>)}
          </select></label>
        </div>
        {t.saved ? <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold">บันทึกแล้ว · {t.saved.receiptNumber}
          <button type="button" onClick={() => onShowReceipt(t.saved!)} className="p-2 bg-emerald-50 rounded-lg">เปิดใบเสร็จ</button></div> :
          <button type="button" disabled={saving !== null || !t.target} onClick={() => save(index)} className="p-2 bg-emerald-700 text-white text-sm font-bold rounded-lg disabled:opacity-50">
            {saving === index ? 'กำลังบันทึก…' : 'ตรวจแล้ว · บันทึกรับเงินรายการนี้'}</button>}
      </div>)}
      <p className="text-xs text-amber-800">Molly อ่านเอกสารเพื่อเสนอรายการเท่านั้น ตรวจสลิปกับบัญชีธนาคารจริงก่อนกดบันทึก</p>
    </div>
  </div>;
};
