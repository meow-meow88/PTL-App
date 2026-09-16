import React from 'react';
import { Edit2, Trash2, MapPin } from 'lucide-react';
import { InspectionItem, FindingStatus } from '../types';

interface FindingCardProps {
  item: InspectionItem;
  index: number;
  onEdit: (item: InspectionItem) => void;
  onDelete: (id: string) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({ item, index, onEdit, onDelete }) => {
  const getStatusBadge = (status: FindingStatus) => {
    switch (status) {
      case 'Power Tripped':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Not Working':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Requires Swap':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Disconnected':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Critical Swap':
        return 'bg-red-600 text-white border-red-600 font-bold';
      case 'Normal':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
            {item.category}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {item.fileReference}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="แก้ไข"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="ลบ"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Photo thumbnail */}
        <div className="w-full sm:w-28 h-28 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-slate-400 text-xs">📷 No photo</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-bold text-slate-900 leading-snug">
              {index + 1}. {item.title || item.locationZone}
            </h3>
            <span
              className={`inline-block text-[10px] px-2 py-0.5 rounded border font-semibold shrink-0 ${getStatusBadge(
                item.status
              )}`}
            >
              {item.status}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-600">{item.locationZone}</span>
          </div>

          {/* Thai observation */}
          {item.observationTh && (
            <p className="text-xs text-slate-700 leading-relaxed line-clamp-2 mb-1.5 font-normal">
              {item.observationTh}
            </p>
          )}

          {/* English observation */}
          {item.observationEn && (
            <p className="text-[11px] text-slate-500 italic line-clamp-2 leading-relaxed">
              EN: {item.observationEn}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
