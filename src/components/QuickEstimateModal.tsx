import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Plus,
  Check,
  Percent,
  Sparkles,
  Send,
  Copy,
  DollarSign,
  Wrench,
  Cpu,
  Droplets,
  Wind,
  ShieldAlert,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  ClipboardList,
} from 'lucide-react';
import { InspectionJob, QuotationHardwareItem, QuotationServiceItem, QuotationData } from '../types';

interface QuickEstimateModalProps {
  job: InspectionJob;
  onClose: () => void;
  onSaveQuotation: (updatedJob: InspectionJob) => void;
  initialTab?: 'items' | 'presets' | 'custom';
  initialEditServiceIndex?: number | null;
  initialEditHardwareIndex?: number | null;
}

interface PresetItem {
  id: string;
  category: 'electrical' | 'plumbing' | 'aircon' | 'service' | 'missed';
  type: 'hardware' | 'service';
  titleTh: string;
  titleEn: string;
  unit: string;
  defaultPrice: number;
  qty: number;
  sourcing?: string;
  urgency: 'Immediate' | 'Recommended' | 'Preventive';
}

const COMMON_PRESETS: PresetItem[] = [
  // Cancellation & Missed Appointment Standards (Phuket Trusted Local Special Skill)
  {
    id: 'pre-missed-1',
    category: 'missed',
    type: 'service',
    titleTh: 'ค่าธรรมเนียมสงวนเวลาช่าง / ผิดนัดหมายเข้าหน้างาน (1 ครั้ง)',
    titleEn: 'Cancellation / Missed Appointment Fee (Dedicated Technician Time)',
    unit: 'ครั้ง (Visit)',
    defaultPrice: 1000,
    qty: 1,
    urgency: 'Recommended',
  },
  {
    id: 'pre-missed-2',
    category: 'missed',
    type: 'service',
    titleTh: 'ค่าธรรมเนียมสงวนเวลาช่าง / ผิดนัดหมายเข้าหน้างานซ้ำรอบสอง (2 ครั้ง)',
    titleEn: 'Cancellation / Missed Appointment Fee — 2nd Repeat Offense (2 Visits)',
    unit: 'ครั้ง (Visits)',
    defaultPrice: 1000,
    qty: 2,
    urgency: 'Immediate',
  },
  {
    id: 'pre-missed-3',
    category: 'missed',
    type: 'service',
    titleTh: 'ค่าธรรมเนียมสงวนเวลาและเดินทางเข้าหน้างานแต่เข้าวิลล่าไม่ได้ (เดินทางถึงที่)',
    titleEn: 'Cancellation / Travel & Dedicated On-Site Access Aborted Fee',
    unit: 'ครั้ง (Visit)',
    defaultPrice: 1500,
    qty: 1,
    urgency: 'Immediate',
  },
  {
    id: 'pre-missed-4',
    category: 'missed',
    type: 'service',
    titleTh: 'เงินมัดจำสำรองคิวสำหรับการนัดหมายครั้งถัดไป (นำไปหักเต็มจำนวนจากค่าติดตั้งจริง)',
    titleEn: 'Advance Appointment Deposit for Next Visit (Credited Towards Final Installation)',
    unit: 'ครั้ง (Deposit)',
    defaultPrice: 1000,
    qty: 1,
    urgency: 'Preventive',
  },

  // Electrical
  {
    id: 'pre-1',
    category: 'electrical',
    type: 'hardware',
    titleTh: 'เบรกเกอร์กันดูด RCBO Schneider Electric 1P 16A/20A',
    titleEn: 'Schneider Electric 1P RCBO Residual Current Circuit Breaker',
    unit: 'ตัว (Pcs)',
    defaultPrice: 950,
    qty: 1,
    sourcing: 'HomePro Phuket / Schneider Auth.',
    urgency: 'Immediate',
  },
  {
    id: 'pre-2',
    category: 'electrical',
    type: 'hardware',
    titleTh: 'สวิตช์ไฟ 2 ทาง / สวิตช์บันได Panasonic Wide Series',
    titleEn: 'Panasonic Wide Series 2-Way Wall Switch Module',
    unit: 'ชุด (Sets)',
    defaultPrice: 220,
    qty: 1,
    sourcing: 'Thai Watsadu / HomePro',
    urgency: 'Recommended',
  },
  {
    id: 'pre-3',
    category: 'electrical',
    type: 'service',
    titleTh: 'ค่าบริการช่างเทคนิคตรวจสอบระบบกราวด์และเดินสายไฟแก้ไข',
    titleEn: 'Electrical Diagnostics, Grounding & Circuit Re-wiring Labor',
    unit: 'งาน (Job)',
    defaultPrice: 1800,
    qty: 1,
    urgency: 'Recommended',
  },

  // Plumbing
  {
    id: 'pre-4',
    category: 'plumbing',
    type: 'hardware',
    titleTh: 'เช็ควาล์วทองเหลืองกันน้ำไหลย้อน + ข้อต่อยูเนี่ยนปั๊มน้ำ',
    titleEn: 'Brass Swing Check Valve & Union Coupler for Booster Pump',
    unit: 'ชุด (Sets)',
    defaultPrice: 1250,
    qty: 1,
    sourcing: 'Global House Phuket',
    urgency: 'Immediate',
  },
  {
    id: 'pre-5',
    category: 'plumbing',
    type: 'hardware',
    titleTh: 'ชุดลูกลอยตัดน้ำถังเก็บน้ำสแตนเลส (High-Pressure Float Valve)',
    titleEn: 'Heavy-Duty Brass Water Tank Float Valve 1 Inch',
    unit: 'ชุด (Sets)',
    defaultPrice: 650,
    qty: 1,
    sourcing: 'HomePro Phuket',
    urgency: 'Preventive',
  },
  {
    id: 'pre-6',
    category: 'plumbing',
    type: 'service',
    titleTh: 'งานซ่อมท่อแรงดันรั่วซึมใต้พื้นและทดสอบแรงดันระบบน้ำ',
    titleEn: 'Pressurized Pipe Leak Repair & Hydraulic Pressure Test',
    unit: 'จุด (Point)',
    defaultPrice: 2200,
    qty: 1,
    urgency: 'Immediate',
  },

  // Air Conditioning
  {
    id: 'pre-7',
    category: 'aircon',
    type: 'service',
    titleTh: 'บริการล้างแอร์ติดผนัง Inverter ระบบปั๊มแรงดันสูง + ฆ่าเชื้อ',
    titleEn: 'High-Pressure Chemical Coil Wash & Anti-Bacterial Treatment',
    unit: 'เครื่อง (Units)',
    defaultPrice: 850,
    qty: 1,
    urgency: 'Recommended',
  },
  {
    id: 'pre-8',
    category: 'aircon',
    type: 'hardware',
    titleTh: 'แคปรันพัดลมคอยล์ร้อนคอมเพรสเซอร์ (Capacitor 35-45uF)',
    titleEn: 'Compressor Fan Motor Run Capacitor Replacement (35-45uF)',
    unit: 'ตัว (Pcs)',
    defaultPrice: 580,
    qty: 1,
    sourcing: 'Daikin/Mitsubishi Local Parts',
    urgency: 'Immediate',
  },

  // General Services
  {
    id: 'pre-9',
    category: 'service',
    type: 'service',
    titleTh: 'ค่าแรงช่างเทคนิคลงพื้นที่เข้าซ่อมแก้ไขรอบสอง (Follow-up Service)',
    titleEn: 'Follow-Up Engineering Service & Final Commissioning Walkthrough',
    unit: 'งาน (Job)',
    defaultPrice: 2500,
    qty: 1,
    urgency: 'Recommended',
  },
];

