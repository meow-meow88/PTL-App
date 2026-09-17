import React, { useState } from 'react';
import {
  X,
  DollarSign,
  TrendingUp,
  Receipt,
  Plus,
  Trash2,
  FileText,
  CreditCard,
  Percent,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  InspectionJob,
  Expense,
  Invoice,
  Payment,
  calculateJobFinancials,
} from '../types';

interface JobFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: InspectionJob | null;
  expenses: Expense[];
  invoices: Invoice[];
  payments: Payment[];
  onOpenAddExpense: (jobId: string) => void;
  onDeleteExpense: (expenseId: string) => void;
  onCreateInvoice: (job: InspectionJob) => void;
  onOpenInvoice: (invoiceId: string) => void;
  onOpenRecordPayment: (invoiceId: string) => void;
  onUpdateJobPrice: (jobId: string, newPrice: number) => void;
}

export const JobFinancialModal: React.FC<JobFinancialModalProps> = ({
  isOpen,
  onClose,
  job,
  expenses,
  invoices,
  payments,
  onOpenAddExpense,
  onDeleteExpense,
  onCreateInvoice,
  onOpenInvoice,
  onOpenRecordPayment,
  onUpdateJobPrice,
}) => {
  if (!isOpen || !job) return null;

  const jobExpenses = expenses.filter((e) => e.jobId === job.id);
  const jobInvoices = invoices.filter((i) => i.jobId === job.id);
  const jobPayments = payments.filter((p) => p.jobId === job.id);
  const financials = calculateJobFinancials(job, jobExpenses);

  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(String(financials.customerPrice || ''));

  const handleSavePrice = () => {
    const p = parseFloat(priceInput) || 0;
    onUpdateJobPrice(job.id, p);
    setIsEditingPrice(false);
  };

  const getMarginBadge = (margin: number) => {
    if (margin >= 50) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (margin >= 25) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (margin > 0) return 'bg-amber-100 text-amber-900 border-amber-300';
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl relative border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">{job.id}</span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                  job.status === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}
              >
                {job.status}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              Financial Breakdown • {job.villaName}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Top 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Customer Price */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Customer Price
              </span>
              <div className="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5">
                ฿{financials.customerPrice.toLocaleString()}
              </div>
              <button
                onClick={() => {
                  setPriceInput(String(financials.customerPrice || ''));
                  setIsEditingPrice(true);
                }}
                className="text-[10px] font-bold text-blue-600 hover:underline mt-1 cursor-pointer block"
              >
                Edit Price
              </button>
            </div>

            {/* 2. Total Cost */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Total Job Cost
              </span>
              <div className="text-base sm:text-lg font-black text-rose-700 font-mono mt-0.5">
                ฿{financials.totalCost.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {jobExpenses.length} expense items
              </span>
            </div>

            {/* 3. Net Profit */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Net Profit
              </span>
              <div
                className={`text-base sm:text-lg font-black font-mono mt-0.5 ${
                  financials.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                ฿{financials.netProfit.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">In pocket</span>
            </div>

            {/* 4. Profit Margin */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Profit Margin
              </span>
              <div className="mt-1">
                <span
                  className={`text-xs sm:text-sm font-black px-2 py-0.5 rounded border inline-block ${getMarginBadge(
                    financials.profitMargin
                  )}`}
                >
                  {financials.profitMargin}%
                </span>
              </div>
            </div>
          </div>

          {/* Inline Edit Price Modal / Box */}
          {isEditingPrice && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-blue-900 uppercase block mb-1">
                  Adjust Agreed Customer Price (฿)
                </label>
                <input
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900"
                />
              </div>
              <div className="flex items-center gap-1.5 pt-3">
                <button
                  onClick={handleSavePrice}
                  className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingPrice(false)}
                  className="px-3 py-1.5 bg-white text-slate-600 font-bold text-xs border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Cost Category Breakdown */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Cost Breakdown by Category
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Materials</span>
                <strong className="text-slate-900 font-mono">
                  ฿{financials.materialCost.toLocaleString()}
                </strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Fuel / Travel</span>
                <strong className="text-slate-900 font-mono">
                  ฿{financials.travelCost.toLocaleString()}
                </strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Helper</span>
                <strong className="text-slate-900 font-mono">
                  ฿{financials.helperCost.toLocaleString()}
                </strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Vendor</span>
                <strong className="text-slate-900 font-mono">
                  ฿{financials.vendorCost.toLocaleString()}
                </strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Other</span>
                <strong className="text-slate-900 font-mono">
                  ฿{financials.otherCost.toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Job Expenses ({jobExpenses.length})
                </h3>
              </div>
              <button
                onClick={() => onOpenAddExpense(job.id)}
                className="flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Expense</span>
              </button>
            </div>

            {jobExpenses.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No expenses logged for this job yet. Click "+ Add Expense" to track material or fuel costs.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {jobExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 flex items-center justify-between text-xs hover:bg-slate-50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {exp.category}
                        </span>
                        <span className="font-bold text-slate-900">{exp.description}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {exp.date} {exp.notes ? `• ${exp.notes}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-rose-700">
                        ฿{exp.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 cursor-pointer"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices & Payments Section */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Invoices &amp; Payments ({jobInvoices.length})
                </h3>
              </div>
              <button
                onClick={() => onCreateInvoice(job)}
                className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create Invoice</span>
              </button>
            </div>

            {jobInvoices.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No formal invoice created yet. Click "+ Create Invoice" to generate one from this job.
              </div>
            ) : (
              <div className="space-y-2">
                {jobInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : inv.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Due: {inv.dueDate} • Total: ฿{inv.total.toLocaleString()} (Paid: ฿{inv.amountPaid.toLocaleString()})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {inv.balanceDue > 0 && (
                        <button
                          onClick={() => onOpenRecordPayment(inv.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Pay</span>
                        </button>
                      )}
                      <button
                        onClick={() => onOpenInvoice(inv.id)}
                        className="px-2.5 py-1 bg-[#0f1d33] hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
