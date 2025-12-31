import React, { useState } from 'react';

interface NCResponseDrafterProps {
  onDraft: (finding: string) => void;
  onClose: () => void;
}

const NCResponseDrafter: React.FC<NCResponseDrafterProps> = ({ onDraft, onClose }) => {
  const [finding, setFinding] = useState('');

  const handleSubmit = () => {
    if (finding.trim()) {
      onDraft(finding);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-amber-600 dark:bg-amber-700 p-6 text-white relative">
          <div className="flex items-center gap-3 relative z-10">
            <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
            <div>
              <h3 className="text-xl font-bold">NC Response Drafter</h3>
              <p className="text-[10px] text-amber-100 dark:text-amber-200 font-bold uppercase mt-1">Audit Remediation Assistant</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-white transition-all"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="p-8">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Paste an <strong>Auditor Finding</strong> or <strong>Non-Conformity (NC)</strong> below. The AI will draft a professional management response including root cause analysis and corrective action plans tailored to RSPO standards.
          </p>
          <div className="space-y-4">
            <textarea 
              value={finding}
              onChange={(e) => setFinding(e.target.value)}
              placeholder="Example: Missing training records for pesticide applicators in Block B..."
              className="w-full h-40 px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 outline-none resize-none transition-all text-slate-900 dark:text-slate-100"
            />
            <button 
              onClick={handleSubmit}
              disabled={!finding.trim()}
              className="w-full bg-slate-900 dark:bg-amber-700 hover:bg-slate-800 dark:hover:bg-amber-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <i className="fa-solid fa-wand-magic-sparkles text-amber-400"></i>
              Draft Management Response
            </button>
          </div>
          <div className="mt-4 text-center">
             <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">Context from your Document Vault will be used if available.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NCResponseDrafter;