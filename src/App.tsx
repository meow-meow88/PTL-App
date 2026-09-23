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
import {
  InspectionJob,
  InspectionItem,
  CustomerGroup,
  Customer,
  Property,
  MainNavTab,
  Vendor,
  RecurringService,
  Task,
} from './types';
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
import { UpdateAvailableBanner } from './components/UpdateAvailableBanner';
import { initPWAUpdateManager } from './utils/pwaManager';
import { Navigation } from './components/Navigation';
import { MyDayView } from './components/MyDayView';
import { JobWorkspaceView } from './components/JobWorkspaceView';
import { CustomersView } from './components/CustomersView';
import { PropertiesView } from './components/PropertiesView';
import { JobsView } from './components/JobsView';
import { QuickJobModal } from './components/QuickJobModal';
import { HomeWatchVisitView } from './components/HomeWatchVisitView';
import { RoadAssistanceWorkflowView } from './components/RoadAssistanceWorkflowView';
import { FlexibleJobWorkflowView } from './components/FlexibleJobWorkflowView';
import { getPrimaryJobAction, isHomeWatchService, isRoadsideService } from './utils/serviceWorkflow';
import { useLanguage } from './i18n/translations';
import { recordJobActivity } from './utils/jobEvents';
import { SecondaryViews } from './components/SecondaryViews';
import { MoneyView } from './components/MoneyView';
import { JobFinancialModal } from './components/JobFinancialModal';
import { ExpenseModal } from './components/ExpenseModal';
import { InvoiceModal } from './components/InvoiceModal';
import { PaymentModal } from './components/PaymentModal';
import { VendorModal } from './components/VendorModal';
import { AssignVendorModal } from './components/AssignVendorModal';
import { QuickScheduleModal } from './components/QuickScheduleModal';
import { RecurringServicesModal } from './components/RecurringServicesModal';
import { EditJobModal } from './components/EditJobModal';
import {
  loadCustomers,
  saveCustomers,
  loadProperties,
  saveProperties,
  ensureCustomerAndPropertyForJob,
  deduplicateProperties,
  deduplicateCustomers,
} from './utils/crmStorage';
import { initialCustomersSeed, initialPropertiesSeed } from './data/crmSeedData';
import {
  loadExpenses,
  saveExpenses,
  loadInvoices,
  saveInvoices,
  loadPayments,
  savePayments,
  createInvoiceFromJob,
  recordPayment,
} from './utils/financeStorage';
import {
  loadVendors,
  saveVendors,
  loadRecurringServices,
  saveRecurringServices,
  loadTasks,
  saveTasks,
} from './utils/operationsStorage';
import { initialVendorsSeed, initialRecurringServicesSeed } from './data/operationsSeedData';
import { generateAutomatedFollowUps } from './utils/followUpEngine';
import { Expense, Invoice, Payment } from './types';
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
    jobPurpose: j.jobPurpose,
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
    customerId: j.customerId,
    propertyId: j.propertyId,
    scheduledDate: j.scheduledDate || j.inspectionDate || 'Today',
    scheduledTime: j.scheduledTime ? (j.scheduledTime.includes('AM') || j.scheduledTime.includes('PM') ? j.scheduledTime.replace(/AM|PM/gi, '').trim() : j.scheduledTime) : '10:00',
    scheduledEndTime: j.scheduledEndTime,
    appointmentConfirmation: j.appointmentConfirmation,
    scheduleNotes: j.scheduleNotes,
    actualStartedAt: j.actualStartedAt || j.visitStartedAt,
    actualCompletedAt: j.actualCompletedAt || j.visitCompletedAt || j.completedAt,
    requestDescription: j.requestDescription || '',
    price: typeof j.price === 'number' ? j.price : undefined,
    isSimpleJob: Boolean(j.isSimpleJob),
    waitingOn: j.waitingOn || (j.status === 'Quoted' ? 'customer' : 'none'),
    actionRequired: j.actionRequired,
    completedAt: j.completedAt,
    workflowPreset: j.workflowPreset,
    urgency: j.urgency,
    parentJobId: j.parentJobId,
    recurringServiceId: j.recurringServiceId,
    waitingReason: j.waitingReason,
    nextFollowUpDate: j.nextFollowUpDate,
    appointmentOutcome: j.appointmentOutcome,
    rescheduledFromDate: j.rescheduledFromDate,
    missedAppointmentFee: j.missedAppointmentFee,
    materialCostExpected: j.materialCostExpected,
    materialDepositRequested: j.materialDepositRequested,
    materialDepositReceived: j.materialDepositReceived,
    vendorId: j.vendorId,
    siteNotes: j.siteNotes,
    homeWatchChecklist: Array.isArray(j.homeWatchChecklist) ? j.homeWatchChecklist : undefined,
    evidencePhotos: Array.isArray(j.evidencePhotos) ? j.evidencePhotos : undefined,
    assignedVendorId: j.assignedVendorId,
    assignedVendorName: j.assignedVendorName,
    vendorPhone: j.vendorPhone,
    vendorStatus: j.vendorStatus,
    vendorEta: j.vendorEta,
    vendorCostEstimate: j.vendorCostEstimate,
    siteArrivedAt: j.siteArrivedAt,
    visitStartedAt: j.visitStartedAt,
    visitCompletedAt: j.visitCompletedAt,
    beforePhotoUrl: j.beforePhotoUrl,
    afterPhotoUrl: j.afterPhotoUrl,
    beforeOriginalPhotoUrl: j.beforeOriginalPhotoUrl,
    afterOriginalPhotoUrl: j.afterOriginalPhotoUrl,
    // Phase 3.9B.1 Team-Ready Foundations:
    executionMode: j.executionMode || 'OWNER',
    assignedToType: j.assignedToType || (j.assignedVendorId || j.vendorId ? 'VENDOR' : 'OWNER'),
    assignedToId: j.assignedToId || j.assignedVendorId || j.vendorId,
    assignedAt: j.assignedAt,
    assignedBy: j.assignedBy,
    serviceArea: j.serviceArea,
    events: Array.isArray(j.events) ? j.events : [],
    needsOwnerReview: Boolean(j.needsOwnerReview),
    ownerReviewedAt: j.ownerReviewedAt,
    ownerReviewNote: j.ownerReviewNote,
    lastActivityAt:
      j.lastActivityAt || j.visitStartedAt || j.actualStartedAt || j.createdAt || new Date().toISOString(),
  };
}

