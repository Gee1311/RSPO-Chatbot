
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
import { Message, AppStatus, Standard, User, ModalType, Language, PolicyDocument, SavedAudit, ChatSession, MessageOption, SettingsTab, Invoice } from './types';
import { STANDARDS, DISCLAIMER, LANGUAGE_MAP, PLANS, ONBOARDING_OPTIONS } from './constants';
import { askRSPOAssistant } from './services/geminiService';

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

const PRIMING_MESSAGES: Record<string, string> = {
  'TECHNICAL': "Ready for **Indicator Verification**. Please provide the **Indicator ID** (e.g., P&C 2018 - 6.2.1) and the **Evidence** you wish to verify.",
  'ACTIVITY': "Ready for **Activity Compliance**. Please describe the **Site Activity** or management plan you are reviewing.",
  'ARGUMENTATIVE': "Ready for **Findings Justification**. Please share the **Audit Finding** or **NC** text so we can build a technical defense.",
  'CONCISE': "Ready for **General Enquiry**. How can I help you with the RSPO process today?"
};

const DEFAULT_USER_PREFS = {
  preferences: { theme: 'light' as const, language: 'en' as const, autoSave: true },
  notifications: { billing: true, compliance: true, system: true },
  invoices: []
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rspo_user');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    const freeLimit = PLANS.find(p => p.tier === 'Free')?.tokens || 5000;
    return { 
      ...DEFAULT_USER_PREFS, 
      tokensUsed: 0, 
      tokenLimit: freeLimit, 
      tier: 'Free',
      ...parsed 
    };
  });
  
  const [tokenStats, setTokenStats] = useState(() => {
    const saved = localStorage.getItem('rspo_token_stats');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Date.now() - parsed.weekStart > WEEK_IN_MS) {
        return { used: 0, weekStart: Date.now() };
      }
      return parsed;
    }
    return { used: 0, weekStart: Date.now() };
  });

  const [activeStandard, setActiveStandard] = useState<Standard>(STANDARDS[0]);
  const [language, setLanguage] = useState<Language>(user?.preferences?.language || 'en');
  const [theme, setTheme] = useState<'light' | 'dark'>(user?.preferences?.theme || 'light');
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeMode, setActiveMode] = useState<string>('CONCISE');
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);

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
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('profile');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('rspo_token_stats', JSON.stringify(tokenStats));
    if (user && user.tokensUsed !== tokenStats.used) {
      handleUpdateUser({ ...user, tokensUsed: tokenStats.used });
    }
  }, [tokenStats.used]);

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

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (user) {
      handleUpdateUser({ ...user, preferences: { ...user.preferences, theme: next } });
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    const langName = LANGUAGE_MAP[newLang];
    handleSend(`System: Language switched to ${langName}. Please acknowledge.`);
    if (user) {
      handleUpdateUser({ ...user, preferences: { ...user.preferences, language: newLang } });
    }
  };

  const handleModeChange = (newMode: string) => {
    const option = ONBOARDING_OPTIONS.find(o => o.value === newMode);
    if (!option) return;

    setActiveMode(newMode);
    setIsModeMenuOpen(false);
    
    // Clear options from last message if they were showing
    setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, options: undefined } : m));

    const pivotMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Framework switched to **${option.label}**. ${PRIMING_MESSAGES[newMode]}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, pivotMsg]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('rspo_user', JSON.stringify(updatedUser));
    setTheme(updatedUser.preferences.theme);
    setLanguage(updatedUser.preferences.language);
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

  const calculateTokenCost = (inputStr: string, outputStr: string): number => {
    return Math.ceil((inputStr.length + outputStr.length) / 4);
  };

  const handleSend = async (forcedQuery?: string, isNC?: boolean) => {
    const query = forcedQuery || input;
    if (!query.trim() || status === AppStatus.LOADING || !user) return;

    const cleanCmd = query.trim().toLowerCase();
    if (cleanCmd === '/restart' || cleanCmd === 'change mode' || cleanCmd === '/mode') {
      setInput('');
      handleNewChat();
      return;
    }

    if (tokenStats.used >= user.tokenLimit && !query.startsWith('System:')) {
      handleShowModal('settings', 'billing');
      return;
    }

    let finalQuery = query;

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
    }

    setInput('');
    setStatus(AppStatus.LOADING);

    try {
      const historyArr = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await askRSPOAssistant(finalQuery, activeStandard, language, user.tier, policies, historyArr);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        showNCDraftLink: activeMode === 'ARGUMENTATIVE'
      };
      
      setMessages(prev => [...prev, assistantMsg]);

      const cost = calculateTokenCost(finalQuery, response);
      setTokenStats(prev => ({ ...prev, used: prev.used + cost }));

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
    handleModeChange(option.value);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('rspo_user');
    setMessages([]);
    setChatSessions([]);
    localStorage.removeItem('rspo_chat_sessions');
    setActiveModal(null);
  };

  const handleShowModal = (type: ModalType, tab: SettingsTab = 'profile') => {
    const premiumTools: ModalType[] = ['vault', 'checklist', 'nc-drafter'];
    const hasPremiumAccess = user?.tier === 'Professional' || user?.tier === 'Enterprise';

    if (!hasPremiumAccess && premiumTools.includes(type)) {
      if (window.confirm("UPGRADE REQUIRED\n\nThe Digital Toolbox is exclusive to Professional & Enterprise plans.\n\nWould you like to view refill options?")) {
        setSettingsTab('billing');
        setActiveModal('settings');
      }
      return;
    }
    
    if (type === 'settings') {
      setSettingsTab(tab);
    }
    
    setActiveModal(type);
  };

  if (!user) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <Login onLogin={(u) => { 
          const freePlan = PLANS.find(p => p.tier === 'Free')!;
          const fullUser: User = { 
            ...DEFAULT_USER_PREFS, 
            ...u, 
            tokenLimit: freePlan.tokens, 
            tokensUsed: 0, 
            tier: 'Free' as const,
            invoices: []
          };
          handleUpdateUser(fullUser); 
        }} onShowModal={setActiveModal} />
        <LegalModal type={activeModal} onClose={() => setActiveModal(null)} />
      </div>
    );
  }

  const isLimitReached = tokenStats.used >= user.tokenLimit;
  const currentModeOption = ONBOARDING_OPTIONS.find(o => o.value === activeMode);

  return (
    <>
      <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 relative overflow-hidden transition-colors">
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

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 dark:bg-slate-950/40 relative scrollbar-hide">
          <div className="max-w-6xl mx-auto">
            {messages.map(msg => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                onOptionClick={handleOptionClick} 
                onOpenNCDrafter={() => handleShowModal('nc-drafter')}
              />
            ))}
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
                <h4 className="text-xl font-black uppercase tracking-tight">Intelligence Payload Depleted</h4>
                <p className="text-emerald-100 text-xs leading-relaxed max-sm mx-auto">
                  You've consumed your {user.tokenLimit.toLocaleString()} token allocation. Upgrade to a **Professional** or **Enterprise** pack for high-volume audit analysis.
                </p>
                <button 
                  onClick={() => handleShowModal('settings', 'billing')}
                  className="w-full py-4 bg-white text-emerald-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-emerald-50 transition-all active:scale-95"
                >
                  Upgrade Intelligence Pack
                </button>
              </div>
            )}
          </div>
        </main>

        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 md:p-6 shrink-0 no-print relative">
          
          {/* Mode Pull-up Menu */}
          {isModeMenuOpen && (
            <>
              <div className="fixed inset-0 z-[140]" onClick={() => setIsModeMenuOpen(false)}></div>
              <div className="absolute bottom-full left-4 md:left-6 mb-2 w-72 bg-white dark:bg-slate-800 rounded-[2rem] shadow-[0_-20px_50px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-700 p-3 z-[150] animate-in slide-in-from-bottom-4 duration-300">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-3">Switch Framework</p>
                <div className="space-y-1">
                  {ONBOARDING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleModeChange(opt.value)}
                      className={`w-full text-left p-3 rounded-2xl flex items-center gap-4 transition-all group ${activeMode === opt.value ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${activeMode === opt.value ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-900 text-emerald-600 dark:text-emerald-400'}`}>
                        <i className={`fa-solid ${opt.icon} text-sm`}></i>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="max-w-6xl mx-auto">
            <div className="flex gap-4 items-center">
              <button
                onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                className={`flex items-center gap-2 px-4 h-14 rounded-2xl border transition-all active:scale-95 shadow-sm whitespace-nowrap ${isModeMenuOpen ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500'}`}
                title="Change RSPO Mode"
              >
                <i className={`fa-solid ${currentModeOption?.icon || 'fa-sliders'}`}></i>
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">{currentModeOption?.label || 'Mode'}</span>
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isLimitReached}
                  placeholder={isLimitReached ? "Upgrade to continue..." : `Query RSPO Assistant...`}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-base disabled:opacity-50 transition-all shadow-inner"
                />
              </div>

              <button
                onClick={() => handleSend()}
                disabled={status === AppStatus.LOADING || !input.trim() || isLimitReached}
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-14 h-14 flex items-center justify-center rounded-2xl shadow-xl transition-all disabled:grayscale disabled:opacity-50 active:scale-90"
              >
                <i className="fa-solid fa-paper-plane text-lg"></i>
              </button>
            </div>
            
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
              <div className="flex items-center gap-2">
                 <p className="text-[10px] text-slate-400 font-medium">
                  {DISCLAIMER}
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Tokens: <span className={isLimitReached ? 'text-rose-500' : 'text-emerald-600'}>{tokenStats.used.toLocaleString()} / {user.tokenLimit.toLocaleString()}</span>
                </div>
                <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${isLimitReached ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min((tokenStats.used / user.tokenLimit) * 100, 100)}%` }}
                  />
                </div>
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
          <NCResponseDrafter standard={activeStandard} language={language} policies={policies} user={user} onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'settings' && (
          <SettingsModal user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} onClose={() => setActiveModal(null)} initialTab={settingsTab} />
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
