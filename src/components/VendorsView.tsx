import React, { useState } from 'react';
import {
  Truck,
  Search,
  Plus,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Star,
  Clock,
  Briefcase,
  AlertCircle,
  Filter,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Edit,
} from 'lucide-react';
import { Vendor, VendorCategory, VendorStatus, InspectionJob } from '../types';
import { VendorModal } from './VendorModal';

interface VendorsViewProps {
  vendors: Vendor[];
  jobs: InspectionJob[];
  onSaveVendor: (vendor: Vendor) => void;
  onOpenJobDetail?: (jobId: string) => void;
}

const CATEGORIES: VendorCategory[] = [
  'Electrician',
  'Plumber',
  'Air Conditioning',
  'CCTV',
  'Internet / WiFi',
  'Locksmith',
  'Cleaner',
  'Handyman',
  'Car / Tire',
  'Pet / Vet',
  'Transport',
  'Other',
];

export const VendorsView: React.FC<VendorsViewProps> = ({
  vendors,
  jobs,
  onSaveVendor,
  onOpenJobDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.companyName && v.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.serviceAreas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.reliabilityNotes.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && v.status !== selectedStatus) return false;

    return true;
  });

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingVendor(null);
    setIsModalOpen(true);
  };

  const toggleExpand = (vendorId: string) => {
    setExpandedVendorId((prev) => (prev === vendorId ? null : vendorId));
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-12 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#0f1d33] text-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-400">
              SOLO OPERATOR SUBCONTRACTORS
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-blue-400" />
            <span>Vendors &amp; Contractors</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Trusted electricians, plumbers, aircon technicians, and locksmiths across Phuket. Internal tracking and ratings.
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ ADD VENDOR</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor by name, trade, area (Rawai, Chalong...), notes..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Backup">Backup</option>
              <option value="Do Not Use">Do Not Use</option>
            </select>
          </div>
        </div>

        {/* Quick Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({vendors.length})
          </button>
          {CATEGORIES.slice(0, 6).map((cat) => {
            const count = vendors.filter((v) => v.category === cat).length;
            if (count === 0 && selectedCategory !== cat) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((vendor) => {
          const vendorJobs = jobs.filter((j) => j.vendorId === vendor.id);
          const inProgressCount = vendorJobs.filter(
            (j) => j.status !== 'Completed' && j.status !== 'Cancelled'
          ).length;
          const completedCount = vendor.jobsCompleted || vendorJobs.filter((j) => j.status === 'Completed').length;
          const isExpanded = expandedVendorId === vendor.id;

          const statusColor =
            vendor.status === 'Active'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : vendor.status === 'Backup'
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-rose-100 text-rose-800 border-rose-200';

          return (
            <div
              key={vendor.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Name, Category, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        {vendor.category}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${statusColor}`}>
                        {vendor.status}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mt-1.5">
                      {vendor.name}
                    </h3>
                    {vendor.companyName && (
                      <p className="text-xs text-slate-500 font-medium">{vendor.companyName}</p>
                    )}
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleEdit(vendor)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                    title="Edit Vendor"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                {/* Service Areas */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium truncate">{vendor.serviceAreas}</span>
                </div>

                {/* Rating & Job Stats */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= vendor.privateRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                      <span className="text-[10px] font-bold text-slate-500 ml-1">
                        ({vendor.privateRating}/5)
                      </span>
                    </div>
                    <span className="text-[9px] text-amber-700 font-bold block uppercase tracking-wider mt-0.5">
                      Private Internal
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900">
                      {completedCount} Jobs Done
                    </span>
                    {inProgressCount > 0 && (
                      <span className="text-[10px] font-bold text-blue-600 block">
                        {inProgressCount} In Progress
                      </span>
                    )}
                  </div>
                </div>

                {/* Notes Snapshot */}
                {vendor.reliabilityNotes && (
                  <p className="text-xs text-slate-600 bg-blue-50/50 border border-blue-100 p-2 rounded-lg line-clamp-2">
                    💡 <span className="font-semibold">{vendor.reliabilityNotes}</span>
                  </p>
                )}

                {vendor.priceNotes && (
                  <p className="text-[11px] text-slate-500">
                    💰 Rates: <span className="text-slate-700">{vendor.priceNotes}</span>
                  </p>
                )}

                {/* Expandable History */}
                {vendorJobs.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleExpand(vendor.id)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
                    >
                      <span>Job History ({vendorJobs.length})</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2 text-xs">
                        {vendorJobs.map((j) => (
                          <div
                            key={j.id}
                            onClick={() => onOpenJobDetail && onOpenJobDetail(j.id)}
                            className="p-2 bg-slate-50 hover:bg-blue-50/60 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="truncate mr-2">
                              <span className="font-bold text-slate-800">{j.villaName}</span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {j.serviceType}
                              </span>
                            </div>
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200 shrink-0">
                              {j.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* One-Tap Action Buttons */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
                <a
                  href={`tel:${vendor.phone}`}
                  className="flex-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>

                {vendor.lineWhatsapp && (
                  <a
                    href={
                      vendor.lineWhatsapp.startsWith('+') || /^\d+$/.test(vendor.lineWhatsapp)
                        ? `https://wa.me/${vendor.lineWhatsapp.replace(/\D/g, '')}`
                        : `https://line.me/ti/p/~${vendor.lineWhatsapp}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp/LINE</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {filteredVendors.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <Truck className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No contractors found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No vendors match your current filter. Clear search or add a new subcontractor.
            </p>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
            >
              + Add First Vendor
            </button>
          </div>
        )}
      </div>

      {/* Vendor Modal */}
      <VendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveVendor}
        vendorToEdit={editingVendor}
      />
    </div>
  );
};
