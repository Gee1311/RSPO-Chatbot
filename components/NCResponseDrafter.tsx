
import React, { useState, useEffect } from 'react';
import { Standard, Language, PolicyDocument, NCDraftRecord, User } from '../types';
import { generateNCDraft } from '../services/geminiService';

interface NCResponseDrafterProps {
  standard: Standard;
  language: Language;
  policies: PolicyDocument[];
  user: User;
  onClose: () => void;
}

const NCResponseDrafter: React.FC<NCResponseDrafterProps> = ({ standard, language, policies, user, onClose }) => {
  const [view, setView] = useState<'input' | 'review' | 'history'>('input');
  const [finding, setFinding] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDraft, setActiveDraft] = useState<NCDraftRecord | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<NCDraftRecord[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  const storageKey = 'rspo_nc_history';

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setSavedDrafts(JSON.parse(saved));
  }, []);

  const handleGenerate = async () => {
    if (!finding.trim()) return;
    setIsGenerating(true);
    try {
      const draft = await generateNCDraft(finding, standard, language, policies);
      const newRecord: NCDraftRecord = {
        id: `nc-${Date.now()}`,
        originalFinding: finding,
        standardShortName: standard.shortName,
        observation: draft.observation,
        requirement: draft.requirement,
        rootCause: draft.rootCause,
        correctiveAction: draft.correctiveAction,
        preventionPlan: draft.preventionPlan,
        timestamp: Date.now(),
        status: 'Draft'
      };
      setActiveDraft(newRecord);
      setView('review');
    } catch (err: any) {
      alert(err.message || "Failed to generate NC draft.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveRecord = (finalize = false) => {
    if (!activeDraft) return;
    const record: NCDraftRecord = { ...activeDraft, status: finalize ? 'Finalized' : 'Draft' };
    const updated = [record, ...savedDrafts.filter(d => d.id !== record.id)];
    setSavedDrafts(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);

    if (finalize) {
      setTimeout(() => setView('history'), 1000);
    }
  };

  const handleExportPDF = () => {
    if (!activeDraft) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>RSPO Non-Conformity Management Response</title>
        <style>
          @page { 
            size: A4; 
            margin: 1.5cm;
          }
          body { 
            font-family: 'Inter', -apple-system, sans-serif; 
            padding: 0; 
            color: #1e293b; 
            line-height: 1.5; 
            font-size: 11px;
            counter-reset: page;
          }
          .header { border-bottom: 3px solid #b45309; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 18px; font-weight: 900; color: #78350f; margin: 0; text-transform: uppercase; letter-spacing: -0.01em; }
          .meta { font-size: 9px; color: #64748b; font-weight: 600; }
          .section { margin-bottom: 14px; page-break-inside: avoid; }
          .label { font-size: 8px; font-weight: 900; color: #b45309; text-transform: uppercase; letter-spacing: 0.12em; display: block; margin-bottom: 4px; }
          .content { background: #fffbeb; border: 1px solid #fef3c7; padding: 10px; border-radius: 6px; font-size: 10px; color: #451a03; }
          .finding { background: #f8fafc; border-left: 3px solid #cbd5e1; border-top: none; border-right: none; border-bottom: none; color: #475569; font-style: italic; }
          
          /* Footer with page numbering */
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 30px;
            font-size: 8px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 6px;
            background: white;
          }
          
          /* CSS for dynamic page numbers (supported by modern print engines) */
          .page-count:after { content: "Page " counter(page); }
          
          @media print {
            .footer { position: fixed; bottom: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">NC Management Response</h1>
            <div class="meta">REF: ${activeDraft.id} | Auditee: ${user.organization || user.name}</div>
          </div>
          <div class="meta" style="text-align: right;">
            Standard: ${activeDraft.standardShortName}<br>
            Generated: ${new Date().toLocaleDateString()}
          </div>
        </div>

        <div class="section">
          <span class="label">Auditor's Original Finding</span>
          <div class="content finding">${activeDraft.originalFinding}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
           <div class="section">
            <span class="label">Refined Observation</span>
            <div class="content">${activeDraft.observation}</div>
          </div>
          <div class="section">
            <span class="label">Indicator Correlation</span>
            <div class="content">${activeDraft.requirement}</div>
          </div>
        </div>

        <div class="section">
          <span class="label">Root Cause Analysis (RCA)</span>
          <div class="content">${activeDraft.rootCause}</div>
        </div>

        <div class="section">
          <span class="label">Corrective Action (Immediate Response)</span>
          <div class="content">${activeDraft.correctiveAction}</div>
        </div>

        <div class="section">
          <span class="label">Systemic Prevention Plan (Long-term)</span>
          <div class="content">${activeDraft.preventionPlan}</div>
        </div>

        <div class="footer">
          <div>RSPO Intelligence Hub • Secure Workspace Analysis</div>
          <div class="page-count"></div>
        </div>

        <script>window.onload = () => { setTimeout(() => window.print(), 500); };</script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const deleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this NC record?")) return;
    const updated = savedDrafts.filter(d => d.id !== id);
    setSavedDrafts(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      
      {/* Success Toast */}
      {showSaveToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <i className="fa-solid fa-circle-check"></i>
          <span className="text-xs font-black uppercase tracking-widest">Record Saved to Library</span>
        </div>
      )}

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="bg-amber-600 dark:bg-amber-700 p-6 text-white flex justify-between items-center shrink-0 shadow-lg relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <i className="fa-solid fa-wand-magic-sparkles text-2xl text-amber-200"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold leading-none">NC Drafter Pro</h3>
              <p className="text-[10px] text-amber-100 font-bold uppercase tracking-widest mt-1.5">Management Response Suite</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setView('input'); setFinding(''); setActiveDraft(null); }} 
              className="w-10 h-10 rounded-full bg-amber-500/50 hover:bg-amber-400/50 flex items-center justify-center transition-all text-white border border-white/10"
              title="New finding"
            >
              <i className="fa-solid fa-plus"></i>
            </button>
            <button 
              onClick={() => setView('history')} 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border border-white/10 ${view === 'history' ? 'bg-white text-amber-700' : 'bg-amber-500/50 text-white hover:bg-amber-400/50'}`}
              title="Archive"
            >
              <i className="fa-solid fa-box-archive"></i>
            </button>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-all ml-2">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950/20">
          <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
            {view === 'input' && (
              <div className="space-y-8 py-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-amber-600">
                      <i className="fa-solid fa-comment-dots"></i>
                    </div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Audit Finding Input</h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                    Paste the non-conformity text exactly as provided by the auditor.
                  </p>
                  <textarea 
                    value={finding}
                    onChange={(e) => setFinding(e.target.value)}
                    placeholder="e.g., 'Evidence of riparian zone encroachment was noted...'"
                    className="w-full h-44 px-5 py-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none transition-all text-slate-900 dark:text-slate-100"
                  />
                  
                  <button 
                    onClick={handleGenerate}
                    disabled={!finding.trim() || isGenerating}
                    className="w-full mt-8 bg-slate-900 dark:bg-amber-700 hover:bg-amber-800 disabled:bg-slate-200 text-white font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                  >
                    {isGenerating ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-microchip text-amber-400"></i>}
                    {isGenerating ? "Synthesizing Professional Defense..." : "Generate Professional Response"}
                  </button>
                </div>
              </div>
            )}

            {view === 'review' && activeDraft && (
              <div className="space-y-4 animate-in zoom-in-95 duration-500 max-w-xl mx-auto pb-12">
                <div className="bg-amber-50 dark:bg-amber-950/40 p-5 rounded-[1.5rem] border border-amber-200 dark:border-amber-800 shadow-sm">
                   <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-black uppercase text-amber-600 tracking-widest">Official Audit Finding</span>
                      <button onClick={() => setIsEditing(!isEditing)} className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-tighter hover:underline">
                        {isEditing ? "Acknowledge" : "Edit Report"}
                      </button>
                   </div>
                   <p className="text-[11px] italic text-amber-900/70 dark:text-amber-100/70 leading-relaxed font-medium">"{activeDraft.originalFinding}"</p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Observation Summary', key: 'observation', icon: 'fa-eye' },
                    { label: 'Compliance Requirement', key: 'requirement', icon: 'fa-book-bookmark' },
                    { label: 'Root Cause Analysis (RCA)', key: 'rootCause', icon: 'fa-magnifying-glass-chart' },
                    { label: 'Corrective Action', key: 'correctiveAction', icon: 'fa-bolt-lightning' },
                    { label: 'Systemic Prevention Plan', key: 'preventionPlan', icon: 'fa-shield-halved' },
                  ].map((section) => (
                    <div key={section.key} className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] shadow-sm relative group">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 text-[10px] shadow-inner">
                          <i className={`fa-solid ${section.icon}`}></i>
                        </div>
                        <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400">{section.label}</h5>
                      </div>
                      {isEditing ? (
                        <textarea 
                          value={activeDraft[section.key as keyof NCDraftRecord] as string}
                          onChange={(e) => setActiveDraft({ ...activeDraft, [section.key]: e.target.value })}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] outline-none focus:ring-1 focus:ring-amber-500 min-h-[80px] text-slate-800 dark:text-slate-100"
                        />
                      ) : (
                        <p className="text-[13px] text-slate-800 dark:text-slate-100 leading-relaxed font-medium">{activeDraft[section.key as keyof NCDraftRecord] as string}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'history' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500 max-w-xl mx-auto">
                 <div className="flex items-center justify-between mb-2 px-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saved Records Library</h4>
                    <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">{savedDrafts.length}</span>
                 </div>
                 {savedDrafts.length > 0 ? (
                   savedDrafts.map(draft => (
                     <button 
                      key={draft.id} 
                      onClick={() => { setActiveDraft(draft); setView('review'); }}
                      className="w-full text-left p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl hover:border-amber-500 transition-all shadow-sm flex items-center justify-between group"
                     >
                       <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${draft.status === 'Finalized' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                           <i className={`fa-solid ${draft.status === 'Finalized' ? 'fa-check-double' : 'fa-file-signature'} text-lg`}></i>
                         </div>
                       <div className="min-w-0">
                         <h5 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">{draft.originalFinding}</h5>
                         <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${draft.status === 'Finalized' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>{draft.status}</span>
                            <p className="text-[9px] text-slate-400 font-bold">{new Date(draft.timestamp).toLocaleDateString()}</p>
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <button onClick={(e) => deleteDraft(draft.id, e)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all">
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                        <i className="fa-solid fa-chevron-right text-slate-300 group-hover:translate-x-1 transition-transform"></i>
                     </div>
                   </button>
                 ))
               ) : (
                 <div className="py-20 text-center">
                    <i className="fa-solid fa-folder-open text-5xl text-slate-100 dark:text-slate-800 mb-6"></i>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Archive is empty</p>
                 </div>
               )}
            </div>
          )}
          </main>

          {/* Persistent Footer Actions for Review View */}
          {view === 'review' && activeDraft && (
            <footer className="shrink-0 p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-8px_20px_rgba(0,0,0,0.05)] z-20">
              <div className="max-w-xl mx-auto flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => saveRecord(false)} 
                    className="py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 border border-slate-200 dark:border-slate-700"
                  >
                    Save Draft
                  </button>
                  <button 
                    onClick={() => saveRecord(true)} 
                    className="py-3.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:bg-emerald-700 active:scale-95"
                  >
                    Finalize Report
                  </button>
                </div>
                <button 
                  onClick={handleExportPDF} 
                  className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95"
                >
                  <i className="fa-solid fa-file-pdf text-rose-500"></i>
                  Export Optimized Portrait Report
                </button>
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
};

export default NCResponseDrafter;
