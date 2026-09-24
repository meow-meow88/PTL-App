import React, { useState } from 'react';
import type { Invoice, InspectionJob, Payment } from '../types';
import { readEvidenceFile } from '../utils/readEvidenceFile';

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
  const [documents, setDocuments] = useState<File[]>([]);
  const [slips, setSlips] = useState<File[]>([]);
  const files = [...documents, ...slips];
  const [message, setMessage] = useState('');
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [stage, setStage] = useState<'files' | 'request' | ''>('');

  const addManualTransfer = (fileIndex: number) => {
    if (fileIndex < documents.length || transfers.some((t) => t.fileIndex === fileIndex)) return;
    setTransfers((prev) => [...prev, {fileIndex, amount: 0, reference: '', date: new Date().toISOString().slice(0, 10),
      purpose: 'unmatched', invoiceId: '', jobId: '', reason: 'กรอกตามสลิปและตรวจสอบรายการด้วยตัวเอง', confidence: 'รอตรวจสอบ', target: ''}]);
    setError('');
  };

  const analyze = async () => {
    if (!slips.length) {setError('กรุณาแนบรูปสลิปอย่างน้อยหนึ่งใบ'); return;}
    if (files.length > 6 || files.reduce((sum, f) => sum + f.size, 0) > 15_000_000) {setError('รวมได้ไม่เกิน 6 ไฟล์ และ 15 MB'); return;}
    setError(''); setBusy(true); setStage('files'); setTransfers([]);
    try {
      const attachments = await Promise.all(files.map(async (file) => ({
        mimeType: file.type, data: (await readEvidenceFile(file)).split(',')[1],
      })));
      setStage('request');
      const response = await fetch('/api/gemini/molly-payment-evidence', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({files: attachments, documentCount: documents.length, message,
          invoices: invoices.map((i) => ({id: i.id, invoiceNumber: i.invoiceNumber, jobId: i.jobId, customerId: i.customerId,
            balanceDue: i.balanceDue, items: i.items.map((line) => ({description: line.description, amount: line.amount}))})),
          jobs: jobs.map((j) => ({id: j.id, customerId: j.customerId || j.clientId, villaName: j.villaName,
            serviceType: j.serviceType, materialDepositRequested: j.materialDepositRequested}))})});
      const raw = await response.text();
      let result: {error?: string; transfers?: Transfer[]};
      try { result = JSON.parse(raw); } catch { throw new Error(`เซิร์ฟเวอร์ส่งผลตอบกลับที่อ่านไม่ได้ (${response.status}) กรุณาลองใหม่ หรือกรอกยอดจากสลิปเอง`); }
      if (!response.ok) throw new Error(result.error || `ไม่สามารถวิเคราะห์เอกสารได้ (${response.status})`);
      const suggestions: Transfer[] = (result.transfers || []).filter((t: Transfer) =>
        Number.isInteger(t.fileIndex) && t.fileIndex >= documents.length && t.fileIndex < files.length).map((t: Transfer) => ({...t,
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
    if (!transfer?.target || !Number.isFinite(transfer.amount) || transfer.amount <= 0 || transfer.fileIndex < documents.length || !files[transfer.fileIndex]) {
      setError('ตรวจสอบยอด เลือกสลิป และเลือกใบแจ้งหนี้หรืองานใหม่ให้ถูกต้อง'); return;
    }
    if (transfers.some((t, i) => i !== index && t.fileIndex === transfer.fileIndex && t.saved)) {
      setError('สลิปนี้บันทึกแล้ว ห้ามบันทึกรับเงินซ้ำ'); return;
    }
    const [kind, id] = transfer.target.split(':');
    if (kind === 'invoice' && !invoices.some((invoice) => invoice.id === id && invoice.balanceDue >= transfer.amount)) {
      setError('ยอดสูงกว่ายอดค้างชำระของใบแจ้งหนี้ กรุณาตรวจสอบการแยกยอด'); return;
    }
    if (transfer.reference && payments.some((p) => p.reference?.trim().toLowerCase() === transfer.reference.trim().toLowerCase() ||
      p.slips?.some((s) => s.reference?.trim().toLowerCase() === transfer.reference.trim().toLowerCase()))) {
      setError('เลขอ้างอิงการโอนนี้ถูกบันทึกแล้ว'); return;
    }
    setError(''); setSaving(index);
    try {
      const payment = await onRecord(transfer, files[transfer.fileIndex]);
      setTransfers((prev) => prev.map((t, i) => i === index ? {...t, saved: payment} : t));
    } catch (err) {setError(err instanceof Error && err.message !== 'The string did not match the expected pattern.' ? err.message : 'บันทึกไม่สำเร็จ กรุณาตรวจสอบไฟล์และลองใหม่');}
    finally {setSaving(null);}
  };

  const selectFiles = (selected: File[], kind: 'documents' | 'slips') => {
    if (selected.some((f) => f.size > 4_000_000 || !(kind === 'slips' ? ['image/jpeg','image/png','image/webp'] : ['image/jpeg','image/png','image/webp','application/pdf']).includes(f.type))) {
      setError('รองรับ JPG, PNG, WebP หรือ PDF ไฟล์ละไม่เกิน 4 MB'); return;
    }
    const next = kind === 'documents' ? [...selected, ...slips] : [...documents, ...selected];
    if (next.length > 6 || next.reduce((sum, f) => sum + f.size, 0) > 15_000_000) {
      setError('รวมเอกสารและสลิปได้ไม่เกิน 6 ไฟล์ / 15 MB'); return;
    }
    if (kind === 'documents') setDocuments(selected); else setSlips(selected);
    setTransfers([]); setError('');
  };

  return <div className="fixed inset-0 z-[90] bg-slate-900/70 p-3 overflow-y-auto flex justify-center items-start">
    <div className="w-full max-w-2xl min-w-0 bg-white rounded-2xl p-4 sm:p-5 my-4 space-y-4 shadow-2xl">
      <div className="flex justify-between items-start gap-3"><div><h2 className="text-lg font-black">Molly · ตรวจเอกสารรับเงิน</h2>
        <p className="text-xs text-slate-600">แนบใบเสนอราคาหรือ invoice และรูปสลิปแยกกัน ตรวจยอดก่อนออกใบเสร็จ</p></div>
        <button type="button" onClick={onClose} className="p-2 border rounded-lg">ปิด</button></div>
      <label className="block text-sm font-bold">1. ใบเสนอราคา / ใบแจ้งหนี้ (รูปหรือ PDF)
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="block mt-1 w-full min-w-0 text-xs" onChange={(e) => selectFiles(Array.from(e.target.files || []), 'documents')} />
        <span className="block text-xs font-normal text-slate-500 break-all">{documents.map((f) => f.name).join(' · ')}</span>
      </label>
      <label className="block text-sm font-bold">2. สลิปโอนเงิน (รูปจากมือถือ)
        <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="block mt-1 w-full min-w-0 text-xs" onChange={(e) => selectFiles(Array.from(e.target.files || []), 'slips')} />
        <span className="block text-xs font-normal text-slate-500 break-all">{slips.map((f) => f.name).join(' · ')}</span>
      </label>
      <p className="text-xs text-slate-500">รวมสูงสุด 6 ไฟล์ ไฟล์ละ 4 MB / รวมไม่เกิน 15 MB</p>
      <label className="block text-sm font-bold">บริบทจากข้อความลูกค้า
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} maxLength={2500}
          placeholder="เช่น ยอดเก่างาน Smart Home 8,520.70 บาท และมัดจำค่าวัสดุงานไฟทางเข้า 2,000 บาท"
          className="block w-full mt-1 p-2 border rounded-lg text-sm" />
      </label>
      <button type="button" disabled={busy || !slips.length} onClick={analyze} className="p-2.5 rounded-lg bg-blue-700 text-white font-bold disabled:opacity-50">
        {busy ? stage === 'files' ? 'กำลังอ่านไฟล์…' : 'กำลังส่งให้ Molly วิเคราะห์…' : 'ให้ Molly วิเคราะห์'}</button>
      {error && <p role="alert" className="text-sm text-rose-700 font-semibold">{error}</p>}
      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 space-y-2">
        <p>หาก Molly อ่านไม่ได้ คุณยังบันทึกสลิปแต่ละใบได้: เลือกไฟล์สลิป → กรอกยอด/วันที่/เลขอ้างอิง → เลือกใบแจ้งหนี้เดิมหรือมัดจำงานใหม่ → ตรวจสอบกับธนาคารก่อนกดบันทึก</p>
        <div className="flex flex-wrap gap-2">{slips.map((file, index) => <button key={`${file.name}-${index}`} type="button"
          disabled={busy} onClick={() => addManualTransfer(documents.length + index)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 disabled:opacity-50 break-all">
          + กรอกสลิปเอง: {file.name}</button>)}</div>
      </div>
      {transfers.map((t, index) => <div key={`${t.fileIndex}-${index}`} className="p-3 border rounded-xl space-y-2">
        <p className="text-sm font-bold">{files[t.fileIndex]?.name} · ข้อเสนอ Molly: {t.purpose === 'invoice' ? 'ชำระ invoice' : t.purpose === 'material_advance' ? 'มัดจำงานต่อเนื่อง' : 'ยังไม่แน่ใจ'}</p>
        <p className="text-xs text-slate-600">{t.reason} · ความมั่นใจ {t.confidence}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs [&_input]:min-w-0 [&_select]:min-w-0">
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
      {!invoices.some((invoice) => invoice.balanceDue > 0) && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">ยังไม่มีใบแจ้งหนี้คงค้างในระบบ: รูปใบเสนอราคาเป็นหลักฐานอ้างอิง แต่ยังใช้แทน invoice ไม่ได้ หากเป็นยอดงานเก่า ให้สร้างใบแจ้งหนี้ของงานนั้นในแท็บการเงินก่อน แล้วกลับมาผูกสลิปเพื่อออกใบเสร็จ ส่วนเงินมัดจำงานใหม่เลือกงานที่รับมัดจำได้เลย</p>}
      <p className="text-xs text-amber-800">Molly อ่านเอกสารเพื่อเสนอรายการเท่านั้น ตรวจสลิปกับบัญชีธนาคารจริงก่อนกดบันทึก</p>
    </div>
  </div>;
};
