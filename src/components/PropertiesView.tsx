import React, { useState } from 'react';
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
} from 'lucide-react';
import { Property, PropertyType, PropertySystem, Customer, InspectionJob } from '../types';

interface PropertiesViewProps {
  properties: Property[];
  customers: Customer[];
  jobs: InspectionJob[];
  onSaveProperty: (property: Property) => void;
  onOpenQuickJobForProperty: (property: Property) => void;
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
  onSaveProperty,
  onOpenQuickJobForProperty,
  onOpenJobInspection,
  onOpenJobQuotation,
  initialSelectedPropertyId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    initialSelectedPropertyId || (properties[0]?.id ?? null)
  );
  const [activeTab, setActiveTab] = useState<PropertyTab>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Filtered properties
  const filteredProperties = properties.filter((p) => {
    const pName = p.name || p.propertyName || '';
    const pAccess = p.accessInformation || p.accessInfo || '';
    const matchesSearch =
      pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pAccess.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesArea = areaFilter === 'all' || p.area.toLowerCase().includes(areaFilter.toLowerCase());
    return matchesSearch && matchesArea;
  });

  const selectedProperty =
    properties.find((p) => p.id === selectedPropertyId) || filteredProperties[0] || null;

  // Relations
  const propertyOwner = selectedProperty
    ? customers.find((c) => c.id === selectedProperty.customerId)
    : null;

  const propName = selectedProperty?.name || selectedProperty?.propertyName || '';

  const propertyJobs = selectedProperty
    ? jobs.filter(
        (j) =>
          j.propertyId === selectedProperty.id ||
          (j.villaName && propName && j.villaName.toLowerCase().includes(propName.toLowerCase())) ||
          (j.villaName && propName && propName.toLowerCase().includes(j.villaName.toLowerCase()))
      )
    : [];

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
              Property Database
            </h1>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
              {properties.length} properties
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage villa access codes, installed systems, routine audits, and past job history
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Property</span>
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
                placeholder="Search villa name, area, address..."
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
                All ({properties.length})
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
                          {p.propertyType}
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
                        <span>Owner: {owner ? (owner.name || owner.fullName || owner.preferredName) : 'Unassigned'}</span>
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
                No properties found matching your search.
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
                      {selectedProperty.propertyType}
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

                <div className="flex items-center gap-2">
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

              {/* Property Profile 8 Tabs */}
              <div className="border-b border-slate-200 flex items-center gap-1 overflow-x-auto scrollbar-none pt-1">
                {(
                  [
                    { id: 'overview', label: 'Overview' },
                    { id: 'access', label: 'Access' },
                    { id: 'systems', label: `Systems (${(selectedProperty.systems || selectedProperty.systemsInstalled || []).length})` },
                    { id: 'jobs', label: `Jobs (${propertyJobs.length})` },
                    { id: 'inspections', label: 'Inspections' },
                    { id: 'documents', label: 'Documents' },
                    { id: 'photos', label: `Photos (${propertyPhotos.length})` },
                    { id: 'history', label: 'History' },
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
    </div>
  );
};
