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
  Languages,
} from 'lucide-react';
import {
  InspectionJob,
  MainNavTab,
  Vendor,
  RecurringService,
  Task,
  Property,
  Customer,
} from '../types';
import { VendorsView } from './VendorsView';
import { CalendarView } from './CalendarView';
import { useLanguage } from '../i18n/translations';

interface SecondaryViewsProps {
  tab: MainNavTab;
  jobs: InspectionJob[];
  vendors?: Vendor[];
  recurringServices?: RecurringService[];
  tasks?: Task[];
  properties?: Property[];
  customers?: Customer[];
  onOpenJobReport: (jobId: string) => void;
  onOpenJobQuotation: (jobId: string) => void;
  onOpenJobInspection?: (jobId: string) => void;
  onOpenBackupModal: () => void;
  onOpenGoogleDrive: () => void;
  onOpenDashboard: () => void;
  onOpenMollyExpress: () => void;
  onSaveVendor?: (vendor: Vendor) => void;
  onOpenScheduleModal?: (job: InspectionJob) => void;
  onOpenProperty?: (propId: string) => void;
}

export const SecondaryViews: React.FC<SecondaryViewsProps> = ({
  tab,
  jobs,
  vendors = [],
  recurringServices = [],
  tasks = [],
  properties = [],
  customers = [],
  onOpenJobReport,
  onOpenJobQuotation,
  onOpenJobInspection,
  onOpenBackupModal,
  onOpenGoogleDrive,
  onOpenDashboard,
  onOpenMollyExpress,
  onSaveVendor,
  onOpenScheduleModal,
  onOpenProperty,
}) => {
  const { lang, setLanguage, t } = useLanguage();
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
              ฿{(totalRevenue || 0).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500">{jobs.length} jobs total</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <span className="text-xs text-emerald-600 font-bold uppercase">Collected / Paid</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              ฿{(paidRevenue || 0).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500">From completed &amp; paid jobs</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <span className="text-xs text-amber-600 font-bold uppercase">Awaiting Collection</span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              ฿{((totalRevenue || 0) - (paidRevenue || 0)).toLocaleString()}
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
      <VendorsView
        vendors={vendors}
        jobs={jobs}
        onSaveVendor={onSaveVendor || (() => {})}
        onOpenJobDetail={onOpenJobInspection}
      />
    );
  }

  if (tab === 'calendar') {
    return (
      <CalendarView
        jobs={jobs}
        recurringServices={recurringServices}
        tasks={tasks}
        properties={properties}
        customers={customers}
        onOpenJobDetail={onOpenJobInspection || (() => {})}
        onOpenQuickSchedule={onOpenScheduleModal}
        onOpenProperty={onOpenProperty}
      />
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
          {/* Language & UI Settings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'th' ? 'ภาษาเมนูและการแสดงผล' : 'UI Language & Locale'}
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              {lang === 'th'
                ? 'เลือกภาษาสำหรับหน้าจอการทำงานของผู้ดูแลระบบ เอกสารเสนอราคาและรายงานสำหรับลูกค้าจะยังคงเลือกภาษาอังกฤษหรือไทยได้แยกต่างหาก'
                : 'Select interface language for the solo operator. Customer quotations, invoices, and PDF reports retain their own dedicated language.'}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                  lang === 'en'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                English (Default)
              </button>
              <button
                onClick={() => setLanguage('th')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                  lang === 'th'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                ภาษาไทย (Thai)
              </button>
            </div>
          </div>

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
