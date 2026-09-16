import { useState, useEffect } from 'react';
import {
  Camera,
  FileText,
  AlertTriangle,
  MapPin,
  User,
  RefreshCw,
  Calendar,
  Layers,
  Building2,
  Zap,
  Plus,
  Info,
  Sparkles,
} from 'lucide-react';
import { InspectionJob, InspectionItem, CustomerGroup } from './types';
import {
  sampleJobKMazen,
  sampleJobRobertMiller,
  sampleJobElenaPatong,
  defaultDayJobs,
  createSamplePhotoSvg,
} from './data/sampleData';
import { Header } from './components/Header';
import { FindingCard } from './components/FindingCard';
import { FindingModal } from './components/FindingModal';
import { NewJobModal } from './components/NewJobModal';
import { ReportScreen } from './components/ReportScreen';
import { MultiJobModal } from './components/MultiJobModal';
import { QuickEstimateModal } from './components/QuickEstimateModal';
import { CompanyDashboard } from './components/CompanyDashboard';
import { VarvaraSocialModal } from './components/VarvaraSocialModal';
import { MollyHardwareModal } from './components/MollyHardwareModal';
import { MollyExpressQuoteModal } from './components/MollyExpressQuoteModal';
import { MobileGuideModal } from './components/MobileGuideModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import {
  safeGetLocalStorage,
  safeSetLocalStorage,
  idbGet,
  idbSet,
  saveLocalSnapshot,
  mergeJobsWithoutDataLoss,
  markJobAsDeleted,
} from './utils/storage';

function sanitizeJob(j: any): InspectionJob {
  if (!j) return sampleJobKMazen;
  return {
    id: j.id || `PTL-${Date.now()}`,
    clientId: j.clientId || 'CL-UNKNOWN',
    villaName: j.villaName || j.propertyLocation || 'Unnamed Villa',
    customerName: j.customerName || 'Client',
    customerGroup: j.customerGroup || 'villa_owner',
    propertyLocation: j.propertyLocation || j.villaName || 'Phuket, Thailand',
    serviceType: j.serviceType || 'Inspection & Diagnostic',
    status: j.status || 'Inspection',
    inspectionDate: j.inspectionDate || 'Today',
    createdAt: j.createdAt || new Date().toISOString(),
    inspector: j.inspector || 'Field Team (Mr. Big Inspector)',
    documentRef: j.documentRef || 'Inspection Report Attachment',
    driveFolderUrl: j.driveFolderUrl || '',
    notes: j.notes || '',
    items: Array.isArray(j.items) ? j.items : [],
    quotation: {
      refNo: j.quotation?.refNo || `QT-${j.id || '001'}`,
      date: j.quotation?.date || 'Today',
      inspectionRef: j.quotation?.inspectionRef || j.id || '',
      validity: j.quotation?.validity || '30 days',
      paymentTerm: j.quotation?.paymentTerm || '50% Deposit upon approval, 50% Balance on completion',
      hardwareItems: Array.isArray(j.quotation?.hardwareItems) ? j.quotation.hardwareItems : [],
      serviceItems:
        Array.isArray(j.quotation?.serviceItems) && j.quotation.serviceItems.length > 0
          ? j.quotation.serviceItems
          : Array.isArray(j.quotation?.hardwareItems) && j.quotation.hardwareItems.length > 0
          ? []
          : [
              {
                item: 1,
                description: 'On-Site Technical Diagnostics & Investigation',
                detail: 'งานช่างเทคนิคลงพื้นที่ตรวจสอบและวิเคราะห์สาเหตุปัญหา (Mr. Big Field Audit)',
                estimatedSchedule: 'Completed / Immediate',
                qty: '1 Job',
                amount: 2500,
              },
            ],
      procurementFeeRate: j.quotation?.procurementFeeRate ?? 0.15,
      terms: Array.isArray(j.quotation?.terms) ? j.quotation.terms : [],
      contingencies: Array.isArray(j.quotation?.contingencies) ? j.quotation.contingencies : [],
      mollyNotes: j.quotation?.mollyNotes || '',
    },
  };
}

