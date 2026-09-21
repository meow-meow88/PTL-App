import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  CloudCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  Building2,
  HardDrive,
  RefreshCw,
  Smartphone,
  Server,
  DollarSign,
} from 'lucide-react';
import {
  InspectionJob,
  Customer,
  Property,
  Expense,
  Invoice,
  Payment,
  Vendor,
  RecurringService,
  Task,
} from '../types';
import { getLocalSnapshots, LocalSnapshot, restoreLocalSnapshot } from '../utils/storage';

interface ServerBackup {
  filename: string;
  timestamp: string;
  jobCount: number;
  totalFindings: number;
  villaNames: string[];
  sizeBytes: number;
}

interface BackupRestoreModalProps {
  jobs: InspectionJob[];
  activeJobId: string;
  customers?: Customer[];
  properties?: Property[];
  expenses?: Expense[];
  invoices?: Invoice[];
  payments?: Payment[];
  vendors?: Vendor[];
  recurringServices?: RecurringService[];
  tasks?: Task[];
  onRestoreJobs: (jobs: InspectionJob[], activeJobId?: string) => void;
  onRestoreAllData?: (payload: {
    jobs: InspectionJob[];
    activeJobId?: string;
    customers?: Customer[];
    properties?: Property[];
    expenses?: Expense[];
    invoices?: Invoice[];
    payments?: Payment[];
    vendors?: Vendor[];
    recurringServices?: RecurringService[];
    tasks?: Task[];
  }) => void;
  onForceSaveToServer: () => Promise<boolean>;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  jobs,
  activeJobId,
  customers = [],
  properties = [],
  expenses = [],
  invoices = [],
  payments = [],
  vendors = [],
  recurringServices = [],
  tasks = [],
  onRestoreJobs,
  onRestoreAllData,
  onForceSaveToServer,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'local' | 'server'>('local');
  const [localSnapshots, setLocalSnapshots] = useState<LocalSnapshot[]>([]);
  const [backups, setBackups] = useState<ServerBackup[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [restoringFilename, setRestoringFilename] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchLocalSnapshots = async () => {
    try {
      const list = await getLocalSnapshots();
      setLocalSnapshots(list);
    } catch (err) {
      console.error('Failed to fetch local snapshots:', err);
    }
  };

  const fetchBackups = async () => {
    try {
      setIsLoadingBackups(true);
      const res = await fetch('/api/jobs/backups');
      const data = await res.json();
      if (data.success && Array.isArray(data.backups)) {
        setBackups(data.backups);
      }
    } catch (err) {
      console.error('Failed to fetch backups:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchLocalSnapshots();
    fetchBackups();
  }, []);

  // Restore a local snapshot from IndexedDB
  const handleRestoreLocalSnapshot = async (snapshot: LocalSnapshot) => {
    if (
      !confirm(
        `คุณต้องการกู้คืนข้อมูลจากจุดบันทึกในเครื่อง "${snapshot.formattedTime}" (${snapshot.jobCount} วิลล่า, ${snapshot.totalFindings} จุดตรวจ) หรือไม่?`
      )
    ) {
      return;
    }
    try {
      onRestoreJobs(snapshot.jobs, snapshot.activeJobId);
      setFeedbackMessage(`กู้คืนข้อมูลจากจุดบันทึกในเครื่อง (${snapshot.formattedTime}) สำเร็จเรียบร้อย!`);
    } catch (err) {
      console.error('Local restore error:', err);
      alert('เกิดข้อผิดพลาดในการกู้คืน');
    }
  };

  // Export current jobs + financials as a downloadable JSON file
  const handleExportJson = () => {
    try {
      const exportData = {
        version: '3.0.0-phase3',
        exportedAt: new Date().toISOString(),
        activeJobId,
        jobs,
        customers,
        properties,
        expenses,
        invoices,
        payments,
        vendors,
        recurringServices,
        tasks,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `PTL_Full_Backup_${dateStr}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedbackMessage('ดาวน์โหลดไฟล์สำรองข้อมูล JSON (รวมระบบการเงิน ลูกค้า เวนเดอร์ และงานประจำ) เรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  // Import JSON backup from disk
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const parsed = JSON.parse(raw);
        let importedJobs: InspectionJob[] = [];
        let importedActiveId = activeJobId;

        if (Array.isArray(parsed)) {
          importedJobs = parsed;
        } else if (parsed && Array.isArray(parsed.jobs)) {
          importedJobs = parsed.jobs;
          if (parsed.activeJobId) importedActiveId = parsed.activeJobId;
        }

        if (importedJobs.length === 0) {
          alert('ไฟล์ไม่มีข้อมูลงานวิลล่าที่ถูกต้อง');
          return;
        }

        const hasFinancials =
          parsed &&
          (Array.isArray(parsed.expenses) ||
            Array.isArray(parsed.invoices) ||
            Array.isArray(parsed.payments));

        const hasAnyCollections =
          parsed &&
          (Array.isArray(parsed.expenses) ||
            Array.isArray(parsed.invoices) ||
            Array.isArray(parsed.payments) ||
            Array.isArray(parsed.customers) ||
            Array.isArray(parsed.properties) ||
            Array.isArray(parsed.vendors) ||
            Array.isArray(parsed.recurringServices) ||
            Array.isArray(parsed.tasks));

        if (
          confirm(
            `พบข้อมูลงานวิลล่าจำนวน ${importedJobs.length} หลัง ${
              hasFinancials ? '(รวมข้อมูลบัญชี/ใบแจ้งหนี้/เวนเดอร์)' : ''
            } ต้องการกู้คืนข้อมูลทันทีหรือไม่?`
          )
        ) {
          if (onRestoreAllData && hasAnyCollections) {
            onRestoreAllData({
              jobs: importedJobs,
              activeJobId: importedActiveId,
              customers: Array.isArray(parsed.customers) ? parsed.customers : undefined,
              properties: Array.isArray(parsed.properties) ? parsed.properties : undefined,
              expenses: Array.isArray(parsed.expenses) ? parsed.expenses : undefined,
              invoices: Array.isArray(parsed.invoices) ? parsed.invoices : undefined,
              payments: Array.isArray(parsed.payments) ? parsed.payments : undefined,
              vendors: Array.isArray(parsed.vendors) ? parsed.vendors : undefined,
              recurringServices: Array.isArray(parsed.recurringServices) ? parsed.recurringServices : undefined,
              tasks: Array.isArray(parsed.tasks) ? parsed.tasks : undefined,
            });
          } else {
            onRestoreJobs(importedJobs, importedActiveId);
          }
          setFeedbackMessage(`กู้คืนข้อมูลสำเร็จเรียบร้อย! (${importedJobs.length} วิลล่า)`);
        }
      } catch (err) {
        console.error(err);
        alert('ไฟล์ JSON ไม่ถูกต้อง หรือข้อมูลเสียหาย');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Restore a server snapshot
  const handleRestoreServerSnapshot = async (filename: string) => {
    if (!confirm(`คุณต้องการกู้คืนข้อมูลจากชุดสำรองบนเซิร์ฟเวอร์ "${filename}" หรือไม่? ข้อมูลปัจจุบันจะถูกปรับให้ตรงกับจุดที่เลือก`)) {
      return;
    }
    try {
      setRestoringFilename(filename);
      const res = await fetch('/api/jobs/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        onRestoreJobs(data.jobs, data.activeJobId);
        setFeedbackMessage(`กู้คืนจากเซิร์ฟเวอร์สำเร็จ (${data.jobs.length} วิลล่า)`);
        fetchBackups();
      } else {
        alert(data.error || 'ไม่สามารถกู้คืนข้อมูลได้');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setRestoringFilename(null);
    }
  };

  // Trigger immediate force save to server
  const handleForceSave = async () => {
    setIsSaving(true);
    const success = await onForceSaveToServer();
    setIsSaving(false);
    if (success) {
      setFeedbackMessage('บันทึกข้อมูลปัจจุบันขึ้นเซิร์ฟเวอร์และสร้างชุดสำรองใหม่เรียบร้อย!');
      fetchBackups();
    } else {
      alert('บันทึกขึ้นเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const totalFindings = jobs.reduce((acc, j) => acc + (j.items?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto w-full">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hidden File Input for Import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5 border-b border-slate-200 pb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#102a4e] flex items-center gap-2">
              <span>ระบบรักษาความปลอดภัยข้อมูลงานวิลล่า</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                Triple-Redundant Protection
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              ข้อมูลที่คุณพิมพ์บันทึกได้รับการคุ้มครอง 3 ชั้น (เซิร์ฟเวอร์ + IndexedDB ในเครื่อง + LocalStorage) พร้อมระบบประวัติสำรองข้อมูลอัตโนมัติ ไม่มีการลบข้อมูลโดยพลการเด็ดขาด
            </p>
          </div>
        </div>

        {feedbackMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Current State Summary */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500">ข้อมูลปัจจุบันที่กำลังทำงาน: </span>
            <span className="font-bold text-slate-900">{jobs.length} วิลล่า</span>
            <span className="mx-1 text-slate-300">•</span>
            <span className="font-bold text-emerald-700">{totalFindings} จุดตรวจ/ข้อสังเกต</span>
          </div>
          <button
            onClick={handleForceSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer text-xs"
          >
            <CloudCheck className="w-4 h-4" />
            <span>{isSaving ? 'กำลังบันทึก...' : 'กดบันทึกขึ้นเซิร์ฟเวอร์ทันที'}</span>
          </button>
        </div>

        {/* Primary Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-sky-950 text-sm mb-1">
                <Download className="w-4 h-4 text-sky-700" />
                <span>ดาวน์โหลดไฟล์สำรองข้อมูล (.JSON)</span>
              </div>
              <p className="text-[11px] text-slate-600 mb-3">
                บันทึกไฟล์ข้อมูลงานทั้งหมดลงในมือถือหรือคอมพิวเตอร์ของคุณ สามารถเปิดกู้คืนได้ทุกเมื่อแม้ออฟไลน์
              </p>
            </div>
            <button
              onClick={handleExportJson}
              className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดไฟล์สำรองทันที</span>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
                <Upload className="w-4 h-4 text-slate-700" />
                <span>นำเข้าไฟล์สำรองข้อมูล (.JSON)</span>
              </div>
              <p className="text-[11px] text-slate-600 mb-3">
                เลือกไฟล์สำรองที่คุณเคยบันทึกไว้เพื่อนำกลับมาใส่ในแอปทันที
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>เลือกไฟล์จากเครื่องเพื่อกู้คืน</span>
            </button>
          </div>
        </div>

        {/* Rolling Snapshots List with Local & Server Tabs */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('local')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'local'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>จุดย้อนหลังในเครื่อง ({localSnapshots.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('server')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'server'
                    ? 'bg-white text-sky-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Server className="w-3.5 h-3.5 text-sky-600" />
                <span>บนเซิร์ฟเวอร์ ({backups.length})</span>
              </button>
            </div>

            <button
              onClick={() => {
                fetchLocalSnapshots();
                fetchBackups();
              }}
              className="text-[11px] text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingBackups ? 'animate-spin' : ''}`} />
              <span>รีเฟรชประวัติ</span>
            </button>
          </div>

          {activeTab === 'local' ? (
            localSnapshots.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                ยังไม่มีจุดย้อนหลังในเครื่อง ระบบจะบันทึกจุดย้อนหลังอัตโนมัติทุกครั้งที่คุณเพิ่มหรือแก้ไขจุดตรวจ
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {localSnapshots.map((s, idx) => (
                  <div
                    key={s.timestamp + idx}
                    className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 hover:border-emerald-300 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-slate-900">{s.formattedTime}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          {s.jobCount} วิลล่า ({s.totalFindings} จุดตรวจ)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate">
                        วิลล่า: {s.villaNames?.length > 0 ? s.villaNames.join(', ') : 'ไม่มีชื่อ'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestoreLocalSnapshot(s)}
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer text-xs shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>กู้คืนจุดนี้</span>
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : isLoadingBackups && backups.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              กำลังโหลดรายการสำรองข้อมูล...
            </div>
          ) : backups.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              ยังไม่มีประวัติสำรองข้อมูลเดิม เมื่อคุณกดบันทึกหรือตรวจงาน ระบบจะสร้างจุดสำรองอัตโนมัติให้อย่างต่อเนื่อง
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {backups.map((b) => {
                const dateObj = new Date(b.timestamp);
                const formattedDate = dateObj.toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const isRestoring = restoringFilename === b.filename;

                return (
                  <div
                    key={b.filename}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-sky-300 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-slate-900">{formattedDate}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                          {b.jobCount} วิลล่า ({b.totalFindings} จุดตรวจ)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        วิลล่า: {b.villaNames.length > 0 ? b.villaNames.join(', ') : 'ไม่มีชื่อ'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestoreServerSnapshot(b.filename)}
                      disabled={isRestoring}
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold transition-colors cursor-pointer text-xs disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                      <span>{isRestoring ? 'กำลังกู้คืน...' : 'กู้คืนจุดนี้'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>ระบบบันทึกอัตโนมัติทุกครั้งที่มีการพิมพ์หรืออัปโหลดรูป</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
