import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  Clock,
  Calendar,
  Building2,
  User,
  CheckCircle2,
  FileText,
  Wrench,
  ChevronRight,
  Filter,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Receipt,
  CreditCard,
  Percent,
} from 'lucide-react';
import {
  InspectionJob,
  JobStatus,
  Expense,
  Invoice,
  Payment,
  calculateJobFinancials,
} from '../types';

interface JobsViewProps {
  jobs: InspectionJob[];
  expenses: Expense[];
  invoices: Invoice[];
  payments: Payment[];
  onOpenQuickJob: () => void;
  onOpenJobInspection: (jobId: string) => void;
  onOpenJobQuotation: (jobId: string) => void;
  onOpenJobReport: (jobId: string) => void;
  onUpdateJobStatus: (jobId: string, status: JobStatus) => void;
  onOpenFinancials: (jobId: string) => void;
  onOpenAddExpense: (jobId: string) => void;
  onCreateInvoice: (job: InspectionJob) => void;
}

export const JobsView: React.FC<JobsViewProps> = ({
  jobs,
  expenses,
  invoices,
  payments,
  onOpenQuickJob,
  onOpenJobInspection,
  onOpenJobQuotation,
  onOpenJobReport,
  onUpdateJobStatus,
  onOpenFinancials,
  onOpenAddExpense,
  onCreateInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.villaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.propertyLocation && job.propertyLocation.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'waiting_customer') {
      return job.status === 'Quoted' || job.waitingOn === 'customer' || job.waitingOn === 'payment';
    }
    if (statusFilter === 'waiting_vendor') {
      return job.waitingOn === 'vendor' || job.waitingOn === 'parts';
    }
    if (statusFilter === 'in_progress') {
      return job.status === 'In Progress' || job.status === 'Scheduled';
    }
    if (statusFilter === 'inspection') {
      return job.status === 'Inspection';
    }
    if (statusFilter === 'quoted') {
      return job.status === 'Quoted';
    }
    if (statusFilter === 'invoiced') {
      return job.status === 'Invoiced';
    }
    if (statusFilter === 'paid') {
      return job.status === 'Paid';
    }
    if (statusFilter === 'completed') {
      return job.status === 'Completed';
    }
    return true;
  });

  const getMarginBadge = (margin: number) => {
    if (margin >= 50) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (margin >= 25) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (margin > 0) return 'bg-amber-100 text-amber-900 border-amber-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'Completed':
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Invoiced':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Quoted':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'In Progress':
      case 'Scheduled':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Waiting Customer':
      case 'Waiting Vendor':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Inspection':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20 sm:pb-12">
      {/* Header Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-black text-slate-900">
              Jobs &amp; Dispatch
            </h1>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
              {jobs.length} jobs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Solo operator task tracking, job financial profitability, invoices, and inspection records
          </p>
        </div>

        <button
          onClick={onOpenQuickJob}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ NEW JOB</span>
        </button>
      </div>

      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, villa name, service type, or job ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Jobs' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'inspection', label: 'Field Checks' },
            { id: 'quoted', label: 'Quoted' },
            { id: 'invoiced', label: 'Invoiced' },
            { id: 'paid', label: 'Paid' },
            { id: 'completed', label: 'Completed' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-[#0f1d33] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List Grid */}
      <div className="space-y-3">
        {filteredJobs.map((job) => {
          const jobExpenses = expenses.filter((e) => e.jobId === job.id);
          const jobInvoices = invoices.filter((i) => i.jobId === job.id);
          const financials = calculateJobFinancials(job, jobExpenses);

          const hasInvoice = jobInvoices.length > 0;
          const invoiceStatus = hasInvoice ? jobInvoices[0].status : null;

          return (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-4 sm:p-5 shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
            >
              {/* Job Info */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {job.id}
                  </span>

                  {/* Status Dropdown / Badge */}
                  <select
                    value={job.status}
                    onChange={(e) => onUpdateJobStatus(job.id, e.target.value as JobStatus)}
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border font-sans cursor-pointer focus:outline-none ${getStatusBadge(
                      job.status
                    )}`}
                  >
                    <option value="New">New</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Quoted">Quoted</option>
                    <option value="Approved">Approved</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting Customer">Waiting Customer</option>
                    <option value="Waiting Vendor">Waiting Vendor</option>
                    <option value="Completed">Completed</option>
                    <option value="Invoiced">Invoiced</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  {hasInvoice && (
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        invoiceStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : invoiceStatus === 'Overdue'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-purple-100 text-purple-800 border-purple-200'
                      }`}
                    >
                      INV: {invoiceStatus}
                    </span>
                  )}

                  {job.isSimpleJob && (
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Quick Job
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-900 transition-colors">
                    {job.villaName || job.propertyLocation}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    ({job.customerName})
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium line-clamp-1">
                  {job.serviceType}
                  {job.requestDescription ? ` — ${job.requestDescription}` : ''}
                </p>

                {/* Date & Service Meta */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {job.scheduledDate || job.inspectionDate || 'Today'}
                  </span>
                  {job.scheduledTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {job.scheduledTime}
                    </span>
                  )}
                  <span>
                    Findings: <strong>{job.items?.length || 0}</strong>
                  </span>
                </div>

                {/* PHASE 2: FINANCIAL PILLS STRIP */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-800 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                    Price: <span className="font-mono font-black">฿{financials.customerPrice.toLocaleString()}</span>
                  </div>

                  <div className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
                    Cost: <span className="font-mono">฿{financials.totalCost.toLocaleString()}</span>
                  </div>

                  <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    Profit: <span className="font-mono font-black">฿{financials.netProfit.toLocaleString()}</span>
                  </div>

                  {financials.customerPrice > 0 && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded border ${getMarginBadge(
                        financials.profitMargin
                      )}`}
                    >
                      {financials.profitMargin}% margin
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <button
                  onClick={() => onOpenFinancials(job.id)}
                  className="px-3 py-2 text-xs font-black bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  title="View complete financial breakdown"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Financials</span>
                </button>

                <button
                  onClick={() => onOpenAddExpense(job.id)}
                  className="px-2.5 py-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  title="Log material or fuel cost"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>+ Cost</span>
                </button>

                <button
                  onClick={() => onOpenJobInspection(job.id)}
                  className="px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Open field inspection, photos, and findings"
                >
                  Inspect ({job.items?.length || 0})
                </button>

                <button
                  onClick={() => onOpenJobQuotation(job.id)}
                  className="px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer"
                  title="Open quotation"
                >
                  Quote
                </button>

                <button
                  onClick={() => onOpenJobReport(job.id)}
                  className="px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-2xs transition-colors cursor-pointer"
                  title="Preview and generate 3 bilingual PDFs"
                >
                  3 PDF
                </button>

                <button
                  onClick={() =>
                    onUpdateJobStatus(
                      job.id,
                      job.status === 'Completed' ? 'In Progress' : 'Completed'
                    )
                  }
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    job.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-white text-slate-400 hover:text-slate-700 border-slate-200'
                  }`}
                  title={job.status === 'Completed' ? 'Mark as In Progress' : 'Mark as Completed'}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <p className="text-sm">No jobs found matching your criteria.</p>
            <button
              onClick={onOpenQuickJob}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Job</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
