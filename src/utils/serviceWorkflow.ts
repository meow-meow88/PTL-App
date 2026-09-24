import {
  HomeWatchChecklistItem,
  WorkflowPreset,
  EvidencePhoto,
  InspectionJob,
} from '../types';

export interface ServiceCapabilities {
  checklist?: boolean;
  homeWatchChecklist?: boolean;
  photos?: boolean;
  findings?: boolean;
  report?: boolean;
  location?: boolean;
  vendor?: boolean;
  vendorEta?: boolean;
  appointment?: boolean;
  quote?: boolean;
  payment?: boolean;
  materials?: boolean;
  expenses?: boolean;
  beforeAfterPhotos?: boolean;
  mollyHardware?: boolean;
  customerContact?: boolean;
  notes?: boolean;
  followUpJob?: boolean;
}

export interface ServiceDefinition {
  id: string;
  name: string;
  nameEn: string;
  nameTh: string;
  category: 'home' | 'technical' | 'assistance' | 'coordination' | 'other';
  workflowPreset: WorkflowPreset;
  defaultPrice: number;
  iconName: string;
  descriptionEn: string;
  descriptionTh: string;
  capabilities: ServiceCapabilities;
}

export const PTL_SERVICES: ServiceDefinition[] = [
  // 1. HOME & PROPERTY
  {
    id: 'home_watch',
    name: 'Home Watch',
    nameEn: 'Home Watch',
    nameTh: 'ตรวจบ้านประจำงวด (Home Watch)',
    category: 'home',
    workflowPreset: 'VISIT',
    defaultPrice: 1500,
    iconName: 'ShieldCheck',
    descriptionEn: 'Scheduled villa inspection & condition documentation',
    descriptionTh: 'ตรวจสภาพวิลล่า บันทึกจุดตรวจ และออกรายงานสภาพบ้าน',
    capabilities: {
      homeWatchChecklist: true,
      photos: true,
      findings: true,
      report: true,
      followUpJob: true,
      location: true,
      customerContact: true,
      appointment: true,
      payment: true,
      quote: true,
      notes: true,
    },
  },
  {
    id: 'property_visit',
    name: 'Property Visit',
    nameEn: 'Property Visit',
    nameTh: 'เข้าตรวจดูทรัพย์สิน',
    category: 'home',
    workflowPreset: 'VISIT',
    defaultPrice: 1500,
    iconName: 'Building2',
    descriptionEn: 'On-site property inspection or client walkthrough',
    descriptionTh: 'เข้าดูสถานที่หน้างาน ตรวจสอบทั่วไปตามคำขอ',
    capabilities: {
      notes: true,
      photos: true,
      findings: true,
      report: true,
      location: true,
      customerContact: true,
      appointment: true,
      payment: true,
      quote: true,
      expenses: true,
    },
  },
  {
    id: 'property_coordination',
    name: 'Property Coordination',
    nameEn: 'Property Coordination',
    nameTh: 'ประสานงานดูแลวิลล่า',
    category: 'home',
    workflowPreset: 'COORDINATION',
    defaultPrice: 1200,
    iconName: 'Briefcase',
    descriptionEn: 'Coordination with villa management, guards, or staff',
    descriptionTh: 'ประสานงานนิติบุคคล รปภ. หรือผู้จัดการวิลล่า',
    capabilities: {
      vendor: true,
      appointment: true,
      quote: true,
      payment: true,
      photos: true,
      expenses: true,
      notes: true,
      location: true,
      customerContact: true,
    },
  },
  {
    id: 'key_access',
    name: 'Key / Access Assistance',
    nameEn: 'Key / Access Assistance',
    nameTh: 'ดูแลกุญแจ / เปิดบ้านให้ช่าง',
    category: 'home',
    workflowPreset: 'ASSISTANCE',
    defaultPrice: 800,
    iconName: 'Key',
    descriptionEn: 'Lockbox access, key handover, or guest check-in support',
    descriptionTh: 'เปิดบ้าน ส่งมอบกุญแจ หรือดูแลตู้กุญแจรหัส',
    capabilities: {
      appointment: true,
      location: true,
      customerContact: true,
      notes: true,
      photos: true,
      payment: true,
      expenses: true,
      quote: true,
    },
  },

  // 2. TECHNICAL
  {
    id: 'internet_wifi',
    name: 'Internet / WiFi',
    nameEn: 'Internet / WiFi',
    nameTh: 'แก้ไขอินเทอร์เน็ต / WiFi',
    category: 'technical',
    workflowPreset: 'TECHNICAL',
    defaultPrice: 1500,
    iconName: 'Wifi',
    descriptionEn: 'Router diagnostics, ISP escalation & connectivity test',
    descriptionTh: 'แก้ปัญหาเน็ตหลุด เร้าเตอร์เสีย ประสานงาน 3BB/AIS/True',
    capabilities: {
      photos: true,
      findings: true,
      vendor: true,
      quote: true,
      payment: true,
      materials: true,
      notes: true,
      location: true,
      customerContact: true,
      report: true,
      expenses: true,
    },
  },
  {
    id: 'cctv',
    name: 'CCTV',
    nameEn: 'CCTV',
    nameTh: 'กล้องวงจรปิด CCTV',
    category: 'technical',
    workflowPreset: 'TECHNICAL',
    defaultPrice: 2000,
    iconName: 'Camera',
    descriptionEn: 'Camera offline, NVR replacement, hardware sourcing',
    descriptionTh: 'กล้องดับ ดูออนไลน์ไม่ได้ เปลี่ยนฮาร์ดแวร์ NVR',
    capabilities: {
      photos: true,
      findings: true,
      mollyHardware: true,
      materials: true,
      quote: true,
      payment: true,
      expenses: true,
      notes: true,
      location: true,
      customerContact: true,
      report: true,
    },
  },
  {
    id: 'smart_home',
    name: 'Smart Home',
    nameEn: 'Smart Home',
    nameTh: 'ระบบบ้านอัจฉริยะ (Smart Home)',
    category: 'technical',
    workflowPreset: 'TECHNICAL',
    defaultPrice: 2500,
    iconName: 'Cpu',
    descriptionEn: 'Automated lighting, gate controller & Tuya/Aqara setup',
    descriptionTh: 'สวิตช์ไฟ ประตูรีโมท เซ็นเซอร์ และระบบควบคุมอัตโนมัติ',
    capabilities: {
      photos: true,
      findings: true,
      mollyHardware: true,
      materials: true,
      quote: true,
      payment: true,
      expenses: true,
      notes: true,
      location: true,
      customerContact: true,
      report: true,
    },
  },
  {
    id: 'electrical',
    name: 'Electrical',
    nameEn: 'Electrical',
    nameTh: 'ระบบไฟฟ้า / เบรกเกอร์ตัด',
    category: 'technical',
    workflowPreset: 'TECHNICAL',
    defaultPrice: 1500,
    iconName: 'Zap',
    descriptionEn: 'Tripped breaker, short circuit or pump power check',
    descriptionTh: 'ไฟดับ ไฟทริป ช็อต เช็คเมนเบรกเกอร์หน้างาน',
    capabilities: {
      photos: true,
      findings: true,
      materials: true,
      quote: true,
      payment: true,
      expenses: true,
      notes: true,
      location: true,
      customerContact: true,
      report: true,
    },
  },
  {
    id: 'other_technical',
    name: 'Other Technical',
    nameEn: 'Other Technical',
    nameTh: 'งานระบบเทคนิคอื่นๆ',
    category: 'technical',
    workflowPreset: 'TECHNICAL',
    defaultPrice: 1500,
    iconName: 'Wrench',
    descriptionEn: 'Sound system, pool tech, or specialized villa equipment',
    descriptionTh: 'งานระบบเสียง ทีวี ปั๊มน้ำ หรืออุปกรณ์เฉพาะทาง',
    capabilities: {
      photos: true,
      findings: true,
      materials: true,
      quote: true,
      payment: true,
      expenses: true,
      notes: true,
      location: true,
      customerContact: true,
      report: true,
    },
  },

  // 3. PERSONAL ASSISTANCE
  {
    id: 'roadside_tire',
    name: 'Roadside / Tire Assistance',
    nameEn: 'Roadside / Tire Assistance',
    nameTh: 'ช่วยเหลือฉุกเฉิน / ยางรั่ว ยางแบน',
    category: 'assistance',
    workflowPreset: 'ASSISTANCE',
    defaultPrice: 1800,
    iconName: 'Disc',
    descriptionEn: 'Urgent flat tire replacement & roadside rescue in Phuket',
    descriptionTh: 'ประสานช่างปะยาง เปลี่ยนยางเร่งด่วน ไปดูแลหน้างาน',
    capabilities: {
      location: true,
      vendor: true,
      vendorEta: true,
      quote: true,
      payment: true,
      beforeAfterPhotos: true,
      photos: true,
      customerContact: true,
      notes: true,
      expenses: true,
    },
  },
  {
    id: 'hospital_doctor',
    name: 'Hospital / Doctor',
    nameEn: 'Hospital / Doctor',
    nameTh: 'พาพบแพทย์ / ช่วยเหลือโรงพยาบาล',
    category: 'assistance',
    workflowPreset: 'ASSISTANCE',
    defaultPrice: 1500,
    iconName: 'HeartPulse',
    descriptionEn: 'Hospital transport, interpretation assistance, appointment',
    descriptionTh: 'รับส่งโรงพยาบาล ช่วยแปล ประสานงานแพทย์กรุงเทพภูเก็ต/สิริโรจน์',
    capabilities: {
      appointment: true,
      location: true,
      customerContact: true,
      notes: true,
      expenses: true,
      payment: true,
      quote: true,
    },
  },
  {
    id: 'pet_vet',
    name: 'Pet / Vet',
    nameEn: 'Pet / Vet',
    nameTh: 'พาสัตว์เลี้ยงพบสัตวแพทย์',
    category: 'assistance',
    workflowPreset: 'ASSISTANCE',
    defaultPrice: 1200,
    iconName: 'Smile',
    descriptionEn: 'Vet visit, pet medicine pickup or clinic escort',
    descriptionTh: 'พาน้องหมาน้องแมวหาหมอ คลินิกรักษาสัตว์ ซื้อยา',
    capabilities: {
      appointment: true,
      location: true,
      notes: true,
      expenses: true,
      customerContact: true,
      payment: true,
      quote: true,
    },
  },
  {
    id: 'transportation',
    name: 'Transportation',
    nameEn: 'Transportation',
    nameTh: 'บริการรับส่ง / เดินทาง',
    category: 'assistance',
    workflowPreset: 'ASSISTANCE',
    defaultPrice: 1000,
    iconName: 'Car',
    descriptionEn: 'Airport transfer, island errand, private driver coordination',
    descriptionTh: 'รับส่งสนามบิน หรือขับพาทำธุระรอบเกาะภูเก็ต',
    capabilities: {
      appointment: true,
      location: true,
      customerContact: true,
      notes: true,
      expenses: true,
      payment: true,
      quote: true,
    },
  },
  {
    id: 'appointment_assistance',
    name: 'Appointment Assistance',
    nameEn: 'Appointment Assistance',
    nameTh: 'ดูแลการนัดหมาย / ทำธุระแทน',
    category: 'assistance',
    workflowPreset: 'ASSISTANCE',
    defaultPrice: 1000,
    iconName: 'CalendarCheck',
    descriptionEn: 'Immigration queue, government office or utility bill errand',
    descriptionTh: 'ต่อวีซ่า ตม. ชำระค่าน้ำค่าไฟ ติดต่องานราชการ',
    capabilities: {
      appointment: true,
      location: true,
      customerContact: true,
      notes: true,
      expenses: true,
      payment: true,
      quote: true,
    },
  },
  {
    id: 'general_assistance',
    name: 'General Assistance',
    nameEn: 'General Assistance',
    nameTh: 'ช่วยเหลือทั่วไปตามคำขอ',
    category: 'assistance',
    workflowPreset: 'ASSISTANCE',
    defaultPrice: 1000,
    iconName: 'LifeBuoy',
    descriptionEn: 'Any urgent or custom personal task requested by client',
    descriptionTh: 'บริการช่วยเหลือตามที่ลูกค้าร้องขอ ยืดหยุ่นคล่องตัว',
    capabilities: {
      appointment: true,
      location: true,
      customerContact: true,
      notes: true,
      expenses: true,
      payment: true,
      quote: true,
      photos: true,
    },
  },

  // 4. VENDOR COORDINATION
  {
    id: 'vendor_coordination',
    name: 'Vendor Coordination',
    nameEn: 'Vendor Coordination',
    nameTh: 'ประสานงานช่าง / ควบคุมงาน',
    category: 'coordination',
    workflowPreset: 'COORDINATION',
    defaultPrice: 1200,
    iconName: 'Users',
    descriptionEn: 'Locate vendor, manage quote, oversee on-site works',
    descriptionTh: 'หาช่าง คุมงานซ่อม ตรวจรับงาน ถ่ายรูปรายงานลูกค้า',
    capabilities: {
      vendor: true,
      appointment: true,
      quote: true,
      payment: true,
      photos: true,
      expenses: true,
      notes: true,
      location: true,
      customerContact: true,
    },
  },
  {
    id: 'repair_supervision',
    name: 'Repair Supervision',
    nameEn: 'Repair Supervision',
    nameTh: 'ควบคุมการซ่อมแซมวิลล่า',
    category: 'coordination',
    workflowPreset: 'COORDINATION',
    defaultPrice: 1500,
    iconName: 'Hammer',
    descriptionEn: 'Plumbing, painting, aircon deep cleaning supervision',
    descriptionTh: 'คุมช่างแอร์ ช่างประปา ช่างทาสี ช่างกระเบื้อง',
    capabilities: {
      vendor: true,
      appointment: true,
      quote: true,
      payment: true,
      photos: true,
      findings: true,
      expenses: true,
      notes: true,
      location: true,
      customerContact: true,
      report: true,
    },
  },
  {
    id: 'delivery_installation',
    name: 'Delivery / Installation Supervision',
    nameEn: 'Delivery / Installation Supervision',
    nameTh: 'รับของ / คุมการติดตั้งเฟอร์นิเจอร์',
    category: 'coordination',
    workflowPreset: 'COORDINATION',
    defaultPrice: 1000,
    iconName: 'Truck',
    descriptionEn: 'Receive appliance/furniture delivery & confirm installation',
    descriptionTh: 'อยู่รับของ จัดส่งเครื่องใช้ไฟฟ้า หรือเฟอร์นิเจอร์',
    capabilities: {
      vendor: true,
      appointment: true,
      quote: true,
      payment: true,
      photos: true,
      notes: true,
      location: true,
      customerContact: true,
      expenses: true,
    },
  },

  // 5. OTHER
  {
    id: 'custom_job',
    name: 'Custom Job',
    nameEn: 'Custom Job',
    nameTh: 'งานเฉพาะกิจ (กำหนดเอง)',
    category: 'other',
    workflowPreset: 'GENERAL',
    defaultPrice: 1500,
    iconName: 'PlusCircle',
    descriptionEn: 'Flexible custom job tailored directly to client request',
    descriptionTh: 'งานบริการตามตกลง ปรับเปลี่ยนได้ตามต้องการ',
    capabilities: {
      notes: true,
      location: true,
      customerContact: true,
      appointment: true,
      photos: true,
      findings: true,
      quote: true,
      payment: true,
      expenses: true,
      report: true,
    },
  },
];

