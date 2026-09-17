import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  AlertCircle,
  Building2,
  User,
  ArrowRight,
  ChevronRight,
  Plus,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Compass,
  FileText,
  MapPin,
  Sparkles,
  CreditCard,
  Receipt,
  DollarSign,
} from 'lucide-react';
import { InspectionJob, Customer, Property, Invoice } from '../types';

interface MyDayViewProps {
  jobs: InspectionJob[];
  customers: Customer[];
  properties: Property[];
  invoices?: Invoice[];
  onOpenJobInspection: (jobId: string) => void;
  onOpenJobQuotation: (jobId: string) => void;
  onOpenQuickJob: () => void;
  onSelectCustomer: (customerId: string) => void;
  onSelectProperty: (propertyId: string) => void;
  onSelectInvoice?: (invoiceId: string) => void;
  onUpdateJobStatus?: (jobId: string, status: InspectionJob['status']) => void;
}

export const MyDayView: React.FC<MyDayViewProps> = ({
  jobs,
  customers,
  properties,
  invoices = [],
  onOpenJobInspection,
  onOpenJobQuotation,
  onOpenQuickJob,
  onSelectCustomer,
  onSelectProperty,
  onSelectInvoice,
  onUpdateJobStatus,
}) => {
  const [todayFilter, setTodayFilter] = useState<'all' | 'jobs' | 'appointments' | 'followups' | 'waiting_customer' | 'waiting_vendor'>('all');

  // Categorize jobs for TODAY
  const activeJobs = jobs.filter((j) => j.status !== 'Completed');
  const waitingCustomerJobs = jobs.filter(
    (j) => j.status === 'Quoted' || j.waitingOn === 'customer' || j.waitingOn === 'payment'
  );
  const waitingVendorJobs = jobs.filter(
    (j) => j.waitingOn === 'vendor' || j.waitingOn === 'parts'
  );
  const appointmentJobs = jobs.filter(
    (j) => Boolean(j.scheduledTime) || j.serviceType?.toLowerCase().includes('visit') || j.isSimpleJob
  );
  const customerFollowUps = customers.filter((c) => Boolean(c.nextFollowUp));

  // THINGS THAT NEED YOUR ATTENTION
  const upcomingJobs = jobs.filter((j) => j.scheduledDate && j.scheduledDate !== 'Today');
  const unfinishedJobs = jobs.filter((j) => j.status === 'Inspection' || (j.status !== 'Completed' && j.items && j.items.length > 0));
  const followUpItems = customers.filter((c) => Boolean(c.nextFollowUp) || Boolean(c.followUpNote));
  const inspectionDueSoon = properties.filter((p) => Boolean(p.nextInspection));

  // FINANCIAL ALERTS: Overdue invoices & un-invoiced completed jobs
  const now = new Date();
  const overdueInvoices = invoices.filter((inv) => {
    if (inv.balanceDue <= 0 || inv.status === 'Paid' || inv.status === 'Cancelled') return false;
    if (inv.status === 'Overdue') return true;
    if (inv.dueDate) {
      return new Date(inv.dueDate) < now;
    }
    return false;
  });

  const uninvoicedCompletedJobs = jobs.filter(
    (j) => j.status === 'Completed' && !invoices.some((inv) => inv.jobId === j.id)
  );

  const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  // PROPERTY
  const upcomingInspections = properties.filter((p) => Boolean(p.nextInspection));
  const recentlyVisitedProperties = [...properties].sort((a, b) => {
    const dateA = a.lastInspection || '';
    const dateB = b.lastInspection || '';
    return dateB.localeCompare(dateA);
  });

  return (
    <div className="space-y-6 pb-20 sm:pb-12 max-w-7xl mx-auto">
      {/* Top Banner - Solo Operator Command Center */}
      <div className="bg-[#0f1d33] text-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-400">
              SOLO OPERATOR COMMAND
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            My Day
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Real-time daily operations, appointments, follow-ups, and property audits for Phuket Trusted Local.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={onOpenQuickJob}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ NEW JOB</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: TODAY */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
              <CalendarDays className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                TODAY
              </h2>
              <p className="text-xs text-slate-500">
                Jobs today, appointments, follow-ups, and items waiting on customer or vendor
              </p>
            </div>
          </div>

          {/* Sub-Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            <button
              onClick={() => setTodayFilter('all')}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                todayFilter === 'all'
                  ? 'bg-[#0f1d33] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({activeJobs.length})
            </button>
            <button
              onClick={() => setTodayFilter('jobs')}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                todayFilter === 'jobs'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Jobs Today ({activeJobs.length})
            </button>
            <button
              onClick={() => setTodayFilter('appointments')}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                todayFilter === 'appointments'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Appointments ({appointmentJobs.length})
            </button>
            <button
              onClick={() => setTodayFilter('followups')}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                todayFilter === 'followups'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Follow-ups ({customerFollowUps.length})
            </button>
            <button
              onClick={() => setTodayFilter('waiting_customer')}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                todayFilter === 'waiting_customer'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Waiting Customer ({waitingCustomerJobs.length})
            </button>
            <button
              onClick={() => setTodayFilter('waiting_vendor')}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                todayFilter === 'waiting_vendor'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              Waiting Vendor ({waitingVendorJobs.length})
            </button>
          </div>
        </div>

        {/* Dynamic List for Section 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(todayFilter === 'all' || todayFilter === 'jobs'
            ? activeJobs
            : todayFilter === 'appointments'
            ? appointmentJobs
            : todayFilter === 'waiting_customer'
            ? waitingCustomerJobs
            : todayFilter === 'waiting_vendor'
            ? waitingVendorJobs
            : []
          ).map((job) => (
            <div
              key={job.id}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50/70 transition-all flex flex-col justify-between shadow-2xs group"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      job.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : job.status === 'Quoted'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-blue-100 text-blue-900'
                    }`}
                  >
                    {job.status}
                  </span>
                  {job.waitingOn && job.waitingOn !== 'none' && (
                    <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                      Waiting: {job.waitingOn}
                    </span>
                  )}
                  {job.isSimpleJob && (
                    <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      Quick Job
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-1">
                  {job.villaName || job.propertyLocation}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {job.customerName} • {job.serviceType}
                </p>

                {job.requestDescription && (
                  <p className="text-xs text-slate-600 bg-slate-100/70 p-1.5 rounded mt-2 line-clamp-2">
                    {job.requestDescription}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {job.scheduledTime || 'Scheduled'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenJobInspection(job.id)}
                    className="text-xs font-bold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Inspect
                  </button>
                  <button
                    onClick={() => onOpenJobQuotation(job.id)}
                    className="text-xs font-bold px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Quote / PDF
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Follow-ups view if selected */}
          {todayFilter === 'followups' &&
            customerFollowUps.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectCustomer(c.id)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/20 transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    Follow-up
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Due: {c.nextFollowUp}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900">
                  {c.name || c.fullName || c.preferredName}
                </h3>
                <p className="text-xs text-slate-500">
                  {c.customerType} • {c.phone || c.lineWhatsapp || c.email || 'No contact'}
                </p>
                {c.followUpNote && (
                  <p className="text-xs text-slate-700 bg-blue-50/60 p-2 rounded mt-2">
                    💬 {c.followUpNote}
                  </p>
                )}
              </div>
            ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: THINGS THAT NEED YOUR ATTENTION */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                THINGS THAT NEED YOUR ATTENTION
              </h2>
              <p className="text-xs text-slate-500">
                Upcoming jobs, unfinished jobs, follow-up items, and inspections due soon
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-200">
            {waitingCustomerJobs.length +
              unfinishedJobs.length +
              followUpItems.length +
              overdueInvoices.length +
              uninvoicedCompletedJobs.length}{' '}
            items
          </span>
        </div>

        {/* OVERDUE MONEY BANNER IF APPLICABLE */}
        {overdueInvoices.length > 0 && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-rose-200 text-rose-800 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
              </span>
              <div>
                <span className="text-xs font-black text-rose-900 uppercase">
                  Cash Flow Alert: {overdueInvoices.length} Overdue Invoice(s)
                </span>
                <p className="text-[11px] text-rose-700">
                  ฿{totalOverdueAmount.toLocaleString()} is waiting for collection. Send client reminders today.
                </p>
              </div>
            </div>
            {onSelectInvoice && (
              <button
                onClick={() => onSelectInvoice(overdueInvoices[0].id)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                View Invoice
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* 1. Overdue Invoices (FINANCIAL ALERT) */}
          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded">
                  Overdue Invoices
                </span>
                <span className="text-xs font-bold text-rose-700">{overdueInvoices.length}</span>
              </div>
              <div className="space-y-2">
                {overdueInvoices.slice(0, 2).map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => onSelectInvoice && onSelectInvoice(inv.id)}
                    className="p-2 bg-white rounded-lg border border-rose-200 text-xs hover:border-rose-400 cursor-pointer"
                  >
                    <div className="font-bold text-rose-900 truncate font-mono">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-slate-500">
                      Due: ฿{inv.balanceDue.toLocaleString()} (Due: {inv.dueDate})
                    </div>
                  </div>
                ))}
                {overdueInvoices.length === 0 && (
                  <div className="text-[11px] text-slate-400 py-2">No overdue invoices.</div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Uninvoiced Completed Jobs (FINANCIAL ALERT) */}
          <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 bg-purple-200/80 px-2 py-0.5 rounded">
                  Need Invoice
                </span>
                <span className="text-xs font-bold text-purple-700">{uninvoicedCompletedJobs.length}</span>
              </div>
              <div className="space-y-2">
                {uninvoicedCompletedJobs.slice(0, 2).map((j) => (
                  <div
                    key={j.id}
                    onClick={() => onOpenJobQuotation(j.id)}
                    className="p-2 bg-white rounded-lg border border-purple-200 text-xs hover:border-purple-400 cursor-pointer"
                  >
                    <div className="font-bold text-purple-900 truncate">{j.villaName}</div>
                    <div className="text-[10px] text-slate-500">Job completed • Click to invoice</div>
                  </div>
                ))}
                {uninvoicedCompletedJobs.length === 0 && (
                  <div className="text-[11px] text-slate-400 py-2">All completed jobs invoiced.</div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Upcoming jobs */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">
                  Upcoming Jobs
                </span>
                <span className="text-xs font-bold text-slate-700">{upcomingJobs.length}</span>
              </div>
              <div className="space-y-2">
                {upcomingJobs.slice(0, 2).map((j) => (
                  <div
                    key={j.id}
                    onClick={() => onOpenJobInspection(j.id)}
                    className="p-2 bg-white rounded-lg border border-slate-200 text-xs hover:border-blue-400 cursor-pointer"
                  >
                    <div className="font-bold text-slate-900 truncate">{j.villaName}</div>
                    <div className="text-[10px] text-slate-500">{j.scheduledDate} • {j.serviceType}</div>
                  </div>
                ))}
                {upcomingJobs.length === 0 && (
                  <div className="text-[11px] text-slate-400 py-2">No upcoming jobs booked.</div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Unfinished jobs */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                  Unfinished Jobs
                </span>
                <span className="text-xs font-bold text-rose-700">{unfinishedJobs.length}</span>
              </div>
              <div className="space-y-2">
                {unfinishedJobs.slice(0, 2).map((j) => (
                  <div
                    key={j.id}
                    onClick={() => onOpenJobInspection(j.id)}
                    className="p-2 bg-white rounded-lg border border-slate-200 text-xs hover:border-rose-400 cursor-pointer"
                  >
                    <div className="font-bold text-slate-900 truncate">{j.villaName}</div>
                    <div className="text-[10px] text-slate-500">{j.items?.length || 0} findings recorded</div>
                  </div>
                ))}
                {unfinishedJobs.length === 0 && (
                  <div className="text-[11px] text-slate-400 py-2">All inspection checklists completed.</div>
                )}
              </div>
            </div>
          </div>

          {/* 5. Follow-up items */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Follow-up Items
                </span>
                <span className="text-xs font-bold text-amber-800">{followUpItems.length}</span>
              </div>
              <div className="space-y-2">
                {followUpItems.slice(0, 2).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSelectCustomer(c.id)}
                    className="p-2 bg-white rounded-lg border border-slate-200 text-xs hover:border-amber-400 cursor-pointer"
                  >
                    <div className="font-bold text-slate-900 truncate">{c.name || c.fullName}</div>
                    <div className="text-[10px] text-slate-500 truncate">{c.followUpNote || `Next: ${c.nextFollowUp}`}</div>
                  </div>
                ))}
                {followUpItems.length === 0 && (
                  <div className="text-[11px] text-slate-400 py-2">No pending customer follow-ups.</div>
                )}
              </div>
            </div>
          </div>

          {/* 6. Inspection due soon */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  Inspection Due Soon
                </span>
                <span className="text-xs font-bold text-blue-800">{inspectionDueSoon.length}</span>
              </div>
              <div className="space-y-2">
                {inspectionDueSoon.slice(0, 2).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectProperty(p.id)}
                    className="p-2 bg-white rounded-lg border border-slate-200 text-xs hover:border-blue-400 cursor-pointer"
                  >
                    <div className="font-bold text-slate-900 truncate">{p.name || p.propertyName}</div>
                    <div className="text-[10px] text-slate-500">Due: {p.nextInspection} ({p.area})</div>
                  </div>
                ))}
                {inspectionDueSoon.length === 0 && (
                  <div className="text-[11px] text-slate-400 py-2">No routine inspections due.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: PROPERTY */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <Building2 className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                PROPERTY
              </h2>
              <p className="text-xs text-slate-500">
                Upcoming inspections and recently visited properties in Phuket
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {properties.length} properties
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sub-column A: Upcoming Inspections */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Upcoming Routine Inspections</span>
              </h3>
              <span className="text-xs font-bold text-blue-700">{upcomingInspections.length}</span>
            </div>

            <div className="space-y-2.5">
              {upcomingInspections.slice(0, 4).map((prop) => (
                <div
                  key={prop.id}
                  onClick={() => onSelectProperty(prop.id)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-bold bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded">
                        {prop.area}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                        Due: {prop.nextInspection}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-900 truncate">
                      {prop.name || prop.propertyName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Last inspected: {prop.lastInspection || 'None on file'}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Sub-column B: Recently Visited Properties */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span>Recently Visited Properties</span>
              </h3>
              <span className="text-xs font-bold text-slate-600">{recentlyVisitedProperties.length}</span>
            </div>

            <div className="space-y-2.5">
              {recentlyVisitedProperties.slice(0, 4).map((prop) => (
                <div
                  key={prop.id}
                  onClick={() => onSelectProperty(prop.id)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-bold bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded">
                        {prop.area}
                      </span>
                      <span className="text-[9px] text-slate-600">
                        {prop.propertyType}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-900 truncate">
                      {prop.name || prop.propertyName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {prop.address}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
