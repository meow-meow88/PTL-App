import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  CreditCard,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  DollarSign,
  Share2,
  Loader2,
} from 'lucide-react';
import { Invoice, Payment, Customer, Property, InspectionJob } from '../types';
import { useCustomLogo } from '../utils/useCustomLogo';
import { generatePdfFromElement } from '../utils/pdfGenerator';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  job?: InspectionJob;
  customer?: Customer;
  property?: Property;
  payments: Payment[];
  onOpenRecordPayment: (invoiceId: string) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  job,
  customer,
  property,
  payments,
  onOpenRecordPayment,
}) => {
  const { logoUrl, fallbackLogoUrl } = useCustomLogo();
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen || !invoice) return null;

  const invoicePayments = payments.filter((p) => p.invoiceId === invoice.id);
  const totalPaid = invoicePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const balanceDue = Math.max(0, invoice.total - totalPaid);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current || !invoice) return;
    try {
      setIsGeneratingPdf(true);
      const filename = `${invoice.invoiceNumber}_${(customer?.fullName || 'Client').replace(/\s+/g, '_')}.pdf`;
      await generatePdfFromElement(printRef.current, filename);
    } catch (err) {
      console.error('Invoice PDF generation failed:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Partially Paid':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Overdue':
        return 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
      case 'Sent':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Draft':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl relative border border-slate-200 my-auto flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-black text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200">
              {invoice.invoiceNumber}
            </span>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getStatusBadge(
                invoice.status
              )}`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenRecordPayment(invoice.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>+ Record Payment</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="Download clean A4 PDF file"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f1d33] hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Body */}
        <div
          ref={printRef}
          className="p-6 sm:p-8 overflow-y-auto flex-1 text-slate-900 bg-white print:p-8"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b-2 border-slate-800">
            <div className="flex items-center gap-3">
              <img
                src={logoUrl || fallbackLogoUrl}
                alt="Phuket Trusted Local"
                className="w-12 h-12 rounded-xl object-contain border border-slate-200 p-1"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  PHUKET TRUSTED LOCAL
                </h1>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Villa Technical Operations &amp; Support Services
                </p>
                <p className="text-[10px] text-slate-400">
                  Kathu / Nai Harn / Patong / Cherngtalay • Phuket, Thailand
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-2xl font-black text-slate-900 block tracking-tight">
                TAX INVOICE / RECEIPT
              </span>
              <span className="text-xs font-mono font-bold text-blue-600 block">
                {invoice.invoiceNumber}
              </span>
              <div className="text-xs text-slate-500 mt-1">
                <div>Date: <strong>{invoice.issueDate}</strong></div>
                <div>Due Date: <strong>{invoice.dueDate}</strong></div>
              </div>
            </div>
          </div>

          {/* Client & Job Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Billed To (Customer)
              </span>
              <div className="text-sm font-black text-slate-900">
                {customer?.name || customer?.fullName || job?.customerName || 'Valued Client'}
              </div>
              <div className="text-slate-600 mt-0.5">
                {customer?.email && <div>Email: {customer.email}</div>}
                {customer?.phone && <div>Tel: {customer.phone}</div>}
                {customer?.lineWhatsapp && <div>Line/WA: {customer.lineWhatsapp}</div>}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Property / Service Location
              </span>
              <div className="text-sm font-black text-slate-900">
                {property?.name || property?.propertyName || job?.villaName || 'Site Location'}
              </div>
              <div className="text-slate-600 mt-0.5">
                <div>{property?.address || job?.propertyLocation || 'Phuket, Thailand'}</div>
                {property?.area && <div className="text-slate-500">Area: {property.area}</div>}
                <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                  Job Ref: {invoice.jobId}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-[11px] font-black uppercase text-slate-600">
                  <th className="py-2.5 w-10 text-center">#</th>
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center w-20">Qty</th>
                  <th className="py-2.5 text-right w-24">Unit Price</th>
                  <th className="py-2.5 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-3 text-center text-slate-400 font-mono font-bold">
                      {item.item || idx + 1}
                    </td>
                    <td className="py-3 pr-2">
                      <div className="font-bold text-slate-900">{item.description}</div>
                      {item.detail && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.detail}</div>
                      )}
                    </td>
                    <td className="py-3 text-center text-slate-600 font-medium">{item.qty}</td>
                    <td className="py-3 text-right text-slate-600 font-mono">
                      ฿{((item.unitPrice || item.amount) / (typeof item.qty === 'number' ? item.qty : 1)).toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-black text-slate-900 font-mono">
                      ฿{item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Calculation */}
          <div className="border-t-2 border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-start gap-6">
            {/* Payment Details */}
            <div className="w-full sm:w-1/2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block">
                Direct Payment Information
              </span>
              <div className="text-slate-700">
                <strong>Bank:</strong> Kasikorn Bank (KBANK)
              </div>
              <div className="text-slate-700">
                <strong>Account Name:</strong> Phuket Trusted Local
              </div>
              <div className="text-slate-700 font-mono">
                <strong>Account No:</strong> 098-2-44129-0
              </div>
              <div className="text-slate-700 font-mono">
                <strong>PromptPay:</strong> 081-992-4412
              </div>
              <div className="text-[10px] text-slate-500 pt-1">
                * Please send transfer slip via WhatsApp or Line for instant receipt reconciliation.
              </div>
            </div>

            {/* Sum breakdown */}
            <div className="w-full sm:w-5/12 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold">฿{invoice.subtotal.toLocaleString()}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span className="font-mono font-bold">-฿{invoice.discount.toLocaleString()}</span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>VAT (7%):</span>
                  <span className="font-mono font-bold">฿{invoice.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-2 border-t border-slate-300">
                <span>Total Amount:</span>
                <span className="font-mono text-blue-900">฿{invoice.total.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-emerald-700 font-bold pt-1">
                <span>Amount Paid:</span>
                <span className="font-mono">฿{totalPaid.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-sm font-black p-2.5 rounded-xl bg-slate-100 border border-slate-300">
                <span className={balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                  Balance Due:
                </span>
                <span
                  className={`font-mono text-base ${
                    balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  ฿{balanceDue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History on this Invoice */}
          {invoicePayments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-[11px] font-bold uppercase text-slate-500 mb-2">
                Recorded Payments ({invoicePayments.length})
              </h4>
              <div className="space-y-1.5">
                {invoicePayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{p.date}</span>
                      <span className="text-slate-500 ml-2">• {p.paymentMethod}</span>
                      {p.reference && (
                        <span className="text-slate-600 ml-1">({p.reference})</span>
                      )}
                    </div>
                    <span className="font-mono font-black text-emerald-800">
                      +฿{p.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {invoice.notes && (
            <div className="mt-4 p-3 rounded-lg bg-slate-50 text-[11px] text-slate-500 italic">
              <strong>Notes:</strong> {invoice.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
