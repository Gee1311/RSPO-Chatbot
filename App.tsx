
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ClauseSearch from './components/ClauseSearch';
import MessageBubble from './components/MessageBubble';
import Login from './components/Login';
import LegalModal from './components/LegalModal';
import DocumentVault from './components/DocumentVault';
import NCResponseDrafter from './components/NCResponseDrafter';
import ChecklistGenerator from './components/ChecklistGenerator';
import FloatingToolBelt from './components/FloatingToolBelt';
import HistoryDrawer from './components/HistoryDrawer';
import SettingsModal from './components/SettingsModal';
import { Message, AppStatus, Standard, User, ModalType, Language, PolicyDocument, SavedAudit, ChatSession, MessageOption } from './types';
import { STANDARDS, DISCLAIMER, LANGUAGE_MAP } from './constants';
import { askRSPOAssistant } from './services/geminiService';

const FREE_LIMIT = 10;
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

const ONBOARDING_OPTIONS: MessageOption[] = [
  { label: '1. RSPO Indicator Verification', value: 'TECHNICAL', icon: 'fa-magnifying-glass' },
  { label: '2. Activity Compliance Check', value: 'ACTIVITY', icon: 'fa-clipboard-check' },
  { label: '3. Findings Justification', value: 'ARGUMENTATIVE', icon: 'fa-gavel' },
  { label: '4. General RSPO Enquiry', value: 'CONCISE', icon: 'fa-circle-info' }
];