/**
 * Determine workflow preset from service name
 */
export function getWorkflowPresetForService(serviceName: string): WorkflowPreset {
  if (!serviceName) return 'GENERAL';
  const clean = serviceName.toLowerCase();

  if (clean.includes('home watch') || clean.includes('property visit') || clean.includes('ตรวจบ้าน')) {
    return 'VISIT';
  }
  if (clean.includes('tire') || clean.includes('roadside') || clean.includes('hospital') || clean.includes('pet') || clean.includes('transport') || clean.includes('appointment') || clean.includes('ยางแบน') || clean.includes('แพทย์')) {
    return 'ASSISTANCE';
  }
  if (clean.includes('cctv') || clean.includes('wifi') || clean.includes('internet') || clean.includes('smart') || clean.includes('electric') || clean.includes('กล้อง')) {
    return 'TECHNICAL';
  }
  if (clean.includes('vendor') || clean.includes('repair') || clean.includes('delivery') || clean.includes('supervision') || clean.includes('ประสานงาน')) {
    return 'COORDINATION';
  }

  const found = PTL_SERVICES.find((s) => s.name.toLowerCase() === clean || s.nameTh.toLowerCase() === clean);
  return found?.workflowPreset || 'GENERAL';
}

/**
 * Maps any service name or ID to a clean, localized display title.
 * Prevents internal labels like "INSPECTION" from being shown as the service name.
 */
