import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  MoreHorizontal,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { MainNavTab } from '../types';
import { useCustomLogo } from '../utils/useCustomLogo';
import { useLanguage } from '../i18n/translations';

interface NavigationProps {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  onOpenQuickJob: () => void;
  onOpenUrgentJob?: () => void;
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
  onOpenUrgentJob,
  onOpenMollyExpress,
  onOpenBackupModal,
  todayCount = 0,
  urgentAttentionCount = 0,
}) => {
  const { logoUrl, fallbackLogoUrl } = useCustomLogo();
  const { lang, setLanguage, t } = useLanguage();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  useEffect(() => {
    if (!isMoreOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMoreOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isMoreOpen]);

  const primaryMobileTabs: {
    id: MainNavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'my_day', label: t.nav.myDay, icon: CalendarDays, badge: urgentAttentionCount || todayCount },
    { id: 'customers', label: t.nav.customers, icon: Users },
    { id: 'properties', label: t.nav.properties, icon: Building2 },
    { id: 'jobs', label: t.nav.jobs, icon: Briefcase, badge: todayCount },
    { id: 'money', label: t.nav.money, icon: DollarSign },
  ];

  const secondaryTabs: {
    id: MainNavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'documents', label: t.nav.documents, icon: FileText },
    { id: 'vendors', label: t.nav.vendors, icon: Truck },
    { id: 'calendar', label: t.nav.calendar, icon: Calendar },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  const isMoreActive = secondaryTabs.some((tab) => tab.id === activeTab);

  return (
    <header className="bg-[#0f1d33] text-white border-b border-slate-800 sticky top-0 z-30 shadow-md w-full max-w-full overflow-x-hidden">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2 w-full min-w-0">
        {/* Logo & Identity */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <img
            src={logoUrl || fallbackLogoUrl}
            onError={(e) => {
              if (e.currentTarget.src !== fallbackLogoUrl) {
                e.currentTarget.src = fallbackLogoUrl;
              }
            }}
            alt="PTL Logo"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white p-0.5 object-contain border border-blue-400/40 shadow-xs shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black tracking-wider text-white uppercase truncate">
                <span className="sm:hidden font-extrabold">PTL</span>
                <span className="hidden sm:inline">PHUKET TRUSTED LOCAL</span>
              </span>
              <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-blue-600 text-white shrink-0">
                V2
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium hidden xs:block truncate">
              {lang === 'th' ? 'ระบบจัดการช่างและบริการวิลล่าภูเก็ต' : 'Solo Operator Operations Command'}
            </div>
          </div>
        </div>

        {/* Action Controls & Fast Add */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Switcher Button (TH / EN) */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-xs font-bold shrink-0">
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 sm:px-2 py-1 rounded-md transition-colors cursor-pointer text-[11px] sm:text-xs ${
                lang === 'en'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="English Interface"
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('th')}
              className={`px-1.5 sm:px-2 py-1 rounded-md transition-colors cursor-pointer text-[11px] sm:text-xs ${
                lang === 'th'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ภาษาไทย"
            >
              TH
            </button>
          </div>

          {/* Global Urgent Job Fast Action */}
          {onOpenUrgentJob && (
            <button
              id="nav-btn-urgent-job"
              onClick={onOpenUrgentJob}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-extrabold text-xs px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
              title={lang === 'th' ? 'สร้างงานด่วน' : 'Create Urgent Job'}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
              <span className="hidden xs:inline">{lang === 'th' ? 'งานด่วน' : 'Urgent'}</span>
            </button>
          )}

          {onOpenMollyExpress && (
            <button
              onClick={onOpenMollyExpress}
              className="hidden md:flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-2.5 py-1.5 rounded-lg border border-amber-500/30 transition-colors shrink-0"
              title="Molly Express Quotation"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Molly</span>
            </button>
          )}

          {onOpenBackupModal && (
            <button
              onClick={onOpenBackupModal}
              className="hidden lg:flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors shrink-0"
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
            className="flex items-center gap-1 sm:gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-md transition-all cursor-pointer ring-2 ring-blue-400/50 shrink-0 whitespace-nowrap"
            title="Create a new job in under 1 minute"
          >
            <Plus className="w-4 h-4 stroke-[3] shrink-0" />
            <span className="tracking-wide">{t.actions.newJob}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="max-w-7xl mx-auto px-2 sm:px-6 border-t border-slate-800/80 py-1 w-full min-w-0">
        {/* Mobile View: 5 Primary Tabs + "More" Menu */}
        <div className="flex md:hidden items-center justify-between gap-1 w-full min-w-0">
          {primaryMobileTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setIsMoreOpen(false);
                }}
                className={`flex-1 min-w-0 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-1 py-1.5 rounded-lg text-[11px] font-bold transition-all relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate max-w-[58px] sm:max-w-none">{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={`text-[9px] font-black px-1 rounded-full ${
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

          {/* More Menu Dropdown for Mobile */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              aria-expanded={isMoreOpen}
              aria-controls="mobile-more-menu"
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                isMoreActive || isMoreOpen
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
              <span>{lang === 'th' ? 'เพิ่มเติม' : 'More'}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isMoreOpen && createPortal(
              <div className="fixed inset-0 z-[100] flex items-end bg-slate-950/55 md:hidden" onClick={() => setIsMoreOpen(false)}>
                <div id="mobile-more-menu" role="menu" aria-label={lang === 'th' ? 'เมนูเพิ่มเติม' : 'More menu'}
                  className="w-full max-h-[75dvh] overflow-y-auto rounded-t-2xl bg-slate-900 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
                  onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between px-2 pb-2 text-sm font-bold text-white">
                  <span>{lang === 'th' ? 'เพิ่มเติม' : 'More'}</span>
                  <button type="button" onClick={() => setIsMoreOpen(false)} className="rounded-lg px-3 py-2 text-slate-300" aria-label={lang === 'th' ? 'ปิดเมนู' : 'Close menu'}>✕</button>
                </div>
                {secondaryTabs.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        setIsMoreOpen(false);
                      }}
                      role="menuitem"
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                {onOpenMollyExpress && (
                  <div className="border-t border-slate-800 mt-1 pt-1">
                    <button
                      onClick={() => {
                        onOpenMollyExpress();
                        setIsMoreOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-slate-800 text-left cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{lang === 'th' ? 'Molly · ออกใบเสนอราคาด่วน' : 'Molly Express Quote'}</span>
                    </button>
                  </div>
                )}
                </div>
              </div>, document.body
            )}
          </div>
        </div>

        {/* Desktop View: All Tabs Visible in Flow */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[...primaryMobileTabs, ...secondaryTabs].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
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
        </div>
      </nav>
    </header>
  );
};
