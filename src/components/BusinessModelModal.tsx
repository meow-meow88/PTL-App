import React from 'react';
import { X, HeartHandshake, Home, Users, Building, ShieldCheck, ArrowRight, FileCheck, CheckCircle2 } from 'lucide-react';

interface BusinessModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessModelModal: React.FC<BusinessModelModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sopSteps = [
    { num: 1, name: 'Inquiry', th: 'รับเรื่อง / สอบถาม' },
    { num: 2, name: 'Quote', th: 'ประเมินเบื้องต้น' },
    { num: 3, name: 'Payment', th: 'ชำระค่าบริการตรวจ' },
    { num: 4, name: 'Schedule', th: 'นัดหมายวันเวลา' },
    { num: 5, name: 'Visit', th: 'เดินทางถึงหน้างาน' },
    { num: 6, name: 'Inspect', th: 'ตรวจเช็กหน้างาน', active: true },
    { num: 7, name: 'Report', th: 'ออกรายงาน 3 PDF', active: true },
    { num: 8, name: 'Follow-up', th: 'ประสานงานแก้ไข' },
    { num: 9, name: 'Invoice', th: 'ออกใบเสร็จรับเงิน' },
    { num: 10, name: 'Review', th: 'ลูกค้าประเมินผล' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto w-full max-w-full">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200 min-w-0">
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Company Header */}
        <div className="mb-5 pb-4 border-b border-slate-100">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full mb-2 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Phuket Trusted Local</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            โมเดลธุรกิจ &amp; มาตรฐาน SOP การทำงาน
          </h2>
          <p className="text-sm font-medium text-blue-600 italic mt-1">
            "Your trusted local contact for homes, property and everyday life in Phuket."
          </p>
          <p className="text-xs text-slate-600 mt-1.5 font-bold">
            💡 หัวใจสำคัญ: คุณไม่ได้ขายแค่บริการทางเทคนิค แต่ขาย "Peace of Mind" (ความสบายใจ ไร้กังวล)
          </p>
        </div>

        {/* 3 Main Customer Personas */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>3 กลุ่มลูกค้าหลักของบริษัท</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Group 1 */}
            <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-sky-950 mb-1.5">
                <HeartHandshake className="w-4 h-4 text-sky-600" />
                <span>กลุ่มที่ 1: Expat ในภูเก็ต</span>
              </div>
              <p className="text-slate-600 text-[11px] mb-2 leading-relaxed">
                อายุ 50–70 ปี อยู่คนเดียว พูดไทยไม่ได้ มีรายได้เกษียณ ต้องการคนช่วยเรื่องทั่วไป
              </p>
              <div className="bg-white/80 p-2 rounded border border-sky-100 text-[11px] text-slate-700">
                <strong className="text-sky-900 block mb-0.5">ปัญหาที่พบบ่อย:</strong>
                รถเสีย, พาไปหาหมอ, หาช่าง, หาแม่บ้าน, อินเทอร์เน็ตมีปัญหา, พาสัตว์เลี้ยงไปโรงพยาบาล
              </div>
            </div>

            {/* Group 2 */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-indigo-950 mb-1.5">
                <Home className="w-4 h-4 text-indigo-600" />
                <span>กลุ่มที่ 2: เจ้าของวิลล่าต่างประเทศ</span>
              </div>
              <p className="text-slate-600 text-[11px] mb-2 leading-relaxed">
                อยู่สิงคโปร์ ฮ่องกง ยุโรป มีบ้านพักในภูเก็ต มาปีละ 2–4 ครั้ง
              </p>
              <div className="bg-white/80 p-2 rounded border border-indigo-100 text-[11px] text-slate-700">
                <strong className="text-indigo-900 block mb-0.5">สิ่งที่ต้องการ:</strong>
                คนดูแลบ้าน, ตรวจความเรียบร้อย, ประสานช่าง, รับพัสดุ, ส่งรายงานพร้อมรูปถ่ายชัดเจน
              </div>
            </div>

            {/* Group 3 */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-950 mb-1.5">
                <Building className="w-4 h-4 text-amber-600" />
                <span>กลุ่มที่ 3: นักลงทุนปล่อยเช่า / Airbnb</span>
              </div>
              <p className="text-slate-600 text-[11px] mb-2 leading-relaxed">
                เจ้าของ Airbnb, เจ้าของคอนโด และนักลงทุนปล่อยเช่า
              </p>
              <div className="bg-white/80 p-2 rounded border border-amber-100 text-[11px] text-slate-700">
                <strong className="text-amber-900 block mb-0.5">สิ่งที่ต้องการ:</strong>
                คนแก้ปัญหาเฉพาะหน้า, คนดูแลช่าง, คนรับแจ้งเหตุฉุกเฉินตลอด 24/7
              </div>
            </div>
          </div>
        </div>

        {/* SOP Workflow */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>SOP ขั้นตอนการปฏิบัติงาน (Standard Operating Procedure)</span>
          </h3>
          <p className="text-xs text-slate-600 mb-3">
            แอปพลิเคชันนี้ทำงานในขั้นตอน <strong>Step 6: Inspect (ตรวจงาน)</strong> และ <strong>Step 7: Report (ออกรายงานเรียลไทม์ 3 PDF)</strong>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {sopSteps.map((step) => (
              <div
                key={step.num}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  step.active
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <div
                  className={`text-[10px] font-bold uppercase mb-0.5 ${
                    step.active ? 'text-sky-200' : 'text-slate-400'
                  }`}
                >
                  Step {step.num}
                </div>
                <div className="font-bold text-xs">{step.name}</div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    step.active ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {step.th}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 PDF Outputs Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
          <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>รายงาน 3 ไฟล์ที่สร้างอัตโนมัติทันทีหลังจบการตรวจ:</span>
          </h4>
          <ul className="space-y-1.5 text-slate-700">
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-700 min-w-5">1.</span>
              <span><strong>Photo Evidence Log:</strong> บันทึกภาพถ่ายหลักฐานหน้างานแบบละเอียด พร้อม Observation (EN) และ รายละเอียด (TH)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-700 min-w-5">2.</span>
              <span><strong>Findings &amp; Action Plan:</strong> สรุปผลการตรวจแยกตามโซน สถานะความเสียหาย (Power Tripped, Swap, ฯลฯ) และแนวทางแก้ไข</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-700 min-w-5">3.</span>
              <span><strong>Official Quotation:</strong> ใบเสนอราคาค่าอะไหล่ ค่าบริการเทคนิค ค่าจัดหา 15% พร้อมกำหนดนัดหมายและช่องเซ็นชื่อ</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-[#102a4e] hover:bg-blue-900 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>รับทราบ เข้าสู่หน้าตรวจงาน</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