export function getLocalizedServiceName(serviceType?: string, lang: 'en' | 'th' = 'en'): string {
  if (!serviceType) return lang === 'th' ? 'งานบริการ' : 'Service';
  const clean = serviceType.trim();
  const lower = clean.toLowerCase();
  const isTh = lang === 'th';

  // Prevent internal capability name "INSPECTION" from being shown as the service name
  if (lower === 'inspection' || lower === 'inspection job' || lower === 'general inspection') {
    return isTh ? 'ตรวจบ้านประจำงวด' : 'Home Watch';
  }

  // Exact or partial match with PTL Services catalog
  const found = PTL_SERVICES.find(
    (s) =>
      s.id.toLowerCase() === lower ||
      s.name.toLowerCase() === lower ||
      s.nameTh.toLowerCase() === lower ||
      lower.includes(s.name.toLowerCase()) ||
      lower.includes(s.id.toLowerCase())
  );

  if (found) {
    if (isTh) {
      // Return clean Thai without redundant parentheticals if possible
      return found.nameTh.replace(/\s*\([^)]*\)/g, '').trim() || found.nameTh;
    }
    return found.name;
  }

  // Common Phuket services translation dictionary
  if (lower.includes('smart home') || lower.includes('สมาร์ทโฮม')) {
    return isTh ? 'สมาร์ทโฮม' : 'Smart Home';
  }
  if (lower.includes('cctv') || lower.includes('กล้องวงจรปิด')) {
    return isTh ? 'กล้องวงจรปิด' : 'CCTV';
  }
  if (lower.includes('home watch') || lower.includes('ตรวจบ้าน')) {
    return isTh ? 'ตรวจบ้านประจำงวด' : 'Home Watch';
  }
  if (lower.includes('aircon') || lower.includes('แอร์')) {
    return isTh ? 'ประสานงานช่างแอร์' : 'Aircon Coordination';
  }
  if (lower.includes('roadside') || lower.includes('tire') || lower.includes('ยาง')) {
    return isTh ? 'ช่วยเหลือฉุกเฉิน' : 'Roadside Assistance';
  }
  if (lower.includes('pet') || lower.includes('สัตว์เลี้ยง')) {
    return isTh ? 'ช่วยเหลือสัตว์เลี้ยง' : 'Pet Assistance';
  }
  if (lower.includes('hospital') || lower.includes('โรงพยาบาล')) {
    return isTh ? 'ประสานงานพาไปโรงพยาบาล' : 'Hospital Assistance';
  }
  if (lower.includes('electric') || lower.includes('ไฟฟ้า')) {
    return isTh ? 'แก้ไขระบบไฟฟ้า' : 'Electrical Troubleshooting';
  }
  if (lower.includes('pump') || lower.includes('plumb') || lower.includes('ปั๊มน้ำ')) {
    return isTh ? 'ระบบปั๊มน้ำและประปา' : 'Water Pump / Plumbing';
  }
  if (lower.includes('wifi') || lower.includes('internet') || lower.includes('เน็ต')) {
    return isTh ? 'ติดตั้งไวไฟและอินเทอร์เน็ต' : 'WiFi / Internet Setup';
  }
  if (lower.includes('visit') || lower.includes('เข้าตรวจ')) {
    return isTh ? 'เข้าตรวจดูทรัพย์สิน' : 'Property Visit';
  }

  return clean;
}

export type DominantStateKey =
  | 'waiting_scope'
  | 'scope_confirmed'
  | 'quote_drafted'
  | 'waiting_approval'
  | 'waiting_deposit'
  | 'approved_to_schedule'
  | 'scheduled'
  | 'scheduled_unconfirmed'
  | 'scheduled_confirmed'
  | 'in_progress'
  | 'waiting_vendor'
  | 'waiting_payment'
  | 'ready_to_close'
  | 'completed'
  | 'cancelled'
  | 'appointment_unconfirmed'
  | 'new';

export interface DominantJobState {
  key: DominantStateKey;
  label: string;
  badgeClass: string;
}

export interface AppointmentStatusInfo {
  status: 'unscheduled' | 'tentative' | 'confirmed';
  label: string;
  isConfirmed: boolean;
  badgeClass: string;
}

/**
 * Separate appointment confirmation from commercial / customer approval.
 * Controls schedule readiness only.
 */
export function getAppointmentStatus(
  job: InspectionJob,
  lang: 'en' | 'th' = 'en'
): AppointmentStatusInfo {
  const isTh = lang === 'th';
  if (!job.scheduledDate) {
    return {
      status: 'unscheduled',
      label: isTh ? 'ยังไม่ได้นัด' : 'Unscheduled',
      isConfirmed: false,
      badgeClass: 'text-slate-500 bg-slate-100 border-slate-200',
    };
  }
  if (job.appointmentConfirmation === 'Confirmed') {
    return {
      status: 'confirmed',
      label: isTh ? 'นัดยืนยันแล้ว' : 'Confirmed',
      isConfirmed: true,
      badgeClass: 'text-emerald-800 bg-emerald-100 border-emerald-300 font-bold',
    };
  }
  return {
    status: 'tentative',
    label: isTh ? 'นัดยังไม่ยืนยัน' : 'Unconfirmed',
    isConfirmed: false,
    badgeClass: 'text-amber-800 bg-amber-100 border-amber-300 font-bold',
  };
}

/**
 * Evaluates ONE dominant operational state for an owner-facing Job card.
 * STRICTLY SEPARATES commercial/customer approval from appointment confirmation.
 */
