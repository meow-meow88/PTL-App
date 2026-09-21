import React, { useState, useEffect } from 'react';
import { X, Truck, Star, Phone, MessageSquare, Mail, MapPin, DollarSign, ShieldAlert, Check } from 'lucide-react';
import { Vendor, VendorCategory, VendorStatus } from '../types';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendor: Vendor) => void;
  vendorToEdit?: Vendor | null;
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

export const VendorModal: React.FC<VendorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vendorToEdit,
}) => {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('Handyman');
  const [phone, setPhone] = useState('');
  const [lineWhatsapp, setLineWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [serviceAreas, setServiceAreas] = useState('');
  const [priceNotes, setPriceNotes] = useState('');
  const [reliabilityNotes, setReliabilityNotes] = useState('');
  const [privateRating, setPrivateRating] = useState<number>(5);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [status, setStatus] = useState<VendorStatus>('Active');
  const [jobsCompleted, setJobsCompleted] = useState<number>(0);

  useEffect(() => {
    if (vendorToEdit) {
      setName(vendorToEdit.name || '');
      setCompanyName(vendorToEdit.companyName || '');
      setCategory(vendorToEdit.category || 'Handyman');
      setPhone(vendorToEdit.phone || '');
      setLineWhatsapp(vendorToEdit.lineWhatsapp || '');
      setEmail(vendorToEdit.email || '');
      setServiceAreas(vendorToEdit.serviceAreas || '');
      setPriceNotes(vendorToEdit.priceNotes || '');
      setReliabilityNotes(vendorToEdit.reliabilityNotes || '');
      setPrivateRating(vendorToEdit.privateRating || 5);
      setPaymentNotes(vendorToEdit.paymentNotes || '');
      setStatus(vendorToEdit.status || 'Active');
      setJobsCompleted(vendorToEdit.jobsCompleted || 0);
    } else {
      setName('');
      setCompanyName('');
      setCategory('Handyman');
      setPhone('');
      setLineWhatsapp('');
      setEmail('');
      setServiceAreas('Rawai / Chalong');
      setPriceNotes('');
      setReliabilityNotes('');
      setPrivateRating(5);
      setPaymentNotes('PromptPay on completion');
      setStatus('Active');
      setJobsCompleted(0);
    }
  }, [vendorToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedVendor: Vendor = {
      id: vendorToEdit ? vendorToEdit.id : `VEND-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      companyName: companyName.trim() || undefined,
      category,
      phone: phone.trim(),
      lineWhatsapp: lineWhatsapp.trim(),
      email: email.trim(),
      serviceAreas: serviceAreas.trim(),
      priceNotes: priceNotes.trim(),
      reliabilityNotes: reliabilityNotes.trim(),
      privateRating: Math.min(5, Math.max(1, privateRating)),
      jobsCompleted: Number(jobsCompleted) || 0,
      lastUsed: vendorToEdit?.lastUsed || new Date().toISOString().slice(0, 10),
      paymentNotes: paymentNotes.trim(),
      status,
      createdAt: vendorToEdit ? vendorToEdit.createdAt : new Date().toISOString(),
    };

    onSave(savedVendor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {vendorToEdit ? 'Edit Contractor Profile' : 'Add New Trusted Vendor'}
              </h2>
              <p className="text-xs text-slate-500">
                Internal contractor directory for solo operator dispatch
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vendor Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vendor / Contact Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Somchai Electric"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Name (Optional)
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Somchai Power & Wiring Co."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VendorCategory)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VendorStatus)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                <option value="Active">Active (Preferred)</option>
                <option value="Backup">Backup (Secondary)</option>
                <option value="Do Not Use">Do Not Use (Blacklisted)</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081 234 5678"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Line / WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                LINE ID / WhatsApp
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={lineWhatsapp}
                  onChange={(e) => setLineWhatsapp(e.target.value)}
                  placeholder="Line ID or +66..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contractor@gmail.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Service Areas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Service Areas *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={serviceAreas}
                  onChange={(e) => setServiceAreas(e.target.value)}
                  placeholder="e.g. Rawai / Chalong / Kata"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Private Rating & Solo Operator Notice */}
          <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-amber-900 uppercase flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  Private Internal Rating (1 - 5)
                </span>
                <p className="text-[11px] text-amber-700">
                  Strictly private. Never displayed on customer quotations, invoices, or reports.
                </p>
              </div>

              {/* Star Picker */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPrivateRating(star)}
                    className="p-1 text-slate-300 hover:text-amber-500 transition-colors"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= privateRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Price Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pricing Notes / Standard Rates
            </label>
            <input
              type="text"
              value={priceNotes}
              onChange={(e) => setPriceNotes(e.target.value)}
              placeholder="e.g. Call-out ฿500, AC wash ฿800/unit, hourly ฿400"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reliability Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reliability Notes
            </label>
            <textarea
              rows={2}
              value={reliabilityNotes}
              onChange={(e) => setReliabilityNotes(e.target.value)}
              placeholder="e.g. Punctual, brings own drop cloths, responds on LINE within 15 mins."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payment Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Payment Terms / Notes
            </label>
            <input
              type="text"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="e.g. PromptPay upon completion or 7 days net"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{vendorToEdit ? 'Save Changes' : 'Create Vendor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
