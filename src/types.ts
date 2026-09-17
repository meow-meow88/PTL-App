export type CustomerGroup = 'expat' | 'villa_owner' | 'rental_investor';

// PTL V2 Extended Job Status Lifecycle (with backward compatibility)
export type JobStatus =
  | 'New'
  | 'Quoted'
  | 'Approved'
  | 'Scheduled'
  | 'In Progress'
  | 'Waiting Customer'
  | 'Waiting Vendor'
  | 'Completed'
  | 'Invoiced'
  | 'Partially Paid'
  | 'Paid'
  | 'Cancelled'
  // Backward compatibility aliases:
  | 'Inspection';

export function normalizeJobStatus(status?: string): JobStatus {
  if (!status) return 'New';
  const clean = status.trim();
  switch (clean.toLowerCase()) {
    case 'inspection':
      return 'Inspection';
    case 'quoted':
      return 'Quoted';
    case 'approved':
      return 'Approved';
    case 'scheduled':
      return 'Scheduled';
    case 'in progress':
    case 'in_progress':
      return 'In Progress';
    case 'waiting customer':
    case 'waiting_customer':
      return 'Waiting Customer';
    case 'waiting vendor':
    case 'waiting_vendor':
      return 'Waiting Vendor';
    case 'completed':
      return 'Completed';
    case 'invoiced':
      return 'Invoiced';
    case 'partially paid':
    case 'partially_paid':
      return 'Partially Paid';
    case 'paid':
      return 'Paid';
    case 'cancelled':
    case 'canceled':
      return 'Cancelled';
    case 'new':
      return 'New';
    default:
      return (clean as JobStatus) || 'New';
  }
}

// PTL V2 Solo Operator Navigation Tabs
export type MainNavTab =
  | 'my_day'
  | 'customers'
  | 'properties'
  | 'jobs'
  | 'money'
  | 'documents'
  | 'vendors'
  | 'calendar'
  | 'settings';

// PTL V2 Customer Model
export type CustomerType =
  | 'Expat'
  | 'Overseas Property Owner'
  | 'Local Customer'
  | 'Property Manager'
  | 'Other';

export interface Customer {
  id: string; // Customer ID, e.g. CUST-001
  name: string; // Customer full name
  fullName?: string; // Compatibility alias
  preferredName: string;
  email: string;
  phone: string;
  lineWhatsapp: string;
  lineOrWhatsapp?: string; // Compatibility alias
  customerType: CustomerType;
  status: 'Active' | 'Lead' | 'Past' | 'Inactive';
  notes: string;
  createdAt: string;
  lastContact: string;
  nextFollowUp?: string;
  followUpNote?: string;
}

// PTL V2 Property Model
export type PropertyType =
  | 'Villa'
  | 'Condo'
  | 'Estate'
  | 'Commercial'
  | 'Other';

export type PropertySystem =
  | 'CCTV'
  | 'WiFi'
  | 'Internet'
  | 'Smart Home'
  | 'Air Conditioning'
  | 'Water'
  | 'Electrical'
  | 'Security';

export interface Property {
  id: string; // Property ID, e.g. PROP-001
  customerId: string; // Belongs to Customer.id
  name: string; // e.g. Green Mile Villa
  propertyName?: string; // Compatibility alias
  propertyType: PropertyType;
  address: string;
  area: string; // e.g. Kathu, Nai Harn, Rawai, Patong, Bang Tao, Cherngtalay
  googleMapsUrl?: string;
  accessInformation: string; // Access code, lockbox, guard pass
  accessInfo?: string; // Compatibility alias
  contactPerson?: string;
  notes: string;
  importantNotes?: string; // Compatibility alias
  systems: PropertySystem[]; // CCTV, WiFi, Internet, Smart Home, etc.
  systemsInstalled?: string[]; // Compatibility alias
  lastInspection?: string;
  nextInspection?: string;
}

