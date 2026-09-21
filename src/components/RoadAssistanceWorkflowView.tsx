import React, { useState, useRef } from 'react';
import {
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  DollarSign,
  Camera,
  CheckCircle2,
  Users,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { InspectionJob, Vendor } from '../types';
import { useLanguage } from '../i18n/translations';

interface RoadAssistanceWorkflowViewProps {
  job: InspectionJob;
  vendors: Vendor[];
  previousActiveJob?: InspectionJob | null;
  onUpdateJob: (updater: (prev: InspectionJob) => InspectionJob) => void;
  onRecordPayment: (jobId: string, amount: number) => void;
  onAssignVendor: (vendor: Vendor) => void;
  onCompleteJob: () => void;
  onResumePreviousJob: (jobId: string) => void;
}

export const RoadAssistanceWorkflowView: React.FC<RoadAssistanceWorkflowViewProps> = ({
  job,
  vendors,
  previousActiveJob,
  onUpdateJob,
  onRecordPayment,
  onAssignVendor,
  onCompleteJob,
  onResumePreviousJob,
}) => {
  const { lang, t } = useLanguage();

  const fileInputBeforeRef = useRef<HTMLInputElement>(null);
  const fileInputAfterRef = useRef<HTMLInputElement>(null);

  const [selectedVendorId, setSelectedVendorId] = useState<string>(job.assignedVendorId || '');
  const [vendorCostInput, setVendorCostInput] = useState<string>(
    String(job.vendorCostEstimate || 800)
  );
  const [customerPriceInput, setCustomerPriceInput] = useState<string>(
    String(job.price || 1800)
  );
  const [vendorEtaInput, setVendorEtaInput] = useState<string>(job.vendorEta || '30 mins');
  const [isCopiedWhatsApp, setIsCopiedWhatsApp] = useState(false);

  const customerPrice = parseFloat(customerPriceInput) || job.price || 1800;
  const vendorCost = parseFloat(vendorCostInput) || job.vendorCostEstimate || 800;
  const netMargin = Math.max(0, customerPrice - vendorCost);

  const isArrived = Boolean(job.siteArrivedAt);
  const isPaid = job.status === 'Paid' || (job.price && job.waitingOn !== 'customer' && job.waitingOn !== 'payment');

  // Handle Arrival stamping
  const handleMarkArrived = () => {
    const now = new Date().toISOString();
    onUpdateJob((prev) => ({
      ...prev,
      siteArrivedAt: now,
      status: 'In Progress',
    }));
  };

  // Vendor Assignment
  const handleAssignVendorChange = (vId: string) => {
    setSelectedVendorId(vId);
    const found = vendors.find((v) => v.id === vId);
    if (found) {
      onUpdateJob((prev) => ({
        ...prev,
        assignedVendorId: found.id,
        assignedVendorName: found.name,
        vendorPhone: found.phone,
        vendorCostEstimate: vendorCost,
        vendorEta: vendorEtaInput,
        vendorStatus: 'Vendor Confirmed',
      }));
    }
  };

  // Photo handlers
  const handleCapturePhoto = (type: 'before' | 'after', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      onUpdateJob((prev) => ({
        ...prev,
        [type === 'before' ? 'beforePhotoUrl' : 'afterPhotoUrl']: dataUrl,
        [type === 'before' ? 'beforeOriginalPhotoUrl' : 'afterOriginalPhotoUrl']: dataUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  // WhatsApp PromptPay template
  const handleCopyWhatsAppMessage = () => {
    const message = `Hello ${job.customerName}, this is Phuket Trusted Local. We have dispatched roadside assistance to your location: ${job.propertyLocation}. Agreed service fee is ฿${customerPrice.toLocaleString()} THB. Please confirm payment via PromptPay/Transfer. Thank you!`;
    navigator.clipboard.writeText(message);
    setIsCopiedWhatsApp(true);
    setTimeout(() => setIsCopiedWhatsApp(false), 3000);
  };

  const openGoogleMaps = () => {
    const query = encodeURIComponent(job.propertyLocation || 'Phuket');
    window.open(`https://maps.google.com/?q=${query}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Hidden inputs for photos */}
      <input
        type="file"
        ref={fileInputBeforeRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => handleCapturePhoto('before', e)}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputAfterRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => handleCapturePhoto('after', e)}
        className="hidden"
      />

      {/* Banner if another job was in progress when interrupted */}
      {previousActiveJob && previousActiveJob.id !== job.id && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-5 h-5 text-slate-950 shrink-0" />
            <div className="min-w-0 text-xs font-black truncate">
              <span>{t.roadsideFlow.resumePreviousJob}: </span>
              <span className="font-extrabold">{previousActiveJob.customerName} — {previousActiveJob.villaName}</span>
            </div>
          </div>
          <button
            onClick={() => onResumePreviousJob(previousActiveJob.id)}
            className="bg-slate-950 hover:bg-slate-900 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs shrink-0 cursor-pointer"
          >
            {t.actions.resume} &rarr;
          </button>
        </div>
      )}

      {/* Header card */}
      <div className="bg-[#0f1d33] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                EMERGENCY ROADSIDE
              </span>
              <span className="text-xs text-slate-400">
                Ref: {job.id}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {job.serviceType}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              {job.requestDescription || (lang === 'th' ? 'ช่วยเหลือยางรั่ว / รถฉุกเฉิน' : 'Emergency tire / roadside rescue')}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {!isArrived ? (
              <button
                onClick={handleMarkArrived}
                className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                <span>{t.roadsideFlow.arrivedSiteBtn}</span>
              </button>
            ) : (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'th' ? 'ถึงหน้างานแล้ว' : 'Arrived on Site'}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid of operational modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Customer & Location Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {t.roadsideFlow.contactCustomer}
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              {job.customerGroup}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-base font-extrabold text-slate-900">
              {job.customerName}
            </div>
            <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
              <span className="font-medium">{job.propertyLocation}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={openGoogleMaps}
              className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border border-blue-200 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span>{t.actions.maps}</span>
            </button>

            <button
              onClick={() => alert(`Calling customer: ${job.customerName}`)}
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border border-emerald-200 cursor-pointer"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>{t.actions.call}</span>
            </button>

            <button
              onClick={handleCopyWhatsAppMessage}
              className="p-2.5 bg-green-50 hover:bg-green-100 text-green-800 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border border-green-200 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-green-600" />
              <span>{isCopiedWhatsApp ? 'Copied!' : t.actions.whatsApp}</span>
            </button>
          </div>
        </div>

        {/* 2. Vendor Assignment & ETA */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {t.roadsideFlow.vendorAssigned}
            </span>
            <span className="text-[11px] font-bold text-blue-600">
              {job.vendorStatus || 'Pending'}
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Select Roadside / Tire Vendor
            </label>
            <select
              value={selectedVendorId}
              onChange={(e) => handleAssignVendorChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Vendor --</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.serviceCategory}) - {v.phone}
                </option>
              ))}
              <option value="LOCAL_TIRE">Bang Tao 24h Mobile Tire Rescue</option>
              <option value="CHALONG_TIRE">Chalong Quick Tire &amp; Battery</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                {t.roadsideFlow.vendorEta}
              </label>
              <input
                type="text"
                value={vendorEtaInput}
                onChange={(e) => setVendorEtaInput(e.target.value)}
                placeholder="e.g. 25-30 mins"
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                {t.roadsideFlow.vendorCostEst}
              </label>
              <input
                type="number"
                value={vendorCostInput}
                onChange={(e) => setVendorCostInput(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* 3. Financial Summary & Instant Payment */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
            Money &amp; Profit Breakdown
          </span>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 font-bold uppercase">Customer Price</div>
              <div className="text-lg font-black text-slate-900">฿{customerPrice.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-500 font-bold uppercase">Vendor Cost</div>
              <div className="text-sm font-extrabold text-slate-700">฿{vendorCost.toLocaleString()}</div>
            </div>
            <div className="text-right pl-3 border-l border-slate-200">
              <div className="text-[11px] text-emerald-700 font-bold uppercase">PTL Net</div>
              <div className="text-lg font-black text-emerald-600">+฿{netMargin.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onRecordPayment(job.id, customerPrice)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>{t.actions.recordPayment}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyWhatsAppMessage}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer"
            >
              {t.actions.requestPayment}
            </button>
          </div>
        </div>

        {/* 4. Photo Evidence (Before / After) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
            {lang === 'th' ? 'ภาพถ่ายหลักฐานหน้างาน' : 'Before & After Work Evidence'}
          </span>

          <div className="grid grid-cols-2 gap-3">
            {/* Before Photo */}
            <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-center">
              {job.beforePhotoUrl ? (
                <img
                  src={job.beforePhotoUrl}
                  alt="Before"
                  className="w-full h-24 object-cover rounded-lg mb-1"
                />
              ) : (
                <Camera className="w-6 h-6 text-slate-400 mb-1" />
              )}
              <button
                type="button"
                onClick={() => fileInputBeforeRef.current?.click()}
                className="text-[11px] font-bold text-blue-600 hover:underline mt-1"
              >
                {job.beforePhotoUrl ? 'Change' : t.roadsideFlow.beforePhotoBtn}
              </button>
            </div>

            {/* After Photo */}
            <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-center">
              {job.afterPhotoUrl ? (
                <img
                  src={job.afterPhotoUrl}
                  alt="After"
                  className="w-full h-24 object-cover rounded-lg mb-1"
                />
              ) : (
                <Camera className="w-6 h-6 text-slate-400 mb-1" />
              )}
              <button
                type="button"
                onClick={() => fileInputAfterRef.current?.click()}
                className="text-[11px] font-bold text-blue-600 hover:underline mt-1"
              >
                {job.afterPhotoUrl ? 'Change' : t.roadsideFlow.afterPhotoBtn}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-black text-slate-900">
            {lang === 'th' ? 'งานช่วยเหลือเสร็จสิ้นแล้วหรือไม่?' : 'Finished roadside assistance?'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {lang === 'th' ? 'บันทึกปิดงาน และกลับไปดูแลงานอื่นที่ค้างไว้ได้ทันที' : 'Complete job and resume pending operations'}
          </div>
        </div>

        <button
          onClick={onCompleteJob}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>{t.roadsideFlow.completeAssistanceBtn}</span>
        </button>
      </div>
    </div>
  );
};
