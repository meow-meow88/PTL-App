import React from 'react';
import {
  CalendarDays,
  Clock,
  AlertCircle,
  Plus,
  CheckCircle2,
  Calendar,
  DollarSign,
  Phone,
  MessageSquare,
  Truck,
  FileText,
  Building2,
  Check,
  Receipt,
  Play,
  CreditCard,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  InspectionJob,
  Customer,
  Property,
  Invoice,
  Vendor,
  RecurringService,
  Task,
} from '../types';
import { useLanguage } from '../i18n/translations';
import { JobCard } from './JobCard';
import { formatDateDisplay, formatTime24h } from '../utils/dateTime';
import { getLocalizedServiceName, getDominantJobState } from '../utils/serviceWorkflow';

interface MyDayViewProps {
  jobs: InspectionJob[];
  customers: Customer[];
  properties: Property[];
  invoices?: Invoice[];
  vendors?: Vendor[];
  recurringServices?: RecurringService[];
  tasks?: Task[];
  onOpenJobInspection: (jobId: string) => void;
  onOpenJobQuotation: (jobId: string) => void;
  onOpenQuickJob: () => void;
  onOpenUrgentJob?: () => void;
  onSelectCustomer: (customerId: string) => void;
  onSelectProperty: (propertyId: string) => void;
  onSelectInvoice?: (invoiceId: string) => void;
  onUpdateJobStatus?: (jobId: string, status: InspectionJob['status']) => void;
  onUpdateTaskStatus?: (taskId: string, status: Task['status']) => void;
  onOpenScheduleModal?: (job: InspectionJob) => void;
  onOpenRecurringModal?: () => void;
  onOpenAssignVendorModal?: (job: InspectionJob) => void;
  onConfirmAppointment?: (jobId: string) => void;
  onOpenCompactAppointment?: (job: InspectionJob) => void;
  onOpenEditJob?: (job: InspectionJob) => void;
  onCustomerApprove?: (jobId: string) => void;
  onFinishFieldWork?: (jobId: string) => void;
}

