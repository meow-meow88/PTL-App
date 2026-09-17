import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Zap,
  Building2,
  User,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Wrench,
} from 'lucide-react';
import {
  Customer,
  Property,
  InspectionJob,
  QuickJobServiceType,
  JobStatus,
} from '../types';

interface QuickJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  properties: Property[];
  onSaveJob: (newJob: InspectionJob) => void;
  presetCustomerId?: string | null;
  presetPropertyId?: string | null;
}

const SERVICE_TYPES: QuickJobServiceType[] = [
  'Remote Support',
  'Home Visit',
  'Home Watch',
  'Vendor Coordination',
  'Transportation',
  'Pet Assistance',
  'Hospital Assistance',
  'CCTV',
  'WiFi / Internet',
  'Other',
];

export const QuickJobModal: React.FC<QuickJobModalProps> = ({
  isOpen,
  onClose,
  customers,
  properties,
  onSaveJob,
  presetCustomerId,
  presetPropertyId,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    presetCustomerId || customers[0]?.id || ''
  );
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    presetPropertyId || ''
  );
  const [customPropertyLocation, setCustomPropertyLocation] = useState('');
  const [serviceType, setServiceType] = useState<QuickJobServiceType>('Home Visit');
  const [customServiceType, setCustomServiceType] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [price, setPrice] = useState<string>('1500');
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [scheduledTime, setScheduledTime] = useState<string>('10:00 AM');
  const [waitingOn, setWaitingOn] = useState<'none' | 'customer' | 'vendor' | 'parts'>('none');
  const [jobType, setJobType] = useState<'standard' | 'inspection'>('inspection');

  // Sync preset props when modal opens
  useEffect(() => {
    if (presetCustomerId) {
      setSelectedCustomerId(presetCustomerId);
      const custProps = properties.filter((p) => p.customerId === presetCustomerId);
      if (custProps.length > 0) {
        setSelectedPropertyId(custProps[0].id);
      }
    } else if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [presetCustomerId, customers, properties]);

  // When customer changes, automatically pre-select their primary property
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const matchedCustomer = customers.find((c) => c.id === selectedCustomerId);
    const finalCustomerName =
      selectedCustomerId === 'NEW'
        ? customCustomerName.trim() || 'Client'
        : matchedCustomer?.fullName || matchedCustomer?.preferredName || matchedCustomer?.name || 'Client';

    const matchedProperty = properties.find((p) => p.id === selectedPropertyId);
    const finalVillaName =
      selectedPropertyId === 'NEW'
        ? customPropertyLocation.trim() || 'Client Villa'
        : matchedProperty?.name || matchedProperty?.propertyName || 'Client Villa';

    const finalLocation =
      selectedPropertyId === 'NEW'
        ? customPropertyLocation.trim() || 'Phuket, Thailand'
        : matchedProperty?.address || 'Phuket, Thailand';

    const finalService =
      serviceType === 'Other' && customServiceType.trim()
        ? customServiceType.trim()
        : serviceType;

    const parsedPrice = parseFloat(price) || 0;
    const today = new Date();
    const dateSlug = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newJobId = `PTL-JOB-${dateSlug}-${randomSuffix}`;

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
      status: 'Inspection',
      inspectionDate: scheduledDate,
      createdAt: today.toISOString(),
      inspector: 'PTL Solo Operator',
      documentRef: `PTL-${dateSlug}`,
      notes: requestDescription,
      requestDescription: requestDescription,
      price: parsedPrice,
      scheduledDate: scheduledDate,
      scheduledTime: scheduledTime,
      waitingOn: waitingOn,
      isSimpleJob: jobType === 'standard',
      items: [],
      quotation: {
        refNo: `QT-${dateSlug}-${randomSuffix}`,
        date: today.toLocaleDateString('en-GB'),
        inspectionRef: newJobId,
        validity: '30 days',
        paymentTerm: 'Payment due upon completion. 50% deposit for work exceeding ฿10,000.',
        hardwareItems: [],
        serviceItems: [
          {
            item: 1,
            description: finalService,
            detail: `งานบริการ: ${finalService}`,
            estimatedSchedule: 'Immediate / Scheduled',
            qty: '1 Job',
            amount: parsedPrice,
          },
        ],
        procurementFeeRate: 0.15,
        terms: [
          'Payment due upon completion.',
          '50% deposit required for third-party procurement exceeding ฿10,000.',
        ],
        contingencies: [],
        depositPercent: 50,
      },
    };

    onSaveJob(newJob);
    onClose();
  };

  const customerProperties = properties.filter((p) => p.customerId === selectedCustomerId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative border border-slate-200 max-h-[92vh] flex flex-col my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-3.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
              <Zap className="w-4 h-4 text-blue-700" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              New Job Dispatch
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create a Standard Job or Inspection Job linked to customer and property
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
          {/* Job Type Selector (Standard vs Inspection) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
              Job Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setJobType('standard')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  jobType === 'standard'
                    ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-black text-slate-900">Standard Job</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Service visit, remote support, quick quote &amp; task
                </p>
              </button>

              <button
                type="button"
                onClick={() => setJobType('inspection')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  jobType === 'inspection'
                    ? 'bg-emerald-50 border-emerald-600 ring-1 ring-emerald-600 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-black text-slate-900">Inspection Job</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Room checklist, photos, findings &amp; 3-PDF package
                </p>
              </button>
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Customer *</span>
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.fullName || c.preferredName} ({c.customerType})
                </option>
              ))}
              <option value="NEW">+ Type New Customer Name...</option>
            </select>

            {selectedCustomerId === 'NEW' && (
              <input
                type="text"
                required
                placeholder="Enter client full name or preferred name..."
                value={customCustomerName}
                onChange={(e) => setCustomCustomerName(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-blue-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Property / Location */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Property / Site *</span>
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 bg-white"
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
              <option value="NEW">+ Type Other Location / Villa...</option>
            </select>

            {selectedPropertyId === 'NEW' && (
              <input
                type="text"
                required
                placeholder="e.g. Kata Ocean View Villa, Soi 4"
                value={customPropertyLocation}
                onChange={(e) => setCustomPropertyLocation(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-blue-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Service Type Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
              Service Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {SERVICE_TYPES.map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setServiceType(st)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all text-left truncate cursor-pointer ${
                    serviceType === st
                      ? 'bg-[#0f1d33] text-white border-[#0f1d33]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {serviceType === 'Other' && (
              <input
                type="text"
                placeholder="Specify service..."
                value={customServiceType}
                onChange={(e) => setCustomServiceType(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            )}
          </div>

          {/* Request / Problem Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Notes / Request Description</span>
            </label>
            <textarea
              rows={2}
              value={requestDescription}
              onChange={(e) => setRequestDescription(e.target.value)}
              placeholder="e.g. Check WiFi connection drop in guest bedroom, inspect pool pump circuit"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date, Time & Price */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Scheduled Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Scheduled Time
              </label>
              <input
                type="text"
                placeholder="10:00 AM"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Price (฿)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1500"
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>
          </div>

          {/* Waiting Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Waiting Status
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'none', label: 'None' },
                { id: 'customer', label: 'Customer' },
                { id: 'vendor', label: 'Vendor' },
                { id: 'parts', label: 'Parts' },
              ].map((w) => (
                <button
                  type="button"
                  key={w.id}
                  onClick={() => setWaitingOn(w.id as any)}
                  className={`py-1 text-[11px] font-bold rounded-lg border text-center transition-colors cursor-pointer ${
                    waitingOn === w.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs sm:text-sm font-extrabold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Create Job Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
