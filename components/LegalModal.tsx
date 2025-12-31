import React from 'react';
import { ModalType } from '../types';

interface LegalModalProps {
  type: ModalType;
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type || (type !== 'privacy' && type !== 'terms' && type !== 'contact')) return null;

  const contentMap = {
    privacy: {
      title: 'Privacy Policy',
      icon: 'fa-user-shield',
      lastUpdated: 'May 20, 2024',
      body: (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-800 dark:text-blue-300 text-xs italic">
            Your privacy is paramount. This application is designed to support RSPO stakeholders while adhering to global data protection standards.
          </div>
          <section>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">1. Information We Process</h4>
            <p className="text-slate-600 dark:text-slate-400">We process technical data related to your queries (clause IDs, keywords) to provide accurate RSPO guidance. We do not link these queries to your real-world identity unless explicitly provided.</p>
          </section>
          <section>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">2. Use of AI (Google Gemini)</h4>
            <p className="text-slate-600 dark:text-slate-400">This service utilizes the Google Gemini API. Your input text is processed by Google's secure infrastructure. We strongly advise against inputting sensitive PII (Personally Identifiable Information), specific land coordinates for disputed areas, or confidential financial records.</p>
          </section>
          <section>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">3. Data Retention</h4>
            <p className="text-slate-600 dark:text-slate-400">Chat history is stored locally within your browser's persistent storage (LocalStorage). Clearing your browser cache will erase this history. We do not maintain a central database of your private conversations.</p>
          </section>
          <section>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">4. Third Parties</h4>
            <p className="text-slate-600 dark:text-slate-400">No data is sold to third parties. We strictly use your interaction data to improve the model's understanding of RSPO P&C requirements.</p>
          </section>
        </div>
      )
    },
    terms: {
      title: 'Terms of Service',
      icon: 'fa-file-contract',
      lastUpdated: 'May 20, 2024',
      body: (
        <div className="space-y-6">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            By using this assistant, you acknowledge that compliance decisions are only valid when issued by an accredited RSPO Certification Body.
          </div>
          <section>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">1. Scope of Service</h4>
            <p className="text-slate-600 dark:text-slate-400">RSPO Compliance AI is an educational and decision-support tool. It provides interpretations based on published RSPO documents but is not an official mouthpiece of the RSPO Secretariat.</p>
          </section>
          <section>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">2. Liability Disclaimer</h4>
            <p className="text-slate-600 dark:text-slate-400">The developers and operators of this tool are not liable for any audit findings, non-conformities (NCs), or certification delays resulting from the use of this AI assistant. Final interpretation of the standard belongs to the Auditor and the RSPO Assurance team.</p>
          </section>
          <section>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">3. Usage Restrictions</h4>
            <p className="text-slate-600 dark:text-slate-400">Users may not use this tool to generate fraudulent compliance documents. Any attempt to reverse-engineer the proprietary logic of the assistant is prohibited.</p>
          </section>
        </div>
      )
    },
    contact: {
      title: 'Contact Support',
      icon: 'fa-headset',
      lastUpdated: 'Available 24/7',
      body: (
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 dark:bg-emerald-700 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                <i className="fa-solid fa-paper-plane"></i>
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Enterprise Support</p>
                <p className="text-sm font-bold text-emerald-950 dark:text-emerald-50">compliance-support@rspo-ai.org</p>
              </div>
            </div>
            
            <form className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Issue Type</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-slate-100">
                    <option>Technical Bug</option>
                    <option>Standard Interpretation Error</option>
                    <option>Missing Clause</option>
                    <option>Feedback / Suggestion</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Urgency</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-slate-100">
                    <option>Low</option>
                    <option>Medium (Active Audit)</option>
                    <option>High (Critical)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Details</label>
                <textarea 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px] text-slate-900 dark:text-slate-100 placeholder-slate-400" 
                  placeholder="Please describe the issue or standard interpretation query..."
                ></textarea>
              </div>
              <button 
                type="button"
                onClick={() => { alert("Support ticket created! We will contact you via your account email."); onClose(); }}
                className="w-full bg-slate-900 dark:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm hover:bg-slate-800 dark:hover:bg-emerald-600 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-paper-plane text-xs"></i>
                Send Support Ticket
              </button>
            </form>
          </div>
        </div>
      )
    }
  };

  const content = contentMap[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
        <div className="bg-emerald-800 dark:bg-emerald-950 p-8 text-white relative">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <i className={`fa-solid ${content.icon} text-2xl`}></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold leading-none">{content.title}</h3>
              <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest mt-2">{content.lastUpdated}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-white transition-all active:scale-90"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
        
        <div className="p-8 max-h-[60vh] overflow-y-auto text-slate-600 dark:text-slate-400 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {content.body}
        </div>
        
        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            <i className="fa-solid fa-shield-halved text-emerald-600 dark:text-emerald-500"></i>
            RSPO Secure Workspace
          </div>
          <button 
            onClick={onClose} 
            className="px-8 py-2.5 bg-slate-900 dark:bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;