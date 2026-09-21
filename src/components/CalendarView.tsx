import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Home,
  Briefcase,
  AlertCircle,
  Truck,
  ExternalLink,
  Check,
  Plus,
} from 'lucide-react';
import { InspectionJob, RecurringService, Task, Property, Customer } from '../types';

interface CalendarViewProps {
  jobs: InspectionJob[];
  recurringServices: RecurringService[];
  tasks: Task[];
  properties: Property[];
  customers: Customer[];
  onOpenJobDetail: (jobId: string) => void;
  onOpenQuickSchedule?: (job: InspectionJob) => void;
  onOpenTaskDetail?: (task: Task) => void;
  onOpenProperty?: (propertyId: string) => void;
}

type CalendarViewMode = 'month' | 'week' | 'agenda';
type CalendarFilterType = 'all' | 'jobs' | 'appointments' | 'homewatch' | 'followups';

interface CalendarEvent {
  id: string;
  type: 'job' | 'appointment' | 'homewatch' | 'followup';
  title: string;
  subtitle: string;
  dateStr: string; // YYYY-MM-DD
  timeStr?: string;
  status: 'Confirmed' | 'Not Confirmed' | 'Completed' | 'Cancelled' | 'Open' | 'Pending';
  rawJob?: InspectionJob;
  rawTask?: Task;
  rawService?: RecurringService;
  propertyId?: string;
  customerId?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  jobs,
  recurringServices,
  tasks,
  properties,
  customers,
  onOpenJobDetail,
  onOpenQuickSchedule,
  onOpenTaskDetail,
  onOpenProperty,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('agenda');
  const [filterType, setFilterType] = useState<CalendarFilterType>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Build calendar events from all sources
  const events: CalendarEvent[] = [];

  // 1. From Jobs (both simple jobs & inspection jobs)
  jobs.forEach((job) => {
    if (!job.scheduledDate && !job.inspectionDate) return;
    const dateStr = job.scheduledDate || job.inspectionDate;
    if (!dateStr || dateStr.length < 10) return;

    const isHomeWatch =
      job.serviceType.toLowerCase().includes('home watch') ||
      Boolean(job.recurringServiceId);

    let status: CalendarEvent['status'] = 'Not Confirmed';
    if (job.status === 'Completed' || job.status === 'Paid') {
      status = 'Completed';
    } else if (job.status === 'Cancelled') {
      status = 'Cancelled';
    } else if (job.appointmentConfirmation === 'Confirmed') {
      status = 'Confirmed';
    } else {
      status = 'Not Confirmed';
    }

    events.push({
      id: `job_${job.id}`,
      type: isHomeWatch ? 'homewatch' : job.scheduledTime ? 'appointment' : 'job',
      title: job.villaName || 'Villa Job',
      subtitle: `${job.serviceType} • ${job.customerName}`,
      dateStr: dateStr.slice(0, 10),
      timeStr: job.scheduledTime || 'TBD',
      status,
      rawJob: job,
      propertyId: job.propertyId,
      customerId: job.customerId,
    });
  });

  // 2. From Recurring Services (upcoming scheduled services)
  recurringServices.forEach((service) => {
    if (service.status !== 'Active' || !service.nextDueDate) return;
    const prop = properties.find((p) => p.id === service.propertyId);
    const cust = customers.find((c) => c.id === service.customerId);

    // Only add if not already present as a scheduled job on that date
    const hasJobOnDate = events.some(
      (e) => e.rawJob?.recurringServiceId === service.id && e.dateStr === service.nextDueDate
    );

    if (!hasJobOnDate) {
      events.push({
        id: `rec_${service.id}`,
        type: 'homewatch',
        title: prop?.name || 'Home Watch Visit',
        subtitle: `${service.serviceType} • ${cust?.name || 'Customer'} (Due)`,
        dateStr: service.nextDueDate,
        timeStr: 'Scheduled',
        status: 'Pending',
        rawService: service,
        propertyId: service.propertyId,
        customerId: service.customerId,
      });
    }
  });

  // 3. From Tasks / Follow-ups
  tasks.forEach((task) => {
    if (task.status === 'Completed' || task.status === 'Dismissed') return;
    const dateStr = task.dueDate || task.createdAt.slice(0, 10);

    events.push({
      id: `task_${task.id}`,
      type: 'followup',
      title: task.title,
      subtitle: task.description,
      dateStr: dateStr.slice(0, 10),
      timeStr: 'Due Today',
      status: 'Open',
      rawTask: task,
      propertyId: task.propertyId,
      customerId: task.customerId,
    });
  });

  // Filter events
  const filteredEvents = events.filter((e) => {
    if (filterType === 'all') return true;
    if (filterType === 'jobs') return e.type === 'job' || e.type === 'appointment';
    if (filterType === 'appointments') return e.type === 'appointment';
    if (filterType === 'homewatch') return e.type === 'homewatch';
    if (filterType === 'followups') return e.type === 'followup';
    return true;
  });

