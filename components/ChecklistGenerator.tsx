
import React, { useState, useMemo, useEffect } from 'react';
import { Standard, Language, RSPOClause, ChecklistItem, User, SavedAudit } from '../types';
import { MOCK_KNOWLEDGE_BASE } from '../constants';
import { generateAuditChecklist, selectRelevantClauses } from '../services/geminiService';

interface ChecklistGeneratorProps {
  activeStandard: Standard;
  language: Language;
  user: User;
  onClose: () => void;
}

interface SavedDraft {
  standardId: string;
  items: ChecklistItem[];
  timestamp: number;
  auditPrompt?: string;
}

const ChecklistGenerator: React.FC<ChecklistGeneratorProps> = ({ activeStandard, language, user, onClose }) => {
  const [view, setView] = useState<'generator' | 'history' | 'review'>('generator');
  const [auditPrompt, setAuditPrompt] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [auditName, setAuditName] = useState('');
  const [savedAudits, setSavedAudits] = useState<SavedAudit[]>([]);
  const [activeReviewAudit, setActiveReviewAudit] = useState<SavedAudit | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);

  const draftKey = `rspo_checklist_draft_${activeStandard.id}`;
  const historyKey = 'rspo_audit_history';

  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    setHasDraft(!!savedDraft);

    const history = localStorage.getItem(historyKey);
    if (history) {
      setSavedAudits(JSON.parse(history));
    }
  }, [activeStandard.id]);

  const stats = useMemo(() => {
    const targetList = activeReviewAudit ? activeReviewAudit.items : checklist;
    const total = targetList.length;
    const compliant = targetList.filter(i => i.status === 'compliant').length;
    const nonCompliant = targetList.filter(i => i.status === 'non-compliant').length;
    const pending = targetList.filter(i => i.status === 'pending').length;
    const auditedCount = compliant + nonCompliant;
    const score = auditedCount > 0 ? Math.round((compliant / auditedCount) * 100) : 0;
    const completion = total > 0 ? Math.round((auditedCount / total) * 100) : 0;
    
    return { total, compliant, nonCompliant, pending, score, completion };
  }, [checklist, activeReviewAudit]);

  const handleGenerate = async () => {
    if (!auditPrompt.trim()) return alert("Please describe your audit focus first.");
    setIsGenerating(true);
    
    try {
      const relevantIds = await selectRelevantClauses(auditPrompt, activeStandard.id);
      const relevantClauses = MOCK_KNOWLEDGE_BASE.filter(c => relevantIds.includes(c.id));

      if (relevantClauses.length === 0) {
        throw new Error("No matching indicators found for this focus. Please try a different description.");
      }

      const generatedPoints = await generateAuditChecklist(relevantClauses, language, auditPrompt);
      
      const newItems: ChecklistItem[] = generatedPoints.map((gp: any, idx: number) => ({
        id: `chk-${Date.now()}-${idx}`,
        clauseId: gp.clauseId,
        checkpoint: gp.checkpoint,
        status: 'pending',
        notes: ''
      }));

      setChecklist(newItems);
      setAuditName(`Audit: ${activeStandard.shortName} - ${auditPrompt.substring(0, 30)}${auditPrompt.length > 30 ? '...' : ''}`);
    } catch (err: any) {
      alert(err.message || "Failed to generate checklist.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = () => {
    const draft: SavedDraft = {
      standardId: activeStandard.id,
      items: checklist,
      timestamp: Date.now(),
      auditPrompt
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
    setLastSaved(draft.timestamp);
    setHasDraft(true);
    setTimeout(() => setLastSaved(null), 3000);
  };

  const handleResumeDraft = () => {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      const draft: SavedDraft = JSON.parse(saved);
      setChecklist(draft.items);
      setAuditPrompt(draft.auditPrompt || '');
      setAuditName(`Draft: ${activeStandard.shortName}`);
    }
  };

  const handleFinalizeAudit = () => {
    if (!auditName.trim()) return alert("Please provide a name for this audit record.");
    
    const newAudit: SavedAudit = {
      id: `audit-${Date.now()}`,
      name: auditName,
      standardId: activeStandard.id,
      standardShortName: activeStandard.shortName,
      items: checklist,
      timestamp: Date.now(),
      score: stats.score,
      completion: stats.completion
    };

    const updatedHistory = [newAudit, ...savedAudits];
    setSavedAudits(updatedHistory);
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    
    localStorage.removeItem(draftKey);
    setHasDraft(false);
    setChecklist([]);
    setView('history');
  };

  const handleUpdateSavedAudit = () => {
    if (!activeReviewAudit) return;
    
    const updatedAudit: SavedAudit = {
      ...activeReviewAudit,
      score: stats.score,
      completion: stats.completion,
      items: activeReviewAudit.items
    };

    const updatedHistory = savedAudits.map(a => a.id === updatedAudit.id ? updatedAudit : a);
    setSavedAudits(updatedHistory);
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    setIsEditingReview(false);
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this audit record forever?")) return;
    const updated = savedAudits.filter(a => a.id !== id);
    setSavedAudits(updated);
    localStorage.setItem(historyKey, JSON.stringify(updated));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure? This will delete the current checklist and any saved progress for this standard.")) {
      setChecklist([]);
      setAuditPrompt('');
      localStorage.removeItem(draftKey);
      setHasDraft(false);
    }
  };

  const updateItemStatus = (id: string, status: ChecklistItem['status']) => {
    if (activeReviewAudit && isEditingReview) {
      setActiveReviewAudit(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(item => item.id === id ? { ...item, status: item.status === status ? 'pending' : status } : item)
        };
      });
    } else {
      setChecklist(prev => prev.map(item => item.id === id ? { ...item, status: item.status === status ? 'pending' : status } : item));
    }
  };

  const updateItemNotes = (id: string, notes: string) => {
    if (activeReviewAudit && isEditingReview) {
      setActiveReviewAudit(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(item => item.id === id ? { ...item, notes } : item)
        };
      });
    } else {
      setChecklist(prev => prev.map(item => item.id === id ? { ...item, notes } : item));
    }
  };

  const generateReportHTML = (auditToReport: SavedAudit | { id: string; items: ChecklistItem[]; name: string; score: number; completion: number; }) => {
    const itemsHTML = auditToReport.items.map(item => `
      <div style="margin-bottom: 24px; padding: 18px; border: 1px solid #cbd5e1; border-radius: 12px; page-break-inside: avoid; background: white;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center;">
          <span style="font-weight: 800; font-size: 11px; color: #064e3b; text-transform: uppercase; letter-spacing: 0.1em; background: #ecfdf5; padding: 2px 8px; border-radius: 4px;">INDICATOR ${item.clauseId}</span>
          <span style="font-weight: 900; font-size: 10px; color: white; background: ${item.status === 'compliant' ? '#10b981' : item.status === 'non-compliant' ? '#ef4444' : '#64748b'}; padding: 4px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.1em;">
            ${item.status === 'pending' ? 'NOT AUDITED' : item.status}
          </span>
        </div>
        <p style="font-weight: 700; margin-bottom: 14px; font-size: 14px; color: #0f172a; line-height: 1.5;">${item.checkpoint}</p>
        <div style="font-size: 12px; color: #334155; background: #f8fafc; padding: 14px; border-radius: 8px; border-left: 4px solid #94a3b8;">
          <strong style="color: #64748b; font-size: 10px; text-transform: uppercase; display: block; margin-bottom: 6px;">Auditor Field Observations</strong>
          ${item.notes || '<span style="color: #94a3b8; font-style: italic;">No specific notes recorded.</span>'}
        </div>
      </div>
    `).join('');

    const compliantCount = auditToReport.items.filter(i => i.status === 'compliant').length;
    const ncCount = auditToReport.items.filter(i => i.status === 'non-compliant').length;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>RSPO Digital Audit Report - ${auditToReport.name}</title>
        <style>
          @page { 
            size: portrait; 
            margin: 1.5cm;
            @bottom-right {
               content: "Page " counter(page) " of " counter(pages);
               font-size: 9px;
               color: #94a3b8;
            }
          }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 0; 
            color: #1e293b; 
            line-height: 1.6; 
            max-width: 21cm; 
            margin: 0 auto; 
            background: #fff;
            counter-reset: page;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            border-bottom: 4px solid #064e3b; 
            padding-bottom: 16px; 
            margin-bottom: 24px; 
          }
          .logo-text { color: #064e3b; font-weight: 900; font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: -0.02em; }
          .report-meta { text-align: right; }
          .report-meta p { margin: 0; font-size: 11px; font-weight: 600; color: #64748b; }
          
          /* Force Horizontal Layout for Stats Grid */
          .stats-grid { 
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            gap: 12px; 
            margin-bottom: 32px; 
            width: 100%;
          }
          .stat-card { 
            flex: 1;
            padding: 24px 8px; 
            border-radius: 16px; 
            background: #fff; 
            border: 1.5px solid #e2e8f0; 
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
          }
          .stat-val { 
            font-size: 28px; 
            font-weight: 900; 
            display: block; 
            margin-bottom: 8px;
          }
          .stat-label { 
            font-size: 9px; 
            font-weight: 800; 
            color: #475569; 
            text-transform: uppercase; 
            letter-spacing: 0.12em;
            display: block; 
          }

          .section-title { 
            font-size: 13px; 
            font-weight: 900; 
            text-transform: uppercase; 
            letter-spacing: 0.1em; 
            color: #064e3b; 
            margin-bottom: 20px; 
            border-bottom: 1px solid #e2e8f0; 
            padding-bottom: 8px;
          }

          /* Footer with Page Numbering */
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            font-size: 9px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
            background: white;
            z-index: 1000;
          }
          .page-number::after {
            /* Fallback for browsers that don't support @page counters well */
            content: "Page " counter(page);
          }
          body { counter-increment: page; }
          @media print {
            .footer { position: fixed; bottom: 0; }
            .content-wrapper { padding-bottom: 40px; }
            .stats-grid { display: flex !important; flex-direction: row !important; }
          }
        </style>
      </head>
      <body>
        <div class="content-wrapper">
          <div class="header">
            <div>
              <h1 class="logo-text">RSPO Compliance AI</h1>
              <div style="font-size: 16px; font-weight: 800; color: #334155; margin-top: 4px;">${auditToReport.name}</div>
            </div>
            <div class="report-meta">
              <p>Lead Auditor: ${user.name}</p>
              <p>Standard: ${'standardShortName' in auditToReport ? auditToReport.standardShortName : activeStandard.shortName}</p>
              <p>Generated: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-val" style="color: #10b981;">${auditToReport.score}%</span>
              <span class="stat-label">Audit Score</span>
            </div>
            <div class="stat-card">
              <span class="stat-val" style="color: #064e3b;">${compliantCount}</span>
              <span class="stat-label">Compliant</span>
            </div>
            <div class="stat-card">
              <span class="stat-val" style="color: #ef4444;">${ncCount}</span>
              <span class="stat-label">NC Findings</span>
            </div>
            <div class="stat-card">
              <span class="stat-val" style="color: #064e3b;">${auditToReport.completion}%</span>
              <span class="stat-label">Completion</span>
            </div>
          </div>

          <h2 class="section-title">Audit Observation Records</h2>
          ${itemsHTML}
        </div>

        <div class="footer">
          <div>RSPO Intelligence Hub • Secure Digital Audit Record</div>
          <div class="page-number"></div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 800);
          };
        </script>
      </body>
      </html>
    `;
  };

  const handleExportPDF = () => {
    const data = activeReviewAudit ? activeReviewAudit : {
      id: `audit-${Date.now()}`,
      items: checklist,
      name: auditName,
      score: stats.score,
      completion: stats.completion
    };
    const htmlContent = generateReportHTML(data);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
      alert("Pop-up blocked. Please allow pop-ups to view and save the PDF report.");
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in slide-in-from-bottom-8 duration-500">
        
        <div className="bg-emerald-800 dark:bg-emerald-950 p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <i className={`fa-solid ${view === 'history' ? 'fa-box-archive' : 'fa-list-check'} text-2xl text-emerald-300`}></i>
            </div>
            <div>
              <h3 className="text-xl font-bold leading-none">
                {view === 'generator' ? 'Checklist Builder' : view === 'history' ? 'Audit Library' : 'Audit Review'}
              </h3>
              <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest mt-1.5">
                {view === 'review' ? activeReviewAudit?.name : `${activeStandard.shortName} Workspace`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view === 'review' && (
              <button onClick={() => setIsEditingReview(!isEditingReview)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${isEditingReview ? 'bg-amber-500 border-amber-400 text-white' : 'bg-emerald-700/50 border-emerald-600/30 text-white hover:bg-emerald-600'}`}>
                <i className={`fa-solid ${isEditingReview ? 'fa-xmark' : 'fa-pen-to-square'}`}></i>
              </button>
            )}
            {view === 'generator' && (
              <button onClick={() => setView('history')} className="w-10 h-10 rounded-full bg-emerald-700/50 flex items-center justify-center hover:bg-emerald-600 transition-all text-white border border-emerald-600/30" title="Historical Audits">
                <i className="fa-solid fa-clock-rotate-left"></i>
              </button>
            )}
            {view !== 'generator' && !isEditingReview && (
              <button onClick={() => { setView('generator'); setActiveReviewAudit(null); setIsEditingReview(false); }} className="w-10 h-10 rounded-full bg-emerald-700/50 flex items-center justify-center hover:bg-emerald-600 transition-all text-white border border-emerald-600/30">
                <i className="fa-solid fa-plus"></i>
              </button>
            )}
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-all"><i className="fa-solid fa-xmark"></i></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          
          {view === 'history' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Saved Field Records</h4>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">{savedAudits.length} Records</span>
              </div>
              {savedAudits.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {savedAudits.map(audit => (
                    <button key={audit.id} onClick={() => { setActiveReviewAudit(audit); setView('review'); setIsEditingReview(false); }} className="w-full text-left p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-500 transition-all shadow-sm flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${audit.score >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          <span className="text-xs font-black">{audit.score}%</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">{audit.name}</h5>
                          <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">{audit.standardShortName} • {new Date(audit.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <i onClick={(e) => handleDeleteHistoryItem(audit.id, e)} className="fa-solid fa-trash-can text-slate-300 hover:text-rose-500 p-2 transition-colors"></i>
                        <i className="fa-solid fa-chevron-right text-slate-300 group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center"><i className="fa-solid fa-box-open text-4xl text-slate-200 mb-4"></i><p className="text-sm text-slate-400">Your audit library is currently empty.</p></div>
              )}
            </div>
          )}

          {view === 'review' && activeReviewAudit && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                  <p className="text-[10px] font-black text-emerald-600">{stats.score}%</p>
                  <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Audit Score</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                  <p className="text-[10px] font-black text-slate-800 dark:text-slate-100">{stats.compliant}</p>
                  <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Compliant</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                  <p className="text-[10px] font-black text-rose-500">{stats.nonCompliant}</p>
                  <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">NC Findings</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                  <p className="text-[10px] font-black text-slate-800 dark:text-slate-100">{stats.completion}%</p>
                  <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Completion</p>
                </div>
              </div>
              <div className="space-y-4">
                {activeReviewAudit.items.map(item => (
                  <div key={item.id} className={`p-4 bg-slate-50/50 dark:bg-slate-800/40 border rounded-2xl transition-all ${isEditingReview ? 'border-amber-200 dark:border-amber-800' : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Clause {item.clauseId}</span>
                       <div className="flex items-center gap-1">
                          {isEditingReview ? (
                            <div className="flex gap-1">
                              <button onClick={() => updateItemStatus(item.id, 'compliant')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.status === 'compliant' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-900 text-slate-400'}`}><i className="fa-solid fa-check text-[10px]"></i></button>
                              <button onClick={() => updateItemStatus(item.id, 'non-compliant')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.status === 'non-compliant' ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-900 text-slate-400'}`}><i className="fa-solid fa-xmark text-[10px]"></i></button>
                            </div>
                          ) : (
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${item.status === 'compliant' ? 'bg-emerald-100 text-emerald-700' : item.status === 'non-compliant' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-500'}`}>{item.status}</span>
                          )}
                       </div>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-2">{item.checkpoint}</p>
                    {isEditingReview ? (
                      <textarea value={item.notes} onChange={(e) => updateItemNotes(item.id, e.target.value)} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] outline-none min-h-[60px] resize-none text-slate-700 dark:text-slate-300" placeholder="Update field notes..."/>
                    ) : (
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-[10px] italic text-slate-500">{item.notes || "No notes recorded."}</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="sticky bottom-0 bg-white dark:bg-slate-900 pt-4 flex gap-3">
                {isEditingReview ? (
                  <button onClick={handleUpdateSavedAudit} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-xl">Confirm Updates</button>
                ) : (
                  <button onClick={handleExportPDF} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-xl">Export Portrait PDF</button>
                )}
              </div>
            </div>
          )}

          {view === 'generator' && checklist.length === 0 ? (
            <div className="space-y-8 py-4">
              {hasDraft && (
                <section className="bg-emerald-50 dark:bg-emerald-950/30 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-900 shadow-sm">
                  <button onClick={handleResumeDraft} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3">Resume Unfinished Audit</button>
                </section>
              )}
              <section className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Audit Intelligence Focus</h4>
                  <textarea
                    value={auditPrompt}
                    onChange={(e) => setAuditPrompt(e.target.value)}
                    placeholder="Describe your current audit intent (e.g., 'Verification of social impact assessments and community grievances' or 'Safety check for chemical applicators')..."
                    className="w-full h-32 px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                  <div className="flex items-center gap-2 mt-3 px-2">
                    <i className="fa-solid fa-sparkles text-emerald-500 text-[10px]"></i>
                    <p className="text-[10px] text-slate-400 italic">AI will automatically identify and draft verification points for the 10 most relevant RSPO indicators.</p>
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!auditPrompt.trim() || isGenerating}
                  className="w-full bg-slate-900 dark:bg-emerald-800 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                  {isGenerating ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles text-emerald-400"></i>}
                  {isGenerating ? "Analyzing RSPO Standards..." : "Generate Smart Checklist"}
                </button>
              </section>
            </div>
          ) : view === 'generator' && (
            <div className="space-y-6">
              <div className="bg-slate-900 dark:bg-emerald-950 p-4 rounded-2xl shadow-inner border border-white/5">
                <label className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1 block">Audit Title</label>
                <input type="text" value={auditName} onChange={(e) => setAuditName(e.target.value)} className="w-full bg-transparent text-white font-bold text-lg outline-none border-b border-white/10 focus:border-emerald-500 py-1" placeholder="Audit Identification Name"/>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                  <p className="text-[10px] font-black text-emerald-600">{stats.score}%</p>
                  <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Audit Score</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                  <p className="text-[10px] font-black text-slate-800 dark:text-slate-100">{stats.compliant}</p>
                  <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Compliant</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                  <p className="text-[10px] font-black text-rose-500">{stats.nonCompliant}</p>
                  <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">NC Findings</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                  <p className="text-[10px] font-black text-slate-800 dark:text-slate-100">{stats.completion}%</p>
                  <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Completion</p>
                </div>
              </div>
              <div className="space-y-4">
                {checklist.map(item => (
                  <div key={item.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm space-y-3 transition-all group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md mb-2 inline-block">Indicator {item.clauseId}</span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">{item.checkpoint}</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => updateItemStatus(item.id, 'compliant')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${item.status === 'compliant' ? 'bg-emerald-600 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 shadow-sm'}`}><i className="fa-solid fa-check"></i></button>
                        <button onClick={() => updateItemStatus(item.id, 'non-compliant')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${item.status === 'non-compliant' ? 'bg-rose-600 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 shadow-sm'}`}><i className="fa-solid fa-xmark"></i></button>
                      </div>
                    </div>
                    <textarea placeholder="Record field observations..." value={item.notes} onChange={(e) => updateItemNotes(item.id, e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-[11px] outline-none min-h-[60px] resize-none text-slate-700 dark:text-slate-300"/>
                  </div>
                ))}
              </div>
              <div className="sticky bottom-0 bg-white dark:bg-slate-900 pt-6 pb-2 z-10 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleSaveDraft} className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"><i className="fa-solid fa-floppy-disk"></i> {lastSaved ? "Progress Saved" : "Save Progress"}</button>
                  <button onClick={handleFinalizeAudit} className="py-4 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-xl transition-all">Finalize & Store Record</button>
                </div>
                <button onClick={handleExportPDF} className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"><i className="fa-solid fa-file-pdf mr-2"></i> Preview Portrait Report</button>
                <button onClick={handleReset} className="w-full py-2 text-rose-500 text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100">Discard Current Audit</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistGenerator;
