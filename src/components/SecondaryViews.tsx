import React from 'react';
import {
  DollarSign,
  FileText,
  Truck,
  Calendar,
  Settings,
  ShieldCheck,
  FolderOpen,
  Upload,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { InspectionJob, MainNavTab } from '../types';

interface SecondaryViewsProps {
  tab: MainNavTab;
  jobs: InspectionJob[];
  onOpenJobReport: (jobId: string) => void;
  onOpenJobQuotation: (jobId: string) => void;
  onOpenBackupModal: () => void;
  onOpenGoogleDrive: () => void;
  onOpenDashboard: () => void;
  onOpenMollyExpress: () => void;
}

export const SecondaryViews: React.FC<SecondaryViewsProps> = ({
  tab,
  jobs,
  onOpenJobReport,
  onOpenJobQuotation,
  onOpenBackupModal,
  onOpenGoogleDrive,
  onOpenDashboard,
  onOpenMollyExpress,
}) => {
  if (tab === 'money') {
    const totalRevenue = jobs.reduce((sum, j) => {
      const hw = j.quotation?.hardwareItems?.reduce((s, i) => s + (i.amount || 0), 0) || 0;
      const sv = j.quotation?.serviceItems?.reduce((s, i) => s + (i.amount || 0), 0) || 0;
      return sum + (j.price || hw + sv);
    }, 0);

    const paidRevenue = jobs
      .filter((j) => j.status === 'Paid' || j.status === 'Completed')
      .reduce((sum, j) => {
        const hw = j.quotation?.hardwareItems?.reduce((s, i) => s + (i.amount || 0), 0) || 0;
        const sv = j.quotation?.serviceItems?.reduce((s, i) => s + (i.amount || 0), 0) || 0;
        return sum + (j.price || hw + sv);
      }, 0);

    return (
      <div className="max-w-7xl mx-auto space-y-5 pb-20 sm:pb-12">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Money &amp; Finance</span>
            </h2>
            <p className="text-xs text-slate-500">
              Solo operator revenue snapshot and payment tracking
            </p>
          </div>
          <button
            onClick={onOpenDashboard}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            <span>Open Advanced Emily Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <span className="text-xs text-slate-400 font-bold uppercase">Total Booked Volume</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              ฿{totalRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500">{jobs.length} jobs total</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <span className="text-xs text-emerald-600 font-bold uppercase">Collected / Paid</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              ฿{paidRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500">From completed &amp; paid jobs</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <span className="text-xs text-amber-600 font-bold uppercase">Awaiting Collection</span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              ฿{(totalRevenue - paidRevenue).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500">Pending quote / active work</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Recent Invoices &amp; Quotes</h3>
          <div className="space-y-2">
            {jobs.map((j) => (
              <div
                key={j.id}
                className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{j.customerName}</div>
                  <div className="text-slate-500">{j.villaName} • Ref: {j.quotation?.refNo || j.id}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-800">
                    ฿{(j.price || j.quotation?.hardwareItems?.reduce((s, i) => s + i.amount, 0) || 0).toLocaleString()}
                  </span>
                  <button
                    onClick={() => onOpenJobQuotation(j.id)}
                    className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'documents') {
    return (
      <div className="max-w-7xl mx-auto space-y-4 pb-20 sm:pb-12">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Documents &amp; 3-PDF Hub</span>
            </h2>
            <p className="text-xs text-slate-500">
              Inspection reports, formal quotations, and bilingual tax invoices
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((j) => (
            <div
              key={j.id}
              className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between gap-3"
            >
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">{j.id}</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{j.villaName}</h3>
                <p className="text-xs text-slate-500">{j.customerName} • {j.serviceType}</p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onOpenJobReport(j.id)}
                  className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg text-center"
                >
                  3-PDF Suite (Inspection / Quote / Invoice)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'vendors') {
    return (
      <div className="max-w-7xl mx-auto space-y-4 pb-20 sm:pb-12">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-600">
            <Truck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Vendors &amp; Contractors Directory</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Direct coordination with pool cleaners, pest control, air conditioning technicians, and electricians will be available in Phase 2.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenMollyExpress}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f1d33] text-amber-300 rounded-xl text-xs font-bold"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Use Molly Express for Hardware Procurement</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'calendar') {
    return (
      <div className="max-w-7xl mx-auto space-y-4 pb-20 sm:pb-12">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Calendar &amp; Itinerary</span>
          </h2>
          <p className="text-xs text-slate-500">
            Full schedule of planned villa inspections and appointments
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          {jobs.map((j) => (
            <div
              key={j.id}
              className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 text-center py-1 bg-slate-100 rounded-lg">
                  <div className="font-bold text-slate-900">
                    {j.scheduledDate?.slice(-2) || j.inspectionDate?.slice(0, 2) || '18'}
                  </div>
                  <div className="text-[9px] uppercase text-slate-500 font-bold">DATE</div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{j.villaName}</h4>
                  <p className="text-slate-500">{j.customerName} • {j.serviceType}</p>
                </div>
              </div>
              <span className="font-bold text-blue-600">{j.scheduledTime || 'Scheduled'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'settings') {
    return (
      <div className="max-w-7xl mx-auto space-y-5 pb-20 sm:pb-12">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            <span>System Settings &amp; Data Safety</span>
          </h2>
          <p className="text-xs text-slate-500">
            Backup &amp; restore, Google Drive synchronization, and company profile
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Backup &amp; Multi-Tier Restore
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Download JSON snapshots of all jobs, customer CRM data, and findings. Restore instantly at any time.
            </p>
            <button
              onClick={onOpenBackupModal}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs"
            >
              Open Backup &amp; Restore Manager
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Google Drive High-Res Sync
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Link inspection folders directly to Google Drive so high-resolution evidence is shared with clients.
            </p>
            <button
              onClick={onOpenGoogleDrive}
              className="w-full py-2.5 bg-[#0f1d33] hover:bg-slate-800 text-sky-200 rounded-xl font-bold text-xs"
            >
              Configure Google Drive Integration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
