import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MessageSquare,
  Building2,
  Briefcase,
  Calendar,
  FileText,
  Clock,
  Edit2,
  X,
  ChevronRight,
  ExternalLink,
  DollarSign,
  FolderOpen,
  CornerDownRight,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Archive,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import {
  Customer,
  CustomerType,
  Property,
  InspectionJob,
  Invoice,
  RecurringService,
  getOwnerStatusLabel,
} from '../types';
import { checkCustomerDeleteSafety, CustomerSafetyReport } from '../utils/crmStorage';

interface CustomersViewProps {
  customers: Customer[];
  properties: Property[];
  jobs: InspectionJob[];
  invoices?: Invoice[];
  recurringServices?: RecurringService[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onArchiveCustomer?: (customer: Customer) => void;
  onOpenQuickJobForCustomer: (customer: Customer) => void;
  onOpenJobInspection: (jobId: string) => void;
  onOpenJobQuotation: (jobId: string) => void;
  initialSelectedCustomerId?: string | null;
}

type ProfileTab = 'hierarchy' | 'properties' | 'jobs' | 'quotes' | 'reports' | 'documents' | 'followups';

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  properties,
  jobs,
  invoices = [],
  recurringServices = [],
  onSaveCustomer,
  onDeleteCustomer,
  onArchiveCustomer,
  onOpenQuickJobForCustomer,
  onOpenJobInspection,
  onOpenJobQuotation,
  initialSelectedCustomerId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    initialSelectedCustomerId || (customers[0]?.id ?? null)
  );
  const [profileTab, setProfileTab] = useState<ProfileTab>('hierarchy');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteSafetyTarget, setDeleteSafetyTarget] = useState<{
    customer: Customer;
    report: CustomerSafetyReport;
  } | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  // Filtered customer list
  const filteredCustomers = customers.filter((c) => {
    const cName = c.name || c.fullName || '';
    const matchesSearch =
      cName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.preferredName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lineWhatsapp || c.lineOrWhatsapp || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (typeFilter === 'archived') {
      return matchesSearch && c.isArchived === true;
    }

    const notArchived = !c.isArchived;
    const matchesType = typeFilter === 'all' || c.customerType === typeFilter;
    return matchesSearch && notArchived && matchesType;
  });

  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) || filteredCustomers[0] || null;

  // Derived relations for the selected customer
  const customerProperties = selectedCustomer
    ? properties.filter((p) => p.customerId === selectedCustomer.id)
    : [];

  const customerJobs = selectedCustomer
    ? jobs.filter(
        (j) =>
          j.customerId === selectedCustomer.id ||
          (j.clientId && selectedCustomer.id.includes(j.clientId)) ||
          j.customerName.toLowerCase().includes(selectedCustomer.preferredName.toLowerCase()) ||
          (selectedCustomer.name || selectedCustomer.fullName || '').toLowerCase().includes(j.customerName.toLowerCase())
      )
    : [];

  const handleOpenAdd = () => {
    const newId = `CUST-${Date.now().toString().slice(-6)}`;
    setEditingCustomer({
      id: newId,
      name: '',
      fullName: '',
      preferredName: '',
      email: '',
      phone: '',
      lineWhatsapp: '',
      lineOrWhatsapp: '',
      customerType: 'Expat',
      notes: '',
      status: 'Active',
      createdAt: new Date().toISOString(),
      lastContact: new Date().toISOString().slice(0, 10),
      nextFollowUp: '',
      followUpNote: '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer({
      ...cust,
      name: cust.name || cust.fullName || '',
      lineWhatsapp: cust.lineWhatsapp || cust.lineOrWhatsapp || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name.trim()) return;

    const toSave: Customer = {
      ...editingCustomer,
      fullName: editingCustomer.name,
      lineOrWhatsapp: editingCustomer.lineWhatsapp,
    };

    onSaveCustomer(toSave);
    setSelectedCustomerId(toSave.id);
    setIsEditModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20 sm:pb-12">
      {/* Header bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-black text-slate-900">
              Customer CRM
            </h1>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
              {customers.length} total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Client profiles, properties, job history, and follow-up records
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Main CRM Grid: Left list (4 cols) & Right profile (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Customer Directory */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search and Filters */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
              <button
                onClick={() => setTypeFilter('all')}
                className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-[#0f1d33] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({customers.filter((c) => !c.isArchived).length})
              </button>
              {(['Expat', 'Overseas Property Owner', 'Local Customer', 'Property Manager'] as CustomerType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                    typeFilter === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
              {customers.some((c) => c.isArchived) && (
                <button
                  onClick={() => setTypeFilter('archived')}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap transition-colors flex items-center gap-1 ${
                    typeFilter === 'archived'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <Archive className="w-2.5 h-2.5" />
                  <span>Archived ({customers.filter((c) => c.isArchived).length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Customer Cards List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredCustomers.map((c) => {
              const isSelected = selectedCustomer?.id === c.id;
              const propCount = properties.filter((p) => p.customerId === c.id).length;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                          {c.customerType}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            c.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900 truncate">
                        {c.name || c.fullName || c.preferredName}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {c.phone || c.lineWhatsapp || c.lineOrWhatsapp || c.email || 'No contact info'}
                      </p>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>{propCount} {propCount === 1 ? 'property' : 'properties'}</span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 mt-1 ${
                        isSelected ? 'text-blue-600' : 'text-slate-300'
                      }`}
                    />
                  </div>
                </div>
              );
            })}

            {filteredCustomers.length === 0 && (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
                No customers found matching your search.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Profile */}
        <div className="lg:col-span-8">
          {selectedCustomer ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
              {/* Profile Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {selectedCustomer.id}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {selectedCustomer.customerType}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {selectedCustomer.status}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {selectedCustomer.name || selectedCustomer.fullName}
                  </h2>
                  {selectedCustomer.preferredName && (
                    <p className="text-xs text-slate-500 font-medium">
                      Preferred name: <strong>{selectedCustomer.preferredName}</strong>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const report = checkCustomerDeleteSafety(
                        selectedCustomer.id,
                        properties,
                        jobs,
                        invoices || [],
                        recurringServices || []
                      );
                      setDeleteSafetyTarget({ customer: selectedCustomer, report });
                      setConfirmDeleteText('');
                    }}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer border ${
                      selectedCustomer.isArchived
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                    }`}
                    title={selectedCustomer.isArchived ? 'Archived Customer (Click to manage)' : 'Delete or Archive Customer'}
                  >
                    {selectedCustomer.isArchived ? (
                      <>
                        <Archive className="w-3.5 h-3.5 text-amber-700" />
                        <span>Archived</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(selectedCustomer)}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => onOpenQuickJobForCustomer(selectedCustomer)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ New Job</span>
                  </button>
                </div>
              </div>

              {/* Contact Information & Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 mb-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>Phone</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 select-all truncate">
                    {selectedCustomer.phone || '—'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 mb-1">
                    <MessageSquare className="w-3 h-3 text-emerald-600" />
                    <span>LINE / WhatsApp</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 select-all truncate">
                    {selectedCustomer.lineWhatsapp || selectedCustomer.lineOrWhatsapp || '—'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 mb-1">
                    <Mail className="w-3 h-3 text-blue-600" />
                    <span>Email</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 select-all truncate">
                    {selectedCustomer.email || '—'}
                  </div>
                </div>
              </div>

              {/* Customer Profile Tabs */}
              <div className="border-b border-slate-200 flex items-center gap-1 overflow-x-auto scrollbar-none pt-1">
                <button
                  onClick={() => setProfileTab('hierarchy')}
                  className={`pb-2.5 px-3 text-xs font-black whitespace-nowrap transition-colors border-b-2 ${
                    profileTab === 'hierarchy'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Customer → Property → Job
                </button>
                <button
                  onClick={() => setProfileTab('properties')}
                  className={`pb-2.5 px-3 text-xs font-black whitespace-nowrap transition-colors border-b-2 ${
                    profileTab === 'properties'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Properties ({customerProperties.length})
                </button>
                <button
                  onClick={() => setProfileTab('jobs')}
                  className={`pb-2.5 px-3 text-xs font-black whitespace-nowrap transition-colors border-b-2 ${
                    profileTab === 'jobs'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Jobs ({customerJobs.length})
                </button>
                <button
                  onClick={() => setProfileTab('quotes')}
                  className={`pb-2.5 px-3 text-xs font-black whitespace-nowrap transition-colors border-b-2 ${
                    profileTab === 'quotes'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Quotes ({customerJobs.filter((j) => j.quotation).length})
                </button>
                <button
                  onClick={() => setProfileTab('reports')}
                  className={`pb-2.5 px-3 text-xs font-black whitespace-nowrap transition-colors border-b-2 ${
                    profileTab === 'reports'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Reports (3 PDF)
                </button>
                <button
                  onClick={() => setProfileTab('documents')}
                  className={`pb-2.5 px-3 text-xs font-black whitespace-nowrap transition-colors border-b-2 ${
                    profileTab === 'documents'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Documents
                </button>
                <button
                  onClick={() => setProfileTab('followups')}
                  className={`pb-2.5 px-3 text-xs font-black whitespace-nowrap transition-colors border-b-2 ${
                    profileTab === 'followups'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Follow-ups
                </button>
              </div>

              {/* TAB CONTENT */}

              {/* 1. Hierarchy Tree View: CUSTOMER -> PROPERTY -> JOB */}
              {profileTab === 'hierarchy' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/60 text-xs text-blue-900 flex items-center justify-between">
                    <span>Hierarchy View: Showing properties owned and their associated jobs.</span>
                    <span className="font-bold">{customerProperties.length} Properties • {customerJobs.length} Jobs</span>
                  </div>

                  <div className="space-y-4 pl-2 border-l-2 border-slate-200">
                    {/* CUSTOMER ROOT NODE */}
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-[#0f1d33] text-white rounded-lg">
                        <Users className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {selectedCustomer.name || selectedCustomer.fullName} (Customer)
                      </span>
                    </div>

                    {/* PROPERTIES LEVEL */}
                    {customerProperties.map((prop) => {
                      const propJobs = customerJobs.filter(
                        (j) =>
                          j.propertyId === prop.id ||
                          (j.villaName && prop.name && j.villaName.toLowerCase().includes(prop.name.toLowerCase()))
                      );

                      return (
                        <div key={prop.id} className="ml-6 space-y-3">
                          <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <CornerDownRight className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                                  {prop.name || prop.propertyName}
                                </h4>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                  {prop.area} • {prop.propertyType}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{prop.address}</p>
                              {prop.accessInformation && (
                                <p className="text-[10px] text-amber-900 bg-amber-50 p-1 rounded mt-1">
                                  🔑 Access: {prop.accessInformation}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* JOBS LEVEL UNDER THIS PROPERTY */}
                          <div className="ml-6 space-y-2 pl-2 border-l-2 border-blue-200">
                            {propJobs.map((j) => (
                              <div
                                key={j.id}
                                className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-400 flex items-center justify-between gap-2 shadow-2xs"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                                      {j.serviceType}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                      {getOwnerStatusLabel(j.status)}
                                    </span>
                                  </div>
                                  <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
                                    {j.id} • {j.requestDescription || j.villaName}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => onOpenJobInspection(j.id)}
                                    className="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                                  >
                                    Inspect
                                  </button>
                                  <button
                                    onClick={() => onOpenJobQuotation(j.id)}
                                    className="text-[10px] font-bold px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded cursor-pointer"
                                  >
                                    Quote
                                  </button>
                                </div>
                              </div>
                            ))}

                            {propJobs.length === 0 && (
                              <div className="text-[11px] text-slate-400 py-1 pl-2">
                                No jobs logged for this property yet.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {customerProperties.length === 0 && (
                      <div className="text-xs text-slate-400 py-3 pl-6">
                        No properties linked to this customer yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Properties Tab */}
              {profileTab === 'properties' && (
                <div className="space-y-3">
                  {customerProperties.map((prop) => (
                    <div
                      key={prop.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                              {prop.propertyType}
                            </span>
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                              {prop.area}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900">
                            {prop.name || prop.propertyName}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">{prop.address}</p>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                        <span>Access: {prop.accessInformation || 'Standard'}</span>
                        <span className="text-emerald-700 font-bold">
                          Next Inspection: {prop.nextInspection || 'TBD'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {customerProperties.length === 0 && (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl text-xs">
                      No properties linked to this customer.
                    </div>
                  )}
                </div>
              )}

              {/* 3. Jobs Tab */}
              {profileTab === 'jobs' && (
                <div className="space-y-2.5">
                  {customerJobs.map((j) => (
                    <div
                      key={j.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded bg-blue-100 text-blue-800">
                            {getOwnerStatusLabel(j.status)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {j.inspectionDate || j.createdAt?.slice(0, 10)}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {j.villaName} • {j.serviceType}
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
                          className="text-xs font-bold px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer"
                        >
                          Quote
                        </button>
                      </div>
                    </div>
                  ))}

                  {customerJobs.length === 0 && (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl text-xs">
                      No jobs on record for this customer.
                    </div>
                  )}
                </div>
              )}

              {/* 4. Quotes Tab */}
              {profileTab === 'quotes' && (
                <div className="space-y-2.5">
                  {customerJobs.map((j) => {
                    const totalHardware = j.quotation?.hardwareItems?.reduce((s, i) => s + i.amount, 0) || 0;
                    const totalService = j.quotation?.serviceItems?.reduce((s, i) => s + i.amount, 0) || 0;
                    const grandTotal = j.price || totalHardware + totalService;

                    return (
                      <div
                        key={j.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-black text-slate-900">
                              {j.quotation?.refNo || `QT-${j.id}`}
                            </span>
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                              {j.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600">{j.villaName}</div>
                          <div className="text-[10px] text-slate-400">Date: {j.quotation?.date || j.inspectionDate}</div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-black text-blue-700">
                            ฿{grandTotal.toLocaleString()}
                          </div>
                          <button
                            onClick={() => onOpenJobQuotation(j.id)}
                            className="mt-1 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            Open Quote →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 5. Reports Tab */}
              {profileTab === 'reports' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Official 3-document PDF packages (Photo Evidence Log, Findings & Action Plan, Bilingual Tax Invoice / Quotation).
                  </p>
                  {customerJobs.map((j) => (
                    <div
                      key={j.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{j.villaName}</div>
                        <div className="text-[11px] text-slate-500">
                          {j.items?.length || 0} findings recorded • Ref: {j.documentRef || j.id}
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenJobQuotation(j.id)}
                        className="text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                      >
                        Generate 3 PDF
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 6. Documents Tab */}
              {profileTab === 'documents' && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                    <p className="font-bold text-slate-800 mb-1">Archived Documents & Cloud Drive</p>
                    <p>
                      Each job automatically links to its photo evidence folder on Google Drive.
                    </p>
                    {customerJobs.map((j) => (
                      <div key={j.id} className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span>{j.villaName} ({j.id})</span>
                        {j.driveFolderUrl ? (
                          <a
                            href={j.driveFolderUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                          >
                            <span>Drive Folder</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400">No Drive Link</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Follow-ups Tab */}
              {profileTab === 'followups' && (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-950">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-700" />
                      <span className="font-bold text-sm">Follow-up Schedule</span>
                    </div>
                    <p>
                      Next Follow-up Date: <strong>{selectedCustomer.nextFollowUp || 'Not scheduled'}</strong>
                    </p>
                    {selectedCustomer.followUpNote && (
                      <div className="mt-2 p-2.5 bg-white rounded-lg border border-blue-100 text-slate-800">
                        {selectedCustomer.followUpNote}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
              Select a customer from the directory to view profile.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900">
                {editingCustomer.id.includes('CUST-') ? 'Edit Customer' : 'Add New Customer'}
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
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.name}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, name: e.target.value })
                    }
                    placeholder="e.g. John Smith"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preferred / Nickname
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.preferredName}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, preferredName: e.target.value })
                    }
                    placeholder="e.g. John"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Type
                  </label>
                  <select
                    value={editingCustomer.customerType}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        customerType: e.target.value as CustomerType,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Expat">Expat</option>
                    <option value="Overseas Property Owner">Overseas Property Owner</option>
                    <option value="Local Customer">Local Customer</option>
                    <option value="Property Manager">Property Manager</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.phone}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, phone: e.target.value })
                    }
                    placeholder="+66..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    LINE / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.lineWhatsapp}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, lineWhatsapp: e.target.value })
                    }
                    placeholder="@lineid or WhatsApp number"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editingCustomer.email}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, email: e.target.value })
                  }
                  placeholder="client@example.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingCustomer.status}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        status: e.target.value as 'Active' | 'Lead' | 'Past' | 'Inactive',
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Lead">Lead</option>
                    <option value="Past">Past</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={editingCustomer.nextFollowUp || ''}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, nextFollowUp: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Follow-up Note
                </label>
                <input
                  type="text"
                  value={editingCustomer.followUpNote || ''}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, followUpNote: e.target.value })
                  }
                  placeholder="e.g. Call to confirm quote for CCTV"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  General Notes &amp; Preferences
                </label>
                <textarea
                  rows={2}
                  value={editingCustomer.notes}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, notes: e.target.value })
                  }
                  placeholder="Preferred communication times, languages, etc."
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
                  className="px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Archive Safety Modal */}
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
                      : 'Data Safety: Archive Customer'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">{deleteSafetyTarget.customer.id}</p>
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
                  {deleteSafetyTarget.customer.name || deleteSafetyTarget.customer.preferredName}
                </div>
                <div className="text-[11px] text-slate-500">
                  {deleteSafetyTarget.customer.customerType} • Phone: {deleteSafetyTarget.customer.phone || 'None'}
                </div>
              </div>

              {deleteSafetyTarget.report.canPermanentlyDelete ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    ✓ Verified: This customer has no associated properties, jobs, invoices, or recurring services. Safe to permanently delete.
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
                    <strong>Cannot permanently delete:</strong> Customer is tied to active business records. Permanently deleting would break financial accounting and service tracking.
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800">{deleteSafetyTarget.report.propertiesCount}</div>
                      <div className="text-[10px] text-slate-500">Properties</div>
                    </div>
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
                      <div className="text-[10px] text-slate-500">Recurring Services</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">
                    {deleteSafetyTarget.customer.isArchived
                      ? 'This customer is currently archived. You can unarchive them to return them to active lists.'
                      : 'Archiving hides this customer from active views while preserving all past jobs, quotes, and invoice histories.'}
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
                    if (onDeleteCustomer) {
                      onDeleteCustomer(deleteSafetyTarget.customer.id);
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
                    if (onArchiveCustomer) {
                      onArchiveCustomer({
                        ...deleteSafetyTarget.customer,
                        isArchived: !deleteSafetyTarget.customer.isArchived,
                      });
                    }
                    setDeleteSafetyTarget(null);
                  }}
                  className={`px-5 py-2 text-xs font-black text-white rounded-xl shadow-xs cursor-pointer ${
                    deleteSafetyTarget.customer.isArchived
                      ? 'bg-blue-600 hover:bg-blue-500'
                      : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  {deleteSafetyTarget.customer.isArchived ? 'Unarchive / Restore' : 'Archive Customer'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
