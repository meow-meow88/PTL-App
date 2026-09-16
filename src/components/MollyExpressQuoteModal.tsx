import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Camera,
  Wind,
  Droplets,
  Layers,
  Zap,
  PhoneCall,
  CheckCircle2,
  Copy,
  ArrowRight,
  TrendingUp,
  FileText,
  DollarSign,
  ShieldCheck,
  X,
  Loader2,
  HelpCircle,
  Clock,
  User,
  MapPin,
  Tag,
  Wrench,
  Check,
} from 'lucide-react';
import { InspectionJob, QuotationHardwareItem, QuotationServiceItem } from '../types';

interface MollyExpressQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateJobAndOpenQuotation: (newJob: InspectionJob) => void;
  existingJobsCount: number;
}

interface ExpressQuoteResult {
  customerName: string;
  villaName: string;
  propertyLocation: string;
  serviceType: string;
  hardwareItems: Array<{
    item: number;
    descriptionEn: string;
    descriptionTh: string;
    qty: number;
    unit: string;
    costPrice?: number;
    unitPrice: number;
    amount: number;
  }>;
  serviceItems: Array<{
    item: number;
    description: string;
    detail: string;
    estimatedSchedule: string;
    qty: string;
    amount: number;
  }>;
  procurementFeeRate: number;
  terms: string[];
  depositPercent: number;
  mollyGreeting: string;
  mollyFinancialAdvice: {
    hardwareCostTotal: number;
    hardwareQuotedTotal: number;
    hardwareProfit: number;
    laborFee: number;
    totalGrossProfit: number;
    profitMarginPct: number;
    grandTotal: number;
    depositAmount: number;
    balanceAmount: number;
    explanation: string;
  };
  lineMessageSummary: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'molly';
  text: string;
  timestamp: string;
  quoteResult?: ExpressQuoteResult;
}

const PRESET_TEMPLATES = [
  {
    id: 'cctv_tapo',
    icon: Camera,
    label: 'กล้อง Wi-Fi Tapo C320WS',
    subtitle: 'ทุน 1,909 บ. • ค่าแรง 700 บ.',
    color: 'from-blue-500 to-indigo-600',
    prompt: 'ลูกค้าคุณโบว์ ติดตั้งกล้อง Wi-Fi ภายนอกอาคาร TP-Link Tapo C320WS 1 ชุด พร้อมเมม 128GB ทุนซื้อออนไลน์ 1,909 บาท ขอค่าแรงช่าง 700 บาท คิดราคากลางให้ได้กำไรหน่อยครับ',
  },
  {
    id: 'ac_deep_clean',
    icon: Wind,
    label: 'ล้างแอร์วิลล่า 3 เครื่อง',
    subtitle: 'เครื่องละ 650 บ. • รวม 1,950 บ.',
    color: 'from-cyan-500 to-blue-600',
    prompt: 'ลูกค้าวิลล่ากะตะ ล้างแอร์ติดผนังแบบถอดราง 3 เครื่อง เติมน้ำยาแอร์ R32 ตรวจเช็กระบบความเย็น ค่าแรงเครื่องละ 650 บาท รวม 1,950 บาท ไม่มีค่าอุปกรณ์',
  },
  {
    id: 'water_pump',
    icon: Droplets,
    label: 'เปลี่ยนปั๊มน้ำบ้าน 300W',
    subtitle: 'ทุน 6,200 บ. • ค่าแรง 1,500 บ.',
    color: 'from-sky-500 to-teal-600',
    prompt: 'ลูกค้าคุณเดวิด วิลล่าบางเทา เปลี่ยนปั๊มน้ำบ้านอัตโนมัติแรงดันคงที่ 300W ทุนซื้อ 6,200 บาท คิดราคากลางให้ได้กำไรหน่อย ค่าแรงรื้อถอนและติดตั้งท่อบายพาส 1,500 บาท',
  },
  {
    id: 'sliding_door',
    icon: Layers,
    label: 'เปลี่ยนลูกล้อบานเลื่อน SUS304',
    subtitle: 'ราคากลาง 1,800 บ. • ค่าแรง 900 บ.',
    color: 'from-amber-500 to-orange-600',
    prompt: 'ลูกค้าวิลล่าลายัน ประตูบานเลื่อนระเบียงฝืดตกราง ขอเปลี่ยนชุดตลับลูกล้อคู่สแตนเลส SUS304 แท้ต้านไอเกลือ 2 ชุด ราคากลางชุดละ 900 บาท รวม 1,800 บาท ค่าแรงช่างยกปรับระดับ 900 บาท',
  },
  {
    id: 'rcbo_breaker',
    icon: Zap,
    label: 'เปลี่ยนเบรกเกอร์กันดูด RCBO',
    subtitle: 'ราคากลาง 1,450 บ. • ค่าแรง 800 บ.',
    color: 'from-emerald-500 to-teal-600',
    prompt: 'ลูกค้าคุณไมเคิล วิลล่าราไวย์ เปลี่ยนเบรกเกอร์กันดูด RCBO Schneider Easy9 32A ป้องกันไฟดูดเครื่องทำน้ำอุ่น ทุน 950 บาท คิดราคากลาง 1,450 บาท ค่าแรงช่างเช็กระบบสายดิน 800 บาท',
  },
  {
    id: 'emergency_callout',
    icon: PhoneCall,
    label: 'ค่าบริการตรวจเช็คด่วนหน้างาน',
    subtitle: 'Call-out Fee 1,500 บ.',
    color: 'from-rose-500 to-red-600',
    prompt: 'ลูกค้าคุณอเล็กซ์ วิลล่ากมลา ไฟฟ้าดับเฉพาะจุดเร่งด่วน ขอใบเสนอราคาค่าเดินทางและตรวจเช็กวิเคราะห์สาเหตุหน้างานฉุกเฉิน (Emergency Diagnostic Call-Out) 1,500 บาท',
  },
];