  // Date navigation helpers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const currentMonthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const getStatusBadge = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Not Confirmed':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Completed':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.rawJob) {
      onOpenJobDetail(event.rawJob.id);
    } else if (event.rawTask && onOpenTaskDetail) {
      onOpenTaskDetail(event.rawTask);
    } else if (event.propertyId && onOpenProperty) {
      onOpenProperty(event.propertyId);
    }
  };

  // -------------------------------------------------------------
  // Month Grid Calculation
  // -------------------------------------------------------------
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthDays: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    monthDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    monthDays.push(i);
  }

  // -------------------------------------------------------------
  // Agenda sorting (Chronological)
  // -------------------------------------------------------------
  const agendaEvents = [...filteredEvents].sort((a, b) =>
    a.dateStr.localeCompare(b.dateStr)
  );

  // Group by dateStr for agenda
  const agendaGroups: { [dateStr: string]: CalendarEvent[] } = {};
  agendaEvents.forEach((ev) => {
    if (!agendaGroups[ev.dateStr]) {
      agendaGroups[ev.dateStr] = [];
    }
    agendaGroups[ev.dateStr].push(ev);
  });

  return (
    <div className="space-y-6 pb-20 sm:pb-12 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#0f1d33] text-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-400">
              OPERATIONS SCHEDULE
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-blue-400" />
            <span>Phuket Operations Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Single view for all villa inspections, contractor visits, Home Watch checks, and follow-ups.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setViewMode('agenda')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'agenda'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Agenda (Mobile)
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Month View
          </button>
        </div>
      </div>

      {/* Filter and Date Navigation Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-extrabold text-slate-900 ml-2">
            {currentMonthYear}
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              filterType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({events.length})
          </button>
          <button
            onClick={() => setFilterType('jobs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              filterType === 'jobs'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Jobs
          </button>
          <button
            onClick={() => setFilterType('appointments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              filterType === 'appointments'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Appointments
          </button>
          <button
            onClick={() => setFilterType('homewatch')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              filterType === 'homewatch'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Home Watch
          </button>
          <button
            onClick={() => setFilterType('followups')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              filterType === 'followups'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Follow-ups
          </button>
        </div>
      </div>

      {/* Calendar Views */}
      {viewMode === 'month' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center py-2.5 text-[11px] font-black uppercase text-slate-500">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[500px]">
            {monthDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="bg-slate-50/40 p-1 min-h-[90px]" />;
              }

              const formattedDay = day < 10 ? `0${day}` : `${day}`;
              const formattedMonth = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
              const cellDateStr = `${year}-${formattedMonth}-${formattedDay}`;

              const dayEvents = filteredEvents.filter((e) => e.dateStr === cellDateStr);
              const isToday = cellDateStr === new Date().toISOString().slice(0, 10);

              return (
                <div
                  key={cellDateStr}
                  className={`p-1.5 sm:p-2 min-h-[90px] flex flex-col justify-between transition-colors ${
                    isToday ? 'bg-blue-50/40 font-bold' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-blue-600 text-white font-extrabold'
                          : 'text-slate-700 font-semibold'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 flex-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => handleEventClick(ev)}
                        className="text-[10px] p-1 rounded font-medium truncate cursor-pointer bg-white border border-slate-200 hover:border-blue-400 hover:shadow-2xs transition-all flex items-center justify-between"
                      >
                        <span className="truncate mr-1 font-bold text-slate-800">
                          {ev.title}
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            ev.status === 'Confirmed'
                              ? 'bg-emerald-500'
                              : ev.status === 'Not Confirmed'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                        />
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] font-bold text-blue-600 text-center">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda View (Mobile Friendly) */
        <div className="space-y-4">
          {Object.keys(agendaGroups).map((dateKey) => {
            const dateObj = new Date(dateKey);
            const isToday = dateKey === new Date().toISOString().slice(0, 10);
            const dateTitle = dateObj.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={dateKey} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span
                    className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isToday ? 'Today' : dateTitle}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {dateKey}
                  </span>
                </div>

                <div className="space-y-2">
                  {agendaGroups[dateKey].map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-4 shadow-xs transition-all flex items-start sm:items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getStatusBadge(
                              event.status
                            )}`}
                          >
                            {event.status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {event.type}
                          </span>
                          {event.timeStr && (
                            <span className="text-xs font-mono font-medium text-slate-600 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {event.timeStr}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">
                          {event.subtitle}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {event.rawJob && (
                          <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                            <span>Open</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {Object.keys(agendaGroups).length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No events scheduled</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No jobs, appointments, or follow-ups match your current filter.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
