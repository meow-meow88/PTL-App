import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  MapPin,
  Key,
  Wifi,
  Wrench,
  Shield,
  Calendar,
  ExternalLink,
  Edit2,
  CheckCircle2,
  ChevronRight,
  X,
  FileText,
  User,
  Tv,
  Camera,
  History,
  FolderOpen,
  Eye,
  Trash2,
  Archive,
  ShieldAlert,
  Pause,
  Play,
  Clock,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  Property,
  PropertyType,
  PropertySystem,
  Customer,
  InspectionJob,
  RecurringService,
  RecurringFrequency,
  Invoice,
  getOwnerStatusLabel,
} from '../types';
import { deduplicateProperties, checkPropertyDeleteSafety, PropertySafetyReport } from '../utils/crmStorage';
import { useLanguage } from '../i18n/translations';

interface PropertiesViewProps {
  properties: Property[];
  customers: Customer[];
  jobs: InspectionJob[];
  recurringServices?: RecurringService[];
  invoices?: Invoice[];
  onSaveProperty: (property: Property) => void;
  onDeleteProperty?: (propertyId: string) => void;
  onArchiveProperty?: (property: Property) => void;
  onSaveRecurringService?: (service: RecurringService) => void;
  onDeleteRecurringService?: (serviceId: string) => void;
  onOpenQuickJobForProperty: (property: Property, defaultServiceType?: string, parentJobId?: string, defaultDescription?: string) => void;
  onOpenJobInspection: (jobId: string) => void;
  onOpenJobQuotation: (jobId: string) => void;
  initialSelectedPropertyId?: string | null;
}

const ALL_SYSTEMS: PropertySystem[] = [
  'CCTV',
  'WiFi',
  'Internet',
  'Smart Home',
  'Air Conditioning',
  'Water',
  'Electrical',
  'Security',
];

