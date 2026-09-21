import React, { useState, useRef, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Calendar,
  MoreVertical,
  Edit2,
  CalendarDays,
  Truck,
  FileText,
  Building2,
  CheckCircle2,
  Phone,
  MessageSquare,
  Play,
  RotateCcw,
  Check,
  CreditCard,
  User,
} from 'lucide-react';
import { InspectionJob, Customer, Property, Vendor } from '../types';
import { useLanguage } from '../i18n/translations';
import {
  getLocalizedServiceName,
  getDominantJobState,
  getPrimaryJobAction,
} from '../utils/serviceWorkflow';
import { formatTime24h, formatDateDisplay } from '../utils/dateTime';

interface JobCardProps {
  job: InspectionJob;
  customer?: Customer;
  property?: Property;
  vendor?: Vendor;
  showDate?: boolean;
  onOpenInspection: (jobId: string) => void;
  onOpenQuotation: (jobId: string) => void;
  onOpenScheduleModal?: (job: InspectionJob) => void;
  onOpenAssignVendorModal?: (job: InspectionJob) => void;
  onConfirmAppointment?: (jobId: string) => void;
  onOpenEditJob?: (job: InspectionJob) => void;
  onUpdateJobStatus?: (jobId: string, status: InspectionJob['status']) => void;
  onSelectProperty?: (propertyId: string) => void;
  onSelectCustomer?: (customerId: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  customer,
  property,
  vendor,
  showDate = false,
  onOpenInspection,
  onOpenQuotation,
  onOpenScheduleModal,
  onOpenAssignVendorModal,
  onConfirmAppointment,
  onOpenEditJob,
  onUpdateJobStatus,
  onSelectProperty,
  onSelectCustomer,
}) => {
  const { lang, t } = useLanguage();
  const isTh = lang === 'th';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // WhatsApp helpers
  const cleanPhone = (p?: string) => (p || '').replace(/[^0-9+]/g, '');
  const makeWhatsappUrl = (p?: string, text?: string) => {
    const phone = cleanPhone(p).replace(/^\+/, '');
    if (!phone) return undefined;
    return `https://wa.me/${phone}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  };

  const custPhone = customer?.phone || job.customerPhone;
  const custWa = makeWhatsappUrl(
    custPhone,
    isTh
      ? `สวัสดีครับ จาก Phuket Trusted Local สอบถามเรื่องนัดหมายงาน ${job.serviceType}`
      : `Hello! Following up from Phuket Trusted Local regarding your ${job.serviceType} appointment.`
  );

  const vendorPhone = vendor?.phone;
  const vendorWa = makeWhatsappUrl(
    vendorPhone,
    isTh
      ? `สวัสดีครับช่าง ติดต่องาน ${job.serviceType} ที่ ${job.villaName || job.propertyLocation}`
      : `Hello! Phuket Trusted Local job assignment update for ${job.serviceType}.`
  );

  // Calculated dominant state and primary action
  const dominantState = getDominantJobState(job, lang);
  const primaryAction = getPrimaryJobAction(job, lang);

  // Formatted service name and location
  const serviceTitle = getLocalizedServiceName(job.serviceType, lang);
  const areaName = property?.area || job.serviceArea || job.propertyLocation || 'Phuket';
  const villaTitle = job.villaName || property?.name || (isTh ? 'วิลล่า' : 'Property');

  // Formatted date and time (Strict 24h)
  const effectiveDate = job.scheduledDate || job.inspectionDate;
  const dateLabel = formatDateDisplay(effectiveDate, lang) || (isTh ? 'วันนี้' : 'Today');
  const time24 = formatTime24h(job.scheduledTime) || '10:00';

  // Handle primary action execution
  const handleExecutePrimaryAction = () => {
    switch (primaryAction.type) {
      case 'confirm_appointment':
        if (onConfirmAppointment) {
          onConfirmAppointment(job.id);
        } else if (onUpdateJobStatus) {
          onUpdateJobStatus(job.id, 'Scheduled');
        }
        break;
      case 'resume_job':
      case 'start_job':
      case 'open_job':
        onOpenInspection(job.id);
        break;
      case 'contact_customer':
        if (custWa) {
          window.open(custWa, '_blank');
        } else if (custPhone) {
          window.location.href = `tel:${cleanPhone(custPhone)}`;
        } else {
          onOpenInspection(job.id);
        }
        break;
      case 'contact_vendor':
        if (vendorWa) {
          window.open(vendorWa, '_blank');
        } else if (vendorPhone) {
          window.location.href = `tel:${cleanPhone(vendorPhone)}`;
        } else if (onOpenAssignVendorModal) {
          onOpenAssignVendorModal(job);
        }
        break;
      case 'assign_vendor':
        if (onOpenAssignVendorModal) {
          onOpenAssignVendorModal(job);
        } else {
          onOpenInspection(job.id);
        }
        break;
      case 'record_payment':
        onOpenQuotation(job.id);
        break;
      default:
        onOpenInspection(job.id);
        break;
    }
  };

  return (
    <div
      id={`job-card-${job.id}`}
      onClick={() => onOpenInspection(job.id)}
      className={`rounded-2xl border transition-all duration-150 p-3.5 sm:p-4 bg-white shadow-xs hover:shadow-md relative w-full min-w-0 cursor-pointer active:scale-[0.99] ${
        dominantState.key === 'in_progress'
          ? 'border-blue-300 ring-2 ring-blue-500/20 bg-gradient-to-b from-blue-50/30 to-white'
          : dominantState.key === 'appointment_unconfirmed'
          ? 'border-amber-200 bg-gradient-to-b from-amber-50/20 to-white'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* ========================================================================= */}
      {/* ROW 1: CUSTOMER NAME & SECONDARY ACTIONS MENU */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="min-w-0 flex items-center gap-1.5 flex-1">
          {customer?.id && onSelectCustomer ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCustomer(customer.id);
              }}
              className="text-sm font-extrabold text-slate-900 hover:text-blue-700 truncate text-left transition-colors cursor-pointer"
              title="View Customer Profile"
            >
              {job.customerName || customer.name || (isTh ? 'ลูกค้า' : 'Client')}
            </button>
          ) : (
            <span className="text-sm font-extrabold text-slate-900 truncate">
              {job.customerName || customer?.name || (isTh ? 'ลูกค้า' : 'Client')}
            </span>
          )}

          {/* Customer Group / VIP Badge if applicable */}
          {customer?.group === 'vip' && (
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
              VIP
            </span>
          )}
        </div>

        {/* Secondary Actions (...) Dropdown Menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={t.quickActions?.moreOptions || 'More options'}
            aria-label="More actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Open Job / Inspect */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onOpenInspection(job.id);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 text-left cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.quickActions?.openJob || (isTh ? 'เปิดงาน' : 'Open Job')}</span>
              </button>

              {/* Edit Job */}
              {onOpenEditJob && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onOpenEditJob(job);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 text-left cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.quickActions?.editJob || (isTh ? 'แก้ไขข้อมูลงาน' : 'Edit Job Details')}</span>
                </button>
              )}

              {/* Reschedule */}
              {onOpenScheduleModal && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onOpenScheduleModal(job);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 text-left cursor-pointer"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t.quickActions?.reschedule || (isTh ? 'เลื่อนนัดหมาย' : 'Reschedule')}</span>
                </button>
              )}

              {/* Assign or Contact Vendor */}
              {onOpenAssignVendorModal && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onOpenAssignVendorModal(job);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 text-left cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5 text-purple-600" />
                  <span>
                    {vendor
                      ? (t.quickActions?.contactVendor || (isTh ? 'ติดต่อช่าง' : 'Contact Vendor'))
                      : (t.quickActions?.assignVendor || (isTh ? 'มอบหมายช่าง' : 'Assign Vendor'))}
                  </span>
                </button>
              )}

              {/* Quotation / Invoice */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onOpenQuotation(job.id);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 text-left cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.quickActions?.viewQuote || (isTh ? 'ดูใบเสนอราคา' : 'View Quote')}</span>
              </button>

              {/* View Property */}
              {property?.id && onSelectProperty && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onSelectProperty(property.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 text-left cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isTh ? 'ดูสถานที่' : 'View Property'}</span>
                </button>
              )}

              {/* Quick Customer WhatsApp */}
              {custWa && (
                <a
                  href={custWa}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 text-left border-t border-slate-100"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp {isTh ? 'ลูกค้า' : 'Client'}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: SERVICE • AREA (e.g. Smart Home • Kathu) */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5 truncate">
        <span className="text-slate-900 font-bold">{serviceTitle}</span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-600 truncate flex items-center gap-0.5">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{areaName}</span>
        </span>
        {villaTitle && villaTitle !== areaName && (
          <>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 truncate">{villaTitle}</span>
          </>
        )}
      </div>

      {/* Optional Short Request Description */}
      {job.requestDescription && (
        <p className="text-[11px] text-slate-500 line-clamp-1 mb-2 bg-slate-50/80 px-2 py-1 rounded-md border border-slate-100">
          {job.requestDescription}
        </p>
      )}

      {/* ========================================================================= */}
      {/* ROW 3: DATE • TIME (Strict 24-Hour format) */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 mb-2.5">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{dateLabel}</span>
        </span>
        <span className="text-slate-300">•</span>
        <span className="flex items-center gap-1 text-blue-700">
          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>{time24}</span>
        </span>
      </div>

      {/* ========================================================================= */}
      {/* ROW 4 & 5: ONE DOMINANT STATUS BADGE & ONE PRIMARY NEXT ACTION */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        {/* ONE Dominant State Badge */}
        <div className="min-w-0">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs tracking-wide truncate ${dominantState.badgeClass}`}
          >
            {dominantState.label}
          </span>
        </div>

        {/* ONE Primary Next Action Button (≥44px touch target) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleExecutePrimaryAction();
          }}
          className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer select-none active:scale-98 flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap ${primaryAction.buttonClass}`}
        >
          {primaryAction.type === 'confirm_appointment' && <Check className="w-4 h-4 stroke-[3]" />}
          {primaryAction.type === 'resume_job' && <Play className="w-4 h-4 fill-current" />}
          {primaryAction.type === 'start_job' && <Play className="w-4 h-4 fill-current" />}
          {primaryAction.type === 'contact_customer' && <MessageSquare className="w-4 h-4" />}
          {primaryAction.type === 'contact_vendor' && <Phone className="w-4 h-4" />}
          {primaryAction.type === 'assign_vendor' && <Truck className="w-4 h-4" />}
          {primaryAction.type === 'record_payment' && <CreditCard className="w-4 h-4" />}
          <span>{primaryAction.label}</span>
        </button>
      </div>
    </div>
  );
};
