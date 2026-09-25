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
import { getDominantJobState, getPrimaryJobAction, getLocalizedServiceName } from '../utils/serviceWorkflow';

interface JobsViewProps {
  jobs: InspectionJob[];
  expenses: Expense[];
  invoices: Invoice[];
  payments: Payment[];
  vendors?: Vendor[];
  onOpenQuickJob: () => void;
  onOpenJobInspection: (jobId: string) => void;
  onOpenCustomerResponse?: (jobId: string) => void;
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
  onOpenCustomerResponse,
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
          const stage = getDominantJobState(job, lang);
          const action = getPrimaryJobAction(job, lang);
          const assignedVendor = vendors.find((vendor) => vendor.id === job.vendorId);
          const goNext = () => {
            switch (action.type) {
              case 'create_inspection_quote':
              case 'create_quote':
              case 'quick_quote':
              case 'send_quote':
                onOpenJobQuotation(job.id);
                break;
              case 'schedule_job':
              case 'confirm_appointment':
                if (onOpenScheduleModal) onOpenScheduleModal(job);
                else onOpenJobInspection(job.id);
                break;
              case 'create_invoice_collect':
                onCreateInvoice(job);
                break;
              case 'record_customer_response':
                if (onOpenCustomerResponse) onOpenCustomerResponse(job.id);
                else onOpenJobInspection(job.id);
                break;
              // Customer decisions and field completion require their dedicated
              // workspace controls; opening the job must never approve or close it.
              default:
                onOpenJobInspection(job.id);
            }
          };
          return (
            <article key={job.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <div className="min-w-0 flex items-start justify-between gap-2">
                <button type="button" onClick={() => onOpenJobInspection(job.id)} className="min-w-0 text-left flex-1">
                  <span className="text-[11px] font-mono font-bold text-slate-500 break-all">{job.id}</span>
                  <h2 className="text-base font-extrabold text-slate-900 truncate">{job.villaName || job.propertyLocation || job.customerName}</h2>
                  <p className="text-xs text-slate-600 truncate">{getLocalizedServiceName(job.serviceType, lang)} · {job.customerName}</p>
                </button>
                <span className={`shrink-0 rounded-lg px-2 py-1 text-[11px] ${stage.badgeClass}`}>{stage.label}</span>
              </div>
              {job.requestDescription && <p className="text-xs text-slate-600 line-clamp-2">{job.requestDescription}</p>}
              <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                <span>{job.scheduledDate || (isTh ? 'ยังไม่ได้นัด' : 'Not scheduled')}{job.scheduledTime ? ` · ${job.scheduledTime}` : ''}</span>
                {job.serviceArea && <span>{job.serviceArea}</span>}
                {assignedVendor && <span>{isTh ? 'ช่าง: ' : 'Vendor: '}{assignedVendor.name}</span>}
              </div>
              <div className="flex gap-2 items-center">
                <button type="button" onClick={goNext} className={`min-h-[44px] min-w-0 flex-1 rounded-xl px-3 py-2 text-sm truncate ${action.buttonClass}`}>
                  {action.label} <span aria-hidden="true">→</span>
                </button>
                <details className="relative group/actions" onClick={(event) => event.stopPropagation()}>
                  <summary className="list-none cursor-pointer min-h-[44px] rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">
                    {isTh ? 'เพิ่มเติม' : 'More'}
                  </summary>
                  <div className="absolute right-0 top-full mt-1 z-20 w-48 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-1 shadow-xl flex flex-col">
                    <button type="button" onClick={() => onOpenJobInspection(job.id)} className="text-left p-2 text-xs rounded-lg hover:bg-slate-50">{isTh ? 'เปิดรายละเอียดงาน' : 'Open job'}</button>
                    {onOpenEditJob && <button type="button" onClick={() => onOpenEditJob(job)} className="text-left p-2 text-xs rounded-lg hover:bg-slate-50">{isTh ? 'แก้ไขข้อมูลงาน' : 'Edit job'}</button>}
                    {onOpenScheduleModal && <button type="button" onClick={() => onOpenScheduleModal(job)} className="text-left p-2 text-xs rounded-lg hover:bg-slate-50">{isTh ? 'นัดหมาย' : 'Schedule'}</button>}
                    {onOpenAssignVendorModal && <button type="button" onClick={() => onOpenAssignVendorModal(job)} className="text-left p-2 text-xs rounded-lg hover:bg-slate-50">{isTh ? 'ประสานงานช่าง' : 'Vendor'}</button>}
                    <button type="button" onClick={() => onOpenJobQuotation(job.id)} className="text-left p-2 text-xs rounded-lg hover:bg-slate-50">{isTh ? 'ใบเสนอราคา' : 'Quotation'}</button>
                    <button type="button" onClick={() => onOpenJobReport(job.id)} className="text-left p-2 text-xs rounded-lg hover:bg-slate-50">{isTh ? 'เอกสารงาน' : 'Documents'}</button>
                    <button type="button" onClick={() => onOpenFinancials(job.id)} className="text-left p-2 text-xs rounded-lg hover:bg-slate-50">{isTh ? 'ดูการเงินของงาน' : 'Job finances'}</button>
                    <button type="button" onClick={() => onOpenAddExpense(job.id)} className="text-left p-2 text-xs rounded-lg hover:bg-slate-50">{isTh ? 'บันทึกต้นทุน' : 'Add cost'}</button>
                    <label className="border-t border-slate-100 mt-1 p-2 text-[11px] text-slate-600">
                      {isTh ? 'ปรับสถานะด้วยตนเอง' : 'Change status manually'}
                      <select value={job.status} onChange={(event) => onUpdateJobStatus(job.id, event.target.value as JobStatus)} className="block w-full mt-1 border border-slate-200 rounded-lg p-2 text-xs text-slate-800">
                        {(['New', 'Scheduled', 'In Progress', 'Inspection', 'Quoted', 'Waiting Customer', 'Waiting Vendor', 'Approved', 'Completed', 'Invoiced', 'Partially Paid', 'Paid', 'Cancelled'] as JobStatus[]).map((status) =>
                          <option key={status} value={status}>{getOwnerStatusLabel(status, isTh)}</option>)}
                      </select>
                    </label>
                  </div>
                </details>
              </div>
            </article>
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
