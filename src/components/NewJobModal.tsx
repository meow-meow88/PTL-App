import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Wrench,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FolderPlus,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { CustomerGroup, InspectionJob } from '../types';
import { sampleCustomerPresets } from '../data/sampleData';
import { googleSignIn, getCurrentUser, getAccessToken } from '../services/googleAuth';
import { createInspectionFolder } from '../services/googleDrive';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateJob: (jobData: Partial<InspectionJob>) => void;
  onSelectExistingJob?: (jobId: string) => void;
  existingJobs?: InspectionJob[];
}

export const NewJobModal: React.FC<NewJobModalProps> = ({
  isOpen,
  onClose,
  onCreateJob,
  onSelectExistingJob,
  existingJobs = [],
}) => {
  const [customerName, setCustomerName] = useState('');
  const [location, setLocation] = useState('');
  const [project, setProject] = useState('');
  const [group, setGroup] = useState<CustomerGroup>('villa_owner');
  const [driveUrl, setDriveUrl] = useState('');
  const [isCreatingDriveFolder, setIsCreatingDriveFolder] = useState(false);
  const [driveFolderCreatedName, setDriveFolderCreatedName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: (typeof sampleCustomerPresets)[0]) => {
    setCustomerName(preset.name);
    setLocation(preset.location);
    setProject(preset.service);
    setGroup(preset.group);
    setDriveUrl(`https://drive.google.com/drive/folders/1PTL-${preset.name.replace(/\s+/g, '')}-Evidence`);
    setDriveFolderCreatedName(null);
  };

  const handleCreateGoogleDriveFolderApi = async () => {
    const targetName = customerName.trim() || 'Client';
    setIsCreatingDriveFolder(true);
    setDriveFolderCreatedName(null);

    try {
      let token = await getAccessToken();
      if (!token) {
        const signinRes = await googleSignIn();
        if (!signinRes) throw new Error('กรุณายืนยันการเข้าสู่ระบบ Google เพื่อเชื่อมต่อ Drive');
      }

      const tempJobId = `PTL-INSP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
      const folderRes = await createInspectionFolder({
        customerName: targetName,
        propertyLocation: location,
        jobId: tempJobId,
      });

      setDriveUrl(folderRes.webViewLink);
      setDriveFolderCreatedName(folderRes.name);
    } catch (err: any) {
      console.error('Drive folder creation failed:', err);
      alert(`ไม่สามารถสร้างโฟลเดอร์ Google Drive ได้: ${err?.message || 'เกิดข้อผิดพลาด'}`);
    } finally {
      setIsCreatingDriveFolder(false);
    }
  };

  // Instant 1-click start for sample jobs on mobile
  const handleInstantStartPreset = async (preset: (typeof sampleCustomerPresets)[0]) => {
    // Check if job already exists in jobsList
    const existing = existingJobs.find(
      (j) =>
        j.customerName.toLowerCase().includes(preset.name.toLowerCase()) ||
        preset.name.toLowerCase().includes(j.customerName.toLowerCase())
    );

    if (existing && onSelectExistingJob) {
      onSelectExistingJob(existing.id);
      onClose();
      return;
    }

    let finalDriveUrl = `https://drive.google.com/drive/folders/1PTL-${preset.name.replace(/\s+/g, '')}-Evidence`;
    try {
      const token = await getAccessToken();
      if (token) {
        const tempJobId = `PTL-INSP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
        const folderRes = await createInspectionFolder({
          customerName: preset.name,
          propertyLocation: preset.location,
          jobId: tempJobId,
        });
        if (folderRes?.webViewLink) {
          finalDriveUrl = folderRes.webViewLink;
        }
      }
    } catch (e) {
      console.warn('Auto preset drive creation note:', e);
    }

    // Otherwise create brand new from preset
    onCreateJob({
      customerName: preset.name,
      customerGroup: preset.group,
      propertyLocation: preset.location,
      serviceType: preset.service,
      driveFolderUrl: finalDriveUrl,
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    let finalDriveUrl = driveUrl.trim();

    // Auto-create real Google Drive folder if user has logged in
    if (!finalDriveUrl) {
      try {
        const token = await getAccessToken();
        if (token) {
          const tempJobId = `PTL-INSP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
          const folderRes = await createInspectionFolder({
            customerName: customerName.trim(),
            propertyLocation: location.trim(),
            jobId: tempJobId,
          });
          finalDriveUrl = folderRes.webViewLink;
        }
      } catch (err) {
        console.warn('Auto drive folder skipped:', err);
      }
    }

    if (!finalDriveUrl) {
      const slug = customerName.trim().replace(/\s+/g, '-');
      finalDriveUrl = `https://drive.google.com/drive/folders/PTL-${encodeURIComponent(slug)}-Evidence`;
    }

    onCreateJob({
      customerName: customerName.trim(),
      customerGroup: group,
      propertyLocation: location.trim() || 'Phuket, Thailand',
      serviceType: project.trim() || 'General Property & Tech Inspection',
      driveFolderUrl: finalDriveUrl,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-3 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>เริ่มงานตรวจหน้างานใหม่</span>
            <span className="text-[11px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
              Mobile Ready
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            เลือกเคสตัวอย่างด้านล่างเพื่อเริ่มทดลองตรวจทันที 1-Click หรือพิมพ์สร้างรายการใหม่
          </p>
        </div>

        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {/* Quick Presets with 1-Click Instant Open */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                ⚡ แตะเลือกเคสตัวอย่างเพื่อเข้าหน้าตรวจทันที (1-Click):
              </label>
            </div>
            <div className="space-y-2">
              {sampleCustomerPresets.map((p, i) => {
                const isExisting = existingJobs.some(
                  (j) =>
                    j.customerName.toLowerCase().includes(p.name.toLowerCase()) ||
                    p.name.toLowerCase().includes(j.customerName.toLowerCase())
                );

                return (
                  <div
                    key={i}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-400 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">{p.name}</span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-medium">
                          {p.group === 'villa_owner' ? 'Villa Owner' : p.group === 'expat' ? 'Expat' : 'Airbnb'}
                        </span>
                        {isExisting && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            มีข้อมูลตรวจแล้ว
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">{p.location}</div>
                      <div className="text-[10px] text-slate-600 truncate">{p.service}</div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 px-2 py-1 rounded-md font-medium"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInstantStartPreset(p)}
                        className="bg-[#102a4e] hover:bg-blue-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs"
                      >
                        <span>เปิดตรวจทันที</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form for custom or edited job */}
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
            <div className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-1">
              หรือระบุรายละเอียดงานใหม่เอง:
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อลูกค้า <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="เช่น K. Mazen หรือ John Smith"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                สถานที่ / ที่อยู่วิลล่า
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="เช่น Green Mile Villa, Kathu, Phuket"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                โปรเจกต์ / วัตถุประสงค์การตรวจ
              </label>
              <input
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="เช่น Comprehensive Villa Inspection & Defect Audit"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all bg-white"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Google Drive Photo Folder (คลาวด์เก็บภาพ RAW)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCreateGoogleDriveFolderApi}
                    disabled={isCreatingDriveFolder}
                    className="inline-flex items-center gap-1 text-[11px] text-white font-bold bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    title="สร้างโฟลเดอร์ใหม่ในบัญชี Google Drive ของคุณโดยอัตโนมัติ"
                  >
                    {isCreatingDriveFolder ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <FolderPlus className="w-3 h-3" />
                    )}
                    <span>⚡ สร้างโฟลเดอร์อัตโนมัติ (API)</span>
                  </button>

                  <a
                    href="https://drive.google.com/drive/my-drive"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-slate-500 hover:text-blue-900 font-semibold flex items-center gap-0.5"
                  >
                    <span>เปิด Drive</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {driveFolderCreatedName && (
                <div className="mb-1.5 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    สร้างโฟลเดอร์สำเร็จ: <strong>{driveFolderCreatedName}</strong>
                  </span>
                </div>
              )}

              <input
                type="url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/... (ระบบสร้างให้อัตโนมัติ หรือวางลิงก์เองได้)"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all bg-white font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!customerName.trim()}
                className="w-full bg-[#102a4e] hover:bg-blue-900 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>บันทึกและเริ่มตรวจหน้างานนี้ทันที</span>
              </button>
            </div>

            <div className="text-center pb-2 text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Wrench className="w-3.5 h-3.5 text-slate-400" />
              <span>ระบบรันเลขที่ตรวจ PTL-INSP และ PTL-QT ให้อัตโนมัติ</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
