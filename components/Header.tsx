
import React, { useState } from 'react';
import StandardSelector from './StandardSelector';
import LanguageSelector from './LanguageSelector';
import { Standard, User, ModalType, Language } from '../types';

interface HeaderProps {
  activeStandard: Standard;
  language: Language;
  user: User;
  theme: 'light' | 'dark';
  onStandardChange: (std: Standard) => void;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
  onShowModal: (type: ModalType) => void;
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

  return (
    <header className="bg-emerald-800 dark:bg-emerald-950 text-white shadow-md relative z-[100]">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2 relative">
          
          {/* Menu & Logo Section */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <button 
              onClick={() => onShowModal('history')}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-all active:scale-90"
              aria-label="Toggle Menu"
            >
              <i className="fa-solid fa-bars text-xl"></i>
            </button>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-white dark:bg-slate-100 p-1.5 rounded-lg shadow-inner">
                <i className="fa-solid fa-seedling text-emerald-800 text-base md:text-xl"></i>
              </div>
              <div className="hidden xs:block text-left">
                <h1 className="font-bold text-sm md:text-lg leading-none">RSPO Chatbot</h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[8px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-md border ${
                    user.tier === 'Enterprise Pro' 
                      ? 'bg-emerald-400/20 border-emerald-400 text-emerald-300' 
                      : 'bg-slate-700/50 border-slate-500 text-slate-300'
                  }`}>
                    {user.tier}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
            <div className="flex items-center gap-2">
              {/* Pro Upgrade Button - Visible for Free tier users */}
              {user.tier === 'Free' && (
                <button 
                  onClick={() => onShowModal('settings')}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white px-3 py-1.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-900/30 transition-all active:scale-95 border border-amber-300/30 animate-pulse-slow"
                >
                  <i className="fa-solid fa-crown text-[8px] md:text-[10px]"></i>
                  <span className="hidden sm:inline">Upgrade</span>
                  <span className="sm:hidden">Pro</span>
                </button>
              )}

              <button
                onClick={onToggleTheme}
                className="w-8 h-8 rounded-lg bg-emerald-900/60 hover:bg-emerald-700/80 flex items-center justify-center transition-all border border-emerald-500/30 shadow-sm"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'} text-[10px]`}></i>
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
                className="flex items-center gap-2 bg-emerald-900/60 hover:bg-emerald-700/80 p-1 pr-2 rounded-full border border-emerald-500/40 transition-all shadow-sm active:scale-95"
                aria-label="User Profile"
              >
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                  alt={user.name} 
                  className="w-6 h-6 rounded-full border-2 border-emerald-400/50 object-cover" 
                />
                <i className={`fa-solid fa-chevron-down text-[8px] text-emerald-300 transition-transform ${showProfile ? 'rotate-180' : ''}`}></i>
              </button>

              {showProfile && (
                <>
                  <div className="fixed inset-0 z-[190]" onClick={() => setShowProfile(false)}></div>
                  <div 
                    className="fixed right-4 md:right-[calc(50%-28rem)] top-16 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-slate-800 py-2 z-[200] animate-in fade-in zoom-in slide-in-from-top-2 duration-200"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 mb-2">
                        <img 
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                          alt={user.name} 
                          className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700" 
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate uppercase tracking-tighter">{user.role}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                    </div>
                    
                    <div className="py-1">
                      <div className="xs:hidden border-b border-slate-100 dark:border-slate-800 pb-2 mb-1 px-4 pt-2">
                         <p className="text-[9px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Preferences</p>
                         <div className="flex flex-col gap-2">
                           <LanguageSelector current={language} onSelect={onLanguageChange} />
                           <StandardSelector selectedId={activeStandard.id} onSelect={onStandardChange} />
                         </div>
                      </div>
                      <button 
                        onClick={() => { onShowModal('settings'); setShowProfile(false); }} 
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
                      >
                        <i className="fa-solid fa-gear text-emerald-600 w-4 text-center"></i> Account Settings
                      </button>
                      <button 
                        onClick={() => { onExportHistory(); setShowProfile(false); }} 
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
                      >
                        <i className="fa-solid fa-file-export text-slate-400 w-4 text-center"></i> Export Audit Log
                      </button>
                      <button 
                        onClick={() => { onClearHistory(); setShowProfile(false); }} 
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-3"
                      >
                        <i className="fa-solid fa-eraser text-rose-400 w-4 text-center"></i> Clear History
                      </button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 py-1">
                      <button onClick={() => { onShowModal('contact'); setShowProfile(false); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3">
                        <i className="fa-solid fa-headset text-slate-400 w-4 text-center"></i> Support Center
                      </button>
                      <button onClick={onLogout} className="w-full text-left px-4 py-2 text-xs text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 font-bold">
                        <i className="fa-solid fa-right-from-bracket text-rose-500 w-4 text-center"></i> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </header>
  );
};

export default Header;