export function getDominantJobState(job: InspectionJob, lang: 'en' | 'th' = 'en'): DominantJobState {
  const isTh = lang === 'th';
  // Preserve the original diagnostic path for legacy jobs without a purpose.
  const needsDiagnosis = isTechnicalService(job.serviceType, job) &&
    (!job.jobPurpose || job.jobPurpose === 'INSPECTION_DIAGNOSIS' || job.jobPurpose === 'FAULT_FINDING');

  // 1. Cancelled
  if (job.status === 'Cancelled') {
    return {
      key: 'cancelled',
      label: isTh ? 'ยกเลิก' : 'Cancelled',
      badgeClass: 'bg-slate-200 text-slate-700 font-bold',
    };
  }

  // 2. Completed / Closed
  if (job.status === 'Completed') {
    if (job.waitingOn === 'payment') {
      return {
        key: 'waiting_payment',
        label: isTh ? 'จบงานแล้ว • รอเก็บเงิน' : 'Work Done • Waiting Payment',
        badgeClass: 'bg-rose-100 text-rose-900 border border-rose-300 font-bold',
      };
    }
    return {
      key: 'completed',
      label: isTh ? 'ปิดงานสมบูรณ์' : 'Completed',
      badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
    };
  }

  // 3. Field Work Finished (actualCompletedAt or fieldWorkCompletedAt set)
  const isFieldWorkDone = Boolean(job.actualCompletedAt || job.fieldWorkCompletedAt);
  if (isFieldWorkDone) {
    const isPaid = job.status === 'Paid';
    if (isPaid) {
      return {
        key: 'ready_to_close',
        label: isTh ? 'ชำระเงินครบ • พร้อมปิดงาน' : 'Paid • Ready to Close',
        badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold',
      };
    }
    return {
      key: 'waiting_payment',
      label: isTh ? 'จบงานแล้ว • รอออกบิล/เก็บเงิน' : 'Work Done • Pending Payment',
      badgeClass: 'bg-rose-100 text-rose-900 border border-rose-300 font-bold',
    };
  }

  if (needsDiagnosis && job.scopeConfirmedAt &&
      (!job.customerApprovedAt || job.customerApprovedAt <= job.scopeConfirmedAt)) {
    if (job.quoteSentAt && job.quoteSentAt > job.scopeConfirmedAt) {
      return { key: 'waiting_approval', label: isTh ? 'รอลูกค้าอนุมัติงานซ่อม' : 'Waiting Repair Approval', badgeClass: 'bg-sky-100 text-sky-950 border border-sky-300 font-bold' };
    }
    if (job.repairQuoteDraftedAt && job.repairQuoteDraftedAt > job.scopeConfirmedAt) {
      return { key: 'quote_drafted', label: isTh ? 'ร่างใบเสนอราคาซ่อมแล้ว' : 'Repair Quote Drafted', badgeClass: 'bg-amber-50 text-amber-900 border border-amber-200 font-bold' };
    }
    return { key: 'scope_confirmed', label: isTh ? 'ทำใบเสนอราคางานซ่อม' : 'Prepare Repair Quote', badgeClass: 'bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold' };
  }

  // 4. In Progress: Work actively started on-site
  const isInProgress =
    job.status === 'In Progress' ||
    (!job.scopeConfirmedAt && (Boolean(job.visitStartedAt) || Boolean(job.siteArrivedAt) || Boolean(job.actualStartedAt)));

  if (isInProgress) {
    if (needsDiagnosis) {
      if (job.scopeConfirmed) {
        if (job.customerApprovedAt || job.status === 'Approved') {
          return {
            key: 'in_progress',
            label: isTh ? 'กำลังดำเนินการซ่อม/ติดตั้ง' : 'Repair in Progress',
            badgeClass: 'bg-blue-600 text-white font-bold',
          };
        }
        if (job.quoteSentAt || job.status === 'Quoted' || job.status === 'Waiting Approval') {
          return {
            key: 'waiting_approval',
            label: isTh ? 'รอลูกค้าอนุมัติงานซ่อม' : 'Waiting Repair Approval',
            badgeClass: 'bg-sky-100 text-sky-950 border border-sky-300 font-bold',
          };
        }
        return {
          key: 'scope_confirmed',
          label: isTh ? 'ขอบเขตงานพร้อมเสนอราคาซ่อม' : 'Scope Confirmed • Ready for Molly',
          badgeClass: 'bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold',
        };
      }
      return {
        key: 'in_progress',
        label: isTh ? 'กำลังตรวจเช็กหน้างาน' : 'On-Site Diagnostic',
        badgeClass: 'bg-blue-600 text-white font-bold',
      };
    }

    return {
      key: 'in_progress',
      label: isTh ? 'กำลังดำเนินงาน' : 'In Progress',
      badgeClass: 'bg-blue-600 text-white font-bold',
    };
  }

  // 5. Customer Approved (Commercial Approval achieved)
  const isApproved = Boolean(job.customerApprovedAt || job.status === 'Approved');
  if (isApproved) {
    // Check if advance / material deposit is pending
    const needsDeposit =
      typeof job.materialDepositRequested === 'number' &&
      job.materialDepositRequested > 0 &&
      (!job.materialDepositReceived || job.materialDepositReceived < job.materialDepositRequested);

    if (needsDeposit) {
      return {
        key: 'waiting_deposit',
        label: isTh ? 'รอมัดจำค่าอะไหล่' : 'Waiting Material Deposit',
        badgeClass: 'bg-amber-100 text-amber-950 border border-amber-300 font-bold',
      };
    }

    // Ready to schedule or scheduled
    if (job.scheduledDate || job.status === 'Scheduled') {
      const isConfirmed = job.appointmentConfirmation === 'Confirmed' || job.isConfirmed === true;
      if (!isConfirmed) {
        return {
          key: 'scheduled_unconfirmed',
          label: isTh
            ? (needsDiagnosis && !job.scopeConfirmed ? 'นัดตรวจแล้ว • ยังไม่ยืนยันนัด' : 'นัดหมายแล้ว • ยังไม่ยืนยันนัด')
            : (needsDiagnosis && !job.scopeConfirmed ? 'Inspection Scheduled • Unconfirmed' : 'Scheduled • Unconfirmed'),
          badgeClass: 'bg-amber-100 text-amber-950 border border-amber-300 font-bold',
        };
      }
      return {
        key: 'scheduled_confirmed',
        label: isTh
          ? (needsDiagnosis && !job.scopeConfirmed ? 'นัดตรวจแล้ว • ยืนยันนัดแล้ว' : 'นัดหมายแล้ว • ยืนยันนัดแล้ว')
          : (needsDiagnosis && !job.scopeConfirmed ? 'Inspection Scheduled • Confirmed' : 'Scheduled • Confirmed'),
        badgeClass: 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold',
      };
    }

    return {
      key: 'approved_to_schedule',
      label: isTh ? (needsDiagnosis && !job.scopeConfirmed ? 'อนุมัติค่าตรวจแล้ว • รอนัดหมาย' : 'อนุมัติแล้ว • รอนัดหมาย') : 'Approved • Ready to Schedule',
      badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold',
    };
  }

  // 6. Waiting Customer Approval (Quotation sent or waiting on client)
  const isQuoteSent =
    Boolean(job.quoteSentAt) ||
    job.status === 'Quoted' ||
    job.status === 'Waiting Approval' ||
    job.waitingOn === 'customer';

  if (isQuoteSent) {
    return {
      key: 'waiting_approval',
      label: isTh
        ? needsDiagnosis
          ? job.scopeConfirmed
            ? 'รอลูกค้าอนุมัติงานซ่อม'
            : 'รออนุมัติค่าตรวจ'
          : 'รอลูกค้าอนุมัติงาน'
        : needsDiagnosis
        ? job.scopeConfirmed
          ? 'Waiting Repair Approval'
          : 'Waiting Inspection Approval'
        : 'Waiting Customer Approval',
      badgeClass: 'bg-sky-100 text-sky-950 border border-sky-300 font-bold',
    };
  }

  // 7. Quote Drafted (Quotation has hardware or service items, but not yet sent)
  const hasQuoteItems =
    Boolean(job.quotation) &&
    ((job.quotation?.hardwareItems && job.quotation.hardwareItems.length > 0) ||
      (job.quotation?.serviceItems && job.quotation.serviceItems.length > 0));

  if (hasQuoteItems && !(needsDiagnosis && job.scopeConfirmedAt && (!job.quoteSentAt || job.quoteSentAt < job.scopeConfirmedAt))) {
    return {
      key: 'quote_drafted',
      label: isTh
        ? needsDiagnosis
          ? job.scopeConfirmed
            ? 'ร่างใบเสนอราคาซ่อมแล้ว'
            : 'ร่างใบเสนอราคาค่าตรวจแล้ว'
          : 'ร่างใบเสนอราคาแล้ว'
        : 'Quote Drafted',
      badgeClass: 'bg-amber-50 text-amber-900 border border-amber-200 font-bold',
    };
  }

  // 8. Scope Confirmed (Technical scope confirmed, ready for quotation)
  const isScopeConfirmed = Boolean(job.scopeConfirmed || job.scopeConfirmedAt);
  if (isScopeConfirmed) {
    return {
      key: 'scope_confirmed',
      label: isTh ? 'ขอบเขตงานพร้อมเสนอราคาซ่อม' : 'Scope Confirmed • Ready for Molly',
      badgeClass: 'bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold',
    };
  }

  // 9. Waiting Vendor (Subcontractor coordination)
  const isWaitingVendor =
    job.status === 'Waiting Vendor' ||
    job.waitingOn === 'vendor' ||
    job.waitingOn === 'parts';

  if (isWaitingVendor) {
    return {
      key: 'waiting_vendor',
      label: isTh ? 'รอช่างภายนอก' : 'Waiting Vendor',
      badgeClass: 'bg-purple-100 text-purple-900 border border-purple-300 font-bold',
    };
  }

  // 10. Technical Services where Scope is not yet confirmed and visit not started
  // Authoritative PTL Rule: Before inspection visit, PTL quotes the inspection fee / visit terms!
  if (needsDiagnosis) {
    return {
      key: 'waiting_scope',
      label: isTh ? 'รอเสนอราคาค่าตรวจ' : 'Waiting Inspection Quote',
      badgeClass: 'bg-amber-100 text-amber-950 border border-amber-300 font-bold',
    };
  }

  // 11. Scheduled (for non-technical/visit/assistance where appointment is set)
  if (job.scheduledDate || job.status === 'Scheduled') {
    const isConfirmed = job.appointmentConfirmation === 'Confirmed' || job.isConfirmed === true;
    if (!isConfirmed) {
      return {
        key: 'scheduled_unconfirmed',
        label: isTh ? 'นัดหมายแล้ว • ยังไม่ยืนยันนัด' : 'Scheduled • Unconfirmed',
        badgeClass: 'bg-amber-100 text-amber-950 border border-amber-300 font-bold',
      };
    }
    return {
      key: 'scheduled_confirmed',
      label: isTh ? 'นัดหมายแล้ว • ยืนยันนัดแล้ว' : 'Scheduled • Confirmed',
      badgeClass: 'bg-slate-100 text-slate-800 border border-slate-300 font-bold',
    };
  }

  // 12. Default New Job
  return {
    key: 'new',
    label: isTh ? 'งานใหม่' : 'New',
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200 font-bold',
  };
}

