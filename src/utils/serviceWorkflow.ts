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
  | 'in_progress'
  | 'appointment_unconfirmed'
  | 'waiting_approval'
  | 'waiting_vendor'
  | 'waiting_payment'
  | 'scheduled'
  | 'completed'
  | 'new';

export interface DominantJobState {
  key: DominantStateKey;
  label: string;
  badgeClass: string;
}

/**
 * Evaluates ONE dominant operational state for an owner-facing Job card.
 * Removes all confusing multi-badge combinations (e.g. INSPECTION + QUOTED + Confirm? + Waiting Customer).
 */
export function getDominantJobState(job: InspectionJob, lang: 'en' | 'th' = 'en'): DominantJobState {
  const isTh = lang === 'th';

  // 1. In Progress: Highest active priority
  const isInProgress =
    job.status === 'In Progress' ||
    Boolean(job.visitStartedAt) ||
    Boolean(job.siteArrivedAt) ||
    Boolean(job.actualStartedAt);

  if (isInProgress && job.status !== 'Completed' && job.status !== 'Cancelled') {
    return {
      key: 'in_progress',
      label: isTh ? 'กำลังทำ' : 'In Progress',
      badgeClass: 'bg-blue-600 text-white font-bold',
    };
  }

  // 2. Completed: Check if still awaiting payment or invoice
  if (job.status === 'Completed') {
    if (job.waitingOn === 'payment') {
      return {
        key: 'waiting_payment',
        label: isTh ? 'รอชำระเงิน' : 'Waiting Payment',
        badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold',
      };
    }
    return {
      key: 'completed',
      label: isTh ? 'งานเสร็จ' : 'Completed',
      badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
    };
  }

  // 3. Appointment Not Confirmed: If scheduled and confirmation is explicitly pending / unconfirmed
  const hasSchedule = Boolean(job.scheduledDate || job.scheduledTime);
  const isUnconfirmed =
    hasSchedule &&
    (job.appointmentConfirmation === 'Not Confirmed' || !job.appointmentConfirmation);

  if (isUnconfirmed) {
    return {
      key: 'appointment_unconfirmed',
      label: isTh ? 'ยังไม่ได้ยืนยันนัด' : 'Appointment Not Confirmed',
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
    };
  }

  // 4. Waiting Customer Approval: If quote is out or waiting on client
  const isWaitingCustomer =
    job.status === 'Quoted' ||
    job.status === 'Waiting Approval' ||
    job.waitingOn === 'customer';

  if (isWaitingCustomer) {
    return {
      key: 'waiting_approval',
      label: isTh ? 'รอลูกค้ายืนยันงาน' : 'Waiting Customer Approval',
      badgeClass: 'bg-sky-100 text-sky-900 border border-sky-300 font-bold',
    };
  }

  // 5. Waiting Vendor: Subcontractor or parts delivery pending
  const isWaitingVendor =
    job.status === 'Waiting Vendor' ||
    job.waitingOn === 'vendor' ||
    job.waitingOn === 'parts';

  if (isWaitingVendor) {
    return {
      key: 'waiting_vendor',
      label: isTh ? 'รอช่าง' : 'Waiting Vendor',
      badgeClass: 'bg-purple-100 text-purple-900 border border-purple-300 font-bold',
    };
  }

  // 6. Waiting Payment
  if (job.waitingOn === 'payment' || job.status === 'Waiting Payment') {
    return {
      key: 'waiting_payment',
      label: isTh ? 'รอชำระเงิน' : 'Waiting Payment',
      badgeClass: 'bg-rose-100 text-rose-900 border border-rose-300 font-bold',
    };
  }

  // 7. Scheduled: Appointment is set and confirmed
  if (hasSchedule || job.status === 'Scheduled') {
    return {
      key: 'scheduled',
      label: isTh ? 'นัดหมายแล้ว' : 'Scheduled',
      badgeClass: 'bg-slate-100 text-slate-800 border border-slate-300 font-bold',
    };
  }

  // 8. New Job (Default)
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
  variant: 'blue' | 'amber' | 'emerald';
  buttonClass: string;
}

/**
 * Compute the single Primary Next Action for a job (Solo operator focus)
 */
export function getPrimaryJobAction(job: InspectionJob, lang: 'en' | 'th' = 'en'): PrimaryJobAction {
  const isTh = lang === 'th';
  const dominantState = getDominantJobState(job, lang);

  // 1. If appointment requires confirmation -> Confirm Appointment
  if (dominantState.key === 'appointment_unconfirmed') {
    return {
      key: 'confirm_appointment',
      type: 'confirm_appointment',
      labelEn: 'Confirm Appointment',
      labelTh: 'ยืนยันนัด',
      label: isTh ? 'ยืนยันนัด' : 'Confirm Appointment',
      variant: 'amber',
      buttonClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-xs',
    };
  }

  // 2. If In Progress -> Resume Job
  if (dominantState.key === 'in_progress') {
    return {
      key: 'resume_job',
      type: 'resume_job',
      labelEn: 'Resume Job',
      labelTh: 'ทำงานต่อ',
      label: isTh ? 'ทำงานต่อ' : 'Resume Job',
      variant: 'blue',
      buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white font-black shadow-xs',
    };
  }

  // 3. If waiting for customer approval -> Contact Customer
  if (dominantState.key === 'waiting_approval') {
    return {
      key: 'contact_customer',
      type: 'contact_customer',
      labelEn: 'Contact Customer',
      labelTh: 'ติดต่อลูกค้า',
      label: isTh ? 'ติดต่อลูกค้า' : 'Contact Customer',
      variant: 'blue',
      buttonClass: 'bg-sky-600 hover:bg-sky-500 text-white font-black shadow-xs',
    };
  }

  // 4. If waiting on vendor -> Contact or Assign Vendor
  if (dominantState.key === 'waiting_vendor') {
    const isAssigned = Boolean(job.vendorId || job.assignedVendorId);
    return {
      key: isAssigned ? 'contact_vendor' : 'assign_vendor',
      type: isAssigned ? 'contact_vendor' : 'assign_vendor',
      labelEn: isAssigned ? 'Contact Vendor' : 'Assign Vendor',
      labelTh: isAssigned ? 'ติดต่อช่าง' : 'มอบหมายช่าง',
      label: isTh ? (isAssigned ? 'ติดต่อช่าง' : 'มอบหมายช่าง') : isAssigned ? 'Contact Vendor' : 'Assign Vendor',
      variant: 'amber',
      buttonClass: 'bg-purple-600 hover:bg-purple-500 text-white font-black shadow-xs',
    };
  }

  // 5. If waiting on payment -> Record Payment
  if (dominantState.key === 'waiting_payment') {
    return {
      key: 'record_payment',
      type: 'record_payment',
      labelEn: 'Record Payment',
      labelTh: 'รับชำระเงิน',
      label: isTh ? 'รับชำระเงิน' : 'Record Payment',
      variant: 'emerald',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xs',
    };
  }

  // 6. If Scheduled for Today -> Start Job
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
