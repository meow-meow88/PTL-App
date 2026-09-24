import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Share2,
  Clock,
  Sparkles,
  Camera,
  Upload,
  User,
  Building2,
  MapPin,
  ExternalLink,
  Phone,
  MessageCircle,
  Wrench,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Info,
  Activity,
  Check,
  Copy,
  HelpCircle,
  CheckSquare,
  ArrowRight,
  DollarSign,
  Layers,
  Mic,
  MicOff,
  Trash2,
  Edit3,
  Image as ImageIcon,
  RotateCcw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  InspectionJob,
  Vendor,
  Invoice,
  Expense,
  ElectricalAssessmentData,
  EvidencePhoto,
  InspectionItem,
  FindingStatus,
} from '../../types';
import { useLanguage } from '../../i18n/translations';
import {
  generateMrBigElectricalAssessment,
  analyzeFindingLocally,
  translateZoneToEnglish,
} from '../../utils/mrBigLocalAnalyzer';
import { shareJobToTechnician } from '../../utils/technicianShare';

interface ElectricalWorkspaceViewProps {
  job: InspectionJob;
  vendors: Vendor[];
  invoices: Invoice[];
  expenses?: Expense[];
  onUpdateJob: (updater: (prev: InspectionJob) => InspectionJob) => void;
  onRecordPayment: (jobId: string, amount: number) => void;
  onAssignVendor: (vendor: Vendor) => void;
  onCompleteJob: () => void;
  onOpenReport: () => void;
  onOpenQuotation?: (jobId: string, action?: 'view' | 'edit' | 'send' | 'preview') => void;
  onOpenQuickEstimate: () => void;
  onAddExpense?: (jobId: string) => void;
  onOpenSwitchJob?: () => void;
  jobsCount?: number;
  currentJobIndex?: number;
}

