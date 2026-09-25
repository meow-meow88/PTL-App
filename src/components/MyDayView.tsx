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
  onOpenCustomerResponse?: (jobId: string) => void;
  onFinishFieldWork?: (jobId: string) => void;
  onOpenFinancialJob?: (jobId: string, purpose: 'invoice' | 'advance') => void;
  onOpenMollyExpress?: (initialTab?: 'quote' | 'receipt') => void;
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
  onOpenCustomerResponse,
  onFinishFieldWork,
  onOpenFinancialJob,
  onOpenMollyExpress,
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
    'waiting_approval', 'waiting_vendor', 'approved_to_schedule', 'scheduled_unconfirmed',
    'waiting_deposit', 'waiting_payment', 'ready_to_close']);
  const pendingJobs = jobs.filter((j) => pendingKeys.has(getDominantJobState(j).key))
    .sort((a, b) => (b.urgency === 'Urgent' ? 1 : 0) - (a.urgency === 'Urgent' ? 1 : 0) ||
      (a.createdAt || '').localeCompare(b.createdAt || ''));
  const remoteJobs = jobs.filter((j) =>
    !['Completed', 'Cancelled'].includes(j.status) &&
    (getDominantJobState(j).key === 'in_progress' || j.waitingOn === 'vendor' || Boolean(j.needsOwnerReview)));

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

        {/* FAST ACTION BUTTONS: [ MOLLY EXPRESS ], [ URGENT JOB ] and [ + NEW JOB ] */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full sm:w-auto sm:flex sm:items-center shrink-0">
          {onOpenMollyExpress && (
            <button
              id="my-day-btn-molly-express"
              type="button"
              onClick={() => onOpenMollyExpress('quote')}
              className="min-h-[44px] px-1 xs:px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 active:scale-98 text-white font-extrabold text-[11px] xs:text-xs sm:text-sm shadow-md shadow-orange-600/25 flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer text-center"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200 fill-amber-200 shrink-0" />
              <span className="truncate">{isTh ? 'งานด่วน Molly' : 'Molly Quick'}</span>
            </button>
          )}

          {onOpenUrgentJob && (
            <button
              id="my-day-btn-urgent-job"
              type="button"
              onClick={onOpenUrgentJob}
              className="min-h-[44px] px-1 xs:px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-98 text-white font-extrabold text-[11px] xs:text-xs sm:text-sm shadow-md shadow-red-600/20 flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer text-center"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-300 shrink-0" />
              <span className="truncate">{isTh ? 'งานด่วน' : 'Urgent'}</span>
            </button>
          )}

          {/* PROMINENT + NEW JOB BUTTON (≥44px touch target) */}
          <button
            id="my-day-btn-new-job"
            type="button"
            onClick={onOpenQuickJob}
            className="min-h-[44px] px-1 xs:px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-black text-[11px] xs:text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ring-2 ring-blue-400/40 text-center"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3] shrink-0" />
            <span className="truncate">{isTh ? 'เพิ่มงาน' : t.actions.newJob}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOLLY EXPRESS QUICK ACTIONS BANNER */}
      {/* ========================================================================= */}
      {onOpenMollyExpress && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-orange-600/15 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 text-amber-100 shadow-inner">
              <Sparkles className="w-5 h-5 fill-amber-200 text-amber-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                  {isTh ? 'Molly Express · ผู้ช่วยงานด่วนหน้างาน' : 'Molly Express · Field Quick Copilot'}
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/25 text-white shrink-0">
                  PTL V2
                </span>
              </div>
              <p className="text-xs text-amber-100/90 font-medium truncate mt-0.5">
                {isTh
                  ? 'ออกใบเสนอราคาด่วน หรือ อัพโหลดสลิป & รูปใบเสนอราคาเพื่อออกใบเสร็จรับเงินทันที'
                  : 'Fast quote generation or upload slips & quotes to issue receipts instantly'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 w-full md:w-auto shrink-0">
            <button
              id="my-day-molly-express-quote-btn"
              type="button"
              onClick={() => onOpenMollyExpress('quote')}
              className="w-full sm:w-auto min-h-[40px] px-3 sm:px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs border border-white/20 text-center"
            >
              <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-200 shrink-0" />
              <span className="truncate">{isTh ? 'ออกใบเสนอราคาด่วน' : 'Quick Quote'}</span>
            </button>

            <button
              id="my-day-molly-express-receipt-btn"
              type="button"
              onClick={() => onOpenMollyExpress('receipt')}
              className="w-full sm:w-auto min-h-[40px] px-3 sm:px-4 py-2 rounded-xl bg-white text-orange-950 hover:bg-amber-50 active:scale-98 font-black text-xs shadow-md shadow-black/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
            >
              <Receipt className="w-4 h-4 text-orange-600 shrink-0" />
              <span className="truncate">{isTh ? 'สลิป & ออกใบเสร็จด่วน' : 'Express Receipt'}</span>
            </button>
          </div>
        </div>
      )}

      {remoteJobs.length > 0 && <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <h2 className="text-sm font-extrabold text-slate-900 mb-1">{isTh ? 'อัปเดตงานแต่ละสถานที่' : 'Updates across sites'}</h2>
        <p className="text-xs text-slate-500 mb-3">{isTh ? 'แตะการ์ดเพื่อกลับไปทำงานนั้นต่อ' : 'Tap a card to resume that job'}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {remoteJobs.map((item) => {
            const state = getDominantJobState(item, lang);
            const assignee = item.assignedVendorName || vendorMap.get(item.vendorId || item.assignedVendorId || '')?.name ||
              (isTh ? 'เจ้าของงาน' : 'Owner');
            return <button key={item.id} type="button" onClick={() => onOpenJobInspection(item.id)}
              className="text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 p-3 min-w-0 cursor-pointer">
              <span className="block font-bold text-sm text-slate-900 truncate">{item.villaName || item.customerName}</span>
              <span className="block text-xs text-slate-600 truncate">{item.serviceArea || item.propertyLocation || propertyMap.get(item.propertyId || '')?.area || 'Phuket'} · {assignee}</span>
              <span className="flex justify-between gap-2 items-center mt-2 text-xs">
                <span className="font-semibold text-blue-800 truncate">{item.needsOwnerReview ? (isTh ? 'รอเจ้าของตรวจ' : 'Owner review needed') : state.label}</span>
                <span className="text-slate-500 shrink-0">{isTh ? 'ทำต่อ ›' : 'Resume ›'}</span>
              </span>
              {item.lastActivityAt && <span className="block text-[10px] text-slate-500 mt-1">{isTh ? 'อัปเดต' : 'Updated'} {new Date(item.lastActivityAt).toLocaleString(isTh ? 'th-TH' : 'en-US')}</span>}
            </button>;
          })}
        </div>
      </section>}

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
              onCustomerApprove={onCustomerApprove} onOpenCustomerResponse={onOpenCustomerResponse} onFinishFieldWork={onFinishFieldWork}
              onOpenFinancialJob={onOpenFinancialJob}
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
                onCustomerApprove={onCustomerApprove} onOpenCustomerResponse={onOpenCustomerResponse}
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
                onCustomerApprove={onCustomerApprove} onOpenCustomerResponse={onOpenCustomerResponse}
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
                onCustomerApprove={onCustomerApprove} onOpenCustomerResponse={onOpenCustomerResponse}
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
