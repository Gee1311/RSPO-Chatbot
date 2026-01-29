
import React, { useState, useEffect } from 'react';
import { ModalType, User } from '../types';

interface FloatingToolBeltProps {
  user: User;
  onShowModal: (type: ModalType, tab?: any) => void;
}

const FloatingToolBelt: React.FC<FloatingToolBeltProps> = ({ user, onShowModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  
  // Premium tools threshold: Professional and above
  const isLimited = user.tier === 'Free' || user.tier === 'Starter';

  useEffect(() => {
    if (showNotice) {
      const timer = setTimeout(() => setShowNotice(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showNotice]);

  const handleMainClick = () => {
    if (isLimited) {
      setShowNotice(true);
      return;
    }
    setIsOpen(true);
  };

  const handleToolClick = (type: ModalType) => {
    onShowModal(type);
    setIsOpen(false);
  };

  const handleShareWorkspace = async () => {
    const text = 'RSPO Compliance Assistant - Professional AI for Auditors';
    if (navigator.share) {
      try { await navigator.share({ title: 'RSPO AI', text, url: window.location.href }); } catch { }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed right-6 bottom-44 z-[150] no-print">
        <button 
          onClick={handleMainClick}
          className={`w-14 h-14 bg-emerald-800 dark:bg-emerald-900 text-white rounded-full shadow-[0_15px_35px_-5px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 border-2 border-white/20 hover:border-emerald-400 group overflow-hidden ${isOpen ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <i className={`fa-solid ${isLimited ? 'fa-lock' : 'fa-toolbox'} text-xl relative z-10`}></i>
        </button>
      </div>

      {/* Slide-in Premium Notice (For Free/Starter Users) */}
      <div className={`fixed top-24 right-0 z-[200] transition-transform duration-500 ease-out flex items-center pointer-events-none ${showNotice ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="pointer-events-auto mr-4 px-6 py-4 bg-slate-900 dark:bg-emerald-950 text-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-emerald-500/30 flex items-center gap-4 max-w-xs xs:max-w-sm">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0">
            <i className="fa-solid fa-crown text-xl"></i>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Intelligence Refill Required</p>
            <p className="text-xs font-bold text-slate-100 leading-tight mb-2">The Digital Toolbox is reserved for Professional and Enterprise tiers.</p>
            <button 
              onClick={() => { onShowModal('settings', 'billing'); setShowNotice(false); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
            >
              View Refill Options
            </button>
          </div>
          <button onClick={() => setShowNotice(false)} className="text-slate-500 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      {/* Compliance Control Center Sidebar (For Pro/Enterprise Users) */}
      <div 
        className={`fixed inset-0 z-[200] transition-opacity duration-500 no-print ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={() => setIsOpen(false)}></div>
        
        <aside className={`absolute top-0 right-0 bottom-0 w-80 md:w-96 bg-emerald-900/95 dark:bg-emerald-950/98 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-white/10 transition-transform duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <header className="p-8 border-b border-white/5 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Digital Toolbox</h2>
              <p className="text-[10px] text-emerald-300 font-black uppercase tracking-[0.2em] mt-1">Refined Auditor Suite</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-all active:scale-90"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
            <div className="grid grid-cols-1 gap-4">
              {/* Document Vault Tile */}
              <button 
                onClick={() => handleToolClick('vault')}
                className="group p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] text-left transition-all hover:scale-[1.02] active:scale-95 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <i className="fa-solid fa-vault text-4xl text-white"></i>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/30">
                  <i className="fa-solid fa-vault text-xl"></i>
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">Document Vault</h3>
                <p className="text-[10px] text-emerald-200/60 font-medium leading-relaxed">OCR-powered digitization of SOPs and site policies for compliance context.</p>
              </button>

              {/* Smart Checklist Tile */}
              <button 
                onClick={() => handleToolClick('checklist')}
                className="group p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] text-left transition-all hover:scale-[1.02] active:scale-95 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <i className="fa-solid fa-list-check text-4xl text-white"></i>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-4 border border-blue-500/30">
                  <i className="fa-solid fa-list-check text-xl"></i>
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">Smart Checklist</h3>
                <p className="text-[10px] text-blue-200/60 font-medium leading-relaxed">Context-aware audit point generation and high-resolution PDF reporting.</p>
              </button>

              {/* NC Drafter Tile */}
              <button 
                onClick={() => handleToolClick('nc-drafter')}
                className="group p-5 bg-amber-600/90 hover:bg-amber-600 border border-amber-400/30 rounded-[2rem] text-left transition-all hover:scale-[1.02] active:scale-95 relative overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <i className="fa-solid fa-wand-magic-sparkles text-4xl text-white"></i>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-4 border border-white/30">
                  <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">NC Drafter Pro</h3>
                <p className="text-[10px] text-amber-50 font-medium leading-relaxed">Transform audit findings into professional management responses with root cause analysis.</p>
              </button>

              {/* Share Tile */}
              <button 
                onClick={handleShareWorkspace}
                className="group p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-left transition-all flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-slate-500/20 rounded-xl flex items-center justify-center text-slate-300">
                  <i className="fa-solid fa-share-nodes text-sm"></i>
                </div>
                <div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Share Workspace</h3>
                  <p className="text-[9px] text-slate-400 font-bold">Collaborate with your audit team</p>
                </div>
              </button>
            </div>
          </div>

          <footer className="p-8 border-t border-white/5 bg-black/10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <i className="fa-solid fa-shield-check text-emerald-400"></i>
              </div>
              <div>
                <p className="text-[10px] font-black text-white uppercase tracking-widest">{user.tier} Account</p>
                <p className="text-[9px] text-emerald-300/50 font-bold">Secure Intelligence Environment</p>
              </div>
            </div>
          </footer>
        </aside>
      </div>
    </>
  );
};

export default FloatingToolBelt;
