import React, { useState } from 'react';
import type { Customer, Invoice, Payment } from '../types';
import { safeGetLocalStorage, safeSetLocalStorage } from '../utils/storage';

interface Props { payment: Payment; invoice?: Invoice; customer?: Customer; onClose: () => void }

export const PaymentReceiptModal: React.FC<Props> = ({ payment, invoice, customer, onClose }) => {
  const [issuerName, setIssuerName] = useState(() => safeGetLocalStorage('ptl_receipt_issuer_name') || 'Phuket Trusted Local');
  const [issuerAddress, setIssuerAddress] = useState(() => safeGetLocalStorage('ptl_receipt_issuer_address') || '');
  const [issuerTaxId, setIssuerTaxId] = useState(() => safeGetLocalStorage('ptl_receipt_issuer_tax_id') || '');
  const [error, setError] = useState('');

  const handlePrint = () => {
    if (!issuerName.trim() || !issuerAddress.trim() || !issuerTaxId.trim()) {
      setError('Fill in the issuer name, address, and tax ID before printing the receipt.'); return;
    }
    safeSetLocalStorage('ptl_receipt_issuer_name', issuerName.trim());
    safeSetLocalStorage('ptl_receipt_issuer_address', issuerAddress.trim());
    safeSetLocalStorage('ptl_receipt_issuer_tax_id', issuerTaxId.trim());
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 flex justify-center overflow-y-auto p-4">
      <style>{`@media print { body * { visibility: hidden !important; } #ptl-payment-receipt, #ptl-payment-receipt * { visibility: visible !important; } #ptl-payment-receipt { position: absolute !important; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; } .receipt-controls { display: none !important; } }`}</style>
      <div className="bg-white max-w-2xl w-full my-auto rounded-2xl p-5 sm:p-8 shadow-2xl space-y-4">
        <div className="receipt-controls grid gap-2">
          <label className="text-xs font-bold">Issuer name<input value={issuerName} onChange={(e) => setIssuerName(e.target.value)} className="w-full p-2 border rounded-lg" /></label>
          <label className="text-xs font-bold">Issuer address<input value={issuerAddress} onChange={(e) => setIssuerAddress(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="Address to appear on receipt" /></label>
          <label className="text-xs font-bold">Issuer Tax ID<input value={issuerTaxId} onChange={(e) => setIssuerTaxId(e.target.value)} className="w-full p-2 border rounded-lg" /></label>
          {error && <p className="text-xs text-rose-700">{error}</p>}
          <div className="flex gap-2"><button type="button" onClick={onClose} className="p-2 border rounded-lg">Close</button>
            <button type="button" onClick={handlePrint} className="p-2 bg-blue-600 text-white rounded-lg font-bold">Print / Save as PDF</button></div>
        </div>

        <article id="ptl-payment-receipt" className="border border-slate-200 rounded-xl p-5 sm:p-8 text-slate-900">
          <h1 className="text-xl font-black">ใบรับชำระเงิน / Payment Receipt</h1>
          <p className="mt-2 font-bold">{issuerName || 'Issuer name required'}</p>
          <p className="text-sm">{issuerAddress || 'Issuer address required'}</p>
          <p className="text-xs">เลขประจำตัวผู้เสียภาษี / Tax ID: {issuerTaxId || 'Required'}</p>
          <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
            <div><strong>Receipt No.</strong><br />{payment.receiptNumber || payment.id}</div>
            <div><strong>Receipt issued / วันที่ออก</strong><br />{new Date().toLocaleDateString('en-CA')}</div>
            <div><strong>Date received / วันที่รับเงิน</strong><br />{payment.date}</div>
            <div><strong>Received from</strong><br />{customer?.fullName || customer?.name || payment.customerId}</div>
            <div><strong>{payment.purpose === 'material_advance' ? 'Job / Advance' : 'Invoice'}</strong><br />{payment.purpose === 'material_advance' ? payment.jobId : invoice?.invoiceNumber || payment.invoiceId}</div>
          </div>
          <table className="w-full text-sm mt-6 border-collapse"><thead><tr className="border-b border-slate-400"><th className="text-left py-2">Paid for / รายการ</th><th className="text-right py-2">Received (THB)</th></tr></thead>
            <tbody>{(payment.allocations?.length ? payment.allocations : [{ description: invoice?.items.map((i) => i.description).join(', ') || 'Invoice payment', amount: payment.amount }]).map((line, index) =>
              <tr key={index} className="border-b border-slate-200"><td className="py-2">{line.description}</td><td className="text-right py-2">{line.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>)}</tbody>
          </table>
          <div className="text-right mt-4 text-lg font-black">Total received: ฿{payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          {payment.purpose === 'material_advance' && <p className="text-xs mt-2 font-bold">Material advance received for this job. {payment.appliedInvoiceId ? `Credited to final invoice ${invoice?.invoiceNumber || payment.appliedInvoiceId}.` : 'To be credited to the final invoice when issued.'}</p>}
          <p className="text-xs mt-4">Method: {payment.paymentMethod} {payment.reference ? `· Reference: ${payment.reference}` : ''}</p>
          {!!payment.slips?.length && <p className="text-xs">Transfer evidence: {payment.slips.map((slip) => `${slip.reference || slip.fileName} (฿${slip.amount.toLocaleString()})`).join(' · ')}</p>}
          <p className="mt-6 text-xs text-slate-600">This receipt records this payment only. Invoice balance and other payments are tracked separately.</p>
        </article>
      </div>
    </div>
  );
};
