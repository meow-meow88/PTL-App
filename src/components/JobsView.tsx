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
} from 'lucide-react';
import { InspectionJob, JobStatus } from '../types';

interface JobsViewProps {
  jobs: InspectionJob[];
  onOpenQuickJob: () => void;
  onOpenJobInspection: (jobId: string) => void;
  onOpenJobQuotation: (jobId: string) => void;
  onOpenJobReport: (jobId: string) => void;
  onUpdateJobStatus: (jobId: string, status: JobStatus) => void;
}

export const JobsView: React.FC<JobsViewProps> = ({
  jobs,
  onOpenQuickJob,
  onOpenJobInspection,
  onOpenJobQuotation,
  onOpenJobReport,
  onUpdateJobStatus,
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
    if (statusFilter === 'inspection') {
      return job.status === 'Inspection';
    }
    if (statusFilter === 'quoted') {
      return job.status === 'Quoted';
    }
    if (statusFilter === 'completed') {
      return job.status === 'Completed';
    }
    return true;
  });

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
            Solo operator task tracking, field inspections, quotations, and completed records
          </p>
        </div>

        <button
          onClick={onOpenQuickJob}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95"
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

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Jobs' },
            { id: 'inspection', label: 'Field Checks' },
            { id: 'waiting_customer', label: 'Waiting Customer' },
            { id: 'waiting_vendor', label: 'Waiting Vendor' },
            { id: 'quoted', label: 'Quoted' },
            { id: 'completed', label: 'Completed' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === f.id
                  ? 'bg-[#0f1d33] text-white'
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
          const hardwareTotal =
            job.quotation?.hardwareItems?.reduce((s, i) => s + (i.amount || 0), 0) || 0;
          const serviceTotal =
            job.quotation?.serviceItems?.reduce((s, i) => s + (i.amount || 0), 0) || 0;
          const totalPrice = job.price || hardwareTotal + serviceTotal;

          return (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-4 sm:p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              {/* Job Info */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {job.id}
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      job.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : job.status === 'Quoted'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-blue-100 text-blue-900'
                    }`}
                  >
                    {job.status}
                  </span>
                  {job.waitingOn && job.waitingOn !== 'none' && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      Waiting: {job.waitingOn}
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

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
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
                  {totalPrice > 0 && (
                    <span className="font-bold text-slate-800">
                      Agreed/Quoted: ฿{totalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  onClick={() => onOpenJobInspection(job.id)}
                  className="px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors"
                  title="Open field inspection, photos, and findings"
                >
                  Inspect ({job.items?.length || 0})
                </button>

                <button
                  onClick={() => onOpenJobQuotation(job.id)}
                  className="px-3 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-2xs transition-colors"
                  title="Open quotation and invoice calculations"
                >
                  Quote / Invoice
                </button>

                <button
                  onClick={() => onOpenJobReport(job.id)}
                  className="px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-2xs transition-colors"
                  title="Preview and generate 3 bilingual PDFs"
                >
                  3 PDF
                </button>

                <button
                  onClick={() =>
                    onUpdateJobStatus(
                      job.id,
                      job.status === 'Completed' ? 'Inspection' : 'Completed'
                    )
                  }
                  className={`p-2 rounded-xl border transition-colors ${
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
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
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
