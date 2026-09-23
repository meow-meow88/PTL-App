import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Filter,
  FileText,
  Calendar,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ExternalLink,
  ChevronRight,
  Percent,
} from 'lucide-react';
import {
  Invoice,
  Payment,
  Expense,
  InspectionJob,
  Customer,
  Property,
} from '../types';
import { PaymentReceiptModal } from './PaymentReceiptModal';

interface MoneyViewProps {
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  jobs: InspectionJob[];
  customers: Customer[];
  properties: Property[];
  onOpenRecordPayment: (invoiceId?: string) => void;
  onOpenAddExpense: (jobId?: string) => void;
  onOpenCreateInvoice: () => void;
  onSelectInvoice: (invoiceId: string) => void;
  onSelectJob: (jobId: string) => void;
  onSelectCustomer: (customerId: string) => void;
  onApplyAdvance: (paymentId: string, invoiceId: string) => Promise<void>;
}

type DateRangeFilter = 'this_month' | 'last_month' | 'this_year' | 'all';
type MoneyTab = 'invoices' | 'payments' | 'expenses' | 'outstanding';

export const MoneyView: React.FC<MoneyViewProps> = ({
  invoices,
  payments,
  expenses,
  jobs,
  customers,
  properties,
  onOpenRecordPayment,
  onOpenAddExpense,
  onOpenCreateInvoice,
  onSelectInvoice,
  onSelectJob,
  onSelectCustomer,
  onApplyAdvance,
}) => {
  const [rangeFilter, setRangeFilter] = useState<DateRangeFilter>('all');
  const [activeTab, setActiveTab] = useState<MoneyTab>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  // Date filtering logic
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const isWithinRange = (dateString?: string) => {
    if (!dateString || rangeFilter === 'all') return true;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return true;

    if (rangeFilter === 'this_month') {
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }
    if (rangeFilter === 'last_month') {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    }
    if (rangeFilter === 'this_year') {
      return d.getFullYear() === currentYear;
    }
    return true;
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const inRange = isWithinRange(inv.issueDate);
      if (!inRange) return false;
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      const customer = customers.find((c) => c.id === inv.customerId);
      const custName = (customer?.name || customer?.fullName || '').toLowerCase();
      const job = jobs.find((j) => j.id === inv.jobId);
      const villaName = (job?.villaName || '').toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(search) ||
        custName.includes(search) ||
        villaName.includes(search) ||
        inv.status.toLowerCase().includes(search)
      );
    });
  }, [invoices, rangeFilter, searchTerm, customers, jobs]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const inRange = isWithinRange(p.date);
      if (!inRange) return false;
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      const customer = customers.find((c) => c.id === p.customerId);
      const custName = (customer?.name || customer?.fullName || '').toLowerCase();
      return (
        (p.reference || '').toLowerCase().includes(search) ||
        p.paymentMethod.toLowerCase().includes(search) ||
        custName.includes(search)
      );
    });
  }, [payments, rangeFilter, searchTerm, customers]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const inRange = isWithinRange(e.date);
      if (!inRange) return false;
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      const job = jobs.find((j) => j.id === e.jobId);
      const villaName = (job?.villaName || '').toLowerCase();
      return (
        e.description.toLowerCase().includes(search) ||
        e.category.toLowerCase().includes(search) ||
        villaName.includes(search)
      );
    });
  }, [expenses, rangeFilter, searchTerm, jobs]);

  // Overall Financial Calculations
  const totalRevenueCollected = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenueCollected - totalExpenses;
  const overallMargin =
    totalRevenueCollected > 0
      ? Math.round((netProfit / totalRevenueCollected) * 1000) / 10
      : 0;

  // Uncollected / Outstanding
  const outstandingInvoices = invoices.filter((inv) => inv.balanceDue > 0 && inv.status !== 'Cancelled');
  const totalToCollect = outstandingInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  const overdueInvoices = outstandingInvoices.filter((inv) => {
    if (inv.status === 'Overdue') return true;
    if (!inv.dueDate) return false;
    const due = new Date(inv.dueDate);
    return due < now;
  });

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
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-12 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#0f1d33] text-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
              SOLO OPERATOR CASH FLOW
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            Money &amp; Profit Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Track customer invoices, material &amp; fuel costs, net profits, and uncollected balances in real-time.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => onOpenRecordPayment()}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>+ RECORD PAYMENT</span>
          </button>

          <button
            onClick={() => onOpenAddExpense()}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>+ ADD EXPENSE</span>
          </button>

          <button
            onClick={onOpenCreateInvoice}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>+ NEW INVOICE</span>
          </button>
        </div>
      </div>

      {/* Range Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Period:</span>
          </span>
          {(['all', 'this_month', 'last_month', 'this_year'] as DateRangeFilter[]).map(
            (rf) => (
              <button
                key={rf}
                onClick={() => setRangeFilter(rf)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  rangeFilter === rf
                    ? 'bg-[#0f1d33] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {rf === 'all'
                  ? 'All Time'
                  : rf === 'this_month'
                  ? 'This Month'
                  : rf === 'last_month'
                  ? 'Last Month'
                  : 'This Year'}
              </button>
            )
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice, customer, item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 4 PRIMARY METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Revenue Collected */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              REVENUE COLLECTED
            </span>
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <DollarSign className="w-4 h-4 text-emerald-700" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 font-mono">
              ฿{totalRevenueCollected.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>{filteredPayments.length} recorded payments</span>
            </div>
          </div>
        </div>

        {/* 2. Total Job Costs / Expenses */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              TOTAL EXPENSES
            </span>
            <span className="p-1.5 bg-rose-100 text-rose-800 rounded-lg">
              <Receipt className="w-4 h-4 text-rose-700" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-700 font-mono">
              ฿{totalExpenses.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              <span>{filteredExpenses.length} expense vouchers</span>
            </div>
          </div>
        </div>

        {/* 3. Net Profit & Margin */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              NET PROFIT
            </span>
            <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-700" />
            </span>
          </div>
          <div className="mt-2">
            <div
              className={`text-2xl font-black font-mono ${
                netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              ฿{netProfit.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className="font-bold text-slate-700">Margin:</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-black text-[10px]">
                {overallMargin}%
              </span>
            </div>
          </div>
        </div>

        {/* 4. To Collect (Outstanding) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              TO COLLECT (UNPAID)
            </span>
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Clock className="w-4 h-4 text-amber-700" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-700 font-mono">
              ฿{totalToCollect.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              {overdueInvoices.length > 0 ? (
                <span className="text-rose-600 font-bold">
                  {overdueInvoices.length} invoices overdue!
                </span>
              ) : (
                <span>Across {outstandingInvoices.length} pending invoices</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TABS: INVOICES, PAYMENTS, EXPENSES, OUTSTANDING */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 pt-3 overflow-x-auto scrollbar-none gap-2">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 px-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Invoices ({filteredInvoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 px-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payments ({filteredPayments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-3 px-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Expenses ({filteredExpenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('outstanding')}
            className={`pb-3 px-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'outstanding'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Follow-up &amp; Overdue ({outstandingInvoices.length})</span>
          </button>
        </div>

        {/* TAB 1: INVOICES */}
        {activeTab === 'invoices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer &amp; Villa</th>
                  <th className="py-3 px-4">Issue / Due</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No invoices found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const customer = customers.find((c) => c.id === inv.customerId);
                    const job = jobs.find((j) => j.id === inv.jobId);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">
                            {customer?.name || customer?.fullName || 'Customer'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {job?.villaName || 'Villa'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-600">
                          <div>Issued: {inv.issueDate}</div>
                          <div className="text-slate-400">Due: {inv.dueDate}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                          ฿{inv.total.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                          ฿{inv.amountPaid.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black">
                          <span className={inv.balanceDue > 0 ? 'text-rose-600' : 'text-slate-400'}>
                            ฿{inv.balanceDue.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border inline-block ${getStatusBadge(
                              inv.status
                            )}`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {inv.balanceDue > 0 && (
                              <button
                                onClick={() => onOpenRecordPayment(inv.id)}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-bold cursor-pointer"
                                title="Record Payment"
                              >
                                + Pay
                              </button>
                            )}
                            <button
                              onClick={() => onSelectInvoice(inv.id)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                              title="View Invoice"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference / Notes</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Invoice</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No payments logged in this period.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const customer = customers.find((c) => c.id === p.customerId);
                    const inv = invoices.find((i) => i.id === p.invoiceId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-slate-900">{p.date}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">
                            {customer?.name || customer?.fullName || 'Customer'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{p.reference || '—'}</div>
                          {p.notes && (
                            <div className="text-[10px] text-slate-400">{p.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                          +฿{p.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {p.purpose === 'material_advance' && !p.appliedInvoiceId ? (
                            <select defaultValue="" aria-label="Credit advance to final invoice" className="max-w-40 p-1 border rounded"
                              onChange={async (e) => { if (!e.target.value) return; try { await onApplyAdvance(p.id, e.target.value); } catch (error) { alert(error instanceof Error ? error.message : 'Could not apply advance.'); e.target.value = ''; } }}>
                              <option value="">Apply to final invoice</option>
                              {invoices.filter((candidate) => candidate.jobId === p.jobId && candidate.customerId === p.customerId && candidate.balanceDue >= p.amount)
                                .map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.invoiceNumber}</option>)}
                            </select>
                          ) : (inv || p.appliedInvoiceId) ? (
                            <button
                              onClick={() => onSelectInvoice((inv?.id || p.appliedInvoiceId)!)}
                              className="text-blue-600 hover:underline text-[11px] font-bold"
                            >
                              {inv?.invoiceNumber || invoices.find((i) => i.id === p.appliedInvoiceId)?.invoiceNumber}
                            </button>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button type="button" onClick={() => setReceiptPayment(p)} className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold">
                            Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Linked Job</th>
                  <th className="py-3 px-4">Receipt / Notes</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No expenses logged in this period.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const job = jobs.find((j) => j.id === exp.jobId);
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-slate-900">{exp.date}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {exp.description}
                        </td>
                        <td className="py-3 px-4">
                          {job ? (
                            <button
                              onClick={() => onSelectJob(job.id)}
                              className="text-blue-600 hover:underline font-medium text-left"
                            >
                              {job.villaName}
                            </button>
                          ) : (
                            <span className="text-slate-400">General</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {exp.notes || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-rose-700 text-sm">
                          ฿{exp.amount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: OUTSTANDING / FOLLOW-UP */}
        {activeTab === 'outstanding' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Uncollected Balances Requiring Action
                </h3>
                <p className="text-xs text-slate-500">
                  Follow up with clients to collect deposits and final invoices
                </p>
              </div>
              <span className="text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                ฿{totalToCollect.toLocaleString()} Pending
              </span>
            </div>

            {outstandingInvoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                All invoices have been paid in full! Great work.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {outstandingInvoices.map((inv) => {
                  const customer = customers.find((c) => c.id === inv.customerId);
                  const job = jobs.find((j) => j.id === inv.jobId);
                  const isOverdue =
                    inv.status === 'Overdue' ||
                    (inv.dueDate && new Date(inv.dueDate) < now);

                  return (
                    <div
                      key={inv.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                        isOverdue
                          ? 'border-rose-300 bg-rose-50/40'
                          : 'border-amber-200 bg-amber-50/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {inv.invoiceNumber}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getStatusBadge(
                              isOverdue ? 'Overdue' : inv.status
                            )}`}
                          >
                            {isOverdue ? 'Overdue' : inv.status}
                          </span>
                        </div>

                        <div className="text-sm font-black text-slate-900">
                          {customer?.name || customer?.fullName || 'Customer'}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {job?.villaName || 'Villa'} • Due: <strong>{inv.dueDate}</strong>
                        </div>
                        {customer?.phone && (
                          <div className="text-[11px] text-slate-500 mt-1">
                            Tel: {customer.phone} | Line: {customer.lineWhatsapp}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Balance Due:</span>
                          <span className="font-mono font-black text-rose-700 text-base">
                            ฿{inv.balanceDue.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenRecordPayment(inv.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                          >
                            + Record Payment
                          </button>
                          <button
                            onClick={() => onSelectInvoice(inv.id)}
                            className="px-3 py-1.5 bg-[#0f1d33] hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {receiptPayment && <PaymentReceiptModal payment={receiptPayment}
        invoice={invoices.find((inv) => inv.id === receiptPayment.invoiceId || inv.id === receiptPayment.appliedInvoiceId)}
        customer={customers.find((c) => c.id === receiptPayment.customerId)}
        onClose={() => setReceiptPayment(null)} />}
    </div>
  );
};