export const QuickEstimateModal: React.FC<QuickEstimateModalProps> = ({
  job,
  onClose,
  onSaveQuotation,
  initialTab,
  initialEditServiceIndex,
  initialEditHardwareIndex,
}) => {
  const initialCount =
    (job.quotation?.hardwareItems?.length || 0) + (job.quotation?.serviceItems?.length || 0);

  const [activeTab, setActiveTab] = useState<'items' | 'presets' | 'custom'>(
    initialTab || (initialCount > 0 ? 'items' : 'presets')
  );

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [itemType, setItemType] = useState<'hardware' | 'service'>('hardware');
  const [customTitleTh, setCustomTitleTh] = useState('');
  const [customTitleEn, setCustomTitleEn] = useState('');
  const [customQty, setCustomQty] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState('ตัว (Pcs)');
  const [customPrice, setCustomPrice] = useState<number>(500);
  const [customSourcing, setCustomSourcing] = useState('HomePro Phuket');
  const [addedNotice, setAddedNotice] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  // Edit Service Item State
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(
    initialEditServiceIndex ?? null
  );
  const [editServiceDesc, setEditServiceDesc] = useState('');
  const [editServiceDetail, setEditServiceDetail] = useState('');
  const [editServiceQty, setEditServiceQty] = useState('');
  const [editServiceAmount, setEditServiceAmount] = useState<number>(0);

  // Edit Hardware Item State
  const [editingHardwareIndex, setEditingHardwareIndex] = useState<number | null>(
    initialEditHardwareIndex ?? null
  );
  const [editHwDescEn, setEditHwDescEn] = useState('');
  const [editHwDescTh, setEditHwDescTh] = useState('');
  const [editHwQty, setEditHwQty] = useState<number>(1);
  const [editHwUnit, setEditHwUnit] = useState('ชิ้น (Pcs)');
  const [editHwUnitPrice, setEditHwUnitPrice] = useState<number>(0);
  const [editHwSourcing, setEditHwSourcing] = useState('HomePro Phuket');

  // If initial edit indices were provided on mount, populate their form
  useEffect(() => {
    if (
      initialEditServiceIndex !== undefined &&
      initialEditServiceIndex !== null &&
      job.quotation?.serviceItems?.[initialEditServiceIndex]
    ) {
      const it = job.quotation.serviceItems[initialEditServiceIndex];
      setEditingServiceIndex(initialEditServiceIndex);
      setEditServiceDesc(it.description || '');
      setEditServiceDetail(it.detail || '');
      setEditServiceQty(it.qty || '1');
      setEditServiceAmount(it.amount || 0);
      setActiveTab('items');
    }
  }, [initialEditServiceIndex, job.quotation?.serviceItems]);

  useEffect(() => {
    if (
      initialEditHardwareIndex !== undefined &&
      initialEditHardwareIndex !== null &&
      job.quotation?.hardwareItems?.[initialEditHardwareIndex]
    ) {
      const it = job.quotation.hardwareItems[initialEditHardwareIndex];
      setEditingHardwareIndex(initialEditHardwareIndex);
      setEditHwDescEn(it.descriptionEn || '');
      setEditHwDescTh(it.descriptionTh || '');
      setEditHwQty(it.qty || 1);
      setEditHwUnit(it.unit || 'ชิ้น');
      setEditHwUnitPrice(it.unitPrice || 0);
      setEditHwSourcing(it.sourcingChannel || 'HomePro Phuket');
      setActiveTab('items');
    }
  }, [initialEditHardwareIndex, job.quotation?.hardwareItems]);

  // Filter presets
  const filteredPresets = COMMON_PRESETS.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  const feeRate = job.quotation.procurementFeeRate || 0.15;
  const feePct = Math.round(feeRate * 100);

  const showNotice = (msg: string) => {
    setAddedNotice(msg);
    setTimeout(() => setAddedNotice(null), 3500);
  };

  // Add preset item to current quotation
  const handleAddPreset = (preset: PresetItem) => {
    const updatedJob = { ...job };
    const updatedQuotation = { ...job.quotation };

    if (preset.type === 'hardware') {
      const nextItemNum = (updatedQuotation.hardwareItems?.length || 0) + 1;
      const newItem: QuotationHardwareItem = {
        item: nextItemNum,
        descriptionTh: preset.titleTh,
        descriptionEn: preset.titleEn,
        qty: preset.qty,
        unit: preset.unit,
        unitPrice: preset.defaultPrice,
        amount: preset.defaultPrice * preset.qty,
        sourcingChannel: preset.sourcing || 'HomePro Phuket',
      };
      updatedQuotation.hardwareItems = [...(updatedQuotation.hardwareItems || []), newItem];
    } else {
      const nextItemNum = (updatedQuotation.serviceItems?.length || 0) + 1;
      const newItem: QuotationServiceItem = {
        item: nextItemNum,
        description: preset.titleEn,
        detail: preset.titleTh,
        estimatedSchedule:
          preset.category === 'missed'
            ? 'เรียกเก็บตาม Appointment Policy'
            : 'Within 24-48 Hours upon approval',
        qty: `${preset.qty} ${preset.unit}`,
        amount: preset.defaultPrice * preset.qty,
      };
      updatedQuotation.serviceItems = [...(updatedQuotation.serviceItems || []), newItem];
    }

    if (preset.category === 'missed') {
      const missedTerms = [
        "Appointment Policy: As the technician needs to be scheduled specifically for your property, we kindly ask that someone is available at the agreed appointment time.",
        "Cancellations with less than 24 hours’ notice or missed appointments may be subject to a Cancellation / Missed Appointment Fee of THB 1,000.",
        "สำหรับการนัดหมายครั้งถัดไป ทีมงานแนะนำเรียกเก็บ Appointment Deposit THB 1,000 ก่อนเข้าดำเนินการ: หากมาตามนัด ยอดนี้จะนำไปหักเต็มจำนวนจากค่าติดตั้งจริง แต่หากเบี้ยวนัดโดยไม่แจ้งล่วงหน้า 24 ชม. ขอสงวนสิทธิ์ไม่คืนเงินมัดจำ",
        "Phuket Trusted Local ยึดหลักความโปร่งใส แยก 3 รายการชัดเจน (Replacement/Installation, Travel/Call-out, Missed Appointment Fee) โดยไม่ใช้คำว่า Penalty",
      ];
      const existingTerms = updatedQuotation.terms || [];
      const newTerms = [...existingTerms];
      missedTerms.forEach((t) => {
        if (!newTerms.includes(t)) {
          newTerms.push(t);
        }
      });
      updatedQuotation.terms = newTerms;
    }

    updatedJob.quotation = updatedQuotation;
    onSaveQuotation(updatedJob);
    showNotice(
      preset.category === 'missed'
        ? `เพิ่ม "${preset.titleEn}" (฿${(preset.defaultPrice * preset.qty).toLocaleString()}) และเงื่อนไข Appointment Policy แล้ว`
        : `เพิ่ม "${preset.titleTh}" ลงในใบเสนอราคาแล้ว`
    );
  };

  // Add custom item
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitleTh.trim()) {
      alert('กรุณาระบุชื่อรายการ');
      return;
    }

    const updatedJob = { ...job };
    const updatedQuotation = { ...job.quotation };

    if (itemType === 'hardware') {
      const nextItemNum = (updatedQuotation.hardwareItems?.length || 0) + 1;
      const newItem: QuotationHardwareItem = {
        item: nextItemNum,
        descriptionTh: customTitleTh.trim(),
        descriptionEn: customTitleEn.trim() || customTitleTh.trim(),
        qty: Number(customQty) || 1,
        unit: customUnit.trim() || 'ชิ้น (Pcs)',
        unitPrice: Number(customPrice) || 0,
        amount: (Number(customQty) || 1) * (Number(customPrice) || 0),
        sourcingChannel: customSourcing.trim() || 'HomePro Phuket',
      };
      updatedQuotation.hardwareItems = [...(updatedQuotation.hardwareItems || []), newItem];
    } else {
      const nextItemNum = (updatedQuotation.serviceItems?.length || 0) + 1;
      const newItem: QuotationServiceItem = {
        item: nextItemNum,
        description: customTitleEn.trim() || customTitleTh.trim(),
        detail: customTitleTh.trim(),
        estimatedSchedule: 'Schedule on client request',
        qty: `${customQty} ${customUnit}`,
        amount: (Number(customQty) || 1) * (Number(customPrice) || 0),
      };
      updatedQuotation.serviceItems = [...(updatedQuotation.serviceItems || []), newItem];
    }

    updatedJob.quotation = updatedQuotation;
    onSaveQuotation(updatedJob);

    // Reset form
    setCustomTitleTh('');
    setCustomTitleEn('');
    setCustomPrice(500);
    showNotice(`เพิ่ม "${customTitleTh}" ลงใบเสนอราคาเรียบร้อย`);
    setActiveTab('items');
  };

  // Start editing service item
  const handleStartEditService = (index: number, item: QuotationServiceItem) => {
    setEditingServiceIndex(index);
    setEditServiceDesc(item.description || '');
    setEditServiceDetail(item.detail || '');
    setEditServiceQty(item.qty || '');
    setEditServiceAmount(item.amount || 0);
    setEditingHardwareIndex(null);
  };

  // Save edited service item
  const handleSaveEditService = (index: number) => {
    const updatedJob = { ...job };
    const updatedQuotation = { ...job.quotation };
    const items = [...(updatedQuotation.serviceItems || [])];
    if (!items[index]) return;

    items[index] = {
      ...items[index],
      description: editServiceDesc.trim() || items[index].description,
      detail: editServiceDetail.trim() || items[index].detail,
      qty: editServiceQty.trim() || items[index].qty,
      amount: Number(editServiceAmount) || 0,
    };

    updatedQuotation.serviceItems = items;
    updatedJob.quotation = updatedQuotation;
    onSaveQuotation(updatedJob);
    setEditingServiceIndex(null);
    showNotice(`บันทึกการแก้ไข "${items[index].description}" เรียบร้อยแล้ว`);
  };

  // Cancel edit service item
  const handleCancelEditService = () => {
    setEditingServiceIndex(null);
  };

  // Delete a specific service item
  const handleDeleteServiceItem = (index: number) => {
    const updatedJob = { ...job };
    const updatedQuotation = { ...job.quotation };
    const targetItem = (updatedQuotation.serviceItems || [])[index];
    if (!targetItem) return;

    const remaining = (updatedQuotation.serviceItems || []).filter((_, idx) => idx !== index);
    updatedQuotation.serviceItems = remaining.map((it, idx) => ({
      ...it,
      item: idx + 1,
    }));

    updatedJob.quotation = updatedQuotation;
    onSaveQuotation(updatedJob);
    if (editingServiceIndex === index) {
      setEditingServiceIndex(null);
    }
    showNotice(`ลบรายการ "${targetItem.description}" ออกเรียบร้อยแล้ว`);
  };

  // Start editing hardware item
  const handleStartEditHardware = (index: number, item: QuotationHardwareItem) => {
    setEditingHardwareIndex(index);
    setEditHwDescEn(item.descriptionEn || '');
    setEditHwDescTh(item.descriptionTh || '');
    setEditHwQty(item.qty || 1);
    setEditHwUnit(item.unit || 'ชิ้น');
    setEditHwUnitPrice(item.unitPrice || 0);
    setEditHwSourcing(item.sourcingChannel || 'HomePro Phuket');
    setEditingServiceIndex(null);
  };

  // Save edited hardware item
  const handleSaveEditHardware = (index: number) => {
    const updatedJob = { ...job };
    const updatedQuotation = { ...job.quotation };
    const items = [...(updatedQuotation.hardwareItems || [])];
    if (!items[index]) return;

    const qty = Number(editHwQty) || 1;
    const unitPrice = Number(editHwUnitPrice) || 0;

    items[index] = {
      ...items[index],
      descriptionEn: editHwDescEn.trim() || items[index].descriptionEn,
      descriptionTh: editHwDescTh.trim() || items[index].descriptionTh,
      qty: qty,
      unit: editHwUnit.trim() || items[index].unit,
      unitPrice: unitPrice,
      amount: qty * unitPrice,
      sourcingChannel: editHwSourcing.trim() || items[index].sourcingChannel,
    };

    updatedQuotation.hardwareItems = items;
    updatedJob.quotation = updatedQuotation;
    onSaveQuotation(updatedJob);
    setEditingHardwareIndex(null);
    showNotice(`บันทึกการแก้ไข "${items[index].descriptionTh || items[index].descriptionEn}" เรียบร้อยแล้ว`);
  };

  // Cancel edit hardware item
  const handleCancelEditHardware = () => {
    setEditingHardwareIndex(null);
  };

  // Delete a specific hardware item
  const handleDeleteHardwareItem = (index: number) => {
    const updatedJob = { ...job };
    const updatedQuotation = { ...job.quotation };
    const targetItem = (updatedQuotation.hardwareItems || [])[index];
    if (!targetItem) return;

    const remaining = (updatedQuotation.hardwareItems || []).filter((_, idx) => idx !== index);
    updatedQuotation.hardwareItems = remaining.map((it, idx) => ({
      ...it,
      item: idx + 1,
    }));

    updatedJob.quotation = updatedQuotation;
    onSaveQuotation(updatedJob);
    if (editingHardwareIndex === index) {
      setEditingHardwareIndex(null);
    }
    showNotice(`ลบรายการ "${targetItem.descriptionTh || targetItem.descriptionEn}" ออกเรียบร้อยแล้ว`);
  };

  // One-Click: Set ONLY Missed Appointment Fee (clear all other items)
  const handleSetOnlyMissedFee = (amount: number = 1000) => {
    const updatedJob = { ...job };
    const updatedQuotation = {
      ...job.quotation,
      hardwareItems: [],
      serviceItems: [
        {
          item: 1,
          description: 'Cancellation / Missed Appointment Fee',
          detail:
            'ค่าธรรมเนียมสงวนเวลาช่างและจัดสรรเส้นทางเข้าหน้างาน (Dedicated Technician Route & Opportunity Cost - กรณีเข้าวิลล่าไม่ได้/ผู้เช่าไม่มาตามนัด)',
          estimatedSchedule: 'เรียกเก็บตามนโยบายการนัดหมาย (Appointment Policy)',
          qty: '1 ครั้ง (Visit)',
          amount: amount,
        },
      ],
      terms: [
        'Appointment Policy: As the technician needs to be scheduled specifically for your property, we kindly ask that someone is available at the agreed appointment time.',
        'Cancellations with less than 24 hours’ notice or missed appointments may be subject to a Cancellation / Missed Appointment Fee of THB 1,000.',
        'สำหรับการนัดหมายครั้งถัดไป ทีมงานแนะนำเรียกเก็บ Appointment Deposit THB 1,000 ก่อนเข้าดำเนินการ: หากมาตามนัด ยอดนี้จะนำไปหักเต็มจำนวนจากค่าติดตั้งจริง แต่หากเบี้ยวนัดโดยไม่แจ้งล่วงหน้า 24 ชม. ขอสงวนสิทธิ์ไม่คืนเงินมัดจำ',
        'Phuket Trusted Local ยึดหลักความโปร่งใส แยก 3 รายการชัดเจน (Replacement/Installation, Travel/Call-out, Missed Appointment Fee) โดยไม่ใช้คำว่า Penalty',
      ],
      mollyNotes: `Molly จัดทำใบเสนอราคาเฉพาะรายการ Cancellation / Missed Appointment Fee ${amount.toLocaleString()} บาท เพื่อส่งแจ้งลูกค้าอย่างเป็นทางการและโปร่งใสตามมาตรฐาน Phuket Trusted Local เรียบร้อยค่ะ`,
    };

    updatedJob.quotation = updatedQuotation;
    onSaveQuotation(updatedJob);
    setEditingServiceIndex(null);
    setEditingHardwareIndex(null);
    setActiveTab('items');
    showNotice(
      `ปรับใบเสนอราคาเป็น "ค่าผิดนัดหมาย ฿${amount.toLocaleString()}" รายการเดียวเรียบร้อยแล้ว!`
    );
  };

  // Clear all items
  const handleClearAllItems = () => {
    if (!window.confirm('คุณต้องการลบรายการทั้งหมดในใบเสนอราคานี้หรือไม่?')) return;
    const updatedJob = { ...job };
    const updatedQuotation = {
      ...job.quotation,
      hardwareItems: [],
      serviceItems: [],
    };
    updatedJob.quotation = updatedQuotation;
    onSaveQuotation(updatedJob);
    setEditingServiceIndex(null);
    setEditingHardwareIndex(null);
    showNotice('ลบรายการทั้งหมดในใบเสนอราคาเรียบร้อยแล้ว');
  };

  // Calculate current totals
  const hardwareList = job.quotation?.hardwareItems || [];
  const serviceList = job.quotation?.serviceItems || [];
  const totalItemsCount = hardwareList.length + serviceList.length;
  const hwTotal = hardwareList.reduce((sum, i) => sum + (i.amount || 0), 0);
  const feeAmount = Math.round(hwTotal * feeRate);
  const svTotal = serviceList.reduce((sum, i) => sum + (i.amount || 0), 0);
  const grandTotal = hwTotal + feeAmount + svTotal;

  // Generate quick estimate WhatsApp message
  const generateEstimateWhatsAppMsg = () => {
    const isMissedOnly =
      hardwareList.length === 0 &&
      serviceList.length > 0 &&
      serviceList.every(
        (s) =>
          s.description.toLowerCase().includes('missed') ||
          s.description.toLowerCase().includes('cancellation') ||
          s.detail.includes('ผิดนัด') ||
          s.detail.includes('สงวนเวลา')
      );

    const hwText = hardwareList
      .map((h) => `• ${h.descriptionEn}: ${h.qty} ${h.unit} @ ฿${h.amount.toLocaleString()}`)
      .join('\n');
    const svText = serviceList
      .map((s) => `• ${s.description}: ฿${s.amount.toLocaleString()}`)
      .join('\n');

    if (isMissedOnly) {
      return `🏛️ *PHUKET TRUSTED LOCAL — Official Notice: Cancellation / Missed Appointment Fee*
----------------------------------------
📍 *Villa:* ${job.villaName || job.propertyLocation}
👤 *Client:* ${job.customerName}
📋 *Invoice / Quotation Ref:* ${job.quotation.refNo}

Dear ${job.customerName},

Please find attached our quotation for the scheduled technician appointment:
${svText}

💰 *Total Amount Due:* ฿${grandTotal.toLocaleString()} THB

*Appointment Policy Notice:*
As the technician is scheduled specifically for your property (Dedicated Technician Time & Route Allocation), cancellations with less than 24 hours’ notice or missed access appointments are subject to the Cancellation / Missed Appointment Fee of THB 1,000 per visit.

For the next appointment, an advance Appointment Deposit of THB 1,000 will be credited directly towards your final installation/service.

Thank you for your understanding and cooperation.
_Phuket Trusted Local Management_`;
    }

    return `🏛️ *PHUKET TRUSTED LOCAL — Additional Estimate Notice*
----------------------------------------
📍 *Villa:* ${job.villaName || job.propertyLocation}
👤 *Client:* ${job.customerName}
📋 *Quotation Ref:* ${job.quotation.refNo}

Dear ${job.customerName},
Following our on-site inspection today, we identified additional items required for full peace of mind:

${hwText ? `🔧 *Hardware & Replacement Parts:*\n${hwText}\n` : ''}
${svText ? `⚙️ *Technical Labor & Services:*\n${svText}\n` : ''}
💰 *Estimated Total:* ฿${grandTotal.toLocaleString()} (Includes ${feePct}% Procurement & Coordination Fee)

📁 *High-Res Photo Log:* ${job.driveFolderUrl || 'Available on request'}

Please reply "APPROVED" to confirm procurement and schedule completion.
_Mr. Big & PTL Engineering Support_`;
  };

  const handleCopyWhatsApp = () => {
    const text = generateEstimateWhatsAppMsg();
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(generateEstimateWhatsAppMsg());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto w-full max-w-full">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200 min-w-0">
        <button
          onClick={onClose}
          className="absolute top-3.5 sm:top-4 right-3.5 sm:right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                จัดการและประเมินรายการราคา (Quick Estimate)
              </h2>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                +ค่าจัดหา {feePct}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              แก้ไข/ลบรายการที่มีอยู่ เพิ่มสูตรด่วนหน้างานภูเก็ต หรือตั้งค่าผิดนัดหมาย ฿1,000 รายการเดียวได้ทันที
            </p>
          </div>
        </div>

        {/* Toast Notification */}
        {addedNotice && (
          <div className="mb-3.5 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{addedNotice}</span>
          </div>
        )}

        {/* Live Quotation Summary Bar */}
        <div className="bg-slate-900 text-white rounded-xl p-3 sm:p-3.5 mb-3.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div>
            <div className="text-[11px] text-slate-300">
              สถานะใบเสนอราคาปัจจุบัน ({job.quotation?.refNo || 'Ref N/A'})
            </div>
            <div className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>฿{grandTotal.toLocaleString()} บาท</span>
              <span className="text-xs text-amber-300 font-medium">
                (อะไหล่ {hardwareList.length} รายการ · บริการ {serviceList.length} รายการ)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'items'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>ดูรายการ ({totalItemsCount})</span>
            </button>
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            >
              {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>คัดลอกข้อความ</span>
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ส่ง WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mb-4 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'items'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <span>1. รายการในเอกสาร</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'items' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {totalItemsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>2. เพิ่มจากสูตรด่วน</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'presets' ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {COMMON_PRESETS.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>3. พิมพ์เพิ่มเอง</span>
          </button>
        </div>

        {/* TAB 1: Current Items (Manage, Edit, Delete) */}
        {activeTab === 'items' && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📋 จัดการรายการในใบเสนอราคา ({totalItemsCount} รายการ)</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSetOnlyMissedFee(1000)}
                  className="text-[11px] bg-rose-700 hover:bg-rose-800 text-white font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                  title="ลบรายการอื่นออกทั้งหมด และตั้งเป็นค่าผิดนัด ฿1,000 รายการเดียวทันที"
                >
                  <span>⏱️ เหลือเฉพาะค่าผิดนัด ฿1,000</span>
                </button>
                {totalItemsCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllItems}
                    className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    ล้างทั้งหมด
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มรายการ</span>
                </button>
              </div>
            </div>

            {/* Empty State */}
            {totalItemsCount === 0 ? (
              <div className="text-center py-8 px-4 bg-white rounded-xl border border-dashed border-slate-300">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-2">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-800 mb-1">
                  ยังไม่มีรายการในใบเสนอราคานี้
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  คุณสามารถเลือกสูตรด่วนพบบ่อยหน้างานภูเก็ต หรือพิมพ์รายการใหม่เองได้ทันที
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('presets')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>เลือกจากสูตรด่วนยอดนิยม</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetOnlyMissedFee(1000)}
                    className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>⏱️ ตั้งค่าผิดนัดหมาย ฿1,000 ทันที</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('custom')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>พิมพ์เพิ่มเอง</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {/* 1. Service Items List */}
                {serviceList.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>งานบริการ &amp; ค่าธรรมเนียม ({serviceList.length})</span>
                      <span className="text-slate-500 font-mono font-normal">
                        รวม ฿{svTotal.toLocaleString()}
                      </span>
                    </div>

                    {serviceList.map((item, idx) => {
                      const isMissed =
                        item.description.toLowerCase().includes('missed') ||
                        item.description.toLowerCase().includes('cancellation') ||
                        item.detail.includes('ผิดนัด') ||
                        item.detail.includes('สงวนเวลา');

                      const isEditing = editingServiceIndex === idx;

                      if (isEditing) {
                        return (
                          <div
                            key={`editing-service-${idx}`}
                            className="p-3 rounded-xl border-2 border-blue-400 bg-blue-50/40 space-y-2.5 transition-all shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>กำลังแก้ไขรายการบริการ #{item.item || idx + 1}</span>
                              </span>
                              <span className="text-[10px] text-blue-700 font-medium">
                                รายละเอียดงานบริการ
                              </span>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                  ชื่องานภาษาอังกฤษ (English Title) *
                                </label>
                                <input
                                  type="text"
                                  value={editServiceDesc}
                                  onChange={(e) => setEditServiceDesc(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                  รายละเอียดภาษาไทย (Thai Description)
                                </label>
                                <textarea
                                  value={editServiceDetail}
                                  onChange={(e) => setEditServiceDetail(e.target.value)}
                                  rows={2}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                    จำนวน / หน่วย
                                  </label>
                                  <input
                                    type="text"
                                    value={editServiceQty}
                                    onChange={(e) => setEditServiceQty(e.target.value)}
                                    placeholder="เช่น 1 ครั้ง (Visit)"
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                    ยอดเงินรวม (฿ THB) *
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="50"
                                    value={editServiceAmount}
                                    onChange={(e) => setEditServiceAmount(Number(e.target.value))}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-blue-200">
                              <button
                                type="button"
                                onClick={handleCancelEditService}
                                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                              >
                                ยกเลิก
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditService(idx)}
                                className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>บันทึกการแก้ไข</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`service-${item.item}-${idx}`}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                            isMissed
                              ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                                #{item.item || idx + 1}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  isMissed
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isMissed ? '⏱️ ค่าผิดนัดหมาย' : 'งานบริการ (Labor)'}
                              </span>
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {item.description}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                              {item.detail}
                            </div>
                            {item.qty && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                จำนวน: {item.qty} {item.estimatedSchedule ? `• ${item.estimatedSchedule}` : ''}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right pr-1">
                              <div className="text-xs font-bold text-slate-900 font-mono">
                                ฿{item.amount.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400">บาท</div>
                            </div>

                            {/* Action Buttons: Edit & Delete */}
                            <button
                              type="button"
                              onClick={() => handleStartEditService(idx, item)}
                              className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                              title={`แก้ไขรายการ "${item.description}"`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">แก้ไข</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteServiceItem(idx)}
                              className="px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                              title={`ลบรายการ "${item.description}" ออก`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">ลบ</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Hardware Items List */}
                {hardwareList.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>อะไหล่และอุปกรณ์จัดซื้อ ({hardwareList.length})</span>
                      <span className="text-slate-500 font-mono font-normal">
                        รวม ฿{hwTotal.toLocaleString()} (+ค่าจัดหา ฿{feeAmount.toLocaleString()})
                      </span>
                    </div>

                    {hardwareList.map((item, idx) => {
                      const isEditing = editingHardwareIndex === idx;

                      if (isEditing) {
                        return (
                          <div
                            key={`editing-hardware-${idx}`}
                            className="p-3 rounded-xl border-2 border-blue-400 bg-blue-50/40 space-y-2.5 transition-all shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>กำลังแก้ไขรายการอะไหล่ #{item.item || idx + 1}</span>
                              </span>
                              <span className="text-[10px] text-blue-700 font-medium">
                                อะไหล่ &amp; จัดซื้ออุปกรณ์
                              </span>
                            </div>

                            <div className="space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                    ชื่ออุปกรณ์ภาษาไทย *
                                  </label>
                                  <input
                                    type="text"
                                    value={editHwDescTh}
                                    onChange={(e) => setEditHwDescTh(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                    ชื่ออุปกรณ์ภาษาอังกฤษ (English)
                                  </label>
                                  <input
                                    type="text"
                                    value={editHwDescEn}
                                    onChange={(e) => setEditHwDescEn(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-sans"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                    จำนวน
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={editHwQty}
                                    onChange={(e) => setEditHwQty(Number(e.target.value))}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                    หน่วย
                                  </label>
                                  <input
                                    type="text"
                                    value={editHwUnit}
                                    onChange={(e) => setEditHwUnit(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                    ราคาต่อหน่วย (฿)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="50"
                                    value={editHwUnitPrice}
                                    onChange={(e) => setEditHwUnitPrice(Number(e.target.value))}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                  แหล่งจัดซื้อในภูเก็ต (Sourcing Channel)
                                </label>
                                <input
                                  type="text"
                                  value={editHwSourcing}
                                  onChange={(e) => setEditHwSourcing(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                                />
                              </div>

                              <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                                <span>
                                  ยอดรวมเฉพาะรายการนี้: <strong>฿{(editHwQty * editHwUnitPrice).toLocaleString()}</strong>
                                </span>
                                <span className="text-amber-800">
                                  +ค่าจัดหา {feePct}% (฿{Math.round(editHwQty * editHwUnitPrice * feeRate).toLocaleString()})
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-blue-200">
                              <button
                                type="button"
                                onClick={handleCancelEditHardware}
                                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                              >
                                ยกเลิก
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditHardware(idx)}
                                className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>บันทึกการแก้ไข</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`hardware-${item.item}-${idx}`}
                          className="p-2.5 rounded-xl border bg-white border-slate-200 hover:border-slate-300 flex items-center justify-between gap-2.5 transition-all"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                                #{item.item || idx + 1}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                อะไหล่ (Hardware)
                              </span>
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {item.descriptionTh || item.descriptionEn}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                              {item.descriptionEn}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {item.qty} {item.unit} × ฿{item.unitPrice.toLocaleString()}{' '}
                              {item.sourcingChannel ? `• แหล่งซื้อ: ${item.sourcingChannel}` : ''}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right pr-1">
                              <div className="text-xs font-bold text-slate-900 font-mono">
                                ฿{item.amount.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-amber-700">
                                +ค่าจัดหา ฿{Math.round(item.amount * feeRate).toLocaleString()}
                              </div>
                            </div>

                            {/* Action Buttons: Edit & Delete */}
                            <button
                              type="button"
                              onClick={() => handleStartEditHardware(idx, item)}
                              className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                              title={`แก้ไขรายการ "${item.descriptionTh || item.descriptionEn}"`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">แก้ไข</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteHardwareItem(idx)}
                              className="px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                              title={`ลบรายการ "${item.descriptionTh || item.descriptionEn}" ออก`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">ลบ</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Presets Selection */}
        {activeTab === 'presets' && (
          <div className="mb-4">
            {/* Category Filters */}
            <div className="mb-3">
              <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                <span>⚡ เลือกรายการพบบ่อยหน้างานภูเก็ตเพื่อเพิ่มเข้าใบเสนอราคา:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'ทั้งหมด (All)' },
                  { id: 'missed', label: '⏱️ ค่าผิดนัด/สงวนเวลาช่าง (฿1,000)' },
                  { id: 'electrical', label: '⚡ ระบบไฟ/เบรกเกอร์' },
                  { id: 'plumbing', label: '💧 ปั๊มน้ำ/ประปา' },
                  { id: 'aircon', label: '❄️ เครื่องปรับอากาศ' },
                  { id: 'service', label: '🔧 ค่าแรง/ตรวจซ่อม' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? cat.id === 'missed'
                          ? 'bg-rose-700 text-white shadow-2xs'
                          : 'bg-[#102a4e] text-white shadow-2xs'
                        : cat.id === 'missed'
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Policy Guidance Banner for Missed Appointments */}
            {selectedCategory === 'missed' && (
              <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                  <span>🏛️ นโยบาย Phuket Trusted Local (Cancellation / Missed Appointment Fee):</span>
                </div>
                <p className="leading-relaxed">
                  • <strong>ห้ามใช้คำว่า Penalty</strong> กับลูกค้า: ให้ใช้คำว่า{' '}
                  <strong>Cancellation / Missed Appointment Fee</strong> เพื่อสะท้อนถึงค่าบริการจัดสรรเวลาและความเชี่ยวชาญของช่างเฉพาะวิลล่า (Dedicated Technician Time &amp; Opportunity Cost)
                </p>
                <p className="leading-relaxed">
                  • <strong>แยก 3 รายการโปร่งใสเสมอ:</strong> 1) Replacement / Installation, 2) Travel / Call-out, 3) Missed Appointment Fee (฿1,000) แยกบรรทัดชัดเจนในเอกสาร
                </p>
                <p className="leading-relaxed text-[11px] text-amber-900/90 font-medium">
                  • <strong>ครั้งถัดไป:</strong> แนะนำเรียกเก็บ <strong>Appointment Deposit ฿1,000</strong> ล่วงหน้าก่อนเข้างาน (หักจากค่าบริการจริงเมื่องานเสร็จ) ป้องกันไม่ต้องตามทวงเงินทีหลัง
                </p>
              </div>
            )}

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {filteredPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/40 transition-all flex flex-col justify-between gap-1.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          preset.type === 'hardware'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {preset.type === 'hardware' ? 'อะไหล่ (Hardware)' : 'บริการ (Labor)'}
                      </span>
                      <span className="text-xs font-extrabold text-[#102a4e]">
                        ฿{preset.defaultPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-1">{preset.titleTh}</div>
                    <div className="text-[10px] text-slate-500 font-mono line-clamp-1">
                      {preset.titleEn}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400 truncate">
                      {preset.sourcing || 'สต็อกภูเก็ต'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddPreset(preset)}
                      className="inline-flex items-center gap-1 text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ เพิ่มรายการนี้</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Custom Input Form */}
        {activeTab === 'custom' && (
          <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200 mb-4">
            <div className="text-xs font-bold text-slate-900 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>พิมพ์เพิ่มรายการเอง (Custom Additional Item)</span>
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setItemType('hardware')}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                    itemType === 'hardware' ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  ค่าอุปกรณ์
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('service')}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                    itemType === 'service' ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  ค่าบริการ/แรง
                </button>
              </div>
            </div>

            <form onSubmit={handleAddCustom} className="space-y-2.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    ชื่อรายการ (ภาษาไทย) *
                  </label>
                  <input
                    type="text"
                    value={customTitleTh}
                    onChange={(e) => setCustomTitleTh(e.target.value)}
                    placeholder="เช่น เปลี่ยนก๊อกผสมน้ำอุ่น Rain Shower"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    คำแปลภาษาอังกฤษ (สำหรับลูกค้าต่างชาติ)
                  </label>
                  <input
                    type="text"
                    value={customTitleEn}
                    onChange={(e) => setCustomTitleEn(e.target.value)}
                    placeholder="e.g. Rain Shower Mixer Valve Replacement"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    จำนวน
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    หน่วย
                  </label>
                  <input
                    type="text"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="เช่น ตัว, จุด, งาน"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    ราคาต่อหน่วย (฿)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden font-bold text-slate-900"
                  />
                </div>
              </div>

              {itemType === 'hardware' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    แหล่งจัดหาในภูเก็ต (Sourcing Channel)
                  </label>
                  <input
                    type="text"
                    value={customSourcing}
                    onChange={(e) => setCustomSourcing(e.target.value)}
                    placeholder="เช่น HomePro Thalang, Global House, ไทวัสดุ"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden text-xs"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-500">
                  รวมเฉพาะรายการนี้: <strong className="text-slate-800">฿{(customQty * customPrice).toLocaleString()}</strong>
                  {itemType === 'hardware' && (
                    <span> (+ค่าจัดหา {feePct}% = ฿{Math.round(customQty * customPrice * feeRate).toLocaleString()})</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="bg-[#102a4e] hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer active:scale-95"
                >
                  <Check className="w-3.5 h-3.5 text-sky-300" />
                  <span>+ บันทึกลงใบเสนอราคาทันที</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
          >
            ปิดหน้าต่างนี้
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs bg-[#102a4e] hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            เรียบร้อย (ดูใบเสนอราคา &amp; เอกสาร)
          </button>
        </div>
      </div>
    </div>
  );
};
