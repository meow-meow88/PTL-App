import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  ImagePlus,
  Check,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { FindingStatus, InspectionItem } from '../types';
import { analyzeFindingLocally, isNormalText, translateZoneToEnglish } from '../utils/mrBigLocalAnalyzer';
import { saveFindingDraft, getFindingDraft, clearFindingDraft } from '../utils/storage';

interface FindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveFinding: (finding: Omit<InspectionItem, 'id' | 'createdAt'>, editId?: string) => void;
  editingItem?: InspectionItem | null;
}

const CATEGORY_CHIPS = [
  'ELECTRICAL & LIGHTING AUDIT',
  'NETWORK & INFRASTRUCTURE',
  'SMART HOME SYSTEM DIAGNOSTICS',
  'AIR CONDITIONING & HVAC',
  'PLUMBING & SANITARY',
  'GENERAL PROPERTY MAINTENANCE',
];

const ZONE_QUICK_CHIPS = [
  'โต๊ะทำงาน / Work Desk',
  'ห้องนั่งเล่น / Living Room',
  'ห้องนอน 1 / Master Bedroom',
  'ห้องนอน 2 / Bedroom 2',
  'ตู้ไฟ MDB / Main Breaker',
  'สระว่ายน้ำ / Pool Area',
];

const PRESET_SAMPLE_PHOTOS = [
  { label: 'Desk Pop-Up / Plug', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60' },
  { label: 'Router / Wi-Fi', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=60' },
  { label: 'Circuit Breaker / Switch', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=60' },
  { label: 'Lighting / Downlight', url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&auto=format&fit=crop&q=60' },
  { label: 'Pool Pump / Motor', url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=500&auto=format&fit=crop&q=60' },
];

export const FindingModal: React.FC<FindingModalProps> = ({
  isOpen,
  onClose,
  onSaveFinding,
  editingItem,
}) => {
  const [category, setCategory] = useState('ELECTRICAL & LIGHTING AUDIT');
  const [zone, setZone] = useState('');
  const [title, setTitle] = useState('');
  const [findingTh, setFindingTh] = useState('');
  const [observationEn, setObservationEn] = useState('');
  const [status, setStatus] = useState<FindingStatus>('Not Working');
  const [actionTh, setActionTh] = useState('');
  const [actionEn, setActionEn] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [fileReference, setFileReference] = useState('');

  const [mrBigRisk, setMrBigRisk] = useState('');
  const [mrBigNote, setMrBigNote] = useState('');
  const [draftRestoredNotice, setDraftRestoredNotice] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isSavingWithAi, setIsSavingWithAi] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  const [isTranslatingLive, setIsTranslatingLive] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleInstantMrBigTranslate = async () => {
    if (!findingTh.trim()) {
      alert('กรุณากรอกอาการเสียภาษาไทยก่อนค่ะ');
      return;
    }
    setIsTranslatingLive(true);
    try {
      const res = await fetch('/api/gemini/mr-big', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingTh: findingTh.trim(),
          zone: zone.trim() || 'หน้างาน',
          category: category.trim(),
        }),
      });
      if (res.ok) {
        const aiData = await res.json();
        if (aiData.observationEn) setObservationEn(aiData.observationEn);
        if (aiData.recommendedActionTh) setActionTh(aiData.recommendedActionTh);
        if (aiData.recommendedActionEn) setActionEn(aiData.recommendedActionEn);
        if (aiData.suggestedStatus) setStatus(aiData.suggestedStatus as FindingStatus);
        if (aiData.riskAssessment) setMrBigRisk(aiData.riskAssessment);
        if (aiData.peaceOfMindNote) setMrBigNote(aiData.peaceOfMindNote);
        setShowAdvancedFields(true);
        setIsTranslatingLive(false);
        return;
      }
    } catch (e) {
      console.warn('Instant Mr. Big translation notice, activating local engine:', e);
    } finally {
      setIsTranslatingLive(false);
    }

    // Local high-precision engine fallback
    const local = analyzeFindingLocally(findingTh.trim(), zone.trim() || 'หน้างาน', category.trim(), status);
    setObservationEn(local.observationEn);
    setActionTh(local.recommendedActionTh);
    setActionEn(local.recommendedActionEn);
    setStatus(local.suggestedStatus);
    setMrBigRisk(local.riskAssessment);
    setMrBigNote(local.peaceOfMindNote);
    setShowAdvancedFields(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    if (editingItem) {
      setCategory(editingItem.category);
      setZone(editingItem.locationZone);
      setTitle(editingItem.title);
      setFindingTh(editingItem.observationTh);
      setObservationEn(editingItem.observationEn);
      setStatus(editingItem.status);
      setActionTh(editingItem.recommendedActionTh);
      setActionEn(editingItem.recommendedActionEn);
      setImageUrl(editingItem.imageUrl || '');
      setFileReference(editingItem.fileReference);
      setMrBigRisk(editingItem.mrBigRiskAssessment || '');
      setMrBigNote(editingItem.mrBigConfidence || '');
      setDraftRestoredNotice(null);
      if (editingItem.observationEn || editingItem.recommendedActionEn) {
        setShowAdvancedFields(true);
      }
    } else {
      // Check for saved draft first so user NEVER loses work!
      const draft = getFindingDraft();
      if (draft && (draft.findingTh || draft.zone || draft.imageUrl)) {
        setCategory(draft.category || 'ELECTRICAL & LIGHTING AUDIT');
        setZone(draft.zone || '');
        setTitle(draft.title || '');
        setFindingTh(draft.findingTh || '');
        setObservationEn(draft.observationEn || '');
        setStatus(draft.status || 'Not Working');
        setActionTh(draft.actionTh || '');
        setActionEn(draft.actionEn || '');
        setImageUrl(draft.imageUrl || '');
        setFileReference(draft.fileReference || `IMG_${Math.floor(1000 + Math.random() * 9000)}.jpg`);
        setMrBigRisk(draft.mrBigRisk || '');
        setMrBigNote(draft.mrBigNote || '');
        setDraftRestoredNotice('กู้คืนข้อความร่างที่คุณพิมพ์ค้างไว้เรียบร้อยแล้ว ไม่ต้องพิมพ์ใหม่');
        if (draft.observationEn || draft.actionEn) {
          setShowAdvancedFields(true);
        }
      } else {
        setCategory('ELECTRICAL & LIGHTING AUDIT');
        setZone('');
        setTitle('');
        setFindingTh('');
        setObservationEn('');
        setStatus('Not Working');
        setActionTh('');
        setActionEn('');
        setImageUrl('');
        setFileReference(`IMG_${Math.floor(1000 + Math.random() * 9000)}.jpg`);
        setMrBigRisk('');
        setMrBigNote('');
        setShowAdvancedFields(false);
        setDraftRestoredNotice(null);
      }
    }
  }, [editingItem, isOpen]);

  // Real-time draft auto-save whenever user enters or edits anything
  useEffect(() => {
    if (!isOpen || editingItem) return;
    if (findingTh || zone || title || observationEn || actionTh || imageUrl) {
      saveFindingDraft({
        category,
        zone,
        title,
        findingTh,
        observationEn,
        status,
        actionTh,
        actionEn,
        imageUrl,
        fileReference,
        mrBigRisk,
        mrBigNote,
      });
    }
  }, [category, zone, title, findingTh, observationEn, status, actionTh, actionEn, imageUrl, fileReference, mrBigRisk, mrBigNote, isOpen, editingItem]);

  const handleClearDraft = () => {
    clearFindingDraft();
    setCategory('ELECTRICAL & LIGHTING AUDIT');
    setZone('');
    setTitle('');
    setFindingTh('');
    setObservationEn('');
    setStatus('Not Working');
    setActionTh('');
    setActionEn('');
    setImageUrl('');
    setFileReference(`IMG_${Math.floor(1000 + Math.random() * 9000)}.jpg`);
    setMrBigRisk('');
    setMrBigNote('');
    setShowAdvancedFields(false);
    setDraftRestoredNotice(null);
  };

  const handleSafeClose = () => {
    // If user has unsaved draft, make sure it is saved
    if (!editingItem && (findingTh.trim() || imageUrl || zone.trim())) {
      saveFindingDraft({
        category,
        zone,
        title,
        findingTh,
        observationEn,
        status,
        actionTh,
        actionEn,
        imageUrl,
        fileReference,
        mrBigRisk,
        mrBigNote,
      });
    }
    onClose();
  };

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'th-TH';

      recognizer.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setFindingTh((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognizer.onerror = () => {
        setIsRecording(false);
      };

      recognizer.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognizer;
    } catch {
      setSpeechSupported(false);
    }
  }, []);

  if (!isOpen) return null;

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
        setIsRecording(false);
      }
    }
  };

  const handlePhotoFile = (file: File) => {
    setIsCompressingPhoto(true);
    setFileReference(file.name || `IMG_${Math.floor(1000 + Math.random() * 9000)}.jpg`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawSrc = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.75);
            setImageUrl(compressed);
          } else {
            setImageUrl(rawSrc);
          }
        } catch {
          setImageUrl(rawSrc);
        } finally {
          setIsCompressingPhoto(false);
        }
      };
      img.onerror = () => {
        setImageUrl(rawSrc);
        setIsCompressingPhoto(false);
      };
      img.src = rawSrc;
    };
    reader.onerror = () => {
      setIsCompressingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoFile(file);
    }
    e.target.value = '';
  };

  // Submit Handler: AUTOMATICALLY triggers AI Agent (Mr. Big) upon save without extra clicks!
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone.trim()) {
      alert('กรุณาระบุตำแหน่งหรือโซนที่พบปัญหา เช่น โต๊ะทำงาน, ห้องนั่งเล่น');
      return;
    }

    setIsSavingWithAi(true);

    let finalEn = observationEn.trim();
    let finalTh = findingTh.trim() || 'ตรวจสอบสภาพการทำงานหน้างาน';
    let finalActionTh = actionTh.trim();
    let finalActionEn = actionEn.trim();
    let finalStatus = status;
    let finalTitle = title.trim();
    let finalRisk = mrBigRisk;
    let finalNote = mrBigNote;

    // Automatically call Mr. Big to enrich and translate
    let enrichedByServer = false;
    if (finalTh) {
      try {
        const res = await fetch('/api/gemini/mr-big', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            findingTh: finalTh,
            zone: zone.trim(),
            category: category.trim(),
          }),
        });

        if (res.ok) {
          const aiData = await res.json();
          if (aiData.observationEn) {
            finalEn = aiData.observationEn;
          }
          // Never overwrite user's original Thai input with AI text!
          if (!finalTh && aiData.observationTh) {
            finalTh = aiData.observationTh;
          }
          if (aiData.recommendedActionTh) {
            finalActionTh = aiData.recommendedActionTh;
          }
          if (aiData.recommendedActionEn) {
            finalActionEn = aiData.recommendedActionEn;
          }
          if (aiData.suggestedStatus) {
            finalStatus = aiData.suggestedStatus as FindingStatus;
          }
          if (aiData.riskAssessment) {
            finalRisk = aiData.riskAssessment;
          }
          if (aiData.peaceOfMindNote) {
            finalNote = aiData.peaceOfMindNote;
          }
          enrichedByServer = true;
        }
      } catch (err) {
        console.warn('Auto AI enrichment fallback:', err);
      }
    }

    // High-precision local fallback (never insert raw Thai in English text)
    const isNormalCondition = isNormalText(finalTh) || status === 'Normal';
    if (!enrichedByServer || !finalEn || finalEn.includes('Identified issue') || finalEn.includes('Technical diagnosis required')) {
      const local = analyzeFindingLocally(finalTh, zone.trim(), category.trim(), finalStatus);
      if (!finalEn || finalEn.includes('Identified issue') || finalEn.includes('Technical diagnosis required')) {
        finalEn = local.observationEn;
      }
      if (!finalActionTh || finalActionTh.includes('ตรวจสอบแก้ไขและเปลี่ยนอุปกรณ์ที่ชำรุด')) {
        finalActionTh = local.recommendedActionTh;
      }
      if (!finalActionEn || finalActionEn.includes('malfunctioning hardware')) {
        finalActionEn = local.recommendedActionEn;
      }
      if (!enrichedByServer) {
        finalStatus = local.suggestedStatus;
      }
      if (!finalRisk) finalRisk = local.riskAssessment;
      if (!finalNote) finalNote = local.peaceOfMindNote;
    }

    // Absolute enforcement: if user reported normal status or no defect, status MUST be Normal and no replacement action!
    if (isNormalCondition) {
      finalStatus = 'Normal';
      const isSmartHome =
        finalTh.includes('สมาร์ทโฮม') ||
        finalTh.includes('smart home') ||
        finalTh.includes('automation') ||
        finalTh.includes('เกตเวย์') ||
        finalTh.includes('gateway');

      if (isSmartHome) {
        if (!finalActionEn || finalActionEn.toLowerCase().includes('replace') || finalActionEn.toLowerCase().includes('swap')) {
          finalActionEn = 'No switch or hardware replacement required. Perform follow-up technical check on smart home gateway pairing, wireless signal transmission, and automation system connectivity.';
          finalActionTh = 'สวิตช์ไฟและวงจรทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอุปกรณ์ แต่ให้ช่างเทคนิคตรวจสอบสัญญาณเชื่อมต่อ เกตเวย์ และระบบสมาร์ทโฮมอีกครั้งเพื่อความสมบูรณ์ในการสั่งการ';
        }
      } else if (!finalActionEn || finalActionEn.toLowerCase().includes('replace') || finalActionEn.toLowerCase().includes('swap')) {
        finalActionEn = 'No hardware replacement required. Maintain scheduled routine preventive inspections.';
        finalActionTh = 'ระบบทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอุปกรณ์ ให้คงรอบการตรวจเช็กตามระยะเวลา';
      }
    }

    if (!finalTitle || finalTitle.includes('Diagnostic Inspection')) {
      const zName = zone.trim() || 'หน้างาน';
      if (
        finalTh.includes('สมาร์ทโฮม') ||
        finalTh.includes('smart home') ||
        finalTh.includes('automation')
      ) {
        finalTitle = `${zName} - ตรวจสอบสวิตช์ไฟและระบบสมาร์ทโฮม`;
      } else if (finalStatus === 'Normal') {
        finalTitle = `${zName} - ตรวจสอบการทำงานปกติ (Pass)`;
      } else {
        finalTitle = `${zName} - ${finalTh.slice(0, 45)}`;
      }
    }

    onSaveFinding(
      {
        category,
        locationZone: zone.trim(),
        title: finalTitle,
        fileReference: fileReference || `IMG_${Math.floor(1000 + Math.random() * 9000)}.jpg`,
        imageUrl: imageUrl || undefined,
        observationEn: finalEn,
        observationTh: finalTh,
        status: finalStatus,
        recommendedActionEn: finalActionEn,
        recommendedActionTh: finalActionTh,
        mrBigRiskAssessment: finalRisk || undefined,
        mrBigConfidence: finalNote || undefined,
      },
      editingItem?.id
    );

    setIsSavingWithAi(false);
    clearFindingDraft();
    setDraftRestoredNotice(null);
    onClose();
  };

  const statuses: { label: FindingStatus; th: string; color: string }[] = [
    { label: 'Requires Swap', th: 'ต้องเปลี่ยนอะไหล่', color: 'border-rose-300 bg-rose-50 text-rose-700' },
    { label: 'Not Working', th: 'ไม่ทำงาน / ชำรุด', color: 'border-amber-300 bg-amber-50 text-amber-800' },
    { label: 'Power Tripped', th: 'ไฟตัด / ลัดวงจร', color: 'border-red-300 bg-red-50 text-red-700' },
    { label: 'Critical Swap', th: 'ต้องเปลี่ยนด่วน', color: 'border-red-600 bg-red-600 text-white font-bold' },
    { label: 'Disconnected', th: 'หลุดจากระบบ', color: 'border-purple-300 bg-purple-50 text-purple-700' },
    { label: 'Normal', th: 'ปกติ / ตรวจผ่าน', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !findingTh.trim() && !imageUrl && !zone.trim()) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={handleSafeClose}
          type="button"
          title="ปิดหน้าต่าง (บันทึกร่างอัตโนมัติ)"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4 pr-8">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {editingItem ? 'แก้ไขรายการที่ตรวจพบ' : 'บันทึกจุดที่ตรวจพบหน้างาน'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ถ่ายรูป พิมพ์หรือพูดอาการเสียเป็นภาษาไทย — มีระบบกันข้อมูลหาย 100% บันทึกทันที
          </p>
        </div>

        {/* Restored Draft Banner */}
        {draftRestoredNotice && !editingItem && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-900 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{draftRestoredNotice}</span>
            </div>
            <button
              type="button"
              onClick={handleClearDraft}
              className="px-2.5 py-1 text-[11px] font-bold bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg shrink-0 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ล้างร่างเริ่มใหม่</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. รูปภาพหน้างาน (Photo Evidence)
            </label>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 bg-slate-50 text-center hover:bg-slate-100/70 transition-colors">
              {isCompressingPhoto ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <p className="text-xs font-semibold text-slate-700">กำลังประมวลผลรูปภาพ...</p>
                </div>
              ) : imageUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden max-h-48 border border-slate-200 bg-black/5">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-44 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                      title="ลบรูป"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                      {fileReference || 'Captured Photo'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <label
                      htmlFor="mobile-camera-capture-input"
                      className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>ถ่ายใหม่ด้วยกล้อง</span>
                    </label>

                    <label
                      htmlFor="mobile-gallery-photo-input"
                      className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>เลือกจากอัลบั้ม</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>ลบรูป</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-2.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 max-w-sm mx-auto mb-2.5">
                    <label
                      htmlFor="mobile-camera-capture-input"
                      className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 bg-[#102a4e] hover:bg-blue-900 active:scale-95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs text-center"
                    >
                      <Camera className="w-4 h-4 text-sky-300 shrink-0" />
                      <span>ถ่ายรูปหน้างาน (กล้องสด)</span>
                    </label>

                    <label
                      htmlFor="mobile-gallery-photo-input"
                      className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 active:scale-95 text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-300 transition-all shadow-xs text-center"
                    >
                      <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>เลือกจากอัลบั้มในเครื่อง</span>
                    </label>
                  </div>

                  {/* Preset quick test photos */}
                  <div className="pt-2 border-t border-slate-200 text-left">
                    <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                      หรือเลือกรูปตัวอย่างทดสอบ:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_SAMPLE_PHOTOS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setImageUrl(p.url);
                            setFileReference(`IMG_${3600 + idx}.jpg`);
                          }}
                          className="text-[10px] bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 px-2 py-1 rounded text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ImagePlus className="w-3 h-3 text-blue-600" />
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <input
                id="mobile-camera-capture-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoInputChange}
                className="sr-only opacity-0 absolute w-px h-px pointer-events-none -z-10"
                tabIndex={-1}
              />
              <input
                id="mobile-gallery-photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoInputChange}
                className="sr-only opacity-0 absolute w-px h-px pointer-events-none -z-10"
                tabIndex={-1}
              />
            </div>
          </div>

          {/* Location / Zone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              2. ตำแหน่ง / จุดที่ตรวจพบ (Location Zone) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="เช่น โต๊ะทำงาน, ห้องนั่งเล่น, ตู้ไฟ MDB, ห้องนอนใหญ่"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-hidden bg-white"
            />
            {/* Quick zone chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {ZONE_QUICK_CHIPS.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZone(z.split(' / ')[0])}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                >
                  + {z.split(' / ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Thai Finding Details + Mic Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                3. อาการเสีย / สิ่งที่ตรวจพบ (ภาษาไทย) <span className="text-rose-500">*</span>
              </label>
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  <span>{isRecording ? 'กำลังฟังเสียง...' : 'กดไมค์เพื่อพูด'}</span>
                </button>
              )}
            </div>

            <textarea
              rows={2}
              required
              value={findingTh}
              onChange={(e) => setFindingTh(e.target.value)}
              placeholder="พิมพ์หรือพูด เช่น หลอดไฟ par38 เสีย 1 อัน, ประตูบานเลื่อนฝืด, ปลั๊ก pop up เสีย..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-hidden bg-white leading-relaxed"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5">
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Mr. Big พร้อมแปลและประเมินผลภาษาอังกฤษอัตโนมัติ</span>
              </p>
              <button
                type="button"
                onClick={handleInstantMrBigTranslate}
                disabled={isTranslatingLive || !findingTh.trim()}
                className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-lg border border-blue-200 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isTranslatingLive ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                    <span>Mr. Big กำลังประเมิน...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>⚡ ให้ Mr. Big แปล & ตรวจสอบทันที</span>
                  </>
                )}
              </button>
            </div>

            {/* Live preview of Mr. Big's translation if available */}
            {observationEn && (
              <div className="mt-2.5 p-2.5 bg-blue-50/70 rounded-xl border border-blue-200/80 text-xs">
                <div className="flex items-center justify-between font-semibold text-blue-900 mb-1">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    ผลแปลและประเมินโดย Mr. Big (English Inspection Finding):
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono font-normal">
                    Verified
                  </span>
                </div>
                <p className="text-slate-800 italic leading-relaxed text-[11px] bg-white p-2 rounded-lg border border-blue-100">
                  "{observationEn}"
                </p>
                {actionEn && (
                  <div className="mt-1.5 text-[11px] text-slate-600">
                    <strong className="text-slate-700">Recommended Action:</strong> {actionEn}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              4. หมวดหมู่งาน (Category)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    category === c
                      ? 'bg-[#102a4e] border-[#102a4e] text-white font-semibold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              5. สถานะอุปกรณ์ (Status)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {statuses.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setStatus(s.label)}
                  className={`p-2 rounded-xl text-left border transition-all text-xs flex flex-col justify-between cursor-pointer ${
                    status === s.label
                      ? `${s.color} ring-2 ring-blue-500 shadow-xs`
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between text-[11px]">
                    <span>{s.label}</span>
                    {status === s.label && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5">{s.th}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Collapsible Advanced Details (Kept neat and clean) */}
          <div className="border-t border-slate-200 pt-2">
            <button
              type="button"
              onClick={() => setShowAdvancedFields(!showAdvancedFields)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 py-1 transition-colors cursor-pointer"
            >
              {showAdvancedFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>ปรับแต่งภาษาอังกฤษ / ข้อมูลขั้นสูงเพิ่มเติม (ปกติ AI เติมให้อัตโนมัติ)</span>
            </button>

            {showAdvancedFields && (
              <div className="space-y-3 mt-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ชื่อหัวข้อภาษาอังกฤษ (Title)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="เช่น Work Desk Pop-Up Socket Malfunction"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    รายละเอียดภาษาอังกฤษ (English Observation)
                  </label>
                  <textarea
                    rows={2}
                    value={observationEn}
                    onChange={(e) => setObservationEn(e.target.value)}
                    placeholder="ปกติ AI จะแปลให้อัตโนมัติเมื่อกดบันทึก"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      คำแนะนำการแก้ไข (ไทย)
                    </label>
                    <input
                      type="text"
                      value={actionTh}
                      onChange={(e) => setActionTh(e.target.value)}
                      placeholder="เช่น ถอดเปลี่ยนชุดเต้ารับป๊อปอัปใหม่"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Recommended Action (EN)
                    </label>
                    <input
                      type="text"
                      value={actionEn}
                      onChange={(e) => setActionEn(e.target.value)}
                      placeholder="e.g. Replace pop-up socket unit"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex gap-3">
            <button
              type="button"
              disabled={isSavingWithAi}
              onClick={onClose}
              className="w-1/3 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSavingWithAi || !zone.trim()}
              className="w-2/3 py-2.5 px-4 rounded-xl bg-[#102a4e] hover:bg-blue-900 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingWithAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>กำลังบันทึกและให้ AI ประมวลผล...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>บันทึกรายการ (AI ทำงานอัตโนมัติ)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
