import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Building2,
  User,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  Wrench,
  Car,
  Users,
  Wifi,
  Camera,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Customer, Property, InspectionJob, JobPurpose, RecurringService } from '../types';
import { generateHomeWatchSchedule } from '../utils/homeWatchSchedule';
import { JOB_PURPOSES, suggestJobPurpose } from '../utils/jobPurpose';
import {
  PTL_SERVICES,
  getWorkflowPresetForService,
  createDefaultHomeWatchChecklist,
  createDefaultHomeInspectionChecklist,
  isHomeWatchService,
  ServiceDefinition,
} from '../utils/serviceWorkflow';
import { useLanguage } from '../i18n/translations';

interface QuickJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  properties: Property[];
  onSaveJob: (newJob: InspectionJob, plan?: RecurringService) => void;
  presetCustomerId?: string | null;
  presetPropertyId?: string | null;
  initialUrgency?: 'Normal' | 'Urgent';
}

export const QuickJobModal: React.FC<QuickJobModalProps> = ({
  isOpen,
  onClose,
  customers,
  properties,
  onSaveJob,
  presetCustomerId,
  presetPropertyId,
  initialUrgency = 'Normal',
}) => {
  const { lang, t } = useLanguage();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    presetCustomerId || customers[0]?.id || ''
  );
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    presetPropertyId || ''
  );
  const [customPropertyLocation, setCustomPropertyLocation] = useState('');

  // Service selection
  const [selectedServiceId, setSelectedServiceId] = useState<string>('home_watch');
  const [jobPurpose, setJobPurpose] = useState<JobPurpose>('HOME_WATCH_VISIT');
  const [purposeCustomized, setPurposeCustomized] = useState(false);
  const [customServiceText, setCustomServiceText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const [urgency, setUrgency] = useState<'Normal' | 'Urgent'>(initialUrgency);
  const [requestDescription, setRequestDescription] = useState('');
  const [price, setPrice] = useState<string>('1500');
  const [isPriceCustomized, setIsPriceCustomized] = useState<boolean>(false);
  const [homeWatchVisits, setHomeWatchVisits] = useState(1);
  const [homeWatchFirstDate, setHomeWatchFirstDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [homeWatchTime, setHomeWatchTime] = useState('10:00');

  const selectedServiceDef = PTL_SERVICES.find((s) => s.id === selectedServiceId) || PTL_SERVICES[0];

  // Sync preset props when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialUrgency) {
        setUrgency(initialUrgency);
      }
      if (presetCustomerId) {
        setSelectedCustomerId(presetCustomerId);
        const custProps = properties.filter((p) => p.customerId === presetCustomerId);
        if (custProps.length > 0) {
          setSelectedPropertyId(custProps[0].id);
        }
      } else if (customers.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(customers[0].id);
      }
    }
  }, [isOpen, initialUrgency, presetCustomerId, customers, properties]);

  // When customer changes, pre-select property
  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    if (custId !== 'NEW') {
      const custProps = properties.filter((p) => p.customerId === custId);
      if (custProps.length > 0) {
        setSelectedPropertyId(custProps[0].id);
      } else {
        setSelectedPropertyId('NEW');
      }
    }
  };

  const handleSelectService = (service: ServiceDefinition) => {
    setSelectedServiceId(service.id);
    if (!purposeCustomized) setJobPurpose(suggestJobPurpose(service.id));
    // Price safety: Only set default placeholder price if user has not entered a custom price
    if (!isPriceCustomized) {
      setPrice(service.defaultPrice > 0 ? String(service.defaultPrice) : '');
    }
    if (service.id === 'roadside_tire') {
      setUrgency('Urgent');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const matchedCustomer = customers.find((c) => c.id === selectedCustomerId);
    const finalCustomerName =
      selectedCustomerId === 'NEW'
        ? customCustomerName.trim() || (lang === 'th' ? 'ลูกค้าใหม่' : 'New Customer')
        : matchedCustomer?.fullName || matchedCustomer?.preferredName || matchedCustomer?.name || 'Customer';

    const matchedProperty = properties.find((p) => p.id === selectedPropertyId);
    const finalVillaName =
      selectedPropertyId === 'NEW'
        ? customPropertyLocation.trim() || (lang === 'th' ? 'สถานที่หน้างาน' : 'Site Location')
        : matchedProperty?.name || matchedProperty?.propertyName || 'Site Location';

    const finalLocation =
      selectedPropertyId === 'NEW'
        ? customPropertyLocation.trim() || 'Phuket, Thailand'
        : matchedProperty?.address || 'Phuket, Thailand';

    const finalService =
      selectedServiceId === 'custom_job' && customServiceText.trim()
        ? customServiceText.trim()
        : selectedServiceDef.name;

    const parsedPrice = Number.isFinite(Number(price)) && Number(price) > 0 ? Number(price) : 0;
    const today = new Date();
    const dateSlug = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newJobId = `PTL-JOB-${dateSlug}-${randomSuffix}`;

    const workflowPreset = getWorkflowPresetForService(finalService);
    const isHomeWatch = isHomeWatchService(finalService);
    const operationalArea = matchedProperty?.area || (finalLocation.includes(',') ? finalLocation.split(',')[0].trim() : undefined);
    const homeWatchSchedule = isHomeWatch
      ? generateHomeWatchSchedule(homeWatchFirstDate, homeWatchTime, 'Every 2 Weeks', homeWatchVisits)
      : [];
    const planId = isHomeWatch && homeWatchVisits > 1 ? `REC-${Date.now()}-${randomSuffix}` : undefined;

    const newJob: InspectionJob = {
      id: newJobId,
      clientId: selectedCustomerId !== 'NEW' ? selectedCustomerId : `CL-${randomSuffix}`,
      customerId: selectedCustomerId !== 'NEW' ? selectedCustomerId : undefined,
      propertyId: selectedPropertyId !== 'NEW' ? selectedPropertyId : undefined,
      villaName: finalVillaName,
      customerName: finalCustomerName,
      customerGroup:
        matchedCustomer?.customerType === 'Expat'
          ? 'expat'
          : matchedCustomer?.customerType === 'Property Manager'
          ? 'rental_investor'
          : 'villa_owner',
      propertyLocation: finalLocation,
      serviceType: finalService,
      recurringServiceId: planId,
      jobPurpose,
      status: urgency === 'Urgent' ? 'In Progress' : 'New',
      inspectionDate: today.toISOString().slice(0, 10),
      scheduledDate: isHomeWatch ? homeWatchFirstDate : undefined,
      scheduledTime: isHomeWatch ? homeWatchTime : undefined,
      createdAt: today.toISOString(),
      inspector: 'PTL Solo Operator',
      documentRef: `PTL-${dateSlug}`,
      notes: requestDescription,
      requestDescription: requestDescription,
      price: parsedPrice,
      waitingOn: 'none',
      isSimpleJob: !isHomeWatch,
      workflowPreset: workflowPreset,
      urgency: urgency,
      serviceArea: operationalArea,
      executionMode: 'OWNER',
      assignedToType: 'OWNER',
      assignedAt: today.toISOString(),
      assignedBy: 'PTL Owner',
      actualStartedAt: urgency === 'Urgent' ? today.toISOString() : undefined,
      lastActivityAt: today.toISOString(),
      events: [
        {
          id: `EVT-${dateSlug}-${randomSuffix}-01`,
          jobId: newJobId,
          eventType: 'JOB_CREATED',
          actorType: 'OWNER',
          actorName: 'PTL Owner',
          createdAt: today.toISOString(),
          summary: `Job created for ${finalVillaName} (${finalService})`,
        },
        ...(urgency === 'Urgent'
          ? [
              {
                id: `EVT-${dateSlug}-${randomSuffix}-02`,
                jobId: newJobId,
                eventType: 'JOB_STARTED' as const,
                actorType: 'OWNER' as const,
                actorName: 'PTL Owner',
                createdAt: today.toISOString(),
                summary: 'Urgent dispatch started immediately',
              },
            ]
          : []),
      ],
      items: [],
      homeWatchChecklist: isHomeWatch ? createDefaultHomeWatchChecklist()
        : selectedServiceId === 'home_inspection' ? createDefaultHomeInspectionChecklist() : undefined,
      evidencePhotos: [],
      quotation: {
        refNo: `QT-${dateSlug}-${randomSuffix}`,
        date: today.toLocaleDateString('en-GB'),
        inspectionRef: newJobId,
        validity: '30 days',
        paymentTerm: 'Payment due upon completion. 50% deposit for work exceeding ฿10,000.',
        hardwareItems: [],
        serviceItems: parsedPrice > 0 ? [
          {
            item: 1,
            description: finalService,
            detail: `${finalService} - ${finalVillaName}`,
            estimatedSchedule: 'To be confirmed after approval',
            qty: '1 Job',
            amount: parsedPrice,
          },
        ] : [],
        procurementFeeRate: 0.15,
        terms: [
          'Payment due upon completion.',
          '50% deposit required for third-party procurement exceeding ฿10,000.',
        ],
        contingencies: [],
        depositPercent: 50,
      },
    };

    const plan: RecurringService | undefined = planId ? {
      id: planId,
      customerId: selectedCustomerId,
      propertyId: selectedPropertyId,
      serviceType: finalService,
      frequency: 'Every 2 Weeks',
      price: parsedPrice,
      nextDueDate: homeWatchFirstDate,
      status: 'Active',
      notes: requestDescription,
      autoCreateJob: true,
      planType: 'finite',
      totalVisits: homeWatchVisits,
      completedVisits: 0,
      preferredTime: homeWatchTime,
      visitSchedule: homeWatchSchedule.map((visit, index) => index === 0 ? { ...visit, jobId: newJobId } : visit),
      createdAt: today.toISOString(),
    } : undefined;
    onSaveJob(newJob, plan);
    onClose();
  };

  const customerProperties = properties.filter((p) => p.customerId === selectedCustomerId);

  const categories = [
    { id: 'all', label: lang === 'th' ? 'ทั้งหมด' : 'All Services' },
    { id: 'home', label: lang === 'th' ? 'บ้าน & วิลล่า' : 'Home' },
    { id: 'assistance', label: lang === 'th' ? 'ฉุกเฉิน & ช่วยเหลือ' : 'Assistance' },
    { id: 'technical', label: lang === 'th' ? 'ระบบ & CCTV' : 'Technical' },
    { id: 'coordination', label: lang === 'th' ? 'ช่าง & คุมงาน' : 'Coordination' },
  ];

  const filteredServices = PTL_SERVICES.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.category === activeCategory;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl relative border border-slate-200 max-h-[94vh] flex flex-col my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                {t.quickJob.title}
              </h2>
              <p className="text-xs text-slate-500">
                {t.quickJob.subtitle}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
          {/* STEP 1: What does the customer need? */}
          <div className="bg-slate-50 border border-slate-200 p-3 sm:p-3.5 rounded-xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wide">
                {t.quickJob.whatDoesCustomerNeed}
              </label>
              <div className="flex gap-1 overflow-x-auto scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${
                      activeCategory === cat.id
                        ? 'bg-[#0f1d33] text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Service Chips Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-0.5">
              {filteredServices.map((service) => {
                const isSelected = selectedServiceId === service.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleSelectService(service)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/40 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {lang === 'th' ? service.nameTh : service.nameEn}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                      <span className="font-semibold text-blue-700">{service.defaultPrice > 0 ? `฿${service.defaultPrice.toLocaleString()}` : 'Quote required'}</span>
                      {service.id === 'roadside_tire' && (
                        <span className="bg-red-100 text-red-700 font-bold px-1 rounded text-[9px]">Emergency</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedServiceId === 'custom_job' && (
              <input
                type="text"
                required
                placeholder={lang === 'th' ? 'ระบุชื่องานบริการ...' : 'Specify custom service name...'}
                value={customServiceText}
                onChange={(e) => setCustomServiceText(e.target.value)}
                className="mt-2 w-full px-3 py-1.5 bg-white border border-blue-400 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            )}
            {(['home_watch', 'property_visit', 'home_inspection'].includes(selectedServiceId)) && (
              <p className="mt-2 text-xs text-slate-600">
                {selectedServiceId === 'home_watch'
                  ? 'Home Watch: repeat the same checklist, with photos and a report for each visit.'
                  : selectedServiceId === 'home_inspection'
                  ? 'Home Inspection: one full villa audit of rooms and systems, with findings, photos and a report. Quote the scope first.'
                  : 'Property Visit: one visit for a specific request; no repeat visits.'}
              </p>
            )}
          </div>

          {selectedServiceId === 'home_watch' && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-3">
              <div>
                <strong className="block text-sm text-slate-900">How many Home Watch visits?</strong>
                <p className="text-xs text-slate-600">Each visit gets its own checklist and photos.</p>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 4, 8].map((count) => (
                  <button key={count} type="button" onClick={() => setHomeWatchVisits(count)}
                    className={`min-h-[44px] rounded-lg border text-xs font-bold ${homeWatchVisits === count ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'}`}>
                    {count} {count === 1 ? 'visit' : 'visits'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs font-semibold text-slate-700">First visit
                  <input required type="date" value={homeWatchFirstDate} onChange={(event) => setHomeWatchFirstDate(event.target.value)} className="mt-1 block w-full min-w-0 min-h-[44px] rounded-lg border border-slate-300 bg-white px-2" />
                </label>
                <label className="text-xs font-semibold text-slate-700">Time
                  <input required type="time" value={homeWatchTime} onChange={(event) => setHomeWatchTime(event.target.value)} className="mt-1 block w-full min-w-0 min-h-[44px] rounded-lg border border-slate-300 bg-white px-2" />
                </label>
              </div>
              {homeWatchVisits > 1 && <p className="text-xs text-blue-900 font-medium">
                Every 14 days:{' '}
                {generateHomeWatchSchedule(homeWatchFirstDate, homeWatchTime, 'Every 2 Weeks', homeWatchVisits).map((visit) => visit.scheduledDate).join(' · ')}
              </p>}
            </div>
          )}

          <div>
            <label htmlFor="quick-job-purpose" className="block text-xs font-bold text-slate-700 mb-1">
              {t.quickJob.jobPurpose}
            </label>
            <select id="quick-job-purpose" value={jobPurpose} onChange={(e) => {
              setJobPurpose(e.target.value as JobPurpose);
              setPurposeCustomized(true);
            }} className="w-full min-h-[44px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl">
              {JOB_PURPOSES.map((purpose) => <option key={purpose} value={purpose}>{t.jobPurpose[purpose]}</option>)}
            </select>
            {jobPurpose === 'INSPECTION_DIAGNOSIS' && <p className="mt-1.5 text-xs text-slate-600">{t.quickJob.inspectionPurposeHelp}</p>}
            {jobPurpose === 'FAULT_FINDING' && <p className="mt-1.5 text-xs text-slate-600">{t.quickJob.faultPurposeHelp}</p>}
            {jobPurpose === 'KNOWN_SCOPE_SERVICE' && <p className="mt-1.5 text-xs text-slate-600">{t.quickJob.knownScopePurposeHelp}</p>}
          </div>

          {/* Urgency Selector */}
          <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <AlertCircle className={`w-4 h-4 ${urgency === 'Urgent' ? 'text-red-500' : 'text-slate-400'}`} />
              <span>{t.quickJob.urgency}:</span>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUrgency('Normal')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  urgency === 'Normal'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.quickJob.urgencyNormal}
              </button>
              <button
                type="button"
                onClick={() => setUrgency('Urgent')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  urgency === 'Urgent'
                    ? 'bg-red-600 text-white shadow-xs animate-pulse'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🚨 {t.quickJob.urgencyHigh}
              </button>
            </div>
          </div>

          {/* STEP 2: Customer & Property Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Customer */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.quickJob.selectCustomer} *</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.fullName || c.preferredName} ({c.customerType})
                  </option>
                ))}
                <option value="NEW">+ {lang === 'th' ? 'พิมพ์ชื่อลูกค้าใหม่...' : 'Type New Customer...'}</option>
              </select>

              {selectedCustomerId === 'NEW' && (
                <input
                  type="text"
                  required
                  placeholder={lang === 'th' ? 'ชื่อลูกค้า...' : 'Customer name...'}
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                  className="mt-1.5 w-full px-2.5 py-1.5 border border-blue-300 rounded-lg text-xs"
                />
              )}
            </div>

            {/* Property / Site */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.quickJob.selectProperty} *</span>
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {customerProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.propertyName} ({p.area})
                  </option>
                ))}
                {properties
                  .filter((p) => p.customerId !== selectedCustomerId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.propertyName} ({p.area})
                    </option>
                  ))}
                <option value="NEW">+ {lang === 'th' ? 'ระบุสถานที่อื่น / พิกัด...' : 'Type Other Location...'}</option>
              </select>

              {selectedPropertyId === 'NEW' && (
                <input
                  type="text"
                  required
                  placeholder={t.quickJob.locationPlaceholder}
                  value={customPropertyLocation}
                  onChange={(e) => setCustomPropertyLocation(e.target.value)}
                  className="mt-1.5 w-full px-2.5 py-1.5 border border-blue-300 rounded-lg text-xs"
                />
              )}
            </div>
          </div>

          {/* Request Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {t.quickJob.shortDescription}
            </label>
            <textarea
              rows={2}
              placeholder={
                selectedServiceId === 'roadside_tire'
                  ? 'e.g. Front right tire flat near Bang Tao mosque, customer is waiting on site'
                  : 'e.g. Regular scheduled visit, check AC in master bedroom, test water pumps'
              }
              value={requestDescription}
              onChange={(e) => setRequestDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Price & Schedule */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black text-slate-900 uppercase flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>{t.quickJob.agreedPrice}</span>
                </label>
                {!isPriceCustomized && (
                  <span className="text-[10px] text-slate-400 font-medium italic">
                    ({lang === 'th' ? 'ราคาอ้างอิงเริ่มต้น' : 'Base placeholder'})
                  </span>
                )}
              </div>
              <input
                type="number"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setIsPriceCustomized(true);
                }}
                className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

          </div>

          {/* Submit Button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
            >
              {t.actions.cancel}
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.quickJob.createButton}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
