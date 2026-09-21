import React, { useState } from 'react';
import {
  X,
  Building2,
  Calendar,
  MapPin,
  User,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Search,
  Trash2,
  Copy,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { InspectionJob } from '../types';
import { useLanguage } from '../i18n/translations';
import { getLocalizedServiceName } from '../utils/serviceWorkflow';
import { formatTime24h } from '../utils/dateTime';

interface MultiJobModalProps {
  currentJobId: string;
  jobs: InspectionJob[];
  onSelectJob: (jobId: string) => void;
  onAddNewJob: () => void;
  onDuplicateJob: (job: InspectionJob) => void;
  onDeleteJob: (jobId: string) => void;
  onClose: () => void;
  onOpenBackupModal?: () => void;
}

export const MultiJobModal: React.FC<MultiJobModalProps> = ({
  currentJobId,
  jobs = [],
  onSelectJob,
  onAddNewJob,
  onDuplicateJob,
  onDeleteJob,
  onClose,
  onOpenBackupModal,
}) => {
  const { lang, t } = useLanguage();
  const isTh = lang === 'th';

  const [tab, setTab] = useState<'active' | 'all'>('active');
  const [searchTerm, setSearchTerm] = useState('');

  // Active jobs filter (In Progress, actualStartedAt, visitStartedAt, siteArrivedAt, or Scheduled today)
  const activeJobs = (jobs || []).filter(
    (j) =>
      j.status === 'In Progress' ||
      Boolean(j.visitStartedAt) ||
      Boolean(j.siteArrivedAt) ||
      Boolean(j.actualStartedAt) ||
      j.status === 'Waiting Approval' ||
      j.status === 'Waiting Vendor'
  );

  const displayList = tab === 'active' ? (activeJobs.length > 0 ? activeJobs : jobs) : jobs;

  const filteredJobs = displayList.filter((j) => {
    if (!j) return false;
    const q = (searchTerm || '').toLowerCase().trim();
    if (!q) return true;

    const villa = (j.villaName || '').toLowerCase();
    const customer = (j.customerName || '').toLowerCase();
    const location = (j.propertyLocation || '').toLowerCase();
    const id = (j.id || '').toLowerCase();
    const service = (j.serviceType || '').toLowerCase();

    return (
      villa.includes(q) ||
      customer.includes(q) ||
      location.includes(q) ||
      id.includes(q) ||
      service.includes(q)
    );
  });

  const getProgressSummary = (j: InspectionJob) => {
    if (j.items && j.items.length > 0) {
      const completed = j.items.filter((it) => !!it.imageUrl || it.status === 'Normal').length;
      return `${completed}/${j.items.length} ${isTh ? 'จุดตรวจ' : 'items checked'}`;
    }
    if (j.assignedVendorName) {
      return `${isTh ? 'ช่าง' : 'Vendor'}: ${j.assignedVendorName} (${j.vendorStatus || (isTh ? 'กำลังเดินทาง' : 'Dispatched')})`;
    }
    if (j.visitStartedAt) {
      return `${isTh ? 'เริ่มตรวจเมื่อ' : 'Started at'} ${formatTime24h(j.visitStartedAt)}`;
    }
    return j.status;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto w-full max-w-full">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200 min-w-0">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 sm:top-4 right-3.5 sm:right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {isTh ? 'สลับงานที่กำลังดำเนินการ' : 'Switch Active Job'}
              </h2>
              <span className="text-[10px] bg-blue-100 text-blue-900 font-extrabold px-2 py-0.5 rounded-full">
                {activeJobs.length} {isTh ? 'งานกำลังทำ' : 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTh
                ? 'สลับไปทำงานอื่นได้ทันที 1 คลิก โดยข้อมูล รูปถ่าย และใบเสนอราคาจะแยกบันทึกอิสระ'
                : 'Instantly switch between concurrent field jobs. All photos and data remain safely isolated.'}
            </p>
          </div>
        </div>

        {/* Tab Toggle: Active Jobs vs All Jobs */}
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              tab === 'active'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isTh ? 'งานที่กำลังดำเนินการ' : 'Active Jobs'} ({activeJobs.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              tab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isTh ? 'งานทั้งหมด' : 'All Jobs'} ({jobs.length})
          </button>
        </div>

        {/* Top Controls: Search + Add New */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isTh ? 'ค้นหาชื่อวิลล่า ลูกค้า หรือสถานที่...' : 'Search villa, customer, or location...'}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 outline-hidden focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddNewJob();
              }}
              className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black px-4 py-2 rounded-xl text-xs transition-colors shadow-xs shrink-0 cursor-pointer min-h-[40px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isTh ? '+ งานใหม่' : '+ New Job'}</span>
            </button>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-2.5 max-h-[58vh] overflow-y-auto pr-1">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              {isTh ? 'ไม่พบงานที่ค้นหา' : 'No matching jobs found'}
            </div>
          ) : (
            filteredJobs.map((j) => {
              const isCurrent = j.id === currentJobId;
              const progressStr = getProgressSummary(j);

              return (
                <div
                  key={j.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-extrabold text-slate-900 text-sm truncate">
                          {j.villaName || j.customerName || j.serviceType}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-blue-600 text-white font-black px-2 py-0.2 rounded-full">
                            ★ {isTh ? 'กำลังเปิดอยู่' : 'Current Job'}
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                          {getLocalizedServiceName(j.serviceType, lang)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-800">{j.customerName}</span>
                        </div>
                        {j.propertyLocation && (
                          <div className="flex items-center gap-1 truncate max-w-xs">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{j.propertyLocation}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress snippet */}
                      <div className="mt-1.5 inline-block text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {progressStr}
                      </div>
                    </div>

                    {/* Action buttons (Touch target ≥44px for primary) */}
                    <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                      {!isCurrent ? (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectJob(j.id);
                            onClose();
                          }}
                          className="min-h-[44px] inline-flex items-center gap-1 text-xs bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer active:scale-95"
                        >
                          <span>{isTh ? 'ทำงานต่อ' : 'Resume Work'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-sky-300" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onClose}
                          className="min-h-[44px] inline-flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isTh ? 'เปิดต่อ' : 'Continue'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDuplicateJob(j)}
                        title={isTh ? 'คัดลอกงาน' : 'Duplicate Job'}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {jobs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(isTh ? `ต้องการลบงาน "${j.villaName}" ใช่หรือไม่?` : `Delete job "${j.villaName}"?`)) {
                              onDeleteJob(j.id);
                            }
                          }}
                          title={isTh ? 'ลบงานนี้' : 'Delete Job'}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info tip */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              <strong>PTL Multi-Site Ops:</strong> {isTh ? 'ท่านสามารถสลับงานระหว่างวันได้โดยไม่ต้องรีโหลด และไม่สูญเสียข้อมูลรูปภาพ' : 'Switch active visits without reload. Photos and progress remain safe.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-600 hover:text-slate-900 font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
          >
            {isTh ? 'ปิดหน้าต่าง' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
