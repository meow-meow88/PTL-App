import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Camera,
  Clock,
  Building2,
  User,
  Plus,
  ArrowRight,
  FileText,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from 'lucide-react';
import { InspectionJob, HomeWatchChecklistItem, EvidencePhoto } from '../types';
import { formatEvidenceTimestamp, getHomeWatchMetrics } from '../utils/serviceWorkflow';
import { useLanguage } from '../i18n/translations';
import { recordJobActivity } from '../utils/jobEvents';

interface HomeWatchVisitViewProps {
  job: InspectionJob;
  title?: string;
  onUpdateJob: (updater: (prev: InspectionJob) => InspectionJob) => void;
  onCompleteVisit: () => void;
  onCreateFollowupJob: (issueNote: string, checklistItem: HomeWatchChecklistItem) => void;
  onOpenReport: () => void;
}

export const HomeWatchVisitView: React.FC<HomeWatchVisitViewProps> = ({
  job,
  title,
  onUpdateJob,
  onCompleteVisit,
  onCreateFollowupJob,
  onOpenReport,
}) => {
  const { lang, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoItemId, setActivePhotoItemId] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const checklist = job.homeWatchChecklist || [];
  const metrics = getHomeWatchMetrics(checklist);

  const isVisitStarted = Boolean(job.visitStartedAt) || job.status === 'In Progress';
  const isVisitCompleted = job.status === 'Completed' || Boolean(job.visitCompletedAt);

  // Start Visit handler
  const handleStartVisit = () => {
    const now = new Date().toISOString();
    onUpdateJob((prev) => {
      let updated: InspectionJob = {
        ...prev,
        visitStartedAt: now,
        actualStartedAt: prev.actualStartedAt || now,
        status: 'In Progress',
        lastActivityAt: now,
      };
      return recordJobActivity(updated, 'JOB_STARTED', {
        summary: `Inspection started for ${prev.villaName}`,
        actorType: prev.assignedToType || 'OWNER',
        actorName: prev.assignedVendorName || 'PTL Owner',
      });
    });
  };

  // Toggle item status: Normal | Issue | N/A
  const handleSetItemStatus = (itemId: string, newStatus: 'Normal' | 'Issue' | 'N/A') => {
    const now = new Date().toISOString();
    onUpdateJob((prev) => {
      const currentList = prev.homeWatchChecklist || [];
      const targetItem = currentList.find((i) => i.id === itemId);
      const updated = currentList.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            status: newStatus,
            capturedAt: now,
            updatedAt: now,
            performedBy: prev.assignedVendorName || 'PTL Owner',
            actorType: prev.assignedToType || 'OWNER',
            actorId: prev.assignedToId,
          };
        }
        return item;
      });

      let updatedJob: InspectionJob = {
        ...prev,
        homeWatchChecklist: updated,
        lastActivityAt: now,
      };

      if (newStatus === 'Issue') {
        updatedJob = recordJobActivity(updatedJob, 'ISSUE_REPORTED', {
          summary: `Issue flagged: ${targetItem?.title || 'Checklist item'}`,
          actorType: prev.assignedToType || 'OWNER',
          actorName: prev.assignedVendorName || 'PTL Owner',
          metadata: { itemId, itemTitle: targetItem?.title },
        });
      } else {
        updatedJob = recordJobActivity(updatedJob, 'CHECKLIST_UPDATED', {
          summary: `Checked "${targetItem?.title || 'Item'}" as ${newStatus}`,
          actorType: prev.assignedToType || 'OWNER',
          actorName: prev.assignedVendorName || 'PTL Owner',
          metadata: { itemId, status: newStatus },
        });
      }

      return updatedJob;
    });

    // Auto expand note input if issue
    if (newStatus === 'Issue') {
      setExpandedNotes((prev) => ({ ...prev, [itemId]: true }));
    }
  };

  // Update item note
  const handleUpdateNote = (itemId: string, noteText: string) => {
    onUpdateJob((prev) => {
      const currentList = prev.homeWatchChecklist || [];
      const now = new Date().toISOString();
      const updated = currentList.map((item) =>
        item.id === itemId
          ? {
              ...item,
              note: noteText,
              updatedAt: now,
              performedBy: prev.assignedVendorName || 'PTL Owner',
              actorType: prev.assignedToType || 'OWNER',
              actorId: prev.assignedToId,
            }
          : item
      );
      return { ...prev, homeWatchChecklist: updated, lastActivityAt: now };
    });
  };

  // Trigger camera file input for specific checklist item
  const handleTriggerPhoto = (itemId: string) => {
    setActivePhotoItemId(itemId);
    fileInputRef.current?.click();
  };

  // Photo file upload with timestamp & actor metadata
  const handlePhotoCaptured = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePhotoItemId) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      const nowIso = new Date().toISOString();

      onUpdateJob((prev) => {
        const currentList = prev.homeWatchChecklist || [];
        const targetItem = currentList.find((i) => i.id === activePhotoItemId);
        const updatedChecklist = currentList.map((item) => {
          if (item.id === activePhotoItemId) {
            return {
              ...item,
              photoUrl: dataUrl,
              originalPhotoUrl: dataUrl,
              capturedAt: nowIso,
              updatedAt: nowIso,
              performedBy: prev.assignedVendorName || 'PTL Owner',
              actorType: prev.assignedToType || 'OWNER',
              actorId: prev.assignedToId,
            };
          }
          return item;
        });

        const newEvidence: EvidencePhoto = {
          id: `EVID-${Date.now()}`,
          jobId: prev.id,
          customerId: prev.customerId,
          propertyId: prev.propertyId,
          checklistItemId: activePhotoItemId,
          photoUrl: dataUrl,
          originalPhotoUrl: dataUrl,
          capturedAt: nowIso,
          propertyName: prev.villaName,
          uploadedBy: prev.assignedVendorName || 'PTL Owner',
          performedBy: prev.assignedVendorName || 'PTL Owner',
          actorType: prev.assignedToType || 'OWNER',
          actorId: prev.assignedToId,
        };

        let updatedJob: InspectionJob = {
          ...prev,
          homeWatchChecklist: updatedChecklist,
          evidencePhotos: [...(prev.evidencePhotos || []), newEvidence],
          lastActivityAt: nowIso,
        };

        return recordJobActivity(updatedJob, 'PHOTO_ADDED', {
          summary: `Photo uploaded for ${targetItem?.title || 'Checklist item'}`,
          actorType: prev.assignedToType || 'OWNER',
          actorName: prev.assignedVendorName || 'PTL Owner',
          metadata: { checklistItemId: activePhotoItemId, photoId: newEvidence.id },
        });
      });

      setActivePhotoItemId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Group checklist items by category
  const categories = Array.from(new Set(checklist.map((i) => i.category)));

  return (
    <div className="space-y-4">
      {/* Hidden file input for photo capture */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCaptured}
        className="hidden"
      />

      {/* Top Visit Status & Primary Action Banner */}
      <div className="bg-[#0f1d33] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {title || t.homeWatchFlow.title}
              </span>
              {isVisitStarted && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>IN PROGRESS</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white mt-1 truncate">
              {job.villaName}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-semibold text-white">{job.customerName}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>{job.inspectionDate}</span>
              </span>
              {job.visitStartedAt && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.homeWatchFlow.startedAt} {new Date(job.visitStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              )}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="shrink-0 flex items-center gap-2">
            {!isVisitStarted && !isVisitCompleted && (
              <button
                onClick={handleStartVisit}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ring-2 ring-blue-400/40"
              >
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>{t.actions.startVisit}</span>
              </button>
            )}

            {isVisitStarted && !isVisitCompleted && (
              <button
                onClick={onCompleteVisit}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>{t.actions.completeVisit}</span>
              </button>
            )}

            {isVisitCompleted && (
              <button
                onClick={onOpenReport}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{lang === 'th' ? 'ดูรายงานสภาพบ้าน (PDF)' : 'View Visit Report & PDF'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              {lang === 'th' ? 'ความคืบหน้าการตรวจ:' : 'Checklist Progress:'}
            </span>
            <span className="font-extrabold text-white">
              {metrics.completedCount} / {metrics.total} ({metrics.normal} {t.homeWatchFlow.normalBtn}, {metrics.issue} {t.homeWatchFlow.issueBtn})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${metrics.total > 0 ? (metrics.completedCount / metrics.total) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {metrics.photosCount} {lang === 'th' ? 'รูป' : 'photos'}
            </span>
          </div>
        </div>
      </div>

      {/* Checklist Sections */}
      <div className="space-y-4">
        {categories.map((category) => {
          const items = checklist.filter((i) => i.category === category);
          return (
            <div key={category} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  {category}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {items.filter((i) => i.status !== 'Normal').length > 0 ? (
                    <span className="text-amber-600 font-bold">
                      {items.filter((i) => i.status === 'Issue').length} {t.homeWatchFlow.issueBtn}
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium">All Normal</span>
                  )}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isIssue = item.status === 'Issue';
                  const isExpandedNote = Boolean(expandedNotes[item.id]) || Boolean(item.note);

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 sm:p-4 transition-colors ${
                        isIssue ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Title & Status indicator */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {item.title}
                            </span>
                            {item.photoUrl && (
                              <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                <span>1</span>
                              </span>
                            )}
                          </div>
                          {item.note && (
                            <p className="text-xs text-amber-900 font-medium mt-1 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                              ⚠️ {item.note}
                            </p>
                          )}
                        </div>

                        {/* Tri-state buttons: Normal | Issue | N/A */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSetItemStatus(item.id, 'Normal')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              item.status === 'Normal'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            ✓ {t.homeWatchFlow.normalBtn}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetItemStatus(item.id, 'Issue')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              item.status === 'Issue'
                                ? 'bg-amber-500 text-slate-950 shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            ⚠️ {t.homeWatchFlow.issueBtn}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetItemStatus(item.id, 'N/A')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              item.status === 'N/A'
                                ? 'bg-slate-700 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {t.homeWatchFlow.naBtn}
                          </button>

                          {/* Quick Photo Button */}
                          <button
                            type="button"
                            onClick={() => handleTriggerPhoto(item.id)}
                            title={t.homeWatchFlow.takePhotoEvidence}
                            className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                              item.photoUrl
                                ? 'bg-sky-50 border-sky-300 text-sky-800'
                                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Photo Thumbnail preview if captured */}
                      {item.photoUrl && (
                        <div className="mt-2.5 flex items-center gap-3">
                          <img
                            src={item.photoUrl}
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded-xl border border-slate-300 shadow-2xs"
                          />
                          <div className="text-[11px] text-slate-500">
                            <span className="font-bold text-slate-700">
                              {t.homeWatchFlow.watermarkText}
                            </span>
                            <br />
                            <span>{formatEvidenceTimestamp(item.capturedAt)}</span>
                          </div>
                        </div>
                      )}

                      {/* Issue Action Row: Note input & Follow-up job trigger */}
                      {isIssue && (
                        <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder={t.homeWatchFlow.notePlaceholder}
                            value={item.note || ''}
                            onChange={(e) => handleUpdateNote(item.id, e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-amber-500"
                          />

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-500">
                              {lang === 'th' ? 'สามารถสร้างงานซ่อมแยกโดยไม่รบกวนการตรวจบ้าน' : 'Create follow-up job without interrupting Home Watch'}
                            </span>
                            <button
                              type="button"
                              onClick={() => onCreateFollowupJob(item.note || item.title, item)}
                              className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t.homeWatchFlow.createFollowup}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900">
            {title ? `${title} Summary` : t.homeWatchFlow.summaryTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {metrics.normal} {t.homeWatchFlow.normalBtn} • {metrics.issue} {t.homeWatchFlow.issueBtn} • {metrics.na} {t.homeWatchFlow.naBtn} • {metrics.photosCount} {lang === 'th' ? 'ภาพถ่ายหลักฐาน' : 'photos'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCompleteVisit}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{t.homeWatchFlow.completeAndReport}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