/**
 * Default 16-point Home Watch Checklist
 */
export function createDefaultHomeWatchChecklist(): HomeWatchChecklistItem[] {
  return [
    // 1. ACCESS
    {
      id: 'hw_acc_entry',
      category: 'Access',
      title: 'Property access successful',
      status: 'Normal',
    },
    {
      id: 'hw_acc_locks',
      category: 'Access',
      title: 'Doors / locks condition',
      status: 'Normal',
    },

    // 2. ELECTRICITY
    {
      id: 'hw_elec_main',
      category: 'Electricity',
      title: 'Main electricity available',
      status: 'Normal',
    },
    {
      id: 'hw_elec_lights',
      category: 'Electricity',
      title: 'Selected lights working',
      status: 'Normal',
    },
    {
      id: 'hw_elec_breaker',
      category: 'Electricity',
      title: 'Breaker / electrical obvious condition',
      status: 'Normal',
    },

    // 3. WATER
    {
      id: 'hw_wat_avail',
      category: 'Water',
      title: 'Water available',
      status: 'Normal',
    },
    {
      id: 'hw_wat_leaks',
      category: 'Water',
      title: 'Visible leaks',
      status: 'Normal',
    },
    {
      id: 'hw_wat_pump',
      category: 'Water',
      title: 'Pump obvious condition',
      status: 'Normal',
    },

    // 4. AIR CONDITIONING
    {
      id: 'hw_ac_check',
      category: 'Air Conditioning',
      title: 'Basic operational check where applicable',
      status: 'Normal',
    },

    // 5. INTERNET / CCTV
    {
      id: 'hw_net_status',
      category: 'Internet / CCTV',
      title: 'Internet status where included',
      status: 'Normal',
    },
    {
      id: 'hw_cctv_status',
      category: 'Internet / CCTV',
      title: 'CCTV obvious status where included',
      status: 'Normal',
    },

    // 6. INTERIOR
    {
      id: 'hw_int_damage',
      category: 'Interior',
      title: 'Visible moisture / mold / damage',
      status: 'Normal',
    },
    {
      id: 'hw_int_smell',
      category: 'Interior',
      title: 'Unusual smell / windows & doors secure',
      status: 'Normal',
    },

    // 7. EXTERIOR
    {
      id: 'hw_ext_garden_pool',
      category: 'Exterior',
      title: 'Garden & pool obvious condition',
      status: 'Normal',
    },
    {
      id: 'hw_ext_damage',
      category: 'Exterior',
      title: 'Exterior walls & perimeter condition',
      status: 'Normal',
    },

    // 8. SECURITY & GENERAL
    {
      id: 'hw_sec_overall',
      category: 'Security',
      title: 'Doors/windows secured & overall property condition',
      status: 'Normal',
    },
  ];
}

/**
 * Format date & time for display
 */