const PRIMING_MESSAGES: Record<string, string> = {
  'TECHNICAL': "Ready for **Indicator Verification**. Please provide the **Indicator ID** (e.g., P&C 2018 - 6.2.1) and the **Evidence** you wish to verify.",
  'ACTIVITY': "Ready for **Activity Compliance**. Please describe the **Site Activity** or management plan you are reviewing.",
  'ARGUMENTATIVE': "Ready for **Findings Justification**. Please share the **Audit Finding** or **NC** text so we can build a technical defense.",
  'CONCISE': "Ready for **General Enquiry**. How can I help you with the RSPO process today?"
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rspo_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [searchStats, setSearchStats] = useState(() => {
    const saved = localStorage.getItem('rspo_usage_stats');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Date.now() - parsed.weekStart > WEEK_IN_MS) {
        return { count: 0, weekStart: Date.now() };
      }
      return parsed;
    }
    return { count: 0, weekStart: Date.now() };
  });

  const [activeStandard, setActiveStandard] = useState<Standard>(STANDARDS[0]);
  const [language, setLanguage] = useState<Language>('en');
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('rspo_theme');
    return (saved as 'light' | 'dark') || 'light';
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeMode, setActiveMode] = useState<string>('CONCISE');

  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('rspo_chat_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((s: any) => ({
          ...s,
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [savedAudits, setSavedAudits] = useState<SavedAudit[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('rspo_usage_stats', JSON.stringify(searchStats));
  }, [searchStats]);

  useEffect(() => {
    localStorage.setItem('rspo_chat_sessions', JSON.stringify(chatSessions));
  }, [chatSessions]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('rspo_theme', theme);
  }, [theme]);

  useEffect(() => {
    const history = localStorage.getItem('rspo_audit_history');
    if (history) setSavedAudits(JSON.parse(history));
  }, [activeModal]);

  useEffect(() => {
    if (user && messages.length === 0) {
      startInitialSession();
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  const startInitialSession = () => {
    setMessages([
      {
        id: 'initial-' + Date.now(),
        role: 'assistant',
        content: `Hello! I am your **RSPO Assistant**. To ensure I provide the correct level of technical detail, please select your intended operation:\n\n1️⃣ **RSPO Indicator Verification** (Audit-style evidence check)\n2️⃣ **Activity Compliance Check** (Ensuring site activities follow rules)\n3️⃣ **Findings Justification** (Drafting responses to audit findings/NCs)\n4️⃣ **General RSPO Enquiry** (Quick questions & general summaries)\n\nWhich option are we working on today?`,
        timestamp: new Date(),
        options: ONBOARDING_OPTIONS
      }
    ]);
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    const langName = LANGUAGE_MAP[newLang];
    handleSend(`System: Language switched to ${langName}. Please acknowledge.`);
  };

  const handleNewChat = () => {
    if (messages.length > 1) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.content.substring(0, 40) + '...' : 'Conversation ' + new Date().toLocaleDateString();
      
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title,
        messages: [...messages],
        timestamp: Date.now(),
        standardShortName: activeStandard.shortName
      };
      
      setChatSessions(prev => [newSession, ...prev]);
    }
    setActiveMode('CONCISE');
    startInitialSession();
  };

  const handleLoadSession = (session: ChatSession) => {
    setMessages([...session.messages]);
    setActiveModal(null);
  };

  const handleSend = async (forcedQuery?: string, isNC?: boolean) => {
    const query = forcedQuery || input;
    if (!query.trim() || status === AppStatus.LOADING) return;

    // Command handling: Reset or Change Mode
    const cleanCmd = query.trim().toLowerCase();
    if (cleanCmd === '/restart' || cleanCmd === 'change mode' || cleanCmd === '/mode') {
      setInput('');
      handleNewChat();
      return;
    }

    if (user?.tier === 'Free' && searchStats.count >= FREE_LIMIT && !query.startsWith('System:')) {
      handleShowModal('settings');
      return;
    }

    let finalQuery = query;

    // Injected Mode logic
    if (!query.startsWith('System:') && !query.startsWith('MODE_')) {
      finalQuery = `MODE_${activeMode}: ${query}`;
    }

    if (!query.startsWith('System:')) {
      const displayContent = query.includes('MODE_') ? query.split(': ')[1] : query;
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: isNC ? `🚨 NC DRAFT REQUEST: ${displayContent}` : displayContent,
        timestamp: new Date(),
        isNCDraft: isNC
      };
      setMessages(prev => [...prev, userMsg]);
      
      if (user?.tier === 'Free') {
        setSearchStats(prev => ({ ...prev, count: prev.count + 1 }));
      }
    }

    setInput('');
    setStatus(AppStatus.LOADING);

    try {
      const historyArr = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await askRSPOAssistant(finalQuery, activeStandard, language, policies, historyArr);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "⚠️ Connection error. Please verify your connection.",
        timestamp: new Date()
      }]);
    } finally {
      setStatus(AppStatus.IDLE);
    }
  };

  const handleOptionClick = (option: MessageOption) => {
    // 1. Remove options from the last message
    setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, options: undefined } : m));
    
    // 2. Set the internal persistent mode
    setActiveMode(option.value);

    // 3. Add the user selection and the Priming Message from the interaction script
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: option.label,
      timestamp: new Date()
    };
    
    const primingContent = PRIMING_MESSAGES[option.value] || "How can I help you today?";

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: primingContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('rspo_user');
    setMessages([]);
    setChatSessions([]);
    localStorage.removeItem('rspo_chat_sessions');
    setActiveModal(null);
  };

  const handleShowModal = (type: ModalType) => {
    const premiumTools: ModalType[] = ['vault', 'checklist', 'nc-drafter'];
    if (user?.tier === 'Free' && premiumTools.includes(type)) {
      if (window.confirm("UPGRADE REQUIRED\n\nThe Document Vault, Smart Checklist, and NC Drafter are exclusive to the Enterprise Pro plan.\n\nWould you like to upgrade now?")) {
        setActiveModal('settings');
      }
      return;
    }
    setActiveModal(type);
  };

  if (!user) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <Login onLogin={(u) => { setUser(u); localStorage.setItem('rspo_user', JSON.stringify(u)); }} onShowModal={setActiveModal} />
        <LegalModal type={activeModal} onClose={() => setActiveModal(null)} />
      </div>
    );
  }

  const isLimitReached = user.tier === 'Free' && searchStats.count >= FREE_LIMIT;

  return (
    <>
      <div className="flex flex-col h-full max-w-4xl mx-auto border-x border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl relative overflow-hidden transition-colors">
        <Header 
          activeStandard={activeStandard} 
          language={language}
          user={user}
          theme={theme}
          onStandardChange={setActiveStandard} 
          onLanguageChange={handleLanguageChange}
          onLogout={handleLogout}
          onShowModal={handleShowModal}
          onClearHistory={() => setMessages([])}
          onExportHistory={() => alert("Exporting audit log...")}
          onToggleTheme={toggleTheme}
        />
        
        <ClauseSearch activeStandard={activeStandard} onSelect={(q) => handleSend(q)} />

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-950/40 relative">
          <div className="max-w-2xl mx-auto">
            {messages.map(msg => <MessageBubble key={msg.id} message={msg} onOptionClick={handleOptionClick} />)}
            {status === AppStatus.LOADING && (
              <div className="flex justify-start mb-6 animate-pulse">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-[11px] font-bold text-slate-400">
                  AI ANALYZING...
                </div>
              </div>
            )}
            
            {isLimitReached && (
              <div className="animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500 bg-emerald-800 text-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-emerald-400/30 text-center space-y-4 my-8 mx-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse"></div>
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                  <i className="fa-solid fa-crown text-3xl text-emerald-400"></i>
                </div>
                <h4 className="text-xl font-black uppercase tracking-tight">Free Weekly Limit Reached</h4>
                <p className="text-emerald-100 text-xs leading-relaxed max-sm mx-auto">
                  You've used all 10 searches for this week. Upgrade to **Enterprise Pro** for unlimited search, OCR document vault access, and automated audit reports.
                </p>
                <button 
                  onClick={() => setActiveModal('settings')}
                  className="w-full py-4 bg-white text-emerald-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-emerald-50 transition-all active:scale-95"
                >
                  Activate Enterprise Pro Plan
                </button>
              </div>
            )}
          </div>
        </main>

        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLimitReached}
                placeholder={isLimitReached ? "Upgrade to continue searching..." : `Type a message or use '/restart'...`}
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={status === AppStatus.LOADING || !input.trim() || isLimitReached}
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-12 h-12 flex items-center justify-center rounded-xl shadow-md transition-all disabled:grayscale disabled:opacity-50"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
            
            <div className="mt-3 flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                 <p className="text-[9px] text-slate-400 font-medium">
                  {DISCLAIMER}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Mode: <span className="text-emerald-600">{activeMode}</span>
                </div>
                {user.tier === 'Free' && (
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Usage: <span className={isLimitReached ? 'text-rose-500' : 'text-emerald-600'}>{searchStats.count}/{FREE_LIMIT}</span>
                    </div>
                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${isLimitReached ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${(searchStats.count / FREE_LIMIT) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </footer>

        {activeModal === 'vault' && (
          <DocumentVault policies={policies} onAdd={(p) => setPolicies(prev => [...prev, p])} onRemove={(id) => setPolicies(prev => prev.filter(p => p.id !== id))} onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'checklist' && (
          <ChecklistGenerator activeStandard={activeStandard} language={language} user={user} onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'nc-drafter' && (
          <NCResponseDrafter onDraft={(f) => handleSend(f, true)} onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'settings' && (
          <SettingsModal user={user} onUpdateUser={(u) => { setUser(u); localStorage.setItem('rspo_user', JSON.stringify(u)); }} onLogout={handleLogout} onClose={() => setActiveModal(null)} />
        )}
        <HistoryDrawer 
          isOpen={activeModal === 'history'} 
          onClose={() => setActiveModal(null)} 
          messages={messages} 
          chatSessions={chatSessions}
          savedAudits={savedAudits} 
          onOpenAudit={() => handleShowModal('checklist')} 
          onNewChat={handleNewChat} 
          onClearHistory={() => setChatSessions([])}
          onLoadSession={handleLoadSession}
        />
        <LegalModal type={activeModal} onClose={() => setActiveModal(null)} />
      </div>

      <FloatingToolBelt user={user} onShowModal={handleShowModal} />
    </>
  );
};

export default App;
