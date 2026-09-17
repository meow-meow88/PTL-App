import React from 'react';
import {
  CalendarDays,
  Users,
  Building2,
  Briefcase,
  DollarSign,
  FileText,
  Truck,
  Calendar,
  Settings,
  Plus,
  Sparkles,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';
import { MainNavTab } from '../types';
import { useCustomLogo } from '../utils/useCustomLogo';

interface NavigationProps {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  onOpenQuickJob: () => void;
  onOpenMollyExpress?: () => void;
  onOpenBackupModal?: () => void;
  onOpenGoogleDrive?: () => void;
  todayCount?: number;
  urgentAttentionCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickJob,
  onOpenMollyExpress,
  onOpenBackupModal,
  onOpenGoogleDrive,
  todayCount = 0,
  urgentAttentionCount = 0,
}) => {
  const { logoUrl, fallbackLogoUrl } = useCustomLogo();

  const navItems: { id: MainNavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number; phase1?: boolean }[] = [
    { id: 'my_day', label: 'MY DAY', icon: CalendarDays, badge: urgentAttentionCount || todayCount, phase1: true },
    { id: 'customers', label: 'CUSTOMERS', icon: Users, phase1: true },
    { id: 'properties', label: 'PROPERTIES', icon: Building2, phase1: true },
    { id: 'jobs', label: 'JOBS', icon: Briefcase, badge: todayCount, phase1: true },
    { id: 'money', label: 'MONEY', icon: DollarSign, phase1: false },
    { id: 'documents', label: 'DOCUMENTS', icon: FileText, phase1: false },
    { id: 'vendors', label: 'VENDORS', icon: Truck, phase1: false },
    { id: 'calendar', label: 'CALENDAR', icon: Calendar, phase1: false },
    { id: 'settings', label: 'SETTINGS', icon: Settings, phase1: true },
  ];

  return (
    <header className="bg-[#0f1d33] text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Logo & Identity */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src={logoUrl || fallbackLogoUrl}
            onError={(e) => {
              if (e.currentTarget.src !== fallbackLogoUrl) {
                e.currentTarget.src = fallbackLogoUrl;
              }
            }}
            alt="PTL Logo"
            className="w-9 h-9 rounded-lg bg-white p-0.5 object-contain border border-blue-400/40 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-extrabold tracking-wider text-white uppercase">
                PHUKET TRUSTED LOCAL
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-600 text-white">
                V2
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium hidden xs:block">
              Solo Operator Operations Command
            </div>
          </div>
        </div>

        {/* Action Controls & Fast Add */}
        <div className="flex items-center gap-2">
          {onOpenMollyExpress && (
            <button
              onClick={onOpenMollyExpress}
              className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors"
              title="Molly Express Quotation"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Molly Express</span>
            </button>
          )}

          {onOpenBackupModal && (
            <button
              onClick={onOpenBackupModal}
              className="hidden md:flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
              title="Backup & Restore"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Backup</span>
            </button>
          )}

          {/* HIGHLY VISIBLE + NEW JOB BUTTON */}
          <button
            id="nav-btn-new-job"
            onClick={onOpenQuickJob}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer ring-2 ring-blue-400/50"
            title="Create a new job in under 1 minute"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="tracking-wide">+ NEW JOB</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="max-w-7xl mx-auto px-2 sm:px-6 overflow-x-auto scrollbar-none flex items-center gap-1 border-t border-slate-800/80 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white text-blue-700'
                      : 'bg-amber-400 text-slate-950'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
