
import React, { useState } from 'react';
import StandardSelector from './StandardSelector';
import LanguageSelector from './LanguageSelector';
import { Standard, User, ModalType, Language, SettingsTab } from '../types';
import { NATIONAL_INTERPRETATIONS } from '../constants';

interface HeaderProps {
  activeStandard: Standard;
  language: Language;
  user: User;
  theme: 'light' | 'dark';
  onStandardChange: (std: Standard) => void;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
  onShowModal: (type: ModalType, tab?: SettingsTab) => void;
  onClearHistory: () => void;
  onExportHistory: () => void;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  activeStandard, 
  language,
  user, 
  theme,
  onStandardChange, 
  onLanguageChange,
  onLogout, 
  onShowModal,
  onClearHistory,
  onExportHistory,
  onToggleTheme
}) => {
  const [showProfile, setShowProfile] = useState(false);

  const getTierStyles = (tier: string) => {
    switch (tier) {
      case 'Enterprise':
        return 'bg-emerald-400/20 border-emerald-400 text-emerald-300';
      case 'Professional':
        return 'bg-amber-400/20 border-amber-400 text-amber-300';
      case 'Starter':
        return 'bg-blue-400/20 border-blue-400 text-blue-300';
      default:
        return 'bg-slate-700/50 border-slate-500 text-slate-300';
    }
  };

  const activeNI = NATIONAL_INTERPRETATIONS.find(ni => ni.id === user.nationalInterpretations[0]);

  return (
    <header className="bg-emerald-800 dark:bg-emerald-950 text-white shadow-md relative z-[100] no-print">
      <div className="w-full px-6 md:px-8 py-3">
        <div className="flex items-center justify-between gap-4 relative">
          
          {/* Menu & Logo Section */}
          <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
            <button 
              onClick={() => onShowModal('history')}
              className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-all active:scale-90"
              aria-label="Toggle Menu"
            >
              <i className="fa-solid fa-bars text-xl"></i>
            </button>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-white dark:bg-slate-100 p-2 rounded-xl shadow-inner">
                <i className="fa-solid fa-seedling text-emerald-800 text-xl md:text-2xl"></i>
              </div>
              <div className="hidden xs:block text-left">
                <h1 className="font-black text-sm md:text-lg leading-none tracking-tight">RSPO Chat</h1>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border ${getTierStyles(user.tier)}`}>
                      {user.tier}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 justify-end">
            <div className="flex items-center gap-2 md:gap-3">
              {/* Refill / Upgrade Button - NOW DIRECTLY TRIGGERS PAYMENT */}
              <button
                onClick={() => onShowModal('payment')}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl shadow-lg shadow-amber-900/20 transition-all active:scale-95 group border border-white/20"
                title="Refill Intelligence Pack"
              >
                <i className="fa-solid fa-crown text-[10px] md:text-xs animate-pulse"></i>
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Refill Tokens</span>
              </button>

              <button
                onClick={onToggleTheme}
                className="w-9 h-9 rounded-xl bg-emerald-900/60 hover:bg-emerald-700/80 flex items-center justify-center transition-all border border-emerald-500/30 shadow-sm"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'} text-xs`}></i>
              </button>
              
              <div className="hidden xs:flex items-center gap-2">
                <LanguageSelector current={language} onSelect={onLanguageChange} />
                <StandardSelector selectedId={activeStandard.id} onSelect={onStandardChange} />
              </div>
            </div>

            {/* Profile Section */}
            <div className="relative">
              <button 
                id="profile-trigger"
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-3 bg-emerald-900/60 hover:bg-emerald-700/80 p-1 rounded-full border border-emerald-500/40 transition-all shadow-sm active:scale-95"
                aria-label="User Profile"
              >
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full border border-emerald-400/50 object-cover" 
                />
              </button>

              {showProfile && (
                <>
                  <div className="fixed inset-0 z-[190]" onClick={() => setShowProfile(false)}></div>
                  <div 
                    className="fixed right-4 md:right-8 top-16 w-72 bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-800 py-3 z-[200] animate-in fade-in zoom-in slide-in-from-top-2 duration-250"
                  >
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-4 mb-3">
                        <img 
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                          alt={user.name} 
                          className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md" 
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate uppercase tracking-widest font-bold mt-0.5">{user.role}</p>
                        </div>
                      </div>
                      {activeNI && (
                        <a 
                          href={activeNI.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="mt-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800 flex items-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors group"
                        >
                           <i className="fa-solid fa-earth-asia text-emerald-600 dark:text-emerald-400 text-[10px]"></i>
                           <p className="text-[9px] font-black text-emerald-800 dark:text-emerald-200 uppercase truncate flex-1">{activeNI.name}</p>
                           <i className="fa-solid fa-arrow-up-right-from-square text-[7px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                        </a>
                      )}
                    </div>
                    
                    <div className="py-2">
                      <button 
                        onClick={() => { onShowModal('settings'); setShowProfile(false); }} 
                        className="w-full text-left px-5 py-3 text-xs text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-4 font-bold"
                      >
                        <i className="fa-solid fa-gear text-emerald-600 w-5 text-center text-sm"></i> Account Settings
                      </button>
                      <button 
                        onClick={() => { onShowModal('payment'); setShowProfile(false); }} 
                        className="w-full text-left px-5 py-3 text-xs text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors flex items-center gap-4 font-bold"
                      >
                        <i className="fa-solid fa-credit-card text-amber-500 w-5 text-center text-sm"></i> Refill Intelligence
                      </button>
                      <button 
                        onClick={() => { onExportHistory(); setShowProfile(false); }} 
                        className="w-full text-left px-5 py-3 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-4 font-bold"
                      >
                        <i className="fa-solid fa-file-export text-slate-400 w-5 text-center text-sm"></i> Export Compliance Log
                      </button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 py-2">
                      <button onClick={onLogout} className="w-full text-left px-5 py-3 text-xs text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-4 font-black uppercase tracking-widest mt-1">
                        <i className="fa-solid fa-right-from-bracket text-rose-500 w-5 text-center text-sm"></i> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