// Quick Job Service Types
export type QuickJobServiceType =
  | 'Remote Support'
  | 'Home Visit'
  | 'Home Watch'
  | 'Vendor Coordination'
  | 'Transportation'
  | 'Pet Assistance'
  | 'Hospital Assistance'
  | 'CCTV'
  | 'WiFi / Internet'
  | 'Other';

export type FindingStatus =
  | 'Power Tripped'
  | 'Not Working'
  | 'Requires Swap'
  | 'Disconnected'
  | 'Critical Swap'
  | 'Normal';

export interface InspectionItem {
  id: string; // Insp_ID
  category: string;
  locationZone: string;
  title: string;
  fileReference: string;
  imageUrl?: string;
  observationEn: string;
  observationTh: string;
  status: FindingStatus;
  recommendedActionEn: string;
  recommendedActionTh: string;
  createdAt: string;
  // Mr. Big AI metadata
  mrBigConfidence?: string;
  mrBigRiskAssessment?: string;
}

export interface QuotationHardwareItem {
  item: number;
  descriptionEn: string;
  descriptionTh: string;
  qty: number;
  unit: string;
  unitPrice: number;
  amount: number;
  sourcingChannel?: string; // e.g. HomePro, Global House, Lazada
}

export interface QuotationServiceItem {
  item: number;
  description: string;
  detail: string;
  estimatedSchedule: string;
  qty: string;
  amount: number;
}

export type DocType = 'quotation' | 'invoice';

export interface QuotationData {
  refNo: string;
  invoiceNo?: string;
  date: string;
  invoiceDate?: string;
  dueDate?: string;
  inspectionRef: string;
  validity: string;
  paymentTerm: string;
  hardwareItems: QuotationHardwareItem[];
  serviceItems: QuotationServiceItem[];
  procurementFeeRate: number; // e.g. 0.15 for 15%
  terms: string[];
  contingencies: string[];
  mollyNotes?: string; // Sourcing & Peace of Mind rationale from Molly
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  promptPayId?: string;
  depositPercent?: number; // e.g. 50
  separateTermsPage?: boolean;
}

export interface InspectionJob {
  id: string; // Job_ID: e.g. PTL-INSP-20260818-004
  clientId: string; // Client_ID: e.g. CL-MAZEN-001
  customerId?: string; // Links to Customer.id
  propertyId?: string; // Links to Property.id
  villaName: string; // Villa_Name: e.g. Green Mile Villa, Kathu
  customerName: string;
  customerGroup: CustomerGroup;
  propertyLocation: string;
  serviceType: string;
  status: JobStatus; // Inspection / Quoted / Paid / Completed
  inspectionDate: string;
  createdAt: string;
  inspector: string;
  documentRef: string;
  driveFolderUrl?: string; // Google Drive folder link for high-res photo archive
  notes?: string;
  items: InspectionItem[];
  quotation: QuotationData;
  // Solo Operator PTL V2 Fields:
  scheduledDate?: string; // e.g. 2026-09-17 or Today
  scheduledTime?: string; // e.g. 10:30 AM
  requestDescription?: string; // Direct request text
  price?: number; // Quick agreed price in THB
  isSimpleJob?: boolean; // If true, lightweight job (inspection is optional)
  waitingOn?: 'customer' | 'vendor' | 'parts' | 'payment' | 'none';
  actionRequired?: string; // e.g. "Invoice needs follow-up", "Confirm appointment tomorrow"
  completedAt?: string;
}

// ====================================================
// PHASE 2: FINANCIAL MODELS & CALCULATIONS
// ====================================================

export type ExpenseCategory =
  | 'Materials'
  | 'Equipment'
  | 'Fuel'
  | 'Travel'
  | 'Vendor'
  | 'Helper'
  | 'Parking'
  | 'Other';

export interface Expense {
  id: string; // e.g. EXP-202609-001
  jobId: string; // Linked to InspectionJob.id
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description: string;
  amount: number;
  vendorId?: string; // Optional vendor link
  vendorName?: string; // Optional vendor/supplier name
  receiptImage?: string; // Base64 or image URL
  notes?: string;
  createdAt: string;
}

export type InvoiceStatus =
  | 'Draft'
  | 'Sent'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Cancelled';

