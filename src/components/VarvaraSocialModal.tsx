import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Share2,
  Copy,
  Check,
  Camera,
  Layers,
  Globe2,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  Send,
  Download,
  Flame,
  CheckCircle2,
  Image as ImageIcon,
  ChevronRight,
  Info,
} from 'lucide-react';
import { InspectionJob, InspectionItem } from '../types';

interface VarvaraSocialModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: InspectionJob;
}

export const VarvaraSocialModal: React.FC<VarvaraSocialModalProps> = ({
  isOpen,
  onClose,
  job,
}) => {
  const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'google_business' | 'linkedin'>('facebook');
  const [language, setLanguage] = useState<'en' | 'th' | 'ru'>('en');
  const [tone, setTone] = useState<'case_study' | 'luxury_lifestyle' | 'problem_solution' | 'tech_highlight'>('case_study');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Available photos from current job
  const jobPhotos = job.items.filter((item) => item.photo);
  const currentItem = jobPhotos[selectedPhotoIndex] || job.items[0];

  // Generated post content state
  const [generatedPost, setGeneratedPost] = useState<{
    hook: string;
    captionEn: string;
    captionTh: string;
    captionRu: string;
    hashtags: string[];
    marketingTip: string;
  }>({
    hook: '⚡ Restoring Electrical Safety & Smart Home Harmony in Phuket Luxury Villas',
    captionEn: `🌴 Another precision diagnostic & engineering restoration completed at ${job.villaName}!\n\nBehind every tranquil Phuket luxury villa lies a complex network of power, smart automation, and climate controls. When unexpected electrical tripped breakers and hardware malfunctions struck, our certified engineering team responded with comprehensive diagnostics.\n\n🛠️ What Phuket Trusted Local delivered:\n• Industrial-grade Schneider circuit protection & Tuya Zigbee smart relays\n• Thermal load analysis and power restoration across critical zones\n• Standardized 3-document handover (Technical Inspection Report, Quotation & Customer Receipt)\n\nAbsentee villa owners and property managers trust us to keep their assets safe, compliant, and always guest-ready. 🛡️\n\nNeed your villa inspected before high season? DM us or book an audit today!`,
    captionTh: `🌴 ส่งมอบงานตรวจและอัปเกรดระบบไฟฟ้า & Smart Home คุณภาพมาตรฐานยุโรปที่ ${job.villaName}!\n\nที่ Phuket Trusted Local เราใส่ใจทุกรายละเอียดความปลอดภัยเบื้องหลังกำแพง เมื่อเกิดปัญหาไฟตัดหรืออุปกรณ์ไม่ทำงาน ทีมวิศวกรและช่างเทคนิคของเราเข้าตรวจเช็กด้วยเครื่องมือวิเคราะห์ระดับสูง พร้อมเปลี่ยนอะไหล่แบรนด์ชั้นนำ (Schneider Electric / Tuya)\n\n✨ ผลลัพธ์ที่เจ้าของวิลล่าได้รับ:\n• ระบบกลับมาเสถียร 100% ปลอดภัย ไร้กังวล\n• มีรายงานสรุปผลการตรวจภาษาอังกฤษอย่างละเอียด\n• รับประกันงานซ่อมและอุปกรณ์ครบถ้วน\n\nให้เราดูแลวิลล่าของคุณอย่างมืออาชีพ ปรึกษาทีมงาน Phuket Trusted Local ได้ทันทีค่ะ 🛡️`,
    captionRu: `🌴 Профессиональное техническое обслуживание и смарт-автоматизация на вилле ${job.villaName} в Пхукете!\n\nКоманда Phuket Trusted Local устранила сбои в электросети, заменила изношенные реле на премиальные компоненты и восстановила стабильную работу умного дома. Европейский стандарт качества и полная прозрачность для владельцев вилл.\n\nЗапишитесь на комплексную диагностику виллы уже сегодня! 🛡️`,
    hashtags: [
      '#PhuketVillaMaintenance',
      '#PhuketTrustedLocal',
      '#PhuketSmartHome',
      '#PhuketExpat',
      '#VillaCarePhuket',
      '#PhuketRealEstate',
      '#LuxuryVillaPhuket',
      '#SchneiderElectric',
    ],
    marketingTip: 'แนะนำให้โพสต์รูป Before/After ของแผงสวิตช์ไฟ หรือภาพช่างขณะถือเครื่องตรวจวัด เพื่อกระตุ้นความน่าเชื่อถือสูงที่สุดบน Facebook และ Instagram',
  });

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const photoItem = jobPhotos[selectedPhotoIndex] || job.items[0];
      const res = await fetch('/api/gemini/varvara', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          villaName: job.villaName,
          serviceType: job.serviceType,
          findingsSummary: photoItem
            ? `จุดตรวจ: ${photoItem.locationZone} (${photoItem.category}) - ปัญหา: ${photoItem.findingTh} / ${photoItem.findingEn}`
            : job.items.map((it) => it.findingTh).join('; '),
          platform,
          language,
          tone,
          photoDescriptions: photoItem?.findingEn || 'Villa technical equipment audit',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedPost(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const getActiveCaption = () => {
    if (language === 'th') return generatedPost.captionTh;
    if (language === 'ru') return generatedPost.captionRu || generatedPost.captionEn;
    return generatedPost.captionEn;
  };

  const fullShareText = `${generatedPost.hook}\n\n${getActiveCaption()}\n\n${generatedPost.hashtags.join(' ')}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header with Varvara Persona */}
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl shadow-inner font-bold">
              📸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  AI Varvara (วาร์วาร่า)
                </h2>
                <span className="text-[10px] bg-white/20 border border-white/30 text-white font-bold px-2 py-0.5 rounded-full">
                  Social Media &amp; Content Creator
                </span>
              </div>
              <p className="text-xs text-rose-100/90 font-medium">
                เปลี่ยนรูปภาพหน้างาน &amp; ผลการตรวจวิลล่า เป็นโพสต์ Social Media พรีเมียมเรียกความน่าเชื่อถือ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Controls Bar: Platform, Tone, Language */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Platform Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  เลือกช่องทาง (Platform)
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setPlatform('facebook')}
                    className={`py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      platform === 'facebook'
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📘 Facebook</span>
                  </button>
                  <button
                    onClick={() => setPlatform('instagram')}
                    className={`py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      platform === 'instagram'
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📷 Instagram</span>
                  </button>
                  <button
                    onClick={() => setPlatform('google_business')}
                    className={`py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      platform === 'google_business'
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🌐 Google Local</span>
                  </button>
                  <button
                    onClick={() => setPlatform('linkedin')}
                    className={`py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      platform === 'linkedin'
                        ? 'bg-sky-700 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>💼 LinkedIn</span>
                  </button>
                </div>
              </div>

              {/* Tone / Angle */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  สไตล์เนื้อหา (Content Angle)
                </label>
                <select
                  value={tone}
                  onChange={(e: any) => setTone(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-hidden focus:ring-2 focus:ring-pink-500"
                >
                  <option value="case_study">🛠️ Technical Case Study (เล่าปัญหา &amp; ทางแก้)</option>
                  <option value="luxury_lifestyle">💎 Luxury Villa Peace of Mind (ความสบายใจเจ้าของบ้าน)</option>
                  <option value="problem_solution">⚡ Fast Emergency Response (งานด่วนแก้ได้ทันที)</option>
                  <option value="tech_highlight">🔌 Smart Home &amp; Energy Upgrade (อัปเกรดทันสมัย)</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ภาษาของโพสต์ (Language)
                </label>
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${
                      language === 'en'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    onClick={() => setLanguage('th')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${
                      language === 'th'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🇹🇭 ภาษาไทย
                  </button>
                  <button
                    onClick={() => setLanguage('ru')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${
                      language === 'ru'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🇷🇺 Русский
                  </button>
                </div>
              </div>
            </div>

            {/* Photo Picker Strip */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-pink-600" />
                  <span>เลือกรูปถ่ายจากงานตรวจนี้ ({jobPhotos.length} รูป):</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {job.villaName}
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {jobPhotos.length > 0 ? (
                  jobPhotos.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all text-left group ${
                        selectedPhotoIndex === idx
                          ? 'border-pink-500 ring-2 ring-pink-500/20 scale-102'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={item.photo}
                        alt={item.findingTh}
                        className="w-24 h-18 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-1">
                        <span className="text-[9px] font-bold text-white truncate max-w-[85px]">
                          {item.locationZone.split('/')[0]}
                        </span>
                      </div>
                      {selectedPhotoIndex === idx && (
                        <div className="absolute top-1 right-1 bg-pink-500 text-white rounded-full p-0.5">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-xs text-slate-500 bg-slate-100 rounded-xl w-full text-center">
                    ไม่มีรูปถ่ายที่แนบไว้ในงานนี้ — Varvara จะใช้ข้อมูลสรุปผลตรวจแทน
                  </div>
                )}
              </div>
            </div>

            {/* Generate Trigger Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Varvara กำลังสร้างโพสต์...' : '✨ ให้ Varvara เจนเนอเรตโพสต์ใหม่'}</span>
              </button>
            </div>
          </div>

          {/* Social Post Preview Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Feed Mockup */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Post Header */}
              <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#102a4e] text-amber-400 font-black text-sm flex items-center justify-center border-2 border-amber-400">
                    PTL
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        Phuket Trusted Local • วิศวกรรม &amp; ดูแลพูลวิลล่า
                      </span>
                      <span className="text-[10px] text-blue-600">✓</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <span>Just now</span>
                      <span>•</span>
                      <span>{job.propertyLocation}</span>
                      <span>•</span>
                      <Globe2 className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                  {platform.toUpperCase()}
                </span>
              </div>

              {/* Post Text */}
              <div className="p-4 space-y-3">
                <div className="font-bold text-slate-900 text-sm leading-snug">
                  {generatedPost.hook}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {getActiveCaption()}
                </p>
                <div className="text-[11px] text-blue-600 font-medium leading-relaxed flex flex-wrap gap-1">
                  {generatedPost.hashtags.map((tag) => (
                    <span key={tag} className="hover:underline cursor-pointer">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Photo Showcase */}
              {currentItem?.photo ? (
                <div className="relative bg-slate-900">
                  <img
                    src={currentItem.photo}
                    alt="Work showcase"
                    className="w-full max-h-72 object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Site: {job.villaName}</span>
                  </div>
                </div>
              ) : null}

              {/* Simulated Social Reaction Bar */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1 text-slate-600">
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                    👍
                  </span>
                  <span>48 reactions</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>12 comments</span>
                  <span>6 shares</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action & Varvara's Tips */}
            <div className="lg:col-span-5 space-y-4">
              {/* 1-Click Action Card */}
              <div className="bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-blue-500/10 border border-rose-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Share2 className="w-4 h-4 text-pink-600" />
                  <span>พร้อมนำไปโพสต์ได้ทันที (1-Click Actions)</span>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleCopy(fullShareText, 'full_post')}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    {copiedKey === 'full_post' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>คัดลอกทั้งโพสต์เรียบร้อย!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>คัดลอกแคปชั่น + แฮชแท็กทั้งหมด</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleCopy(generatedPost.hashtags.join(' '), 'hashtags_only')}
                    className="w-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'hashtags_only' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>คัดลอกเฉพาะชุดแฮชแท็กภูเก็ต ({generatedPost.hashtags.length} แท็ก)</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-rose-200/60">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">
                    คำแนะนำการตลาดจาก Varvara:
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-rose-100">
                    💡 {generatedPost.marketingTip}
                  </p>
                </div>
              </div>

              {/* 4 AI Agents Team Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>The 4 AI Agents of Phuket Trusted Local</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                    <span className="font-bold text-blue-900">👷‍♂️ Mr. Big:</span>
                    <span className="text-blue-700">ตรวจหน้างาน &amp; ศัพท์วิศวกรรมสากล</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                    <span className="font-bold text-amber-900">👩‍💼 Molly:</span>
                    <span className="text-amber-700">เช็กราคาตลาด + ค่าจัดหา 15%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                    <span className="font-bold text-emerald-900">👩‍💼 Emily:</span>
                    <span className="text-emerald-700">ผู้ช่วยจ่ายเงิน &amp; ติดตามงาน</span>
                  </div>
                  <div className="p-2 rounded-lg bg-pink-50/70 border border-pink-200 font-bold flex items-center justify-between">
                    <span className="font-bold text-pink-900">📸 Varvara:</span>
                    <span className="text-pink-700">ผู้เชี่ยวชาญคอนเทนต์ Social Media</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            ระบบ Social Media Studio ออกแบบเพื่อการสร้างแบรนด์วิลล่าภูเก็ตให้โดดเด่น
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