export const MyDayView: React.FC<MyDayViewProps> = ({
  jobs,
  customers,
  properties,
  invoices = [],
  vendors = [],
  recurringServices = [],
  tasks = [],
  onOpenJobInspection,
  onOpenJobQuotation,
  onOpenQuickJob,
  onOpenUrgentJob,
  onSelectCustomer,
  onSelectProperty,
  onSelectInvoice,
  onUpdateJobStatus,
  onOpenScheduleModal,
  onOpenRecurringModal,
  onOpenAssignVendorModal,
  onConfirmAppointment,
  onOpenCompactAppointment,
  onOpenEditJob,
  onCustomerApprove,
  onFinishFieldWork,
}) => {
  const { lang, t } = useLanguage();
  const isTh = lang === 'th';

  // 4 simple filter pills for Today's Jobs (Requirement 2)

  // Dates normalization
  const now = new Date();
  const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayStr = localDate(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = localDate(tomorrow);

  // Formatted Header Date
  const headerDateString = now.toLocaleDateString(isTh ? 'th-TH' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: isTh ? undefined : 'numeric',
  });

  // Time of day greeting
  const currentHour = now.getHours();
  const greeting = isTh
    ? currentHour < 12
      ? 'สวัสดีตอนเช้า'
      : currentHour < 18
      ? 'สวัสดีตอนบ่าย'
      : 'สวัสดีตอนค่ำ'
    : currentHour < 12
    ? 'Good Morning'
    : currentHour < 18
    ? 'Good Afternoon'
    : 'Good Evening';

  // Helper maps for O(1) lookups
  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));
  const propertyMap = new Map<string, Property>();
  properties.forEach((p) => propertyMap.set(p.id, p));
  const vendorMap = new Map<string, Vendor>();
  vendors.forEach((v) => vendorMap.set(v.id, v));

  // Phone and WhatsApp link generator
  const cleanPhone = (p?: string) => (p || '').replace(/[^0-9+]/g, '');
  const makeWhatsappUrl = (p?: string, text?: string) => {
    const phone = cleanPhone(p).replace(/^\+/, '');
    if (!phone) return undefined;
    return `https://wa.me/${phone}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  };

  // =========================================================================
  // 1. ACTIVE JOBS (In Progress)
  // =========================================================================
  const activeJobs = jobs.filter((j) => getDominantJobState(j).key === 'in_progress');
  const pendingKeys = new Set(['new', 'waiting_scope', 'scope_confirmed', 'quote_drafted',
    'waiting_approval', 'waiting_vendor', 'approved_to_schedule', 'scheduled_unconfirmed']);
  const pendingJobs = jobs.filter((j) => pendingKeys.has(getDominantJobState(j).key))
    .sort((a, b) => (b.urgency === 'Urgent' ? 1 : 0) - (a.urgency === 'Urgent' ? 1 : 0) ||
      (a.createdAt || '').localeCompare(b.createdAt || ''));

  // =========================================================================
  // 2. TODAY'S JOBS
  // =========================================================================
  const isJobToday = (j: InspectionJob) => {
    const date = j.scheduledDate || j.inspectionDate;
    return date === todayStr || date === 'Today' || date === 'วันนี้';
  };

  const todayAllJobs = jobs.filter(isJobToday);

  const filteredTodayJobs = todayAllJobs.filter((j) =>
    !pendingJobs.includes(j) && !activeJobs.includes(j) &&
    !['Completed', 'Cancelled'].includes(j.status) &&
    !['waiting_payment', 'ready_to_close'].includes(getDominantJobState(j).key));

  // =========================================================================
  // 3. UPCOMING JOBS (Tomorrow & Next 7 Days)
  // =========================================================================
  const upcomingJobs = jobs
    .filter((j) => {
      const date = j.scheduledDate || j.inspectionDate;
      if (!date || isJobToday(j) || pendingJobs.includes(j) || activeJobs.includes(j)) return false;
      return date >= tomorrowStr && j.status !== 'Completed' && j.status !== 'Cancelled';
    })
    .sort((a, b) => {
      const dateA = a.scheduledDate || a.inspectionDate || '';
      const dateB = b.scheduledDate || b.inspectionDate || '';
      return dateA.localeCompare(dateB);
    })
    .slice(0, 6);

  return (
    <div className="max-w-4xl mx-auto space-y-5 px-3 sm:px-6 py-4 pb-16 w-full min-w-0 overflow-x-hidden">
      {/* ========================================================================= */}
      {/* GREETING / DATE & PROMINENT "+ NEW JOB" (Section 1) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {greeting}, PTL
            </h1>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
              {isTh ? 'ศูนย์ประจำวัน' : 'Daily Ops'}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{headerDateString}</span>
          </p>
        </div>

        {/* FAST ACTION BUTTONS: [ ⚡ URGENT JOB ] and [ + NEW JOB ] */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenUrgentJob && (
            <button
              id="my-day-btn-urgent-job"
              type="button"
              onClick={onOpenUrgentJob}
              className="min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-98 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
              <span>{isTh ? '⚡ งานด่วน' : '⚡ Urgent Job'}</span>
            </button>
          )}

          {/* PROMINENT + NEW JOB BUTTON (≥44px touch target) */}
          <button
            id="my-day-btn-new-job"
            type="button"
            onClick={onOpenQuickJob}
            className="min-h-[44px] px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer ring-2 ring-blue-400/40 shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3] shrink-0" />
            <span>{t.actions.newJob}</span>
          </button>
        </div>
      </div>

      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-xs w-full min-w-0">
        <h2 className="text-base font-extrabold text-slate-900 mb-3">{isTh ? 'งานที่ต้องทำต่อ' : 'Next actions'} ({pendingJobs.length})</h2>
        {pendingJobs.length === 0 ? <p className="text-sm text-slate-500">{isTh ? 'ไม่มีงานค้างที่ต้องดำเนินการ' : 'No pending jobs'}</p> : (
          <div className="space-y-3">
            {pendingJobs.map((job) => <JobCard key={job.id} job={job}
              customer={customerMap.get(job.customerId)} property={propertyMap.get(job.propertyId)}
              vendor={job.vendorId ? vendorMap.get(job.vendorId) : undefined}
              onOpenInspection={onOpenJobInspection} onOpenQuotation={onOpenJobQuotation}
              onOpenScheduleModal={onOpenScheduleModal} onOpenAssignVendorModal={onOpenAssignVendorModal}
              onConfirmAppointment={onConfirmAppointment} onOpenCompactAppointment={onOpenCompactAppointment}
              onOpenEditJob={onOpenEditJob} onUpdateJobStatus={onUpdateJobStatus}
              onCustomerApprove={onCustomerApprove} onFinishFieldWork={onFinishFieldWork}
              onSelectProperty={onSelectProperty} onSelectCustomer={onSelectCustomer} />)}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 2. ACTIVE JOBS SECTION (Pinned In-Progress Jobs) */}
      {/* ========================================================================= */}
      {activeJobs.length > 0 && (
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-sm w-full min-w-0">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-wide uppercase">
                {t.myDay.activeJobs}
              </h2>
            </div>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-600 text-white">
              {activeJobs.length} {isTh ? 'งานกำลังทำ' : 'In Progress'}
            </span>
          </div>

          <div className="space-y-3">
            {activeJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                customer={customerMap.get(job.customerId)}
                property={propertyMap.get(job.propertyId)}
                vendor={job.vendorId ? vendorMap.get(job.vendorId) : undefined}
                onOpenInspection={onOpenJobInspection}
                onOpenQuotation={onOpenJobQuotation}
                onOpenScheduleModal={onOpenScheduleModal}
                onOpenAssignVendorModal={onOpenAssignVendorModal}
                onConfirmAppointment={onConfirmAppointment}
                onOpenCompactAppointment={onOpenCompactAppointment}
                onOpenEditJob={onOpenEditJob}
                onUpdateJobStatus={onUpdateJobStatus}
                onCustomerApprove={onCustomerApprove}
                onFinishFieldWork={onFinishFieldWork}
                onSelectProperty={onSelectProperty}
                onSelectCustomer={onSelectCustomer}
              />
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. TODAY'S JOBS SECTION */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs w-full min-w-0">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-900">
              <CalendarDays className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-wide uppercase">
              {t.myDay.todayJobs}
            </h2>
          </div>
          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-900 text-white">
            {filteredTodayJobs.length} {isTh ? 'งานวันนี้' : 'Jobs'}
          </span>
        </div>

        {/* Jobs List */}
        {filteredTodayJobs.length === 0 ? (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200/80">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-800">{t.myDay.noJobsToday}</div>
            <p className="text-xs text-slate-500 mt-1 mb-3">
              {isTh ? 'ต้องการบันทึกงานใหม่หรือเพิ่มงานด่วนสำหรับวันนี้?' : 'Need to add a job or inspection for today?'}
            </p>
            <button
              type="button"
              onClick={onOpenQuickJob}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t.actions.newJob}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTodayJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                customer={customerMap.get(job.customerId)}
                property={propertyMap.get(job.propertyId)}
                vendor={job.vendorId ? vendorMap.get(job.vendorId) : undefined}
                onOpenInspection={onOpenJobInspection}
                onOpenQuotation={onOpenJobQuotation}
                onOpenScheduleModal={onOpenScheduleModal}
                onOpenAssignVendorModal={onOpenAssignVendorModal}
                onConfirmAppointment={onConfirmAppointment}
                onOpenCompactAppointment={onOpenCompactAppointment}
                onOpenEditJob={onOpenEditJob}
                onUpdateJobStatus={onUpdateJobStatus}
                onCustomerApprove={onCustomerApprove}
                onFinishFieldWork={onFinishFieldWork}
                onSelectProperty={onSelectProperty}
                onSelectCustomer={onSelectCustomer}
              />
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. UPCOMING JOBS SECTION (Tomorrow & Next 7 Days) */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs w-full min-w-0">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-900">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-wide uppercase">
              {t.myDay.upcomingJobs}
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {upcomingJobs.length} {isTh ? 'งานล่วงหน้า' : 'scheduled'}
          </span>
        </div>

        {upcomingJobs.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs font-semibold text-slate-500">
            {t.myDay.noUpcoming}
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                customer={customerMap.get(job.customerId)}
                property={propertyMap.get(job.propertyId)}
                vendor={job.vendorId ? vendorMap.get(job.vendorId) : undefined}
                showDate={true}
                onOpenInspection={onOpenJobInspection}
                onOpenQuotation={onOpenJobQuotation}
                onOpenScheduleModal={onOpenScheduleModal}
                onOpenAssignVendorModal={onOpenAssignVendorModal}
                onConfirmAppointment={onConfirmAppointment}
                onOpenCompactAppointment={onOpenCompactAppointment}
                onOpenEditJob={onOpenEditJob}
                onUpdateJobStatus={onUpdateJobStatus}
                onCustomerApprove={onCustomerApprove}
                onFinishFieldWork={onFinishFieldWork}
                onSelectProperty={onSelectProperty}
                onSelectCustomer={onSelectCustomer}
              />
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