export default function App() {
  const { lang, t } = useLanguage();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<string>('กำลังตรวจเช็คระบบความปลอดภัย...');
  const [updateAvailableVersion, setUpdateAvailableVersion] = useState<string | null>(null);

  // Initialize PWA Service Worker & Safe Cache Manager
  useEffect(() => {
    initPWAUpdateManager({
      onUpdateAvailable: (ver) => {
        setUpdateAvailableVersion(ver || 'latest');
      },
    });
  }, []);

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

        // 4. Hydrate CRM Customers and Properties
        try {
          const [loadedCusts, loadedProps] = await Promise.all([loadCustomers(), loadProperties()]);
          let workingCusts = deduplicateCustomers(loadedCusts.length > 0 ? loadedCusts : initialCustomersSeed);
          let workingProps = deduplicateProperties(loadedProps.length > 0 ? loadedProps : initialPropertiesSeed);

          // Reconcile jobs with CRM
          for (const j of targetJobs) {
            const syncRes = ensureCustomerAndPropertyForJob(j, workingCusts, workingProps);
            workingCusts = syncRes.updatedCustomers;
            workingProps = syncRes.updatedProperties;
          }

          workingCusts = deduplicateCustomers(workingCusts);
          workingProps = deduplicateProperties(workingProps);

          if (isMounted) {
            setCustomers(workingCusts);
            setProperties(workingProps);
            saveCustomers(workingCusts);
            saveProperties(workingProps);
          }
        } catch (crmErr) {
          console.error('CRM load error:', crmErr);
        }

        // 5. Hydrate Phase 2 Financials (Expenses, Invoices, Payments)
        try {
          const [loadedExpenses, loadedInvoices, loadedPayments] = await Promise.all([
            loadExpenses(),
            loadInvoices(),
            loadPayments(),
          ]);
          if (isMounted) {
            setExpenses(loadedExpenses);
            setInvoices(loadedInvoices);
            setPayments(loadedPayments);
          }
        } catch (finErr) {
          console.error('Finance load error:', finErr);
        }

        // 6. Hydrate Phase 3 Operations (Vendors, Recurring Services, Tasks)
        try {
          const [loadedVendors, loadedRecurring, loadedTasks] = await Promise.all([
            loadVendors(),
            loadRecurringServices(),
            loadTasks(),
          ]);

          const workingVendors = loadedVendors;
          const workingRecurring = loadedRecurring;
          let workingTasks = loadedTasks;

          // Deterministic task engine: auto-generate follow-up tasks without duplicates
          const autoTasks = generateAutomatedFollowUps(targetJobs, workingTasks, workingRecurring);
          if (autoTasks.length > 0) {
            workingTasks = [...workingTasks, ...autoTasks];
          }

          if (isMounted) {
            setVendors(workingVendors);
            setRecurringServices(workingRecurring);
            setTasks(workingTasks);
            saveVendors(workingVendors);
            saveRecurringServices(workingRecurring);
            saveTasks(workingTasks);
          }
        } catch (opErr) {
          console.error('Operations load error:', opErr);
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

  const [activeTab, setActiveTab] = useState<MainNavTab>('my_day');
  const [viewMode, setViewMode] = useState<'main' | 'inspection' | 'report' | 'dashboard'>('main');
  const [previousViewMode, setPreviousViewMode] = useState<'main' | 'inspection'>('main');
  const [reportInitialAction, setReportInitialAction] = useState<'view' | 'edit' | 'send' | 'preview'>('view');
  const [customers, setCustomers] = useState<Customer[]>(initialCustomersSeed);
  const [properties, setProperties] = useState<Property[]>(initialPropertiesSeed);

  // Phase 2 Financial State - Starts empty in production
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Phase 3 Operations State (Vendors, Recurring Services, Follow-up Tasks)
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [recurringServices, setRecurringServices] = useState<RecurringService[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Phase 3 Operations Modals State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isAssignVendorModalOpen, setIsAssignVendorModalOpen] = useState(false);
  const [jobForAssignVendor, setJobForAssignVendor] = useState<InspectionJob | null>(null);
  const [isQuickScheduleModalOpen, setIsQuickScheduleModalOpen] = useState(false);
  const [jobForQuickSchedule, setJobForQuickSchedule] = useState<InspectionJob | null>(null);
  const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false);
  const [jobForEdit, setJobForEdit] = useState<InspectionJob | null>(null);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);

  // Financial Modals State
  const [isJobFinancialModalOpen, setIsJobFinancialModalOpen] = useState(false);
  const [selectedJobIdForFinancials, setSelectedJobIdForFinancials] = useState<string | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseModalPresetJobId, setExpenseModalPresetJobId] = useState<string | undefined>(undefined);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceIdForPayment, setSelectedInvoiceIdForPayment] = useState<string | null>(null);

  const [isQuickJobModalOpen, setIsQuickJobModalOpen] = useState(false);
  const [quickJobPresetCustomer, setQuickJobPresetCustomer] = useState<string | null>(null);
  const [quickJobPresetProperty, setQuickJobPresetProperty] = useState<string | null>(null);
  const [quickJobUrgency, setQuickJobUrgency] = useState<'Normal' | 'Urgent'>('Normal');
  const [selectedCustomerIdForView, setSelectedCustomerIdForView] = useState<string | null>(null);
  const [selectedPropertyIdForView, setSelectedPropertyIdForView] = useState<string | null>(null);

  const handleOpenNormalJob = () => {
    setQuickJobPresetCustomer(null);
    setQuickJobPresetProperty(null);
    setQuickJobUrgency('Normal');
    setIsQuickJobModalOpen(true);
  };

  const handleOpenUrgentJob = () => {
    setQuickJobPresetCustomer(null);
    setQuickJobPresetProperty(null);
    setQuickJobUrgency('Urgent');
    setIsQuickJobModalOpen(true);
  };

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

  // Financial Handlers
  const handleSaveExpense = async (expense: Expense) => {
    setExpenses((prev) => {
      const exists = prev.some((e) => e.id === expense.id);
      const next = exists ? prev.map((e) => (e.id === expense.id ? expense : e)) : [expense, ...prev];
      saveExpenses(next);
      return next;
    });
    setToastMessage({
      title: 'Expense Recorded',
      subtitle: `${expense.category} - ฿${expense.amount.toLocaleString()} (${expense.vendorName || 'Cost'})`,
    });
  };

  const handleDeleteExpense = async (expenseId: string) => {
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== expenseId);
      saveExpenses(next);
      return next;
    });
    setToastMessage({
      title: 'Expense Removed',
      subtitle: 'Cost item deleted from job ledger',
    });
  };

  const handleCreateInvoiceForJob = (targetJob: InspectionJob) => {
    const existingInv = invoices.find((i) => i.jobId === targetJob.id);
    if (existingInv) {
      setSelectedInvoiceId(existingInv.id);
      setIsInvoiceModalOpen(true);
      setToastMessage({
        title: 'Invoice Exists',
        subtitle: `Opened existing ${existingInv.invoiceNumber}`,
      });
      return;
    }

    const newInvoice = createInvoiceFromJob(targetJob, invoices);
    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    saveInvoices(updatedInvoices);

    // Transition job status to Invoiced if currently completed or below
    if (targetJob.status !== 'Paid') {
      setJobsList((prev) =>
        prev.map((j) => (j.id === targetJob.id ? { ...j, status: 'Invoiced' } : j))
      );
    }

    setSelectedInvoiceId(newInvoice.id);
    setIsInvoiceModalOpen(true);
    setToastMessage({
      title: 'Invoice Created',
      subtitle: `${newInvoice.invoiceNumber} generated for ฿${newInvoice.total.toLocaleString()}`,
    });
  };

  const handleRecordPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    try {
      const result = recordPayment(paymentData, invoices, payments);
      setInvoices(result.updatedInvoices);
      setPayments(result.updatedPayments);
      await saveInvoices(result.updatedInvoices);
      await savePayments(result.updatedPayments);

      // If fully paid, also update the job status to 'Paid'
      const inv = result.updatedInvoices.find((i) => i.id === paymentData.invoiceId);
      if (inv && inv.balanceDue <= 0 && inv.jobId) {
        setJobsList((prev) =>
          prev.map((j) => (j.id === inv.jobId ? { ...j, status: 'Paid' } : j))
        );
      }

      setToastMessage({
        title: 'Payment Recorded',
        subtitle: `฿${paymentData.amount.toLocaleString()} via ${paymentData.paymentMethod}`,
      });
    } catch (err: any) {
      console.error('Record payment error:', err);
      alert(err?.message || 'Payment recording failed.');
      throw err;
    }
  };

  const handleOpenFinancials = (jobId: string) => {
    setSelectedJobIdForFinancials(jobId);
    setIsJobFinancialModalOpen(true);
  };

  const handleOpenAddExpense = (jobId?: string) => {
    setExpenseModalPresetJobId(jobId);
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenRecordPayment = (invoiceId: string) => {
    setSelectedInvoiceIdForPayment(invoiceId);
    setIsPaymentModalOpen(true);
  };

  const handleRestoreAllData = async (payload: {
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
  }) => {
    handleRestoreJobs(payload.jobs, payload.activeJobId);
    if (Array.isArray(payload.customers)) {
      const cleanCusts = deduplicateCustomers(payload.customers);
      setCustomers(cleanCusts);
      saveCustomers(cleanCusts);
    }
    if (Array.isArray(payload.properties)) {
      const cleanProps = deduplicateProperties(payload.properties);
      setProperties(cleanProps);
      saveProperties(cleanProps);
    }
    if (Array.isArray(payload.expenses)) {
      setExpenses(payload.expenses);
      saveExpenses(payload.expenses);
    }
    if (Array.isArray(payload.invoices)) {
      setInvoices(payload.invoices);
      saveInvoices(payload.invoices);
    }
    if (Array.isArray(payload.payments)) {
      setPayments(payload.payments);
      savePayments(payload.payments);
    }
    if (Array.isArray(payload.vendors)) {
      setVendors(payload.vendors);
      saveVendors(payload.vendors);
    }
    if (Array.isArray(payload.recurringServices)) {
      setRecurringServices(payload.recurringServices);
      saveRecurringServices(payload.recurringServices);
    }
    if (Array.isArray(payload.tasks)) {
      setTasks(payload.tasks);
      saveTasks(payload.tasks);
    }
    setToastMessage({
      title: 'Full Backup Restored',
      subtitle: `Restored ${payload.jobs.length} jobs, CRM, Operations & Financial ledgers`,
    });
  };

  const handleSaveCustomer = async (updatedCustomer: Customer) => {
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === updatedCustomer.id);
      const next = exists
        ? prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
        : [updatedCustomer, ...prev];
      saveCustomers(next);
      return next;
    });
    setToastMessage({
      title: 'Customer Profile Saved',
      subtitle: `${updatedCustomer.fullName || updatedCustomer.preferredName} updated`,
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => {
      const next = prev.filter((c) => c.id !== customerId);
      saveCustomers(next);
      return next;
    });
    setToastMessage({
      title: 'Customer Deleted',
      subtitle: 'Customer record was permanently removed',
    });
  };

  const handleArchiveCustomer = (cust: Customer) => {
    const updated = { ...cust, isArchived: !cust.isArchived };
    handleSaveCustomer(updated);
  };

  const handleSaveProperty = async (updatedProperty: Property) => {
    setProperties((prev) => {
      const cleanPrev = deduplicateProperties(prev);
      const exists = cleanPrev.some((p) => p.id.toUpperCase() === updatedProperty.id.toUpperCase());
      const next = exists
        ? cleanPrev.map((p) => (p.id.toUpperCase() === updatedProperty.id.toUpperCase() ? updatedProperty : p))
        : [updatedProperty, ...cleanPrev];
      const cleanNext = deduplicateProperties(next);
      saveProperties(cleanNext);
      return cleanNext;
    });
    setToastMessage({
      title: 'Property Profile Saved',
      subtitle: `${updatedProperty.propertyName || updatedProperty.name} updated`,
    });
  };

  const handleSaveQuickJob = (newJob: InspectionJob) => {
    setJobsList((prev) => [newJob, ...prev]);
    setActiveJobId(newJob.id);

    const syncRes = ensureCustomerAndPropertyForJob(newJob, customers, properties);
    if (syncRes.updatedCustomers.length !== customers.length) {
      setCustomers(syncRes.updatedCustomers);
      saveCustomers(syncRes.updatedCustomers);
    }
    if (syncRes.updatedProperties.length !== properties.length) {
      setProperties(syncRes.updatedProperties);
      saveProperties(syncRes.updatedProperties);
    }

    setToastMessage({
      title: 'Quick Job Created',
      subtitle: `${newJob.villaName} • ${newJob.serviceType}`,
    });

    if (!newJob.isSimpleJob) {
      setPreviousViewMode('main');
      setViewMode('inspection');
    } else {
      setActiveTab('jobs');
    }
  };

  // Phase 3 Operations Handlers
  const handleSaveVendor = (vendor: Vendor) => {
    setVendors((prev) => {
      const idx = prev.findIndex((v) => v.id === vendor.id);
      let next: Vendor[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = vendor;
      } else {
        next = [vendor, ...prev];
      }
      saveVendors(next);
      return next;
    });
    setToastMessage({
      title: 'Vendor Saved',
      subtitle: `${vendor.name} (${vendor.category}) updated`,
    });
    setIsVendorModalOpen(false);
    setEditingVendor(null);
  };

  const handleDeleteVendor = (vendorId: string) => {
    setVendors((prev) => {
      const next = prev.filter((v) => v.id !== vendorId);
      saveVendors(next);
      return next;
    });
    setToastMessage({
      title: 'Vendor Removed',
      subtitle: 'Vendor profile was deleted',
    });
  };

  const handleAssignVendorToJob = (jobId: string, vendorId: string | undefined) => {
    const vendorObj = vendors.find((v) => v.id === vendorId);
    const now = new Date().toISOString();
    setJobsList((prev) => {
      const next = prev.map((j) => {
        if (j.id === jobId) {
          const newStatus = vendorId && (j.status === 'Approved' || j.status === 'New') ? ('Waiting Vendor' as const) : j.status;
          let updated: InspectionJob = {
            ...j,
            vendorId: vendorId || undefined,
            assignedVendorId: vendorId || undefined,
            vendorName: vendorObj?.name || (vendorId ? j.vendorName : undefined),
            assignedVendorName: vendorObj?.name || (vendorId ? j.assignedVendorName : undefined),
            waitingOn: vendorId ? ('vendor' as const) : j.waitingOn,
            status: newStatus,
            assignedToType: vendorId ? 'VENDOR' : 'OWNER',
            assignedToId: vendorId || undefined,
            assignedAt: vendorId ? now : j.assignedAt,
            assignedBy: j.assignedBy || 'PTL Owner',
            executionMode: vendorId ? 'VENDOR' : (j.executionMode === 'VENDOR' ? 'OWNER' : j.executionMode || 'OWNER'),
            lastActivityAt: now,
          };
          return recordJobActivity(updated, 'JOB_ASSIGNED', {
            summary: vendorObj ? `Assigned to ${vendorObj.name}` : 'Assigned to PTL Owner',
            metadata: { vendorId, vendorName: vendorObj?.name },
          });
        }
        return j;
      });
      idbSet('ptl_jobs_archive', next);
      safeSetLocalStorage('ptl_jobs_archive', JSON.stringify(next));
      saveLocalSnapshot(next, activeJobId);
      return next;
    });

    setToastMessage({
      title: 'Vendor Assignment Updated',
      subtitle: vendorObj ? `Assigned to ${vendorObj.name}` : 'Vendor unassigned',
    });
    setIsAssignVendorModalOpen(false);
    setJobForAssignVendor(null);
  };

  const handleSaveQuickSchedule = (
    jobId: string,
    scheduleData: {
      scheduledDate: string;
      scheduledTime: string;
      scheduledEndTime?: string;
      scheduleNotes?: string;
      vendorId?: string;
      appointmentConfirmation: 'Not Confirmed' | 'Confirmed' | 'Cancelled';
    }
  ) => {
    const vendorObj = vendors.find((v) => v.id === scheduleData.vendorId);
    const now = new Date().toISOString();
    setJobsList((prev) => {
      const next = prev.map((j) => {
        if (j.id === jobId) {
          const statusChanged = j.status === 'New';
          const newStatus = statusChanged ? ('Scheduled' as const) : j.status;
          let updated: InspectionJob = {
            ...j,
            scheduledDate: scheduleData.scheduledDate,
            scheduledTime: scheduleData.scheduledTime,
            scheduledEndTime: scheduleData.scheduledEndTime,
            scheduleNotes: scheduleData.scheduleNotes,
            vendorId: scheduleData.vendorId || j.vendorId,
            assignedVendorId: scheduleData.vendorId || j.assignedVendorId,
            vendorName: vendorObj?.name || j.vendorName,
            assignedVendorName: vendorObj?.name || j.assignedVendorName,
            isConfirmed: scheduleData.appointmentConfirmation === 'Confirmed',
            appointmentConfirmation: scheduleData.appointmentConfirmation,
            status: newStatus,
            lastActivityAt: now,
          };
          if (statusChanged) {
            updated = recordJobActivity(updated, 'STATUS_CHANGED', {
              summary: `Scheduled appointment for ${scheduleData.scheduledDate} ${scheduleData.scheduledTime}`,
              metadata: { from: j.status, to: newStatus },
            });
          }
          return updated;
        }
        return j;
      });
      idbSet('ptl_jobs_archive', next);
      safeSetLocalStorage('ptl_jobs_archive', JSON.stringify(next));
      saveLocalSnapshot(next, activeJobId);
      return next;
    });

    setToastMessage({
      title: 'Schedule Updated',
      subtitle: `${scheduleData.scheduledDate} at ${scheduleData.scheduledTime} (${scheduleData.appointmentConfirmation})`,
    });
    setIsQuickScheduleModalOpen(false);
    setJobForQuickSchedule(null);
  };

  const handleOpenJobQuotation = (jobId: string, action: 'view' | 'edit' | 'send' | 'preview' = 'view') => {
    setActiveJobId(jobId);
    setReportInitialAction(action);
    setPreviousViewMode(viewMode === 'main' ? 'main' : 'inspection');
    setViewMode('report');
  };

  const handleConfirmAppointment = (jobId: string) => {
    const now = new Date().toISOString();
    setJobsList((prev) => {
      const next = prev.map((j) => {
        if (j.id === jobId) {
          let updated: InspectionJob = {
            ...j,
            isConfirmed: true,
            appointmentConfirmation: 'Confirmed' as const,
            lastActivityAt: now,
          };
          return recordJobActivity(updated, 'APPOINTMENT_CONFIRMED', {
            summary: `Appointment confirmed with customer${j.scheduledDate ? ` for ${j.scheduledDate}` : ''}`,
            metadata: {
              scheduledDate: j.scheduledDate,
              scheduledTime: j.scheduledTime,
            },
          });
        }
        return j;
      });
      idbSet('ptl_jobs_archive', next);
      safeSetLocalStorage('ptl_jobs_archive', JSON.stringify(next));
      saveLocalSnapshot(next, activeJobId);
      return next;
    });

    setToastMessage({
      title: 'Appointment Confirmed',
      subtitle: 'Marked as confirmed on schedule',
    });
  };

  const handleOpenEditJob = (targetJob: InspectionJob) => {
    setJobForEdit(targetJob);
    setIsEditJobModalOpen(true);
  };

  const handleSaveEditedJob = (updatedJob: InspectionJob) => {
    setJobsList((prev) => {
      const next = prev.map((j) => (j.id === updatedJob.id ? updatedJob : j));
      idbSet('ptl_jobs_archive', next);
      safeSetLocalStorage('ptl_jobs_archive', JSON.stringify(next));
      saveLocalSnapshot(next, activeJobId);
      return next;
    });
    setIsEditJobModalOpen(false);
    setJobForEdit(null);
    setToastMessage({
      title: 'Job Updated',
      subtitle: `${updatedJob.villaName} details updated`,
    });
  };

  const handleSaveRecurringService = (service: RecurringService) => {
    setRecurringServices((prev) => {
      const idx = prev.findIndex((s) => s.id === service.id);
      let next: RecurringService[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = service;
      } else {
        next = [service, ...prev];
      }
      saveRecurringServices(next);
      return next;
    });
    setToastMessage({
      title: 'Recurring Plan Saved',
      subtitle: `${service.serviceType} (${service.frequency}) updated`,
    });
  };

  const handleDeleteRecurringService = (serviceId: string) => {
    setRecurringServices((prev) => {
      const next = prev.filter((s) => s.id !== serviceId);
      saveRecurringServices(next);
      return next;
    });
    setToastMessage({
      title: 'Recurring Plan Removed',
      subtitle: 'Plan removed from schedule',
    });
  };

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

  const handleCreateFollowupJob = (
    parentJob: InspectionJob,
    issueNote: string,
    checklistItem: any
  ) => {
    const today = new Date();
    const dateSlug = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newJobId = `PTL-JOB-${dateSlug}-${randomSuffix}`;
    const itemTitle = checklistItem?.title || checklistItem?.item || 'Follow-up';

    const newFollowupJob: InspectionJob = {
      id: newJobId,
      parentJobId: parentJob.id,
      clientId: parentJob.clientId || `CL-${randomSuffix}`,
      customerId: parentJob.customerId,
      propertyId: parentJob.propertyId,
      villaName: parentJob.villaName,
      customerName: parentJob.customerName,
      customerGroup: parentJob.customerGroup,
      propertyLocation: parentJob.propertyLocation,
      serviceArea: parentJob.serviceArea,
      executionMode: 'OWNER',
      assignedToType: 'OWNER',
      assignedBy: 'PTL Owner',
      assignedAt: today.toISOString(),
      serviceType: 'Vendor Coordination',
      status: 'Scheduled',
      inspectionDate: today.toISOString().slice(0, 10),
      createdAt: today.toISOString(),
      lastActivityAt: today.toISOString(),
      events: [
        {
          id: `EVT-${dateSlug}-${randomSuffix}-01`,
          jobId: newJobId,
          eventType: 'JOB_CREATED',
          actorType: 'OWNER',
          actorName: 'PTL Owner',
          createdAt: today.toISOString(),
          summary: `Follow-up created from ${parentJob.id} (${itemTitle})`,
        },
      ],
      inspector: 'PTL Solo Operator',
      documentRef: `PTL-${dateSlug}`,
      notes: `Follow-up from Home Watch (${itemTitle}): ${issueNote}`,
      requestDescription: `Follow-up from Home Watch (${itemTitle}): ${issueNote}`,
      price: 2500,
      scheduledDate: today.toISOString().slice(0, 10),
      scheduledTime: '10:00',
      waitingOn: 'vendor',
      isSimpleJob: true,
      workflowPreset: 'COORDINATION',
      items: [],
      quotation: {
        refNo: `QT-${dateSlug}-${randomSuffix}`,
        date: today.toLocaleDateString('en-GB'),
        inspectionRef: newJobId,
        validity: '30 days',
        paymentTerm: 'Payment due upon completion.',
        hardwareItems: [],
        serviceItems: [
          {
            item: 1,
            description: `Follow-up Repair: ${itemTitle}`,
            detail: issueNote,
            estimatedSchedule: 'Scheduled',
            qty: '1 Job',
            amount: 2500,
          },
        ],
        procurementFeeRate: 0.15,
        terms: ['Payment due upon completion.'],
        contingencies: [],
        depositPercent: 50,
      },
    };

    setJobsList((prev) => {
      const updated = [newFollowupJob, ...prev];
      idbSet('ptl_jobs_archive', updated);
      safeSetLocalStorage('ptl_jobs_archive', JSON.stringify(updated));
      return updated;
    });

    setToastMessage({
      title: lang === 'th' ? 'สร้างงานแก้ไขต่อเนื่องเรียบร้อย' : 'Follow-up Job Created',
      subtitle: `${checklistItem.title}: ${issueNote.slice(0, 40)}`,
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
            setPreviousViewMode('dashboard');
            setViewMode('inspection');
          }}
          onOpenNewJob={() => {
            setIsNewJobModalOpen(true);
            setViewMode('inspection');
          }}
          onBackToInspection={() => setViewMode(previousViewMode || 'main')}
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
          initialAction={reportInitialAction}
          initialTab="quotation"
          onBack={() => setViewMode(previousViewMode || 'main')}
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

  if (viewMode === 'main') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
        <Navigation
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setSelectedCustomerIdForView(null);
            setSelectedPropertyIdForView(null);
          }}
          onOpenQuickJob={handleOpenNormalJob}
          onOpenUrgentJob={handleOpenUrgentJob}
          onOpenMollyExpress={() => setIsMollyExpressOpen(true)}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
          todayCount={jobsList.filter((j) => j.status !== 'Completed').length}
          urgentAttentionCount={
            jobsList.filter(
              (j) =>
                j.status === 'Quoted' ||
                j.waitingOn === 'customer' ||
                j.waitingOn === 'vendor'
            ).length
          }
        />

        {/* Floating Toast Notification */}
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

        <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-5 flex-1 min-w-0">
          {activeTab === 'my_day' && (
            <MyDayView
              jobs={jobsList}
              customers={customers}
              properties={properties}
              invoices={invoices}
              vendors={vendors}
              recurringServices={recurringServices}
              tasks={tasks}
              onOpenJobInspection={(jobId) => {
                setActiveJobId(jobId);
                setPreviousViewMode('main');
                setViewMode('inspection');
              }}
              onOpenJobQuotation={(jobId, action) => {
                handleOpenJobQuotation(jobId, action);
              }}
              onOpenQuickJob={handleOpenNormalJob}
              onOpenUrgentJob={handleOpenUrgentJob}
              onSelectCustomer={(custId) => {
                setSelectedCustomerIdForView(custId);
                setActiveTab('customers');
              }}
              onSelectProperty={(propId) => {
                setSelectedPropertyIdForView(propId);
                setActiveTab('properties');
              }}
              onSelectInvoice={handleOpenInvoice}
              onUpdateJobStatus={(jobId, newStatus) => {
                setJobsList((prev) =>
                  prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
                );
              }}
              onOpenAssignVendorModal={(job) => {
                setJobForAssignVendor(job);
                setIsAssignVendorModalOpen(true);
              }}
              onOpenScheduleModal={(job) => {
                setJobForQuickSchedule(job);
                setIsQuickScheduleModalOpen(true);
              }}
              onOpenRecurringModal={() => setIsRecurringModalOpen(true)}
              onConfirmAppointment={handleConfirmAppointment}
              onOpenEditJob={handleOpenEditJob}
              onCustomerApprove={(jobId) => {
                const nowIso = new Date().toISOString();
                setJobsList((prev) =>
                  prev.map((j) =>
                    j.id === jobId
                      ? {
                          ...j,
                          status: 'Approved',
                          customerApprovedAt: nowIso,
                          quoteStatus: 'approved',
                        }
                      : j
                  )
                );
              }}
              onFinishFieldWork={(jobId) => {
                const nowIso = new Date().toISOString();
                setJobsList((prev) =>
                  prev.map((j) =>
                    j.id === jobId
                      ? {
                          ...j,
                          status: 'Completed',
                          fieldWorkCompletedAt: nowIso,
                        }
                      : j
                  )
                );
              }}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              properties={properties}
              jobs={jobsList}
              invoices={invoices}
              recurringServices={recurringServices}
              onSaveCustomer={handleSaveCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onArchiveCustomer={handleArchiveCustomer}
              onOpenQuickJobForCustomer={(cust) => {
                setQuickJobPresetCustomer(cust.id);
                setIsQuickJobModalOpen(true);
              }}
              onOpenJobInspection={(jobId) => {
                setActiveJobId(jobId);
                setPreviousViewMode('main');
                setViewMode('inspection');
              }}
              onOpenJobQuotation={(jobId) => {
                setActiveJobId(jobId);
                setPreviousViewMode('main');
                setViewMode('report');
              }}
              initialSelectedCustomerId={selectedCustomerIdForView}
            />
          )}

          {activeTab === 'properties' && (
            <PropertiesView
              properties={properties}
              customers={customers}
              jobs={jobsList}
              recurringServices={recurringServices}
              onSaveRecurringService={handleSaveRecurringService}
              onSaveProperty={handleSaveProperty}
              onOpenQuickJobForProperty={(prop) => {
                setQuickJobPresetProperty(prop.id);
                setQuickJobPresetCustomer(prop.customerId);
                setIsQuickJobModalOpen(true);
              }}
              onOpenJobInspection={(jobId) => {
                setActiveJobId(jobId);
                setPreviousViewMode('main');
                setViewMode('inspection');
              }}
              onOpenJobQuotation={(jobId) => {
                setActiveJobId(jobId);
                setPreviousViewMode('main');
                setViewMode('report');
              }}
              initialSelectedPropertyId={selectedPropertyIdForView}
            />
          )}

          {activeTab === 'jobs' && (
            <JobsView
              jobs={jobsList}
              expenses={expenses}
              invoices={invoices}
              payments={payments}
              vendors={vendors}
              onOpenQuickJob={() => setIsQuickJobModalOpen(true)}
              onOpenJobInspection={(jobId) => {
                setActiveJobId(jobId);
                setPreviousViewMode('main');
                setViewMode('inspection');
              }}
              onOpenJobQuotation={(jobId) => {
                setActiveJobId(jobId);
                setPreviousViewMode('main');
                setViewMode('report');
              }}
              onOpenJobReport={(jobId) => {
                setActiveJobId(jobId);
                setPreviousViewMode('main');
                setViewMode('report');
              }}
              onUpdateJobStatus={(jobId, newStatus) => {
                setJobsList((prev) =>
                  prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
                );
              }}
              onOpenFinancials={handleOpenFinancials}
              onOpenAddExpense={handleOpenAddExpense}
              onCreateInvoice={handleCreateInvoiceForJob}
              onOpenAssignVendorModal={(job) => {
                setJobForAssignVendor(job);
                setIsAssignVendorModalOpen(true);
              }}
              onOpenScheduleModal={(job) => {
                setJobForQuickSchedule(job);
                setIsQuickScheduleModalOpen(true);
              }}
              onConfirmAppointment={handleConfirmAppointment}
              onOpenEditJob={handleOpenEditJob}
            />
          )}

          {activeTab === 'money' && (
            <MoneyView
              jobs={jobsList}
              expenses={expenses}
              invoices={invoices}
              payments={payments}
              onOpenFinancials={handleOpenFinancials}
              onOpenAddExpense={handleOpenAddExpense}
              onOpenInvoice={handleOpenInvoice}
              onOpenRecordPayment={handleOpenRecordPayment}
              onCreateInvoiceForJob={handleCreateInvoiceForJob}
              onOpenJobReport={(jobId) => {
                setActiveJobId(jobId);
                setPreviousViewMode('main');
                setViewMode('report');
              }}
            />
          )}

          {['documents', 'vendors', 'calendar', 'settings'].includes(activeTab) && (
            <SecondaryViews
              tab={activeTab}
              jobs={jobsList}
              vendors={vendors}
              recurringServices={recurringServices}
              tasks={tasks}
              properties={properties}
              customers={customers}
              onOpenJobReport={(jobId) => {
                setActiveJobId(jobId);
                setReportInitialAction('view');
                setPreviousViewMode('main');
                setViewMode('report');
              }}
              onOpenJobQuotation={(jobId, action) => {
                handleOpenJobQuotation(jobId, action);
              }}
              onOpenJobInspection={(jobId) => {
                setActiveJobId(jobId);
                setPreviousViewMode('main');
                setViewMode('inspection');
              }}
              onOpenBackupModal={() => setIsBackupModalOpen(true)}
              onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
              onOpenDashboard={() => {
                setPreviousViewMode('main');
                setViewMode('dashboard');
              }}
              onOpenMollyExpress={() => setIsMollyExpressOpen(true)}
              onSaveVendor={handleSaveVendor}
              onOpenScheduleModal={(job) => {
                setJobForQuickSchedule(job);
                setIsQuickScheduleModalOpen(true);
              }}
              onOpenProperty={(propId) => {
                setSelectedPropertyIdForView(propId);
                setActiveTab('properties');
              }}
            />
          )}
        </main>

        <QuickJobModal
          isOpen={isQuickJobModalOpen}
          onClose={() => {
            setIsQuickJobModalOpen(false);
            setQuickJobPresetCustomer(null);
            setQuickJobPresetProperty(null);
            setQuickJobUrgency('Normal');
          }}
          customers={customers}
          properties={properties}
          onSaveJob={handleSaveQuickJob}
          presetCustomerId={quickJobPresetCustomer}
          presetPropertyId={quickJobPresetProperty}
          initialUrgency={quickJobUrgency}
        />

        {/* Phase 2 Financial Modals */}
        {isJobFinancialModalOpen && selectedJobIdForFinancials && (
          <JobFinancialModal
            isOpen={isJobFinancialModalOpen}
            onClose={() => {
              setIsJobFinancialModalOpen(false);
              setSelectedJobIdForFinancials(null);
            }}
            job={jobsList.find((j) => j.id === selectedJobIdForFinancials) || jobsList[0]}
            expenses={expenses}
            invoices={invoices}
            payments={payments}
            onOpenAddExpense={handleOpenAddExpense}
            onCreateInvoice={handleCreateInvoiceForJob}
            onOpenInvoice={handleOpenInvoice}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {isExpenseModalOpen && (
          <ExpenseModal
            isOpen={isExpenseModalOpen}
            onClose={() => {
              setIsExpenseModalOpen(false);
              setEditingExpense(null);
              setExpenseModalPresetJobId(undefined);
            }}
            jobs={jobsList}
            onSaveExpense={handleSaveExpense}
            presetJobId={expenseModalPresetJobId}
            editingExpense={editingExpense}
          />
        )}

        {isInvoiceModalOpen && selectedInvoiceId && (
          <InvoiceModal
            isOpen={isInvoiceModalOpen}
            onClose={() => {
              setIsInvoiceModalOpen(false);
              setSelectedInvoiceId(null);
            }}
            invoice={invoices.find((i) => i.id === selectedInvoiceId) || null}
            job={jobsList.find((j) => j.id === invoices.find((i) => i.id === selectedInvoiceId)?.jobId)}
            customer={customers.find((c) => c.id === invoices.find((i) => i.id === selectedInvoiceId)?.customerId)}
            property={properties.find((p) => p.id === invoices.find((i) => i.id === selectedInvoiceId)?.propertyId)}
            payments={payments}
            onOpenRecordPayment={handleOpenRecordPayment}
          />
        )}

        {isPaymentModalOpen && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => {
              setIsPaymentModalOpen(false);
              setSelectedInvoiceIdForPayment(null);
            }}
            invoices={invoices}
            onRecordPayment={handleRecordPayment}
            presetInvoiceId={selectedInvoiceIdForPayment || undefined}
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

        {isBackupModalOpen && (
          <BackupRestoreModal
            jobs={jobsList}
            activeJobId={activeJobId}
            customers={customers}
            properties={properties}
            expenses={expenses}
            invoices={invoices}
            payments={payments}
            vendors={vendors}
            recurringServices={recurringServices}
            tasks={tasks}
            onRestoreJobs={handleRestoreJobs}
            onRestoreAllData={handleRestoreAllData}
            onForceSaveToServer={handleForceSaveToServer}
            onClose={() => setIsBackupModalOpen(false)}
          />
        )}

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

        {/* Phase 3 Operations Modals */}
        {isVendorModalOpen && (
          <VendorModal
            isOpen={isVendorModalOpen}
            onClose={() => {
              setIsVendorModalOpen(false);
              setEditingVendor(null);
            }}
            onSave={handleSaveVendor}
            vendorToEdit={editingVendor}
          />
        )}

        {isAssignVendorModalOpen && jobForAssignVendor && (
          <AssignVendorModal
            isOpen={isAssignVendorModalOpen}
            job={jobForAssignVendor}
            vendors={vendors}
            onClose={() => {
              setIsAssignVendorModalOpen(false);
              setJobForAssignVendor(null);
            }}
            onAssignVendor={handleAssignVendorToJob}
          />
        )}

        {isQuickScheduleModalOpen && jobForQuickSchedule && (
          <QuickScheduleModal
            isOpen={isQuickScheduleModalOpen}
            job={jobForQuickSchedule}
            vendors={vendors}
            onClose={() => {
              setIsQuickScheduleModalOpen(false);
              setJobForQuickSchedule(null);
            }}
            onSaveSchedule={handleSaveQuickSchedule}
          />
        )}

        {isRecurringModalOpen && (
          <RecurringServicesModal
            isOpen={isRecurringModalOpen}
            onClose={() => setIsRecurringModalOpen(false)}
            recurringServices={recurringServices}
            customers={customers}
            properties={properties}
            onSaveService={handleSaveRecurringService}
            onDeleteService={handleDeleteRecurringService}
          />
        )}

        {isEditJobModalOpen && jobForEdit && (
          <EditJobModal
            isOpen={isEditJobModalOpen}
            job={jobForEdit}
            vendors={vendors}
            customers={customers}
            properties={properties}
            onClose={() => {
              setIsEditJobModalOpen(false);
              setJobForEdit(null);
            }}
            onSaveJob={handleSaveEditedJob}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      <JobWorkspaceView
        job={job}
        jobsList={jobsList}
        customers={customers}
        properties={properties}
        vendors={vendors}
        invoices={invoices}
        expenses={expenses}
        onBackToMain={() => setViewMode('main')}
        onSelectJob={handleSelectJob}
        onUpdateJob={updateCurrentJob}
        onOpenQuickJob={handleOpenNormalJob}
        onOpenUrgentJob={handleOpenUrgentJob}
        onOpenMultiJob={() => setIsMultiJobModalOpen(true)}
        onOpenReport={() => {
          setReportInitialAction('view');
          setPreviousViewMode('inspection');
          setViewMode('report');
        }}
        onOpenQuotation={(jobId, action) => {
          handleOpenJobQuotation(jobId, action);
        }}
        onOpenQuickEstimate={() => setIsQuickEstimateOpen(true)}
        onOpenFindingModal={(item) => {
          setEditingItem(item || null);
          setIsFindingModalOpen(true);
        }}
        onDeleteFinding={handleDeleteFinding}
        onAddExpense={(jobId) => handleOpenAddExpense(jobId)}
        onRecordPayment={(jobId, amt) => {
          let matchingInv = invoices.find((i) => i.jobId === jobId);
          if (!matchingInv) {
            matchingInv = createInvoiceFromJob(job, invoices);
            setInvoices((prev) => [matchingInv!, ...prev]);
          }
          handleRecordPayment({
            invoiceId: matchingInv.id,
            jobId,
            customerId: job.customerId || 'CUST-WALKIN',
            amount: amt,
            paymentMethod: 'PromptPay',
            date: new Date().toISOString().slice(0, 10),
            notes: `${job.serviceType} payment collected`,
          });
          updateCurrentJob((prev) => ({
            ...prev,
            price: amt,
            status: 'Paid',
          }));
          setToastMessage({
            title: lang === 'th' ? 'บันทึกการรับเงินสำเร็จ' : 'Payment Recorded',
            subtitle: `฿${amt.toLocaleString()} THB`,
          });
        }}
        onAssignVendor={(vendor) => {
          updateCurrentJob((prev) => ({
            ...prev,
            assignedVendorId: vendor.id,
            assignedVendorName: vendor.name,
            vendorPhone: vendor.phone,
            vendorStatus: 'Vendor Confirmed',
          }));
          setToastMessage({
            title: lang === 'th' ? 'มอบหมายช่าง/ร้านสำเร็จ' : 'Vendor Assigned',
            subtitle: `${vendor.name} (${vendor.category})`,
          });
        }}
        onCompleteJob={() => {
          updateCurrentJob((prev) => ({
            ...prev,
            status: 'Completed',
            completedAt: new Date().toISOString(),
          }));
          setToastMessage({
            title: lang === 'th' ? 'บันทึกปิดงานเสร็จสมบูรณ์' : 'Job Completed',
            subtitle: `${job.serviceType} - ${job.villaName}`,
          });
        }}
        onCreateFollowupJob={(parentJob, issueNote, checklistItem) => {
          handleCreateFollowupJob(parentJob, issueNote, checklistItem);
        }}
        onDeleteJob={handleDeleteJob}
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

      {/* Quick Job Modal for fast creation & urgent dispatch directly within workspace */}
      <QuickJobModal
        isOpen={isQuickJobModalOpen}
        onClose={() => {
          setIsQuickJobModalOpen(false);
          setQuickJobPresetCustomer(null);
          setQuickJobPresetProperty(null);
          setQuickJobUrgency('Normal');
        }}
        customers={customers}
        properties={properties}
        onSaveJob={handleSaveQuickJob}
        presetCustomerId={quickJobPresetCustomer}
        presetPropertyId={quickJobPresetProperty}
        initialUrgency={quickJobUrgency}
      />

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
          customers={customers}
          properties={properties}
          expenses={expenses}
          invoices={invoices}
          payments={payments}
          onRestoreJobs={handleRestoreJobs}
          onRestoreAllData={handleRestoreAllData}
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

      {/* Non-intrusive Safe PWA Update Banner */}
      {updateAvailableVersion && (
        <UpdateAvailableBanner
          newVersion={updateAvailableVersion !== 'latest' ? updateAvailableVersion : undefined}
          isTh={lang === 'th'}
          onDismiss={() => setUpdateAvailableVersion(null)}
        />
      )}
    </div>
  );
}

