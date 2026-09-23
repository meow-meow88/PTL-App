import React, { useState } from 'react';
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
import { getLocalizedServiceName } from '../utils/serviceWorkflow';

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
  const [todayFilter, setTodayFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');

  // Dates normalization
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

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
  const activeJobs = jobs.filter(
    (j) =>
      j.status === 'In Progress' ||
      Boolean(j.visitStartedAt) ||
      Boolean(j.siteArrivedAt) ||
      Boolean(j.actualStartedAt)
  );

  // =========================================================================
  // 2. TODAY'S JOBS
  // =========================================================================
  const isJobToday = (j: InspectionJob) => {
    const date = j.scheduledDate || j.inspectionDate;
    return date === todayStr || date === 'Today' || date === 'วันนี้';
  };

  const todayAllJobs = jobs.filter(isJobToday);

  // Filtered Today's Jobs
  const filteredTodayJobs = todayAllJobs.filter((j) => {
    if (todayFilter === 'all') return true;
    if (todayFilter === 'not_started') {
      return j.status === 'Scheduled' && !j.visitStartedAt && !j.actualStartedAt;
    }
    if (todayFilter === 'in_progress') {
      return j.status === 'In Progress' || Boolean(j.visitStartedAt) || Boolean(j.actualStartedAt);
    }
    if (todayFilter === 'completed') {
      return j.status === 'Completed';
    }
    return true;
  });

  // =========================================================================
  // 3. UPCOMING JOBS (Tomorrow & Next 7 Days)
  // =========================================================================
  const upcomingJobs = jobs
    .filter((j) => {
      const date = j.scheduledDate || j.inspectionDate;
      if (!date || isJobToday(j)) return false;
      return date >= tomorrowStr && j.status !== 'Completed' && j.status !== 'Cancelled';
    })
    .sort((a, b) => {
      const dateA = a.scheduledDate || a.inspectionDate || '';
      const dateB = b.scheduledDate || b.inspectionDate || '';
      return dateA.localeCompare(dateB);
    })
    .slice(0, 6);

  // =========================================================================
  // 4. NEEDS ATTENTION ITEMS (Single Consolidated Section)
  // =========================================================================
  // Overdue Invoices
  const overdueInvoices = invoices.filter((inv) => {
    if (inv.status === 'Paid' || inv.status === 'Cancelled') return false;
    if (!inv.dueDate) return false;
    return inv.dueDate < todayStr;
  });

  // Unconfirmed Visits / Appointments
  const unconfirmedJobs = jobs.filter((j) => {
    const hasDate = Boolean(j.scheduledDate || j.scheduledTime);
    if (!hasDate) return false;
    return (
      (j.appointmentConfirmation === 'Pending' ||
        j.appointmentConfirmation === 'Unconfirmed' ||
        j.appointmentConfirmation === 'Not Confirmed' ||
        j.isAppointmentConfirmed === false) &&
      j.status !== 'Completed' &&
      j.status !== 'Cancelled'
    );
  });

  // Quotes Waiting on Customer Approval
  const pendingQuoteJobs = jobs.filter(
    (j) => (j.status === 'Quoted' || j.status === 'Waiting Approval' || j.waitingOn === 'customer') && j.status !== 'Cancelled'
  );

  // Jobs Waiting on Vendor
  const pendingVendorJobs = jobs.filter(
    (j) => (j.status === 'Waiting Vendor' || j.waitingOn === 'vendor' || j.waitingOn === 'parts') && j.status !== 'Cancelled'
  );

  // Completed Jobs Not Invoiced
  const uninvoicedCompletedJobs = jobs.filter((j) => {
    if (j.status !== 'Completed') return false;
    const hasPaidInvoice = invoices.some((inv) => inv.jobId === j.id && inv.status === 'Paid');
    return !hasPaidInvoice && (j.paymentStatus === 'Pending' || !j.paymentStatus || j.waitingOn === 'payment');
  });

  // Recurring Services Due
  const dueRecurringServices = recurringServices.filter((s) => {
    if (!s.isActive || !s.nextDueDate) return false;
    return s.nextDueDate <= tomorrowStr;
  });

  const totalAttentionCount =
    overdueInvoices.length +
    unconfirmedJobs.length +
    pendingQuoteJobs.length +
    pendingVendorJobs.length +
    uninvoicedCompletedJobs.length +
    dueRecurringServices.length;

  // =========================================================================
  // 5. MONEY TO COLLECT
  // =========================================================================
  const unpaidInvoices = invoices.filter((inv) => inv.status !== 'Paid' && inv.status !== 'Cancelled');
  const totalOutstandingBalance = unpaidInvoices.reduce(
    (sum, inv) => sum + (inv.balanceDue ?? inv.total ?? 0),
    0
  );

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

      {/* ========================================================================= */}
      {/* 1. NEEDS ATTENTION SECTION (Consolidated, No Duplicates) */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs w-full min-w-0">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-wide uppercase">
              {t.myDay.needsAttention}
            </h2>
          </div>
          {totalAttentionCount > 0 ? (
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-xs">
              {totalAttentionCount} {isTh ? 'รายการ' : 'items'}
            </span>
          ) : (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isTh ? 'เรียบร้อย' : 'Clear'}</span>
            </span>
          )}
        </div>

        {/* Content: Empty State or Compact Action Cards */}
        {totalAttentionCount === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs sm:text-sm font-semibold text-slate-600 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t.myDay.allClear}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Overdue Invoices */}
            {overdueInvoices.map((inv) => {
              const cust = customerMap.get(inv.customerId);
              const custName = cust?.name || (inv as any).customerName || 'Customer';
              const amountDue = inv.balanceDue ?? inv.total ?? 0;
              const waUrl = makeWhatsappUrl(
                cust?.phone,
                isTh
                  ? `สวัสดีครับ จาก Phuket Trusted Local แจ้งยอดค้างชำระใบแจ้งหนี้ ${inv.invoiceNumber} จำนวน ${amountDue.toLocaleString()} บาท`
                  : `Hello, this is Phuket Trusted Local following up on overdue invoice ${inv.invoiceNumber} for ฿${amountDue.toLocaleString()}.`
              );
              return (
                <div
                  key={`att-inv-${inv.id}`}
                  onClick={() => onSelectInvoice && onSelectInvoice(inv.id)}
                  className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black uppercase text-rose-800 bg-rose-200/70 px-1.5 py-0.2 rounded">
                        {t.attentionReasons?.overdueInvoice || (isTh ? 'ใบแจ้งหนี้เกินกำหนด' : 'Overdue Invoice')}
                      </span>
                      <span className="font-mono text-xs font-black text-rose-700">
                        ฿{amountDue.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {custName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isTh ? 'เกินกำหนดเมื่อ' : 'Due'}: {inv.dueDate}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-rose-200/60 flex items-center justify-between gap-2">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectInvoice && onSelectInvoice(inv.id)}
                      className="min-h-[36px] text-xs font-black px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg cursor-pointer ml-auto"
                    >
                      {t.quickActions?.recordPayment || (isTh ? 'บันทึกรับเงิน' : 'Record Payment')}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 2. Unconfirmed Appointments */}
            {unconfirmedJobs.map((j) => (
              <div
                key={`att-unconf-${j.id}`}
                onClick={() => onOpenJobInspection(j.id)}
                className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenCompactAppointment) {
                          onOpenCompactAppointment(j);
                        } else if (onConfirmAppointment) {
                          onConfirmAppointment(j.id);
                        }
                      }}
                      className="text-[10px] font-black uppercase text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      title={isTh ? 'คลิกเพื่อจัดการนัดหมาย' : 'Click to manage appointment'}
                    >
                      {t.dominantStates?.appointmentNotConfirmed || (isTh ? 'ยังไม่ยืนยันนัด' : 'Appointment Not Confirmed')}
                    </button>
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {formatTime24h(j.scheduledTime) || '10:00'}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 truncate">
                    {j.customerName}
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">
                    {getLocalizedServiceName(j.serviceType, lang)} • {j.villaName || j.propertyLocation}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenJobInspection(j.id);
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    {t.quickActions?.openJob || (isTh ? 'เปิดงาน' : 'Open Job')}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenCompactAppointment) {
                        onOpenCompactAppointment(j);
                      } else if (onConfirmAppointment) {
                        onConfirmAppointment(j.id);
                      } else if (onUpdateJobStatus) {
                        onUpdateJobStatus(j.id, 'Scheduled');
                      }
                    }}
                    className="min-h-[36px] text-xs font-black px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{t.quickActions?.confirmAppointment || (isTh ? 'ยืนยันนัด' : 'Confirm Appointment')}</span>
                  </button>
                </div>
              </div>
            ))}

            {/* 3. Quotes Waiting Customer Approval */}
            {pendingQuoteJobs.map((j) => {
              const cust = customerMap.get(j.customerId);
              const waUrl = makeWhatsappUrl(
                cust?.phone || j.customerPhone,
                isTh
                  ? `สวัสดีครับ จาก Phuket Trusted Local สอบถามเรื่องใบเสนอราคางาน ${j.serviceType} ที่ส่งให้ครับ`
                  : `Hello! Phuket Trusted Local following up on the quotation sent for ${j.serviceType}.`
              );
              return (
                <div
                  key={`att-quote-${j.id}`}
                  onClick={() => onOpenJobQuotation(j.id)}
                  className="p-3 rounded-xl border border-sky-200 bg-sky-50/40 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black uppercase text-sky-900 bg-sky-200/80 px-1.5 py-0.2 rounded">
                        {t.dominantStates?.waitingCustomerApproval || (isTh ? 'รอลูกค้าอนุมัติ' : 'Waiting Customer Approval')}
                      </span>
                      {typeof j.price === 'number' && (
                        <span className="font-mono text-xs font-bold text-slate-700">
                          ฿{(j.price || 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {j.customerName}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      {getLocalizedServiceName(j.serviceType, lang)}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-sky-200/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenJobQuotation(j.id);
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      {t.quickActions?.viewQuote || (isTh ? 'ดูใบเสนอราคา' : 'View Quote')}
                    </button>
                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="min-h-[36px] text-xs font-black px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg flex items-center gap-1 shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t.quickActions?.contactCustomer || (isTh ? 'ติดต่อลูกค้า' : 'Contact Customer')}</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenJobInspection(j.id);
                        }}
                        className="min-h-[36px] text-xs font-black px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg cursor-pointer"
                      >
                        {t.quickActions?.openJob || (isTh ? 'เปิดงาน' : 'Open Job')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 4. Jobs Waiting on Vendor */}
            {pendingVendorJobs.map((j) => {
              const vendor = j.vendorId ? vendorMap.get(j.vendorId) : undefined;
              return (
                <div
                  key={`att-vendor-${j.id}`}
                  onClick={() => onOpenJobInspection(j.id)}
                  className="p-3 rounded-xl border border-purple-200 bg-purple-50/40 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black uppercase text-purple-900 bg-purple-200/80 px-1.5 py-0.2 rounded">
                        {t.dominantStates?.waitingVendor || (isTh ? 'รอช่าง/พาร์ทเนอร์' : 'Waiting Vendor')}
                      </span>
                      {vendor && (
                        <span className="text-[10px] font-bold text-purple-800 truncate max-w-[100px]">
                          {vendor.name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {j.customerName}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      {getLocalizedServiceName(j.serviceType, lang)} • {j.villaName || j.propertyLocation}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-purple-200/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenJobInspection(j.id);
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      {t.quickActions?.openJob || (isTh ? 'เปิดงาน' : 'Open Job')}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenAssignVendorModal) onOpenAssignVendorModal(j);
                      }}
                      className="min-h-[36px] text-xs font-black px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>
                        {vendor
                          ? (t.quickActions?.contactVendor || (isTh ? 'ติดต่อช่าง' : 'Contact Vendor'))
                          : (t.quickActions?.assignVendor || (isTh ? 'มอบหมายช่าง' : 'Assign Vendor'))}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 5. Completed Jobs Not Invoiced */}
            {uninvoicedCompletedJobs.map((j) => (
              <div
                key={`att-uninv-${j.id}`}
                onClick={() => onOpenJobInspection(j.id)}
                className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-black uppercase text-emerald-900 bg-emerald-200/80 px-1.5 py-0.2 rounded">
                      {t.attentionReasons?.readyForInvoice || (isTh ? 'งานเสร็จ รออกใบแจ้งหนี้' : 'Ready to Invoice')}
                    </span>
                    {typeof j.price === 'number' && (
                      <span className="font-mono text-xs font-bold text-slate-700">
                        ฿{(j.price || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 truncate">
                    {j.customerName}
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">
                    {getLocalizedServiceName(j.serviceType, lang)}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenJobInspection(j.id);
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    {t.quickActions?.openJob || (isTh ? 'เปิดงาน' : 'Open Job')}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenJobQuotation(j.id);
                    }}
                    className="min-h-[36px] text-xs font-black px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{t.quickActions?.createInvoice || (isTh ? 'ออกใบแจ้งหนี้' : 'Create Invoice')}</span>
                  </button>
                </div>
              </div>
            ))}

            {/* 6. Recurring Services Due */}
            {dueRecurringServices.map((s) => (
              <div
                key={`att-rec-${s.id}`}
                className="p-3 rounded-xl border border-teal-200 bg-teal-50/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-black uppercase text-teal-900 bg-teal-200/80 px-1.5 py-0.2 rounded">
                      {(t.attentionReasons?.recurringDue || (isTh ? 'บริการประจำรอบถึงกำหนด' : 'Recurring Service Due'))} • {s.serviceFrequency}
                    </span>
                    <span className="text-[11px] font-bold text-teal-900">
                      {formatDateDisplay(s.nextDueDate, lang)}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 truncate">
                    {s.title}
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">
                    {s.propertyName} • {s.customerName}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-teal-200/60 flex items-center justify-between gap-2">
                  {onOpenRecurringModal && (
                    <button
                      type="button"
                      onClick={onOpenRecurringModal}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      {isTh ? 'สัญญาทั้งหมด' : 'Contracts'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onOpenQuickJob}
                    className="min-h-[36px] text-xs font-black px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg flex items-center gap-1 shadow-xs ml-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isTh ? 'เปิดงานนัดตรวจ' : 'Schedule Visit'}</span>
                  </button>
                </div>
              </div>
            ))}
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
            {todayAllJobs.length} {isTh ? 'งานวันนี้' : 'Jobs'}
          </span>
        </div>

        {/* 4 Simple Filter Pills (Requirement 2) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 mb-3">
          <button
            type="button"
            onClick={() => setTodayFilter('all')}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              todayFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {t.myDay.filterAll} ({todayAllJobs.length})
          </button>
          <button
            type="button"
            onClick={() => setTodayFilter('not_started')}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              todayFilter === 'not_started'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {t.myDay.filterNotStarted}
          </button>
          <button
            type="button"
            onClick={() => setTodayFilter('in_progress')}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              todayFilter === 'in_progress'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {t.myDay.filterInProgress} ({activeJobs.length})
          </button>
          <button
            type="button"
            onClick={() => setTodayFilter('completed')}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              todayFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {t.myDay.filterCompleted}
          </button>
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

      {/* ========================================================================= */}
      {/* 5. MONEY TO COLLECT SECTION */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs w-full min-w-0">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-900">
              <DollarSign className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-wide uppercase">
              {t.myDay.moneyToCollect}
            </h2>
          </div>
          <span className="font-mono text-xs sm:text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
            ฿{totalOutstandingBalance.toLocaleString()}
          </span>
        </div>

        {unpaidInvoices.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs font-semibold text-slate-500">
            {t.myDay.noMoneyToCollect}
          </div>
        ) : (
          <div className="space-y-2">
            {unpaidInvoices.slice(0, 5).map((inv) => {
              const cust = customerMap.get(inv.customerId);
              const custName = cust?.name || (inv as any).customerName || 'Customer';
              const amountDue = inv.balanceDue ?? inv.total ?? 0;
              const waUrl = makeWhatsappUrl(
                cust?.phone,
                isTh
                  ? `สวัสดีครับ จาก Phuket Trusted Local แจ้งยอดชำระ ${inv.invoiceNumber} จำนวน ${amountDue.toLocaleString()} บาท`
                  : `Hello! Phuket Trusted Local following up on invoice ${inv.invoiceNumber} for ฿${amountDue.toLocaleString()}.`
              );
              return (
                <div
                  key={`inv-${inv.id}`}
                  className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {custName}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span>{inv.invoiceNumber}</span>
                      <span>•</span>
                      <span>{isTh ? 'ครบกำหนด' : 'Due'}: {inv.dueDate || '-'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs sm:text-sm font-black text-slate-900">
                      ฿{amountDue.toLocaleString()}
                    </span>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                        title="WhatsApp Customer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectInvoice && onSelectInvoice(inv.id)}
                      className="text-xs font-black px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer"
                    >
                      {t.quickActions?.recordPayment || (isTh ? 'บันทึกรับเงิน' : 'Record Payment')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
