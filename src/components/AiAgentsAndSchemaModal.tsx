import React, { useState } from 'react';
import {
  X,
  Database,
  Bot,
  Sparkles,
  Download,
  Copy,
  Check,
  Table as TableIcon,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  Code,
  Layers,
  ArrowRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { InspectionJob, JobStatus, convertJobToRelationalTables } from '../types';

interface AiAgentsAndSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: InspectionJob;
  onUpdateJobStatus: (newStatus: JobStatus) => void;
  onApplyQuotationFromMolly?: (newQuotation: any) => void;
}

export const AiAgentsAndSchemaModal: React.FC<AiAgentsAndSchemaModalProps> = ({
  isOpen,
  onClose,
  job,
  onUpdateJobStatus,
  onApplyQuotationFromMolly,
}) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'schema' | 'live-tables'>('agents');
  const [activeAgent, setActiveAgent] = useState<'mr-big' | 'molly'>('mr-big');
  const [activeTable, setActiveTable] = useState<'jobs' | 'inspections' | 'quotation-items'>('jobs');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Mr. Big Test State
  const [mrBigInput, setMrBigInput] = useState(
    'สวิตช์ไฟทางขึ้นชั้น 2 กดไม่ติด มีเสียงแป๊กแล้วเบรกเกอร์ตัด'
  );
  const [mrBigLoading, setMrBigLoading] = useState(false);
  const [mrBigResult, setMrBigResult] = useState<any>(null);

  // Molly Test State
  const [mollyRequest, setMollyRequest] = useState(
    'ขอใบเสนอราคาด่วน เน้นของแบรนด์ Schneider Electric หรือ Tuya แท้ พร้อมรับประกัน'
  );
  const [mollyFeeRate, setMollyFeeRate] = useState(job.quotation.procurementFeeRate ?? 0.15);
  const [mollyLoading, setMollyLoading] = useState(false);
  const [mollyResult, setMollyResult] = useState<any>(null);

  if (!isOpen) return null;

  const { jobs, inspections, quotationItems } = convertJobToRelationalTables(job);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunMrBigTest = async () => {
    if (!mrBigInput.trim()) return;
    setMrBigLoading(true);
    try {
      const res = await fetch('/api/gemini/mr-big', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingTh: mrBigInput,
          zone: 'Staircase / ทางขึ้นชั้น 2',
          category: 'ELECTRICAL & LIGHTING AUDIT',
        }),
      });
      const data = await res.json();
      setMrBigResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setMrBigLoading(false);
    }
  };

  const handleRunMollyTest = async () => {
    setMollyLoading(true);
    try {
      const res = await fetch('/api/gemini/molly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findings: job.items,
          customerName: job.customerName,
          location: job.propertyLocation,
          coordinateFeeRate: mollyFeeRate,
          customRequest: mollyRequest,
        }),
      });
      const data = await res.json();
      setMollyResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setMollyLoading(false);
    }
  };

  const exportTableAsCsv = (tableName: string, data: any[]) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PTL_${tableName}_${job.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sqlSchemaSnippet = `-- ==========================================
-- Phuket Trusted Local: 3-Table Relational Schema
-- Suitable for PostgreSQL / Supabase / Cloud SQL / Airtable
-- ==========================================

-- Table 1: Jobs (ข้อมูลหลัก)
CREATE TABLE IF NOT EXISTS jobs (
  job_id VARCHAR(64) PRIMARY KEY,
  client_id VARCHAR(64) NOT NULL,
  villa_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Inspection' 
    CHECK (status IN ('Inspection', 'Quoted', 'Paid', 'Completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Inspections (รายละเอียดการตรวจหน้างาน)
CREATE TABLE IF NOT EXISTS inspections (
  insp_id VARCHAR(64) PRIMARY KEY,
  job_id VARCHAR(64) REFERENCES jobs(job_id) ON DELETE CASCADE,
  category VARCHAR(128) NOT NULL,
  location_zone VARCHAR(128) NOT NULL,
  photo_raw TEXT,
  mrbig_observation_en TEXT NOT NULL,
  mrbig_observation_th TEXT NOT NULL,
  mrbig_action_en TEXT NOT NULL,
  mrbig_action_th TEXT NOT NULL,
  status_tag VARCHAR(64) NOT NULL
);

-- Table 3: Quotation_Items (ใบเสนอราคา & จัดซื้อ)
CREATE TABLE IF NOT EXISTS quotation_items (
  quote_id VARCHAR(64) NOT NULL,
  job_id VARCHAR(64) REFERENCES jobs(job_id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  description_th TEXT,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit VARCHAR(32) NOT NULL DEFAULT 'Unit',
  unit_price NUMERIC(10,2) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  category_type VARCHAR(32) NOT NULL 
    CHECK (category_type IN ('Hardware', 'Service', 'Fee')),
  coordinate_fee_pct NUMERIC(5,2) DEFAULT 0.15,
  PRIMARY KEY (quote_id, item_name)
);`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto w-full max-w-full">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl relative border border-slate-200 overflow-hidden min-w-0">
        {/* Header */}
        <div className="bg-[#102a4e] text-white p-3.5 sm:p-5 flex items-start sm:items-center justify-between gap-2.5 border-b border-slate-700 shrink-0 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-slate-900 shadow-md shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-bold text-white truncate">
                  AI Agents &amp; Data Schema
                </h2>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full font-mono font-semibold shrink-0">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-sky-200/80 truncate">
                Mr. Big &amp; Molly พร้อมฐานข้อมูล 3 ตาราง
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white bg-white/10 p-1.5 sm:p-2 rounded-full transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'agents'
                ? 'border-blue-600 text-blue-900 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bot className="w-4 h-4 text-blue-600" />
            <span>1. AI Agents (Mr. Big &amp; Molly)</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'schema'
                ? 'border-blue-600 text-blue-900 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-4 h-4 text-emerald-600" />
            <span>2. Data Schema (3 Tables Architecture)</span>
          </button>

          <button
            onClick={() => setActiveTab('live-tables')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'live-tables'
                ? 'border-blue-600 text-blue-900 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TableIcon className="w-4 h-4 text-indigo-600" />
            <span>3. Live Tables &amp; CSV Export</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-mono">
              {job.id}
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/60">
          {/* TAB 1: AI AGENTS */}
          {activeTab === 'agents' && (
            <div className="space-y-6">
              {/* Agent selector pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveAgent('mr-big')}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    activeAgent === 'mr-big'
                      ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-[#102a4e] text-amber-400 font-black text-sm flex items-center justify-center">
                        MB
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          Mr. Big (The Technical Guardian)
                        </div>
                        <div className="text-[11px] text-blue-700 font-semibold">
                          Lead Field Inspector AI
                        </div>
                      </div>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    เปลี่ยนบันทึกสั้นหรือเสียงพูดจากช่างให้เป็นรายงานระดับมืออาชีพ (Bilingual)
                    อธิบายสิ่งที่เห็นและผลกระทบเชิงระบบ (System Impact) พร้อมทางแก้ระยะยาว
                  </p>
                </button>

                <button
                  onClick={() => setActiveAgent('molly')}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    activeAgent === 'molly'
                      ? 'bg-amber-50/90 border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        M
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          Molly (The Smart Coordinator)
                        </div>
                        <div className="text-[11px] text-amber-700 font-semibold">
                          Procurement &amp; Pricing Specialist AI
                        </div>
                      </div>
                    </div>
                    <ShoppingBag className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    วิเคราะห์ผลตรวจของ Mr. Big ค้นหาราคาตลาดในไทย (HomePro, Global House, Shopee,
                    Lazada) คำนวณค่าประสานงาน 15% และกำหนดเงื่อนไขการรับประกัน
                  </p>
                </button>
              </div>

              {/* ACTIVE AGENT DETAIL & SANDBOX */}
              {activeAgent === 'mr-big' ? (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>🛡️ System Prompt: Mr. Big (The Technical Guardian)</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        บทบาท: Inspector มืออาชีพ เขียนรายงานภาษาอังกฤษระดับสากล และภาษาไทยที่สุภาพ
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `คุณคือ Mr. Big หัวหน้าทีมตรวจหน้างานของ Phuket Trusted Local หน้าที่ของคุณคือเปลี่ยน 'บันทึกสั้นๆ หรือเสียงพูด' จากทีมช่าง ให้กลายเป็นรายงานการตรวจระดับมืออาชีพ (Bilingual)...`,
                          'mr-big-prompt'
                        )
                      }
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      {copiedKey === 'mr-big-prompt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'mr-big-prompt' ? 'คัดลอกแล้ว' : 'คัดลอก Prompt'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-800 mb-1">1. Observation (EN)</div>
                      <div className="text-[11px] text-slate-600">
                        Technical &amp; Sophisticated อธิบายสภาพและผลกระทบต่อระบบโดยรวม
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-800 mb-1">2. รายละเอียด (TH)</div>
                      <div className="text-[11px] text-slate-600">
                        แปลให้กระชับ สุภาพ และคงความหมายทางเทคนิคไว้ครบถ้วน
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-800 mb-1">3. Recommended Action</div>
                      <div className="text-[11px] text-slate-600">
                        เสนอทางแก้ที่ถูกต้อง ปลอดภัย และคุ้มค่างบประมาณ
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-800 mb-1">4. Tone of Voice</div>
                      <div className="text-[11px] text-slate-600">
                        น่าเชื่อถือ (Reassuring), ชัดเจน, มอบความสบายใจให้ลูกค้า
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 sm:col-span-2 lg:col-span-1">
                      <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1">
                        <span>⚡ 5. ตลาดจริง &amp; ส่งราคาไว</span>
                      </div>
                      <div className="text-[11px] text-emerald-800">
                        หาซื้อง่ายในภูเก็ต (12V 3W, IP67 PSU) รองรับรอบประกัน 1 ปี หนุน Molly ออกใบเสนอราคาไวทันใจ
                      </div>
                    </div>
                  </div>

                  {/* Sandbox */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>ทดสอบเรียก Mr. Big วิเคราะห์เสียงหรือโน้ตสั้น (Live Sandbox):</span>
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mrBigInput}
                        onChange={(e) => setMrBigInput(e.target.value)}
                        placeholder="พิมพ์เสียงช่าง เช่น สวิตช์ห้องนอนเสีย หรือ แบตเตอรี่ UPS บวม..."
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-600 outline-hidden"
                      />
                      <button
                        onClick={handleRunMrBigTest}
                        disabled={mrBigLoading || !mrBigInput.trim()}
                        className="bg-[#102a4e] hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {mrBigLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        <span>ทดสอบ Mr. Big</span>
                      </button>
                    </div>

                    {mrBigResult && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="font-bold text-blue-900">ผลการวิเคราะห์จาก Mr. Big:</span>
                          <span className="font-mono bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-semibold">
                            Status: {mrBigResult.suggestedStatus}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500 text-[11px] block">
                            Observation (EN):
                          </span>
                          <p className="text-slate-800 font-medium">{mrBigResult.observationEn}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500 text-[11px] block">
                            Observation (TH):
                          </span>
                          <p className="text-slate-700">{mrBigResult.observationTh}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500 text-[11px] block">
                            Recommended Action:
                          </span>
                          <p className="text-slate-800">
                            {mrBigResult.recommendedActionEn} / {mrBigResult.recommendedActionTh}
                          </p>
                        </div>
                        {mrBigResult.riskAssessment && (
                          <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px]">
                            <strong>⚠️ System Impact:</strong> {mrBigResult.riskAssessment}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>⚡ System Prompt: Molly (The Smart Coordinator)</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        บทบาท: ผู้เชี่ยวชาญด้านราคาสินค้า IT, อุปกรณ์ไฟฟ้า และระบบ Smart Home ในไทย
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `คุณคือ Molly ฝ่ายประสานงานและจัดซื้อของ Phuket Trusted Local คุณเป็นผู้เชี่ยวชาญด้านราคาสินค้า IT...`,
                          'molly-prompt'
                        )
                      }
                      className="text-xs text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1"
                    >
                      {copiedKey === 'molly-prompt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'molly-prompt' ? 'คัดลอกแล้ว' : 'คัดลอก Prompt'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-800 mb-1">1. Sourcing จาก Mr. Big</div>
                      <div className="text-[11px] text-slate-600">
                        ดึง Recommended Actions แปลงเป็นรายการชิ้นส่วนและค่าแรงช่าง
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-800 mb-1">2. ราคาตลาดประเทศไทย</div>
                      <div className="text-[11px] text-slate-600">
                        เปรียบเทียบ HomePro, Global House, Shopee, Lazada Official
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-800 mb-1">3. Procurement Fee 15%</div>
                      <div className="text-[11px] text-slate-600">
                        คิดค่าจัดหาและตรวจรับงาน 15% เพื่อความ Peace of Mind
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-800 mb-1">4. Terms &amp; Guarantee</div>
                      <div className="text-[11px] text-slate-600">
                        ระบบไฟรับประกัน 1 ปี, Config ซอฟต์แวร์รับประกัน 30 วัน
                      </div>
                    </div>
                  </div>

                  {/* Sandbox */}
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                        <span>ทดสอบให้ Molly สร้างใบเสนอราคาจาก 7 รายการตรวจ (Live Sourcing):</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-500">Coordinate Fee:</span>
                        {[0.05, 0.08, 0.10, 0.12, 0.15].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setMollyFeeRate(rate)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                              Math.abs(mollyFeeRate - rate) < 0.005
                                ? 'bg-amber-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {Math.round(rate * 100)}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mollyRequest}
                        onChange={(e) => setMollyRequest(e.target.value)}
                        placeholder="ระบุความต้องการเพิ่มเติม เช่น เน้นอุปกรณ์ Schneider หรือเพิ่มแบตเตอรี่สำรอง..."
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                      />
                      <button
                        onClick={handleRunMollyTest}
                        disabled={mollyLoading}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {mollyLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>ให้ Molly จัดการ</span>
                      </button>
                    </div>

                    {mollyResult && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-amber-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="font-bold text-amber-900">
                            ใบเสนอราคาที่ Molly สรุปได้:
                          </span>
                          <span className="font-mono bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-semibold">
                            Fee: {(mollyResult.procurementFeeRate || 0.15) * 100}%
                          </span>
                        </div>

                        {mollyResult.mollyNotes && (
                          <p className="text-[11px] text-slate-600 italic bg-amber-50 p-2 rounded">
                            "{mollyResult.mollyNotes}"
                          </p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          <div className="border border-slate-200 rounded p-2">
                            <span className="font-bold text-slate-700 text-[11px] block mb-1">
                              📦 Hardware ({mollyResult.hardwareItems?.length || 0} รายการ):
                            </span>
                            <ul className="text-[11px] space-y-1 text-slate-600">
                              {mollyResult.hardwareItems?.slice(0, 3).map((h: any, i: number) => (
                                <li key={i} className="flex justify-between">
                                  <span>
                                    {h.descriptionEn} (x{h.qty})
                                  </span>
                                  <span className="font-mono font-semibold">{h.amount} ฿</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="border border-slate-200 rounded p-2">
                            <span className="font-bold text-slate-700 text-[11px] block mb-1">
                              🔧 Services ({mollyResult.serviceItems?.length || 0} รายการ):
                            </span>
                            <ul className="text-[11px] space-y-1 text-slate-600">
                              {mollyResult.serviceItems?.slice(0, 2).map((s: any, i: number) => (
                                <li key={i} className="flex justify-between">
                                  <span>{s.description}</span>
                                  <span className="font-mono font-semibold">{s.amount} ฿</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {onApplyQuotationFromMolly && (
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => {
                                onApplyQuotationFromMolly(mollyResult);
                                alert('นำผลใบเสนอราคาจาก Molly ไปใช้งานในเอกสารเรียบร้อยแล้ว!');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>อัปเดตใส่เอกสารใบเสนอราคาจริง</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DATA SCHEMA SPECIFICATION */}
          {activeTab === 'schema' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-600" />
                      <span>โครงสร้างฐานข้อมูล 3 ตารางหลัก (Standard Relational Schema)</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      ออกแบบสำหรับระบบบริหารจัดการวิลล่าภูเก็ต สามารถต่อเข้า Supabase, Cloud SQL, Airtable หรือ Glide ได้ทันที
                    </p>
                  </div>

                  <button
                    onClick={() => copyToClipboard(sqlSchemaSnippet, 'sql-schema')}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'sql-schema' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'sql-schema' ? 'คัดลอก SQL แล้ว' : 'คัดลอก SQL DDL'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Table 1: Jobs */}
                  <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-blue-900 bg-blue-100 px-2 py-0.5 rounded font-mono">
                        Table 1: Jobs
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">PRIMARY KEY: Job_ID</span>
                    </div>
                    <div className="space-y-1.5 text-[11px] font-mono">
                      <div className="text-blue-700 font-semibold">• Job_ID (PK)</div>
                      <div className="text-slate-600">• Client_ID (FK)</div>
                      <div className="text-slate-600">• Villa_Name</div>
                      <div className="text-slate-600">• Service_Type</div>
                      <div className="text-emerald-700 font-semibold">• Status</div>
                      <div className="text-[10px] text-slate-500 pl-3">
                        (Inspection, Quoted, Paid, Completed)
                      </div>
                      <div className="text-slate-600">• Created_At</div>
                    </div>
                  </div>

                  {/* Table 2: Inspections */}
                  <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded font-mono">
                        Table 2: Inspections
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">PRIMARY KEY: Insp_ID</span>
                    </div>
                    <div className="space-y-1.5 text-[11px] font-mono">
                      <div className="text-indigo-700 font-semibold">• Insp_ID (PK)</div>
                      <div className="text-blue-700">• Job_ID (FK)</div>
                      <div className="text-slate-600">• Category</div>
                      <div className="text-slate-600">• Location_Zone</div>
                      <div className="text-slate-600">• Photo_Raw</div>
                      <div className="text-amber-700 font-semibold">• MrBig_Observation_TH/EN</div>
                      <div className="text-amber-700 font-semibold">• MrBig_Action_TH/EN</div>
                      <div className="text-rose-700 font-semibold">• Status_Tag</div>
                    </div>
                  </div>

                  {/* Table 3: Quotation_Items */}
                  <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-mono">
                        Table 3: Quotation_Items
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">PRIMARY KEY: Quote_ID</span>
                    </div>
                    <div className="space-y-1.5 text-[11px] font-mono">
                      <div className="text-amber-700 font-semibold">• Quote_ID</div>
                      <div className="text-blue-700">• Job_ID (FK)</div>
                      <div className="text-slate-600">• Item_Name</div>
                      <div className="text-slate-600">• Quantity</div>
                      <div className="text-slate-600">• Unit_Price</div>
                      <div className="text-purple-700 font-semibold">• Category_Type</div>
                      <div className="text-[10px] text-slate-500 pl-3">
                        (Hardware, Service, Fee)
                      </div>
                      <div className="text-emerald-700 font-semibold">• Coordinate_Fee_Pct (15%)</div>
                    </div>
                  </div>
                </div>

                {/* SQL Code Box */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
                    <span>PostgreSQL DDL Definition:</span>
                  </div>
                  <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed">
                    {sqlSchemaSnippet}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE TABLES & CSV EXPORT */}
          {activeTab === 'live-tables' && (
            <div className="space-y-5">
              {/* Table Switcher & Export */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setActiveTable('jobs')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTable === 'jobs'
                        ? 'bg-[#102a4e] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Jobs ({jobs.length})
                  </button>
                  <button
                    onClick={() => setActiveTable('inspections')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTable === 'inspections'
                        ? 'bg-[#102a4e] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Inspections ({inspections.length})
                  </button>
                  <button
                    onClick={() => setActiveTable('quotation-items')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTable === 'quotation-items'
                        ? 'bg-[#102a4e] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Quotation_Items ({quotationItems.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (activeTable === 'jobs') exportTableAsCsv('Jobs', jobs);
                      if (activeTable === 'inspections') exportTableAsCsv('Inspections', inspections);
                      if (activeTable === 'quotation-items') exportTableAsCsv('Quotation_Items', quotationItems);
                    }}
                    className="inline-flex items-center gap-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Export ตารางนี้เป็น CSV</span>
                  </button>

                  <button
                    onClick={() => {
                      exportTableAsCsv('Jobs', jobs);
                      setTimeout(() => exportTableAsCsv('Inspections', inspections), 300);
                      setTimeout(() => exportTableAsCsv('Quotation_Items', quotationItems), 600);
                    }}
                    className="inline-flex items-center gap-1 text-xs bg-[#102a4e] hover:bg-blue-900 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลดทั้ง 3 ตาราง</span>
                  </button>
                </div>
              </div>

              {/* LIVE TABLE RENDER */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                {activeTable === 'jobs' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3 font-mono">Job_ID</th>
                          <th className="p-3 font-mono">Client_ID</th>
                          <th className="p-3">Villa_Name</th>
                          <th className="p-3">Service_Type</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Created_At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {jobs.map((row) => (
                          <tr key={row.Job_ID} className="hover:bg-slate-50/70">
                            <td className="p-3 font-mono font-bold text-blue-900">{row.Job_ID}</td>
                            <td className="p-3 font-mono text-slate-600">{row.Client_ID}</td>
                            <td className="p-3 font-semibold text-slate-900">{row.Villa_Name}</td>
                            <td className="p-3 text-slate-700">{row.Service_Type}</td>
                            <td className="p-3">
                              <select
                                value={job.status || 'Quoted'}
                                onChange={(e) => onUpdateJobStatus(e.target.value as JobStatus)}
                                className="text-xs font-bold px-2 py-1 rounded border border-slate-300 bg-white cursor-pointer"
                              >
                                <option value="Inspection">Inspection (ตรวจหน้างาน)</option>
                                <option value="Quoted">Quoted (เสนอราคาแล้ว)</option>
                                <option value="Paid">Paid (ชำระมัดจำแล้ว)</option>
                                <option value="Completed">Completed (ส่งมอบเสร็จสิ้น)</option>
                              </select>
                            </td>
                            <td className="p-3 text-slate-500 font-mono text-[11px]">
                              {row.Created_At}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTable === 'inspections' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3 font-mono">Insp_ID</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Location_Zone</th>
                          <th className="p-3">MrBig_Observation (EN / TH)</th>
                          <th className="p-3">MrBig_Action (EN / TH)</th>
                          <th className="p-3 font-mono">Status_Tag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inspections.map((row) => (
                          <tr key={row.Insp_ID} className="hover:bg-slate-50/70">
                            <td className="p-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                              {row.Insp_ID}
                            </td>
                            <td className="p-3 text-[11px] font-semibold text-slate-800 whitespace-nowrap">
                              {row.Category}
                            </td>
                            <td className="p-3 font-medium text-slate-900 whitespace-nowrap">
                              {row.Location_Zone}
                            </td>
                            <td className="p-3 max-w-xs">
                              <div className="font-semibold text-slate-900 line-clamp-2">
                                {row.MrBig_Observation_EN}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                {row.MrBig_Observation_TH}
                              </div>
                            </td>
                            <td className="p-3 max-w-xs">
                              <div className="text-slate-800 font-medium line-clamp-2">
                                {row.MrBig_Action_EN}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                {row.MrBig_Action_TH}
                              </div>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="font-mono text-[11px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                                {row.Status_Tag}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTable === 'quotation-items' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3 font-mono">Quote_ID</th>
                          <th className="p-3">Item_Name / Detail</th>
                          <th className="p-3 text-center">Category_Type</th>
                          <th className="p-3 text-center">Quantity</th>
                          <th className="p-3 text-right">Unit_Price (THB)</th>
                          <th className="p-3 text-right">Amount (THB)</th>
                          <th className="p-3 text-center">Coordinate_Fee_Pct</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {quotationItems.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="p-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                              {row.Quote_ID}
                            </td>
                            <td className="p-3 max-w-sm">
                              <div className="font-bold text-slate-900">{row.Item_Name}</div>
                              {row.Description_TH && (
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {row.Description_TH}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                  row.Category_Type === 'Hardware'
                                    ? 'bg-blue-100 text-blue-800'
                                    : row.Category_Type === 'Service'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-amber-100 text-amber-800 font-bold'
                                }`}
                              >
                                {row.Category_Type}
                              </span>
                            </td>
                            <td className="p-3 text-center font-medium">
                              {row.Quantity} {row.Unit}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-700">
                              {row.Unit_Price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              {row.Amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center font-mono text-slate-600">
                              {(row.Coordinate_Fee_Pct * 100).toFixed(0)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 p-3 sm:p-4 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500">
            Current Active Job: <span className="font-mono font-bold text-slate-800">{job.id}</span>{' '}
            • Status:{' '}
            <span className="font-semibold text-blue-800">
              {job.status || 'Inspection'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="bg-[#102a4e] hover:bg-blue-900 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
