
import React from 'react';
import { SavedAudit, Message, ChatSession } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  chatSessions: ChatSession[];
  savedAudits: SavedAudit[];
  onOpenAudit: () => void;
  onNewChat: () => void;
  onClearHistory: () => void;
  onLoadSession: (session: ChatSession) => void;
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ 
  isOpen, 
  onClose, 
  messages, 
  chatSessions,
  savedAudits, 
  onOpenAudit, 
  onNewChat,
  onClearHistory,
  onLoadSession
}) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 w-72 md:w-80 bg-white dark:bg-slate-900 z-[210] shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 bg-emerald-800 dark:bg-emerald-950 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold">Audit History</h2>
            <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest mt-1">Chat & Records Library</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
          
          {/* Active Session Section */}
          <section>
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Chat session</h3>
              <button 
                onClick={() => { onNewChat(); onClose(); }}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                New Chat
              </button>
            </div>
            <div className="space-y-2">
              <button 
                onClick={onClose}
                className="w-full text-left p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-4 transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
                  <i className="fa-solid fa-comments"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-emerald-900 dark:text-emerald-100">Ongoing Conversation</p>
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-500 uppercase font-black tracking-tight">{messages.length} Total Entries</p>
                </div>
              </button>
            </div>
          </section>

          {/* Chat Sessions History Section - New List Format */}
          <section>
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Past Conversations</h3>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">{chatSessions.length}</span>
            </div>
            
            <div className="flex flex-col gap-2">
              {chatSessions.length > 0 ? (
                chatSessions.map((session) => (
                  <button 
                    key={session.id}
                    onClick={() => onLoadSession(session)}
                    className="w-full text-left p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col group"
                  >
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate w-full mb-1 group-hover:text-emerald-600">{session.title}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{session.standardShortName}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                        {new Date(session.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">No archived chats</p>
                </div>
              )}
            </div>
          </section>

          {/* Past Audits Section - List Format */}
          <section>
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Audit Library List</h3>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">{savedAudits.length}</span>
            </div>
            
            <div className="flex flex-col gap-0 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
              {savedAudits.length > 0 ? (
                savedAudits.map((audit, idx) => (
                  <button 
                    key={audit.id}
                    onClick={() => { onOpenAudit(); onClose(); }}
                    className={`w-full text-left p-4 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center gap-4 transition-colors group relative ${idx !== savedAudits.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black text-[10px] shadow-sm ${audit.score >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {audit.score}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{audit.name}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tighter">{audit.standardShortName}</p>
                        <span className="text-[8px] text-slate-300">•</span>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                          {new Date(audit.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300 dark:text-slate-700">
                    <i className="fa-solid fa-list-check text-xl"></i>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Library is empty</p>
                </div>
              )}
            </div>
          </section>

          {/* Quick Shortcuts */}
          <section>
             <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2">Maintenance List</h3>
             <div className="flex flex-col gap-2">
                <button 
                  onClick={onClearHistory} 
                  className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-4 group transition-all active:scale-[0.98] hover:border-rose-200 dark:hover:border-rose-900/50"
                >
                   <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500">
                     <i className="fa-solid fa-eraser"></i>
                   </div>
                   <div className="text-left">
                     <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Clear Chat Sessions</p>
                     <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest">Wipe history list</p>
                   </div>
                </button>
             </div>
          </section>

        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">RSPO Secure Hub</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">Encrypted Audit Chain</p>
              </div>
           </div>
        </div>
      </aside>
    </>
  );
};

export default HistoryDrawer;
