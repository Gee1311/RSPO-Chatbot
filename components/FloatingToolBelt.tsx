
import React, { useState } from 'react';
import { ModalType } from '../types';

interface FloatingToolBeltProps {
  onShowModal: (type: ModalType) => void;
}

const FloatingToolBelt: React.FC<FloatingToolBeltProps> = ({ onShowModal }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleShareWorkspace = async () => {
    const isUrlValid = window.location.href.startsWith('http');
    const shareData: ShareData = {
      title: 'RSPO Compliance Assistant',
      text: 'Check out the RSPO Compliance AI tool for audits and plantation management.',
    };

    if (isUrlValid) shareData.url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.warn('Share failed:', err);
        if (isUrlValid) {
          navigator.clipboard.writeText(window.location.href);
          alert("Workspace link copied to clipboard!");
        }
      }
    } else {
      if (isUrlValid) {
        navigator.clipboard.writeText(window.location.href);
        alert("Workspace link copied to clipboard!");
      }
    }
  };

  return (
    <div className="fixed right-4 top-36 z-[150] flex items-center pointer-events-none">
      {/* Round Handle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto w-14 h-14 bg-emerald-800 dark:bg-emerald-900 text-white rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/20 ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
        aria-label="Open Audit Tools"
      >
        <i className="fa-solid fa-briefcase text-xl"></i>
      </button>

      {/* Tool Belt Expanded Menu */}
      <div className={`
        fixed right-4 top-36 pointer-events-auto flex flex-col gap-3 p-3 bg-emerald-800/95 dark:bg-emerald-950/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] border border-white/20 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${isOpen ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-12 opacity-0 scale-90 pointer-events-none'}
      `}>
        <div className="flex flex-col gap-2.5">
          {/* Action Buttons */}
          <button 
            onClick={() => { onShowModal('vault'); setIsOpen(false); }}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all group relative border border-white/5"
          >
            <i className="fa-solid fa-vault text-base"></i>
            <span className="absolute right-full mr-4 px-2 py-1 bg-slate-900 text-white text-[9px] rounded font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10 whitespace-nowrap">Vault</span>
          </button>

          <button 
            onClick={() => { onShowModal('checklist'); setIsOpen(false); }}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all group relative border border-white/5"
          >
            <i className="fa-solid fa-list-check text-base"></i>
            <span className="absolute right-full mr-4 px-2 py-1 bg-slate-900 text-white text-[9px] rounded font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10 whitespace-nowrap">Checklist</span>
          </button>

          <button 
            onClick={() => { onShowModal('nc-drafter'); setIsOpen(false); }}
            className="w-12 h-12 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center transition-all shadow-lg group relative border border-amber-400/20"
          >
            <i className="fa-solid fa-wand-magic-sparkles text-base"></i>
            <span className="absolute right-full mr-4 px-2 py-1 bg-slate-900 text-white text-[9px] rounded font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10 whitespace-nowrap">NC Drafter</span>
          </button>

          <button 
            onClick={() => { handleShareWorkspace(); setIsOpen(false); }}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all group relative border border-white/5"
          >
            <i className="fa-solid fa-share-nodes text-base"></i>
            <span className="absolute right-full mr-4 px-2 py-1 bg-slate-900 text-white text-[9px] rounded font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10 whitespace-nowrap">Share</span>
          </button>

          <div className="h-px bg-white/10 my-1 mx-1"></div>

          <button 
            onClick={() => setIsOpen(false)}
            className="w-12 h-10 rounded-xl bg-black/30 hover:bg-black/50 text-white/50 hover:text-white flex items-center justify-center transition-all"
          >
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