type PropertyTab =
  | 'overview'
  | 'home_watch'
  | 'access'
  | 'systems'
  | 'jobs'
  | 'inspections'
  | 'documents'
  | 'photos'
  | 'history';

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  properties,
  customers,
  jobs,
  recurringServices = [],
  invoices = [],
  onSaveProperty,
  onDeleteProperty,
  onArchiveProperty,
  onSaveRecurringService,
  onDeleteRecurringService,
  onOpenQuickJobForProperty,
  onOpenJobInspection,
  onOpenJobQuotation,
  initialSelectedPropertyId,
}) => {
  const { lang } = useLanguage();
  const isTh = lang === 'th';
  const propertyTypeLabel = (type: PropertyType) => isTh ? ({ Villa: 'วิลล่า', Condo: 'คอนโด', Estate: 'โครงการบ้าน', Commercial: 'อาคารพาณิชย์', Other: 'อื่นๆ' } as Record<PropertyType, string>)[type] : type;
  const dedupedProperties = useMemo(() => {
    return deduplicateProperties(properties);
  }, [properties]);

  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    initialSelectedPropertyId || (dedupedProperties[0]?.id ?? null)
  );
  const [activeTab, setActiveTab] = useState<PropertyTab>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Home Watch Modal State
  const [isHomeWatchModalOpen, setIsHomeWatchModalOpen] = useState(false);
  const [editingHomeWatchPlan, setEditingHomeWatchPlan] = useState<RecurringService | null>(null);

  // Delete / Archive Safety State
  const [deleteSafetyTarget, setDeleteSafetyTarget] = useState<{
    property: Property;
    report: PropertySafetyReport;
  } | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  // Filtered properties
  const filteredProperties = useMemo(() => {
    return dedupedProperties.filter((p) => {
      const pName = p.name || p.propertyName || '';
      const pAccess = p.accessInformation || p.accessInfo || '';
      const matchesSearch =
        pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pAccess.toLowerCase().includes(searchQuery.toLowerCase());

      if (areaFilter === 'archived') {
        return matchesSearch && p.isArchived === true;
      }

      const notArchived = !p.isArchived;
      const matchesArea = areaFilter === 'all' || p.area.toLowerCase().includes(areaFilter.toLowerCase());
      return matchesSearch && notArchived && matchesArea;
    });
  }, [dedupedProperties, searchQuery, areaFilter]);

  const selectedProperty =
    dedupedProperties.find((p) => p.id === selectedPropertyId) || filteredProperties[0] || null;

  // Relations
  const propertyOwner = selectedProperty
    ? customers.find((c) => c.id === selectedProperty.customerId)
    : null;

  const propName = selectedProperty?.name || selectedProperty?.propertyName || '';

  // Property Recurring Services (Home Watch)
  const propertyHomeWatchPlans = useMemo(() => {
    if (!selectedProperty) return [];
    return (recurringServices || []).filter(
      (r) =>
        r.propertyId === selectedProperty.id ||
        (r.propertyName && propName && r.propertyName.toLowerCase() === propName.toLowerCase())
    );
  }, [recurringServices, selectedProperty, propName]);

  const propertyJobs = selectedProperty
    ? jobs.filter(
        (j) =>
          j.propertyId === selectedProperty.id ||
          (j.villaName && propName && j.villaName.toLowerCase().includes(propName.toLowerCase())) ||
          (j.villaName && propName && propName.toLowerCase().includes(j.villaName.toLowerCase()))
      )
    : [];

  // Helper to open Home Watch creation
  const handleOpenHomeWatchModal = (plan?: RecurringService) => {
    if (!selectedProperty) return;
    if (plan) {
      setEditingHomeWatchPlan({ ...plan });
    } else {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 14);
      setEditingHomeWatchPlan({
        id: `REC-${Date.now().toString().slice(-6)}`,
        propertyId: selectedProperty.id,
        propertyName: selectedProperty.name || selectedProperty.propertyName,
        customerId: selectedProperty.customerId || '',
        customerName: propertyOwner ? (propertyOwner.name || propertyOwner.preferredName || propertyOwner.fullName) : '',
        serviceType: 'Home Watch',
        title: `Home Watch - ${selectedProperty.name || selectedProperty.propertyName}`,
        frequency: 'Every 2 Weeks',
        price: 1500,
        nextDueDate: nextDate.toISOString().slice(0, 10),
        autoCreateJob: true,
        notes: 'Inspect grounds, pool pumps, AC units run test, check for roof/pipe leaks, electrical breakers.',
        status: 'Active',
      });
    }
    setIsHomeWatchModalOpen(true);
  };

  // Advance Next Due Date after visit completion
  const handleMarkVisitCompleted = (service: RecurringService) => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const nextDate = new Date(today);
    const freq = service.frequency;

    if (freq === 'Weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (freq === 'Every 2 Weeks') {
      nextDate.setDate(nextDate.getDate() + 14);
    } else if (freq === 'Monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (freq === 'Every 2 Months') {
      nextDate.setMonth(nextDate.getMonth() + 2);
    } else if (freq === 'Quarterly') {
      nextDate.setMonth(nextDate.getMonth() + 3);
    } else {
      const intervalDays = service.interval || 14;
      nextDate.setDate(nextDate.getDate() + intervalDays);
    }

    const updated: RecurringService = {
      ...service,
      lastCompletedDate: todayStr,
      nextDueDate: nextDate.toISOString().slice(0, 10),
      updatedAt: new Date().toISOString(),
    };

    if (onSaveRecurringService) {
      onSaveRecurringService(updated);
    }
  };

  const handleTogglePausePlan = (service: RecurringService) => {
    const updated: RecurringService = {
      ...service,
      status: service.status === 'Active' ? 'Paused' : 'Active',
      updatedAt: new Date().toISOString(),
    };
    if (onSaveRecurringService) {
      onSaveRecurringService(updated);
    }
  };

  const getDaysRemainingLabel = (dueDateStr?: string) => {
    if (!dueDateStr) return { text: 'No date set', color: 'text-slate-500 bg-slate-100' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Due Today', color: 'text-amber-800 bg-amber-100 ring-1 ring-amber-300 font-black' };
    if (diffDays === 1) return { text: 'Due Tomorrow', color: 'text-blue-800 bg-blue-100 font-bold' };
    if (diffDays > 1) return { text: `Due in ${diffDays} days`, color: 'text-emerald-800 bg-emerald-100 font-bold' };
    return { text: `Overdue ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`, color: 'text-rose-800 bg-rose-100 ring-1 ring-rose-300 font-black' };
  };

  // Collect photos from findings of jobs on this property
  const propertyPhotos: { url: string; title: string; date: string; jobId: string }[] = [];
  propertyJobs.forEach((j) => {
    j.items?.forEach((item) => {
      item.photos?.forEach((photoUrl) => {
        propertyPhotos.push({
          url: photoUrl,
          title: `${item.title} (${item.room})`,
          date: j.inspectionDate || j.createdAt?.slice(0, 10),
          jobId: j.id,
        });
      });
    });
  });

  const handleOpenAdd = () => {
    const newId = `PROP-${Date.now().toString().slice(-6)}`;
    setEditingProperty({
      id: newId,
      customerId: customers[0]?.id || '',
      name: '',
      propertyName: '',
      propertyType: 'Villa',
      address: '',
      area: 'Kathu',
      googleMapsUrl: '',
      accessInformation: '',
      accessInfo: '',
      contactPerson: '',
      notes: '',
      importantNotes: '',
      systems: ['WiFi', 'Electrical'],
      systemsInstalled: ['WiFi', 'Electrical'],
      lastInspection: '',
      nextInspection: '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (prop: Property) => {
    setEditingProperty({
      ...prop,
      name: prop.name || prop.propertyName || '',
      accessInformation: prop.accessInformation || prop.accessInfo || '',
      notes: prop.notes || prop.importantNotes || '',
      systems: [...(prop.systems || (prop.systemsInstalled as PropertySystem[]) || [])],
    });
    setIsEditModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty || !editingProperty.name.trim()) return;

    const toSave: Property = {
      ...editingProperty,
      propertyName: editingProperty.name,
      accessInfo: editingProperty.accessInformation,
      importantNotes: editingProperty.notes,
      systemsInstalled: editingProperty.systems,
    };

    onSaveProperty(toSave);
    setSelectedPropertyId(toSave.id);
    setIsEditModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20 sm:pb-12">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-black text-slate-900">
              {isTh ? 'ทรัพย์สิน' : 'Property Database'}
            </h1>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
              {dedupedProperties.length} {isTh ? 'รายการ' : 'properties'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTh ? 'จัดการข้อมูลวิลล่า ระบบที่ติดตั้ง และประวัติงาน' : 'Manage villa access codes, installed systems, routine audits, and past job history'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{isTh ? 'เพิ่มทรัพย์สิน' : 'Add Property'}</span>
        </button>
      </div>

      {/* Main Grid: Left list (4 cols) & Right profile (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Properties Directory */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search and Area Filter */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={isTh ? 'ค้นหาชื่อวิลล่า พื้นที่ หรือที่อยู่...' : 'Search villa name, area, address...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
              <button
                onClick={() => setAreaFilter('all')}
                className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                  areaFilter === 'all'
                    ? 'bg-[#0f1d33] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isTh ? 'ทั้งหมด' : 'All'} ({dedupedProperties.length})
              </button>
              {['Kathu', 'Nai Harn', 'Rawai', 'Patong', 'Chalong', 'Bang Tao', 'Cherngtalay'].map((area) => (
                <button
                  key={area}
                  onClick={() => setAreaFilter(area)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                    areaFilter === area
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {area}
                </button>
              ))}
              <button
                onClick={() => setAreaFilter('archived')}
                className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                  areaFilter === 'archived'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                {isTh ? 'เก็บถาวร' : 'Archived'} ({dedupedProperties.filter((p) => p.isArchived).length})
              </button>
            </div>
          </div>

          {/* Properties List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredProperties.map((p) => {
              const isSelected = selectedProperty?.id === p.id;
              const owner = customers.find((c) => c.id === p.customerId);
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPropertyId(p.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                          {propertyTypeLabel(p.propertyType)}
                        </span>
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                          {p.area}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900 truncate">
                        {p.name || p.propertyName}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {p.address}
                      </p>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>{isTh ? 'เจ้าของ: ' : 'Owner: '}{owner ? (owner.name || owner.fullName || owner.preferredName) : (isTh ? 'ยังไม่ระบุ' : 'Unassigned')}</span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 mt-1 ${
                        isSelected ? 'text-emerald-600' : 'text-slate-300'
                      }`}
                    />
                  </div>
                </div>
              );
            })}

            {filteredProperties.length === 0 && (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
                {isTh ? 'ไม่พบทรัพย์สินที่ตรงกับคำค้นหา' : 'No properties found matching your search.'}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Property Profile */}
        <div className="lg:col-span-8">
          {selectedProperty ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
              {/* Profile Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {selectedProperty.id}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {propertyTypeLabel(selectedProperty.propertyType)}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {selectedProperty.area}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {selectedProperty.name || selectedProperty.propertyName}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedProperty.address}</span>
                  </p>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  <button
                    onClick={() => handleOpenHomeWatchModal()}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
                    title="Set up recurring Home Watch plan for this property"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isTh ? '+ แผนดูแลบ้าน' : '+ Home Watch Plan'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const report = checkPropertyDeleteSafety(
                        selectedProperty.id,
                        jobs,
                        invoices,
                        recurringServices
                      );
                      setDeleteSafetyTarget({ property: selectedProperty, report });
                      setConfirmDeleteText('');
                    }}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer border ${
                      selectedProperty.isArchived
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                    }`}
                    title={selectedProperty.isArchived ? 'Archived Property (Click to manage)' : 'Delete or Archive Property'}
                  >
                    {selectedProperty.isArchived ? (
                      <>
                        <Archive className="w-3.5 h-3.5 text-amber-700" />
                        <span>{isTh ? 'เก็บถาวร' : 'Archived'}</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>{isTh ? 'ลบ' : 'Delete'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(selectedProperty)}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Property</span>
                  </button>

                  <button
                    onClick={() => onOpenQuickJobForProperty(selectedProperty)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ New Job</span>
                  </button>
                </div>
              </div>

              {/* Property Profile Tabs */}
              <div className="border-b border-slate-200 flex items-center gap-1 overflow-x-auto scrollbar-none pt-1">
                {(
                  [
                    { id: 'overview', label: isTh ? 'ภาพรวม' : 'Overview' },
                    { id: 'home_watch', label: `${isTh ? 'ดูแลบ้าน' : 'Home Watch'} (${propertyHomeWatchPlans.length})` },
                    { id: 'access', label: isTh ? 'การเข้าถึง' : 'Access' },
                    { id: 'systems', label: `${isTh ? 'ระบบ' : 'Systems'} (${(selectedProperty.systems || selectedProperty.systemsInstalled || []).length})` },
                    { id: 'jobs', label: `${isTh ? 'งาน' : 'Jobs'} (${propertyJobs.length})` },
                    { id: 'inspections', label: isTh ? 'การตรวจ' : 'Inspections' },
                    { id: 'documents', label: isTh ? 'เอกสาร' : 'Documents' },
                    { id: 'photos', label: `${isTh ? 'รูปภาพ' : 'Photos'} (${propertyPhotos.length})` },
                    { id: 'history', label: isTh ? 'ประวัติ' : 'History' },
                  ] as { id: PropertyTab; label: string }[]
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`pb-2.5 px-3 text-xs font-black whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                      activeTab === t.id
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Home Watch Status Card on Overview */}
                  {propertyHomeWatchPlans.length > 0 ? (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/90 to-purple-50/70 border border-indigo-200 shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs">
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950">
                                Home Watch Recurring Plan
                              </h3>
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  propertyHomeWatchPlans[0].status === 'Active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {propertyHomeWatchPlans[0].status || 'Active'}
                              </span>
                            </div>
                            <p className="text-xs text-indigo-800/80 font-medium mt-0.5">
                              {propertyHomeWatchPlans[0].frequency} • ฿{(propertyHomeWatchPlans[0].price || 0).toLocaleString()} / visit
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {(() => {
                            const badge = getDaysRemainingLabel(propertyHomeWatchPlans[0].nextDueDate);
                            return (
                              <span className={`text-xs px-2.5 py-1 rounded-lg ${badge.color}`}>
                                {badge.text}
                              </span>
                            );
                          })()}
                          <button
                            onClick={() => setActiveTab('home_watch')}
                            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                          >
                            Manage Plan →
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                        <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Due Date</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {propertyHomeWatchPlans[0].nextDueDate || 'Not set'}
                          </span>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Visit</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {propertyHomeWatchPlans[0].lastCompletedDate || 'None recorded'}
                          </span>
                        </div>
                        <div className="col-span-2 sm:col-span-1 bg-white/80 p-2.5 rounded-lg border border-indigo-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Auto-Create Job</span>
                            <span className="font-bold text-slate-800">
                              {propertyHomeWatchPlans[0].autoCreateJob ? 'Enabled' : 'Manual'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-indigo-100/80">
                        <button
                          onClick={() => handleMarkVisitCompleted(propertyHomeWatchPlans[0])}
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Mark Visit Completed</span>
                        </button>

                        <button
                          onClick={() => onOpenQuickJobForProperty(selectedProperty, 'Home Watch')}
                          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-300 rounded-lg transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Schedule Visit Job</span>
                        </button>

                        <button
                          onClick={() =>
                            onOpenQuickJobForProperty(
                              selectedProperty,
                              'Maintenance / Repair',
                              undefined,
                              `Issue found during Home Watch at ${selectedProperty.name || selectedProperty.propertyName}: `
                            )
                          }
                          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                          title="Log problem discovered during Home Watch"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>+ Create Follow-up Job</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-700">No Home Watch Plan Configured</p>
                          <p className="text-[11px] text-slate-400">Keep this property protected with scheduled routine visits.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenHomeWatchModal()}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        + Set Up Home Watch
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Owner / Client
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {propertyOwner ? (propertyOwner.name || propertyOwner.fullName) : 'Unassigned'}
                      </div>
                      {propertyOwner && (
                        <div className="text-xs text-slate-500 mt-1">
                          {propertyOwner.customerType} • {propertyOwner.phone || propertyOwner.lineWhatsapp || propertyOwner.email}
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                        On-Site Contact Person
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {selectedProperty.contactPerson || 'None specified'}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Area: {selectedProperty.area}
                      </div>
                    </div>
                  </div>

                  {/* Notes & Special Instructions */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Property Notes &amp; Special Instructions
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {selectedProperty.notes || selectedProperty.importantNotes || 'No special notes recorded.'}
                    </p>
                  </div>

                  {/* Quick Access to Google Maps */}
                  {selectedProperty.googleMapsUrl && (
                    <a
                      href={selectedProperty.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Open in Google Maps / Navigation</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
              )}

              {/* TAB: HOME WATCH (PROPERTY-FIRST RECURRING PLANS) */}
              {activeTab === 'home_watch' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-sm font-black text-slate-900">
                          Home Watch &amp; Recurring Safeguarding Plans
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Scheduled routine surveillance, storm checks, and preventive maintenance for {selectedProperty.name || selectedProperty.propertyName}.
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenHomeWatchModal()}
                      className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>+ New Plan</span>
                    </button>
                  </div>

                  {propertyHomeWatchPlans.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div className="max-w-sm mx-auto">
                        <h4 className="text-sm font-black text-slate-900">No Home Watch Plan Configured</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Create a recurring visit schedule (e.g. Every 2 Weeks) so visits appear automatically in your My Day schedule and calendar.
                        </p>
                      </div>
                      <button
                        onClick={() => handleOpenHomeWatchModal()}
                        className="inline-flex items-center gap-1.5 text-xs font-black px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Create Home Watch Plan</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {propertyHomeWatchPlans.map((plan) => {
                        const badge = getDaysRemainingLabel(plan.nextDueDate);
                        const isPaused = plan.status === 'Paused';

                        return (
                          <div
                            key={plan.id}
                            className={`p-5 rounded-2xl border transition-all ${
                              isPaused
                                ? 'bg-slate-50 border-slate-300 opacity-90'
                                : 'bg-white border-indigo-200 shadow-xs'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                              <div>
                                <div className="flex items-center flex-wrap gap-2 mb-1">
                                  <span className="text-[10px] font-mono font-bold text-slate-400">
                                    {plan.id}
                                  </span>
                                  <span
                                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                      isPaused
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {plan.status || 'Active'}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                    {plan.frequency}
                                  </span>
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                    ฿{(plan.price || 0).toLocaleString()} / visit
                                  </span>
                                  {plan.planType === 'finite' && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                      Package: {plan.visitsCompleted || 0}/{plan.totalVisits || 0} visits done
                                    </span>
                                  )}
                                  {plan.planType === 'ongoing' && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                                      Ongoing Subscription
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-base font-black text-slate-900">
                                  {plan.title || `Home Watch - ${selectedProperty.name || selectedProperty.propertyName}`}
                                </h4>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2.5 py-1 rounded-lg ${badge.color}`}>
                                  {badge.text}
                                </span>
                              </div>
                            </div>

                            {/* Finite package progress indicator */}
                            {plan.planType === 'finite' && plan.totalVisits && (
                              <div className="py-2.5 px-3 bg-amber-50/70 border border-amber-200/80 rounded-xl my-2 text-xs">
                                <div className="flex items-center justify-between text-amber-900 font-bold mb-1.5">
                                  <span>Fixed Visit Package Progress</span>
                                  <span>
                                    {plan.visitsCompleted || 0} of {plan.totalVisits} visits completed ({Math.max(0, (plan.totalVisits || 0) - (plan.visitsCompleted || 0))} remaining)
                                  </span>
                                </div>
                                <div className="w-full bg-amber-200 rounded-full h-2">
                                  <div
                                    className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(100, Math.round(((plan.visitsCompleted || 0) / (plan.totalVisits || 1)) * 100))}%`,
                                    }}
                                  />
                                </div>
                                {plan.visitDates && plan.visitDates.length > 0 && (
                                  <div className="mt-2 text-[11px] text-amber-950 flex flex-wrap gap-1 items-center">
                                    <span className="font-semibold">Scheduled Dates:</span>
                                    {plan.visitDates.map((d, i) => (
                                      <span key={i} className="px-1.5 py-0.5 bg-white border border-amber-200 rounded font-mono">
                                        #{i + 1}: {d}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Plan Details Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs">
                              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Next Due Date</span>
                                <span className="font-bold text-slate-900 font-mono">
                                  {plan.nextDueDate || 'Not set'}
                                </span>
                              </div>
                              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Last Visit</span>
                                <span className="font-bold text-slate-900 font-mono">
                                  {plan.lastCompletedDate || 'None recorded'}
                                </span>
                              </div>
                              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Auto-Job</span>
                                <span className="font-bold text-slate-900">
                                  {plan.autoCreateJob ? 'Enabled (Automatic)' : 'Manual Only'}
                                </span>
                              </div>
                              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Service Type</span>
                                <span className="font-bold text-slate-900">{plan.serviceType}</span>
                              </div>
                            </div>

                            {/* Inspection Focus / Instructions */}
                            {plan.notes && (
                              <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/60 text-xs text-indigo-950 mb-3">
                                <span className="font-bold block mb-0.5 text-[11px] uppercase tracking-wider text-indigo-800">
                                  Inspection Checklist &amp; Focus:
                                </span>
                                <p className="leading-relaxed">{plan.notes}</p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-slate-100">
                              <button
                                onClick={() => handleMarkVisitCompleted(plan)}
                                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                                title="Record visit done today and advance next due date"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Mark Visit Completed</span>
                              </button>

                              <button
                                onClick={() => onOpenQuickJobForProperty(selectedProperty, 'Home Watch')}
                                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Schedule Job for Next Visit</span>
                              </button>

                              <button
                                onClick={() =>
                                  onOpenQuickJobForProperty(
                                    selectedProperty,
                                    'Maintenance / Repair',
                                    undefined,
                                    `Issue found during Home Watch at ${selectedProperty.name || selectedProperty.propertyName}: `
                                  )
                                }
                                className="flex items-center gap-1 text-xs font-bold px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition-colors cursor-pointer"
                                title="Discovered a leak, broken AC, or pump issue during Home Watch visit"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>+ Create Follow-up Job</span>
                              </button>

                              <button
                                onClick={() => handleTogglePausePlan(plan)}
                                className="flex items-center gap-1 text-xs font-bold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                              >
                                {isPaused ? (
                                  <>
                                    <Play className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Resume</span>
                                  </>
                                ) : (
                                  <>
                                    <Pause className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Pause</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleOpenHomeWatchModal(plan)}
                                className="flex items-center gap-1 text-xs font-bold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              {onDeleteRecurringService && (
                                <button
                                  onClick={() => {
                                    if (confirm('Cancel and delete this Home Watch plan?')) {
                                      onDeleteRecurringService(plan.id);
                                    }
                                  }}
                                  className="flex items-center gap-1 text-xs font-bold px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer ml-auto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Cancel Plan</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Past Home Watch Visits & History */}
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-slate-400" />
                      <span>Past Visits &amp; Inspections for this Property</span>
                    </h4>

                    {propertyJobs.length === 0 ? (
                      <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        No inspection visits logged yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {propertyJobs.slice(0, 5).map((job) => (
                          <div
                            key={job.id}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[10px] text-slate-400">{job.id}</span>
                                <span className="font-bold text-slate-800">{job.serviceType || 'Inspection'}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                                  {getOwnerStatusLabel(job.status)}
                                </span>
                              </div>
                              <p className="text-slate-500 text-[11px] mt-0.5">
                                Date: {job.inspectionDate || job.createdAt?.slice(0, 10)} • Findings: {job.items?.length || 0}
                              </p>
                            </div>

                            <button
                              onClick={() => onOpenJobInspection(job.id)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300"
                            >
                              View Report →
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ACCESS */}
              {activeTab === 'access' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2 text-amber-900 font-black text-xs uppercase tracking-wider">
                      <Key className="w-4 h-4 text-amber-700" />
                      <span>Entry Access Information &amp; Keybox Codes</span>
                    </div>
                    <p className="text-xs sm:text-sm text-amber-950 font-medium whitespace-pre-wrap leading-relaxed">
                      {selectedProperty.accessInformation || selectedProperty.accessInfo || 'No keybox or gate codes provided.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <p className="font-bold text-slate-800 mb-1">Security Guard / Estate Management:</p>
                    <p>{selectedProperty.contactPerson || 'Direct villa entrance.'}</p>
                  </div>
                </div>
              )}

              {/* TAB 3: SYSTEMS */}
              {activeTab === 'systems' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {ALL_SYSTEMS.map((sys) => {
                      const installed = (
                        selectedProperty.systems || (selectedProperty.systemsInstalled as PropertySystem[]) || []
                      ).includes(sys);

                      return (
                        <div
                          key={sys}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
                            installed
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-2xs'
                              : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60'
                          }`}
                        >
                          <span className="text-xs">{sys}</span>
                          <span className="text-[10px] font-black uppercase">
                            {installed ? '✓ Installed' : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: JOBS (Customer -> Property -> Job) */}
              {activeTab === 'jobs' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                    <span>Showing all jobs associated with this property</span>
                    <span>{propertyJobs.length} total</span>
                  </div>

                  {propertyJobs.map((j) => (
                    <div
                      key={j.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            {j.status}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {j.inspectionDate || j.createdAt?.slice(0, 10)}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {j.serviceType}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {j.id} {j.requestDescription ? `• ${j.requestDescription}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onOpenJobInspection(j.id)}
                          className="text-xs font-bold px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => onOpenJobQuotation(j.id)}
                          className="text-xs font-bold px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                        >
                          Quote
                        </button>
                      </div>
                    </div>
                  ))}

                  {propertyJobs.length === 0 && (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl text-xs">
                      No jobs recorded for this property yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: INSPECTIONS */}
              {activeTab === 'inspections' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-blue-950">Next Routine Inspection:</div>
                      <div className="text-sm font-black text-blue-900">
                        {selectedProperty.nextInspection || 'Not scheduled'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Last Inspection:</div>
                      <div className="text-xs font-bold text-slate-800">
                        {selectedProperty.lastInspection || 'None on record'}
                      </div>
                    </div>
                  </div>

                  {propertyJobs
                    .filter((j) => j.items && j.items.length > 0)
                    .map((j) => (
                      <div
                        key={j.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            Inspection {j.id} ({j.inspectionDate})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {j.items.length} findings recorded • Inspector: {j.inspector}
                          </div>
                        </div>
                        <button
                          onClick={() => onOpenJobInspection(j.id)}
                          className="text-xs font-bold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer"
                        >
                          View Checklist
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {/* TAB 6: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Quotations, 3-document PDF packages, and Google Drive archives for {selectedProperty.name || selectedProperty.propertyName}.
                  </p>
                  {propertyJobs.map((j) => (
                    <div
                      key={j.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {j.quotation?.refNo || j.documentRef || j.id}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {j.serviceType} • {j.inspectionDate}
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenJobQuotation(j.id)}
                        className="text-xs font-bold px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer"
                      >
                        Open 3-PDF
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 7: PHOTOS */}
              {activeTab === 'photos' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Photo evidence captured during villa inspections</span>
                    <span>{propertyPhotos.length} photos</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {propertyPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 group relative"
                      >
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <div className="p-2 bg-white text-[10px]">
                          <div className="font-bold text-slate-800 truncate">{photo.title}</div>
                          <div className="text-slate-400">{photo.date}</div>
                        </div>
                      </div>
                    ))}

                    {propertyPhotos.length === 0 && (
                      <div className="col-span-4 p-8 text-center text-slate-400 bg-slate-50 rounded-xl text-xs">
                        No inspection photos logged yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8: HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 pb-1">Chronological property visit history</div>
                  <div className="space-y-3 pl-2 border-l-2 border-slate-200">
                    {propertyJobs.map((j) => (
                      <div key={j.id} className="relative pl-4">
                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-emerald-500"></div>
                        <div className="text-xs font-bold text-slate-900">
                          {j.inspectionDate || j.createdAt?.slice(0, 10)}: {j.serviceType}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Status: {j.status} • Client: {j.customerName}
                        </div>
                      </div>
                    ))}

                    {propertyJobs.length === 0 && (
                      <div className="text-xs text-slate-400 pl-4">No past visits recorded.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
              Select a property from the directory to view profile.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Property Modal */}
      {isEditModalOpen && editingProperty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900">
                {editingProperty.id.includes('PROP-') ? 'Edit Property' : 'Add New Property'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Property / Villa Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProperty.name}
                    onChange={(e) =>
                      setEditingProperty({ ...editingProperty, name: e.target.value })
                    }
                    placeholder="e.g. Green Mile Villa, Kathu"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer / Owner
                  </label>
                  <select
                    value={editingProperty.customerId}
                    onChange={(e) =>
                      setEditingProperty({ ...editingProperty, customerId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Property Type
                  </label>
                  <select
                    value={editingProperty.propertyType}
                    onChange={(e) =>
                      setEditingProperty({
                        ...editingProperty,
                        propertyType: e.target.value as PropertyType,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  >
                    <option value="Villa">Villa</option>
                    <option value="Condo">Condo</option>
                    <option value="Estate">Estate</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Area (Phuket District)
                  </label>
                  <select
                    value={editingProperty.area}
                    onChange={(e) =>
                      setEditingProperty({ ...editingProperty, area: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  >
                    <option value="Kathu">Kathu</option>
                    <option value="Nai Harn">Nai Harn</option>
                    <option value="Rawai">Rawai</option>
                    <option value="Patong">Patong</option>
                    <option value="Chalong">Chalong</option>
                    <option value="Bang Tao">Bang Tao</option>
                    <option value="Cherngtalay">Cherngtalay</option>
                    <option value="Kamala">Kamala</option>
                    <option value="Phuket Town">Phuket Town</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={editingProperty.contactPerson || ''}
                    onChange={(e) =>
                      setEditingProperty({ ...editingProperty, contactPerson: e.target.value })
                    }
                    placeholder="Estate manager / Guard"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Street Address
                </label>
                <input
                  type="text"
                  value={editingProperty.address}
                  onChange={(e) =>
                    setEditingProperty({ ...editingProperty, address: e.target.value })
                  }
                  placeholder="Address in Phuket"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Access Information (Keybox, Gate Code)
                </label>
                <input
                  type="text"
                  value={editingProperty.accessInformation}
                  onChange={(e) =>
                    setEditingProperty({ ...editingProperty, accessInformation: e.target.value })
                  }
                  placeholder="Master lockbox code: 1234, sliding gate remote..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Installed Systems
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ALL_SYSTEMS.map((sys) => {
                    const isChecked = editingProperty.systems.includes(sys);
                    return (
                      <label
                        key={sys}
                        className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs cursor-pointer select-none ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingProperty({
                                ...editingProperty,
                                systems: [...editingProperty.systems, sys],
                              });
                            } else {
                              setEditingProperty({
                                ...editingProperty,
                                systems: editingProperty.systems.filter((s) => s !== sys),
                              });
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{sys}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Special Notes &amp; Cautions
                </label>
                <textarea
                  rows={2}
                  value={editingProperty.notes}
                  onChange={(e) =>
                    setEditingProperty({ ...editingProperty, notes: e.target.value })
                  }
                  placeholder="e.g. Turn off breaker before touching server rack..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HOME WATCH CONFIGURATION MODAL (PROPERTY-FIRST) */}
      {isHomeWatchModalOpen && editingHomeWatchPlan && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingHomeWatchPlan.id.startsWith('REC-') && propertyHomeWatchPlans.some(p => p.id === editingHomeWatchPlan.id)
                      ? 'Edit Home Watch Plan'
                      : 'Create Home Watch Plan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tied directly to {selectedProperty.name || selectedProperty.propertyName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHomeWatchModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onSaveRecurringService && editingHomeWatchPlan) {
                  onSaveRecurringService({
                    ...editingHomeWatchPlan,
                    updatedAt: new Date().toISOString(),
                  });
                }
                setIsHomeWatchModalOpen(false);
              }}
              className="p-5 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              {/* Pre-bound Property & Client Info (No re-selection required) */}
              <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-indigo-400 block">Property</span>
                    <span className="font-black text-indigo-950">
                      {selectedProperty.name || selectedProperty.propertyName}
                    </span>
                    <span className="text-[10px] text-indigo-700 block">{selectedProperty.area}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-indigo-400 block">Owner / Client</span>
                    <span className="font-black text-indigo-950">
                      {propertyOwner ? (propertyOwner.name || propertyOwner.preferredName || propertyOwner.fullName) : 'Unassigned'}
                    </span>
                    <span className="text-[10px] text-indigo-700 block">{propertyOwner?.phone || 'No phone'}</span>
                  </div>
                </div>
              </div>

              {/* Service Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Plan Name / Title
                </label>
                <input
                  type="text"
                  required
                  value={editingHomeWatchPlan.title}
                  onChange={(e) =>
                    setEditingHomeWatchPlan({ ...editingHomeWatchPlan, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              {/* Frequency & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Visit Frequency
                  </label>
                  <select
                    value={editingHomeWatchPlan.frequency}
                    onChange={(e) =>
                      setEditingHomeWatchPlan({
                        ...editingHomeWatchPlan,
                        frequency: e.target.value as RecurringFrequency,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                  >
                    <option value="Weekly">Weekly (Every 7 days)</option>
                    <option value="Every 2 Weeks">Every 2 Weeks (14 days - Standard)</option>
                    <option value="Monthly">Monthly (Every 30 days)</option>
                    <option value="Every 2 Months">Every 2 Months</option>
                    <option value="Quarterly">Quarterly (Every 3 months)</option>
                    <option value="Twice a Week">Twice a Week</option>
                    <option value="Custom">Custom Interval (Days)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price per Visit (THB)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">฿</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={editingHomeWatchPlan.price || 0}
                      onChange={(e) =>
                        setEditingHomeWatchPlan({
                          ...editingHomeWatchPlan,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Interval if selected */}
              {editingHomeWatchPlan.frequency === 'Custom' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Custom Interval (Number of Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingHomeWatchPlan.customIntervalDays || 14}
                    onChange={(e) =>
                      setEditingHomeWatchPlan({
                        ...editingHomeWatchPlan,
                        customIntervalDays: parseInt(e.target.value) || 14,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
              )}

              {/* Next Visit Date & Auto-Create Job */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Next Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editingHomeWatchPlan.nextDueDate}
                    onChange={(e) =>
                      setEditingHomeWatchPlan({
                        ...editingHomeWatchPlan,
                        nextDueDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Job Creation Setting
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingHomeWatchPlan.autoCreateJob}
                      onChange={(e) =>
                        setEditingHomeWatchPlan({
                          ...editingHomeWatchPlan,
                          autoCreateJob: e.target.checked,
                        })
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-slate-800">Auto-create Job on schedule</span>
                  </label>
                </div>
              </div>

              {/* Inspection Focus / Checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Inspection Focus &amp; Notes
                </label>
                <textarea
                  rows={3}
                  value={editingHomeWatchPlan.notes}
                  onChange={(e) =>
                    setEditingHomeWatchPlan({ ...editingHomeWatchPlan, notes: e.target.value })
                  }
                  placeholder="e.g. Check perimeter, pool pump, AC units run test, check for roof/pipe leaks, electrical breakers."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Plan Status
                </label>
                <select
                  value={editingHomeWatchPlan.status}
                  onChange={(e) =>
                    setEditingHomeWatchPlan({
                      ...editingHomeWatchPlan,
                      status: e.target.value as 'Active' | 'Paused' | 'Completed' | 'Cancelled',
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHomeWatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Home Watch Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / ARCHIVE SAFETY MODAL FOR PROPERTY */}
      {deleteSafetyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {deleteSafetyTarget.report.canPermanentlyDelete ? (
                  <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                    <Trash2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {deleteSafetyTarget.report.canPermanentlyDelete
                      ? 'Confirm Permanent Deletion'
                      : 'Data Safety: Archive Property'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">{deleteSafetyTarget.property.id}</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteSafetyTarget(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-xs font-black text-slate-900">
                  {deleteSafetyTarget.property.name || deleteSafetyTarget.property.propertyName}
                </div>
                <div className="text-[11px] text-slate-500">
                  {deleteSafetyTarget.property.area} • {deleteSafetyTarget.property.address}
                </div>
              </div>

              {deleteSafetyTarget.report.canPermanentlyDelete ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    ✓ Verified: This property has no associated inspection jobs, invoices, or recurring Home Watch plans. Safe to permanently delete.
                  </div>
                  <p className="text-xs text-slate-600">
                    To prevent accidental clicks, please type <strong>DELETE</strong> below to confirm:
                  </p>
                  <input
                    type="text"
                    value={confirmDeleteText}
                    onChange={(e) => setConfirmDeleteText(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <strong>Cannot permanently delete:</strong> Property is tied to existing records. Deleting it would break historical quotations, invoices, and past service logs.
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800">{deleteSafetyTarget.report.jobsCount}</div>
                      <div className="text-[10px] text-slate-500">Jobs</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800">{deleteSafetyTarget.report.invoicesCount}</div>
                      <div className="text-[10px] text-slate-500">Invoices</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800">{deleteSafetyTarget.report.recurringCount}</div>
                      <div className="text-[10px] text-slate-500">Recurring Plans</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">
                    {deleteSafetyTarget.property.isArchived
                      ? 'This property is currently archived. You can unarchive it to return it to active lists.'
                      : 'Archiving hides this property from active views while preserving all villa systems, access codes, and past inspection history.'}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteSafetyTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              {deleteSafetyTarget.report.canPermanentlyDelete ? (
                <button
                  type="button"
                  disabled={confirmDeleteText.trim().toUpperCase() !== 'DELETE'}
                  onClick={() => {
                    if (onDeleteProperty) {
                      onDeleteProperty(deleteSafetyTarget.property.id);
                    }
                    setDeleteSafetyTarget(null);
                  }}
                  className="px-5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs cursor-pointer"
                >
                  Permanently Delete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onArchiveProperty) {
                      onArchiveProperty({
                        ...deleteSafetyTarget.property,
                        isArchived: !deleteSafetyTarget.property.isArchived,
                      });
                    }
                    setDeleteSafetyTarget(null);
                  }}
                  className={`px-5 py-2 text-xs font-black text-white rounded-xl shadow-xs cursor-pointer ${
                    deleteSafetyTarget.property.isArchived
                      ? 'bg-blue-600 hover:bg-blue-500'
                      : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  {deleteSafetyTarget.property.isArchived ? 'Unarchive / Restore' : 'Archive Property'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
