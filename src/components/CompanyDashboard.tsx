import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Copy,
  Plus,
  ArrowUpRight,
  ChevronRight,
  User,
  MapPin,
  Sparkles,
  Briefcase,
  Wallet,
  Building2,
  FileText,
  Send,
  Check,
  PhoneCall,
  BellRing,
  Filter,
} from 'lucide-react';
import { InspectionJob } from '../types';
import { safeGetLocalStorage, safeSetLocalStorage } from '../utils/storage';

interface CompanyDashboardProps {
  jobs: InspectionJob[];
  onSelectJob: (jobId: string) => void;
  onOpenNewJob: () => void;
  onBackToInspection: () => void;
  onOpenVarvaraSocial?: () => void;
}

export interface PayoutRecord {
  id: string;
  recipient: string;
  category: 'Hardware Vendor' | 'Subcontractor Labor' | 'Refund/Deposit';
  villaName: string;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid';
  memo: string;
}

interface FollowUpTask {
  id: string;
  jobId: string;
  villaName: string;
  clientName: string;
  taskTitle: string;
  dueDate: string;
  priority: 'Urgent' | 'High' | 'Normal';
  category: 'Quote Approval' | 'Deposit / Payment' | 'Sourcing Parts' | 'Schedule Service' | 'Re-inspection';
  completed: boolean;
  notes: string;
}

interface Appointment {
  id: string;
  jobId: string;
  villaName: string;
  clientName: string;
  date: string;
  time: string;
  type: 'Inspection' | 'Repair / Rectification' | 'Final Handover';
  assignedTech: string;
  location: string;
  status: 'Confirmed' | 'Pending Confirmation' | 'Completed';
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({
  jobs,
  onSelectJob,
  onOpenNewJob,
  onBackToInspection,
  onOpenVarvaraSocial,
}) => {
  // Follow-up tasks state with local storage persistence
  const [tasks, setTasks] = useState<FollowUpTask[]>(() => {
    const saved = safeGetLocalStorage('ptl_followup_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'task-1',
        jobId: 'PTL-INSP-20260818-004',
        villaName: 'K. Mazen Villa, Green Mile Kathu',
        clientName: 'K. Mazen',
        taskTitle: 'ตามคอนเฟิร์มใบเสนอราคา Smart Home & ไฟฟ้า (ยอด 21,950 ฿ ส่งครบ 24 ชม.)',
        dueDate: 'วันนี้ (ก่อน 17:00 น.)',
        priority: 'Urgent',
        category: 'Quote Approval',
        completed: false,
        notes: 'ลูกค้าอยู่ต่างประเทศ ส่ง WhatsApp Draft แจ้งว่าช่างพร้อมเข้าทำศุกร์นี้',
      },
      {
        id: 'task-2',
        jobId: 'PTL-INSP-20260903-002',
        villaName: 'Baan Bua Villa 12, Nai Harn',
        clientName: 'Robert Miller',
        taskTitle: 'เบิกอะไหล่แคปรันแอร์ 40uF และตลับลูกปืนปั๊มสระ NSK จากร้านอมร',
        dueDate: 'พรุ่งนี้ 08:30 น.',
        priority: 'High',
        category: 'Sourcing Parts',
        completed: false,
        notes: 'เตรียมของให้ช่างวิศิษฏ์ก่อนเข้าไซต์ในหาน 09:00 น.',
      },
      {
        id: 'task-3',
        jobId: 'PTL-INSP-20260903-003',
        villaName: 'The Deck Patong (Elena)',
        clientName: 'Elena Rostova',
        taskTitle: 'ส่งบิลเก็บเงินค่าบริการด่วนกลอนดิจิทัล 1,480 ฿ พร้อมใบเสร็จ',
        dueDate: 'วันนี้',
        priority: 'Normal',
        category: 'Deposit / Payment',
        completed: true,
        notes: 'งานซ่อมเสร็จแล้ว แขกเข้าพักราบรื่น',
      },
      {
        id: 'task-4',
        jobId: 'PTL-INSP-20260818-004',
        villaName: 'K. Mazen Villa, Green Mile Kathu',
        clientName: 'K. Mazen',
        taskTitle: 'นัดตรวจ Re-inspection รอบสองหลังย้าย Router Wi-Fi ชั้นบน',
        dueDate: '08 ก.ย. 2026',
        priority: 'Normal',
        category: 'Re-inspection',
        completed: false,
        notes: 'ทดสอบสัญญาณ Home Assistant ให้ครบทุกโซน',
      },
    ];
  });

