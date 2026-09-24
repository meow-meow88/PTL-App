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
  Edit2,
  Check,
  MapPin,
} from 'lucide-react';
import {
  InspectionJob,
  JobStatus,
  Expense,
  Invoice,
  Payment,
  Vendor,
  calculateJobFinancials,
  getOwnerStatusLabel,
} from '../types';
import { useLanguage } from '../i18n/translations';

interface JobsViewProps {
  jobs: InspectionJob[];
  expenses: Expense[];
  invoices: Invoice[];
  payments: Payment[];
  vendors?: Vendor[];
  onOpenQuickJob: () => void;
  onOpenJobInspection: (jobId: string) => void;
  onOpenJobQuotation: (jobId: string) => void;
  onOpenJobReport: (jobId: string) => void;
  onUpdateJobStatus: (jobId: string, status: JobStatus) => void;
  onOpenFinancials: (jobId: string) => void;
  onOpenAddExpense: (jobId: string) => void;
  onCreateInvoice: (job: InspectionJob) => void;
  onOpenAssignVendorModal?: (job: InspectionJob) => void;
  onOpenScheduleModal?: (job: InspectionJob) => void;
  onConfirmAppointment?: (jobId: string) => void;
  onOpenEditJob?: (job: InspectionJob) => void;
}

