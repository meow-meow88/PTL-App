import React, { useState } from 'react';
import { X, Truck, Search, Star, MapPin, Check, Phone, MessageSquare, AlertCircle } from 'lucide-react';
import { Vendor, InspectionJob } from '../types';

interface AssignVendorModalProps {
  isOpen: boolean;
  job: InspectionJob | null;
  vendors: Vendor[];
  onClose: () => void;
  onAssignVendor: (jobId: string, vendorId: string | undefined) => void;
}

export const AssignVendorModal: React.FC<AssignVendorModalProps> = ({
  isOpen,
  job,
  vendors,
  onClose,
  onAssignVendor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen || !job) return null;

  // Auto-detect suggestions based on serviceType and location
  const serviceTypeLower = (job.serviceType || '').toLowerCase();
  const locationLower = (job.propertyLocation || job.villaName || '').toLowerCase();

  // Recommend category
  let recommendedCategory = '';
  if (serviceTypeLower.includes('air') || serviceTypeLower.includes('ac')) {
    recommendedCategory = 'Air Conditioning';
  } else if (serviceTypeLower.includes('electr') || serviceTypeLower.includes('power') || serviceTypeLower.includes('light')) {
    recommendedCategory = 'Electrician';
  } else if (serviceTypeLower.includes('plumb') || serviceTypeLower.includes('water') || serviceTypeLower.includes('pump') || serviceTypeLower.includes('pipe')) {
    recommendedCategory = 'Plumber';
  } else if (serviceTypeLower.includes('cctv') || serviceTypeLower.includes('camera')) {
    recommendedCategory = 'CCTV';
  } else if (serviceTypeLower.includes('wifi') || serviceTypeLower.includes('internet') || serviceTypeLower.includes('network')) {
    recommendedCategory = 'Internet / WiFi';
  } else if (serviceTypeLower.includes('lock') || serviceTypeLower.includes('key')) {
    recommendedCategory = 'Locksmith';
  } else if (serviceTypeLower.includes('clean') || serviceTypeLower.includes('maid')) {
    recommendedCategory = 'Cleaner';
  }

  // Filter vendors
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.companyName && v.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.serviceAreas.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;

    return true;
  });

  // Sort with recommended category & matching area at top
  const sortedVendors = [...filteredVendors].sort((a, b) => {
    const aCatMatch = recommendedCategory && a.category === recommendedCategory ? 1 : 0;
    const bCatMatch = recommendedCategory && b.category === recommendedCategory ? 1 : 0;
    if (bCatMatch !== aCatMatch) return bCatMatch - aCatMatch;

    const aAreaMatch = locationLower && a.serviceAreas.toLowerCase().includes(locationLower.slice(0, 5)) ? 1 : 0;
    const bAreaMatch = locationLower && b.serviceAreas.toLowerCase().includes(locationLower.slice(0, 5)) ? 1 : 0;
    if (bAreaMatch !== aAreaMatch) return bAreaMatch - aAreaMatch;

    return (b.privateRating || 0) - (a.privateRating || 0);
  });

  const handleSelect = (vendorId: string | undefined) => {
    onAssignVendor(job.id, vendorId);
    onClose();
  };

  const currentVendor = vendors.find((v) => v.id === job.vendorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Assign Vendor to Job
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-sm">
                {job.villaName} • {job.serviceType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Assigned Status */}
        {currentVendor ? (
          <div className="p-3 mx-4 mt-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <Check className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-bold text-emerald-950">Currently Assigned: </span>
                <span className="font-extrabold text-emerald-800">{currentVendor.name}</span>
                <span className="text-emerald-700 ml-1">({currentVendor.category})</span>
              </div>
            </div>
            <button
              onClick={() => handleSelect(undefined)}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 underline"
            >
              Unassign
            </button>
          </div>
        ) : (
          <div className="p-3 mx-4 mt-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-600">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>No subcontractor currently assigned to this job.</span>
          </div>
        )}

        {/* Search & Suggestions */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendors by name, category, area..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {recommendedCategory && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-bold text-slate-800">Suggested Trade:</span>
              <button
                onClick={() => setSelectedCategory(recommendedCategory)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                  selectedCategory === recommendedCategory
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                {recommendedCategory}
              </button>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-[11px] text-slate-500 hover:underline ml-1"
                >
                  Show All
                </button>
              )}
            </div>
          )}
        </div>

        {/* Vendor List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {sortedVendors.map((vendor) => {
            const isAssigned = job.vendorId === vendor.id;
            return (
              <div
                key={vendor.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isAssigned
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50/80'
                }`}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{vendor.name}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                      {vendor.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      ★ {vendor.privateRating}/5
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{vendor.serviceAreas}</span>
                  </div>

                  {vendor.reliabilityNotes && (
                    <p className="text-[11px] text-slate-600 truncate">
                      {vendor.reliabilityNotes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`tel:${vendor.phone}`}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Call"
                  >
                    <Phone className="w-4 h-4" />
                  </a>

                  {isAssigned ? (
                    <button
                      onClick={() => handleSelect(undefined)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelect(vendor.id)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                    >
                      Assign
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {sortedVendors.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              No matching vendors found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