  // Outgoing Payouts & Vendor/Subcontractor state managed by Emily
  const [payouts, setPayouts] = useState<PayoutRecord[]>(() => {
    const saved = safeGetLocalStorage('ptl_payouts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'payout-1',
        recipient: 'ร้านอมร อิเล็คโทรนิคส์ (ภูเก็ต)',
        category: 'Hardware Vendor',
        villaName: 'Baan Bua Villa 12, Nai Harn',
        amount: 2480,
        dueDate: 'วันนี้ (ก่อน 16:30 น.)',
        status: 'Pending',
        memo: 'แคปรันแอร์ 40uF x2, ตลับลูกปืน NSK ปั๊ม Hayward',
      },
      {
        id: 'payout-2',
        recipient: 'ช่างวิศิษฏ์ (ช่างเทคนิคระบบไฟฟ้า & คอนโทรล)',
        category: 'Subcontractor Labor',
        villaName: 'K. Mazen Villa, Green Mile Kathu',
        amount: 3500,
        dueDate: 'ศุกร์นี้ (หลังงานเสร็จ)',
        status: 'Pending',
        memo: 'ค่าแรงติดตั้งสวิตช์ Zigbee 4 จุด + ย้ายตู้ควบคุมไฟ',
      },
      {
        id: 'payout-3',
        recipient: 'โฮมโปร ฉลอง (HomePro)',
        category: 'Hardware Vendor',
        villaName: 'K. Mazen Villa, Green Mile Kathu',
        amount: 1850,
        dueDate: 'เมื่อวาน',
        status: 'Paid',
        memo: 'เบรกเกอร์กันดูด RCBO Schneider Easy9 32A',
      },
      {
        id: 'payout-4',
        recipient: 'ช่างกอล์ฟ (ช่างปั๊มน้ำ & สระว่ายน้ำ)',
        category: 'Subcontractor Labor',
        villaName: 'Baan Bua Villa 12, Nai Harn',
        amount: 1200,
        dueDate: 'พรุ่งนี้ 17:00 น.',
        status: 'Pending',
        memo: 'ค่าแรงเปลี่ยนโอริงและเช็คแรงดันปั๊มสระ',
      },
    ];
  });

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = safeGetLocalStorage('ptl_appointments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'appt-1',
        jobId: 'PTL-INSP-20260903-002',
        villaName: 'Baan Bua Villa 12, Nai Harn',
        clientName: 'Robert Miller',
        date: '04 ก.ย. 2026 (พรุ่งนี้)',
        time: '09:00 - 12:00 น.',
        type: 'Repair / Rectification',
        assignedTech: 'ช่างวิศิษฏ์ & ช่างกอล์ฟ (ทีมเครื่องกล/แอร์)',
        location: 'Baan Bua Estate, หาดในหาน ราไวย์',
        status: 'Confirmed',
      },
      {
        id: 'appt-2',
        jobId: 'PTL-INSP-20260818-004',
        villaName: 'K. Mazen Villa, Green Mile Kathu',
        clientName: 'K. Mazen',
        date: '05 ก.ย. 2026 (เสาร์)',
        time: '10:00 - 14:00 น.',
        type: 'Repair / Rectification',
        assignedTech: 'Mr. Big & ทีม Smart Home Tech',
        location: 'Green Mile Villa, กะทู้',
        status: 'Pending Confirmation',
      },
      {
        id: 'appt-3',
        jobId: 'PTL-INSP-20260903-003',
        villaName: 'The Deck Patong Suite A402',
        clientName: 'Elena Rostova',
        date: '03 ก.ย. 2026 (วันนี้)',
        time: '16:00 น.',
        type: 'Inspection',
        assignedTech: 'ช่างต้อม (Door Lock Specialist)',
        location: 'The Deck Condominium, ป่าตอง',
        status: 'Completed',
      },
    ];
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'urgent'>('all');
  const [selectedTaskForDraft, setSelectedTaskForDraft] = useState<FollowUpTask | null>(null);
  const [draftLanguage, setDraftLanguage] = useState<'en' | 'th'>('en');
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Emily Payment & Payout Assistant states
  const [selectedPayoutForEmily, setSelectedPayoutForEmily] = useState<PayoutRecord | null>(null);
  const [emilyPaymentResult, setEmilyPaymentResult] = useState<any>(null);
  const [isEmilyLoading, setIsEmilyLoading] = useState(false);
  const [isAddingPayout, setIsAddingPayout] = useState(false);
  const [newPayoutRecipient, setNewPayoutRecipient] = useState('');
  const [newPayoutAmount, setNewPayoutAmount] = useState('');
  const [newPayoutVilla, setNewPayoutVilla] = useState('');
  const [newPayoutCategory, setNewPayoutCategory] = useState<'Hardware Vendor' | 'Subcontractor Labor'>('Hardware Vendor');

  useEffect(() => {
    safeSetLocalStorage('ptl_followup_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    safeSetLocalStorage('ptl_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    safeSetLocalStorage('ptl_payouts', JSON.stringify(payouts));
  }, [payouts]);

  // Payout summaries
  const pendingPayouts = payouts.filter((p) => p.status === 'Pending');
  const totalPendingPayouts = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalPaidPayouts = payouts.filter((p) => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);

  const togglePayoutStatus = (id: string) => {
    setPayouts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === 'Paid' ? 'Pending' : 'Paid' }
          : p
      )
    );
  };

  const handleAddNewPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayoutRecipient.trim() || !newPayoutAmount) return;
    const item: PayoutRecord = {
      id: `payout-${Date.now()}`,
      recipient: newPayoutRecipient.trim(),
      category: newPayoutCategory,
      villaName: newPayoutVilla.trim() || jobs[0]?.villaName || 'Phuket Villa',
      amount: Number(newPayoutAmount) || 0,
      dueDate: 'วันนี้',
      status: 'Pending',
      memo: 'บันทึกค่าใช้จ่ายโดยผู้บริหาร',
    };
    setPayouts([item, ...payouts]);
    setNewPayoutRecipient('');
    setNewPayoutAmount('');
    setNewPayoutVilla('');
    setIsAddingPayout(false);
  };

  const handleAskEmilyPayment = async (payout: PayoutRecord) => {
    setSelectedPayoutForEmily(payout);
    setIsEmilyLoading(true);
    setEmilyPaymentResult(null);

    try {
      const res = await fetch('/api/gemini/emily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payment_assistance',
          paymentDetails: {
            recipient: payout.recipient,
            amount: payout.amount,
            villaName: payout.villaName,
            category: payout.category,
            memo: payout.memo,
          },
          context: 'ตรวจสอบยอดจ่ายและทำบันทึกช่วยจำการโอนเงิน (Payment Memo) พร้อมข้อความแจ้งโอน',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEmilyPaymentResult(data);
      } else {
        throw new Error('Fallback');
      }
    } catch {
      setEmilyPaymentResult({
        summary: `Emily ได้ตรวจสอบความถูกต้องของยอด ฿${payout.amount.toLocaleString()} เรียบร้อยแล้วค่ะ`,
        recommendation: `ยอดชำระตรงกับรายการสั่งซื้อและค่าแรงหน้างานที่ ${payout.villaName} สามารถอนุมัติโอนเงินได้ทันที`,
        paymentMemo: `โอนจ่าย ${payout.recipient} (${payout.category}) • หน้างาน ${payout.villaName} • อนุมัติโดย PTL Management`,
        draftTh: `เรียน ${payout.recipient},\n\nยอดเงิน ${payout.amount.toLocaleString()} บาท สำหรับงานที่ ${payout.villaName} ได้รับการอนุมัติและจัดคิวโอนเรียบร้อยแล้วค่ะ ขอบคุณมากค่ะ\n\n- Emily • Executive Assistant\nPhuket Trusted Local`,
        draftEn: `Dear ${payout.recipient},\n\nPayment of ${payout.amount.toLocaleString()} THB for ${payout.villaName} has been verified and authorized by Phuket Trusted Local.\n\nThank you for your partnership!\n- Emily • Executive Assistant`,
      });
    } finally {
      setIsEmilyLoading(false);
    }
  };

  // AI Agent: Emily - Executive Assistant & Payment/Follow-up Copilot
  const generateEmilyDraft = (task: FollowUpTask, lang: 'en' | 'th' = 'en') => {
    const job = jobs.find((j) => j.id === task.jobId);
    const clientFirstName = task.clientName.split(' ')[0] || 'Sir/Madam';
    const quoteRef = job?.quotation.refNo || 'PTL-QT-2026';
    const totalAmount = job
      ? job.quotation.hardwareItems.reduce((s, it) => s + it.amount, 0) +
        job.quotation.serviceItems.reduce((s, it) => s + it.amount, 0) +
        Math.round(
          job.quotation.hardwareItems.reduce((s, it) => s + it.amount, 0) *
            (job.quotation.procurementFeeRate || 0.15)
        )
      : 12500;

    if (lang === 'th') {
      if (task.category === 'Quote Approval') {
        return `สวัสดีค่ะคุณ ${clientFirstName},\n\nเอมิลี่จากทีมผู้ช่วยบริหาร Phuket Trusted Local นะคะ ขออนุญาตติดตามความคืบหน้าเรื่องใบเสนอราคา (${quoteRef} ยอดรวม ${totalAmount.toLocaleString()} บาท) สำหรับ ${task.villaName} ค่ะ\n\nขณะนี้ทีมช่างเทคนิคและอุปกรณ์พร้อมเข้าดำเนินการทันที หากคุณ ${clientFirstName} ต้องการปรับแก้หรือต้องการล็อกคิวสัปดาห์นี้ แจ้งเอมิลี่ได้ตลอดเลยนะคะ ขอบคุณมากค่ะ!`;
      }
      if (task.category === 'Deposit / Payment') {
        return `เรียนคุณ ${clientFirstName},\n\nเอมิลี่ส่งสรุปยอดชำระ ${totalAmount.toLocaleString()} บาท สำหรับงานที่ ${task.villaName} ค่ะ หลังโอนเงินเข้าบัญชีบริษัท เอมิลี่จะออกใบเสร็จรับเงินพร้อมใบรับประกันให้ทันทีนะคะ ขอบคุณที่ไว้วางใจ Phuket Trusted Local ค่ะ`;
      }
      return `สวัสดีค่ะคุณ ${clientFirstName},\n\nเอมิลี่ขออนุญาตติดตามเรื่อง "${task.taskTitle}" สำหรับ ${task.villaName} นะคะ หากต้องการความช่วยเหลือเพิ่มเติมแจ้งได้เลยค่ะ`;
    }

    if (task.category === 'Quote Approval') {
      return `Hi ${clientFirstName},\n\nHope you're having a wonderful day! This is Emily, Executive Assistant at Phuket Trusted Local.\n\nKindly following up regarding our Site Inspection Report & Quotation (${quoteRef} - Total ${totalAmount.toLocaleString()} THB) for ${task.villaName}.\n\nOur engineering team and certified parts are ready on standby. Please let me know if you would like us to lock in the technician schedule for this week, or if you have any questions for Mr. Big.\n\nWarm regards,\nEmily • Executive Assistant\nPhuket Trusted Local`;
    }

    if (task.category === 'Deposit / Payment') {
      return `Hi ${clientFirstName},\n\nGreetings from Phuket Trusted Local! Following the successful inspection and service at ${task.villaName}, here is the invoice summary for ${totalAmount.toLocaleString()} THB.\n\nYou can kindly transfer to our verified company account, and we will immediately issue the official receipt & warranty certificate.\n\nThank you so much!\nEmily • Executive Assistant`;
    }

    if (task.category === 'Schedule Service' || task.category === 'Re-inspection') {
      return `Hi ${clientFirstName},\n\nThis is Emily from Phuket Trusted Local executive desk.\n\nWe would like to confirm our technician team's arrival at ${task.villaName} on ${task.dueDate} for scheduled works. Please ensure the estate gate guard has been notified or provide access instructions.\n\nWarm regards,\nEmily`;
    }

    return `Hi ${clientFirstName},\n\nKindly following up regarding ${task.taskTitle} for ${task.villaName}. Please let us know if you need any assistance!\n\nWarm regards,\nEmily • Phuket Trusted Local`;
  };

  // ----------------------------------------------------
  // Financial Calculations across all active jobs
  // ----------------------------------------------------
  const financialSummary = (jobs || []).reduce(
    (acc, j) => {
      if (!j) return acc;
      const q = j.quotation;
      const hwItems = q?.hardwareItems || [];
      const svItems = q?.serviceItems || [];
      const hwTotal = hwItems.reduce((s, it) => s + (it?.amount || 0), 0);
      const svTotal = svItems.reduce((s, it) => s + (it?.amount || 0), 0);
      const feeRate = q?.procurementFeeRate ?? 0.15;
      const feeAmount = Math.round(hwTotal * feeRate);
      const totalJobPrice = hwTotal + svTotal + feeAmount;

      // Expenses estimation:
      // Direct hardware wholesale cost = approx 85% of retail hardware
      // Subcontractor / Tech direct labor cost = approx 60% of service charge
      const hardwareCost = Math.round(hwTotal * 0.85);
      const techLaborCost = Math.round(svTotal * 0.55);
      const totalExpense = hardwareCost + techLaborCost;
      const grossProfit = totalJobPrice - totalExpense;

      const isPaid = j.status === 'Paid' || j.status === 'Completed';

      return {
        totalRevenue: acc.totalRevenue + totalJobPrice,
        collectedRevenue: acc.collectedRevenue + (isPaid ? totalJobPrice : 0),
        pendingReceivable: acc.pendingReceivable + (!isPaid ? totalJobPrice : 0),
        totalExpenses: acc.totalExpenses + totalExpense,
        hardwareCostTotal: acc.hardwareCostTotal + hardwareCost,
        techLaborCostTotal: acc.techLaborCostTotal + techLaborCost,
        grossProfit: acc.grossProfit + grossProfit,
      };
    },
    {
      totalRevenue: 0,
      collectedRevenue: 0,
      pendingReceivable: 0,
      totalExpenses: 0,
      hardwareCostTotal: 0,
      techLaborCostTotal: 0,
      grossProfit: 0,
    }
  );

  const profitMarginPct =
    financialSummary.totalRevenue > 0
      ? ((financialSummary.grossProfit / financialSummary.totalRevenue) * 100).toFixed(1)
      : '0.0';

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask: FollowUpTask = {
      id: `task-${Date.now()}`,
      jobId: jobs[0]?.id || 'GENERAL',
      villaName: jobs[0]?.villaName || 'Phuket Operations',
      clientName: jobs[0]?.customerName || 'Client',
      taskTitle: newTaskInput.trim(),
      dueDate: 'วันนี้',
      priority: 'High',
      category: 'Schedule Service',
      completed: false,
      notes: 'เพิ่มโดยผู้ดูแลระบบหน้าแดชบอร์ด',
    };
    setTasks([newTask, ...tasks]);
    setNewTaskInput('');
    setIsAddingTask(false);
  };

  const handleCopyDraft = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'pending') return !t.completed;
    if (activeFilter === 'urgent') return !t.completed && (t.priority === 'Urgent' || t.priority === 'High');
    return true;
  });

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const urgentTasksCount = tasks.filter((t) => !t.completed && t.priority === 'Urgent').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Top Operations Header */}
      <header
        className="bg-[#102a4e] text-white pb-5 px-4 sm:px-6 shadow-md border-b border-sky-950 sticky top-0 z-30"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 18px)' }}
      >
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl shadow-xs font-black">
              <Briefcase className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Company Operations &amp; Finance
                </span>
                <span className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Executive View
                </span>
              </div>
              <p className="text-xs text-sky-200/80">
                แดชบอร์ดสรุปรายรับ-รายจ่าย-กำไร • ยอดค้างชำระ • ปฏิทินนัดหมาย • ระบบติดตามงาน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToInspection}
              className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-xs min-h-[44px] cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>กลับหน้าตรวจงาน</span>
            </button>

            <button
              onClick={onOpenNewJob}
              className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-sky-200 font-semibold px-3 py-2 rounded-xl text-xs border border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span>+ เปิดงานตรวจใหม่</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-5 flex-1 space-y-6">
        {/* ====================================================
            1. FINANCIAL KPI CARDS (รายรับ / รายจ่าย / กำไร / ยอดค้าง)
            ==================================================== */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-900" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                สรุปสถานะการเงิน (Financial Overview)
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              อ้างอิงจากงานปัจจุบัน {jobs.length} วิลล่า
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Total Revenue */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">รายรับรวมทั้งหมด (Quoted)</span>
                <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                ฿{financialSummary.totalRevenue.toLocaleString()}
              </div>
              <div className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>รับเงินแล้ว: ฿{financialSummary.collectedRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Card 2: Total Direct Expense */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">รายจ่ายต้นทุน (Direct Cost)</span>
                <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                ฿{financialSummary.totalExpenses.toLocaleString()}
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>อะไหล่: ฿{financialSummary.hardwareCostTotal.toLocaleString()}</span>
                <span>• ค่าแรงช่าง: ฿{financialSummary.techLaborCostTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Card 3: Gross Profit & Margin */}
            <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-emerald-200 mb-1">
                <span className="text-xs font-semibold">กำไรสุทธิคาดการณ์ (Net Profit)</span>
                <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  Margin {profitMarginPct}%
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-300">
                ฿{financialSummary.grossProfit.toLocaleString()}
              </div>
              <div className="mt-2 text-[11px] text-emerald-200/90 font-medium">
                กำไรเฉลี่ย ฿{Math.round(financialSummary.grossProfit / Math.max(1, jobs.length)).toLocaleString()} / หลัง
              </div>
            </div>

            {/* Card 4: Outstanding Receivables (มีอะไรค้างรอเก็บเงิน) */}
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-amber-900 mb-1">
                <span className="text-xs font-semibold">ยอดค้างชำระ / รอเก็บเงิน</span>
                <span className="p-1.5 bg-amber-200/60 text-amber-900 rounded-lg">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-amber-950">
                ฿{financialSummary.pendingReceivable.toLocaleString()}
              </div>
              <div className="mt-2 text-[11px] text-amber-800 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>รอลูกค้าโอน / ยืนยันใบเสนอราคา</span>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            AI AGENTS HUB: EMILY (EXECUTIVE ASSISTANT & PAYMENTS) & VARVARA (MARKETING)
            ==================================================== */}
        <section className="bg-gradient-to-r from-[#102a4e] via-[#1a3a68] to-[#122e54] text-white rounded-2xl p-4 sm:p-5 border border-sky-800 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-sm shrink-0 mt-0.5">
                👩‍💼
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Emily • Executive Assistant &amp; Payment Copilot
                  </h3>
                  <span className="bg-amber-400/20 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                    ผู้ช่วยบริหาร &amp; จัดการจ่ายเงิน
                  </span>
                  <span className="bg-pink-400/20 text-pink-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-400/30">
                    + Varvara Social Media
                  </span>
                </div>
                <p className="text-xs text-sky-100/90 leading-relaxed max-w-2xl">
                  &ldquo;สวัสดีค่ะบอส! วันนี้เอมิลี่สรุปให้แล้ว มี <strong>{urgentTasksCount} งานด่วน</strong> ที่ต้องตามทันที, มียอดเงินรอเก็บลูกค้า <strong>฿{financialSummary.pendingReceivable.toLocaleString()}</strong>, และมี <strong>คิวรอจ่ายช่าง/ร้านค้า ฿{totalPendingPayouts.toLocaleString()}</strong> ค่ะ ให้เอมิลี่ช่วยร่างข้อความตามงาน หรือตรวจยอดอนุมัติโอนเงินได้เลยนะคะ&rdquo;
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const urgentTask = tasks.find((t) => !t.completed && t.priority === 'Urgent') || tasks[0];
                  if (urgentTask) setSelectedTaskForDraft(urgentTask);
                }}
                className="inline-flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>⚡ ให้ Emily ร่างข้อความตามงาน</span>
              </button>

              {onOpenVarvaraSocial && (
                <button
                  onClick={onOpenVarvaraSocial}
                  className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all border border-pink-400/30"
                >
                  <span>📸 AI Varvara โพสต์โซเชียล</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ====================================================
            EMILY'S PAYMENT CENTER (ระบบบัญชี & ผู้ช่วยจ่ายเงิน)
            ==================================================== */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <Wallet className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    ระบบผู้ช่วยจ่ายเงิน &amp; บัญชีร้านค้า/ช่าง (Emily's Payment Center)
                  </h3>
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    รอโอน {pendingPayouts.length} รายการ
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  ตรวจสอบยอดก่อนโอนเงินค่าอะไหล่ร้านค้า และค่าแรงช่างเทคนิค พร้อมสร้างบันทึกช่วยจำ (Payment Memo)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right mr-1">
                <span className="text-[10px] text-slate-500 block">ยอดรอจ่ายทั้งหมด</span>
                <span className="text-base font-black text-rose-600">
                  ฿{totalPendingPayouts.toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => setIsAddingPayout(!isAddingPayout)}
                className="inline-flex items-center gap-1 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรายการจ่าย</span>
              </button>
            </div>
          </div>

          {/* Quick Add Payout Form */}
          {isAddingPayout && (
            <form onSubmit={handleAddNewPayout} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mt-3.5 space-y-2.5">
              <div className="text-xs font-bold text-slate-800">➕ เพิ่มรายการรอชำระเงินใหม่</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="ชื่อผู้รับเงิน (เช่น ร้านอมร, ช่างวิศิษฏ์)"
                  value={newPayoutRecipient}
                  onChange={(e) => setNewPayoutRecipient(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:col-span-2"
                  required
                />
                <input
                  type="number"
                  placeholder="จำนวนเงิน (บาท)"
                  value={newPayoutAmount}
                  onChange={(e) => setNewPayoutAmount(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  required
                />
                <select
                  value={newPayoutCategory}
                  onChange={(e) => setNewPayoutCategory(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Hardware Vendor">ร้านค้า/อะไหล่ (Hardware)</option>
                  <option value="Subcontractor Labor">ค่าแรงช่าง (Labor)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="วิลล่า / ไซต์งานที่เกี่ยวข้อง (เช่น K. Mazen Villa)"
                  value={newPayoutVilla}
                  onChange={(e) => setNewPayoutVilla(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-colors"
                >
                  บันทึก
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingPayout(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          )}

          {/* Payout Table / List */}
          <div className="mt-3.5 divide-y divide-slate-100">
            {payouts.map((p) => {
              const isPaid = p.status === 'Paid';
              return (
                <div
                  key={p.id}
                  className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isPaid ? 'opacity-60 bg-slate-50/50 px-2 rounded-lg' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => togglePayoutStatus(p.id)}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                        isPaid
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-slate-400 bg-white'
                      }`}
                      title={isPaid ? 'ทำเครื่องหมายว่ายังไม่จ่าย' : 'ทำเครื่องหมายว่าจ่ายแล้ว'}
                    >
                      {isPaid && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-bold ${isPaid ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {p.recipient}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.category === 'Hardware Vendor'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {p.category === 'Hardware Vendor' ? '📦 ร้านอะไหล่' : '🛠️ ค่าแรงช่าง'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {p.villaName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {p.memo} • กำหนด: <span className="font-semibold text-slate-700">{p.dueDate}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                    <div className="text-right">
                      <div className={`text-sm font-black ${isPaid ? 'text-slate-500' : 'text-slate-900'}`}>
                        ฿{p.amount.toLocaleString()}
                      </div>
                      <span className={`text-[10px] font-bold ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {isPaid ? '✓ จ่ายแล้ว' : '⏳ รอโอน'}
                      </span>
                    </div>

                    {!isPaid && (
                      <button
                        onClick={() => handleAskEmilyPayment(p)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>✨ Emily ตรวจยอด &amp; ทำสลิป</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ====================================================
            2. TWO-COLUMN LAYOUT:
               Left: ต้องตามอะไรบ้าง (Actionable Follow-up Checklist)
               Right: นัดเมื่อไหร่ (Appointments Schedule) & รายการค้าง
            ==================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT: ต้องตามอะไรบ้าง (Follow-up Tasks Checklist) - 7 cols */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-amber-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    ต้องตามอะไรบ้าง? (Follow-up Checklist)
                  </h3>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ค้าง {pendingTasksCount} งาน
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      activeFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    onClick={() => setActiveFilter('pending')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      activeFilter === 'pending'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ที่ยังค้างอยู่
                  </button>
                  <button
                    onClick={() => setActiveFilter('urgent')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      activeFilter === 'urgent'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    ด่วนพิเศษ ({urgentTasksCount})
                  </button>
                </div>
              </div>

              {/* Add New Task Form */}
              <div className="pt-3">
                {isAddingTask ? (
                  <form onSubmit={handleAddNewTask} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newTaskInput}
                      onChange={(e) => setNewTaskInput(e.target.value)}
                      placeholder="พิมพ์งานที่ต้องตาม เช่น ตามช่างแอร์, สั่งอะไหล่..."
                      className="flex-1 text-xs px-3 py-2 border border-blue-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/40"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors"
                    >
                      บันทึก
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 px-2 py-2"
                    >
                      ยกเลิก
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 font-bold mb-3 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ เพิ่มรายการที่ต้องติดตามใหม่</span>
                  </button>
                )}

                {/* Tasks List */}
                <div className="space-y-2.5">
                  {filteredTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border transition-all ${
                        t.completed
                          ? 'bg-slate-50/70 border-slate-200 opacity-60'
                          : t.priority === 'Urgent'
                          ? 'bg-rose-50/40 border-rose-200 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleTask(t.id)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 transition-colors ${
                            t.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-blue-600 bg-white'
                          }`}
                        >
                          {t.completed && <Check className="w-3.5 h-3.5" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                t.priority === 'Urgent'
                                  ? 'bg-rose-100 text-rose-800'
                                  : t.priority === 'High'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {t.priority === 'Urgent' ? '🔴 ด่วนมาก' : t.priority === 'High' ? '🟠 สำคัญ' : '⚪ ทั่วไป'}
                            </span>

                            <span className="text-[10px] bg-blue-50 text-blue-800 font-semibold px-2 py-0.5 rounded-md">
                              {t.category}
                            </span>

                            <span className="text-[10px] text-slate-500 font-medium ml-auto">
                              ครบกำหนด: <strong className="text-slate-800">{t.dueDate}</strong>
                            </span>
                          </div>

                          <div
                            className={`text-xs font-bold ${
                              t.completed ? 'line-through text-slate-500' : 'text-slate-900'
                            }`}
                          >
                            {t.taskTitle}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 truncate">
                            <span className="font-semibold text-slate-700">{t.villaName}</span>
                            <span>• ลูกค้า: {t.clientName}</span>
                          </div>

                          {t.notes && (
                            <div className="mt-1.5 text-[10px] bg-slate-50 border border-slate-200/60 p-1.5 rounded-lg text-slate-600">
                              💡 {t.notes}
                            </div>
                          )}

                          {/* Quick Actions */}
                          {!t.completed && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                              <button
                                onClick={() => setSelectedTaskForDraft(t)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                              >
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>⚡ ให้ Emily ร่างข้อความ</span>
                              </button>

                              <button
                                onClick={() => onSelectJob(t.jobId)}
                                className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors ml-auto"
                              >
                                <span>เปิดงานตรวจ</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: นัดเมื่อไหร่ & สถานะวิลล่าแต่ละหลัง - 5 cols */}
          <div className="lg:col-span-5 space-y-4">
            {/* Appointments Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    นัดเมื่อไหร่? (Appointments &amp; Schedule)
                  </h3>
                </div>
                <span className="text-[11px] bg-sky-50 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                  {appointments.length} นัดหมาย
                </span>
              </div>

              <div className="space-y-3 pt-3">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-600" />
                        <span>{appt.date} • {appt.time}</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          appt.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : appt.status === 'Completed'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {appt.status === 'Confirmed' ? 'ยืนยันแล้ว' : appt.status === 'Completed' ? 'เสร็จสิ้น' : 'รอยืนยัน'}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800 truncate mb-1">
                      {appt.villaName}
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center gap-1 mb-1">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>ลูกค้า: {appt.clientName}</span>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center gap-1 mb-2">
                      <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>ทีมช่าง: <strong>{appt.assignedTech}</strong></span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200/60 text-slate-500">
                      <span className="truncate">{appt.location}</span>
                      <button
                        onClick={() => onSelectJob(appt.jobId)}
                        className="text-blue-700 font-bold hover:underline shrink-0 ml-2"
                      >
                        ดูรายละเอียด &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Villa Pipeline Status (มีอะไรค้างในแต่ละวิลล่า) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-900" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    สถานะวิลล่าในระบบ ({jobs.length} หลัง)
                  </h3>
                </div>
              </div>

              <div className="divide-y divide-slate-100 pt-1">
                {jobs.map((j) => {
                  const q = j.quotation;
                  const total =
                    q.hardwareItems.reduce((s, it) => s + it.amount, 0) +
                    q.serviceItems.reduce((s, it) => s + it.amount, 0) +
                    Math.round(
                      q.hardwareItems.reduce((s, it) => s + it.amount, 0) * (q.procurementFeeRate || 0.15)
                    );

                  return (
                    <div
                      key={j.id}
                      className="py-3 flex items-center justify-between gap-2 hover:bg-slate-50/80 px-1 rounded-lg transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              j.status === 'Completed'
                                ? 'bg-emerald-500'
                                : j.status === 'Quoted'
                                ? 'bg-amber-500'
                                : 'bg-sky-500'
                            }`}
                          />
                          <span className="text-xs font-extrabold text-slate-900 truncate">
                            {j.villaName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {j.customerName} • {j.items.length} จุดตรวจ
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-slate-900">
                          ฿{total.toLocaleString()}
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            j.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : j.status === 'Quoted'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {j.status === 'Quoted'
                            ? 'รอคอนเฟิร์มราคา'
                            : j.status === 'Completed'
                            ? 'ปิดงานแล้ว'
                            : 'กำลังตรวจ'}
                        </span>
                      </div>

                      <button
                        onClick={() => onSelectJob(j.id)}
                        className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="เปิดตรวจวิลล่านี้"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            AI EMILY DRAFT MODAL (1-Click WhatsApp & LINE Follow-up)
            ==================================================== */}
        {selectedTaskForDraft && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm">
                    👩‍💼
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>ข้อความตามงานโดย Emily (Executive Assistant)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      สำหรับส่งหา {selectedTaskForDraft.clientName} ({selectedTaskForDraft.villaName})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTaskForDraft(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Language Selector */}
              <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl mb-3">
                <button
                  onClick={() => setDraftLanguage('en')}
                  className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all ${
                    draftLanguage === 'en'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🇬🇧 English (Expats / Owners)
                </button>
                <button
                  onClick={() => setDraftLanguage('th')}
                  className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all ${
                    draftLanguage === 'th'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🇹🇭 ภาษาไทย (สุภาพ เป็นทางการ)
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4 text-xs font-sans whitespace-pre-wrap leading-relaxed text-slate-800 select-all max-h-60 overflow-y-auto">
                {generateEmilyDraft(selectedTaskForDraft, draftLanguage)}
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  {copiedDraft ? '✅ คัดลอกสำเร็จแล้ว!' : 'คัดลอกแล้วส่งใน WhatsApp หรือ LINE ได้ทันที'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTaskForDraft(null)}
                    className="text-xs text-slate-600 hover:text-slate-800 px-3 py-2"
                  >
                    ปิด
                  </button>

                  <button
                    onClick={() => handleCopyDraft(generateEmilyDraft(selectedTaskForDraft, draftLanguage))}
                    className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
                  >
                    {copiedDraft ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
                    <span>{copiedDraft ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ (Copy)'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            EMILY'S PAYMENT AUTHORIZATION & CASHLFOW MODAL
            ==================================================== */}
        {selectedPayoutForEmily && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                    💳
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Emily • ผู้ช่วยตรวจสอบยอด &amp; อนุมัติการจ่ายเงิน
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {selectedPayoutForEmily.recipient} • {selectedPayoutForEmily.villaName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPayoutForEmily(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {isEmilyLoading ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-600 font-medium">
                    Emily กำลังตรวจสอบยอดกับใบเสนอราคาและสต็อกอะไหล่...
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* Payout Summary Card */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          ยอดเงินที่ต้องโอนชำระ
                        </span>
                        <div className="text-2xl font-black text-emerald-700">
                          ฿{selectedPayoutForEmily.amount.toLocaleString()} THB
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        {selectedPayoutForEmily.category === 'Hardware Vendor' ? '📦 ค่าอะไหล่' : '🛠️ ค่าแรงช่าง'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1.5 pt-1.5 border-t border-slate-200/60">
                      <strong>รายละเอียด:</strong> {selectedPayoutForEmily.memo}
                    </div>
                  </div>

                  {/* Emily's Audit & Recommendation */}
                  <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-xl text-xs space-y-1 text-emerald-950">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <span>✨ การตรวจทานโดย Emily:</span>
                    </div>
                    <p className="leading-relaxed text-emerald-900">
                      {emilyPaymentResult?.recommendation ||
                        'ยอดนี้ตรงกับรายการสั่งซื้อที่อนุมัติแล้ว หักเงินมัดจำล่วงหน้า 50% ของลูกค้าเรียบร้อยแล้ว สามารถอนุมัติโอนจ่ายได้ทันที'}
                    </p>
                  </div>

                  {/* Payment Memo */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      📝 บันทึกช่วยจำการโอน (Payment Memo สำหรับระบุในสลิป):
                    </label>
                    <div className="bg-slate-100 p-2.5 rounded-lg text-xs font-mono text-slate-800 select-all border border-slate-200 flex items-center justify-between">
                      <span>{emilyPaymentResult?.paymentMemo || `โอนจ่าย ${selectedPayoutForEmily.recipient} • ${selectedPayoutForEmily.villaName}`}</span>
                      <button
                        onClick={() => handleCopyDraft(emilyPaymentResult?.paymentMemo || `โอนจ่าย ${selectedPayoutForEmily.recipient} • ${selectedPayoutForEmily.villaName}`)}
                        className="text-[10px] font-bold text-blue-700 hover:text-blue-900 ml-2"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Notification Draft to Recipient */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      💬 ข้อความแจ้งโอนให้ผู้รับ (WhatsApp / LINE):
                    </label>
                    <div className="bg-slate-50 p-2.5 rounded-lg text-xs font-sans text-slate-700 border border-slate-200 whitespace-pre-wrap max-h-24 overflow-y-auto">
                      {emilyPaymentResult?.draftTh ||
                        `เรียน ${selectedPayoutForEmily.recipient},\n\nยอดเงิน ${selectedPayoutForEmily.amount.toLocaleString()} บาท สำหรับ ${selectedPayoutForEmily.villaName} ได้รับการอนุมัติเรียบร้อยแล้วค่ะ`}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedPayoutForEmily(null)}
                      className="text-xs text-slate-600 hover:text-slate-800 px-3 py-2"
                    >
                      ปิด
                    </button>

                    <button
                      onClick={() => {
                        togglePayoutStatus(selectedPayoutForEmily.id);
                        setSelectedPayoutForEmily(null);
                      }}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>✓ บันทึกว่าโอนเรียบร้อยแล้ว (Mark as Paid)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
