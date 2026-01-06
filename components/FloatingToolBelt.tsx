
import React, { useState } from 'react';
import { ModalType, User } from '../types';

interface FloatingToolBeltProps {
  user: User;
  onShowModal: (type: ModalType) => void;
}

const FloatingToolBelt: React.FC<FloatingToolBeltProps> = ({ user, onShowModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isLimited = user.tier !== 'Enterprise Pro';

  const handleShareWorkspace = async () => {
    const text = 'RSPO Compliance Assistant - Enterprise AI for Auditors';
    if (navigator.share) {
      try { await navigator.share({ title: 'RSPO AI', text, url: window.location.href }); } catch { }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="fixed right-4 top-36 z-[150] flex items-center pointer-events-none">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto w-14 h-14 bg-emerald-800 dark:bg-emerald-900 text-white rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/20 ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
      >
        <i className="fa-solid fa-briefcase text-xl"></i>
      </button>

      <div className={`
        fixed right-4 top-36 pointer-events-auto flex flex-col gap-3 p-3 bg-emerald-800/95 dark:bg-emerald-950/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] border border-white/20 transition-all duration-500
        ${isOpen ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-12 opacity-0 scale-90 pointer-events-none'}
      `}>
        <div className="flex flex-col gap-2.5">
          <button 
            onClick={() => { onShowModal('vault'); setIsOpen(false); }}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all group relative border border-white/5"
          >
            <i className={`fa-solid ${isLimited ? 'fa-lock text-white/30 text-[10px] absolute top-1 right-1' : ''} fa-vault text-base`}></i>
            <span className="absolute right-full mr-4 px-2 py-1 bg-slate-900 text-white text-[9px] rounded font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10 whitespace-nowrap">Vault</span>
          </button>

          <button 
            onClick={() => { onShowModal('checklist'); setIsOpen(false); }}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all group relative border border-white/5"
          >
             <i className={`fa-solid ${isLimited ? 'fa-lock text-white/30 text-[10px] absolute top-1 right-1' : ''} fa-list-check text-base`}></i>
            <span className="absolute right-full mr-4 px-2 py-1 bg-slate-900 text-white text-[9px] rounded font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10 whitespace-nowrap">Checklist</span>
          </button>

          <button 
            onClick={() => { onShowModal('nc-drafter'); setIsOpen(false); }}
            className={`w-12 h-12 rounded-2xl ${isLimited ? 'bg-slate-700' : 'bg-amber-600 hover:bg-amber-500'} text-white flex items-center justify-center transition-all shadow-lg group relative border border-white/5`}
          >
            <i className={`fa-solid ${isLimited ? 'fa-lock text-white/30 text-[10px] absolute top-1 right-1' : ''} fa-wand-magic-sparkles text-base`}></i>
            <span className="absolute right-full mr-4 px-2 py-1 bg-slate-900 text-white text-[9px] rounded font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10 whitespace-nowrap">NC Drafter</span>
          </button>

          <button onClick={() => { handleShareWorkspace(); setIsOpen(false); }} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all group relative border border-white/5">
            <i className="fa-solid fa-share-nodes text-base"></i>
            <span className="absolute right-full mr-4 px-2 py-1 bg-slate-900 text-white text-[9px] rounded font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10 whitespace-nowrap">Share</span>
          </button>

          <div className="h-px bg-white/10 my-1 mx-1"></div>

          <button onClick={() => setIsOpen(false)} className="w-12 h-10 rounded-xl bg-black/30 hover:bg-black/50 text-white/50 hover:text-white flex items-center justify-center transition-all">
            <i className="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>
      </div>
      
      {isOpen && (
        <div className="fixed inset-0 -z-10 bg-black/5 pointer-events-auto" onClick={() => setIsOpen(false)}></div>
      )}
    </div>
  );
};

export default FloatingToolBelt;
