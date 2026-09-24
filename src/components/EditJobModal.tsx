import React, { useState } from 'react';
import {
  X,
  Briefcase,
  User,
  Building2,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  Wrench,
  ShieldAlert,
  Save,
  MapPin,
  UserCheck,
} from 'lucide-react';
import {
  InspectionJob,
  JobStatus,
  JobPurpose,
  Vendor,
  ExecutionMode,
  AssignedToType,
  getOwnerStatusLabel,
} from '../types';
import { JOB_PURPOSES } from '../utils/jobPurpose';
import { DateTimeSelector } from './DateTimeSelector';
import { useLanguage } from '../i18n/translations';
import { PHUKET_SERVICE_AREAS, recordJobActivity } from '../utils/jobEvents';

interface EditJobModalProps {
  job: InspectionJob;
  vendors?: Vendor[];
  isOpen: boolean;
  onClose: () => void;
  onSaveJob: (updatedJob: InspectionJob) => void;
}

const COMMON_SERVICES = [
  'Home Watch',
  'Pool Cleaning & Water Balancing',
  'Air Conditioning Maintenance & Deep Clean',
  'Garden & Landscape Maintenance',
  'Electrical & Generator Inspection',
  'Pest Control Inspection',
  'Plumbing & Pump Inspection',
  'Roadside Assistance & Emergency Dispatch',
  'Roof & Leak Inspection',
  'General Handyman & Repairs',
];

