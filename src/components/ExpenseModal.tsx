import React, { useState } from 'react';
import { X, DollarSign, Tag, Calendar, FileText, Plus, Receipt } from 'lucide-react';
import { Expense, ExpenseCategory, InspectionJob } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expense: Expense) => void;
  presetJobId?: string | null;
  jobs: InspectionJob[];
}

const CATEGORIES: ExpenseCategory[] = [
  'Materials',
  'Equipment',
  'Fuel',
  'Travel',
  'Vendor',
  'Helper',
  'Parking',
  'Other',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense,
  presetJobId,
  jobs,
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(
    presetJobId || jobs[0]?.id || ''
  );
  const [category, setCategory] = useState<ExpenseCategory>('Materials');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (presetJobId) {
      setSelectedJobId(presetJobId);
    } else if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [presetJobId, jobs]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount) || 0;
    if (parsedAmount <= 0) {
      alert('Please enter a valid expense amount');
      return;
    }

    const newExpense: Expense = {
      id: `EXP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      jobId: selectedJobId,
      date,
      category,
      description: description.trim() || `${category} expense`,
      amount: parsedAmount,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onSaveExpense(newExpense);
    setDescription('');
    setAmount('');
    setNotes('');
    onClose();
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-100 text-rose-800 rounded-lg">
              <Receipt className="w-4 h-4 text-rose-700" />
            </span>
            <h2 className="text-lg font-black text-slate-900">Add Job Expense</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Record cost for materials, fuel, helper, or third-party fees
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Job Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Linked Job *
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.villaName} ({j.customerName}) - {j.id}
                </option>
              ))}
            </select>
          </div>

          {/* Category Pills */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
              Category *
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer truncate ${
                    category === cat
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Description *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 50m Cat6 cable, PTT fuel, helper day rate"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Amount (฿) *
              </label>
              <input
                type="number"
                required
                placeholder="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-bold focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Receipt / Supplier Note
              </label>
              <input
                type="text"
                placeholder="e.g. HomePro Nai Harn #991"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              />
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
              className="px-5 py-2.5 text-xs sm:text-sm font-extrabold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
