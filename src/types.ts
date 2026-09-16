export type CustomerGroup = 'expat' | 'villa_owner' | 'rental_investor';

export type JobStatus = 'Inspection' | 'Quoted' | 'Paid' | 'Completed';

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

