import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Calendar,
  Clock,
  DollarSign,
  Home,
  User,
  Check,
  Plus,
  Trash2,
  Pause,
  Play,
  AlertCircle,
  ShieldCheck,
  Layers,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  RecurringService,
  RecurringFrequency,
  RecurringStatus,
  Customer,
  Property,
  HomeWatchVisitScheduleItem,
} from '../types';
import { calculateNextDueDate } from '../utils/followUpEngine';
import { generateHomeWatchSchedule, formatVisitDate } from '../utils/homeWatchSchedule';
import { DateTimeSelector } from './DateTimeSelector';
import { useLanguage } from '../i18n/translations';

interface RecurringServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringServices: RecurringService[];
  customers: Customer[];
  properties: Property[];
  onSaveService: (service: RecurringService) => void;
  onDeleteService?: (serviceId: string) => void;
  presetPropertyId?: string;
  presetCustomerId?: string;
}

const FREQUENCIES: RecurringFrequency[] = [
  'Weekly',
  'Every 2 Weeks',
  'Monthly',
  'Every 2 Months',
  'Quarterly',
  'Custom',
];

export const RecurringServicesModal: React.FC<RecurringServicesModalProps> = ({
  isOpen,
  onClose,
  recurringServices,
  customers,
  properties,
  onSaveService,
  onDeleteService,
  presetPropertyId,
  presetCustomerId,
}) => {
  const { lang } = useLanguage();
  const isTh = lang === 'th';

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [serviceType, setServiceType] = useState('Home Watch');
  const [planType, setPlanType] = useState<'finite' | 'ongoing'>('finite');
  const [totalVisits, setTotalVisits] = useState<number>(4);
  const [preferredTime, setPreferredTime] = useState<string>('10:00');
  const [frequency, setFrequency] = useState<RecurringFrequency>('Every 2 Weeks');
  const [intervalDays, setIntervalDays] = useState<number>(14);
  const [price, setPrice] = useState<string>('2000');
  const [nextDueDate, setNextDueDate] = useState<string>('');
  const [status, setStatus] = useState<RecurringStatus>('Active');
  const [notes, setNotes] = useState('');
  const [autoCreateJob, setAutoCreateJob] = useState(true);
  const [visitSchedule, setVisitSchedule] = useState<HomeWatchVisitScheduleItem[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  useEffect(() => {
    if (presetPropertyId) {
      setPropertyId(presetPropertyId);
      const prop = properties.find((p) => p.id === presetPropertyId);
      if (prop && prop.customerId) {
        setCustomerId(prop.customerId);
      }
    } else if (presetCustomerId) {
      setCustomerId(presetCustomerId);
      const props = properties.filter((p) => p.customerId === presetCustomerId);
      if (props.length > 0) {
        setPropertyId(props[0].id);
      }
    } else if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
      const props = properties.filter((p) => p.customerId === customers[0].id);
      if (props.length > 0) {
        setPropertyId(props[0].id);
      }
    }

    if (!nextDueDate) {
      const calc = calculateNextDueDate(new Date().toISOString().slice(0, 10), frequency, intervalDays);
      setNextDueDate(calc);
    }
  }, [presetPropertyId, presetCustomerId, customers, properties, isOpen]);

  // Check for duplicate active plan for the chosen property
  useEffect(() => {
    if (propertyId && !editingId) {
      const existing = recurringServices.find(
        (s) =>
          s.propertyId === propertyId &&
          s.status === 'Active' &&
          (s.serviceType.toLowerCase().includes('home watch') || serviceType.toLowerCase().includes('home watch'))
      );
      setShowDuplicateWarning(Boolean(existing));
    } else {
      setShowDuplicateWarning(false);
    }
  }, [propertyId, editingId, recurringServices, serviceType]);

  // Recalculate schedule when date, frequency, or visits change for finite package
  useEffect(() => {
    if (planType === 'finite' && nextDueDate) {
      const generated = generateHomeWatchSchedule(
        nextDueDate,
        preferredTime || '10:00',
        frequency,
        totalVisits,
        intervalDays
      );
      setVisitSchedule(generated);
    }
  }, [planType, totalVisits, nextDueDate, preferredTime, frequency, intervalDays]);

  if (!isOpen) return null;

  const handleFrequencyChange = (newFreq: RecurringFrequency) => {
    setFrequency(newFreq);
    const calc = calculateNextDueDate(new Date().toISOString().slice(0, 10), newFreq, intervalDays);
    setNextDueDate(calc);
  };

  const handleEdit = (service: RecurringService) => {
    setEditingId(service.id);
    setCustomerId(service.customerId);
    setPropertyId(service.propertyId);
    setServiceType(service.serviceType);
    setPlanType(service.planType || (service.totalVisits ? 'finite' : 'ongoing'));
    setTotalVisits(service.totalVisits || 4);
    setPreferredTime(service.preferredTime || '10:00');
    setFrequency(service.frequency);
    setIntervalDays(service.interval || 14);
    setPrice(String(service.price));
    setNextDueDate(service.nextDueDate);
    setStatus(service.status);
    setNotes(service.notes);
    setAutoCreateJob(service.autoCreateJob);
    setVisitSchedule(service.visitSchedule || []);
    setIsCreating(true);
  };

  const handleStartNew = () => {
    setEditingId(null);
    setServiceType('Home Watch');
    setPlanType('finite');
    setTotalVisits(4);
    setPreferredTime('10:00');
    setFrequency('Every 2 Weeks');
    setIntervalDays(14);
    setPrice('2000');
    const todayStr = new Date().toISOString().slice(0, 10);
    setNextDueDate(todayStr);
    setStatus('Active');
    setNotes('Routine villa inspection: AC condensate check, plumbing & leak check, door/window security, power meter reading.');
    setAutoCreateJob(true);
    setVisitSchedule(generateHomeWatchSchedule(todayStr, '10:00', 'Every 2 Weeks', 4, 14));
    setIsCreating(true);
  };

  const handleToggleStatus = (service: RecurringService) => {
    if (service.status === 'Completed' || service.status === 'Cancelled') return;
    const newStatus: RecurringStatus = service.status === 'Active' ? 'Paused' : 'Active';
    onSaveService({
      ...service,
      status: newStatus,
    });
  };

  const handleUpdateScheduleItem = (index: number, date: string, time: string) => {
    setVisitSchedule((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          scheduledDate: date,
          scheduledTime: time,
        };
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !propertyId || !serviceType.trim()) return;

    const saved: RecurringService = {
      id: editingId || `REC-${Date.now().toString().slice(-4)}`,
      customerId,
      propertyId,
      serviceType: serviceType.trim(),
      frequency,
      interval: frequency === 'Custom' ? Number(intervalDays) : undefined,
      price: Number(price) || 0,
      lastCompletedDate: editingId ? recurringServices.find((s) => s.id === editingId)?.lastCompletedDate : undefined,
      nextDueDate: nextDueDate || calculateNextDueDate(new Date().toISOString().slice(0, 10), frequency, intervalDays),
      status,
      notes: notes.trim(),
      autoCreateJob,
      planType,
      totalVisits: planType === 'finite' ? Number(totalVisits) : undefined,
      completedVisits: editingId ? recurringServices.find((s) => s.id === editingId)?.completedVisits || 0 : 0,
      preferredTime: preferredTime.trim() || undefined,
      visitSchedule: planType === 'finite' ? visitSchedule : undefined,
      createdAt: editingId
        ? recurringServices.find((s) => s.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    onSaveService(saved);
    setIsCreating(false);
    setEditingId(null);
  };

  const totalPrice = (Number(price) || 0) * (planType === 'finite' ? totalVisits : 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {isTh ? 'แพ็กเกจ Home Watch & บริการประจำ' : 'Home Watch Packages & Recurring Plans'}
              </h2>
              <p className="text-xs text-slate-500">
                {isTh
                  ? 'จัดการแพ็กเกจตรวจวิลล่าแบบระบุจำนวนครั้ง หรือตรวจต่อเนื่อง'
                  : 'Manage fixed-visit packages or ongoing recurring villa surveillance'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {!isCreating ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isTh ? 'รายการแพ็กเกจที่ดูแลอยู่' : 'Active Safeguarding Contracts'} ({recurringServices.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isTh
                      ? 'บันทึกการตรวจและสร้างนัดครั้งถัดไปอัตโนมัติ'
                      : 'Next visit dates are recalculated and scheduled automatically'}
                  </p>
                </div>
                <button
                  onClick={handleStartNew}
                  className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isTh ? '+ เพิ่มแพ็กเกจใหม่' : '+ New Package'}</span>
                </button>
              </div>

              <div className="space-y-3">
                {recurringServices.map((service) => {
                  const cust = customers.find((c) => c.id === service.customerId);
                  const prop = properties.find((p) => p.id === service.propertyId);
                  const isActive = service.status === 'Active';
                  const isFinite = service.planType === 'finite' || Boolean(service.totalVisits);

                  return (
                    <div
                      key={service.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-900">
                            {service.serviceType}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {isTh ? ({ Active: 'กำลังดำเนินการ', Paused: 'พักไว้', Cancelled: 'ยกเลิก', Completed: 'ครบทุกครั้งแล้ว' }[service.status]) : service.status}
                          </span>
                          {isFinite ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-900">
                              {service.completedVisits || 0} / {service.totalVisits || 4} {isTh ? 'ครั้ง' : 'visits'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              Ongoing
                            </span>
                          )}
                          <span className="text-xs font-mono font-bold text-slate-800">
                            ฿{(service.price ?? 0).toLocaleString()} / visit
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900">
                          {prop?.name || 'Villa'}{' '}
                          <span className="text-slate-500 font-normal">({cust?.name || 'Customer'})</span>
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-500">
                          <span>
                            Freq: <strong className="text-slate-700">{service.frequency}</strong>
                          </span>
                          <span>
                            Next Due:{' '}
                            <strong className="text-indigo-700">
                              {service.nextDueDate} {service.preferredTime ? `• ${service.preferredTime}` : ''}
                            </strong>
                          </span>
                          {service.lastCompletedDate && <span>Last Visit: {service.lastCompletedDate}</span>}
                        </div>

                        {/* Visit schedule pills if finite */}
                        {isFinite && service.visitSchedule && service.visitSchedule.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                            {service.visitSchedule.map((vs) => (
                              <span
                                key={vs.visitNumber}
                                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                  vs.status === 'Completed'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 line-through opacity-75'
                                    : vs.status === 'Scheduled'
                                    ? 'bg-indigo-50 text-indigo-900 border-indigo-300 font-bold'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                #{vs.visitNumber} {formatVisitDate(vs.scheduledDate, isTh)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {service.status !== 'Completed' && service.status !== 'Cancelled' && <button
                          onClick={() => handleToggleStatus(service)}
                          className={`p-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isActive
                              ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                              : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                          title={isActive ? 'Pause service' : 'Resume service'}
                        >
                          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>}

                        <button
                          onClick={() => handleEdit(service)}
                          className="min-h-[44px] px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                        >
                          {isTh ? 'แก้ไข' : 'Edit'}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {recurringServices.length === 0 && (
                  <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 space-y-2">
                    <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-600 font-medium">
                      {isTh ? 'ยังไม่มีแพ็กเกจ Home Watch ที่บันทึกไว้' : 'No Home Watch plans set up yet.'}
                    </p>
                    <button
                      onClick={handleStartNew}
                      className="min-h-[44px] px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      {isTh ? '+ สร้างแพ็กเกจแรก' : '+ Create First Home Watch Plan'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                  {editingId
                    ? isTh
                      ? 'แก้ไขแพ็กเกจ Home Watch'
                      : 'Edit Home Watch Package'
                    : isTh
                    ? 'สร้างแพ็กเกจ Home Watch ใหม่'
                    : 'Create New Home Watch Package'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  ← {isTh ? 'กลับไปที่รายการ' : 'Back to List'}
                </button>
              </div>

              {/* Duplicate Warning */}
              {showDuplicateWarning && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">
                      {isTh
                        ? 'วิลล่านี้มีแพ็กเกจ Home Watch ที่กำลังใช้งานอยู่แล้ว'
                        : 'Active Plan Warning:'}
                    </strong>{' '}
                    {isTh
                      ? 'ระบบตรวจพบว่าวิลล่านี้มีสัญญาอยู่แล้ว คุณสามารถแก้ไขสัญญาเดิม หรือดำเนินการสร้างแพ็กเกจแยกต่างหากได้'
                      : 'This property already has an active Home Watch plan. You can renew/extend it, or proceed if creating a distinct separate contract.'}
                  </div>
                </div>
              )}

              {/* Plan Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTh ? 'รูปแบบแพ็กเกจ *' : 'Package Type *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlanType('finite')}
                    className={`min-h-[44px] p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      planType === 'finite'
                        ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-400'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-black text-slate-900">
                      {isTh ? '📦 จำนวนครั้งจำกัด (Finite Visits)' : '📦 Finite Visits Package'}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {isTh ? 'ระบุ 1, 2, 4, 6 ครั้ง แล้วจบแพ็กเกจ' : '1, 2, 4, 6, 8, 12 visits package'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanType('ongoing')}
                    className={`min-h-[44px] p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      planType === 'ongoing'
                        ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-400'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-black text-slate-900">
                      {isTh ? '🔄 ดูแลต่อเนื่อง (Ongoing / Monthly)' : '🔄 Ongoing Retainer'}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {isTh ? 'ต่ออายุและสร้างนัดต่อเนื่องอัตโนมัติ' : 'Continuous recurring subscription'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Customer & Property */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTh ? 'ลูกค้า *' : 'Customer *'}
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value);
                      const prop = properties.find((p) => p.customerId === e.target.value);
                      if (prop) setPropertyId(prop.id);
                    }}
                    className="w-full min-h-[44px] px-3 py-2 border border-slate-200 rounded-xl text-base sm:text-xs bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTh ? 'วิลล่า / สถานที่ *' : 'Property / Villa *'}
                  </label>
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 border border-slate-200 rounded-xl text-base sm:text-xs bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {properties
                      .filter((p) => !customerId || p.customerId === customerId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.area})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Total visits if finite */}
              {planType === 'finite' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTh ? 'จำนวนครั้งในแพ็กเกจ (Total Visits) *' : 'Total Visits in Package *'}
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1, 2, 4, 6, 8, 12].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTotalVisits(num)}
                        className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          totalVisits === num
                            ? 'bg-indigo-600 text-white font-black shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {num} {isTh ? 'ครั้ง' : 'Visits'}
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      max={52}
                      value={totalVisits}
                      onChange={(e) => setTotalVisits(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 min-h-[40px] px-2 py-1 border border-slate-200 rounded-xl text-xs font-bold text-center"
                      placeholder="Custom"
                    />
                  </div>
                </div>
              )}

              {/* Frequency & Preferred Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTh ? 'ความถี่ในการตรวจ *' : 'Frequency *'}
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => handleFrequencyChange(e.target.value as RecurringFrequency)}
                    className="w-full min-h-[44px] px-3 py-2 border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTh ? 'เวลาตรวจที่ต้องการ (Preferred Time)' : 'Preferred Time'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      placeholder="10:00"
                      className="w-full min-h-[44px] px-3 py-2 border border-slate-200 rounded-xl text-base sm:text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    {['09:00', '10:00', '14:00', '16:00'].map((pt) => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setPreferredTime(pt)}
                        className={`min-h-[44px] px-2 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer shrink-0 ${
                          preferredTime === pt
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price & First Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTh ? 'ราคาต่อครั้ง (THB ฿) *' : 'Price per Visit (THB ฿) *'}
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="2000"
                      className="w-full min-h-[44px] pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                    />
                  </div>
                  {planType === 'finite' && (
                    <p className="text-[11px] text-indigo-700 font-bold mt-1">
                      {isTh ? 'ราคารวมทั้งแพ็กเกจ:' : 'Total package price:'} ฿{(totalPrice ?? 0).toLocaleString()} (
                      {totalVisits} visits)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTh ? 'วันที่เริ่มตรวจครั้งแรก *' : 'First Visit Date *'}
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="date"
                      required
                      value={nextDueDate}
                      onChange={(e) => setNextDueDate(e.target.value)}
                      className="w-full min-h-[44px] pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Generated Visit Schedule Preview (for Finite) */}
              {planType === 'finite' && visitSchedule.length > 0 && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      {isTh ? 'กำหนดการตรวจแต่ละครั้ง (ปรับแต่งวันที่ได้)' : 'Visit Schedule Breakdown'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isTh ? 'แก้ไขวันที่เฉพาะครั้งได้โดยตรง' : 'Tap any date to customize'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {visitSchedule.map((item, idx) => (
                      <div
                        key={item.visitNumber}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-black text-indigo-800 shrink-0">#{item.visitNumber}</span>
                        <input
                          type="date"
                          value={item.scheduledDate}
                          onChange={(e) => handleUpdateScheduleItem(idx, e.target.value, item.scheduledTime || preferredTime)}
                          className="px-2 py-1 border border-slate-200 rounded text-xs font-mono font-bold"
                        />
                        <input
                          type="text"
                          value={item.scheduledTime || preferredTime}
                          onChange={(e) => handleUpdateScheduleItem(idx, item.scheduledDate, e.target.value)}
                          className="w-16 px-1.5 py-1 border border-slate-200 rounded text-[11px] font-mono text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto Create Job Toggle */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCreateJob}
                    onChange={(e) => setAutoCreateJob(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-indigo-950">
                    {isTh
                      ? 'สร้าง Job นัดตรวจครั้งถัดไปอัตโนมัติเมื่อตรวจเสร็จ'
                      : 'Automatically create next Job when current visit is completed'}
                  </span>
                </label>
                <p className="text-[11px] text-indigo-700">
                  {isTh
                    ? 'ระบบป้องกันการสร้างซ้ำ: จะไม่สร้างงานซ้ำหากมีงานที่ยังเปิดอยู่สำหรับแพ็กเกจนี้'
                    : 'Protected by duplicate prevention: never creates duplicate jobs if an open job exists for this contract.'}
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTh ? 'ข้อกำหนดและจุดโฟกัสการตรวจ' : 'Checklist & Inspection Notes'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    isTh
                      ? 'เช่น ตรวจมิเตอร์ไฟ, เปิดน้ำไล่อากาศ, ตรวจท่อแอร์, เช็กจุดรั่วซึม...'
                      : 'e.g. Check power meter, flush all toilets, check AC condensate lines, take 4 photos of exterior.'
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-black rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isTh ? 'บันทึกแพ็กเกจ' : 'Save Package'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