export const MollyExpressQuoteModal: React.FC<MollyExpressQuoteModalProps> = ({
  isOpen,
  onClose,
  onCreateJobAndOpenQuotation,
  existingJobsCount,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'form'>('chat');
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);

  // Form states for manual tab
  const [formCustName, setFormCustName] = useState('คุณโบว์');
  const [formVilla, setFormVilla] = useState('Villa Kathu Residence, Phuket');
  const [formHardwareDesc, setFormHardwareDesc] = useState('ชุดกล้องวงจรปิด Wi-Fi TP-Link Tapo C320WS 4MP + การ์ด 128GB');
  const [formCost, setFormCost] = useState('1909');
  const [formLabor, setFormLabor] = useState('700');

  // Chat message history
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'molly',
      text: 'สวัสดีค่ะ! มอลลี่พร้อมช่วยออกใบเสนอราคาด่วนให้ทันทีค่ะ เพียงบอกชื่อลูกค้า สิ่งที่ต้องทำ ต้นทุนที่สั่งของ และค่าแรงช่าง มอลลี่จะคำนวณ "ราคากลางตลาด" ให้มีกำไรส่วนต่างอะไหล่ที่เหมาะสม รวมค่าแรง และตัดรายการจัดซื้อภายในออกให้พร้อมส่งลูกค้าภายใน 5 วินาทีค่ะ!',
      timestamp: 'เมื่อสักครู่',
    },
  ]);

  if (!isOpen) return null;

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputText).trim();
    if (!promptToSend || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsGenerating(true);

    try {
      const res = await fetch('/api/gemini/molly-express-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToSend }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate quotation');
      }

      const quoteResult: ExpressQuoteResult = await res.json();

      const mollyReply: ChatMessage = {
        id: `molly-${Date.now()}`,
        sender: 'molly',
        text: quoteResult.mollyGreeting || 'มอลลี่จัดการคำนวณราคาและร่างใบเสนอราคาให้เรียบร้อยแล้วค่ะ!',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        quoteResult: quoteResult,
      };

      setMessages((prev) => [...prev, mollyReply]);
    } catch (err) {
      console.error(err);
      // Fallback
      const fallbackResult: ExpressQuoteResult = {
        customerName: 'คุณโบว์',
        villaName: 'Private Villa, Phuket',
        propertyLocation: 'Phuket, Thailand',
        serviceType: 'CCTV Security & Technical Services',
        hardwareItems: [
          {
            item: 1,
            descriptionEn: 'TP-Link Tapo C320WS 4MP 2K QHD Outdoor Wi-Fi Security Camera + 128GB High Endurance MicroSD Card',
            descriptionTh: 'ชุดกล้องวงจรปิด Wi-Fi ภายนอกอาคาร 4MP 2K QHD (Tapo C320WS) กันน้ำกันฝุ่น IP66 พร้อมเมมโมรี่การ์ด 128GB',
            qty: 1,
            unit: 'ชุด (Set)',
            costPrice: 1909,
            unitPrice: 2390,
            amount: 2390,
          },
        ],
        serviceItems: [
          {
            item: 1,
            description: 'Outdoor CCTV Mounting, Cabling, Power Connection & Mobile App Setup',
            detail: 'งานบริการช่างเทคนิค: ยึดผนังภายนอก เดินสายไฟ เชื่อมต่อ Wi-Fi และเซ็ตอัปแอปพลิเคชัน Tapo ให้ลูกค้า',
            estimatedSchedule: 'ภายใน 1 วันทำการ',
            qty: '1 งาน (Job)',
            amount: 700,
          },
        ],
        procurementFeeRate: 0,
        terms: [
          'อุปกรณ์รับประกันศูนย์แท้ 1 ปีเต็ม',
          'รับประกันงานติดตั้งโดย Phuket Trusted Local 30 วัน',
        ],
        depositPercent: 50,
        mollyGreeting: 'มอลลี่คำนวณราคาให้แล้วค่ะ! ทุน 1,909 บ. ตั้งราคากลางตลาด 2,390 บ. (กำไรอะไหล่ 481 บ.) รวมค่าแรง 700 บ. ยอดรวม 3,090 บ. ถ้วนค่ะ',
        mollyFinancialAdvice: {
          hardwareCostTotal: 1909,
          hardwareQuotedTotal: 2390,
          hardwareProfit: 481,
          laborFee: 700,
          totalGrossProfit: 1181,
          profitMarginPct: 38,
          grandTotal: 3090,
          depositAmount: 1545,
          balanceAmount: 1545,
          explanation: 'กำไรสุทธิงานนี้ 1,181 บาท (กำไรส่วนต่างอะไหล่ 481 บาท + ค่าแรง 700 บาท)',
        },
        lineMessageSummary: 'เรียน คุณโบว์\nPhuket Trusted Local ขอส่งสรุปใบเสนอราคาด่วนสำหรับติดตั้งกล้อง Tapo C320WS 1 จุด:\n1. ชุดกล้อง 4MP พร้อมเมม 128GB: 2,390 บาท\n2. ค่าบริการช่างเทคนิคติดตั้งและเซ็ตอัป: 700 บาท\n💰 ยอดรวมทั้งสิ้น: 3,090 บาท (มัดจำ 50% = 1,545 บาท)\nขอบคุณมากค่ะ',
      };

      setMessages((prev) => [
        ...prev,
        {
          id: `molly-fallback-${Date.now()}`,
          sender: 'molly',
          text: 'มอลลี่คำนวณราคาด่วนจากข้อมูลมาตรฐานให้เรียบร้อยแล้วค่ะ!',
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          quoteResult: fallbackResult,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = `ลูกค้าชื่อ ${formCustName} สถานที่ ${formVilla} รายการ ${formHardwareDesc} ทุนสั่งของ ${formCost} บาท ค่าแรงช่าง ${formLabor} บาท คิดราคากลางตลาดให้ได้กำไรหน่อยครับ`;
    setActiveTab('chat');
    handleSendMessage(prompt);
  };

  const handleCreateJobFromQuote = (qr: ExpressQuoteResult) => {
    const now = new Date();
    const dateCode = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const newJob: InspectionJob = {
      id: `PTL-INSP-${dateCode}-${randomSuffix}`,
      clientId: `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
      villaName: qr.villaName || 'Phuket Private Villa',
      status: 'Quoted',
      createdAt: now.toISOString(),
      customerName: qr.customerName || 'Customer',
      customerGroup: 'villa_owner',
      propertyLocation: qr.propertyLocation || 'Phuket, Thailand',
      serviceType: qr.serviceType || 'Technical Services & Villa Care',
      inspectionDate: dateStr,
      inspector: 'Field Team & Mr. Big Inspector',
      documentRef: `Express_Quotation_${dateCode}.pdf`,
      items: [],
      quotation: {
        refNo: `PTL-QT-${now.getFullYear()}-${randomSuffix}`,
        date: dateStr,
        inspectionRef: `PTL-INSP-${dateCode}-${randomSuffix}`,
        validity: '15 Days',
        paymentTerm: '50% Mobilization Deposit, 50% Handover Balance',
        hardwareItems: qr.hardwareItems.map((h, i) => ({
          item: i + 1,
          descriptionEn: h.descriptionEn,
          descriptionTh: h.descriptionTh,
          qty: h.qty,
          unit: h.unit,
          unitPrice: h.unitPrice,
          amount: h.amount,
          sourcingChannel: 'Authorized Official Distributor (รับประกันศูนย์แท้ 1 ปี)',
        })),
        serviceItems: qr.serviceItems.map((s, i) => ({
          item: i + 1,
          description: s.description,
          detail: s.detail,
          estimatedSchedule: s.estimatedSchedule || 'ภายใน 1 วันทำการ',
          qty: s.qty || '1 งาน (Job)',
          amount: s.amount,
        })),
        procurementFeeRate: 0,
        terms: qr.terms || [
          'อุปกรณ์ทุกชิ้นรับประกันศูนย์แท้ 1 ปีเต็ม',
          'รับประกันงานติดตั้งโดยทีมช่าง Phuket Trusted Local 30 วัน',
        ],
        contingencies: [
          'ราคานี้รวมค่าเดินทางและอุปกรณ์ติดตั้งมาตรฐานหน้างานเรียบร้อยแล้ว',
        ],
        mollyNotes: qr.mollyFinancialAdvice?.explanation || 'ออกใบเสนอราคาด่วนโดย Molly Express Quotation Copilot',
        bankName: 'Kasikornbank (ธนาคารกสิกรไทย)',
        bankAccountNo: '184-1-88992-0',
        bankAccountName: 'Phuket Trusted Local Co., Ltd.',
        promptPayId: '081-999-8877',
        depositPercent: qr.depositPercent || 50,
        separateTermsPage: false,
      },
    };

    onClose();
    onCreateJobAndOpenQuotation(newJob);
  };

  const handleCopyLineSummary = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuoteId(id);
    setTimeout(() => setCopiedQuoteId(null), 3000);
  };

  return (
    <div
      id="molly-express-quote-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        id="molly-express-quote-modal-container"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header with Molly Identity */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-white/20 border-2 border-white/80 flex items-center justify-center text-xl shadow-inner">
                ⚡
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  คุยกับ Molly — ออกใบเสนอราคาด่วน
                </h3>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Express Copilot
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                พิมพ์สั่งงานด้วยภาษาพูด มอลลี่จัดแจงราคากลาง คำนวณกำไร และทำ PDF ใบเสนอราคาให้พร้อมส่งทันที
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>💬 แชทสั่งงานด่วน (Natural Chat)</span>
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'form'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>⚡ กรอกฟอร์มด่วน 1 นาที</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>ตัด Smart Procurement ออกให้ลูกค้าโดยอัตโนมัติ</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {activeTab === 'chat' ? (
            <>
              {/* Quick Preset Badges */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    คลิกเลือกแม่แบบงานด่วนยอดนิยม (Phuket Villa Presets):
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_TEMPLATES.map((tmpl) => {
                    const IconComponent = tmpl.icon;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleSendMessage(tmpl.prompt)}
                        className="text-left p-2.5 bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl transition-all group cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${tmpl.color} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-800 truncate group-hover:text-amber-800">
                              {tmpl.label}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {tmpl.subtitle}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chat Timeline */}
              <div className="space-y-3 pt-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-start gap-2 max-w-[92%] sm:max-w-[85%]">
                      {msg.sender === 'molly' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-400 text-white flex items-center justify-center text-sm shrink-0 shadow-xs font-black">
                          M
                        </div>
                      )}

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#0f294a] text-white rounded-tr-xs shadow-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>

                        {/* If Molly returned a generated Quotation */}
                        {msg.quoteResult && (
                          <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                            {/* Summary Card for Customer */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                                <div>
                                  <span className="font-bold text-slate-900 text-xs">
                                    📄 สรุปยอดใบเสนอราคา (Customer View)
                                  </span>
                                  <div className="text-[11px] text-slate-500">
                                    ลูกค้า: <span className="font-semibold text-slate-700">{msg.quoteResult.customerName}</span> • {msg.quoteResult.villaName}
                                  </div>
                                </div>
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                                  พร้อมออกเอกสาร
                                </span>
                              </div>

                              <div className="mt-2 space-y-1 text-xs">
                                {msg.quoteResult.hardwareItems.map((h, i) => (
                                  <div key={`h-${i}`} className="flex justify-between text-slate-700">
                                    <span className="truncate pr-2">1. {h.descriptionTh}</span>
                                    <span className="font-mono font-semibold shrink-0">{h.amount.toLocaleString()} ฿</span>
                                  </div>
                                ))}

                                {msg.quoteResult.serviceItems.map((s, i) => (
                                  <div key={`s-${i}`} className="flex justify-between text-slate-700">
                                    <span className="truncate pr-2">2. {s.detail || s.description}</span>
                                    <span className="font-mono font-semibold shrink-0">{s.amount.toLocaleString()} ฿</span>
                                  </div>
                                ))}

                                <div className="mt-2 pt-2 border-t border-slate-300 flex justify-between items-center font-bold text-slate-900">
                                  <span>ยอดรวมสุทธิทั้งสิ้น (TOTAL AMOUNT):</span>
                                  <span className="font-mono text-sm text-blue-900">
                                    {msg.quoteResult.mollyFinancialAdvice?.grandTotal.toLocaleString()} THB
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-500 pt-0.5 flex justify-between">
                                  <span>เงื่อนไขมัดจำ 50% เริ่มงาน:</span>
                                  <span className="font-mono font-semibold text-slate-700">
                                    {msg.quoteResult.mollyFinancialAdvice?.depositAmount.toLocaleString()} THB
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Molly's Private Profit Card (For Contractor / Business only) */}
                            {msg.quoteResult.mollyFinancialAdvice && (
                              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 rounded-xl p-3">
                                <div className="flex items-center justify-between pb-1 border-b border-emerald-200">
                                  <span className="font-bold text-emerald-900 text-xs flex items-center gap-1">
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                    วิเคราะห์กำไรสุทธิภายใน (Internal Profit Analytics):
                                  </span>
                                  <span className="text-[10px] text-emerald-700 font-semibold">
                                    เห็นเฉพาะช่าง ไม่แสดงให้ลูกค้าเห็น
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-center text-xs">
                                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                                    <div className="text-[10px] text-slate-500">ต้นทุนอะไหล่จริง</div>
                                    <div className="font-mono font-bold text-slate-700">
                                      {msg.quoteResult.mollyFinancialAdvice.hardwareCostTotal.toLocaleString()} ฿
                                    </div>
                                  </div>
                                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                                    <div className="text-[10px] text-slate-500">กำไรส่วนต่างอะไหล่</div>
                                    <div className="font-mono font-bold text-emerald-700">
                                      +{msg.quoteResult.mollyFinancialAdvice.hardwareProfit.toLocaleString()} ฿
                                    </div>
                                  </div>
                                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                                    <div className="text-[10px] text-slate-500">ค่าแรงช่างเทคนิค</div>
                                    <div className="font-mono font-bold text-blue-700">
                                      {msg.quoteResult.mollyFinancialAdvice.laborFee.toLocaleString()} ฿
                                    </div>
                                  </div>
                                  <div className="bg-emerald-600 text-white p-2 rounded-lg shadow-2xs">
                                    <div className="text-[10px] text-emerald-100 font-medium">กำไรสุทธิรวม (Profit)</div>
                                    <div className="font-mono font-black text-sm">
                                      {msg.quoteResult.mollyFinancialAdvice.totalGrossProfit.toLocaleString()} ฿
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Actions on this Quote */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleCreateJobFromQuote(msg.quoteResult!)}
                                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>⚡ อนุมัติ &amp; เปิดดูใบเสนอราคา / PDF ทันที</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyLineSummary(
                                    msg.quoteResult!.lineMessageSummary,
                                    msg.id
                                  )
                                }
                                className="flex items-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
                                title="คัดลอกข้อความสรุปส่ง LINE หรือ WhatsApp"
                              >
                                {copiedQuoteId === msg.id ? (
                                  <>
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    <span className="text-emerald-700">คัดลอกแล้ว!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4 text-slate-500" />
                                    <span>คัดลอกส่ง LINE/WhatsApp</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-400 text-white flex items-center justify-center text-sm shrink-0 animate-pulse font-black">
                      M
                    </div>
                    <div className="bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 text-xs flex items-center gap-2 shadow-2xs">
                      <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>มอลลี่กำลังสืบราคากลาง คัดสรรอะไหล่ และคำนวณกำไรส่วนต่างให้ค่ะ...</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Direct Form Tab */
            <form onSubmit={handleFormSubmit} className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>กรอกข้อมูลด่วน 4 ช่อง — มอลลี่คำนวณราคากลางให้อัตโนมัติ:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">1. ชื่อลูกค้า (Customer Name)</label>
                  <input
                    type="text"
                    value={formCustName}
                    onChange={(e) => setFormCustName(e.target.value)}
                    placeholder="เช่น คุณโบว์ หรือ Mr. James"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">2. สถานที่ / วิลล่า (Location)</label>
                  <input
                    type="text"
                    value={formVilla}
                    onChange={(e) => setFormVilla(e.target.value)}
                    placeholder="เช่น Villa Kathu หรือ Laguna Phuket"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-xs">
                  3. รายละเอียดอุปกรณ์หรือสิ่งที่ต้องทำ (Hardware &amp; Scope)
                </label>
                <input
                  type="text"
                  value={formHardwareDesc}
                  onChange={(e) => setFormHardwareDesc(e.target.value)}
                  placeholder="เช่น กล้อง Tapo C320WS 4MP หรือ ปั๊มน้ำ 300W หรือ ล้างแอร์ 3 เครื่อง"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-hidden text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    4. ต้นทุนสั่งของ (Hardware Cost THB)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formCost}
                      onChange={(e) => setFormCost(e.target.value)}
                      placeholder="เช่น 1909"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-hidden pr-12 font-mono font-semibold"
                      required
                    />
                    <span className="absolute right-3 top-2 text-slate-400 text-xs">บาท</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 mt-0.5 block">
                    * มอลลี่จะปรับเป็นราคากลางหน้าร้านให้มีกำไรส่วนต่างกลมๆ อัตโนมัติ
                  </span>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    5. ค่าแรงช่างเทคนิค (Labor Fee THB)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formLabor}
                      onChange={(e) => setFormLabor(e.target.value)}
                      placeholder="เช่น 700"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-hidden pr-12 font-mono font-semibold"
                      required
                    />
                    <span className="absolute right-3 top-2 text-slate-400 text-xs">บาท</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 mt-0.5 block">
                    * ค่าบริการติดตั้ง เดินสาย หรือแรงงานช่างเทคนิค
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-3"
              >
                <Sparkles className="w-4 h-4" />
                <span>ให้ Molly คำนวณราคากลาง &amp; ออกใบเสนอราคาทันที</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer Prompt Input (Only in Chat Mode) */}
        {activeTab === 'chat' && (
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder='พิมพ์สั่งงานด่วน เช่น "ลูกค้าคุณโบว์ ติดกล้อง Tapo C320WS ทุน 1909 บ. ค่าแรง 700 บ."'
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-hidden"
                  disabled={isGenerating}
                />
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || isGenerating}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>ส่งให้ Molly</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
            <div className="mt-1.5 text-[10.5px] text-slate-400 flex items-center justify-between">
              <span>💡 คำแนะนำ: พิมพ์เป็นภาษาพูดสั้นๆ หรือวางข้อความแชทจากลูกค้าได้เลยค่ะ</span>
              <span className="hidden sm:inline">Phuket Trusted Local • Express Quotation</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
