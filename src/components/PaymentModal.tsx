import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, DollarSign, Calendar, CreditCard, FileText, AlertCircle } from 'lucide-react';
import { Invoice, PaymentMethod, Payment } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  presetInvoiceId?: string | null;
  onRecordPayment: (params: {
    invoiceId: string;
    jobId: string;
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    notes?: string;
    date?: string;
  }) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'PromptPay',
  'Bank Transfer',
  'Cash',
  'Credit Card',
  'Other',
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoices,
  presetInvoiceId,
  onRecordPayment,
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    presetInvoiceId || invoices[0]?.id || ''
  );
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PromptPay');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const targetInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  useEffect(() => {
    setValidationError(null);
    if (presetInvoiceId) {
      setSelectedInvoiceId(presetInvoiceId);
      const inv = invoices.find((i) => i.id === presetInvoiceId);
      if (inv) {
        setAmount(String(inv.balanceDue > 0 ? inv.balanceDue : 0));
      }
    } else if (invoices.length > 0 && !selectedInvoiceId) {
      setSelectedInvoiceId(invoices[0].id);
      setAmount(String(invoices[0].balanceDue > 0 ? invoices[0].balanceDue : 0));
    }
  }, [presetInvoiceId, invoices]);

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    setValidationError(null);
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      setAmount(String(inv.balanceDue > 0 ? inv.balanceDue : 0));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!targetInvoice) {
      setValidationError('Please select a valid invoice');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError('Payment amount must be greater than 0.');
      return;
    }

    if (targetInvoice.balanceDue <= 0) {
      setValidationError('Payment cannot exceed the outstanding balance of ฿0.');
      return;
    }

    if (parsedAmount > (targetInvoice.balanceDue ?? 0)) {
      setValidationError(
        `Payment cannot exceed the outstanding balance of ฿${(targetInvoice.balanceDue ?? 0).toLocaleString()}.`
      );
      return;
    }

    try {
      onRecordPayment({
        invoiceId: targetInvoice.id,
        jobId: targetInvoice.jobId,
        customerId: targetInvoice.customerId,
        amount: parsedAmount,
        paymentMethod,
        reference: reference.trim(),
        notes: notes.trim(),
        date,
      });
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to record payment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative border border-slate-200">
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
            <h2 className="text-lg font-black text-slate-900">Record Payment</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Log deposit or final payment and update invoice balance automatically
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Invoice Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Select Invoice *
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} • ฿{(inv.total ?? 0).toLocaleString()} (Due: ฿{(inv.balanceDue ?? 0).toLocaleString()}) - {inv.status}
                </option>
              ))}
            </select>
            {targetInvoice && (
              <div className="mt-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500">Invoice Total: </span>
                  <strong className="text-slate-900">฿{(targetInvoice.total ?? 0).toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Balance Due: </span>
                  <strong className={(targetInvoice.balanceDue ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    ฿{(targetInvoice.balanceDue ?? 0).toLocaleString()}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
              Payment Method *
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  type="button"
                  key={pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer truncate ${
                    paymentMethod === pm
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Amount Received (฿) *
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
              {targetInvoice && (
                <p className="text-[10px] text-slate-500 mt-1">
                  Max payable: ฿{(targetInvoice.balanceDue ?? 0).toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Date Received
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              />
            </div>
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
                Transfer Ref / Slip / Check No.
              </label>
              <input
                type="text"
                placeholder="e.g. KBANK-88491, PP-9921, or Cash on site"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Notes
              </label>
              <input
                type="text"
                placeholder="e.g. 50% deposit received before parts procurement"
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
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs sm:text-sm font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
