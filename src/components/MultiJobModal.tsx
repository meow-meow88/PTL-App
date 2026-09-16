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
} from 'lucide-react';
import { InspectionJob } from '../types';

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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredJobs = (jobs || []).filter((j) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Inspection':
        return (
          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-700" />
            <span>กำลังตรวจ (Inspection)</span>
          </span>
        );
      case 'Quoted':
        return (
          <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full border border-blue-300 flex items-center gap-1">
            <Layers className="w-3 h-3 text-blue-700" />
            <span>เสนอราคาแล้ว (Quoted)</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>เสร็จสิ้น (Completed)</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto w-full max-w-full">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200 min-w-0">
        <button
          onClick={onClose}
          className="absolute top-3.5 sm:top-4 right-3.5 sm:right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors"
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
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                ตารางงานตรวจวันนี้ &amp; สลับวิลล่า (Multi-Site Manager)
              </h2>
              <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full">
                {jobs.length} สถานที่
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              วันนึงตรวจหลายที่ สามารถสลับงานได้ทันที 1 คลิก โดยรูปภาพ ข้อมูล และใบเสนอราคาของแต่ละที่จะแยกเก็บอิสระ
            </p>
          </div>
        </div>

        {/* Top Controls: Search + Add New */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อวิลล่า, ลูกค้า หรือสถานที่..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 outline-hidden focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {onOpenBackupModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBackupModal();
                }}
                className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-2 rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
                title="เปิดระบบสำรองและกู้คืนข้อมูล"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>💾 สำรอง/กู้คืน</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onAddNewJob();
              }}
              className="inline-flex items-center justify-center gap-1.5 bg-[#102a4e] hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-sky-300" />
              <span>+ สร้างงานตรวจใหม่</span>
            </button>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-2.5 max-h-[58vh] overflow-y-auto pr-1">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              ไม่พบงานตรวจที่ตรงกับคำค้นหา
            </div>
          ) : (
            filteredJobs.map((j) => {
              const isCurrent = j.id === currentJobId;
              const itemCount = j.items?.length || 0;
              const hwList = j.quotation?.hardwareItems || [];
              const svList = j.quotation?.serviceItems || [];
              const feeRate = j.quotation?.procurementFeeRate ?? 0.15;
              const totalAmount =
                hwList.reduce((s, h) => s + (h?.amount || 0), 0) * (1 + feeRate) +
                svList.reduce((s, sv) => s + (sv?.amount || 0), 0);

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
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {j.villaName}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-blue-600 text-white font-black px-2 py-0.2 rounded-full">
                            ★ กำลังเปิดใช้งานอยู่
                          </span>
                        )}
                        {getStatusBadge(j.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-800">{j.customerName}</span>
                          <span className="text-[10px] text-slate-400">({j.customerGroup})</span>
                        </div>
                        <div className="flex items-center gap-1 truncate max-w-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{j.propertyLocation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                      {!isCurrent ? (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectJob(j.id);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 text-xs bg-[#102a4e] hover:bg-blue-900 text-white font-bold px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                        >
                          <span>สลับไปตรวจที่นี่</span>
                          <ArrowRight className="w-3.5 h-3.5 text-sky-300" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onClose}
                          className="inline-flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>เปิดตรวจต่อ</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDuplicateJob(j)}
                        title="คัดลอกเป็นงานใหม่ (เช่น ตรวจหลังข้างเคียง)"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {jobs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`ต้องการลบงาน "${j.villaName}" ใช่หรือไม่?`)) {
                              onDeleteJob(j.id);
                            }
                          }}
                          title="ลบงานนี้"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Job Specs Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{j.inspectionDate}</span>
                      </span>
                      <span className="font-mono text-slate-400">ID: {j.id}</span>
                    </div>

                    <div className="flex items-center gap-3 font-medium">
                      <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        📸 {itemCount} จุดตรวจ
                      </span>
                      <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-bold">
                        ฿{Math.round(totalAmount).toLocaleString()} THB
                      </span>
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
              <strong>Tip สำหรับวันตรวจหลายวิลล่า:</strong> ท่านสามารถสร้างงานตรวจไว้ล่วงหน้าตอนเช้า แล้วเมื่อถึงแต่ละวิลล่าเพียงกดสลับงาน ข้อมูลรูปถ่ายจะเข้าโฟลเดอร์ของวิลล่านั้นทันที
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-600 hover:text-slate-900 font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
