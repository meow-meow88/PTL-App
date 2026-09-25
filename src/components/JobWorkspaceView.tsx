import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  MessageSquare,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Plus,
  Zap,
  Layers,
  ChevronRight,
  ShieldAlert,
  FileText,
  Share2,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import {
  InspectionJob,
  Customer,
  Property,
  Invoice,
  Vendor,
  Expense,
} from '../types';
import { useLanguage } from '../i18n/translations';
import { formatDateDisplay, formatTime24h } from '../utils/dateTime';
import { BUILD_VERSION } from '../utils/buildVersion';
import {
  getLocalizedServiceName,
  getDominantJobState,
  getPrimaryJobAction,
  isHomeWatchService,
  isHomeInspectionService,
  isRoadsideService,
  isElectricalService,
  isCctvService,
  isNetworkService,
  isSmartHomeService,
  isPetAssistanceService,
  isAirportAssistanceService,
  isGeneralAssistanceService,
} from '../utils/serviceWorkflow';
import { HomeWatchVisitView } from './HomeWatchVisitView';
import { RoadAssistanceWorkflowView } from './RoadAssistanceWorkflowView';
import { FlexibleJobWorkflowView } from './FlexibleJobWorkflowView';
import { ElectricalWorkspaceView } from './workspaces/ElectricalWorkspaceView';
import { CctvWorkspaceView } from './workspaces/CctvWorkspaceView';
import { NetworkWifiWorkspaceView } from './workspaces/NetworkWifiWorkspaceView';
import { SmartHomeWorkspaceView } from './workspaces/SmartHomeWorkspaceView';
import { PetAssistanceWorkspaceView } from './workspaces/PetAssistanceWorkspaceView';
import { AirportAssistanceWorkspaceView } from './workspaces/AirportAssistanceWorkspaceView';
import { GeneralAssistanceWorkspaceView } from './workspaces/GeneralAssistanceWorkspaceView';
import { CompactAppointmentModal } from './CompactAppointmentModal';
import { CustomerResponseModal } from './CustomerResponseModal';
import { BeforeInspectionWorkspaceView } from './workspaces/BeforeInspectionWorkspaceView';

interface JobWorkspaceViewProps {
  job: InspectionJob;
  openCustomerResponseOnMount?: boolean;
  onCustomerResponseClosed?: () => void;
  jobsList: InspectionJob[];
  customers: Customer[];
  properties: Property[];
  vendors?: Vendor[];
  invoices?: Invoice[];
  expenses?: Expense[];
  onBackToMain: () => void;
  onSelectJob: (jobId: string) => void;
  onUpdateJob: (updater: (prev: InspectionJob) => InspectionJob) => void;
  onOpenQuickJob: () => void;
  onOpenUrgentJob: () => void;
  onOpenMultiJob: () => void;
  onOpenReport: () => void;
  onOpenQuotation: (jobId: string, action?: 'view' | 'edit' | 'send' | 'preview') => void;
  onOpenFinancialJob: (jobId: string, purpose: 'invoice' | 'advance') => void;
  onOpenQuickEstimate?: () => void;
  onOpenFindingModal?: (item?: any) => void;
  onDeleteFinding?: (itemId: string) => void;
  onAddExpense?: (jobId: string) => void;
  onRecordPayment: (jobId: string, amount: number) => void;
  onAssignVendor: (vendor: Vendor) => void;
  onCompleteJob: () => void;
  onCreateFollowupJob?: (parentJob: InspectionJob, issueNote?: string, checklistItem?: any) => void;
  onDeleteJob?: (jobId: string) => void;
  onConfirmAppointment?: (jobId: string) => void;
  onOpenScheduleModal?: (job: InspectionJob) => void;
}