export const JobsView: React.FC<JobsViewProps> = ({
  jobs,
  expenses,
  invoices,
  payments,
  vendors = [],
  onOpenQuickJob,
  onOpenJobInspection,
  onOpenJobQuotation,
  onOpenJobReport,
  onUpdateJobStatus,
  onOpenFinancials,
  onOpenAddExpense,
  onCreateInvoice,
  onOpenAssignVendorModal,
  onOpenScheduleModal,
  onConfirmAppointment,
  onOpenEditJob,
}) => {
  const { lang } = useLanguage();
  const isTh = lang === 'th';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.villaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.serviceArea && job.serviceArea.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
              {isTh ? 'งานทั้งหมด' : 'Jobs & Dispatch'}
            </h1>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
              {jobs.length} {isTh ? 'งาน' : 'jobs'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTh ? 'ติดตามสถานะงาน นัดหมาย และผลตรวจหน้างาน' : 'Solo operator task tracking, job financial profitability, invoices, and inspection records'}
          </p>
        </div>

        <button
          onClick={onOpenQuickJob}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{isTh ? 'เพิ่มงาน' : 'New Job'}</span>
        </button>
      </div>

      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isTh ? 'ค้นหาลูกค้า วิลล่า ประเภทงาน หรือรหัสงาน...' : 'Search by customer, villa name, service type, or job ID...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          {[
            { id: 'all', label: isTh ? 'ทั้งหมด' : 'All Jobs' },
            { id: 'in_progress', label: isTh ? 'กำลังทำ' : 'In Progress' },
            { id: 'inspection', label: isTh ? 'งานตรวจ' : 'Field Checks' },
            { id: 'quoted', label: isTh ? 'เสนอราคาแล้ว' : 'Quoted' },
            { id: 'invoiced', label: isTh ? 'แจ้งหนี้แล้ว' : 'Invoiced' },
            { id: 'paid', label: isTh ? 'ชำระแล้ว' : 'Paid' },
            { id: 'completed', label: isTh ? 'เสร็จแล้ว' : 'Completed' },
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
          const assignedVendor = vendors.find((v) => v.id === job.vendorId);

          const hasInvoice = jobInvoices.length > 0;
          const invoiceStatus = hasInvoice ? jobInvoices[0].status : null;

          return (
            <div
              key={job.id}
              onClick={() => onOpenJobInspection(job.id)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 group cursor-pointer active:scale-[0.99]"
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
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateJobStatus(job.id, e.target.value as JobStatus)}
                    className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-lg border font-sans cursor-pointer focus:outline-none ${getStatusBadge(
                      job.status
                    )}`}
                  >
                    <option value="New">{getOwnerStatusLabel('New', isTh)}</option>
                    <option value="Scheduled">{getOwnerStatusLabel('Scheduled', isTh)}</option>
                    <option value="In Progress">{getOwnerStatusLabel('In Progress', isTh)}</option>
                    <option value="Inspection">{getOwnerStatusLabel('Inspection', isTh)}</option>
                    <option value="Quoted">{getOwnerStatusLabel('Quoted', isTh)}</option>
                    <option value="Waiting Customer">{getOwnerStatusLabel('Waiting Customer', isTh)}</option>
                    <option value="Waiting Vendor">{getOwnerStatusLabel('Waiting Vendor', isTh)}</option>
                    <option value="Approved">{getOwnerStatusLabel('Approved', isTh)}</option>
                    <option value="Completed">{getOwnerStatusLabel('Completed', isTh)}</option>
                    <option value="Invoiced">{getOwnerStatusLabel('Invoiced', isTh)}</option>
                    <option value="Partially Paid">{getOwnerStatusLabel('Partially Paid', isTh)}</option>
                    <option value="Paid">{getOwnerStatusLabel('Paid', isTh)}</option>
                    <option value="Cancelled">{getOwnerStatusLabel('Cancelled', isTh)}</option>
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
                      {isTh ? 'ใบแจ้งหนี้: ' : 'INV: '}{getOwnerStatusLabel(invoiceStatus as JobStatus, isTh)}
                    </span>
                  )}

                  {job.isSimpleJob && (
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {isTh ? 'งานด่วน' : 'Quick Job'}
                    </span>
                  )}

                  {/* Confirmation Badge */}
                  {job.appointmentConfirmation === 'Confirmed' || job.isConfirmed ? (
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {isTh ? 'ยืนยันแล้ว' : 'Confirmed'}
                    </span>
                  ) : job.scheduledDate ? (
                    onConfirmAppointment ? (
                      <button
                        onClick={() => onConfirmAppointment(job.id)}
                        className="text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-300 cursor-pointer flex items-center gap-1"
                        title={isTh ? 'กดเพื่อยืนยันนัด' : 'Click to mark appointment confirmed'}
                      >
                        <span>⏳ {isTh ? 'ยังไม่ยืนยัน • ยืนยัน?' : 'Unconfirmed • Confirm?'}</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        ⏳ {isTh ? 'ยังไม่ยืนยัน' : 'Unconfirmed'}
                      </span>
                    )
                  ) : null}

                  {/* Phase 3 Assigned Vendor Badge */}
                  {assignedVendor && (
                    <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                      <Wrench className="w-2.5 h-2.5" />
                      {assignedVendor.name}
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
                  {job.serviceArea && (
                    <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium text-[11px]">
                      <MapPin className="w-3 h-3 text-blue-500" />
                      {job.serviceArea}
                    </span>
                  )}
                  <span>
                    {isTh ? 'ผลตรวจ: ' : 'Findings: '}<strong>{job.items?.length || 0}</strong>
                  </span>
                </div>

                {/* FINANCIAL PILLS STRIP */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  {financials.customerPrice > 0 ? (
                    <div className="text-xs font-bold text-slate-800 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                      {isTh ? 'ราคา: ' : 'Price: '}<span className="font-mono font-black">฿{financials.customerPrice.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                      {isTh ? 'ราคา: ' : 'Price: '}<span className="italic">{isTh ? 'ยังไม่เสนอราคา' : 'Pending'}</span>
                    </div>
                  )}

                  {financials.hasCostEntered ? (
                    <>
                      <div className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
                        {isTh ? 'ต้นทุน: ' : 'Cost: '}<span className="font-mono">฿{financials.totalCost.toLocaleString()}</span>
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
                    </>
                  ) : (
                    <div className="text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                      {isTh ? 'ต้นทุน: ' : 'Cost: '}<span className="italic">{isTh ? 'ยังไม่ได้บันทึกต้นทุน' : 'Not entered'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100"
              >
                {onOpenEditJob && (
                  <button
                    onClick={() => onOpenEditJob(job)}
                    className="min-h-[40px] px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    title={isTh ? 'แก้ไขข้อมูลงาน' : 'Edit job details'}
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isTh ? 'แก้ไข' : 'Edit'}</span>
                  </button>
                )}

                {onOpenScheduleModal && (
                  <button
                    onClick={() => onOpenScheduleModal(job)}
                    className="min-h-[40px] px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    title="Schedule date, time & reminders"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isTh ? 'นัดหมาย' : 'Schedule'}</span>
                  </button>
                )}

                {onOpenAssignVendorModal && (
                  <button
                    onClick={() => onOpenAssignVendorModal(job)}
                    className="px-2.5 py-2 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    title="Assign or change subcontractor vendor"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{isTh ? (job.vendorId ? 'ช่าง' : '+ ช่าง') : (job.vendorId ? 'Vendor' : '+ Vendor')}</span>
                  </button>
                )}

                <button
                  onClick={() => onOpenFinancials(job.id)}
                  className="px-3 py-2 text-xs font-black bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  title="View complete financial breakdown"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{isTh ? 'การเงิน' : 'Financials'}</span>
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
            <p className="text-sm">{isTh ? 'ไม่พบงานที่ตรงกับคำค้นหา' : 'No jobs found matching your criteria.'}</p>
            <button
              onClick={onOpenQuickJob}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isTh ? 'สร้างงานใหม่' : 'Create New Job'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