export function formatEvidenceTimestamp(isoDateString?: string): string {
  const d = isoDateString ? new Date(isoDateString) : new Date();
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} • ${hours}:${mins}`;
}

/**
 * Helper to compute Home Watch Checklist metrics
 */
export function getHomeWatchMetrics(checklist?: HomeWatchChecklistItem[]) {
  if (!checklist || checklist.length === 0) {
    return {
      total: 0,
      normal: 0,
      issue: 0,
      na: 0,
      completedCount: 0,
      photosCount: 0,
      issues: [] as HomeWatchChecklistItem[],
    };
  }

  const normal = checklist.filter((i) => i.status === 'Normal').length;
  const issueItems = checklist.filter((i) => i.status === 'Issue');
  const issue = issueItems.length;
  const na = checklist.filter((i) => i.status === 'N/A').length;
  const photosCount = checklist.filter((i) => Boolean(i.photoUrl)).length;

  return {
    total: checklist.length,
    normal,
    issue,
    na,
    completedCount: normal + issue + na,
    photosCount,
    issues: issueItems,
  };
}

/**
 * Determine if service is specifically Home Watch (NOT generic Property Visit or generic VISIT preset)
 */
export function isHomeWatchService(serviceType?: string, job?: InspectionJob): boolean {
  const clean = (serviceType || job?.serviceType || '').toLowerCase();
  if (!clean) return false;
  
  if (
    clean === 'home_watch' ||
    clean.includes('home watch') ||
    clean.includes('homewatch') ||
    clean.includes('ตรวจบ้านประจำงวด')
  ) {
    return true;
  }

  // Explicit Home Watch checklist presence (and not explicitly Property Visit)
  if (
    job?.homeWatchChecklist &&
    job.homeWatchChecklist.length > 0 &&
    !clean.includes('property visit') &&
    !clean.includes('เข้าตรวจดูทรัพย์สิน')
  ) {
    return true;
  }

  return false;
}

/**
 * Determine if service is specifically Roadside / Tire Assistance (NOT generic ASSISTANCE like Hospital or Pet)
 */
export function isRoadsideService(serviceType?: string, job?: InspectionJob): boolean {
  const clean = (serviceType || job?.serviceType || '').toLowerCase();
  if (!clean) return false;

  return (
    clean === 'roadside_tire' ||
    clean.includes('tire') ||
    clean.includes('roadside') ||
    clean.includes('flat tire') ||
    clean.includes('ยางแบน') ||
    clean.includes('ปะยาง') ||
    clean.includes('towing') ||
    clean.includes('battery assistance') ||
    clean.includes('เปลี่ยนแบต') ||
    clean.includes('พ่วงแบต')
  );
}

/**
 * Determine if service is Electrical Troubleshooting / Installation
 */
export function isElectricalService(serviceType?: string, job?: InspectionJob): boolean {
  const clean = (serviceType || job?.serviceType || '').toLowerCase();
  if (!clean) return false;
  return (
    (clean === 'electrical' ||
      clean.includes('electric') ||
      clean.includes('ไฟฟ้า') ||
      clean.includes('breaker') ||
      clean.includes('เบรกเกอร์') ||
      clean.includes('bulb') ||
      clean.includes('หลอดไฟ') ||
      clean.includes('โคมไฟ') ||
      clean.includes('socket') ||
      clean.includes('ปลั๊ก') ||
      clean.includes('mdb') ||
      clean.includes('lighting') ||
      clean.includes('wire') ||
      clean.includes('สายไฟ') ||
      clean.includes('rcbo')) &&
    !clean.includes('wifi') &&
    !clean.includes('smart')
  );
}

/**
 * Determine if service is CCTV Installation / Repair
 */
export function isCctvService(serviceType?: string, job?: InspectionJob): boolean {
  const clean = (serviceType || job?.serviceType || '').toLowerCase();
  if (!clean) return false;
  return (
    clean === 'cctv' ||
    clean.includes('cctv') ||
    clean.includes('camera') ||
    clean.includes('กล้อง') ||
    clean.includes('nvr') ||
    clean.includes('dvr')
  );
}

/**
 * Determine if service is Network / Wi-Fi / Internet
 */
export function isNetworkWifiService(serviceType?: string, job?: InspectionJob): boolean {
  const clean = (serviceType || job?.serviceType || '').toLowerCase();
  if (!clean) return false;
  return (
    (clean === 'wifi' ||
      clean === 'network' ||
      clean.includes('wifi') ||
      clean.includes('wi-fi') ||
      clean.includes('internet') ||
      clean.includes('อินเทอร์เน็ต') ||
      clean.includes('ไวไฟ') ||
      clean.includes('เน็ต') ||
      clean.includes('router') ||
      clean.includes('เร้าเตอร์') ||
      clean.includes('access point') ||
      clean.includes('lan') ||
      clean.includes('fibre') ||
      clean.includes('fiber')) &&
    !clean.includes('cctv')
  );
}

/**
 * Determine if service is Smart Home / Automation
 */
export function isSmartHomeService(serviceType?: string, job?: InspectionJob): boolean {
  const clean = (serviceType || job?.serviceType || '').toLowerCase();
  if (!clean) return false;
  return (
    clean === 'smart_home' ||
    clean.includes('smart home') ||
    clean.includes('สมาร์ทโฮม') ||
    clean.includes('tuya') ||
    clean.includes('aqara') ||
    clean.includes('zigbee') ||
    clean.includes('homekit') ||
    clean.includes('automation')
  );
}

/**
 * Determine if service is a technical field service requiring scope assessment / Mr. Big
 */
export function isTechnicalService(serviceType?: string, job?: InspectionJob): boolean {
  return (
    isElectricalService(serviceType, job) ||
    isCctvService(serviceType, job) ||
    isNetworkWifiService(serviceType, job) ||
    isSmartHomeService(serviceType, job)
  );
}

/**
 * Determine if service is Pet / Veterinary Assistance
 */
export function isPetService(serviceType?: string, job?: InspectionJob): boolean {
  const clean = (serviceType || job?.serviceType || '').toLowerCase();
  if (!clean) return false;
  return (
    clean === 'pet' ||
    clean.includes('pet') ||
    clean.includes('vet') ||
    clean.includes('veterinary') ||
    clean.includes('dog') ||
    clean.includes('cat') ||
    clean.includes('สัตว์เลี้ยง') ||
    clean.includes('คลินิกสัตว์') ||
    clean.includes('หมอหมา')
  );
}

/**
 * Determine if service is Airport Assistance
 */
export function isAirportService(serviceType?: string, job?: InspectionJob): boolean {
  const clean = (serviceType || job?.serviceType || '').toLowerCase();
  if (!clean) return false;
  return (
    clean === 'airport' ||
    clean.includes('airport') ||
    clean.includes('flight') ||
    clean.includes('hkt') ||
    clean.includes('สนามบิน') ||
    clean.includes('เที่ยวบิน') ||
    clean.includes('รับส่งสนามบิน')
  );
}

/**
 * Determine if service is Hospital / Appointment / General Assistance
 */
export function isAssistanceService(serviceType?: string, job?: InspectionJob): boolean {
  const clean = (serviceType || job?.serviceType || '').toLowerCase();
  if (!clean) return false;
  return (
    clean === 'assistance' ||
    clean.includes('hospital') ||
    clean.includes('medical') ||
    clean.includes('doctor') ||
    clean.includes('clinic') ||
    clean.includes('immigration') ||
    clean.includes('appointment') ||
    clean.includes('โรงพยาบาล') ||
    clean.includes('แพทย์') ||
    clean.includes('หมอ') ||
    clean.includes('ตม.') ||
    clean.includes('กงสุล') ||
    clean.includes('ช่วยเหลือ')
  );
}

export const isNetworkService = isNetworkWifiService;
export const isPetAssistanceService = isPetService;
export const isAirportAssistanceService = isAirportService;
export const isGeneralAssistanceService = isAssistanceService;

/**
 * Determine if service is Site Inspection
 */
export function isSiteInspectionService(serviceType?: string, job?: InspectionJob): boolean {
  const clean = (serviceType || job?.serviceType || '').toLowerCase();
  if (!clean) return false;
  return (
    clean === 'site_inspection' ||
    clean.includes('site inspection') ||
    clean.includes('inspection report') ||
    clean.includes('ตรวจสอบหน้างาน') ||
    clean.includes('ตรวจสภาพ')
  );
}

/**
 * Get the capabilities for a job based on its service definition or preset
 */
export function getCapabilitiesForJob(job: InspectionJob): ServiceCapabilities {
  const clean = (job.serviceType || '').toLowerCase();

  // 1. Direct match by service ID or name
  const found = PTL_SERVICES.find(
    (s) =>
      s.id.toLowerCase() === clean ||
      s.name.toLowerCase() === clean ||
      s.nameTh.toLowerCase() === clean ||
      clean.includes(s.name.toLowerCase()) ||
      clean.includes(s.id.toLowerCase())
  );

  if (found) {
    return { ...found.capabilities };
  }

  // 2. Specific checks
  if (isHomeWatchService(job.serviceType, job)) {
    return {
      homeWatchChecklist: true,
      photos: true,
      findings: true,
      report: true,
      followUpJob: true,
      location: true,
      customerContact: true,
      payment: true,
      quote: true,
      notes: true,
    };
  }

  if (isRoadsideService(job.serviceType, job)) {
    return {
      location: true,
      vendor: true,
      vendorEta: true,
      quote: true,
      payment: true,
      beforeAfterPhotos: true,
      photos: true,
      customerContact: true,
      notes: true,
      expenses: true,
    };
  }

  // 3. Fallback based on family of preset
  const preset = job.workflowPreset || getWorkflowPresetForService(job.serviceType || '');
  switch (preset) {
    case 'VISIT':
      // Generic property visit - NOT Home Watch
      return {
        notes: true,
        photos: true,
        findings: true,
        report: true,
        location: true,
        customerContact: true,
        appointment: true,
        payment: true,
        quote: true,
        expenses: true,
      };
    case 'ASSISTANCE':
      // Personal assistance (Hospital, Pet, Transport, Appointment)
      return {
        appointment: true,
        location: true,
        customerContact: true,
        notes: true,
        expenses: true,
        payment: true,
        quote: true,
        photos: true,
      };
    case 'COORDINATION':
      return {
        vendor: true,
        appointment: true,
        quote: true,
        payment: true,
        photos: true,
        expenses: true,
        notes: true,
        location: true,
        customerContact: true,
        report: true,
      };
    case 'TECHNICAL':
      return {
        photos: true,
        findings: true,
        materials: true,
        mollyHardware: clean.includes('cctv') || clean.includes('smart'),
        quote: true,
        payment: true,
        expenses: true,
        notes: true,
        location: true,
        customerContact: true,
        report: true,
        vendor: clean.includes('wifi') || clean.includes('internet'),
      };
    default:
      return {
        notes: true,
        location: true,
        customerContact: true,
        appointment: true,
        photos: true,
        findings: true,
        quote: true,
        payment: true,
        expenses: true,
        report: true,
      };
  }
}

export interface PrimaryJobAction {
  key: string;
  type: string;
  label: string;
  labelEn: string;
  labelTh: string;
  variant: 'blue' | 'amber' | 'emerald' | 'purple' | 'slate';
  buttonClass: string;
  secondaryAction?: {
    key: string;
    type: string;
    label: string;
    labelEn: string;
    labelTh: string;
    buttonClass?: string;
  };
}

/**
 * Compute the single Primary Next Action (and optional small Secondary Action)
 * strictly following the PTL real business lifecycle.
 */
export function getPrimaryJobAction(job: InspectionJob, lang: 'en' | 'th' = 'en'): PrimaryJobAction {
  const isTh = lang === 'th';
  const dominantState = getDominantJobState(job, lang);
  const isHomeWatch = isHomeWatchService(job.serviceType, job);
  const isTechnical = isTechnicalService(job.serviceType, job);
  const needsDiagnosis = isTechnical &&
    (!job.jobPurpose || job.jobPurpose === 'INSPECTION_DIAGNOSIS' || job.jobPurpose === 'FAULT_FINDING');

  switch (dominantState.key) {
    // 1. Technical scope not confirmed -> Create Inspection Quote for technical, or Assess with Mr. Big
    case 'waiting_scope':
      if (needsDiagnosis) {
        return {
          key: 'create_inspection_quote',
          type: 'create_inspection_quote',
          labelEn: 'Create Inspection Quote',
          labelTh: 'ทำใบเสนอราคาค่าตรวจ',
          label: isTh ? 'ทำใบเสนอราคาค่าตรวจ' : 'Create Inspection Quote',
          variant: 'blue',
          buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white font-black shadow-xs',
          secondaryAction: {
            key: 'edit_job',
            type: 'edit_job',
            labelEn: 'Edit Job',
            labelTh: 'แก้ไขรายละเอียด',
            label: isTh ? 'แก้ไขรายละเอียด' : 'Edit Job',
            buttonClass: 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200',
          },
        };
      }
      return {
        key: 'assess_mr_big',
        type: 'assess_mr_big',
        labelEn: 'Assess with Mr. Big',
        labelTh: 'ประเมินกับ Mr. Big',
        label: isTh ? 'ประเมินกับ Mr. Big' : 'Assess with Mr. Big',
        variant: 'blue',
        buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white font-black shadow-xs',
        secondaryAction: {
          key: 'quick_quote',
          type: 'quick_quote',
          labelEn: 'Quick Quote',
          labelTh: 'ทำใบเสนอราคาเลย',
          label: isTh ? 'ทำใบเสนอราคาเลย' : 'Quick Quote',
          buttonClass: 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200',
        },
      };

    // 2. Scope confirmed -> Send to Molly for Repair Quote
    case 'scope_confirmed':
      return {
        key: 'create_quote',
        type: 'create_quote',
        labelEn: 'Send Scope to Molly',
        labelTh: 'ส่ง Scope ให้ Molly',
        label: isTh ? 'ส่ง Scope ให้ Molly' : 'Send Scope to Molly',
        variant: 'blue',
        buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white font-black shadow-xs',
        secondaryAction: {
          key: 'assess_mr_big',
          type: 'assess_mr_big',
          labelEn: 'Edit Scope',
          labelTh: 'แก้ไข Scope',
          label: isTh ? 'แก้ไข Scope' : 'Edit Scope',
          buttonClass: 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200',
        },
      };

    // 3. Quote drafted -> Send Quotation
    case 'quote_drafted':
      return {
        key: 'send_quote',
        type: 'send_quote',
        labelEn: 'Send Quote',
        labelTh: 'ส่งใบเสนอราคา',
        label: isTh ? 'ส่งใบเสนอราคา' : 'Send Quote',
        variant: 'blue',
        buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white font-black shadow-xs',
        secondaryAction: {
          key: 'quick_quote',
          type: 'quick_quote',
          labelEn: 'Edit Quote',
          labelTh: 'แก้ไขใบเสนอราคา',
          label: isTh ? 'แก้ไขใบเสนอราคา' : 'Edit Quote',
          buttonClass: 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200',
        },
      };

    // 4. Quotation out -> Customer Approved (or Follow Up)
    case 'waiting_approval': {
      const isRepairQuote = needsDiagnosis && Boolean(job.scopeConfirmed);
      const approveLabelEn = isRepairQuote
        ? 'Approve Repair Quote'
        : needsDiagnosis
        ? 'Approve Inspection Quote'
        : 'Customer Approved';
      const approveLabelTh = isRepairQuote
        ? 'ลูกค้าอนุมัติงานซ่อม'
        : needsDiagnosis
        ? 'ลูกค้าอนุมัติค่าตรวจ'
        : 'ลูกค้าอนุมัติงานแล้ว';
      return {
        key: 'customer_approved',
        type: 'customer_approved',
        labelEn: approveLabelEn,
        labelTh: approveLabelTh,
        label: isTh ? approveLabelTh : approveLabelEn,
        variant: 'emerald',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xs ring-1 ring-emerald-400',
        secondaryAction: {
          key: 'follow_up_customer',
          type: 'follow_up_customer',
          labelEn: 'Follow Up',
          labelTh: 'ติดตามลูกค้า',
          label: isTh ? 'ติดตามลูกค้า' : 'Follow Up',
          buttonClass: 'text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200',
        },
      };
    }

    // 5. Customer approved, but material deposit required
    case 'waiting_deposit':
      return {
        key: 'record_deposit',
        type: 'record_deposit',
        labelEn: 'Record Material Deposit',
        labelTh: 'บันทึกรับเงินมัดจำ',
        label: isTh ? 'บันทึกรับเงินมัดจำ' : 'Record Material Deposit',
        variant: 'amber',
        buttonClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-xs',
        secondaryAction: {
          key: 'request_deposit',
          type: 'request_deposit',
          labelEn: 'Request Deposit',
          labelTh: 'ขอเบิกมัดจำ',
          label: isTh ? 'ขอเบิกมัดจำ' : 'Request Deposit',
          buttonClass: 'text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200',
        },
      };

    // 6. Customer approved and ready to schedule
    case 'approved_to_schedule': {
      const schedLabelEn = needsDiagnosis && !job.scopeConfirmed ? 'Schedule Inspection Visit' : 'Schedule Work';
      const schedLabelTh = needsDiagnosis && !job.scopeConfirmed ? 'นัดหมายวันเข้าตรวจ' : 'นัดหมายวันเข้าทำ';
      return {
        key: 'schedule_job',
        type: 'schedule_job',
        labelEn: schedLabelEn,
        labelTh: schedLabelTh,
        label: isTh ? schedLabelTh : schedLabelEn,
        variant: 'blue',
        buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white font-black shadow-xs',
      };
    }

    // 7a. Scheduled and Unconfirmed -> Confirm Appointment
    case 'scheduled_unconfirmed': {
      return {
        key: 'confirm_appointment',
        type: 'confirm_appointment',
        labelEn: 'Confirm Appointment',
        labelTh: 'ยืนยันนัดหมาย',
        label: isTh ? 'ยืนยันนัดหมาย' : 'Confirm Appointment',
        variant: 'amber',
        buttonClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-xs',
        secondaryAction: {
          key: 'schedule_job',
          type: 'schedule_job',
          labelEn: 'Reschedule',
          labelTh: 'เลื่อนนัด',
          label: isTh ? 'เลื่อนนัด' : 'Reschedule',
          buttonClass: 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200',
        },
      };
    }

    // 7b. Scheduled and Confirmed -> Start Inspection
    case 'scheduled_confirmed':
    case 'scheduled': {
      const isConfirmed = job.appointmentConfirmation === 'Confirmed' || job.isConfirmed === true;
      if (!isConfirmed) {
        return {
          key: 'confirm_appointment',
          type: 'confirm_appointment',
          labelEn: 'Confirm Appointment',
          labelTh: 'ยืนยันนัดหมาย',
          label: isTh ? 'ยืนยันนัดหมาย' : 'Confirm Appointment',
          variant: 'amber',
          buttonClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-xs',
          secondaryAction: {
            key: 'schedule_job',
            type: 'schedule_job',
            labelEn: 'Reschedule',
            labelTh: 'เลื่อนนัด',
            label: isTh ? 'เลื่อนนัด' : 'Reschedule',
            buttonClass: 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200',
          },
        };
      }

      const startLabelEn = needsDiagnosis && !job.scopeConfirmed || isHomeWatch ? 'Start Inspection' : job.jobPurpose === 'REPLACEMENT' ? 'Start Replacement' : 'Start Work';
      const startLabelTh = needsDiagnosis && !job.scopeConfirmed || isHomeWatch ? 'เริ่มเข้าตรวจ' : job.jobPurpose === 'REPLACEMENT' ? 'เริ่มเปลี่ยนอุปกรณ์' : 'เริ่มทำงาน';
      return {
        key: 'start_job',
        type: 'start_job',
        labelEn: startLabelEn,
        labelTh: startLabelTh,
        label: isTh ? startLabelTh : startLabelEn,
        variant: 'emerald',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xs',
        secondaryAction: {
          key: 'schedule_job',
          type: 'schedule_job',
          labelEn: 'Reschedule',
          labelTh: 'เลื่อนนัด',
          label: isTh ? 'เลื่อนนัด' : 'Reschedule',
          buttonClass: 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200',
        },
      };
    }

    // 8. In Progress -> Resume Job (or Finish Field Work)
    case 'in_progress': {
      if (needsDiagnosis) {
        if (job.scopeConfirmed) {
          return {
            key: 'finish_field_work',
            type: 'finish_field_work',
            labelEn: 'Finish Repair Work',
            labelTh: 'เสร็จสิ้นงานซ่อม',
            label: isTh ? 'เสร็จสิ้นงานซ่อม' : 'Finish Repair Work',
            variant: 'emerald',
            buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xs',
            secondaryAction: {
              key: 'resume_job',
              type: 'resume_job',
              labelEn: 'Repair Workspace',
              labelTh: 'หน้างานซ่อม',
              label: isTh ? 'หน้างานซ่อม' : 'Repair Workspace',
              buttonClass: 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200',
            },
          };
        }
        return {
          key: 'assess_mr_big',
          type: 'assess_mr_big',
          labelEn: 'Assess with Mr. Big',
          labelTh: 'บันทึกผลตรวจกับ Mr. Big',
          label: isTh ? 'บันทึกผลตรวจกับ Mr. Big' : 'Assess with Mr. Big',
          variant: 'blue',
          buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white font-black shadow-xs',
          secondaryAction: {
            key: 'finish_field_work',
            type: 'finish_field_work',
            labelEn: 'Finish Inspection',
            labelTh: 'เสร็จสิ้นการตรวจ',
            label: isTh ? 'เสร็จสิ้นการตรวจ' : 'Finish Inspection',
            buttonClass: 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200',
          },
        };
      }
      return {
        key: 'resume_job',
        type: 'resume_job',
        labelEn: 'Resume Job',
        labelTh: 'ทำงานต่อ',
        label: isTh ? 'ทำงานต่อ' : 'Resume Job',
        variant: 'blue',
        buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white font-black shadow-xs',
        secondaryAction: {
          key: 'finish_field_work',
          type: 'finish_field_work',
          labelEn: 'Finish Field Work',
          labelTh: 'จบงานหน้างาน',
          label: isTh ? 'จบงานหน้างาน' : 'Finish Field Work',
          buttonClass: 'text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold',
        },
      };
    }

    // 9. Waiting Vendor
    case 'waiting_vendor': {
      const isAssigned = Boolean(job.vendorId || job.assignedVendorId);
      return {
        key: isAssigned ? 'contact_vendor' : 'assign_vendor',
        type: isAssigned ? 'contact_vendor' : 'assign_vendor',
        labelEn: isAssigned ? 'Contact Vendor' : 'Assign Vendor',
        labelTh: isAssigned ? 'ติดต่อช่าง' : 'มอบหมายช่าง',
        label: isTh ? (isAssigned ? 'ติดต่อช่าง' : 'มอบหมายช่าง') : isAssigned ? 'Contact Vendor' : 'Assign Vendor',
        variant: 'purple',
        buttonClass: 'bg-purple-600 hover:bg-purple-500 text-white font-black shadow-xs',
      };
    }

    // 10. Field work finished, waiting on payment
    case 'waiting_payment':
      return {
        key: 'create_invoice_collect',
        type: 'create_invoice_collect',
        labelEn: 'Invoice / Collect',
        labelTh: 'ออก Invoice / เรียกเก็บเงิน',
        label: isTh ? 'ออก Invoice / เรียกเก็บเงิน' : 'Invoice / Collect',
        variant: 'emerald',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xs',
        secondaryAction: {
          key: 'record_payment',
          type: 'record_payment',
          labelEn: 'Record Payment',
          labelTh: 'บันทึกรับเงิน',
          label: isTh ? 'บันทึกรับเงิน' : 'Record Payment',
          buttonClass: 'text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200',
        },
      };

    // 11. Paid and ready to close
    case 'ready_to_close':
      return {
        key: 'close_job',
        type: 'close_job',
        labelEn: 'Close Job',
        labelTh: 'ปิดงาน',
        label: isTh ? 'ปิดงาน' : 'Close Job',
        variant: 'emerald',
        buttonClass: 'bg-emerald-700 hover:bg-emerald-600 text-white font-black shadow-xs',
        secondaryAction: {
          key: 'view_report',
          type: 'view_report',
          labelEn: 'View Report',
          labelTh: 'ดูรายงาน PDF',
          label: isTh ? 'ดูรายงาน PDF' : 'View Report',
          buttonClass: 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200',
        },
      };

    // 12. Completed & Closed
    case 'completed':
      return {
        key: 'view_report',
        type: 'view_report',
        labelEn: 'View Report',
        labelTh: 'ดูรายงาน / สรุปผล',
        label: isTh ? 'ดูรายงาน / สรุปผล' : 'View Report',
        variant: 'slate',
        buttonClass: 'bg-slate-800 hover:bg-slate-700 text-white font-black shadow-xs',
      };

    // 13. Default New
    case 'new':
    default:
      if (needsDiagnosis) {
        return {
          key: 'assess_mr_big',
          type: 'assess_mr_big',
          labelEn: 'Assess with Mr. Big',
          labelTh: 'ประเมินกับ Mr. Big',
          label: isTh ? 'ประเมินกับ Mr. Big' : 'Assess with Mr. Big',
          variant: 'blue',
          buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white font-black shadow-xs',
          secondaryAction: {
            key: 'quick_quote',
            type: 'quick_quote',
            labelEn: 'Quick Quote',
            labelTh: 'ทำใบเสนอราคาเลย',
            label: isTh ? 'ทำใบเสนอราคาเลย' : 'Quick Quote',
            buttonClass: 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200',
          },
        };
      }
      return {
        key: 'start_job',
        type: 'start_job',
        labelEn: 'Start Job',
        labelTh: 'เริ่มงาน',
        label: isTh ? 'เริ่มงาน' : 'Start Job',
        variant: 'emerald',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xs',
      };
  }
}