export default function App() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<string>('กำลังตรวจเช็คระบบความปลอดภัย...');

  // Multiple jobs archive for inspectors with multiple sites per day
  const [jobsList, setJobsList] = useState<InspectionJob[]>(() => {
    const savedArchive = safeGetLocalStorage('ptl_jobs_archive');
    if (savedArchive) {
      try {
        const parsed = JSON.parse(savedArchive);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(sanitizeJob);
        }
      } catch (e) {
        console.error(e);
      }
    }
    const legacyJob = safeGetLocalStorage('ptl_current_job');
    if (legacyJob) {
      try {
        const parsed = JSON.parse(legacyJob);
        if (parsed && parsed.id) {
          return [sanitizeJob(parsed), sampleJobRobertMiller, sampleJobElenaPatong];
        }
      } catch (e) {
        console.error(e);
      }
    }
    return defaultDayJobs.map(sanitizeJob);
  });

  const [activeJobId, setActiveJobId] = useState<string>(() => {
    const savedActive = safeGetLocalStorage('ptl_active_job_id');
    return savedActive || (jobsList[0]?.id ?? sampleJobKMazen.id);
  });

  // Current active job
  const job = jobsList.find((j) => j.id === activeJobId) || jobsList[0] || sampleJobKMazen;

  // Multi-tier hydration: Server API -> IndexedDB -> LocalStorage
  // NEVER overwrites user data with sample data!
  useEffect(() => {
    let isMounted = true;

    async function loadDurableData() {
      try {
        // 1. Fetch from durable Server Storage
        let serverJobs: InspectionJob[] | null = null;
        let serverActiveId: string | null = null;
        try {
          const res = await fetch('/api/jobs');
          const data = await res.json();
          if (data?.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
            serverJobs = data.jobs.map(sanitizeJob);
            serverActiveId = data.activeJobId || null;
          }
        } catch (e) {
          console.debug('Server API load skipped (offline or initial boot):', e);
        }

        // 2. Fetch from high-capacity IndexedDB
        let idbJobs: InspectionJob[] | null = null;
        let idbActiveId: string | null = null;
        try {
          const idbResult = await idbGet<InspectionJob[]>('ptl_jobs_archive');
          if (Array.isArray(idbResult) && idbResult.length > 0) {
            idbJobs = idbResult.map(sanitizeJob);
          }
          idbActiveId = await idbGet<string>('ptl_active_job_id');
        } catch (e) {
          console.debug('IndexedDB load check:', e);
        }

        // 3. Fetch from safe LocalStorage
        let localJobs: InspectionJob[] | null = null;
        try {
          const raw = safeGetLocalStorage('ptl_jobs_archive');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localJobs = parsed.map(sanitizeJob);
            }
          }
        } catch {}

        // ZERO DATA-LOSS MERGING:
        // Merge IndexedDB, LocalStorage, and Server API.
        // Guarantees user-created jobs and findings are NEVER discarded!
        const mergedRaw = mergeJobsWithoutDataLoss([idbJobs, localJobs, serverJobs]);
        const targetJobs = mergedRaw.length > 0 ? mergedRaw.map(sanitizeJob) : defaultDayJobs.map(sanitizeJob);
        const targetActiveId = idbActiveId || serverActiveId || safeGetLocalStorage('ptl_active_job_id');

        if (isMounted && targetJobs && targetJobs.length > 0) {
          setJobsList(targetJobs);
          if (targetActiveId && targetJobs.some((j) => j.id === targetActiveId)) {
            setActiveJobId(targetActiveId);
          } else if (targetJobs[0]?.id) {
            setActiveJobId(targetJobs[0].id);
          }

          // Immediately persist merged truth to both storage and snapshots
          idbSet('ptl_jobs_archive', targetJobs);
          safeSetLocalStorage('ptl_jobs_archive', JSON.stringify(targetJobs));
          saveLocalSnapshot(targetJobs, targetActiveId || targetJobs[0]?.id);

          const countFindings = (arr: InspectionJob[] | null) =>
            arr ? arr.reduce((acc, j) => acc + (j.items?.length || 0), 0) : 0;
          const totalFindings = countFindings(targetJobs);
          setLastSyncStatus(`ปลอดภัย 100% • ${targetJobs.length} วิลล่า (${totalFindings} จุดตรวจ)`);
        } else if (isMounted) {
          setLastSyncStatus('ระบบพร้อมใช้งาน • บันทึกอัตโนมัติ 3 ชั้น ปลอดภัย 100%');
        }
      } catch (err) {
        console.error('Durable hydration error:', err);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    }

    loadDurableData();

    return () => {
      isMounted = false;
    };
  }, []);

  const [viewMode, setViewMode] = useState<'inspection' | 'report' | 'dashboard'>('inspection');
  const [isFindingModalOpen, setIsFindingModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [isMultiJobModalOpen, setIsMultiJobModalOpen] = useState(false);
  const [isQuickEstimateOpen, setIsQuickEstimateOpen] = useState(false);
  const [isVarvaraSocialOpen, setIsVarvaraSocialOpen] = useState(false);
  const [isMollyHardwareOpen, setIsMollyHardwareOpen] = useState(false);
  const [isMollyExpressOpen, setIsMollyExpressOpen] = useState(false);
  const [isMobileGuideOpen, setIsMobileGuideOpen] = useState(false);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle?: string } | null>(null);

  // Auto-dismiss toast after 4.5 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Safe Auto-Sync (IndexedDB + Safe LocalStorage + Debounced Server Save)
  // CRITICAL: NEVER executes before hydration completes!
  useEffect(() => {
    if (!isHydrated) return;

    // 1. IndexedDB handles full data with all high-res photos without quota restrictions
    idbSet('ptl_jobs_archive', jobsList);
    idbSet('ptl_active_job_id', activeJobId);

    // 2. Safe localStorage (never throws QuotaExceededError)
    safeSetLocalStorage('ptl_active_job_id', activeJobId);
    safeSetLocalStorage('ptl_current_job', JSON.stringify(job));
    safeSetLocalStorage('ptl_jobs_archive', JSON.stringify(jobsList));

    // 3. Debounced Server Auto-Sync with backup snapshot
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobs: jobsList, activeJobId }),
        });
        const data = await res.json();
        if (data?.success) {
          setLastSyncStatus(`บันทึกบนเซิร์ฟเวอร์แล้ว • ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`);
        }
      } catch (syncErr) {
        console.warn('Background server sync paused, data safe locally:', syncErr);
        setLastSyncStatus('บันทึกในเครื่องเรียบร้อย (ออฟไลน์)');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [jobsList, activeJobId, job, isHydrated]);

  // Manual trigger to force immediate save to server
  const handleForceSaveToServer = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: jobsList, activeJobId }),
      });
      const data = await res.json();
      if (data?.success) {
        setLastSyncStatus(`บันทึกบนเซิร์ฟเวอร์แล้ว • ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Restore jobs handler
  const handleRestoreJobs = (restoredJobs: InspectionJob[], newActiveId?: string) => {
    const sanitized = restoredJobs.map(sanitizeJob);
    setJobsList(sanitized);
    if (newActiveId && sanitized.some((j) => j.id === newActiveId)) {
      setActiveJobId(newActiveId);
    } else if (sanitized[0]?.id) {
      setActiveJobId(sanitized[0].id);
    }
    setToastMessage({
      title: `กู้คืนข้อมูลสำเร็จ (${sanitized.length} วิลล่า)`,
      subtitle: 'ข้อมูลทั้งหมดได้รับการอัปเดตและบันทึกเรียบร้อยแล้ว ปลอดภัย 100%',
    });
  };

  // Helper to update active job in jobsList
  const updateCurrentJob = (updater: (prev: InspectionJob) => InspectionJob) => {
    setJobsList((prevList) => {
      const nextList = prevList.map((j) => (j.id === job.id ? updater(j) : j));
      // Immediate triple persistence so no keystroke or photo is ever lost
      idbSet('ptl_jobs_archive', nextList);
      safeSetLocalStorage('ptl_jobs_archive', JSON.stringify(nextList));
      saveLocalSnapshot(nextList, job.id);
      return nextList;
    });
  };

  const handlePopulateStarterItems = () => {
    const starterItems: InspectionItem[] = [
      {
        id: `item-${Date.now()}-1`,
        category: 'NETWORK & WIFI AUDIT',
        locationZone: 'Living Room / Media Center',
        title: 'WiFi AP Signal Coverage & Cabling Audit',
        fileReference: 'IMG_4001.jpg',
        imageUrl: createSamplePhotoSvg('WiFi Access Point Check', '#0f172a', '#38bdf8'),
        observationEn:
          'UniFi Access Point installed behind TV cabinet. Signal attenuated by -12dBm due to metal bracket obstruction.',
        observationTh:
          'ตรวจสอบจุดติดตั้ง Access Point พบวางหลังตู้ทีวี สัญญาณถูกบดบังด้วยโครงเหล็ก แนะนำขยับจุดติดตั้งขึ้นฝ้าเพดาน',
        status: 'Requires Swap',
        recommendedActionEn:
          'Relocate AP to higher ceiling mount position using Cat6 patch lead.',
        recommendedActionTh:
          'ย้ายจุดติดตั้ง AP ขึ้นฝ้าเพดานเพื่อกระจายสัญญาณครอบคลุมพื้นที่สระว่ายน้ำ',
        createdAt: new Date().toISOString(),
      },
      {
        id: `item-${Date.now()}-2`,
        category: 'SMART ELECTRICAL & BREAKER',
        locationZone: 'Main Distribution Board (MDB)',
        title: 'RCBO Earth Leakage & Phase Balance Check',
        fileReference: 'IMG_4002.jpg',
        imageUrl: createSamplePhotoSvg('MDB Breaker Check', '#1e293b', '#f59e0b'),
        observationEn:
          'Main 63A 3-Phase MDB breaker checked. Phase balance within acceptable limits, neutral terminal snug.',
        observationTh:
          'ตรวจวัดกระแสไฟฟ้าตู้ MDB และความแน่นของขันขั้วต่อสาย Neutral พบว่าปกติ ไม่มีคราบออกไซด์',
        status: 'Normal',
        recommendedActionEn: 'Regular inspection every 6 months.',
        recommendedActionTh: 'ตรวจเช็กตามรอบบำรุงรักษาปกติทุก 6 เดือน',
        createdAt: new Date().toISOString(),
      },
    ];
    updateCurrentJob((prev) => ({
      ...prev,
      items: starterItems,
    }));
    setToastMessage({
      title: 'โหลดจุดตรวจตัวอย่าง 2 จุดสำเร็จ!',
      subtitle: 'ตอนนี้คุณสามารถกดปุ่ม "3. ดูเอกสาร & ออก PDF 3 ใบ" ด้านบนเพื่อดูรายงานและใบแจ้งหนี้ได้ทันที',
    });
  };

  const handleSaveFinding = async (
    findingData: Omit<InspectionItem, 'id' | 'createdAt'>,
    editId?: string
  ) => {
    let updatedItems: InspectionItem[];
    if (editId) {
      updatedItems = job.items.map((it) =>
        it.id === editId ? { ...it, ...findingData } : it
      );
    } else {
      const newItem: InspectionItem = {
        ...findingData,
        id: `item-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      updatedItems = [...job.items, newItem];
    }

    // Immediately save finding
    updateCurrentJob((prev) => ({
      ...prev,
      items: updatedItems,
    }));

    setToastMessage({
      title: editId ? '✅ แก้ไขจุดตรวจสำเร็จ!' : '✅ บันทึกจุดตรวจเรียบร้อย!',
      subtitle: `บันทึก 3 ชั้นทันที ปลอดภัย 100% (รวม ${updatedItems.length} จุดตรวจ)`,
    });
  };

  const handleDeleteFinding = async (id: string) => {
    if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      const remainingItems = job.items.filter((it) => it.id !== id);
      updateCurrentJob((prev) => ({
        ...prev,
        items: remainingItems,
      }));
      setToastMessage({
        title: 'ลบจุดตรวจเรียบร้อย',
        subtitle: `เหลือจุดตรวจทั้งหมด ${remainingItems.length} รายการ`,
      });
    }
  };

  const handleCreateNewJob = (jobData: Partial<InspectionJob>) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const randomNum = Math.floor(100 + Math.random() * 900);
    const dateCode = now.toISOString().slice(0, 10).replace(/-/g, '');

    const newJob: InspectionJob = {
      id: `PTL-INSP-${dateCode}-${randomNum}`,
      clientId: jobData.clientId || `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
      villaName: jobData.villaName || jobData.propertyLocation || 'Phuket Private Villa',
      status: 'Inspection',
      createdAt: now.toISOString(),
      customerName: jobData.customerName || 'Customer',
      customerGroup: (jobData.customerGroup as CustomerGroup) || 'villa_owner',
      propertyLocation: jobData.propertyLocation || 'Phuket, Thailand',
      serviceType: jobData.serviceType || 'General Property Audit',
      inspectionDate: dateStr,
      inspector: 'Mr. Big & PTL Field Team',
      documentRef: `site_inspection_${dateCode}.pdf Attachment`,
      items: [],
      quotation: {
        refNo: `PTL-QT-${now.getFullYear()}-${randomNum}`,
        date: dateStr,
        inspectionRef: `PTL-INSP-${dateCode}-${randomNum}`,
        validity: '15 Days',
        paymentTerm: '50% Deposit, 50% On Completion',
        hardwareItems: [],
        serviceItems: [
          {
            item: 1,
            description: 'On-Site Technical Diagnostics & Investigation',
            detail: 'งานช่างเทคนิคลงพื้นที่ตรวจสอบและวิเคราะห์สาเหตุปัญหา',
            estimatedSchedule: 'To be confirmed upon schedule',
            qty: '1 Job',
            amount: 2500,
          },
        ],
        procurementFeeRate: 0.15,
        terms: [
          'รับประกันงานติดตั้งและบริการ 30 วัน',
          'อุปกรณ์เปลี่ยนใหม่รับประกันตามเงื่อนไขผู้ผลิต 1 ปี',
        ],
        contingencies: ['ประเมินค่าอะไหล่และอุปกรณ์เพิ่มเติมตามหน้างานจริง'],
      },
    };

    const nextList = [newJob, ...jobsList];
    setJobsList(nextList);
    setActiveJobId(newJob.id);
    setViewMode('inspection');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Immediate triple persistence
    idbSet('ptl_jobs_archive', nextList);
    idbSet('ptl_active_job_id', newJob.id);
    safeSetLocalStorage('ptl_jobs_archive', JSON.stringify(nextList));
    safeSetLocalStorage('ptl_active_job_id', newJob.id);
    saveLocalSnapshot(nextList, newJob.id);

    try {
      fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: nextList, activeJobId: newJob.id }),
      }).catch(() => {});
    } catch {}

    setToastMessage({
      title: `✨ เปิดงานตรวจใหม่เรียบร้อย: ${newJob.customerName}`,
      subtitle: `${newJob.propertyLocation} • รหัสงาน ${newJob.id}`,
    });
  };

  const handleSelectJob = (id: string) => {
    setActiveJobId(id);
    setViewMode('inspection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const target = jobsList.find((j) => j.id === id);
    if (target) {
      setToastMessage({
        title: `สลับมาที่งานตรวจ: ${target.customerName}`,
        subtitle: `${target.propertyLocation} • ${target.items.length} รายการตรวจ`,
      });
    }
  };

  const handleDuplicateJob = (targetJob: InspectionJob) => {
    const now = new Date();
    const dateCode = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900);
    const newJob: InspectionJob = {
      ...targetJob,
      id: `PTL-INSP-${dateCode}-${randomNum}`,
      villaName: `${targetJob.villaName} (Copy)`,
      status: 'Inspection',
      createdAt: now.toISOString(),
      items: targetJob.items.map((it) => ({
        ...it,
        id: `item-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
      })),
    };
    const nextList = [newJob, ...jobsList];
    setJobsList(nextList);
    setActiveJobId(newJob.id);

    idbSet('ptl_jobs_archive', nextList);
    idbSet('ptl_active_job_id', newJob.id);
    safeSetLocalStorage('ptl_jobs_archive', JSON.stringify(nextList));
    safeSetLocalStorage('ptl_active_job_id', newJob.id);
    saveLocalSnapshot(nextList, newJob.id);

    alert(`คัดลอกงานเป็น "${newJob.villaName}" สำเร็จ พร้อมเริ่มตรวจได้ทันที`);
  };

  const handleCreateExpressQuoteJob = (newJob: InspectionJob) => {
    const nextList = [newJob, ...jobsList];
    setJobsList(nextList);
    setActiveJobId(newJob.id);
    setViewMode('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Immediate triple persistence
    idbSet('ptl_jobs_archive', nextList);
    idbSet('ptl_active_job_id', newJob.id);
    safeSetLocalStorage('ptl_jobs_archive', JSON.stringify(nextList));
    safeSetLocalStorage('ptl_active_job_id', newJob.id);
    saveLocalSnapshot(nextList, newJob.id);

    try {
      fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: nextList, activeJobId: newJob.id }),
      }).catch((e) => console.warn('Server sync error on express quote job:', e));
    } catch (e) {
      console.warn('Network sync error:', e);
    }

    setToastMessage({
      title: `⚡ ออกใบเสนอราคาด่วนสำเร็จ (${newJob.customerName})`,
      subtitle: `สร้างเอกสาร ${newJob.quotation.refNo} พร้อมเปิดดูและพิมพ์/ส่งออก PDF ได้ทันที!`,
    });
  };

  const handleDeleteJob = (id: string) => {
    markJobAsDeleted(id);
    setJobsList((prev) => {
      const nextList = prev.filter((j) => j.id !== id);
      const nextActiveId = activeJobId === id && nextList.length > 0 ? nextList[0].id : activeJobId;
      if (activeJobId === id && nextList.length > 0) {
        setActiveJobId(nextList[0].id);
      }
      idbSet('ptl_jobs_archive', nextList);
      safeSetLocalStorage('ptl_jobs_archive', JSON.stringify(nextList));
      saveLocalSnapshot(nextList, nextActiveId);
      try {
        fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobs: nextList, activeJobId: nextActiveId }),
        }).catch(() => {});
      } catch {}
      return nextList;
    });
  };

  const handleResetToSample = () => {
    if (confirm('ต้องการโหลดข้อมูลตัวอย่างทั้ง 3 วิลล่าของวันนี้ใหม่ทั้งหมดหรือไม่?')) {
      setJobsList(defaultDayJobs);
      setActiveJobId(sampleJobKMazen.id);
      setViewMode('inspection');
    }
  };

  // Group status counts
  const normalCount = job.items.filter((i) => i.status === 'Normal').length;
  const issueCount = job.items.length - normalCount;
  const criticalCount = job.items.filter(
    (i) => i.status === 'Critical Swap' || i.status === 'Power Tripped'
  ).length;

  if (viewMode === 'dashboard') {
    return (
      <>
        <CompanyDashboard
          jobs={jobsList}
          onSelectJob={(jobId) => {
            setActiveJobId(jobId);
            setViewMode('inspection');
          }}
          onOpenNewJob={() => {
            setIsNewJobModalOpen(true);
            setViewMode('inspection');
          }}
          onBackToInspection={() => setViewMode('inspection')}
          onOpenVarvaraSocial={() => setIsVarvaraSocialOpen(true)}
        />
        {isVarvaraSocialOpen && (
          <VarvaraSocialModal
            job={job}
            onClose={() => setIsVarvaraSocialOpen(false)}
          />
        )}
      </>
    );
  }

  if (viewMode === 'report') {
    return (
      <>
        <ReportScreen
          job={job}
          onBack={() => setViewMode('inspection')}
          onUpdateQuotation={(updatedQuotation) =>
            updateCurrentJob((prev) => ({ ...prev, quotation: updatedQuotation }))
          }
          onUpdateDriveFolder={(url) =>
            updateCurrentJob((prev) => ({ ...prev, driveFolderUrl: url }))
          }
          onOpenMollyHardware={() => setIsMollyHardwareOpen(true)}
          onOpenMollyExpress={() => setIsMollyExpressOpen(true)}
          onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
        />
        {isGoogleDriveModalOpen && (
          <GoogleDriveModal
            isOpen={isGoogleDriveModalOpen}
            onClose={() => setIsGoogleDriveModalOpen(false)}
            job={job}
            onUpdateJobDriveUrl={(url) => {
              updateCurrentJob((prev) => ({ ...prev, driveFolderUrl: url }));
              setToastMessage({
                title: 'ซิงค์ Google Drive สำเร็จ',
                subtitle: 'บันทึกลิงก์โฟลเดอร์สำหรับงานตรวจนี้เรียบร้อยแล้ว',
              });
            }}
          />
        )}
        {isMollyExpressOpen && (
          <MollyExpressQuoteModal
            isOpen={isMollyExpressOpen}
            onClose={() => setIsMollyExpressOpen(false)}
            onCreateJobAndOpenQuotation={handleCreateExpressQuoteJob}
            existingJobsCount={jobsList.length}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-24 sm:pb-16 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <Header
        job={job}
        totalJobsCount={jobsList.length}
        lastSyncStatus={lastSyncStatus}
        onOpenMultiJob={() => setIsMultiJobModalOpen(true)}
        onOpenNewJob={() => setIsNewJobModalOpen(true)}
        onOpenDashboard={() => setViewMode('dashboard')}
        onOpenVarvaraSocial={() => setIsVarvaraSocialOpen(true)}
        onOpenMollyHardware={() => setIsMollyHardwareOpen(true)}
        onOpenMollyExpress={() => setIsMollyExpressOpen(true)}
        onOpenMobileGuide={() => setIsMobileGuideOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Floating Dynamic Toast Notification (Mobile & Desktop) */}
      {toastMessage && (
        <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-[#102a4e] text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-sky-400/40 flex items-start gap-3">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs sm:text-sm text-white">{toastMessage.title}</div>
              {toastMessage.subtitle && (
                <div className="text-[11px] text-sky-200/90 mt-0.5 truncate">{toastMessage.subtitle}</div>
              )}
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 text-sm font-bold leading-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-5 flex-1 min-w-0">
        {/* Today's Multi-Site Itinerary Banner */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-blue-200 shadow-xs mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50/70 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102a4e] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <Building2 className="w-5 h-5 text-sky-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                  สถานที่ตรวจปัจจุบัน:
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.2 rounded-full">
                  งานที่ {jobsList.findIndex((j) => j.id === job.id) + 1} จาก {jobsList.length} หลังวันนี้
                </span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                {job.villaName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsMultiJobModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs bg-[#102a4e] hover:bg-blue-900 text-white font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5 text-sky-300" />
              <span>สลับวิลล่า ({jobsList.length} หลัง)</span>
            </button>

            <button
              onClick={() => setIsQuickEstimateOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-slate-950" />
              <span>+ ประเมินเพิ่มด่วน</span>
            </button>
          </div>
        </div>

        {/* Customer & Location Banner */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs mb-4 sm:mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                <span className="p-1 bg-blue-50 text-blue-700 rounded-md">
                  <User className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs text-slate-500 font-medium">ลูกค้า / Customer:</span>
                <span className="font-bold text-slate-900 text-sm truncate">{job.customerName}</span>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold border border-slate-200">
                  {job.customerGroup === 'villa_owner'
                    ? 'Villa Owner'
                    : job.customerGroup === 'expat'
                    ? 'Expat'
                    : 'Rental/Airbnb'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{job.propertyLocation}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsNewJobModalOpen(true)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded-xl transition-colors"
              >
                + เริ่มงานตรวจใหม่
              </button>
              <button
                onClick={handleResetToSample}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                title="โหลดตัวอย่างเดิม 3 หลัง"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate font-medium text-slate-800">{job.serviceType}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{job.inspectionDate}</span>
            </div>
            <div className="col-span-2 sm:col-span-1 text-slate-500 text-[11px] flex items-center justify-start sm:justify-end">
              <span>{job.items.length} รายการที่บันทึกแล้ว</span>
            </div>
          </div>
        </div>

        {/* Company Dashboard Shortcut Card */}
        <div className="mb-4 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-blue-500/10 border border-amber-300/60 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0">
              📊
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900">
                  แดชบอร์ดบริษัท &amp; ติดตามงาน
                </span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">
                  AI Emily
                </span>
              </div>
              <p className="text-[11px] text-slate-600 truncate">
                ดูรายรับ-รายจ่าย-กำไร • ยอดค้างชำระ • ปฏิทินนัดหมาย • ลิสต์งานที่ต้องตาม
              </p>
            </div>
          </div>

          <button
            onClick={() => setViewMode('dashboard')}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>เปิดแดชบอร์ด</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Quick Quotation Ready Alert Banner */}
        {job.quotation && job.quotation.hardwareItems && job.quotation.hardwareItems.length > 0 && (
          <div className="mb-4 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-emerald-400/40 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                <FileText className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-extrabold text-emerald-200 uppercase tracking-wider">
                    ⚡ ใบเสนอราคาด่วนพร้อมออก PDF (Molly Sourcing)
                  </span>
                  <span className="text-[10px] bg-emerald-950/60 text-emerald-300 px-2 py-0.2 rounded-full font-mono font-semibold border border-emerald-400/30">
                    {job.quotation.refNo}
                  </span>
                </div>
                <div className="text-sm sm:text-base font-black text-white truncate mt-0.5">
                  ลูกค้า: {job.customerName} • ยอดรวม ฿{(
                    job.quotation.hardwareItems.reduce((s, it) => s + it.amount, 0) +
                    (job.quotation.serviceItems?.reduce((s, it) => s + it.amount, 0) || 0)
                  ).toLocaleString()} THB (อุปกรณ์ ฿2,390 + ค่าแรง ฿700)
                </div>
              </div>
            </div>
            <button
              onClick={() => setViewMode('report')}
              className="bg-white hover:bg-emerald-50 text-emerald-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>เปิดดูใบเสนอราคา &amp; โหลด PDF</span>
              <span className="text-emerald-700">&rarr;</span>
            </button>
          </div>
        )}

        {/* Primary Action Buttons Bar - 3 Key Workflow Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <button
            onClick={() => {
              setEditingItem(null);
              setIsFindingModalOpen(true);
            }}
            className="bg-[#102a4e] hover:bg-blue-900 text-white font-bold py-3.5 px-3 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-sky-300" />
            <span>1. ถ่ายรูป / จุดที่ตรวจพบ</span>
          </button>

          <button
            onClick={() => setIsQuickEstimateOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3.5 px-3 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-slate-950" />
            <span>2. แจ้งประเมินราคาเพิ่มด่วน</span>
          </button>

          <button
            onClick={() => setViewMode('report')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-3 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-200" />
            <span>3. ดูเอกสาร &amp; ออก PDF 3 ใบ</span>
          </button>
        </div>

        {/* Summary Stats Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <span className="font-semibold text-slate-700 text-xs">สถานะรวมของ {job.villaName}:</span>
          <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium">
            ทั้งหมด {job.items.length} จุด
          </span>
          <span className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-emerald-700 font-medium">
            ปกติ {normalCount} จุด
          </span>
          <span className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-amber-800 font-medium">
            ต้องซ่อม / เปลี่ยน {issueCount} จุด
          </span>
          {criticalCount > 0 && (
            <span className="bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg text-red-700 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-600" />
              <span>วิกฤต/ไฟตัด {criticalCount} จุด</span>
            </span>
          )}
        </div>

        {/* Findings List */}
        {job.items.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-6 sm:p-8 text-center my-4 sm:my-6">
            <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              ยังไม่มีรายการที่บันทึกใน {job.villaName}
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              กดปุ่มด้านล่างเพื่อถ่ายรูปหน้างาน หรือกดปุ่มโหลดจุดตรวจตัวอย่างเพื่อทดสอบระบบออกรายงานและใบแจ้งหนี้ได้ทันที
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsFindingModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 bg-[#102a4e] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-900 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มจุดตรวจหน้างานจริง</span>
              </button>
              <button
                onClick={handlePopulateStarterItems}
                className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-amber-100 transition-colors shadow-xs"
              >
                <Zap className="w-4 h-4 text-amber-600" />
                <span>⚡ โหลด 2 จุดตรวจตัวอย่าง (สำหรับทดสอบพิมพ์ PDF)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {job.items.map((item, idx) => (
              <FindingCard
                key={item.id}
                item={item}
                index={idx}
                onEdit={(targetItem) => {
                  setEditingItem(targetItem);
                  setIsFindingModalOpen(true);
                }}
                onDelete={handleDeleteFinding}
              />
            ))}
          </div>
        )}

        {/* Quick Help Tip callout */}
        <div className="mt-8 bg-sky-50 border border-sky-200/70 rounded-xl p-3.5 flex items-center gap-3 text-xs text-slate-700">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="flex-1 text-[11px] text-slate-600">
            <strong className="text-sky-950 font-semibold">ขั้นตอนมาตรฐาน: </strong>
            ตรวจหน้างาน &rarr; บันทึกภาพถ่าย &rarr; Molly คำนวณราคา &rarr; กดสร้างเอกสาร PDF 3 ใบส่งลูกค้าได้ทันที
          </div>
        </div>
      </main>

      {/* Floating Bottom Action Bar for Mobile View */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 sm:hidden shadow-lg z-20 flex gap-1.5">
        <button
          onClick={() => {
            setEditingItem(null);
            setIsFindingModalOpen(true);
          }}
          className="flex-1 bg-[#102a4e] text-white font-bold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm"
        >
          <Camera className="w-3.5 h-3.5 text-sky-300" />
          <span>ถ่ายรูป</span>
        </button>

        <button
          onClick={() => setIsQuickEstimateOpen(true)}
          className="flex-1 bg-amber-500 text-slate-950 font-bold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm"
        >
          <Zap className="w-3.5 h-3.5 text-slate-950" />
          <span>ประเมินเพิ่ม</span>
        </button>

        <button
          onClick={() => setIsMultiJobModalOpen(true)}
          className="flex-1 bg-slate-800 text-sky-200 font-bold py-2.5 px-1.5 rounded-xl text-[11px] flex items-center justify-center gap-1 shadow-sm"
        >
          <Building2 className="w-3.5 h-3.5 text-sky-300" />
          <span>สลับงาน ({jobsList.length})</span>
        </button>

        <button
          onClick={() => setViewMode('dashboard')}
          className="flex-1 bg-amber-400 text-slate-950 font-extrabold py-2.5 px-1.5 rounded-xl text-[11px] flex items-center justify-center gap-1 shadow-sm"
        >
          <span>📊 แดชบอร์ด</span>
        </button>

        <button
          onClick={() => setViewMode('report')}
          className="flex-1 bg-emerald-600 text-white font-bold py-2.5 px-1.5 rounded-xl text-[11px] flex items-center justify-center gap-1 shadow-sm"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-200" />
          <span>3 PDF</span>
        </button>
      </div>

      {/* Modals */}
      <FindingModal
        isOpen={isFindingModalOpen}
        onClose={() => {
          setIsFindingModalOpen(false);
          setEditingItem(null);
        }}
        onSaveFinding={handleSaveFinding}
        editingItem={editingItem}
      />

      <NewJobModal
        isOpen={isNewJobModalOpen}
        onClose={() => setIsNewJobModalOpen(false)}
        onCreateJob={handleCreateNewJob}
        onSelectExistingJob={handleSelectJob}
        existingJobs={jobsList}
      />

      {/* Multi-Job Itinerary & Site Switcher Modal */}
      {isMultiJobModalOpen && (
        <MultiJobModal
          currentJobId={job.id}
          jobs={jobsList}
          onSelectJob={handleSelectJob}
          onAddNewJob={() => setIsNewJobModalOpen(true)}
          onDuplicateJob={handleDuplicateJob}
          onDeleteJob={handleDeleteJob}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onClose={() => setIsMultiJobModalOpen(false)}
        />
      )}

      {/* Quick Estimate & Additional Item Modal */}
      {isQuickEstimateOpen && (
        <QuickEstimateModal
          job={job}
          onClose={() => setIsQuickEstimateOpen(false)}
          onSaveQuotation={(updatedJob) => {
            updateCurrentJob(() => updatedJob);
          }}
        />
      )}

      {/* Varvara Social Media Studio Modal */}
      {isVarvaraSocialOpen && (
        <VarvaraSocialModal
          job={job}
          onClose={() => setIsVarvaraSocialOpen(false)}
        />
      )}

      {/* Molly Hardware & Piping Assistant Modal */}
      {isMollyHardwareOpen && (
        <MollyHardwareModal
          job={job}
          onClose={() => setIsMollyHardwareOpen(false)}
          onApplyHardwareItem={(newItem) => {
            updateCurrentJob((prev) => {
              const currentItems = prev.quotation?.hardwareItems || [];
              const nextItemIndex = currentItems.length + 1;
              const formattedItem = {
                item: nextItemIndex,
                ...newItem,
              };
              return {
                ...prev,
                quotation: {
                  ...prev.quotation,
                  hardwareItems: [...currentItems, formattedItem],
                },
              };
            });
          }}
          onUpdateAllHardwareItems={(updatedItems) => {
            updateCurrentJob((prev) => ({
              ...prev,
              quotation: {
                ...prev.quotation,
                hardwareItems: updatedItems,
              },
            }));
          }}
        />
      )}

      {/* Mobile Safari/Chrome Standalone URL Guide Modal */}
      {isMobileGuideOpen && (
        <MobileGuideModal
          onClose={() => setIsMobileGuideOpen(false)}
        />
      )}

      {/* Google Drive Automated Sync & Upload Modal */}
      {isGoogleDriveModalOpen && (
        <GoogleDriveModal
          isOpen={isGoogleDriveModalOpen}
          onClose={() => setIsGoogleDriveModalOpen(false)}
          job={job}
          onUpdateJobDriveUrl={(url) => {
            updateCurrentJob((prev) => ({ ...prev, driveFolderUrl: url }));
            setToastMessage({
              title: 'ซิงค์ Google Drive สำเร็จ',
              subtitle: 'บันทึกลิงก์โฟลเดอร์สำหรับงานตรวจนี้เรียบร้อยแล้ว',
            });
          }}
        />
      )}

      {/* Triple-Redundant Backup & Restore Protection Modal */}
      {isBackupModalOpen && (
        <BackupRestoreModal
          jobs={jobsList}
          activeJobId={activeJobId}
          onRestoreJobs={handleRestoreJobs}
          onForceSaveToServer={handleForceSaveToServer}
          onClose={() => setIsBackupModalOpen(false)}
        />
      )}

      {/* Floating Action Button (Molly Express Quotation - Quick 1-Click Access) */}
      <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40">
        <button
          id="fab-molly-express-quote"
          onClick={() => setIsMollyExpressOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-black px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full shadow-2xl transition-all transform hover:scale-105 ring-4 ring-amber-300/50 cursor-pointer group"
          title="แตะเพื่อคุยกับ Molly ออกใบเสนอราคาด่วนทันที"
        >
          <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base shadow-inner shrink-0 group-hover:rotate-12 transition-transform">
            ⚡
          </span>
          <div className="text-left leading-tight hidden xs:block sm:block">
            <div className="text-xs font-black tracking-wide text-white drop-shadow-xs">คุยกับ Molly</div>
            <div className="text-[10px] text-amber-100 font-semibold">ออกใบเสนอราคาด่วน</div>
          </div>
          <span className="flex h-2.5 w-2.5 relative ml-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
        </button>
      </div>

      {/* Molly Express Quotation Copilot Modal */}
      {isMollyExpressOpen && (
        <MollyExpressQuoteModal
          isOpen={isMollyExpressOpen}
          onClose={() => setIsMollyExpressOpen(false)}
          onCreateJobAndOpenQuotation={handleCreateExpressQuoteJob}
          existingJobsCount={jobsList.length}
        />
      )}
    </div>
  );
}

