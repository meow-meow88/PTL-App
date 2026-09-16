import React from 'react';
import { InspectionJob, FindingStatus } from '../../types';
import { useCustomLogo } from '../../utils/useCustomLogo';

interface FindingsReportDocProps {
  job: InspectionJob;
  printMode?: boolean;
}

export const FindingsReportDoc: React.FC<FindingsReportDocProps> = ({ job, printMode = false }) => {
  const { logoUrl, fallbackLogoUrl } = useCustomLogo();

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
    <div
      id="findings-report-doc"
      className={`bg-white text-slate-900 mx-auto font-sans ${
        printMode ? 'w-full p-0 shadow-none' : 'max-w-4xl p-6 sm:p-10 shadow-lg border border-slate-200 rounded-xl'
      }`}
      style={{ minHeight: '1100px' }}
    >
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: '#102a4e',
          color: '#ffffff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}
        className="bg-[#102a4e] text-white p-6 rounded-lg mb-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <div className="text-xs font-bold tracking-widest text-sky-300 uppercase mb-1">
              Phuket Trusted Local
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              SITE INSPECTION REPORT — Comprehensive Findings &amp; Action Plan
            </h1>
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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 pt-3 border-t border-sky-800/60 text-xs">
          <div>
            <span className="text-sky-300 font-semibold block text-[10px] uppercase">Job ID:</span>
            <span className="font-mono text-white">{job.id}</span>
          </div>
          <div>
            <span className="text-sky-300 font-semibold block text-[10px] uppercase">Date:</span>
            <span className="text-white">{job.inspectionDate}</span>
          </div>
          <div>
            <span className="text-sky-300 font-semibold block text-[10px] uppercase">Customer:</span>
            <span className="text-white font-medium">{job.customerName}</span>
          </div>
          <div>
            <span className="text-sky-300 font-semibold block text-[10px] uppercase">Property / Location:</span>
            <span className="text-white truncate block">{job.propertyLocation}</span>
          </div>
          <div>
            <span className="text-sky-300 font-semibold block text-[10px] uppercase">Service Type:</span>
            <span className="text-white truncate block">{job.serviceType}</span>
          </div>
          <div>
            <span className="text-sky-300 font-semibold block text-[10px] uppercase">Inspector:</span>
            <span className="text-white">Phuket Trusted Local Field Team</span>
          </div>
          {job.driveFolderUrl && (
            <div className="col-span-2 sm:col-span-3 pt-2 border-t border-sky-800/40 flex items-center gap-2">
              <span className="text-sky-300 font-semibold text-[10px] uppercase shrink-0">Photo Cloud Drive:</span>
              <a
                href={job.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-200 hover:text-white font-mono text-[11px] underline truncate"
              >
                {job.driveFolderUrl}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-5 bg-blue-600 rounded-sm"></span>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Inspection Findings &amp; Diagnostic Summary
        </h2>
      </div>

      {/* Findings Table */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }} className="overflow-x-auto border border-slate-200 rounded-lg mb-6 shadow-xs">
        <table style={{ width: '100%', textAlign: 'left', fontSize: '12px', borderCollapse: 'collapse' }} className="w-full text-left text-xs border-collapse">
          <thead>
            <tr style={{ backgroundColor: '#102a4e', color: '#ffffff' }} className="bg-[#102a4e] text-white">
              <th className="py-3 px-3 font-semibold w-1/4 border-r border-slate-700">Location / Zone</th>
              <th className="py-3 px-3 font-semibold w-2/5 border-r border-slate-700">Issue Details</th>
              <th className="py-3 px-3 font-semibold w-1/6 text-center border-r border-slate-700">Status</th>
              <th className="py-3 px-3 font-semibold w-1/3">Recommended Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {job.items.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                {/* Location / Zone */}
                <td className="py-3.5 px-3 font-medium align-top border-r border-slate-200">
                  <div className="text-slate-900 font-bold">{item.locationZone.split('/')[0]?.trim()}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {item.locationZone.split('/')[1]?.trim() || item.category}
                  </div>
                </td>

                {/* Issue Details */}
                <td className="py-3.5 px-3 align-top border-r border-slate-200">
                  <div className="text-slate-900 leading-snug font-medium mb-1">
                    {item.observationEn}
                  </div>
                  {item.observationTh && (
                    <div className="text-slate-600 text-[11px] leading-relaxed pt-1 border-t border-slate-100">
                      {item.observationTh}
                    </div>
                  )}
                </td>

                {/* Status */}
                <td className="py-3.5 px-2 align-top text-center border-r border-slate-200">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold border whitespace-nowrap shadow-2xs ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </td>

                {/* Recommended Action */}
                <td className="py-3.5 px-3 align-top">
                  <div className="text-slate-900 leading-snug font-medium mb-1">
                    {item.recommendedActionEn || 'Inspect and rectify.'}
                  </div>
                  {item.recommendedActionTh && (
                    <div className="text-slate-600 text-[11px] leading-relaxed pt-1 border-t border-slate-100">
                      {item.recommendedActionTh}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Next Step Box */}
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-xs text-slate-800 mb-8">
        <p className="font-semibold text-sky-950 mb-1">
          Next Step / ขั้นตอนถัดไป:
        </p>
        <p className="leading-relaxed text-slate-700">
          Phuket Trusted Local will provide an itemized quotation (Step 10) covering labor, replacement parts,
          and smart home integration for your approval prior to proceeding with repairs.
        </p>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Phuket Trusted Local • Professional Technical Services &amp; Smart Home Audits</span>
        <span className="text-slate-400">Page 1 of 1 (Finalized Report)</span>
      </div>
    </div>
  );
};