export interface InvoiceItem {
  id?: string;
  item?: number;
  description: string;
  detail?: string;
  qty: string | number;
  unitPrice?: number;
  amount: number;
  categoryType?: 'Hardware' | 'Service' | 'Fee';
}

export interface Invoice {
  id: string; // e.g. INV-202609-001
  invoiceNumber: string; // e.g. PTL-INV-2026-001
  jobId: string; // Linked to InspectionJob.id
  customerId: string; // Linked to Customer.id
  propertyId?: string; // Linked to Property.id
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  createdAt: string;
}

export type PaymentMethod =
  | 'Cash'
  | 'Bank Transfer'
  | 'PromptPay'
  | 'Credit Card'
  | 'Other';

export interface Payment {
  id: string; // e.g. PAY-202609-001
  invoiceId: string; // Linked to Invoice.id
  jobId: string; // Linked to InspectionJob.id
  customerId: string; // Linked to Customer.id
  date: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string; // Transfer slip / check / transaction ref
  notes?: string;
  createdAt: string;
}

export interface JobFinancials {
  customerPrice: number;
  materialCost: number;
  travelCost: number;
  vendorCost: number;
  helperCost: number;
  otherCost: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number; // Percentage (e.g. 45.0 for 45%)
}

/**
 * Derives clean financial metrics from job price/quote and linked expenses.
 * Safe against zero/negative customer prices.
 */
export function calculateJobFinancials(
  job: InspectionJob,
  jobExpenses: Expense[]
): JobFinancials {
  // 1. Determine Customer Price
  let customerPrice = typeof job.price === 'number' && job.price > 0 ? job.price : 0;
  if (customerPrice === 0 && job.quotation) {
    const hwTotal =
      job.quotation.hardwareItems?.reduce((sum, h) => sum + (h.amount || 0), 0) || 0;
    const svTotal =
      job.quotation.serviceItems?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
    const feeRate = job.quotation.procurementFeeRate ?? 0.15;
    const fee = hwTotal * feeRate;
    customerPrice = hwTotal + fee + svTotal;
  }

  // 2. Sum Expenses by Category
  let materialCost = 0;
  let travelCost = 0;
  let vendorCost = 0;
  let helperCost = 0;
  let otherCost = 0;

  for (const exp of jobExpenses) {
    const amt = exp.amount || 0;
    switch (exp.category) {
      case 'Materials':
      case 'Equipment':
        materialCost += amt;
        break;
      case 'Fuel':
      case 'Travel':
      case 'Parking':
        travelCost += amt;
        break;
      case 'Vendor':
        vendorCost += amt;
        break;
      case 'Helper':
        helperCost += amt;
        break;
      case 'Other':
      default:
        otherCost += amt;
        break;
    }
  }

  const totalCost = materialCost + travelCost + vendorCost + helperCost + otherCost;
  const netProfit = customerPrice - totalCost;
  const profitMargin =
    customerPrice > 0 ? Math.round((netProfit / customerPrice) * 10000) / 100 : 0;

  return {
    customerPrice,
    materialCost,
    travelCost,
    vendorCost,
    helperCost,
    otherCost,
    totalCost,
    netProfit,
    profitMargin,
  };
}

// ----------------------------------------------------
// Standard Relational Database Schema (3 Tables)
// Recommended for Vercel / Glide / Airtable / Supabase
// ----------------------------------------------------

// Table: Jobs (ข้อมูลหลัก)
export interface JobRecord {
  Job_ID: string;
  Client_ID: string;
  Villa_Name: string;
  Service_Type: string;
  Status: JobStatus;
  Created_At: string;
}

// Table: Inspections (รายละเอียดการตรวจ)
export interface InspectionRecord {
  Insp_ID: string;
  Job_ID: string;
  Category: string;
  Location_Zone: string;
  Photo_Raw: string;
  MrBig_Observation_EN: string;
  MrBig_Observation_TH: string;
  MrBig_Action_EN: string;
  MrBig_Action_TH: string;
  Status_Tag: FindingStatus;
}