export const JobWorkspaceView: React.FC<JobWorkspaceViewProps> = ({
  job,
  openCustomerResponseOnMount = false,
  onCustomerResponseClosed,
  jobsList,
  customers,
  properties,
  vendors = [],
  invoices = [],
  expenses = [],
  onBackToMain,
  onSelectJob,
  onUpdateJob,
  onOpenQuickJob,
  onOpenUrgentJob,
  onOpenMultiJob,
  onOpenReport,
  onOpenQuotation,
  onOpenFinancialJob,
  onOpenQuickEstimate,
  onOpenFindingModal,
  onDeleteFinding,
  onAddExpense,
  onRecordPayment,
  onAssignVendor,
  onCompleteJob,
  onCreateFollowupJob,
  onDeleteJob,
  onConfirmAppointment,
  onOpenScheduleModal,
}) => {
  const { lang, setLanguage, t } = useLanguage();
  const isTh = lang === 'th';
  const isDirectWork = Boolean(job.jobPurpose && !['INSPECTION_DIAGNOSIS', 'FAULT_FINDING', 'HOME_WATCH_VISIT'].includes(job.jobPurpose));

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [isCustomerResponseOpen, setIsCustomerResponseOpen] = useState(openCustomerResponseOnMount);

  // Lookup customer and property
  const customer = customers.find((c) => c.id === job.customerId);
  const property = properties.find((p) => p.id === job.propertyId);

  // Active concurrent jobs count (excluding this one)
  const otherActiveJobs = jobsList.filter(
    (j) =>
      j.id !== job.id &&
      (j.status === 'In Progress' ||
        Boolean(j.visitStartedAt) ||
        Boolean(j.siteArrivedAt) ||
        Boolean(j.actualStartedAt))
  );

  // Scheduled date and 24h time formatting
  const formattedDate = formatDateDisplay(job.scheduledDate || job.inspectionDate, lang);
  const formattedTime = formatTime24h(job.scheduledTime);
  // The field screen already shows the job context and capture controls. Avoid
  // repeating the operational summary above it while someone is inspecting.
  const isFocusedFieldVisit = isElectricalService(job.serviceType) &&
    (job.status === 'In Progress' || Boolean(job.visitStartedAt) || Boolean(job.siteArrivedAt)) &&
    !job.scopeConfirmed;

  // Customer phone cleanup
  const cleanPhone = (p?: string) => (p || '').replace(/[^0-9+]/g, '');
  const phoneVal = customer?.phone || job.customerPhone;
  const cleaned = cleanPhone(phoneVal);
  const waUrl = cleaned
    ? `https://wa.me/${cleaned.replace(/^\+/, '')}?text=${encodeURIComponent(
        isTh
          ? `สวัสดีครับ จาก Phuket Trusted Local แจ้งอัปเดตงาน ${getLocalizedServiceName(job.serviceType, lang)} (${job.villaName || property?.name || ''})`
          : `Hello from Phuket Trusted Local regarding ${job.serviceType} at ${job.villaName || property?.name || ''}`
      )}`
    : undefined;

  // Determine current dominant state and explanation
  const getDominantStateDetails = () => {
    const state = getDominantJobState(job, lang);
    if (state.key === 'cancelled') {
      return {
        stage: 'workflow_closed',
        badge: state.label,
        badgeBg: state.badgeClass,
        explanation: isTh ? 'งานนี้ไม่ได้ดำเนินการต่อ' : 'This job is not going ahead.',
        nextStep: isTh ? 'กลับไปดูงานอื่น' : 'Return to your jobs',
        actionLabel: isTh ? 'กลับ My Day' : 'Back to My Day',
        actionColor: 'bg-slate-800 hover:bg-slate-700 text-white',
        onAction: onBackToMain,
      };
    }
    const actionableBeforeVisit = new Set([
      'new', 'waiting_scope', 'scope_confirmed', 'quote_drafted',
      'waiting_approval', 'approved_to_schedule', 'scheduled_unconfirmed',
      'scheduled_confirmed', 'waiting_vendor', 'waiting_deposit',
    ]);
    if ((isDirectWork && job.status !== 'Completed' && !job.actualCompletedAt && !job.fieldWorkCompletedAt) ||
        (actionableBeforeVisit.has(state.key) && !job.visitStartedAt && !job.actualStartedAt && !job.siteArrivedAt)) {
      const action = getPrimaryJobAction(job, lang);
      return {
        stage: state.key === 'in_progress' ? 'direct_work_active' : state.key === 'waiting_vendor' ? 'workflow_vendor' : 'workflow_pending',
        badge: state.label,
        badgeBg: state.badgeClass,
        explanation: state.key === 'waiting_approval'
          ? (isTh ? 'ส่งใบเสนอราคาแล้ว รอคำตอบจากลูกค้า' : 'Quotation sent; waiting for the customer.')
          : job.requestDescription || job.serviceType,
        nextStep: action.label,
        actionLabel: action.label,
        actionColor: action.buttonClass,
        onAction: () => {
          switch (action.type) {
            case 'create_quote':
            case 'create_inspection_quote':
            case 'quick_quote': onOpenQuotation(job.id, 'edit'); break;
            case 'send_quote': onOpenQuotation(job.id, 'send'); break;
            case 'record_customer_response': setIsCustomerResponseOpen(true); break;
            case 'record_deposit':
            case 'request_deposit': onOpenFinancialJob(job.id, 'advance'); break;
            case 'schedule_job': if (onOpenScheduleModal) onOpenScheduleModal(job); else setIsApptModalOpen(true); break;
            case 'confirm_appointment': setIsApptModalOpen(true); break;
            case 'start_job': onUpdateJob((prev) => ({ ...prev, status: 'In Progress', actualStartedAt: new Date().toISOString() })); break;
            case 'finish_field_work': onUpdateJob((prev) => ({ ...prev, status: 'Completed', actualCompletedAt: new Date().toISOString() })); break;
            case 'assess_mr_big':
            case 'resume_job':
            case 'assign_vendor':
            case 'contact_vendor': document.getElementById('job-workspace-field-tools')?.scrollIntoView({ behavior: 'smooth' }); break;
            default: document.getElementById('job-workspace-field-tools')?.scrollIntoView({ behavior: 'smooth' });
          }
        },
      };
    }
    // 1. After Field Work / Completed
    if (job.status === 'Completed' || Boolean(job.completedAt) || Boolean(job.actualCompletedAt) || Boolean(job.fieldWorkFinishedAt)) {
      const hasInvoice = invoices.some((i) => i.jobId === job.id);
      const isPaid = job.paymentStatus === 'Paid' || invoices.some((i) => i.jobId === job.id && i.status === 'Paid');
      if (isPaid) {
        return {
          stage: 'after_field_work',
          badge: isTh ? 'เสร็จสมบูรณ์ • ชำระแล้ว' : 'Completed • Paid',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          explanation: isTh
            ? 'บันทึกการทำงาน หลักฐาน และรับชำระเงินเรียบร้อยแล้ว'
            : 'All work, evidence, and payment completed.',
          nextStep: isTh ? 'ดูรายงานส่งมอบงาน' : 'View handover report',
          actionLabel: isTh ? 'ดูรายงาน / สรุปงาน' : 'View Site Report',
          actionColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
          onAction: onOpenReport,
        };
      }
      if (hasInvoice) {
        return {
          stage: 'after_field_work',
          badge: isTh ? 'ส่งงานแล้ว • รอชำระเงิน' : 'Completed • Awaiting Payment',
          badgeBg: 'bg-amber-100 text-amber-950 border-amber-300 font-bold',
          explanation: isTh
            ? 'ออกใบแจ้งหนี้แล้ว รอลูกค้าชำระเงินคงค้าง'
            : 'Invoiced; awaiting customer payment.',
          nextStep: isTh ? 'บันทึกการรับชำระเงิน' : 'Record received payment',
          actionLabel: isTh ? 'รับชำระเงิน' : 'Collect Payment',
          actionColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
          onAction: () => {
            onOpenFinancialJob(job.id, 'invoice');
          },
        };
      }
      return {
        stage: 'after_field_work',
        badge: isTh ? 'งานหน้างานเสร็จแล้ว' : 'Field Work Finished',
        badgeBg: 'bg-blue-100 text-blue-950 border-blue-300 font-bold',
        explanation: isTh
          ? 'ช่างทำงานเสร็จสิ้นแล้ว พร้อมออกใบแจ้งหนี้และรายงาน'
          : 'Field work finished; ready to invoice and report.',
        nextStep: isTh ? 'ออกใบแจ้งหนี้เรียกเก็บเงิน' : 'Create final invoice',
        actionLabel: isTh ? 'ออกใบแจ้งหนี้' : 'Create Invoice',
        actionColor: 'bg-blue-600 hover:bg-blue-500 text-white',
        onAction: () => onOpenFinancialJob(job.id, 'invoice'),
      };
    }

    // 2. During Repair Execution
    if (
      (job.status === 'In Progress' || job.repairStartedAt) &&
      job.scopeConfirmed &&
      (Boolean(job.customerApprovedAt) || Boolean(job.repairStartedAt) || job.status === 'Approved')
    ) {
      return {
        stage: 'during_repair',
        badge: isTh ? 'กำลังซ่อมแซมหน้างาน' : 'Repair In Progress',
        badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
        explanation: isTh
          ? 'ลูกค้ารับทราบขอบเขตแล้ว กำลังดำเนินการแก้ไขหน้างาน'
          : 'Repair work actively ongoing on site.',
        nextStep: isTh ? 'ทดสอบการทำงานและจบงานหน้างาน' : 'Verify operation and finish field work',
        actionLabel: isTh ? 'เสร็จสิ้นงานหน้างาน' : 'Finish Field Work',
        actionColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        onAction: () => {
          onUpdateJob((prev) => ({
            ...prev,
            status: 'Completed',
            actualCompletedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            fieldWorkFinishedAt: new Date().toISOString(),
          }));
          onCompleteJob();
        },
      };
    }

    // 3. Repair Quote Stage
    const hasRepairWork = Boolean(job.quotation?.serviceItems?.some((i) => i.isRepairWork || i.item > 1));
    if (
      job.scopeConfirmed &&
      (Boolean(job.repairQuoteSentAt) || job.status === 'Waiting Approval' || hasRepairWork)
    ) {
      const isApproved = job.customerApprovalStatus === 'Approved' || job.status === 'Approved';
      if (isApproved) {
        return {
          stage: 'repair_quote',
          badge: isTh ? 'ลูกค้าอนุมัติซ่อมแล้ว' : 'Repair Quote Approved',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
          explanation: isTh
            ? 'ลูกค้ายืนยันอนุมัติค่าซ่อมแล้ว พร้อมเริ่มดำเนินการ'
            : 'Customer approved repair quote. Ready to start repair.',
          nextStep: isTh ? 'เริ่มดำเนินการซ่อมแซม' : 'Start repair work',
          actionLabel: isTh ? 'เริ่มงานซ่อม' : 'Start Repair',
          actionColor: 'bg-blue-600 hover:bg-blue-500 text-white',
          onAction: () => {
            onUpdateJob((prev) => ({
              ...prev,
              status: 'In Progress',
              repairStartedAt: new Date().toISOString(),
            }));
          },
        };
      }
      return {
        stage: 'repair_quote',
        badge: isTh ? 'รอลูกค้าอนุมัติค่าซ่อม' : 'Repair Quote Ready',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
        explanation: isTh
          ? 'ส่งใบเสนอราคาซ่อมแล้ว รอลูกค้ายืนยันงบประมาณ'
          : 'Repair quote ready; awaiting customer approval.',
        nextStep: isTh ? 'ส่งใบเสนอราคาซ่อมให้ลูกค้า' : 'Send repair quote to customer',
        actionLabel: isTh ? 'ส่งใบเสนอราคาซ่อม' : 'Send Repair Quote',
        actionColor: 'bg-amber-600 hover:bg-amber-500 text-white',
        onAction: () => onOpenQuotation(job.id, 'send'),
      };
    }

    // 4. Scope Ready (Scope confirmed, ready for Molly repair pricing)
    if (job.scopeConfirmed) {
      return {
        stage: 'scope_ready',
        badge: isTh ? 'ยืนยันขอบเขตงานแล้ว' : 'Scope Confirmed',
        badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold',
        explanation: isTh
          ? 'ช่างยืนยันข้อเท็จจริงและผลตรวจแล้ว พร้อมส่งต่อให้ Molly ทำราคาซ่อม'
          : 'Technical facts confirmed. Ready for Molly repair pricing.',
        nextStep: isTh ? 'ส่งต่อให้ Molly ทำราคาค่าอะไหล่และค่าแรง' : 'Send scope to Molly for pricing',
        actionLabel: isTh ? 'ส่งต่อให้ Molly' : 'Send Scope to Molly',
        actionColor: 'bg-amber-600 hover:bg-amber-500 text-white font-black',
        onAction: () => {
          if (onOpenQuickEstimate) onOpenQuickEstimate();
        },
      };
    }

    // 5. During Inspection (In Progress or visit started, scope NOT confirmed)
    if (job.status === 'In Progress' || job.visitStartedAt || job.siteArrivedAt) {
      const isHomeWatch = isHomeWatchService(job.serviceType, job);
      return {
        stage: 'during_inspection',
        badge: isTh ? 'กำลังเข้าตรวจหน้างาน' : 'Inspection Active',
        badgeBg: 'bg-blue-100 text-blue-900 border-blue-300 animate-pulse font-bold',
        explanation: isHomeWatch
          ? isTh
            ? `กำลังตรวจเช็กสภาพวิลล่า (เริ่มเมื่อ ${formatTime24h(job.visitStartedAt)})`
            : `Inspection active (started at ${formatTime24h(job.visitStartedAt)})`
          : isTh
          ? 'กำลังดำเนินการตรวจเช็คหน้างานและบันทึกข้อเท็จจริง'
          : 'Field inspection in progress. Preserving facts and tests.',
        nextStep: isHomeWatch
          ? (isTh ? 'ทำเช็กลิสต์และถ่ายรูปของรอบนี้' : 'Complete this visit’s checklist and photos')
          : (isTh ? 'บันทึกผลการตรวจเช็กกับ Mr. Big' : 'Record field findings with Mr. Big'),
        actionLabel: isHomeWatch ? (isTh ? 'ทำเช็กลิสต์รอบนี้' : 'Open Visit Checklist') : (isTh ? 'บันทึกกับ Mr. Big' : 'Talk to Mr. Big'),
        actionColor: 'bg-blue-600 hover:bg-blue-500 text-white font-black',
        onAction: () => {
          if (isHomeWatch) {
            document.getElementById('job-workspace-field-tools')?.scrollIntoView({ behavior: 'smooth' });
            return;
          }
          const el = document.getElementById('mr-big-assessment-card');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else if (onOpenFindingModal) {
            onOpenFindingModal();
          }
        },
      };
    }

    // 6. Before Inspection: Unconfirmed vs Confirmed
    const isApptConfirmed = job.appointmentConfirmation === 'Confirmed' || job.isConfirmed === true;
    if (!isApptConfirmed) {
      return {
        stage: 'before_inspection',
        badge: isTh ? 'ยังไม่ยืนยันนัด' : 'Appointment not confirmed',
        badgeBg: 'bg-amber-100 text-amber-950 border-amber-300 font-bold',
        explanation: isTh
          ? `กำหนดนัด ${formattedDate} เวลา ${formattedTime || 'ตามตกลง'} (รอยืนยันนัดหมายกับลูกค้า)`
          : `Scheduled for ${formattedDate} at ${formattedTime || 'TBD'} (Awaiting customer confirmation)`,
        nextStep: isTh ? 'ยืนยันวันเวลากับลูกค้า' : 'Confirm scheduled time with customer',
        actionLabel: isTh ? 'ยืนยันนัดหมาย' : 'Confirm Appointment',
        actionColor: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-xs',
        onAction: () => setIsApptModalOpen(true),
      };
    }

    // 7. Before Inspection: Confirmed
    return {
      stage: 'before_inspection',
      badge: isTh ? 'ยืนยันนัดแล้ว • พร้อมเข้าตรวจ' : 'Appointment confirmed',
      badgeBg: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold',
      explanation: isTh
        ? `กำหนดนัด ${formattedDate} เวลา ${formattedTime || 'ตามตกลง'} (ยืนยันนัดหมายเรียบร้อย)`
        : `Confirmed for ${formattedDate} at ${formattedTime || 'TBD'}`,
      nextStep: isTh ? 'กดเริ่มเข้าตรวจเมื่อถึงสถานที่' : 'Start inspection upon arrival on site',
      actionLabel: isTh ? 'เริ่มเข้าตรวจ' : 'Start Inspection',
      actionColor: 'bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xs',
      onAction: () => {
        onUpdateJob((prev) => ({
          ...prev,
          status: 'In Progress',
          visitStartedAt: new Date().toISOString(),
          actualStartedAt: new Date().toISOString(),
        }));
      },
    };
  };

  const stateDetails = getDominantStateDetails();

  // Progress Stepper logic
  const getStepperSteps = () => {
    if (isHomeWatchService(job.serviceType, job)) {
      return [
        { labelTh: 'นัดหมาย', labelEn: 'Scheduled', active: true, done: Boolean(job.visitStartedAt || job.status === 'Completed') },
        { labelTh: 'เริ่มตรวจ', labelEn: 'Start Visit', active: Boolean(job.visitStartedAt && job.status !== 'Completed'), done: job.status === 'Completed' },
        { labelTh: 'เช็กลิสต์', labelEn: 'Checklist', active: Boolean(job.visitStartedAt && job.status !== 'Completed'), done: job.status === 'Completed' },
        { labelTh: 'เสร็จสิ้น', labelEn: 'Complete', active: job.status === 'Completed', done: job.status === 'Completed' },
      ];
    }
    if (isRoadsideService(job.serviceType, job)) {
      return [
        { labelTh: 'รับแจ้ง', labelEn: 'Dispatched', active: true, done: Boolean(job.siteArrivedAt || job.status === 'Completed') },
        { labelTh: 'ถึงที่เกิดเหตุ', labelEn: 'On Site', active: Boolean(job.siteArrivedAt && job.status !== 'Completed'), done: job.status === 'Completed' },
        { labelTh: 'เปลี่ยนยาง/ช่วย', labelEn: 'Assistance', active: Boolean(job.siteArrivedAt && job.status !== 'Completed'), done: job.status === 'Completed' },
        { labelTh: 'รับเงิน/เสร็จ', labelEn: 'Paid & Done', active: job.status === 'Completed' || job.status === 'Paid', done: job.status === 'Completed' || job.status === 'Paid' },
      ];
    }
    return [
      { labelTh: 'เปิดงาน', labelEn: 'Created', active: true, done: Boolean(job.status !== 'Scheduled') },
      { labelTh: 'เสนอราคา', labelEn: 'Quoted', active: job.status === 'Quoted' || job.status === 'Waiting Approval', done: Boolean(job.status === 'Approved' || job.status === 'In Progress' || job.status === 'Completed') },
      { labelTh: 'ดำเนินการ', labelEn: 'In Progress', active: job.status === 'In Progress', done: job.status === 'Completed' },
      { labelTh: 'ส่งมอบงาน', labelEn: 'Completed', active: job.status === 'Completed', done: job.status === 'Completed' },
    ];
  };

  const steps = getStepperSteps();

  // Strict Delete Safety Check (Part 73-76)
  const handleDeleteAttempt = () => {
    // 1. Payment check
    const jobInvoices = invoices.filter((i) => i.jobId === job.id);
    const hasPayment =
      jobInvoices.some((i) => i.status === 'Paid' || (i.paidAmount && i.paidAmount > 0)) ||
      job.paymentStatus === 'Paid';

    if (hasPayment) {
      setDeleteError(
        isTh
          ? 'ไม่สามารถลบงานนี้ได้เนื่องจากมีการรับชำระเงินแล้ว กรุณาใช้การยกเลิกงาน (Cancel) หรือเก็บถาวร (Archive) แทน'
          : 'Cannot delete this Job because payment has already been received. Please Cancel or Archive instead.'
      );
      return;
    }

    // 2. Customer approval check
    if (job.status === 'Approved' || job.customerApprovalStatus === 'Approved') {
      setDeleteError(
        isTh
          ? 'ไม่สามารถลบงานนี้ได้เนื่องจากลูกค้ายืนยันอนุมัติใบเสนอราคาแล้ว กรุณาใช้การยกเลิกงาน (Cancel) แทน'
          : 'Cannot delete this Job because the quotation was approved by the customer. Please Cancel instead.'
      );
      return;
    }

    if (
      window.confirm(
        isTh
          ? `ต้องการลบงาน "${job.villaName || job.serviceType}" ใช่หรือไม่? (การกระทำนี้ไม่สามารถย้อนกลับได้)`
          : `Are you sure you want to permanently delete "${job.villaName || job.serviceType}"?`
      )
    ) {
      if (onDeleteJob) {
        onDeleteJob(job.id);
        onBackToMain();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-20 w-full max-w-full overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. TOP COMPACT STICKY CONTROL BAR (Replaces V1 Header) */}
      {/* ========================================================================= */}
      <header
        className="bg-slate-900 text-white sticky top-0 z-30 px-3 sm:px-6 py-2.5 shadow-md border-b border-slate-800"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 10px)' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 w-full min-w-0">
          {/* Back to My Day (Touch target ≥44px) */}
          <button
            id="job-workspace-btn-back"
            type="button"
            onClick={onBackToMain}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-700/80"
          >
            <ArrowLeft className="w-4 h-4 text-slate-300 shrink-0" />
            <span>{isTh ? 'กลับ My Day' : 'Back to My Day'}</span>
          </button>

          {/* Center: Villa / Job Title snippet on Mobile */}
          <div className="hidden xs:block min-w-0 flex-1 px-2 text-center">
            <div className="text-xs font-black text-white truncate">
              {job.villaName || property?.name || job.serviceType}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {getLocalizedServiceName(job.serviceType, lang)}
            </div>
          </div>

          {/* Right Actions: Switch Active Job, Urgent Job & Language */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Switch Job Button (shows count of other active jobs) */}
            {otherActiveJobs.length > 0 && (
              <button
                id="job-workspace-btn-switch"
                type="button"
                onClick={onOpenMultiJob}
                className="min-h-[38px] px-2.5 py-1 rounded-xl bg-blue-700/80 hover:bg-blue-600 text-white font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer border border-blue-500/40 shrink-0"
                title="Switch to another active job"
              >
                <Building2 className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                <span className="hidden sm:inline">{isTh ? 'สลับงาน' : 'Switch'}</span>
                <span className="bg-blue-900 px-1.5 py-0.2 rounded-full text-[10px]">
                  +{otherActiveJobs.length}
                </span>
              </button>
            )}

            {/* Fast Urgent Job button */}
            <button
              id="job-workspace-btn-urgent"
              type="button"
              onClick={onOpenUrgentJob}
              className="min-h-[38px] px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
              title="Create urgent job"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
              <span className="hidden md:inline">{isTh ? 'งานด่วน' : 'Urgent'}</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.5 rounded text-[11px] cursor-pointer ${
                  lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('th')}
                className={`px-1.5 py-0.5 rounded text-[11px] cursor-pointer ${
                  lang === 'th' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                TH
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Delete safety modal error */}
      {deleteError && (
        <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-3 w-full min-w-0">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs sm:text-sm font-semibold flex items-start justify-between gap-2 shadow-xs">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-950">
                  {isTh ? 'ไม่สามารถลบงานนี้ได้' : 'Action Blocked'}
                </div>
                <div className="mt-0.5">{deleteError}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDeleteError(null)}
              className="text-slate-400 hover:text-slate-800 font-bold p-1 leading-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TOP OPERATIONAL COMMAND BLOCK (Answers the 8 Core Questions) */}
      {/* Shown only when in active stages (During Inspection, Scope Ready, etc.) */}
      {/* ========================================================================= */}
      {stateDetails.stage !== 'before_inspection' && !isFocusedFieldVisit && (
        <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-3 sm:pt-4 w-full min-w-0">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5 w-full min-w-0">
            {/* Row A: Customer & Location */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="min-w-0">
                {/* Customer Title + Group */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-400 uppercase tracking-wide">
                    {job.id}
                  </span>
                  <span className="text-slate-300">•</span>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 truncate">
                    {customer?.name || job.customerName || 'Walk-in Customer'}
                  </h1>
                  {(customer?.customerGroup || job.customerGroup) && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {customer?.customerGroup || job.customerGroup}
                    </span>
                  )}
                </div>

                {/* Service & Villa Name */}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm font-bold text-slate-700">
                  <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {getLocalizedServiceName(job.serviceType, lang)}
                  </span>
                  <span>•</span>
                  <span className="text-slate-900">
                    {job.villaName || property?.name || job.propertyLocation || 'Location TBD'}
                  </span>
                  {job.propertyLocation && (
                    <span className="text-slate-500 font-normal flex items-center gap-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{job.propertyLocation}</span>
                    </span>
                  )}
                </div>

                {/* Scheduled Date & Time in 24h format */}
                <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formattedDate}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formattedTime ? `${formattedTime} (24h)` : isTh ? 'ไม่ระบุเวลา' : 'Time TBD'}</span>
                  </span>
                </div>
              </div>

              {/* Quick Contact Buttons (Call & WhatsApp) */}
              <div className="flex items-center gap-2 self-start shrink-0">
                {phoneVal && (
                  <a
                    href={`tel:${cleaned}`}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="Call Customer"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span className="hidden sm:inline">{isTh ? 'โทร' : 'Call'}</span>
                  </a>
                )}
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    title="WhatsApp Customer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* Reported Issue Display */}
            {(job.requestDescription || job.notes) && (
              <div className="px-3.5 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 flex items-start gap-2.5 text-xs">
                <span className="font-black text-amber-900 shrink-0 text-[10px] uppercase bg-amber-200/70 px-2 py-0.5 rounded-md mt-0.5">
                  {isTh ? 'ปัญหาที่แจ้ง' : 'Reported Issue'}
                </span>
                <span className="text-slate-900 font-bold leading-relaxed">
                  {job.requestDescription || job.notes}
                </span>
              </div>
            )}

            {/* Row B: Current State & Dominant Action */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {isTh ? 'สถานะปัจจุบัน' : 'CURRENT STATUS'}:
                  </span>
                  <span
                    className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${stateDetails.badgeBg}`}
                  >
                    {stateDetails.badge}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
                  {stateDetails.explanation}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  <span className="font-bold text-slate-700">{isTh ? 'ขั้นตอนถัดไป:' : 'Next Step:'}</span>{' '}
                  {stateDetails.nextStep}
                </p>
              </div>

              {/* Dominant Primary Action Button (Touch target ≥44px) */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  id="job-workspace-btn-primary-action"
                  type="button"
                  onClick={stateDetails.onAction}
                  className={`min-h-[44px] px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-98 ${stateDetails.actionColor}`}
                >
                  <span>{stateDetails.actionLabel}</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Row C: Progress Stepper */}
            {!isDirectWork && <div className="pt-2">
              <div className="grid grid-cols-4 gap-1 sm:gap-2">
                {steps.map((s, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <div className="w-full flex items-center mb-1">
                      <div
                        className={`h-1.5 flex-1 rounded-full ${
                          s.done
                            ? 'bg-emerald-500'
                            : s.active
                            ? 'bg-blue-600'
                            : 'bg-slate-200'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-bold leading-tight truncate ${
                        s.active
                          ? 'text-blue-700 font-extrabold'
                          : s.done
                          ? 'text-emerald-700 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {isTh ? s.labelTh : s.labelEn}
                    </span>
                  </div>
                ))}
              </div>
            </div>}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CORE WORKFLOW ENGINE RENDERER (Clean, Progressive Disclosure) */}
      {/* ========================================================================= */}
      <main id="job-workspace-field-tools" className="max-w-4xl mx-auto w-full px-3 sm:px-6 py-4 flex-1 min-w-0">
        {stateDetails.stage === 'workflow_closed' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
            {isTh ? 'งานนี้ไม่ได้ดำเนินการต่อ คุณยังลบงานร่างที่ไม่มีการอนุมัติหรือรับเงินได้' : 'This job is not going ahead. Unapproved, unpaid drafts can still be deleted.'}
          </div>
        ) : stateDetails.stage === 'workflow_pending' || stateDetails.stage === 'direct_work_pending' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
            <p className="font-bold text-slate-900">{isTh ? 'รายละเอียดงาน' : 'Job details'}</p>
            <p className="mt-2">{job.requestDescription || job.serviceType}</p>
            <p className="mt-2 text-slate-500">{isTh ? 'ทำขั้นตอนด้านบนก่อน เครื่องมือหน้างานจะแสดงเมื่อเริ่มทำงาน' : 'Complete the action above before starting field work.'}</p>
          </div>
        ) : stateDetails.stage === 'before_inspection' ? (
          <BeforeInspectionWorkspaceView
            job={job}
            customer={customer}
            property={property}
            formattedDate={formattedDate}
            formattedTime={formattedTime}
            isApptConfirmed={job.appointmentConfirmation === 'Confirmed' || job.isConfirmed === true}
            isTh={isTh}
            lang={lang}
            invoices={invoices}
            expenses={expenses}
            onConfirmAppointment={() => setIsApptModalOpen(true)}
            onStartInspection={() => {
              onUpdateJob((prev) => ({
                ...prev,
                status: 'In Progress',
                visitStartedAt: new Date().toISOString(),
                actualStartedAt: new Date().toISOString(),
              }));
            }}
            onOpenQuotation={onOpenQuotation}
            onOpenScheduleModal={() => {
              if (onOpenScheduleModal) onOpenScheduleModal(job);
              else setIsApptModalOpen(true);
            }}
            onOpenQuickEstimate={onOpenQuickEstimate}
            onUpdateJob={onUpdateJob}
          />
        ) : isHomeWatchService(job.serviceType, job) || isHomeInspectionService(job.serviceType) ? (
          <HomeWatchVisitView
            job={job}
            title={isHomeInspectionService(job.serviceType) ? 'Home Inspection' : undefined}
            onUpdateJob={onUpdateJob}
            onCompleteVisit={() => {
              onUpdateJob((prev) => ({
                ...prev,
                status: 'Completed',
                visitCompletedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
              }));
              onCompleteJob();
            }}
            onCreateFollowupJob={(issueNote, checklistItem) => {
              if (onCreateFollowupJob) {
                onCreateFollowupJob(job, issueNote, checklistItem);
              }
            }}
            onOpenReport={onOpenReport}
          />
        ) : isRoadsideService(job.serviceType, job) ? (
          <RoadAssistanceWorkflowView
            job={job}
            vendors={vendors}
            previousActiveJob={otherActiveJobs[0]}
            onUpdateJob={onUpdateJob}
            onRecordPayment={(jobId, amt) => onRecordPayment(jobId, amt)}
            onAssignVendor={(vendor) => onAssignVendor(vendor)}
            onCompleteJob={() => {
              onCompleteJob();
              window.setTimeout(() => document.getElementById('job-workspace-btn-primary-action')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
            }}
            onResumePreviousJob={(prevId) => onSelectJob(prevId)}
          />
        ) : isElectricalService(job.serviceType) ? (
          <ElectricalWorkspaceView
            key={job.id}
            job={job}
            vendors={vendors}
            invoices={invoices}
            expenses={expenses}
            onUpdateJob={onUpdateJob}
            onRecordPayment={(jobId, amt) => onRecordPayment(jobId, amt)}
            onAssignVendor={(vendor) => onAssignVendor(vendor)}
            onCompleteJob={onCompleteJob}
            onOpenReport={onOpenReport}
            onOpenQuotation={onOpenQuotation}
            onOpenQuickEstimate={onOpenQuickEstimate || (() => {})}
            onAddExpense={onAddExpense}
            onOpenSwitchJob={onOpenMultiJob}
            jobsCount={jobsList.length}
            currentJobIndex={jobsList.findIndex((j) => j.id === job.id)}
          />
        ) : isCctvService(job.serviceType) ? (
          <CctvWorkspaceView
            job={job}
            vendors={vendors}
            invoices={invoices}
            expenses={expenses}
            onUpdateJob={onUpdateJob}
            onRecordPayment={(jobId, amt) => onRecordPayment(jobId, amt)}
            onAssignVendor={(vendor) => onAssignVendor(vendor)}
            onCompleteJob={onCompleteJob}
            onOpenReport={onOpenReport}
            onOpenQuickEstimate={onOpenQuickEstimate || (() => {})}
            onAddExpense={onAddExpense}
            onOpenSwitchJob={onOpenMultiJob}
            jobsCount={jobsList.length}
            currentJobIndex={jobsList.findIndex((j) => j.id === job.id)}
          />
        ) : isNetworkService(job.serviceType) ? (
          <NetworkWifiWorkspaceView
            job={job}
            vendors={vendors}
            invoices={invoices}
            expenses={expenses}
            onUpdateJob={onUpdateJob}
            onRecordPayment={(jobId, amt) => onRecordPayment(jobId, amt)}
            onAssignVendor={(vendor) => onAssignVendor(vendor)}
            onCompleteJob={onCompleteJob}
            onOpenReport={onOpenReport}
            onOpenQuickEstimate={onOpenQuickEstimate || (() => {})}
            onAddExpense={onAddExpense}
            onOpenSwitchJob={onOpenMultiJob}
            jobsCount={jobsList.length}
            currentJobIndex={jobsList.findIndex((j) => j.id === job.id)}
          />
        ) : isSmartHomeService(job.serviceType) ? (
          <SmartHomeWorkspaceView
            job={job}
            vendors={vendors}
            invoices={invoices}
            expenses={expenses}
            onUpdateJob={onUpdateJob}
            onRecordPayment={(jobId, amt) => onRecordPayment(jobId, amt)}
            onAssignVendor={(vendor) => onAssignVendor(vendor)}
            onCompleteJob={onCompleteJob}
            onOpenReport={onOpenReport}
            onOpenQuickEstimate={onOpenQuickEstimate || (() => {})}
            onAddExpense={onAddExpense}
            onOpenSwitchJob={onOpenMultiJob}
            jobsCount={jobsList.length}
            currentJobIndex={jobsList.findIndex((j) => j.id === job.id)}
          />
        ) : isPetAssistanceService(job.serviceType) ? (
          <PetAssistanceWorkspaceView
            job={job}
            vendors={vendors}
            invoices={invoices}
            expenses={expenses}
            onUpdateJob={onUpdateJob}
            onRecordPayment={(jobId, amt) => onRecordPayment(jobId, amt)}
            onAssignVendor={(vendor) => onAssignVendor(vendor)}
            onCompleteJob={onCompleteJob}
            onOpenReport={onOpenReport}
            onOpenQuickEstimate={onOpenQuickEstimate || (() => {})}
            onAddExpense={onAddExpense}
            onOpenSwitchJob={onOpenMultiJob}
            jobsCount={jobsList.length}
            currentJobIndex={jobsList.findIndex((j) => j.id === job.id)}
          />
        ) : isAirportAssistanceService(job.serviceType) ? (
          <AirportAssistanceWorkspaceView
            job={job}
            vendors={vendors}
            invoices={invoices}
            expenses={expenses}
            onUpdateJob={onUpdateJob}
            onRecordPayment={(jobId, amt) => onRecordPayment(jobId, amt)}
            onAssignVendor={(vendor) => onAssignVendor(vendor)}
            onCompleteJob={onCompleteJob}
            onOpenReport={onOpenReport}
            onOpenQuickEstimate={onOpenQuickEstimate || (() => {})}
            onAddExpense={onAddExpense}
            onOpenSwitchJob={onOpenMultiJob}
            jobsCount={jobsList.length}
            currentJobIndex={jobsList.findIndex((j) => j.id === job.id)}
          />
        ) : isGeneralAssistanceService(job.serviceType) ? (
          <GeneralAssistanceWorkspaceView
            job={job}
            vendors={vendors}
            invoices={invoices}
            expenses={expenses}
            onUpdateJob={onUpdateJob}
            onRecordPayment={(jobId, amt) => onRecordPayment(jobId, amt)}
            onAssignVendor={(vendor) => onAssignVendor(vendor)}
            onCompleteJob={onCompleteJob}
            onOpenReport={onOpenReport}
            onOpenQuickEstimate={onOpenQuickEstimate || (() => {})}
            onAddExpense={onAddExpense}
            onOpenSwitchJob={onOpenMultiJob}
            jobsCount={jobsList.length}
            currentJobIndex={jobsList.findIndex((j) => j.id === job.id)}
          />
        ) : (
          <FlexibleJobWorkflowView
            job={job}
            vendors={vendors}
            invoices={invoices}
            expenses={expenses}
            onUpdateJob={onUpdateJob}
            onRecordPayment={(jobId, amt) => onRecordPayment(jobId, amt)}
            onAssignVendor={(vendor) => onAssignVendor(vendor)}
            onCompleteJob={onCompleteJob}
            onOpenReport={onOpenReport}
            onOpenQuickEstimate={onOpenQuickEstimate}
            onOpenFindingModal={onOpenFindingModal}
            onDeleteFinding={onDeleteFinding}
            onAddExpense={onAddExpense}
            onOpenSwitchJob={onOpenMultiJob}
            jobsCount={jobsList.length}
            currentJobIndex={jobsList.findIndex((j) => j.id === job.id)}
          />
        )}

        {/* Safety & Administrative Controls at the Bottom */}
        <div className="mt-8 pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">PTL V2</span>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              v{BUILD_VERSION}
            </span>
            <span>•</span>
            <button
              type="button"
              onClick={onOpenReport}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
            >
              {isTh ? 'รายงาน PDF' : 'PDF Report'}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onOpenQuotation(job.id)}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
            >
              {isTh ? 'ใบเสนอราคา' : 'Quotation'}
            </button>
          </div>

          <button
            id="job-workspace-btn-delete"
            type="button"
            onClick={handleDeleteAttempt}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 font-semibold text-xs transition-colors cursor-pointer"
            title="Delete Job"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isTh ? 'ลบงานนี้' : 'Delete Job'}</span>
          </button>
        </div>
      </main>

      <CustomerResponseModal
        isOpen={isCustomerResponseOpen}
        job={job}
        onClose={() => { setIsCustomerResponseOpen(false); onCustomerResponseClosed?.(); }}
        onApprove={() => onUpdateJob((prev) => ({ ...prev, status: 'Approved', customerApprovedAt: new Date().toISOString(), waitingOn: 'none', waitingReason: undefined, nextFollowUpDate: undefined }))}
        onRequestRevision={(_, notes) => {
          onUpdateJob((prev) => ({ ...prev, status: 'New', quoteSentAt: undefined, repairQuoteSentAt: undefined, waitingOn: 'none', waitingReason: notes }));
          onOpenQuotation(job.id, 'edit');
        }}
        onMarkUndecided={(_, notes, followUpDate) => onUpdateJob((prev) => ({ ...prev, status: 'Waiting Customer', waitingOn: 'customer', waitingReason: notes || (isTh ? 'ลูกค้ายังไม่ตัดสินใจ' : 'Customer is deciding'), nextFollowUpDate: followUpDate }))}
        onDecline={(_, reason) => onUpdateJob((prev) => ({ ...prev, status: 'Cancelled', waitingOn: 'none', waitingReason: reason || (isTh ? 'ลูกค้าไม่ดำเนินการต่อ' : 'Customer declined'), actionRequired: undefined, nextFollowUpDate: undefined }))}
      />

      {/* Compact Appointment Modal */}
      <CompactAppointmentModal
        isOpen={isApptModalOpen}
        job={job}
        onClose={() => setIsApptModalOpen(false)}
        onConfirmAppointment={(jobId) => {
          if (onConfirmAppointment) {
            onConfirmAppointment(jobId);
          } else {
            onUpdateJob((prev) => ({
              ...prev,
              isConfirmed: true,
              appointmentConfirmation: 'Confirmed',
              appointmentConfirmedAt: new Date().toISOString(),
            }));
          }
        }}
        onOpenReschedule={(j) => {
          setIsApptModalOpen(false);
          if (onOpenScheduleModal) {
            onOpenScheduleModal(j);
          }
        }}
      />
    </div>
  );
};