export const EditJobModal: React.FC<EditJobModalProps> = ({
  job,
  vendors = [],
  isOpen,
  onClose,
  onSaveJob,
}) => {
  const { lang, t } = useLanguage();
  const isTh = lang === 'th';

  const [serviceType, setServiceType] = useState(job.serviceType || '');
  const [jobPurpose, setJobPurpose] = useState<JobPurpose | undefined>(job.jobPurpose);
  const [customerName, setCustomerName] = useState(job.customerName || '');
  const [villaName, setVillaName] = useState(job.villaName || '');
  const [propertyLocation, setPropertyLocation] = useState(job.propertyLocation || '');
  const [serviceArea, setServiceArea] = useState(job.serviceArea || '');
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(
    job.executionMode || (job.assignedVendorId || job.vendorId ? 'VENDOR' : 'OWNER')
  );
  const [requestDescription, setRequestDescription] = useState(job.requestDescription || '');
  const [price, setPrice] = useState<string>(job.price !== undefined ? String(job.price) : '');
  const [urgency, setUrgency] = useState<'Normal' | 'Urgent'>(job.urgency || 'Normal');
  const [status, setStatus] = useState<JobStatus>(job.status);
  const [appointmentConfirmation, setAppointmentConfirmation] = useState<
    'Not Confirmed' | 'Confirmed' | 'Cancelled'
  >(job.appointmentConfirmation || (job.isConfirmed ? 'Confirmed' : 'Not Confirmed'));
  const [vendorId, setVendorId] = useState(job.vendorId || job.assignedVendorId || '');

  // Scheduled date & time
  const [scheduledDate, setScheduledDate] = useState(job.scheduledDate || job.inspectionDate || 'Today');
  const [scheduledTime, setScheduledTime] = useState(job.scheduledTime || '18:00');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if date was changed -> Record reschedule history without destroying job
    const wasRescheduled =
      job.scheduledDate &&
      scheduledDate &&
      job.scheduledDate !== scheduledDate &&
      job.scheduledDate !== 'Today';

    const selectedVendor = vendors.find((v) => v.id === vendorId);
    const now = new Date().toISOString();

    // Determine assignedToType
    let derivedAssignedToType: AssignedToType = 'OWNER';
    if (vendorId || executionMode === 'VENDOR' || executionMode === 'VENDOR_WITH_PTL_SUPERVISION') {
      derivedAssignedToType = 'VENDOR';
    } else if (executionMode === 'PTL_HELPER') {
      derivedAssignedToType = 'HELPER';
    }

    // Preserve all relationships (Quotation, Invoice, Items/Findings, Evidence Photos, Checklists, Events)
    let updatedJob: InspectionJob = {
      ...job,
      serviceType: serviceType.trim() || job.serviceType,
      jobPurpose,
      customerName: customerName.trim() || job.customerName,
      villaName: villaName.trim() || job.villaName,
      propertyLocation: propertyLocation.trim() || job.propertyLocation,
      serviceArea: serviceArea.trim() || undefined,
      executionMode,
      assignedToType: derivedAssignedToType,
      assignedToId: derivedAssignedToType === 'VENDOR' ? (vendorId || undefined) : undefined,
      assignedAt: vendorId ? (job.assignedAt || now) : job.assignedAt,
      assignedBy: job.assignedBy || 'PTL Owner',
      requestDescription: requestDescription.trim(),
      price: price === '' ? undefined : parseFloat(price) || 0,
      urgency,
      status,
      appointmentConfirmation,
      isConfirmed: appointmentConfirmation === 'Confirmed',
      vendorId: vendorId || undefined,
      assignedVendorId: vendorId || undefined,
      assignedVendorName: selectedVendor?.name || job.assignedVendorName,
      vendorPhone: selectedVendor?.phone || job.vendorPhone,
      scheduledDate,
      scheduledTime,
      inspectionDate: scheduledDate,
      rescheduledFromDate: wasRescheduled ? job.scheduledDate : job.rescheduledFromDate,
      appointmentOutcome: wasRescheduled ? 'Rescheduled' : job.appointmentOutcome,
      actualStartedAt: status === 'In Progress' ? (job.actualStartedAt || now) : job.actualStartedAt,
      actualCompletedAt: status === 'Completed' ? (job.actualCompletedAt || now) : job.actualCompletedAt,
      lastActivityAt: now,
    };

    // Log status change activity
    if (job.status !== status) {
      updatedJob = recordJobActivity(updatedJob, 'STATUS_CHANGED', {
        summary: `Status updated to ${status}`,
        metadata: { from: job.status, to: status },
      });
    }

    // Log assignment activity if vendor changed
    const prevVendorId = job.vendorId || job.assignedVendorId || '';
    if (prevVendorId !== vendorId) {
      updatedJob = recordJobActivity(updatedJob, 'JOB_ASSIGNED', {
        summary: selectedVendor ? `Assigned to ${selectedVendor.name}` : 'Assigned to PTL Owner',
        metadata: { assignedTo: selectedVendor?.name || 'PTL Owner', vendorId },
      });
    }

    onSaveJob(updatedJob);
    onClose();
  };

  const statusOptions: JobStatus[] = [
    'New',
    'Waiting Approval',
    'Scheduled',
    'In Progress',
    'Waiting Customer',
    'Waiting Vendor',
    'Waiting Payment',
    'Completed',
    'Cancelled',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-xs">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  {isTh ? 'แก้ไขข้อมูลงาน' : 'Edit Job'}
                </h3>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                  {job.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isTh
                  ? 'แก้ไขรายละเอียด วันเวลานัดหมาย สถานะ และช่างผู้รับเหมา โดยไม่สูญเสียใบเสนอราคาหรือรูปถ่าย'
                  : 'Update job details, scheduled date/time, and status without affecting linked quotes or photos'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200/80 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* 1. Date & Time Selector Component */}
          <DateTimeSelector
            date={scheduledDate}
            time={scheduledTime}
            onChangeDate={setScheduledDate}
            onChangeTime={setScheduledTime}
            label={isTh ? 'วันเวลานัดหมาย' : 'Scheduled Appointment Date & Time'}
          />

          {/* 2. Customer & Property Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{isTh ? 'ชื่อลูกค้า' : 'Customer Name'}</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{isTh ? 'ชื่อวิลล่า / อาคาร' : 'Villa / Property Name'}</span>
              </label>
              <input
                type="text"
                required
                value={villaName}
                onChange={(e) => setVillaName(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isTh ? 'ที่ตั้ง / โลเคชัน / จุดสังเกต' : 'Location / Address / Landmark'}
              </label>
              <input
                type="text"
                value={propertyLocation}
                onChange={(e) => setPropertyLocation(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{isTh ? 'พื้นที่บริการ (โซนภูเก็ต)' : 'Service Area / Phuket Zone'}</span>
              </label>
              <input
                type="text"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                list="phuket-areas-list"
                placeholder={isTh ? 'เช่น Rawai, Chalong, Bang Tao...' : 'e.g. Rawai, Bang Tao, Chalong...'}
                className="w-full min-h-[44px] px-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <datalist id="phuket-areas-list">
                {PHUKET_SERVICE_AREAS.map((area) => (
                  <option key={area} value={area} />
                ))}
              </datalist>
            </div>
          </div>

          {/* 3. Service Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'ประเภทงาน / บริการ' : 'Service Type'}
            </label>
            <input
              type="text"
              required
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              list="common-services-list"
              className="w-full min-h-[44px] px-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
            />
            <datalist id="common-services-list">
              {COMMON_SERVICES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {/* 4. Request Description */}
          <div>
            <label htmlFor="edit-job-purpose" className="block text-xs font-bold text-slate-700 mb-1">{t.quickJob.jobPurpose}</label>
            <select id="edit-job-purpose" value={jobPurpose || ''} onChange={(e) => setJobPurpose(e.target.value ? e.target.value as JobPurpose : undefined)} className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl">
              <option value="">{t.quickJob.purposeNotSet}</option>
              {JOB_PURPOSES.map((purpose) => <option key={purpose} value={purpose}>{t.jobPurpose[purpose]}</option>)}
            </select>
            {jobPurpose === 'INSPECTION_DIAGNOSIS' && <p className="mt-1.5 text-xs text-slate-600">{t.quickJob.inspectionPurposeHelp}</p>}
            {jobPurpose === 'FAULT_FINDING' && <p className="mt-1.5 text-xs text-slate-600">{t.quickJob.faultPurposeHelp}</p>}
            {jobPurpose === 'KNOWN_SCOPE_SERVICE' && <p className="mt-1.5 text-xs text-slate-600">{t.quickJob.knownScopePurposeHelp}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'รายละเอียดคำขอ / ปัญหาที่แจ้ง' : 'Request Description / Job Notes'}
            </label>
            <textarea
              rows={2}
              value={requestDescription}
              onChange={(e) => setRequestDescription(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder={isTh ? 'ระบุรายละเอียดงานหรืออาการเสีย...' : 'Details of client request or reported issue...'}
            />
          </div>

          {/* 5. Pricing & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>{isTh ? 'ราคาที่ตกลง (บาท)' : 'Agreed Price (THB)'}</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full min-h-[44px] px-3 py-2 text-base sm:text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isTh ? 'ระดับความด่วน' : 'Urgency Level'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUrgency('Normal')}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    urgency === 'Normal'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isTh ? 'ปกติ (Normal)' : 'Normal'}
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency('Urgent')}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    urgency === 'Urgent'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  ⚡ {isTh ? 'ด่วน (Urgent)' : 'Urgent'}
                </button>
              </div>
            </div>
          </div>

          {/* 6. Appointment Confirmation & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isTh ? 'การยืนยันการนัดหมาย' : 'Appointment Confirmation'}</span>
              </label>
              <select
                value={appointmentConfirmation}
                onChange={(e) =>
                  setAppointmentConfirmation(
                    e.target.value as 'Not Confirmed' | 'Confirmed' | 'Cancelled'
                  )
                }
                className="w-full min-h-[44px] px-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
              >
                <option value="Not Confirmed">{isTh ? '⏳ ยังไม่ยืนยัน (Not Confirmed)' : '⏳ Not Confirmed'}</option>
                <option value="Confirmed">{isTh ? '✓ ยืนยันแล้ว (Confirmed)' : '✓ Confirmed'}</option>
                <option value="Cancelled">{isTh ? '✕ ยกเลิกการนัด (Cancelled)' : '✕ Cancelled'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isTh ? 'สถานะงาน (Job Status)' : 'Job Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatus)}
                className="w-full min-h-[44px] px-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
              >
                {statusOptions.map((st) => (
                  <option key={st} value={st}>
                    {getOwnerStatusLabel(st, lang)} ({st})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 7. Assigned Vendor & Execution Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-purple-600" />
                <span>{isTh ? 'ผู้รับเหมา / ช่างซ่อม' : 'Assigned Vendor / Specialist'}</span>
              </label>
              <select
                value={vendorId}
                onChange={(e) => {
                  const newVendorId = e.target.value;
                  setVendorId(newVendorId);
                  if (newVendorId && executionMode === 'OWNER') {
                    setExecutionMode('VENDOR');
                  } else if (!newVendorId && executionMode === 'VENDOR') {
                    setExecutionMode('OWNER');
                  }
                }}
                className="w-full min-h-[44px] px-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 font-medium"
              >
                <option value="">{isTh ? '-- ทำเอง / เจ้าของดำเนินการ --' : '-- In-house / PTL Owner --'}</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.serviceCategory}) - {v.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>{isTh ? 'รูปแบบการดำเนินงาน' : 'Execution Mode'}</span>
              </label>
              <select
                value={executionMode}
                onChange={(e) => setExecutionMode(e.target.value as ExecutionMode)}
                className="w-full min-h-[44px] px-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="OWNER">{isTh ? 'เจ้าของทำเอง (PTL Owner)' : 'PTL Owner (Direct)'}</option>
                <option value="PTL_HELPER">{isTh ? 'ผู้ช่วยทีมงาน (PTL Helper)' : 'PTL Helper / Team'}</option>
                <option value="VENDOR">{isTh ? 'ส่งช่างนอกทำ (Vendor)' : 'Specialist Vendor'}</option>
                <option value="VENDOR_WITH_PTL_SUPERVISION">{isTh ? 'ช่างนอก + เจ้าของคุมงาน' : 'Vendor + PTL Supervision'}</option>
                <option value="REMOTE">{isTh ? 'ประสานงานระยะไกล (Remote)' : 'Remote / Coordination'}</option>
              </select>
            </div>
          </div>

          {/* Attached Artifacts Safety Guarantee Notice */}
          <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">
                {isTh ? 'ความปลอดภัยของข้อมูล' : 'Relationship Preservation'}
              </span>
              <span>
                {isTh
                  ? `ระบบจะรักษาใบเสนอราคา, รูปภาพหลักฐาน (${job.items?.length || 0} รายการ), และบันทึกค่าใช้จ่ายทั้งหมดไว้อย่างสมบูรณ์`
                  : `All quotes, invoices, findings (${job.items?.length || 0} items), and evidence photos remain safely linked.`}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {isTh ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2 text-xs sm:text-sm font-black text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>{isTh ? 'บันทึกการแก้ไข' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