// Table: Quotation_Items (ใบเสนอราคา)
export interface QuotationItemRecord {
  Quote_ID: string;
  Job_ID: string;
  Item_Name: string;
  Description_TH: string;
  Quantity: number;
  Unit: string;
  Unit_Price: number;
  Amount: number;
  Category_Type: 'Hardware' | 'Service' | 'Fee';
  Coordinate_Fee_Pct: number; // 0.15 (15%)
}

// Helper to convert InspectionJob to the 3 relational tables
export function convertJobToRelationalTables(job: InspectionJob): {
  jobs: JobRecord[];
  inspections: InspectionRecord[];
  quotationItems: QuotationItemRecord[];
} {
  const jobRecord: JobRecord = {
    Job_ID: job.id,
    Client_ID: job.clientId || `CL-${job.customerName.replace(/\s+/g, '-').toUpperCase()}`,
    Villa_Name: job.villaName || job.propertyLocation,
    Service_Type: job.serviceType,
    Status: job.status || 'Inspection',
    Created_At: job.createdAt || job.inspectionDate,
  };

  const inspections: InspectionRecord[] = job.items.map((it, idx) => ({
    Insp_ID: it.id || `INSP-${job.id.slice(-6)}-${String(idx + 1).padStart(3, '0')}`,
    Job_ID: job.id,
    Category: it.category,
    Location_Zone: it.locationZone,
    Photo_Raw: it.fileReference || it.imageUrl || 'No photo',
    MrBig_Observation_EN: it.observationEn,
    MrBig_Observation_TH: it.observationTh,
    MrBig_Action_EN: it.recommendedActionEn,
    MrBig_Action_TH: it.recommendedActionTh,
    Status_Tag: it.status,
  }));

  const quotationItems: QuotationItemRecord[] = [];
  const quoteId = job.quotation.refNo || `QT-${job.id.slice(-6)}`;

  // Hardware items
  job.quotation.hardwareItems.forEach((h) => {
    quotationItems.push({
      Quote_ID: quoteId,
      Job_ID: job.id,
      Item_Name: h.descriptionEn,
      Description_TH: h.descriptionTh,
      Quantity: h.qty,
      Unit: h.unit,
      Unit_Price: h.unitPrice,
      Amount: h.amount,
      Category_Type: 'Hardware',
      Coordinate_Fee_Pct: job.quotation.procurementFeeRate || 0.15,
    });
  });

  // Service items
  job.quotation.serviceItems.forEach((s) => {
    quotationItems.push({
      Quote_ID: quoteId,
      Job_ID: job.id,
      Item_Name: s.description,
      Description_TH: s.detail,
      Quantity: 1,
      Unit: s.qty,
      Unit_Price: s.amount,
      Amount: s.amount,
      Category_Type: 'Service',
      Coordinate_Fee_Pct: 0,
    });
  });

  // Calculate Procurement Fee item
  const feeRate = job.quotation.procurementFeeRate ?? 0.15;
  const feePctFormatted = Math.round(feeRate * 100);
  const hardwareSubtotal = job.quotation.hardwareItems.reduce((sum, i) => sum + i.amount, 0);
  const procurementFee = hardwareSubtotal * feeRate;
  if (procurementFee > 0) {
    quotationItems.push({
      Quote_ID: quoteId,
      Job_ID: job.id,
      Item_Name: `Procurement & Coordinate Fee (${feePctFormatted}%) - Quality Control & Peace of Mind`,
      Description_TH: `ค่าประสานงาน จัดหา ควบคุมคุณภาพ และตรวจรับงานช่าง (${feePctFormatted}%) เพื่อความ Peace of Mind`,
      Quantity: 1,
      Unit: 'Job',
      Unit_Price: Math.round(procurementFee * 100) / 100,
      Amount: Math.round(procurementFee * 100) / 100,
      Category_Type: 'Fee',
      Coordinate_Fee_Pct: feeRate,
    });
  }

  return {
    jobs: [jobRecord],
    inspections,
    quotationItems,
  };
}