export const ElectricalWorkspaceView: React.FC<ElectricalWorkspaceViewProps> = ({
  job,
  vendors,
  invoices,
  expenses = [],
  onUpdateJob,
  onRecordPayment,
  onAssignVendor,
  onCompleteJob,
  onOpenReport,
  onOpenQuotation,
  onOpenQuickEstimate,
  onAddExpense,
  onOpenSwitchJob,
  jobsCount = 1,
  currentJobIndex = 0,
}) => {
  const { lang, t } = useLanguage();
  const isTh = lang === 'th';

  // Initialize or fetch Electrical Assessment from job
  const [assessment, setAssessment] = useState<ElectricalAssessmentData>(() => {
    if (job.electricalAssessment) {
      return job.electricalAssessment;
    }
    return generateMrBigElectricalAssessment({
      rawInput: `${job.requestDescription || ''} ${job.notes || ''} ${job.siteNotes || ''}`,
      zone: job.villaName,
    });
  });

  // State for sharing feedback
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Reopening a job should always start in the field-friendly view. Technical
  // details remain available on demand, including after confirming the scope.
  const [fieldScreenMode, setFieldScreenMode] = useState<'simple' | 'full'>('simple');
  const [fieldNote, setFieldNote] = useState(assessment.observedFact || '');

  const [showExistingInfo, setShowExistingInfo] = useState(false);
  const [isAddFindingOpen, setIsAddFindingOpen] = useState(false);
  const [newFindingCategory, setNewFindingCategory] = useState<'finding' | 'observed' | 'test'>('finding');
  const [newFindingText, setNewFindingText] = useState('');
  const fieldPhotoInputRef = React.useRef<HTMLInputElement>(null);

  // V1-style Upgraded Field Finding States
  const [findingCategory, setFindingCategory] = useState<string>('ELECTRICAL & LIGHTING AUDIT');
  const [findingZone, setFindingZone] = useState<string>('');
  const [findingTh, setFindingTh] = useState<string>('');
  const [findingEn, setFindingEn] = useState<string>('');
  const [findingStatus, setFindingStatus] = useState<FindingStatus>('Power Tripped');
  const [findingActionTh, setFindingActionTh] = useState<string>('');
  const [findingActionEn, setFindingActionEn] = useState<string>('');
  const [findingPhotoUrl, setFindingPhotoUrl] = useState<string>('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [showCategoryChips, setShowCategoryChips] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const findingCameraInputRef = useRef<HTMLInputElement>(null);
  const findingGalleryInputRef = useRef<HTMLInputElement>(null);

  // Speech Recognition Hook
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.lang = 'th-TH';

      recognizer.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setFindingTh((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
          triggerSmartAnalysis(transcript.trim());
        }
        setIsListening(false);
      };

      recognizer.onerror = () => {
        setIsListening(false);
      };

      recognizer.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognizer;
    } catch {
      setSpeechSupported(false);
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      setShareFeedback(isTh ? 'เบราว์เซอร์ไม่รองรับการพิมพ์ด้วยเสียง' : 'Voice input not supported in this browser');
      setTimeout(() => setShareFeedback(null), 3000);
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const triggerSmartAnalysis = (textOverride?: string) => {
    const textToAnalyze = textOverride || findingTh;
    if (!textToAnalyze.trim()) {
      setShareFeedback(isTh ? 'กรุณาพิมพ์หรือพูดสิ่งที่พบก่อนให้ Molly วิเคราะห์' : 'Please provide Thai text before running analysis');
      setTimeout(() => setShareFeedback(null), 3000);
      return;
    }

    setIsAnalyzingAi(true);
    try {
      const analyzed = analyzeFindingLocally(
        textToAnalyze,
        findingZone || job.villaName || 'ตู้ไฟ MDB',
        findingCategory || 'ELECTRICAL & LIGHTING AUDIT'
      );

      if (analyzed) {
        if (!findingEn || textOverride) setFindingEn(analyzed.observationEn);
        if (!findingActionTh || textOverride) setFindingActionTh(analyzed.recommendedActionTh);
        if (!findingActionEn || textOverride) setFindingActionEn(analyzed.recommendedActionEn);
        if (analyzed.suggestedStatus) setFindingStatus(analyzed.suggestedStatus as FindingStatus);
      }

      // Auto detect location/zone if empty
      if (!findingZone.trim()) {
        const lower = textToAnalyze.toLowerCase();
        if (lower.includes('เครื่องทำน้ำอุ่น') || lower.includes('ห้องน้ำ')) {
          setFindingZone('ห้องน้ำ / เครื่องทำน้ำอุ่น');
        } else if (lower.includes('mdb') || lower.includes('ตู้ไฟ') || lower.includes('เบรกเกอร์') || lower.includes('คัตเอาท์')) {
          setFindingZone('ตู้ไฟ MDB / Main Breaker');
        } else if (lower.includes('เต้ารับ') || lower.includes('ปลั๊ก')) {
          setFindingZone('เต้ารับปลั๊กไฟ');
        } else if (lower.includes('สวิตช์') || lower.includes('หลอดไฟ') || lower.includes('โคม')) {
          setFindingZone('สวิตช์ไฟ / โคมไฟ');
        } else if (lower.includes('ทางเข้า') || lower.includes('สวน') || lower.includes('นอกบ้าน')) {
          setFindingZone('ไฟทางเข้า / สวนนอกบ้าน');
        }
      }

      setShareFeedback(isTh ? '✨ Molly วิเคราะห์และแปลภาษาอังกฤษให้เรียบร้อยแล้ว' : '✨ Molly analyzed & generated English observation');
      setTimeout(() => setShareFeedback(null), 3500);
    } catch (err) {
      console.warn('Analysis error:', err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const SMART_ELECTRICAL_PRESETS = [
    {
      title: '⚡️ RCBO ทริป (เครื่องทำน้ำอุ่น)',
      category: 'ELECTRICAL & LIGHTING AUDIT',
      zone: 'ห้องน้ำ / ตู้ไฟ MDB',
      findingTh: 'พบเบรกเกอร์ป้องกันไฟรั่ว/ลัดวงจร RCBO ทริปตัดวงจรเมื่อเปิดใช้งานเครื่องทำน้ำอุ่น',
      findingEn: 'RCBO breaker trips immediately when water heater is energized, indicating an earth leakage fault or internal element degradation.',
      status: 'Power Tripped' as FindingStatus,
      actionTh: 'ตรวจวัดความเป็นฉนวนสายไฟ (Megger Test) กราวด์ และตรวจเช็กเปลี่ยนเบรกเกอร์ RCBO แท้มาตรฐาน',
      actionEn: 'Perform Megger insulation test, verify earth ground loop, and replace RCBO breaker unit.',
    },
    {
      title: '🔌 เต้ารับไหม้ / ละลาย',
      category: 'ELECTRICAL & LIGHTING AUDIT',
      zone: 'เต้ารับปลั๊กไฟ ผนังห้อง',
      findingTh: 'เต้ารับไฟฟ้ามีรอยไหม้เกรียม ความร้อนสะสม ขั้วเสียบหลวม เสี่ยงต่อการเกิดประกายไฟ',
      findingEn: 'Wall electrical outlet shows severe heat damage and loose internal contact terminals.',
      status: 'Critical Swap' as FindingStatus,
      actionTh: 'ตัดไฟ ปลดสาย ตรวจเช็กปลายสายไหม้ และเปลี่ยนเต้ารับกราวด์คู่มาตรฐาน มอก. ใหม่',
      actionEn: 'De-energize circuit, trim damaged wiring, and install new safety ground duplex outlet.',
    },
    {
      title: '💡 สวิตช์ไฟเสีย / สปาร์ค',
      category: 'ELECTRICAL & LIGHTING AUDIT',
      zone: 'สวิตช์ไฟหน้างาน',
      findingTh: 'สวิตช์ไฟกดแล้วไม่ติด มีเสียงสปาร์คภายในบล็อกสวิตช์ สปริงกลไกชำรุด',
      findingEn: 'Lighting switch failing to latch with audible electrical contact arcing inside enclosure.',
      status: 'Requires Swap' as FindingStatus,
      actionTh: 'เปลี่ยนกลไกบล็อกสวิตช์ไฟใหม่ 1 ชุด และตรวจสอบขันแน่นขั้วต่อ',
      actionEn: 'Replace switch mechanism module and verify terminal torque.',
    },
    {
      title: '⚡️ เมน MDB คัตเอาท์ตัด',
      category: 'ELECTRICAL & LIGHTING AUDIT',
      zone: 'ตู้ไฟ MDB / Main Breaker',
      findingTh: 'เมนเบรกเกอร์ตู้ MDB ทริปดับทั้งวิลล่าเมื่อมีโหลดใช้งานพร้อมกัน โหลดไม่สมดุล',
      findingEn: 'Main MDB circuit breaker trips under combined peak villa load; phase current balance audit required.',
      status: 'Power Tripped' as FindingStatus,
      actionTh: 'วัดกระแสโหลดแต่ละเฟส (Phase Load Balancing) ขันแน่นบัสบาร์ และจัดสรรโหลดวงจรย่อยใหม่',
      actionEn: 'Measure individual phase load currents, torque busbar connections, and redistribute branch circuits.',
    },
    {
      title: '🚿 ไฟดูดอ่อนๆ / สายดินหลุด',
      category: 'ELECTRICAL & LIGHTING AUDIT',
      zone: 'ห้องน้ำ / เครื่องสุขภัณฑ์',
      findingTh: 'สัมผัสโครงโลหะ/ก๊อกน้ำแล้วรู้สึกไฟดูดอ่อนๆ (Floating Earth Voltage) สายดินหลักหลุดหรือความต้านทานสูง',
      findingEn: 'Mild electric tingling sensation on metal fixtures; grounding electrode disconnected or high earth loop impedance.',
      status: 'Power Tripped' as FindingStatus,
      actionTh: 'ตรวจวัดความต้านทานหลักดิน (< 5 โอห์ม) และต่อสายดิน Equipotential Bonding',
      actionEn: 'Inspect grounding electrode rod, verify resistance < 5 Ohms, and bond fixtures to earth ground.',
    },
    {
      title: '✅ ตรวจสอบระบบผ่านปกติ',
      category: 'ELECTRICAL & LIGHTING AUDIT',
      zone: 'ระบบไฟฟ้าและแสงสว่างโดยรวม',
      findingTh: 'ตรวจเช็กแรงดันไฟฟ้า 230V ปกติ การขันแน่นขั้วสาย และทดสอบการทำงานของอุปกรณ์ผ่านเกณฑ์ความปลอดภัย',
      findingEn: 'Complete electrical check completed: voltage 230V stable, terminals properly torqued, all safety circuits passed inspection.',
      status: 'Normal' as FindingStatus,
      actionTh: 'บันทึกประวัติการตรวจเช็กและกำหนดรอบตรวจบำรุงรักษาประจำไตรมาส',
      actionEn: 'Record inspection log and schedule quarterly preventive maintenance.',
    },
  ];

  const handleApplyPreset = (preset: typeof SMART_ELECTRICAL_PRESETS[0]) => {
    setFindingCategory(preset.category);
    setFindingZone(preset.zone);
    setFindingTh(preset.findingTh);
    setFindingEn(preset.findingEn);
    setFindingStatus(preset.status);
    setFindingActionTh(preset.actionTh);
    setFindingActionEn(preset.actionEn);
    setShareFeedback(isTh ? `✓ เลือกพรีเซ็ต: ${preset.title}` : `✓ Applied preset: ${preset.title}`);
    setTimeout(() => setShareFeedback(null), 2500);
  };

  const handleSaveCurrentFinding = () => {
    if (!findingTh.trim() && !findingEn.trim()) {
      setShareFeedback(isTh ? 'กรุณาระบุรายละเอียดสิ่งที่พบก่อนบันทึก' : 'Please provide observation details');
      setTimeout(() => setShareFeedback(null), 3000);
      return;
    }

    const now = new Date().toISOString();
    const finalZone = findingZone.trim() || 'พื้นที่หน้างาน';
    const finalCat = findingCategory.trim() || 'ELECTRICAL & LIGHTING AUDIT';

    onUpdateJob((prev) => {
      let updatedItems: InspectionItem[];
      if (editingItemId) {
        updatedItems = (prev.items || []).map((it) =>
          it.id === editingItemId
            ? {
                ...it,
                category: finalCat,
                locationZone: finalZone,
                observationTh: findingTh.trim(),
                observationEn: findingEn.trim() || translateZoneToEnglish(findingTh.trim()),
                status: findingStatus,
                recommendedActionTh: findingActionTh.trim(),
                recommendedActionEn: findingActionEn.trim(),
                imageUrl: findingPhotoUrl || it.imageUrl,
              }
            : it
        );
      } else {
        const newItem: InspectionItem = {
          id: `INSP-${Date.now()}`,
          category: finalCat,
          locationZone: finalZone,
          title: findingTh.trim().slice(0, 50),
          fileReference: `IMG_${Math.floor(1000 + Math.random() * 9000)}.jpg`,
          observationTh: findingTh.trim(),
          observationEn: findingEn.trim() || translateZoneToEnglish(findingTh.trim()),
          status: findingStatus,
          recommendedActionTh: findingActionTh.trim(),
          recommendedActionEn: findingActionEn.trim(),
          imageUrl: findingPhotoUrl || undefined,
          createdAt: now,
        };
        updatedItems = [...(prev.items || []), newItem];
      }

      const summaryList = updatedItems
        .map((it, idx) => `${idx + 1}. [${it.status}] ${it.locationZone}: ${it.observationTh || it.observationEn}`)
        .join('\n');

      return {
        ...prev,
        items: updatedItems,
        confirmedFindings: summaryList,
        observedFact: summaryList,
        electricalAssessment: prev.electricalAssessment
          ? {
              ...prev.electricalAssessment,
              confirmedFinding: summaryList,
              observedFact: summaryList,
              hasAssessmentStarted: true,
            }
          : undefined,
      };
    });

    // Reset form
    setEditingItemId(null);
    setFindingTh('');
    setFindingEn('');
    setFindingZone('');
    setFindingActionTh('');
    setFindingActionEn('');
    setFindingPhotoUrl('');
    setFindingStatus('Power Tripped');

    setShareFeedback(isTh ? '✓ บันทึกรายการตรวจพบเรียบร้อยแล้ว' : '✓ Finding saved successfully');
    setTimeout(() => setShareFeedback(null), 3500);
  };

  const handleCancelFindingForm = () => {
    setEditingItemId(null);
    setFindingTh('');
    setFindingEn('');
    setFindingZone('');
    setFindingActionTh('');
    setFindingActionEn('');
    setFindingPhotoUrl('');
    setFindingStatus('Power Tripped');
  };

  const handleEditFinding = (item: InspectionItem) => {
    setEditingItemId(item.id);
    setFindingCategory(item.category || 'ELECTRICAL & LIGHTING AUDIT');
    setFindingZone(item.locationZone || '');
    setFindingTh(item.observationTh || item.title || '');
    setFindingEn(item.observationEn || '');
    setFindingStatus(item.status || 'Power Tripped');
    setFindingActionTh(item.recommendedActionTh || '');
    setFindingActionEn(item.recommendedActionEn || '');
    setFindingPhotoUrl(item.imageUrl || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFinding = (itemId: string) => {
    onUpdateJob((prev) => {
      const updatedItems = (prev.items || []).filter((it) => it.id !== itemId);
      const summaryList = updatedItems
        .map((it, idx) => `${idx + 1}. [${it.status}] ${it.locationZone}: ${it.observationTh || it.observationEn}`)
        .join('\n');
      return {
        ...prev,
        items: updatedItems,
        confirmedFindings: summaryList,
        observedFact: summaryList,
        electricalAssessment: prev.electricalAssessment
          ? {
              ...prev.electricalAssessment,
              confirmedFinding: summaryList,
              observedFact: summaryList,
            }
          : undefined,
      };
    });
    setShareFeedback(isTh ? 'ลบรายการตรวจพบเรียบร้อยแล้ว' : 'Finding deleted');
    setTimeout(() => setShareFeedback(null), 3000);
  };

  const handlePhotoSelectForFinding = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFindingPhotoUrl(dataUrl);
      setIsUploadingPhoto(false);

      const newPhoto: EvidencePhoto = {
        id: `ev-${Date.now()}`,
        jobId: job.id,
        photoUrl: dataUrl,
        caption: findingTh ? `${findingZone || 'หน้างาน'}: ${findingTh.slice(0, 30)}` : 'รูปหน้างานตรวจเช็ก',
        capturedAt: new Date().toISOString(),
      };
      onUpdateJob((prev) => ({
        ...prev,
        evidencePhotos: [...(prev.evidencePhotos || []), newPhoto],
      }));
    };
    reader.onerror = () => {
      setIsUploadingPhoto(false);
      setShareFeedback(isTh ? 'อ่านรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' : 'Failed to read photo');
    };
    try {
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingPhoto(false);
    }
  };

  const hasSufficientFieldFactsForCases = Boolean(
    job.scopeConfirmed ||
    (
      Boolean(assessment.confirmedFinding && assessment.confirmedFinding.trim().length > 0) &&
      Boolean(assessment.testPerformed && assessment.testPerformed.trim().length > 0)
    )
  );

  const handleAddFindingSubmit = () => {
    if (!newFindingText.trim()) return;
    const text = newFindingText.trim();
    if (newFindingCategory === 'finding') {
      const updatedFinding = assessment.confirmedFinding
        ? `${assessment.confirmedFinding}\n• ${text}`
        : `• ${text}`;
      updateAssessment((prev) => ({
        ...prev,
        confirmedFinding: updatedFinding,
        hasAssessmentStarted: true,
      }));
      onUpdateJob((prev) => ({
        ...prev,
        confirmedFindings: updatedFinding,
      }));
    } else if (newFindingCategory === 'observed') {
      const updatedObserved = assessment.observedFact
        ? `${assessment.observedFact}\n• ${text}`
        : `• ${text}`;
      updateAssessment((prev) => ({
        ...prev,
        observedFact: updatedObserved,
        hasAssessmentStarted: true,
      }));
      onUpdateJob((prev) => ({
        ...prev,
        observedFact: updatedObserved,
      }));
    } else {
      const updatedTest = assessment.testPerformed
        ? `${assessment.testPerformed}\n• ${text}`
        : `• ${text}`;
      updateAssessment((prev) => ({
        ...prev,
        testPerformed: updatedTest,
        hasAssessmentStarted: true,
      }));
      onUpdateJob((prev) => ({
        ...prev,
        testPerformed: updatedTest,
      }));
    }
    setNewFindingText('');
    setIsAddFindingOpen(false);
    setShareFeedback(isTh ? '✓ บันทึกข้อเท็จจริงหน้างานเรียบร้อย' : '✓ Field finding recorded');
    setTimeout(() => setShareFeedback(null), 3000);
  };

  const handleSaveFieldNote = () => {
    const note = fieldNote.trim();
    if (!note) return;
    updateAssessment((prev) => ({...prev, observedFact: note, hasAssessmentStarted: true}));
    setShareFeedback(isTh ? 'บันทึกสิ่งที่พบแล้ว' : 'Field note saved');
  };

  // Sync assessment to job when changed
  const updateAssessment = (updater: (prev: ElectricalAssessmentData) => ElectricalAssessmentData) => {
    setAssessment((prev) => {
      const updated = updater(prev);
      onUpdateJob((currentJob) => ({
        ...currentJob,
        electricalAssessment: updated,
      }));
      return updated;
    });
  };

  // Ensure initial assessment is saved to job if absent
  useEffect(() => {
    if (!job.electricalAssessment) {
      onUpdateJob((prev) => ({
        ...prev,
        electricalAssessment: assessment,
      }));
    }
  }, []);

  const matchingInvoice = invoices.find((inv) => inv.jobId === job.id);

  // Share to Technician handler
  const handleShareToTechnician = async () => {
    setIsSharing(true);
    const result = await shareJobToTechnician(job, undefined, undefined, isTh ? 'th' : 'en');
    setIsSharing(false);

    if (result.success) {
      const nowIso = new Date().toISOString();
      onUpdateJob((prev) => ({
        ...prev,
        technicianSharedAt: nowIso,
      }));
      setShareFeedback(
        result.method === 'share_api'
          ? isTh ? 'เปิดหน้าต่างแชร์เรียบร้อย' : 'Share sheet opened'
          : isTh ? 'คัดลอกรายละเอียดงานลงคลิปบอร์ดแล้ว พร้อมส่งต่อ' : 'Copied job details to clipboard!'
      );
    } else {
      setShareFeedback(result.error || (isTh ? 'ไม่สามารถแชร์ได้' : 'Sharing failed'));
    }

    setTimeout(() => setShareFeedback(null), 4000);
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newPhoto: EvidencePhoto = {
        id: `photo_${Date.now()}`,
        jobId: job.id,
        photoUrl: dataUrl,
        capturedAt: new Date().toISOString(),
        caption: `Electrical ${assessment.component || 'Evidence'}`,
      };

      onUpdateJob((prev) => ({
        ...prev,
        evidencePhotos: [...(prev.evidencePhotos || []), newPhoto],
      }));
      setIsUploadingPhoto(false);
    };
    reader.onerror = () => {
      setIsUploadingPhoto(false);
      setShareFeedback(isTh ? 'อ่านรูปไม่สำเร็จ กรุณาลองอีกครั้ง' : 'Could not read the photo. Please try again.');
    };
    try { reader.readAsDataURL(file); } catch {
      setIsUploadingPhoto(false);
      setShareFeedback(isTh ? 'อ่านรูปไม่สำเร็จ กรุณาลองอีกครั้ง' : 'Could not read the photo. Please try again.');
    }
  };

  const hasInspectionQuotation = Boolean(
    job.quotation &&
    ((job.quotation.serviceItems && job.quotation.serviceItems.length > 0) ||
     (job.quotation.hardwareItems && job.quotation.hardwareItems.length > 0))
  );
  const isInspectionApproved =
    job.status === 'Approved' ||
    job.status === 'Scheduled' ||
    job.status === 'In Progress' ||
    job.status === 'Completed' ||
    Boolean(job.customerApprovedAt);
  const isScopeConfirmed = Boolean(job.scopeConfirmed);

  const handleConfirmScope = () => {
    if (!assessment.confirmedFinding?.trim() || !assessment.testPerformed?.trim()) {
      setShareFeedback(isTh
        ? 'กรอกข้อเท็จจริงที่ยืนยันได้และผลการทดสอบจริงก่อนยืนยันขอบเขตงาน'
        : 'Record a confirmed finding and an actual test before confirming scope');
      return;
    }
    const nowIso = new Date().toISOString();
    updateAssessment((prev) => ({
      ...prev,
      hasAssessmentStarted: true,
    }));
    onUpdateJob((prev) => ({
      ...prev,
      scopeConfirmed: true,
      scopeConfirmedAt: nowIso,
      observedFact: assessment.observedFact,
      confirmedFindings: assessment.confirmedFinding,
      testPerformed: assessment.testPerformed,
      testResultText: assessment.testResultText,
      recommendedNextTest: assessment.recommendedNextTest,
      unknownItems: assessment.unknownItems,
    }));
    setShareFeedback(isTh ? '✓ ยืนยันขอบเขตงานเทคนิคแล้ว พร้อมส่งต่อให้ Molly ทำราคาซ่อม' : '✓ Technical scope confirmed! Ready for Molly repair pricing.');
    setTimeout(() => setShareFeedback(null), 3500);
  };

  const handleReopenScope = () => {
    onUpdateJob((prev) => ({
      ...prev,
      scopeConfirmed: false,
      scopeConfirmedAt: undefined,
    }));
  };

  if (fieldScreenMode === 'simple') {
    const CATEGORY_OPTIONS = [
      'ELECTRICAL & LIGHTING AUDIT',
      'MDB & CIRCUIT PROTECTION',
      'AIR CONDITIONING & HVAC',
      'SMART HOME SYSTEM DIAGNOSTICS',
      'PLUMBING & SANITARY',
    ];

    const ZONE_OPTIONS = [
      'ตู้ไฟ MDB / Main Breaker',
      'ห้องน้ำ / เครื่องทำน้ำอุ่น',
      'สวิตช์ไฟ / โคมไฟ',
      'เต้ารับปลั๊กไฟ',
      'ไฟทางเข้า / สวนนอกบ้าน',
      'ห้องนอน 1 / Master',
      'ห้องนั่งเล่น / Living Room',
    ];

    const STATUS_GRID_OPTIONS: { label: FindingStatus; th: string; activeClasses: string; inactiveClasses: string }[] = [
      {
        label: 'Power Tripped',
        th: 'ไฟตัด / ลัดวงจร',
        activeClasses: 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-400 font-bold',
        inactiveClasses: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      },
      {
        label: 'Not Working',
        th: 'ไม่ทำงาน',
        activeClasses: 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-400 font-bold',
        inactiveClasses: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      },
      {
        label: 'Requires Swap',
        th: 'ต้องเปลี่ยนอะไหล่',
        activeClasses: 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-400 font-bold',
        inactiveClasses: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      },
      {
        label: 'Disconnected',
        th: 'หลุดจากระบบ',
        activeClasses: 'border-slate-500 bg-slate-100 text-slate-800 ring-2 ring-slate-400 font-bold',
        inactiveClasses: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      },
      {
        label: 'Critical Swap',
        th: 'ต้องเปลี่ยนด่วน (วิกฤต)',
        activeClasses: 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-500 font-bold',
        inactiveClasses: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      },
      {
        label: 'Normal',
        th: 'ปกติ / ตรวจแล้วผ่าน',
        activeClasses: 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400 font-bold',
        inactiveClasses: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      },
    ];

    const currentItems = job.items || [];

    return (
      <div className="max-w-3xl mx-auto pb-28 space-y-5">
        {/* ========================================================================= */}
        {/* 1. TOP HEADER & CUSTOMER REPORT CARD */}
        {/* ========================================================================= */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800 border border-blue-100 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-blue-600" />
                  {job.jobPurpose === 'REPLACEMENT'
                    ? (isTh ? 'เปลี่ยนอุปกรณ์' : 'Replacement')
                    : job.jobPurpose === 'INSTALLATION'
                      ? (isTh ? 'ติดตั้งระบบไฟฟ้า' : 'Installation')
                      : (isTh ? 'ตรวจเช็กไฟฟ้า' : 'Electrical Inspection')}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium border ${
                  job.scopeConfirmed
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {job.scopeConfirmed
                    ? (isTh ? '✓ บันทึกผลตรวจแล้ว' : '✓ Inspection saved')
                    : (isTh ? '⚡️ กำลังตรวจหน้างาน (v1 Pro)' : '⚡️ Inspecting on site')}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-950 flex items-center gap-2">
                <span>{job.villaName || job.propertyLocation}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{job.customerName}</span>
                {job.scheduledTime ? ` · ${job.scheduledTime}` : ''}
                {job.propertyLocation && job.propertyLocation !== job.villaName ? ` · ${job.propertyLocation}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setFieldScreenMode('full')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title={isTh ? 'สลับไปดูตาราง Case A / Case B เชิงลึก' : 'View full technical diagnostic'}
              >
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                <span>{isTh ? 'โหมดเทคนิคเชิงลึก' : 'Technical view'}</span>
              </button>
            </div>
          </div>

          {/* Customer request note */}
          <div className="rounded-xl bg-amber-50/80 px-4 py-3 border border-amber-200/70">
            <p className="text-xs font-bold text-amber-900 mb-0.5 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
              <span>{isTh ? 'ลูกค้าแจ้งอาการ / ปัญหา' : 'Customer reported issue'}</span>
            </p>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {job.requestDescription || job.notes || (isTh ? 'ตรวจเช็กระบบไฟฟ้าและแสงสว่างทั่วไป' : 'General electrical audit')}
            </p>
          </div>
        </section>

        {/* Feedback Alert banner */}
        {shareFeedback && (
          <div role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm font-semibold text-emerald-900 flex items-center gap-2 shadow-xs transition-all">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{shareFeedback}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. THE V1-STYLE UPGRADED INSPECTION FINDING FORM (Exact Match to v1 flow) */}
        {/* ========================================================================= */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {editingItemId ? <Edit3 className="h-4 w-4" /> : <Plus className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {editingItemId
                    ? (isTh ? 'แก้ไขรายการที่ตรวจพบ' : 'Edit Finding')
                    : (isTh ? 'เพิ่มรายการที่ตรวจพบ' : 'Add Finding')}
                </h2>
                <p className="text-xs text-slate-500">
                  {isTh ? 'บันทึกอาการหน้างาน ถ่ายรูป และให้ Molly ช่วยสรุปผล' : 'Record observation with photo & AI assistance'}
                </p>
              </div>
            </div>

            {editingItemId && (
              <button
                type="button"
                onClick={handleCancelFindingForm}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-100"
              >
                {isTh ? 'ยกเลิกการแก้ไข' : 'Cancel edit'}
              </button>
            )}
          </div>

          {/* 1. ถ่ายรูป / เลือกรูป */}
          <div className="space-y-2">
            <div
              onClick={() => findingCameraInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-1.5"
            >
              {findingPhotoUrl ? (
                <div className="relative group w-full flex flex-col items-center">
                  <img
                    src={findingPhotoUrl}
                    alt="Finding evidence"
                    className="h-36 w-auto max-w-full rounded-lg object-contain border border-slate-200 shadow-xs"
                  />
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <span className="text-blue-600 hover:underline">แตะเพื่อเปลี่ยนรูป</span>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFindingPhotoUrl('');
                      }}
                      className="text-rose-600 hover:underline"
                    >
                      ลบรูป
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs">
                    <Camera className="h-5 w-5 text-slate-700" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    {isUploadingPhoto
                      ? (isTh ? 'กำลังอัปโหลดรูป...' : 'Uploading photo...')
                      : (isTh ? 'ถ่ายรูป / เลือกรูป' : 'Take photo / Upload')}
                  </span>
                  <span className="text-xs text-slate-500">
                    {isTh ? 'แตะเปิดกล้องถ่าย หรือเลือกจากคลังภาพ' : 'Tap to capture or choose from gallery'}
                  </span>
                </>
              )}
            </div>

            {/* Hidden file inputs */}
            <input
              ref={findingCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelectForFinding}
              className="hidden"
            />
            <input
              ref={findingGalleryInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelectForFinding}
              className="hidden"
            />

            {!findingPhotoUrl && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => findingGalleryInputRef.current?.click()}
                  className="text-xs font-semibold text-slate-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Upload className="h-3 w-3" />
                  <span>{isTh ? 'เลือกจากคลังรูปภาพ' : 'Choose from photo library'}</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. หมวดหมู่ */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {isTh ? 'หมวดหมู่' : 'Category'}
            </label>
            <input
              type="text"
              value={findingCategory}
              onChange={(e) => setFindingCategory(e.target.value)}
              placeholder="เช่น ELECTRICAL & LIGHTING AUDIT"
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
            {/* Category Quick Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFindingCategory(cat)}
                  className={`text-2xs px-2.5 py-1 rounded-full border transition-all ${
                    findingCategory === cat
                      ? 'bg-blue-50 text-blue-800 border-blue-300 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3. ตำแหน่ง / จุดที่พบ */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {isTh ? 'ตำแหน่ง / จุดที่พบ' : 'Location / Zone'}
            </label>
            <input
              type="text"
              value={findingZone}
              onChange={(e) => setFindingZone(e.target.value)}
              placeholder={isTh ? 'เช่น ห้องนอน 4, ทางขึ้นชั้น 2, ตู้ MDB' : 'e.g. Master Bedroom, MDB Panel'}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
            {/* Zone Quick Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ZONE_OPTIONS.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setFindingZone(z)}
                  className={`text-2xs px-2.5 py-1 rounded-full border transition-all ${
                    findingZone === z
                      ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          {/* 4. รายละเอียดสิ่งที่พบ (พูดหรือพิมพ์เป็นภาษาไทย) */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {isTh ? 'รายละเอียดสิ่งที่พบ (พูดหรือพิมพ์เป็นภาษาไทย)' : 'Observation (Thai Voice or Text)'}
              </label>

              {/* Working Mic Button matching v1 styling */}
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
                title={isTh ? 'แตะไมค์แล้วพูดอธิบายเป็นภาษาไทย' : 'Speak to record'}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-3.5 w-3.5" />
                    <span>กำลังฟังเสียง... แตะเพื่อหยุด</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5 text-blue-600" />
                    <span>กดไมค์แล้วพูดอธิบาย หรือพิมพ์ด้านล่าง</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={3}
              value={findingTh}
              onChange={(e) => setFindingTh(e.target.value)}
              placeholder={isTh
                ? 'อธิบายสิ่งที่เสียหรือพบปัญหา... เช่น เบรกเกอร์ RCBO เครื่องทำน้ำอุ่นทริปตัดวงจร'
                : 'Describe what is faulty or broken...'}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 resize-y"
            />

            {/* ⚡️ Smart 1-Tap Electrical Presets (Upgraded from v1 for extreme speed) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  <span>{isTh ? 'ปุ่มลัดอาการไฟฟ้าหน้างาน (1-Tap กดยิงข้อมูลทันที):' : 'Quick Electrical Presets:'}</span>
                </span>
                {findingTh && (
                  <button
                    type="button"
                    onClick={() => triggerSmartAnalysis()}
                    disabled={isAnalyzingAi}
                    className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-md border border-purple-200 transition-colors"
                  >
                    {isAnalyzingAi ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-purple-600" />
                        <span>กำลังวิเคราะห์...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 text-purple-600" />
                        <span>✨ ให้ Molly ช่วยแปล & สรุปผล</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {SMART_ELECTRICAL_PRESETS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-900 text-slate-700 font-medium transition-all text-left flex items-center gap-1 shadow-2xs"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. รายละเอียด (English) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {isTh
                  ? 'รายละเอียด (English) — ไม่บังคับ ใส่ถ้าต้องการเอกสาร EN/TH ครบ'
                  : 'Observation (English) — Optional'}
              </label>
              {!findingEn && findingTh && (
                <button
                  type="button"
                  onClick={() => triggerSmartAnalysis()}
                  className="text-2xs font-semibold text-blue-700 hover:underline"
                >
                  {isTh ? 'คลิกให้แปลอัตโนมัติ' : 'Auto-translate'}
                </button>
              )}
            </div>
            <input
              type="text"
              value={findingEn}
              onChange={(e) => setFindingEn(e.target.value)}
              placeholder="e.g. Toilet water heater RCBO breaker trips upon activation"
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* 6. สถานะ (The 6 Status Buttons matching IMG_4012.png) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {isTh ? 'สถานะ' : 'Status'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STATUS_GRID_OPTIONS.map((opt) => {
                const isSelected = findingStatus === opt.label;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setFindingStatus(opt.label)}
                    className={`rounded-xl border p-2.5 text-left transition-all relative ${
                      isSelected ? opt.activeClasses : opt.inactiveClasses
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-bold leading-tight">{opt.label}</p>
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </div>
                    <p className="text-2xs mt-0.5 opacity-80">{opt.th}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. แนะนำการแก้ไข (ไทย, ถ้ามี) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {isTh ? 'แนะนำการแก้ไข (ไทย, ถ้ามี)' : 'Recommended Action (Thai)'}
            </label>
            <input
              type="text"
              value={findingActionTh}
              onChange={(e) => setFindingActionTh(e.target.value)}
              placeholder="เช่น ตรวจวัด Megger Test และเปลี่ยนเบรกเกอร์ RCBO แท้ มอก."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* 8. แนะนำการแก้ไข (English) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {isTh ? 'แนะนำการแก้ไข (English) — ไม่บังคับ' : 'Recommended Action (English)'}
            </label>
            <input
              type="text"
              value={findingActionEn}
              onChange={(e) => setFindingActionEn(e.target.value)}
              placeholder="e.g. Conduct insulation test and replace RCBO breaker unit"
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Action Buttons matching IMG_4012.png */}
          <div className="flex flex-row items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCancelFindingForm}
              className="flex-1 rounded-xl border border-slate-300 bg-white py-3 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors text-center"
            >
              {isTh ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSaveCurrentFinding}
              className="flex-1 rounded-xl bg-[#102a4e] hover:bg-[#0b1c34] text-white py-3 px-4 text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              <span>{editingItemId ? (isTh ? 'อัปเดตรายการ' : 'Update Finding') : (isTh ? 'บันทึกรายการ' : 'Save Finding')}</span>
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. RECORDED FINDINGS LIST (รายการที่ตรวจพบแล้ว) */}
        {/* ========================================================================= */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                {currentItems.length}
              </span>
              <h3 className="text-base font-bold text-slate-950">
                {isTh ? 'รายการที่ตรวจพบแล้วในงานนี้' : 'Recorded Findings'}
              </h3>
            </div>
            {currentItems.length > 0 && (
              <span className="text-xs text-slate-500 font-medium">
                {isTh ? `ทั้งหมด ${currentItems.length} จุด` : `${currentItems.length} items`}
              </span>
            )}
          </div>

          {currentItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center text-slate-500 space-y-2">
              <Zap className="h-7 w-7 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                {isTh ? 'ยังไม่มีรายการตรวจพบที่บันทึก' : 'No findings recorded yet'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isTh
                  ? 'คุณสามารถใช้ปุ่มลัด 1-Tap ด้านบน หรือกดไมค์พูดอธิบาย แล้วกด "บันทึกรายการ" ได้เลย'
                  : 'Use the quick presets above or speak into the microphone to record findings.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentItems.map((item, idx) => {
                const statusMeta = STATUS_GRID_OPTIONS.find((s) => s.label === item.status);
                return (
                  <div
                    key={item.id || idx}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                          item.status === 'Power Tripped' || item.status === 'Critical Swap'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : item.status === 'Normal'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {item.status} {statusMeta ? `· ${statusMeta.th}` : ''}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.locationZone || 'หน้างาน'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditFinding(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={isTh ? 'แก้ไขรายการนี้' : 'Edit'}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFinding(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title={isTh ? 'ลบรายการนี้' : 'Delete'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title || 'Finding photo'}
                          className="h-20 w-20 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      )}
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-bold text-slate-900 leading-snug">
                          {item.observationTh || item.title}
                        </p>
                        {item.observationEn && item.observationEn !== item.observationTh && (
                          <p className="text-xs text-slate-500 leading-snug italic">
                            {item.observationEn}
                          </p>
                        )}
                        {(item.recommendedActionTh || item.recommendedActionEn) && (
                          <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-start gap-1.5 text-xs text-slate-700">
                            <Wrench className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-slate-900 font-semibold">{isTh ? 'แนวทางแก้ไข: ' : 'Action: '}</strong>
                              {item.recommendedActionTh || item.recommendedActionEn}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 4. SMART NEXT STEPS & MOLLY QUOTATION BRIDGE */}
        {/* ========================================================================= */}
        <section className="rounded-2xl border border-blue-200 bg-linear-to-br from-blue-50/70 via-indigo-50/50 to-white p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-blue-950">
                {isTh ? 'ขั้นตอนถัดไปหลังตรวจหน้างาน' : 'Next Steps'}
              </h3>
            </div>
            {currentItems.length > 0 && (
              <span className="text-xs font-bold text-blue-800 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                {currentItems.length} รายการพร้อมทำราคา
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (onOpenQuotation) {
                  onOpenQuotation(job.id, 'edit');
                } else {
                  onOpenQuickEstimate();
                }
              }}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white p-3 text-left font-bold text-sm shadow-xs transition-all flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <span className="block flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>{isTh ? 'ให้ Molly ทำใบเสนอราคาซ่อม' : 'Generate Quotation'}</span>
                </span>
                <span className="block text-2xs text-blue-100 font-normal">
                  {isTh ? 'คำนวณค่าอะไหล่และค่าแรงอัตโนมัติ' : 'Auto-calculate parts & labor'}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onOpenReport}
              className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 p-3 text-left font-bold text-sm shadow-xs transition-all flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <span className="block flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-600" />
                  <span>{isTh ? 'ดูรายงานผลการตรวจหน้างาน' : 'View Inspection Report'}</span>
                </span>
                <span className="block text-2xs text-slate-500 font-normal">
                  {isTh ? 'พิมพ์หรือส่งสรุปรายงานให้ลูกค้า' : 'Export or share with customer'}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setFieldScreenMode('full')}
              className="text-xs font-semibold text-slate-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>{isTh ? 'สลับไปดูตารางวิเคราะห์เทคนิคเชิงลึก (Case A / Case B)' : 'Switch to detailed technical analysis'}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. PRIMARY ELECTRICAL WORKSPACE HEADER & NEXT ACTION (Visual Calm) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0 border border-amber-200">
            <Zap className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
              <span>{isTh ? 'พื้นที่ทำงานช่างไฟฟ้า PTL' : 'PTL Electrical Workspace'}</span>
              {job.scopeConfirmed && (
                <>
                  <span>•</span>
                  <span className="text-slate-600">{assessment.activeCase || 'Case A'}</span>
                </>
              )}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
              {job.scopeConfirmed
                ? assessment.activeCase === 'Case B'
                  ? isTh ? 'ดำเนินการตรวจสอบวงจรเพิ่มเติม (Case B)' : 'Conduct In-Depth Circuit Investigation (Case B)'
                  : isTh ? 'เปลี่ยนอะไหล่และทดสอบการทำงาน (Case A)' : 'Replace Component & Test Operation (Case A)'
                : isTh ? 'การตรวจสอบและวิเคราะห์ข้อเท็จจริงหน้างาน' : 'Field Inspection & Fact Preservation'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setFieldScreenMode(fieldScreenMode === 'simple' ? 'full' : 'simple')}
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>{fieldScreenMode === 'simple' ? (isTh ? 'มุมมองเต็ม' : 'Full View') : (isTh ? 'หน้าตรวจย่อ' : 'Simple View')}</span>
          </button>

          <button
            type="button"
            onClick={handleShareToTechnician}
            disabled={isSharing}
            className="text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-600" />
            <span>{isTh ? 'แชร์ให้ช่าง' : 'Share to Technician'}</span>
          </button>

          {job.status !== 'Completed' ? (
            (job.scopeConfirmed || (assessment.confirmedFinding && assessment.confirmedFinding.trim().length > 0)) && (
              <button
                type="button"
                onClick={onCompleteJob}
                className="text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isTh ? 'เสร็จสิ้นงาน' : 'Complete Job'}</span>
              </button>
            )
          ) : (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              ✓ {isTh ? 'งานเสร็จแล้ว' : 'Job Completed'}
            </span>
          )}
        </div>
      </div>

      {/* Share to Technician Status Banner */}
      {(job.technicianSharedAt || shareFeedback) && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {shareFeedback
                ? shareFeedback
                : isTh
                ? `แชร์รายละเอียดให้ช่างแล้ว เมื่อ ${new Date(job.technicianSharedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : `Shared with technician at ${new Date(job.technicianSharedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleShareToTechnician}
            className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer text-[11px]"
          >
            {isTh ? 'แชร์ซ้ำ' : 'Share again'}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1.1 TWO-STAGE TECHNICAL WORKFLOW & REPAIR SCOPE LIFECYCLE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">
              {isTh ? 'ลำดับขั้นตอนงานบริการทางเทคนิค PTL' : 'PTL Technical Service Lifecycle'}
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              {isTh ? 'แยก "ค่าตรวจหน้างาน" กับ "ราคาซ่อมจริง" ตามข้อเท็จจริง' : 'Two-Stage Protocol: Inspection Fee vs. Fact-Based Repair Scope'}
            </h2>
          </div>
          <div className="text-xs text-slate-500">
            {isScopeConfirmed ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isTh ? 'สรุปขอบเขตงานซ่อมแล้ว' : 'Repair Scope Confirmed'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{isTh ? 'รอตรวจหน้างาน & ยืนยันข้อเท็จจริง' : 'Diagnostic in Progress'}</span>
              </span>
            )}
          </div>
        </div>

        {/* 3 Step Indicator */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 text-xs">
          {/* Step 1: Inspection Quote */}
          <div className={`p-3 rounded-xl border transition-all ${
            isInspectionApproved
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
              : hasInspectionQuotation
              ? 'bg-amber-50/60 border-amber-200 text-amber-950'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-black">1</span>
                <span>{isTh ? 'ใบเสนอราคาค่าตรวจ' : '1. Inspection Quote'}</span>
              </span>
              {isInspectionApproved ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-300">✓ อนุมัติแล้ว</span>
              ) : hasInspectionQuotation ? (
                <span className="text-[10px] font-bold text-amber-700 bg-white px-2 py-0.5 rounded-full border border-amber-300">รออนุมัติ</span>
              ) : (
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">ยังไม่ออก</span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              {isTh
                ? 'ค่าเดินทางและวิเคราะห์ระบบด่วนหน้างาน (ไม่รวมอะไหล่)'
                : 'Call-out visit & diagnostic fee (parts quoted separately)'}
            </p>
            {onOpenQuotation && (
              <button
                type="button"
                onClick={() => onOpenQuotation(job.id)}
                className="mt-2 text-[11px] font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1 cursor-pointer"
              >
                <span>{isTh ? 'เปิดใบเสนอราคาค่าตรวจ' : 'View Inspection Quote'}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Step 2: Diagnostic & Facts by Mr. Big */}
          <div className={`p-3 rounded-xl border transition-all ${
            isScopeConfirmed
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
              : 'bg-blue-50/60 border-blue-200 text-blue-950'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-black">2</span>
                <span>{isTh ? 'ตรวจเช็กหน้างาน (Mr. Big)' : '2. Field Diagnostic'}</span>
              </span>
              {isScopeConfirmed ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-300">✓ สรุปผลแล้ว</span>
              ) : (
                <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-300">กำลังตรวจ</span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              {isTh
                ? 'ช่างทดสอบหน้างาน แยกสิ่งที่เห็นจริง vs สิ่งที่ยืนยันได้'
                : 'On-site multimeter testing, separating observed facts from unconfirmed items.'}
            </p>
            {!isScopeConfirmed ? (
              <button
                type="button"
                onClick={handleConfirmScope}
                className="mt-2 text-[11px] font-extrabold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>{isTh ? 'กดยืนยันขอบเขตงานเทคนิค' : 'Confirm Technical Scope'}</span>
              </button>
            ) : (
              <div className="mt-2 text-[10px] text-emerald-700 font-bold flex items-center justify-between">
                <span>{job.scopeConfirmedAt ? `ยืนยันเมื่อ ${new Date(job.scopeConfirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'ยืนยันแล้ว'}</span>
                <button
                  type="button"
                  onClick={handleReopenScope}
                  className="text-slate-500 hover:text-slate-800 underline text-[10px] font-normal cursor-pointer"
                >
                  {isTh ? 'แก้ไขผลตรวจ' : 'Edit facts'}
                </button>
              </div>
            )}
          </div>

          {/* Step 3: Repair Quote by Molly */}
          <div className={`p-3 rounded-xl border transition-all ${
            isScopeConfirmed
              ? 'bg-amber-50/70 border-amber-300 text-amber-950 ring-1 ring-amber-400/30'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] flex items-center justify-center font-black">3</span>
                <span>{isTh ? 'ใบเสนอราคาซ่อม (Molly)' : '3. Repair Quote'}</span>
              </span>
              {isScopeConfirmed ? (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                  ⚡ พร้อมเสนอราคา
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  รอขั้นตอน 2
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              {isTh
                ? 'Molly คำนวณค่าอะไหล่ + ค่าแรงซ่อมมาตรฐานตาม Case A / B'
                : 'Molly prices replacement parts & labor based on confirmed scope.'}
            </p>
            {isScopeConfirmed && (
              <button
                type="button"
                onClick={onOpenQuickEstimate}
                className="mt-2 w-full text-[11px] font-black text-slate-950 bg-amber-400 hover:bg-amber-300 px-2.5 py-1.5 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                <span>{isTh ? 'เปิด Molly คำนวณราคาซ่อม' : 'Launch Molly Repair Pricing'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CLIENT & SITE IDENTITY */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-amber-600" />
              <span className="font-extrabold text-slate-900 text-base">{job.customerName}</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                ELECTRICAL
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-800">{job.villaName}</span>
              <span>•</span>
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{job.propertyLocation}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {job.customerPhone && (
              <a
                href={`tel:${job.customerPhone}`}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                title="Call"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
              </a>
            )}
            {job.propertyLocation && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${job.villaName}, ${job.propertyLocation}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1"
              >
                <span>Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {onOpenSwitchJob && (
              <button
                onClick={onOpenSwitchJob}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-xl"
              >
                {isTh ? `สลับงาน (${currentJobIndex + 1}/${jobsCount})` : `Switch (${currentJobIndex + 1}/${jobsCount})`}
              </button>
            )}
          </div>
        </div>

        {/* Confirmed Fact Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'จุดที่พบปัญหา' : 'Inspection Zone'}
            </span>
            <span className="font-bold text-slate-900">{assessment.area}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'อุปกรณ์ / ชิ้นส่วน' : 'Component'}
            </span>
            <span className="font-bold text-slate-900">{assessment.component}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'จำนวน' : 'Quantity'}
            </span>
            <span className="font-bold text-slate-900">{assessment.quantity}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {isTh ? 'อาการที่พบ' : 'Condition'}
            </span>
            <span className="font-bold text-rose-700">{assessment.condition}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MR. BIG TECHNICAL BRAIN & CUSTOMER-FACING REPORT */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
              MB
            </span>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {isTh ? 'Mr. Big — ข้อเท็จจริงและรายงานสำหรับลูกค้า' : 'Mr. Big — Fact Preservation & Field Report'}
              </h3>
              <p className="text-[10px] text-slate-500">
                {isTh ? 'แยกข้อเท็จจริงจริง ไม่บิดเบือนข้อมูล ภาษาเข้าใจง่ายสำหรับลูกค้า' : 'Preserves field facts, no technical jargon for client'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            {isTh ? 'วิเคราะห์เชิงเทคนิค' : 'Technical Brain'}
          </span>
        </div>

        {/* Bilingual Customer Report */}
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              {isTh ? 'ภาษาไทยสำหรับลูกค้า:' : 'Thai Customer Report:'}
            </span>
            <p className="font-bold text-slate-900">{assessment.customerReportTh}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              {isTh ? 'ภาษาอังกฤษสำหรับลูกค้า:' : 'English Customer Report:'}
            </span>
            <p className="font-bold text-slate-900">{assessment.customerReportEn}</p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FACT PRESERVATION LOG — SEPARATION OF CONFIRMED FACTS VS UNKNOWN/SUSPICION */}
        {/* ========================================================================= */}
        <div className="mt-4 pt-4 border-t border-amber-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>{isTh ? 'บันทึกข้อเท็จจริงหน้างาน (Fact Preservation Log)' : 'Fact Preservation Field Log'}</span>
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              {isTh ? 'แยกสิ่งที่พบจริง vs สิ่งที่ยืนยันได้' : 'Separating facts from assumptions'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* 1. Customer Reported Issue */}
            <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/80">
              <label className="text-[10px] uppercase font-black text-amber-900 block mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-amber-700" />
                <span>{isTh ? 'สิ่งที่ลูกค้าแจ้ง (Customer Reported Issue):' : 'Customer Reported Issue:'}</span>
              </label>
              <textarea
                rows={2}
                value={assessment.customerReportedIssue || ''}
                onChange={(e) => updateAssessment((prev) => ({ ...prev, customerReportedIssue: e.target.value }))}
                placeholder={isTh ? 'เช่น ไฟส่องสว่างไม่ติด 1 ดวง / มีเสียงหึ่งๆ ที่ตู้ไฟ' : 'e.g. 1 light fixture not turning on'}
                className="w-full text-xs font-medium text-slate-900 bg-white p-2 rounded-lg border border-amber-200/90 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
              />
            </div>

            {/* 2. Observed Field Fact */}
            <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200/80">
              <label className="text-[10px] uppercase font-black text-blue-900 block mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-700" />
                <span>{isTh ? 'สิ่งที่พบเห็นจริงหน้างาน (Observed Fact):' : 'Observed Fact:'}</span>
              </label>
              <textarea
                rows={2}
                value={assessment.observedFact || ''}
                onChange={(e) => updateAssessment((prev) => ({ ...prev, observedFact: e.target.value }))}
                placeholder={isTh ? 'เช่น หลอดไฟไม่ติด ขั้วหลอดมีรอยไหม้เล็กน้อย สวิตช์ยังเปิดได้ปกติ' : 'e.g. Fixture unresponsive, slight scorch on socket'}
                className="w-full text-xs font-medium text-slate-900 bg-white p-2 rounded-lg border border-blue-200/90 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* 3. Confirmed Technical Finding */}
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80">
              <label className="text-[10px] uppercase font-black text-emerald-900 block mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>{isTh ? 'ข้อเท็จจริงที่ตรวจพบยืนยันได้ (Confirmed Finding):' : 'Confirmed Finding:'}</span>
              </label>
              <textarea
                rows={2}
                value={assessment.confirmedFinding || ''}
                onChange={(e) => updateAssessment((prev) => ({ ...prev, confirmedFinding: e.target.value }))}
                placeholder={isTh ? 'เช่น มีไฟ 220V จ่ายมาที่ขั้วหลอดปกติ ไส้หลอดขาด' : 'e.g. 228V power delivered to socket, lamp filament blown'}
                className="w-full text-xs font-medium text-slate-900 bg-white p-2 rounded-lg border border-emerald-200/90 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* 4. Test Performed & Result */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-[10px] uppercase font-black text-slate-700 block mb-1 flex items-center gap-1">
                <Wrench className="w-3 h-3 text-slate-600" />
                <span>{isTh ? 'การทดสอบที่ดำเนินการ (Test Performed):' : 'Test Performed:'}</span>
              </label>
              <input
                type="text"
                value={assessment.testPerformed || ''}
                onChange={(e) => updateAssessment((prev) => ({ ...prev, testPerformed: e.target.value }))}
                placeholder={isTh ? 'เช่น วัดแรงดันไฟฟ้า AC (L-N) ด้วยดิจิตอลมัลติมิเตอร์' : 'e.g. Digital Multimeter AC voltage check'}
                className="w-full text-xs font-medium text-slate-900 bg-white p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 mb-2"
              />

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500">{isTh ? 'ผลการวัด:' : 'Result:'}</span>
                <select
                  value={assessment.testResult || 'Passed'}
                  onChange={(e) => updateAssessment((prev) => ({ ...prev, testResult: e.target.value as any }))}
                  className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 font-bold text-slate-800"
                >
                  <option value="Passed">{isTh ? '✓ ผ่านเกณฑ์ปกติ (Passed)' : '✓ Passed'}</option>
                  <option value="Action Required">{isTh ? '⚠️ ต้องซ่อม/เปลี่ยนอะไหล่ (Action Required)' : '⚠️ Action Required'}</option>
                  <option value="Not Measured / Unknown">{isTh ? '— ยังไม่ได้วัด/ไม่ทราบค่า (Not Measured)' : '— Not Measured'}</option>
                </select>
              </div>
            </div>

            {/* 5. Recommended Next Test */}
            <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-200/80">
              <label className="text-[10px] uppercase font-black text-indigo-900 block mb-1 flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-indigo-700" />
                <span>{isTh ? 'การทดสอบขั้นต่อไปที่แนะนำ (Next Test):' : 'Recommended Next Test:'}</span>
              </label>
              <textarea
                rows={2}
                value={assessment.recommendedNextTest || ''}
                onChange={(e) => updateAssessment((prev) => ({ ...prev, recommendedNextTest: e.target.value }))}
                placeholder={isTh ? 'เช่น ติดตั้งหลอดทดสอบเพื่อวัดกระแสขณะทำงาน' : 'e.g. Install test lamp and verify current load'}
                className="w-full text-xs font-medium text-slate-900 bg-white p-2 rounded-lg border border-indigo-200/90 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* 6. Unknown Items */}
            <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-200/80">
              <label className="text-[10px] uppercase font-black text-rose-900 block mb-1 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-rose-700" />
                <span>{isTh ? 'สิ่งที่ไม่รู้ / ยังยืนยันไม่ได้ (Unknown Items):' : 'Unknown Items (Not Yet Confirmed):'}</span>
              </label>
              <textarea
                rows={2}
                value={assessment.unknownItems || ''}
                onChange={(e) => updateAssessment((prev) => ({ ...prev, unknownItems: e.target.value }))}
                placeholder={isTh ? 'เช่น ยังไม่ทราบประวัติไฟกระชาก / ต้องรอเปิดโหลดเพื่อทดสอบเบรกเกอร์' : 'e.g. Unknown surge history / pending load test'}
                className="w-full text-xs font-medium text-slate-900 bg-white p-2 rounded-lg border border-rose-200/90 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
              />
            </div>
          </div>

          {/* Scope Confirmation & Molly Handoff Bar */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                isScopeConfirmed ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
              }`}>
                {isScopeConfirmed ? '✓' : '!'}
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-xs text-white">
                  {isScopeConfirmed
                    ? isTh ? 'ขอบเขตงานเทคนิคได้รับการยืนยันแล้ว' : 'Technical Scope Confirmed'
                    : isTh ? 'ขั้นตอนสำคัญ: ยืนยันข้อเท็จจริงก่อนส่งให้ Molly ทำราคาซ่อม' : 'Confirm facts before Molly prices repair'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {isScopeConfirmed && job.scopeConfirmedAt
                    ? isTh ? `บันทึกยืนยันเมื่อ ${new Date(job.scopeConfirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : `Confirmed at ${new Date(job.scopeConfirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : isTh ? 'เพื่อป้องกันการเสนอราคาผิดพลาดหรือปั้นตัวเลข' : 'Prevents inaccurate quotes and preserves genuine field facts'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isScopeConfirmed ? (
                <button
                  type="button"
                  onClick={handleConfirmScope}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isTh ? 'ยืนยันขอบเขตงานซ่อม' : 'Confirm Scope'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReopenScope}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-all cursor-pointer"
                >
                  {isTh ? 'แก้ไขข้อเท็จจริง' : 'Re-open Facts'}
                </button>
              )}

              <button
                type="button"
                onClick={onOpenQuickEstimate}
                className="px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-900" />
                <span>{isTh ? 'ส่งต่อให้ Molly ทำราคาซ่อม' : 'Open Molly Repair Quote'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Possible Causes vs. Recommended On-site Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
            <span className="text-[10px] uppercase font-extrabold text-amber-900 block mb-1.5 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              <span>{isTh ? 'สาเหตุที่เป็นไปได้ (ยังไม่ยืนยัน):' : 'Possible Causes (Not Yet Confirmed):'}</span>
            </span>
            <ul className="space-y-1.5 text-slate-700">
              {assessment.possibleCauses.map((c, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px]">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{isTh ? c.th : c.en}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            <span className="text-[10px] uppercase font-extrabold text-blue-900 block mb-1.5 flex items-center gap-1">
              <Activity className="w-3 h-3 text-blue-600" />
              <span>{isTh ? 'การทดสอบหน้างานที่แนะนำ:' : 'Recommended On-Site Tests:'}</span>
            </span>
            <ul className="space-y-1.5 text-slate-700">
              {assessment.recommendedTests.map((t, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px]">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>{isTh ? t.th : t.en}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CASE A / CASE B LOGIC MATRIX (Shows only when technical facts exist) */}
      {/* ========================================================================= */}
      {hasSufficientFieldFactsForCases && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isTh ? 'แผนการซ่อม: กรณี A vs กรณี B' : 'Repair Strategy: Case A vs. Case B'}</span>
            </h3>
            <p className="text-[10px] text-slate-500">
              {isTh
                ? 'Mr. Big กำหนดขอบเขตเทคนิค • Molly กำหนดราคา • แยกการแก้ไขธรรมดา ออกจากปัญหาสายไฟ'
                : 'Mr. Big defines technical scope • Molly prices • Isolates simple swap from deep circuit fault'}
            </p>
          </div>

          {/* Case Toggle Buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => updateAssessment((prev) => ({ ...prev, activeCase: 'Case A' }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                assessment.activeCase === 'Case A'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isTh ? 'เลือก กรณี A' : 'Select Case A'}
            </button>
            <button
              type="button"
              onClick={() => updateAssessment((prev) => ({ ...prev, activeCase: 'Case B' }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                assessment.activeCase === 'Case B'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isTh ? 'เลือก กรณี B' : 'Select Case B'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* CASE A CARD */}
          <div
            className={`rounded-xl p-4 border transition-all ${
              assessment.activeCase === 'Case A'
                ? 'bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-black text-emerald-900 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isTh ? assessment.caseA.titleTh : assessment.caseA.titleEn}</span>
              </span>
              {assessment.activeCase === 'Case A' && (
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                  {isTh ? 'กำลังใช้งาน' : 'Active'}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-600 mb-2.5">
              {isTh ? 'ขอบเขตงานเปลี่ยนอะไหล่ตรงจุด:' : 'Scope of component replacement:'}
            </p>

            <ul className="space-y-1.5 text-[11px] text-slate-800 mb-3">
              {(isTh ? assessment.caseA.scopeTh : assessment.caseA.scopeEn).map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">1.{idx + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-[11px] text-emerald-900 font-semibold mb-3">
              <span className="block text-[10px] text-emerald-700 font-bold uppercase">
                {isTh ? 'เกณฑ์ปิดงานสำเร็จ:' : 'Completion Criteria:'}
              </span>
              {isTh ? assessment.caseA.completionCriteriaTh : assessment.caseA.completionCriteriaEn}
            </div>

            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">{isTh ? 'ราคาเสนอ Molly (Case A):' : 'Molly Price (Case A):'}</span>
              <button
                type="button"
                onClick={onOpenQuickEstimate}
                className="font-extrabold text-emerald-700 hover:underline cursor-pointer"
              >
                ฿{(job.price || 1500).toLocaleString()} THB &rarr;
              </button>
            </div>
          </div>

          {/* CASE B CARD */}
          <div
            className={`rounded-xl p-4 border transition-all ${
              assessment.activeCase === 'Case B'
                ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-black text-amber-950 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{isTh ? assessment.caseB.titleTh : assessment.caseB.titleEn}</span>
              </span>
              {assessment.activeCase === 'Case B' && (
                <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full">
                  {isTh ? 'กำลังใช้งาน' : 'Active'}
                </span>
              )}
            </div>

            {/* Condition Box */}
            <div className="p-2 bg-amber-100/70 border border-amber-300 rounded-lg text-[11px] text-amber-950 font-medium mb-2.5">
              <span className="font-bold block text-[10px] uppercase text-amber-800">
                {isTh ? 'เงื่อนไขที่จะเริ่ม Case B:' : 'Trigger Condition:'}
              </span>
              {isTh ? assessment.caseB.triggerConditionTh : assessment.caseB.triggerConditionEn}
            </div>

            <ul className="space-y-1.5 text-[11px] text-slate-800 mb-3">
              {(isTh ? assessment.caseB.additionalScopeTh : assessment.caseB.additionalScopeEn).map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">2.{idx + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* Strict Warning Box */}
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-900 leading-tight mb-3">
              <span className="font-extrabold block uppercase text-rose-700 mb-0.5">
                {isTh ? 'คำเตือนความถูกต้องทางเทคนิค:' : 'Strict Technical Safeguard:'}
              </span>
              {isTh ? assessment.caseB.cautionNoticeTh : assessment.caseB.cautionNoticeEn}
            </div>

            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">{isTh ? 'ประเมินราคาซ่อมลึก Molly:' : 'Molly Investigation Scope:'}</span>
              <button
                type="button"
                onClick={onOpenQuickEstimate}
                className="font-extrabold text-amber-800 hover:underline cursor-pointer"
              >
                {isTh ? 'ประเมินราคาตามงานจริง &rarr;' : 'Quote Custom Work &rarr;'}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MEASUREMENTS & BOQ RESOURCES (FACT-BASED, NO FABRICATION) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field Measurements Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>{isTh ? 'ผลการวัดหน้างานจริง' : 'Real Field Measurements'}</span>
            </h4>
            <span className="text-[10px] text-slate-400 italic">
              {isTh ? 'ไม่มีการปั้นตัวเลข' : 'No fabricated readings'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                AC Voltage (L-N)
              </span>
              <input
                type="text"
                value={assessment.measurements.voltageAc || ''}
                placeholder="e.g. 228V"
                onChange={(e) =>
                  updateAssessment((prev) => ({
                    ...prev,
                    measurements: { ...prev.measurements, voltageAc: e.target.value },
                  }))
                }
                className="w-full font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                Earth Ground
              </span>
              <input
                type="text"
                value={assessment.measurements.earthResistance || ''}
                placeholder="e.g. < 5 Ω"
                onChange={(e) =>
                  updateAssessment((prev) => ({
                    ...prev,
                    measurements: { ...prev.measurements, earthResistance: e.target.value },
                  }))
                }
                className="w-full font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                Insulation Megger
              </span>
              <input
                type="text"
                value={assessment.measurements.insulationResistance || ''}
                placeholder="e.g. > 2.0 MΩ"
                onChange={(e) =>
                  updateAssessment((prev) => ({
                    ...prev,
                    measurements: { ...prev.measurements, insulationResistance: e.target.value },
                  }))
                }
                className="w-full font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                RCCB Trip Time/Current
              </span>
              <input
                type="text"
                value={assessment.measurements.rccbTripCurrent || ''}
                placeholder="e.g. 30mA / 22ms"
                onChange={(e) =>
                  updateAssessment((prev) => ({
                    ...prev,
                    measurements: { ...prev.measurements, rccbTripCurrent: e.target.value },
                  }))
                }
                className="w-full font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* BOQ Materials & Tools */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-indigo-600" />
              <span>{isTh ? 'วัสดุและเครื่องมือ BOQ' : 'BOQ Materials & Tools'}</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-bold">
              {isTh ? `เวลาประมาณ: ${assessment.estimatedDuration}` : `Est: ${assessment.estimatedDuration}`}
            </span>
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {isTh ? 'วัสดุ / อะไหล่ที่ต้องใช้:' : 'Materials:'}
              </span>
              {assessment.materials.map((m, i) => (
                <div key={i} className="flex justify-between items-center p-1.5 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-800">{isTh ? m.nameTh : m.nameEn}</span>
                  <span className="font-bold text-slate-900">{m.qty} {m.unit}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-1.5 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {isTh ? 'เครื่องมือช่างและกำลังพล:' : 'Tools & Resources:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {assessment.resources.map((r, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                    {isTh ? r.nameTh : r.nameEn}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. PHOTO EVIDENCE & SITE LOG */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-blue-600" />
            <span>{isTh ? 'รูปถ่ายหลักฐานหน้างาน' : 'Visual Evidence & Work Photos'}</span>
          </h3>

          <label className="text-[11px] font-bold bg-[#102a4e] hover:bg-blue-900 text-white px-3 py-1.5 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-sky-300" />
            <span>{isTh ? '+ เพิ่มรูปถ่าย' : '+ Add Photo'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={isUploadingPhoto}
            />
          </label>
        </div>

        {job.evidencePhotos && job.evidencePhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {job.evidencePhotos.map((photo, i) => (
              <div key={photo.id || i} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                <img
                  src={photo.photoUrl}
                  alt={photo.caption || `Evidence ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white p-1 text-[9px] truncate text-center">
                  {photo.caption || (photo.capturedAt ? new Date(photo.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
            {isTh ? 'ยังไม่มีรูปถ่ายหน้างาน ถ่ายรูปเพื่อแนบในรายงาน PDF' : 'No photos uploaded yet. Take photos for PDF report.'}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 7. FINANCIAL SUMMARY & QUICK ACTIONS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              {isTh ? 'ราคางานไฟฟ้า (Molly Quotation)' : 'Electrical Service Price'}
            </span>
            <div className="text-lg font-black text-slate-900">
              ฿{(job.price || 1500).toLocaleString()} THB
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              {isTh ? 'ยอดคงเหลือที่ต้องชำระ' : 'Balance Due'}
            </span>
            <div className="text-lg font-black text-amber-700">
              ฿{(matchingInvoice ? matchingInvoice.balanceDue : (job.price || 1500)).toLocaleString()} THB
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onRecordPayment(job.id, matchingInvoice?.balanceDue || job.price || 1500)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
            >
              {isTh ? 'บันทึกการชำระเงิน' : 'Record Payment'}
            </button>
            <button
              type="button"
              onClick={onOpenReport}
              className="bg-[#102a4e] hover:bg-blue-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
            >
              {isTh ? 'ดูรายงาน PDF' : 'View PDF Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
