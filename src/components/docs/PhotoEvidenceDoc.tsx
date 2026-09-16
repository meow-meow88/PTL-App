import React from 'react';
import { InspectionJob } from '../../types';
import { useCustomLogo } from '../../utils/useCustomLogo';

interface PhotoEvidenceDocProps {
  job: InspectionJob;
  printMode?: boolean;
}

export const PhotoEvidenceDoc: React.FC<PhotoEvidenceDocProps> = ({ job, printMode = false }) => {
  const { logoUrl, fallbackLogoUrl } = useCustomLogo();

  return (
    <div
      id="photo-evidence-doc"
      className={`bg-white text-slate-900 mx-auto font-sans ${
        printMode ? 'w-full p-0 shadow-none' : 'max-w-4xl p-6 sm:p-10 shadow-lg border border-slate-200 rounded-xl'
      }`}
      style={{ minHeight: '1100px' }}
    >
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#102a4e',
          color: '#ffffff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
        className="bg-[#102a4e] text-white p-6 rounded-lg mb-6 flex items-center justify-between gap-4"
      >
        <div>
          <div className="text-xs font-semibold tracking-widest text-sky-300 uppercase mb-1">
            Phuket Trusted Local
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            Photo Evidence &amp; On-Site Inspection Log
          </h1>
          <p className="text-xs text-sky-100/80">
            Attached Technical Documentation &amp; Photographic Verification
          </p>
        </div>
        <img
          src={logoUrl || fallbackLogoUrl}
          onError={(e) => {
            if (e.currentTarget.src !== fallbackLogoUrl) {
              e.currentTarget.src = fallbackLogoUrl;
            }
          }}
          alt="PTL Logo"
          width={56}
          height={56}
          style={{ width: '56px', height: '56px', maxWidth: '56px', maxHeight: '56px', objectFit: 'contain' }}
          className="w-14 h-14 max-w-[56px] max-h-[56px] rounded-xl border border-sky-400/30 bg-white p-0.5 object-contain shrink-0"
        />
      </div>

      {/* Metadata Grid */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px'
        }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs mb-6"
      >
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">JOB ID</span>
          <span className="font-mono font-semibold text-slate-900">{job.id}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">INSPECTION DATE</span>
          <span className="font-semibold text-slate-900">{job.inspectionDate}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">CUSTOMER</span>
          <span className="font-semibold text-slate-900">{job.customerName}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">PROPERTY LOCATION</span>
          <span className="font-medium text-slate-800 truncate block">{job.propertyLocation}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">SERVICE TYPE</span>
          <span className="font-semibold text-slate-900">{job.serviceType}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">INSPECTOR</span>
          <span className="font-semibold text-slate-900">{job.inspector}</span>
        </div>
        <div className="col-span-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">DOCUMENT REF</span>
          <span className="font-mono text-slate-700 text-[11px] truncate block">{job.documentRef}</span>
        </div>
      </div>

      {/* Google Drive Folder Archive Access Card */}
      {job.driveFolderUrl && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-900/10 via-sky-50 to-indigo-50/50 border-2 border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-blue-300 flex items-center justify-center text-blue-700 font-bold shadow-xs shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 87.3 78" fill="currentColor">
                <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066da"/>
                <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44C.4 49.9 0 51.45 0 53h27.5L43.65 25z" fill="#00ac47"/>
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15 7.9 13.65z" fill="#ea4335"/>
                <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.4-4.45 1.2L43.65 25z" fill="#00832d"/>
                <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h50.9c1.55 0 3.1-.4 4.45-1.2L59.8 53z" fill="#2684fc"/>
                <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28h27.5c0-1.55-.4-3.1-1.2-4.5l-12.7-22z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-slate-900">
                  Google Drive Photo Archive (Full-Resolution RAW)
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                  Cloud Repository
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                โฟลเดอร์รวบรวมไฟล์ภาพถ่ายความละเอียดสูงและวิดีโอหน้างานทั้งหมด จัดเก็บแบบถาวรสำหรับลูกค้า
              </p>
              <div className="text-[11px] font-mono text-blue-700 underline truncate max-w-md mt-0.5">
                {job.driveFolderUrl}
                {(job.driveFolderUrl.includes('1PTL-') || job.driveFolderUrl.includes('PTL-')) && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 ml-2 font-sans font-normal no-underline inline-block">
                    (Demo Link)
                  </span>
                )}
              </div>
            </div>
          </div>

          <a
            href={job.driveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#102a4e] hover:bg-blue-900 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shadow-xs shrink-0"
          >
            <span>📂 เปิดโฟลเดอร์ Google Drive</span>
          </a>
        </div>
      )}

      {/* Section Title */}
      <div className="border-b-2 border-slate-900 pb-2 mb-6">
        <h2 className="text-xs font-black tracking-widest text-slate-900 uppercase">
          Photographic Evidence Log ({job.items.length} Items Attached)
        </h2>
      </div>

      {/* Items List */}
      <div className="space-y-6">
        {job.items.map((item, idx) => (
          <div
            key={item.id}
            className="border border-slate-200 rounded-lg p-4 bg-white hover:border-slate-300 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded">
                {item.category}
              </span>
              <span className="text-xs font-mono text-slate-500">
                Ref: {item.fileReference || `IMG_${3590 + idx}.jpg`}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-3">
              {idx + 1}. {item.title || item.locationZone}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Photo on left */}
              <div className="md:col-span-5 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center aspect-[4/3] max-h-56">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-4 text-slate-400 text-xs">
                    <span className="text-2xl block mb-1">📷</span>
                    ถ่ายภาพจุดตรวจเรียบร้อย
                  </div>
                )}
              </div>

              {/* Descriptions on right */}
              <div className="md:col-span-7 flex flex-col justify-between text-xs space-y-3">
                <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                  <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    Observation (EN):
                  </div>
                  <p className="text-slate-800 leading-relaxed">
                    {item.observationEn || 'No observation recorded.'}
                  </p>
                </div>

                <div className="bg-sky-50/50 p-3 rounded-md border border-sky-100">
                  <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                    รายละเอียดเพิ่มเติม (TH):
                  </div>
                  <p className="text-slate-800 leading-relaxed font-normal">
                    {item.observationTh || 'ไม่มีรายละเอียดเพิ่มเติม'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-slate-500">
                    <strong>Zone:</strong> {item.locationZone}
                  </span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                      item.status === 'Normal'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'Power Tripped' || item.status === 'Critical Swap'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-10 pt-4 border-t border-slate-200 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Phuket Trusted Local • Professional Technical Services &amp; Smart Home Audits</span>
        <span className="text-slate-400">Official Field Inspection Evidence</span>
      </div>
    </div>
  );
};
