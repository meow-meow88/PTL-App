import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Plus,
  Check,
  Search,
  Loader2,
  Trash2,
  ExternalLink,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { InspectionJob, QuotationHardwareItem } from '../types';

interface MollyHardwareModalProps {
  job: InspectionJob;
  onClose: () => void;
  onApplyHardwareItem: (newItem: Omit<QuotationHardwareItem, 'item'>) => void;
  onUpdateAllHardwareItems: (items: QuotationHardwareItem[]) => void;
}

export const MollyHardwareModal: React.FC<MollyHardwareModalProps> = ({
  job,
  onClose,
  onApplyHardwareItem,
  onUpdateAllHardwareItems,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'door_window' | 'plumbing' | 'ceiling_ac' | 'electrical'>('all');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Molly state
  const [mollyData, setMollyData] = useState<{
    mollyGreeting: string;
    priceTrendWarning: string;
    missingChecklist: Array<{
      id: string;
      nameTh: string;
      nameEn: string;
      category: string;
      unitPrice: number;
      unit: string;
      qty: number;
      reason: string;
      sourcingChannel: string;
      recommended: boolean;
    }>;
    suggestedItemsToAdd: Array<{
      descriptionTh: string;
      descriptionEn: string;
      unitPrice: number;
      qty: number;
      unit: string;
      sourcingChannel: string;
    }>;
    answer: string;
  }>({
    mollyGreeting: `สวัสดีค่ะ! มอลลี่พร้อมช่วยสืบราคากลาง คัดสรรอะไหล่แท้และอุปกรณ์สำหรับงานตรวจรับและดูแลวิลล่า (Villa Inspection & Comprehensive Property Care) ครบทุกระบบ ทั้งงานประตู-หน้าต่างบานเลื่อน, งานประปา-สุขภัณฑ์, งานฝ้าเพดาน-สี-ความชื้น, ระบบปรับอากาศ, งานสระว่ายน้ำ และระบบความปลอดภัยไฟฟ้า มอลลี่คัดสรรเฉพาะอุปกรณ์คุณภาพเกรดพรีเมียม ทนไอเกลือทะเลภูเก็ต พร้อมแหล่งซื้อในเกาะ เพื่อให้เจ้าของวิลล่าได้รับของแท้ คุ้มค่า และส่งมอบความสบายใจ (Peace of Mind) สูงสุดค่ะ!`,
    priceTrendWarning:
      '🌐 ข้อมูลราคากลางอะไหล่วิลล่าภูเก็ตล่าสุด: ชุดลูกล้อสแตนเลส SUS304, ก๊อกน้ำเซรามิกวาล์ว, อะไหล่แอร์ และเบรกเกอร์กันดูด มีสต็อกพร้อมจัดส่งที่ HomePro ฉลอง/ถลาง, ไทวัสดุ และบุญถาวร เพื่อความสะดวกรวดเร็วในการปิดงานค่ะ',
    missingChecklist: [
      {
        id: 'chk-door-1',
        nameTh: 'ชุดลูกล้อคู่สแตนเลส SUS304 ประตูบานเลื่อนหนัก (Heavy-Duty Tandem Rollers)',
        nameEn: 'Heavy-Duty SUS304 Stainless Steel Tandem Sliding Door Rollers (Set)',
        category: 'door_window',
        unitPrice: 650,
        unit: 'ชุด',
        qty: 2,
        reason: 'งานประตู-หน้าต่างบานเลื่อน: แก้ปัญหาบานเลื่อนฝืด ตกราง หรือเลื่อนสะดุด ทนไอเกลือทะเล ปลอดสนิมตลอดอายุการใช้งาน',
        sourcingChannel: 'HomePro Phuket / Hafele Fitting Center',
        recommended: true,
      },
      {
        id: 'chk-plumb-1',
        nameTh: 'ก๊อกน้ำอ่างล้างหน้าสแตนเลส SUS304 ไส้วาล์วเซรามิก พร้อมสายน้ำดีถัก',
        nameEn: 'SUS304 Brushed Stainless Steel Basin Mixer Faucet with Braided Inlets',
        category: 'plumbing',
        unitPrice: 1450,
        unit: 'ชุด',
        qty: 1,
        reason: 'งานระบบสุขภัณฑ์และประปา: ทนแรงดันปั๊มน้ำวิลล่า วาล์วเซรามิกแท้ไม่รั่วซึม ป้องกันน้ำหยดสะสม',
        sourcingChannel: 'HomePro Phuket Chalong / Thai Watsadu',
        recommended: true,
      },
      {
        id: 'chk-ceiling-1',
        nameTh: 'ชุดน้ำยารองพื้นปูนเก่าบล็อกความชื้น TOA + สีอะคริลิกทาฝ้าเพดาน',
        nameEn: 'TOA Moisture-Blocking Primer & Interior Acrylic Ceiling Touch-Up Kit',
        category: 'ceiling_ac',
        unitPrice: 1250,
        unit: 'ชุด',
        qty: 1,
        reason: 'งานซ่อมบำรุงผิวอาคาร: แก้ไขรอยคราบน้ำ รอยเชื้อราสะสมบนฝ้าเพดานจากการรั่วซึมให้กลับมาเนียนเรียบ',
        sourcingChannel: 'TOA Color World / Thai Watsadu Phuket',
        recommended: true,
      },
      {
        id: 'chk-ac-1',
        nameTh: 'คาปาซิเตอร์คอมเพรสเซอร์แอร์เกรดอุตสาหกรรม + โฟมล้างคอยล์เย็น',
        nameEn: 'Dual Motor Run Capacitor 40uF & Chemical Coil Cleaning Foam',
        category: 'ceiling_ac',
        unitPrice: 960,
        unit: 'ชุด',
        qty: 1,
        reason: 'งานระบบปรับอากาศ: ป้องกันแอร์ไม่เย็น พัดลมไม่หมุน และคืนความสะอาดสดชื่นให้อากาศในวิลล่า',
        sourcingChannel: 'ร้านอมร อิเล็คโทรนิคส์ / HomePro Phuket',
        recommended: true,
      },
      {
        id: 'chk-elec-1',
        nameTh: 'เบรกเกอร์กันดูด RCBO Schneider Easy9 32A 30mA (มาตรฐานวิลล่า)',
        nameEn: 'Schneider Electric Easy9 RCBO 32A 30mA Safety Breaker',
        category: 'electrical',
        unitPrice: 950,
        unit: 'ตัว',
        qty: 2,
        reason: 'งานความปลอดภัยระบบไฟฟ้า: ป้องกันไฟฟ้ารั่ว ดูด ลัดวงจร สำหรับวงจรปั๊มน้ำ เครื่องทำน้ำอุ่น และแอร์',
        sourcingChannel: 'โฮมโปร ฉลอง / อมร อิเล็คโทรนิคส์',
        recommended: true,
      },
      {
        id: 'chk-inground-12v-3w',
        nameTh: 'หลอด/โคมไฟ In-Ground Uplight 12V 3W แสงวอร์มไวท์ พร้อมชุดซีลกันน้ำ',
        nameEn: 'Outdoor In-Ground Uplight 12V 3W Warm White (IP67/IP68 Waterproof Sealed)',
        category: 'electrical',
        unitPrice: 380,
        unit: 'ชุด',
        qty: 2,
        reason: 'งานไฟฝังพื้น/ไฟขั้นบันได/ไฟส่องต้นไม้: ระบบ 12V SELV ปลอดภัยจากไฟดูด 100% ไม่ทริปเบรกเกอร์ ราคาสมเหตุสมผล',
        sourcingChannel: 'ร้านอุปกรณ์ไฟฟ้าภูเก็ต / ไทวัสดุ / HomePro',
        recommended: true,
      },
      {
        id: 'chk-psu-12v-wp',
        nameTh: 'ชุดเพาเวอร์ซัพพลาย Power Supply 12V แบบกันน้ำ IP67 ทนทานสูง',
        nameEn: 'Heavy-Duty Weatherproof 12V DC IP67 Power Supply Driver',
        category: 'electrical',
        unitPrice: 550,
        unit: 'ชุด',
        qty: 1,
        reason: 'ชุดจ่ายไฟ 12V กันน้ำสำหรับงานภายนอกอาคาร: จ่ายไฟนิ่ง บอดี้อลูมิเนียมทนทาน ปลอดภัย ทนฝนทนแดด',
        sourcingChannel: 'ไทวัสดุ ภูเก็ต / ร้านอุปกรณ์ไฟฟ้า',
        recommended: true,
      },
      {
        id: 'chk-par38-market',
        nameTh: 'หลอดไฟสนาม PAR38 LED ขั้ว E27 (12W-15W แสงวอร์มไวท์) ราคากลางทั่วไป',
        nameEn: 'Standard Market-Grade Outdoor PAR38 LED Lamp E27 (IP65)',
        category: 'electrical',
        unitPrice: 220,
        unit: 'ดวง',
        qty: 2,
        reason: 'งานไฟส่องสวน/ต้นไม้: ราคากลางตลาดทั่วไป ทนฝน IP65 แสงนวลสวยงาม',
        sourcingChannel: 'ไทวัสดุ / เมกาโฮม / โฮมโปร ฉลอง',
        recommended: true,
      },
    ],
    suggestedItemsToAdd: [],
    answer: '',
  });

  // Fetch proactive advice from Molly
  const handleAskMolly = async (customQuery?: string) => {
    const q = customQuery !== undefined ? customQuery : query;
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/molly/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          currentHardwareItems: job.quotation.hardwareItems,
          villaName: job.villaName,
          category: selectedCategory,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMollyData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Add checklist item to quotation
  const handleAddChecklistItem = (item: any) => {
    onApplyHardwareItem({
      descriptionTh: item.nameTh,
      descriptionEn: item.nameEn,
      qty: item.qty,
      unit: item.unit,
      unitPrice: item.unitPrice,
      amount: item.qty * item.unitPrice,
      sourcingChannel: item.sourcingChannel,
    });
    setAddedIds((prev) => new Set([...prev, item.id]));
  };

  // 1-Click Add suggested item
  const handleAddSuggestedItem = (sug: any, index: number) => {
    onApplyHardwareItem({
      descriptionTh: sug.descriptionTh,
      descriptionEn: sug.descriptionEn,
      qty: sug.qty,
      unit: sug.unit,
      unitPrice: sug.unitPrice,
      amount: sug.qty * sug.unitPrice,
      sourcingChannel: sug.sourcingChannel,
    });
    setAddedIds((prev) => new Set([...prev, `sug-${index}`]));
  };

  // Quick edit quantity or price in current quotation
  const handleUpdateCurrentItemQty = (index: number, delta: number) => {
    const newItems = [...job.quotation.hardwareItems];
    const item = newItems[index];
    const newQty = Math.max(1, item.qty + delta);
    newItems[index] = {
      ...item,
      qty: newQty,
      amount: newQty * item.unitPrice,
    };
    onUpdateAllHardwareItems(newItems);
  };

  const handleUpdateCurrentItemPrice = (index: number, newPrice: number) => {
    const newItems = [...job.quotation.hardwareItems];
    const item = newItems[index];
    newItems[index] = {
      ...item,
      unitPrice: newPrice,
      amount: item.qty * newPrice,
    };
    onUpdateAllHardwareItems(newItems);
  };

  const handleRemoveCurrentItem = (index: number) => {
    const newItems = job.quotation.hardwareItems.filter((_, i) => i !== index);
    const reindexed = newItems.map((it, idx) => ({ ...it, item: idx + 1 }));
    onUpdateAllHardwareItems(reindexed);
  };

  // Filter checklist
  const filteredChecklist =
    selectedCategory === 'all'
      ? mollyData.missingChecklist
      : mollyData.missingChecklist.filter((c) => c.category === selectedCategory);

  const totalCurrentHardware = job.quotation.hardwareItems.reduce(
    (acc, it) => acc + (it.amount || it.qty * it.unitPrice || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-amber-200/80 my-auto animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-black text-base shadow-sm">
              👩‍🔧
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold text-slate-900">
                  Molly • ผู้เชี่ยวชาญราคาอะไหล่ &amp; จัดซื้อสำหรับวิลล่า (Villa Property Care)
                </h3>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                  🏡 Villa Care &amp; Hardware Sourcing
                </span>
              </div>
              <p className="text-xs text-slate-500">
                สำหรับ: <span className="font-semibold text-slate-700">{job.villaName}</span> • <span className="text-emerald-700 font-medium">งานตรวจรับและดูแลสภาพวิลล่ารอบด้าน</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 pt-3">
          {/* Proactive Molly Speech Bubble */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="text-lg">💬</span>
              <div className="text-xs text-amber-950 leading-relaxed font-medium">
                {mollyData.mollyGreeting}
              </div>
            </div>

            {/* Price Alert Banner */}
            <div className="bg-white/80 border border-amber-300 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-amber-900 font-semibold">
              <TrendingUp className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{mollyData.priceTrendWarning}</span>
            </div>
          </div>

          {/* Quick Asking / Voice & Text Input */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <label className="text-xs font-extrabold text-slate-800 block mb-1.5 flex items-center justify-between">
              <span>🏡 ถามราคาอะไหล่หรือสั่งเพิ่มอุปกรณ์งานดูแลวิลล่า:</span>
              <span className="text-[10px] text-slate-500 font-normal">กดไมค์คีย์บอร์ดพิมพ์ด้วยเสียงได้</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskMolly()}
                  placeholder="เช่น: ลูกล้อประตูบานเลื่อน SUS304, ก๊อกน้ำอ่างล้างหน้า, สีทาฝ้ากันชื้น..."
                  className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs font-sans focus:outline-none shadow-2xs"
                />
              </div>
              <button
                onClick={() => handleAskMolly()}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-xs shrink-0 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>เช็กราคา</span>
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-200/60">
              <span className="text-[10px] text-slate-500 font-bold">ถามด่วน:</span>
              <button
                onClick={() => {
                  setQuery('เช็กราคาเต้ารับป๊อปอัปฝังโต๊ะทำงาน (Pop-Up Socket)');
                  handleAskMolly('เช็กราคาเต้ารับป๊อปอัปฝังโต๊ะทำงาน (Pop-Up Socket)');
                }}
                className="text-[11px] bg-white hover:bg-amber-100 text-slate-800 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
              >
                🔌 ปลั๊ก Pop-Up โต๊ะทำงาน
              </button>
              <button
                onClick={() => {
                  setQuery('เช็กราคาชุดท่อดักกลิ่นใต้อ่างและสายน้ำดีสแตนเลส 304');
                  handleAskMolly('เช็กราคาชุดท่อดักกลิ่นใต้อ่างและสายน้ำดีสแตนเลส 304');
                }}
                className="text-[11px] bg-white hover:bg-amber-100 text-slate-800 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
              >
                🚿 ท่อดักกลิ่น &amp; สายน้ำดีสแตนเลส
              </button>
              <button
                onClick={() => {
                  setQuery('เช็กราคาชุดลูกล้อประตูกระจกบานเลื่อน Heavy Duty');
                  handleAskMolly('เช็กราคาชุดลูกล้อประตูกระจกบานเลื่อน Heavy Duty');
                }}
                className="text-[11px] bg-white hover:bg-amber-100 text-slate-800 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
              >
                🚪 ลูกล้อประตูบานเลื่อน &amp; กลอน
              </button>
              <button
                onClick={() => {
                  setQuery('เช็กราคาเบรกเกอร์ RCBO Schneider 32A และอุปกรณ์ความปลอดภัย');
                  handleAskMolly('เช็กราคาเบรกเกอร์ RCBO Schneider 32A และอุปกรณ์ความปลอดภัย');
                }}
                className="text-[11px] bg-white hover:bg-amber-100 text-slate-800 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
              >
                ⚡ เบรกเกอร์ RCBO &amp; ตู้ไฟ
              </button>
              <button
                onClick={() => {
                  const q = 'ผู้เช่าผิดนัดหมาย 2 ครั้ง ขอคิดค่าเสียเวลา Cancellation / Missed Appointment Fee 1000 บาท';
                  setQuery(q);
                  handleAskMolly(q);
                }}
                className="text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 shadow-2xs"
              >
                ⏱️ คิดค่าผิดนัด / Missed Appt (฿1,000)
              </button>
            </div>
          </div>

          {/* AI Custom Answer (if asked) */}
          {mollyData.answer && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-2">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <span>✨ คำตอบเรื่องราคาจาก Molly:</span>
              </div>
              <p className="text-emerald-950 leading-relaxed font-sans">{mollyData.answer}</p>

              {mollyData.suggestedItemsToAdd && mollyData.suggestedItemsToAdd.length > 0 && (
                <div className="pt-2 border-t border-emerald-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-900 block">
                    กดปุ่มเพื่อเพิ่มเข้าใบเสนอราคาได้ทันที:
                  </span>
                  {mollyData.suggestedItemsToAdd.map((sug, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{sug.descriptionTh}</div>
                        <div className="text-[10px] text-slate-500">
                          {sug.qty} {sug.unit} @ ฿{sug.unitPrice.toLocaleString()} ({sug.sourcingChannel})
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddSuggestedItem(sug, idx)}
                        disabled={addedIds.has(`sug-${idx}`)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 ${
                          addedIds.has(`sug-${idx}`)
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {addedIds.has(`sug-${idx}`) ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>เพิ่มแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ เพิ่มลงใบเสนอราคา</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Missing Items Checklist (ตรวจเช็กอุปกรณ์ที่น่าจะยังขาด) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>🏡 รายการอะไหล่และอุปกรณ์วิลล่าที่ Molly คัดสรรแนะนำ:</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  กดปุ่ม &quot;+ เพิ่มทันที&quot; เพื่อแทรกรายการและราคาตลาดภูเก็ตเข้าใบเสนอราคา
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    selectedCategory === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setSelectedCategory('door_window')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    selectedCategory === 'door_window' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  🚪 บานเลื่อน
                </button>
                <button
                  onClick={() => setSelectedCategory('plumbing')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    selectedCategory === 'plumbing' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  🚰 ประปา
                </button>
                <button
                  onClick={() => setSelectedCategory('ceiling_ac')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    selectedCategory === 'ceiling_ac' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  ❄️ แอร์/ฝ้า
                </button>
                <button
                  onClick={() => setSelectedCategory('electrical')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    selectedCategory === 'electrical' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  ⚡ ไฟฟ้า
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {filteredChecklist.map((item) => {
                const isAdded = addedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-white border border-slate-200 hover:border-amber-300 rounded-xl transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{item.nameTh}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.2 rounded-full font-mono">
                          {item.sourcingChannel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.reason}</p>
                      <div className="text-xs font-bold text-amber-700 mt-1 flex items-center gap-2">
                        <span>
                          ฿{item.unitPrice.toLocaleString()} / {item.unit}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          (แนะนำจำนวน: {item.qty} {item.unit} = ฿{(item.qty * item.unitPrice).toLocaleString()})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddChecklistItem(item)}
                      disabled={isAdded}
                      className={`shrink-0 inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${
                        isAdded
                          ? 'bg-slate-100 text-slate-500 cursor-default'
                          : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs active:scale-95'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>เพิ่มแล้ว ✓</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ เพิ่มทันที</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Current Items in Quotation (ตรวจราคาเดิม & ปรับเพิ่ม-ลด) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                  <span>รายการอะไหล่ในใบเสนอราคาปัจจุบัน ({job.quotation.hardwareItems.length} รายการ):</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  ตรวจสอบราคาโอเคมั้ย ปรับราคาหรือจำนวน หรือลบรายการได้ทันที
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">รวมค่าอุปกรณ์</span>
                <span className="text-sm font-black text-slate-900">
                  ฿{totalCurrentHardware.toLocaleString()}
                </span>
              </div>
            </div>

            {job.quotation.hardwareItems.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs">
                ยังไม่มีรายการอะไหล่ในใบเสนอราคา บอสสามารถกดเลือกจากรายการด้านบนได้เลยค่ะ
              </div>
            ) : (
              <div className="space-y-2">
                {job.quotation.hardwareItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate">
                        {idx + 1}. {item.descriptionTh || item.descriptionEn}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {item.sourcingChannel || 'จัดหาโดย Molly'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Price Editor */}
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                        <span className="text-[10px] text-slate-400">฿</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateCurrentItemPrice(idx, Number(e.target.value) || 0)}
                          className="w-16 text-right font-bold text-xs bg-transparent focus:outline-none text-slate-800"
                        />
                      </div>

                      {/* Qty Buttons */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => handleUpdateCurrentItemQty(idx, -1)}
                          className="px-2 py-1 hover:bg-slate-100 text-slate-600 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800">{item.qty}</span>
                        <button
                          onClick={() => handleUpdateCurrentItemQty(idx, 1)}
                          className="px-2 py-1 hover:bg-slate-100 text-slate-600 font-bold"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveCurrentItem(idx)}
                        className="text-rose-400 hover:text-rose-600 p-1.5"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0 mt-2">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span>💡 ข้อมูลอัปเดตตรงเข้าใบเสนอราคาอัตโนมัติ</span>
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs"
          >
            <span>เสร็จสิ้น (เรียบร้อยแล้ว)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
