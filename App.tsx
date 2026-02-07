
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
import PaymentGateway from './components/PaymentGateway';
import { Message, AppStatus, Standard, User, ModalType, Language, PolicyDocument, SavedAudit, ChatSession, MessageOption, SettingsTab, Invoice, UserTier } from './types';
import { STANDARDS, DISCLAIMER, LANGUAGE_MAP, PLANS, ONBOARDING_OPTIONS } from './constants';
import { askRSPOAssistant, extractTextFromImage } from './services/geminiService';

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;

const PRIMING_MESSAGES: Record<string, string> = {
  'TECHNICAL': "Ready for **Indicator Verification**. Please provide the **Indicator ID** (e.g., P&C 2018 - 6.2.1) and the **Evidence** you wish to verify.",
  'ACTIVITY': "Ready for **Activity Compliance**. Please describe the **Site Activity** or management plan you are reviewing.",
  'ARGUMENTATIVE': "Ready for **Findings Justification**. Please share the **Audit Finding** or **NC** text so we can build a technical defense.",
  'CONCISE': "Ready for **General Enquiry**. How can I help you with the RSPO process today?"
};

const DEFAULT_USER_PREFS = {
  preferences: { theme: 'light' as const, language: 'en' as const, autoSave: true },
  notifications: { billing: true, compliance: true, system: true },
  invoices: [],
  nationalInterpretations: []
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rspo_user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      const freePlan = PLANS.find(p => p.tier === 'Free')!;
      return { 
        ...DEFAULT_USER_PREFS, 
        tokensUsed: 0, 
        tokenLimit: freePlan.tokens, 
        tier: 'Free',
        createdAt: Date.now(),
        ...parsed 
      };
    } catch (e) {
      return null;
    }
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const [timeToRecharge, setTimeToRecharge] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [attachedContext, setAttachedContext] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);

  // Weekly reset check & Recharge countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - tokenStats.weekStart;
      
      if (elapsed > WEEK_IN_MS) {
        setTokenStats({ used: 0, weekStart: now });
      } else {
        const remaining = WEEK_IN_MS - elapsed;
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setTimeToRecharge(`${days}d ${hours}h`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [tokenStats.weekStart]);

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
        content: `Hello! I am your **RSPO Assistant**. To ensure I provide the correct level of technical detail, please select your intended operation:\n\n1️⃣ **RSPO Indicator Verification** (Audit-style evidence check)\n2️⃣ **Activity Compliance Check** (Ensuring site activities follow rules)\n3️⃣ **Findings Justification** (Drafting responses to audit findings/NCs)\n4️⃣ **General RSPO Enquiry** (Quick questions & general summaries)\n\n💡 **Pro Tip**: For maximum accuracy with technical indicators, you can upload the official RSPO Standard PDF into the **Document Vault** from the Toolbox below! I also verify text directly from **rspo.org** via Google Search.`,
        timestamp: new Date(),
        options: ONBOARDING_OPTIONS
      }
    ]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please limit uploads to 5MB.");
      return;
    }

    setIsProcessingFile(true);
    setStatus(AppStatus.LOADING);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (result) {
        try {
          const base64Data = result.substring(result.indexOf(',') + 1);
          const extractedText = await extractTextFromImage(base64Data, file.type);
          
          if (extractedText) {
            setAttachedContext(`FILE CONTEXT (${file.name}):\n${extractedText}`);
            setAttachedFileName(file.name);
            setInput(prev => `[Question regarding ${file.name}] `);
            setTimeout(() => mainInputRef.current?.focus(), 100);
          }
        } catch (err: any) {
          alert(err.message || "Failed to extract content from file.");
        } finally {
          setIsProcessingFile(false);
          setStatus(AppStatus.IDLE);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
    const queryText = forcedQuery || input;
    if (!queryText.trim() || status === AppStatus.LOADING || !user) return;

    const cleanCmd = queryText.trim().toLowerCase();
    if (cleanCmd === '/restart' || cleanCmd === 'change mode' || cleanCmd === '/mode') {
      setInput('');
      handleNewChat();
      return;
    }

    if (isLimitReached && !queryText.startsWith('System:')) {
      handleShowModal('payment');
      return;
    }

    const fullQuery = attachedContext ? `${attachedContext}\n\nUSER QUESTION: ${queryText}` : queryText;

    let finalQuery = fullQuery;
    if (!queryText.startsWith('System:') && !queryText.startsWith('MODE_')) {
      finalQuery = `MODE_${activeMode}: ${fullQuery}`;
    }

    if (!queryText.startsWith('System:')) {
      const displayContent = queryText.includes('MODE_') ? queryText.split(': ')[1] : queryText;
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
    setAttachedContext(null);
    setAttachedFileName(null);
    setStatus(AppStatus.LOADING);

    try {
      const historyArr = messages.map(m => ({ role: m.role, content: m.content }));
      const { text, groundingUrls } = await askRSPOAssistant(
        finalQuery, 
        activeStandard, 
        language, 
        user.tier, 
        policies, 
        historyArr, 
        user.nationalInterpretations
      );
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
        timestamp: new Date(),
        showNCDraftLink: activeMode === 'ARGUMENTATIVE',
        groundingUrls
      };
      
      setMessages(prev => [...prev, assistantMsg]);

      const cost = calculateTokenCost(finalQuery, text);
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
        setActiveModal('payment');
      }
      return;
    }
    
    if (type === 'settings') {
      setSettingsTab(tab);
    }
    
    setActiveModal(type);
  };

  const handlePaymentSuccess = (newTier: UserTier, tokens: number, invoice: Invoice) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      tier: newTier,
      tokenLimit: tokens,
      tokensUsed: 0,
      subscriptionStatus: 'Active',
      invoices: [invoice, ...(user.invoices || [])]
    };
    handleUpdateUser(updatedUser);
    setTokenStats({ used: 0, weekStart: Date.now() });
    setActiveModal(null);
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
            createdAt: Date.now(),
            invoices: []
          };
          handleUpdateUser(fullUser); 
        }} onShowModal={setActiveModal} />
        <LegalModal type={activeModal} onClose={() => setActiveModal(null)} />
      </div>
    );
  }

  const isTrialExpired = user.tier === 'Free' && (Date.now() - (user.createdAt || Date.now())) > MONTH_IN_MS;
  const isLimitReached = tokenStats.used >= user.tokenLimit || isTrialExpired;
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
        
        <ClauseSearch activeStandard={activeStandard} user={user} onSelect={(q) => handleSend(q)} />

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
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-[11px] font-bold text-slate-400 flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  {isProcessingFile ? "EXTRACTING CONTENT..." : "AI ANALYZING..."}
                </div>
              </div>
            )}
            
            {isLimitReached && (
              <div className="animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500 bg-slate-900 text-white p-10 rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] border-4 border-emerald-500/20 text-center space-y-6 my-10 mx-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse"></div>
                
                <div className="flex justify-center -space-x-3 mb-2">
                   <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md">
                    <i className={`fa-solid ${isTrialExpired ? 'fa-hourglass-end' : 'fa-chart-pie'} text-2xl text-emerald-400`}></i>
                  </div>
                   <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center border-4 border-slate-900 shadow-xl z-10">
                    <i className="fa-solid fa-bolt-lightning text-2xl text-white"></i>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-2xl font-black uppercase tracking-tight leading-none">
                    {isTrialExpired ? '1-Month Trial Concluded' : 'Intelligence Budget Depleted'}
                  </h4>
                  <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">Next Step: Starter Workspace Refill</p>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto font-medium">
                  {isTrialExpired 
                    ? `Your 1-month evaluation period of the RSPO Assistant has ended. Upgrade to the **Starter Plan** to resume your audit queries.`
                    : `You've utilized your weekly 1,000 token allowance. Transition to the **Starter Plan** for a 50x larger intelligence capacity.`}
                </p>

                <div className="pt-2">
                  <button 
                    onClick={() => handleShowModal('payment')}
                    className="group relative w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-[0_15px_30px_-5px_rgba(16,185,129,0.4)] hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    Upgrade to Starter Plan
                    <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                  </button>
                  <p className="mt-4 text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
                    {isTrialExpired ? 'Access expired' : `Next reset in ${timeToRecharge}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 md:p-6 shrink-0 no-print relative">
          
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
            {attachedContext && (
               <div className="mb-3 px-4 py-2 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-file-circle-check text-emerald-600"></i>
                    <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-200 uppercase tracking-widest truncate max-w-[200px] md:max-w-none">
                      Context Loaded: {attachedFileName} — Add text to refine your query
                    </p>
                  </div>
                  <button onClick={() => { setAttachedContext(null); setAttachedFileName(null); setInput(''); }} className="text-emerald-600 hover:text-rose-500 transition-colors p-1"><i className="fa-solid fa-xmark"></i></button>
               </div>
            )}

            <div className="flex gap-4 items-center">
              <button
                onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                className={`flex items-center gap-2 px-4 h-14 rounded-2xl border transition-all active:scale-95 shadow-sm whitespace-nowrap ${isModeMenuOpen ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500'}`}
                title="Change RSPO Mode"
              >
                <i className={`fa-solid ${currentModeOption?.icon || 'fa-sliders'}`}></i>
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">{currentModeOption?.label || 'Mode'}</span>
              </button>
              
              <div className="flex-1 relative flex items-center">
                <input
                  ref={mainInputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isLimitReached || isProcessingFile}
                  placeholder={isLimitReached ? "Upgrade required..." : isProcessingFile ? "Digitizing content..." : `Ask about audit finding or attached file...`}
                  className="w-full pl-6 pr-14 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-base disabled:opacity-50 transition-all shadow-inner"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLimitReached || isProcessingFile}
                  className="absolute right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all active:scale-90 disabled:opacity-50"
                  title="Attach File or Image"
                >
                   <i className={`fa-solid ${isProcessingFile ? 'fa-circle-notch fa-spin text-emerald-500' : 'fa-paperclip'}`}></i>
                </button>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  className="hidden" 
                  accept="image/*,.pdf,.doc,.docx,.txt" 
                  onChange={handleFileUpload} 
                />
              </div>

              <button
                onClick={() => handleSend()}
                disabled={status === AppStatus.LOADING || !input.trim() || isLimitReached || isProcessingFile}
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
                  {user.tier === 'Free' ? `Weekly Budget: ` : `Tokens: `}
                  <span className={isLimitReached ? 'text-rose-500' : 'text-emerald-600'}>
                    {(user.tokenLimit - tokenStats.used).toLocaleString()} Left
                  </span>
                  {user.tier === 'Free' && !isTrialExpired && (
                    <span className="ml-2 text-[8px] opacity-60">Recharge in {timeToRecharge}</span>
                  )}
                </div>
                <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${isLimitReached ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.max(0, 100 - (tokenStats.used / user.tokenLimit) * 100)}%` }}
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
        {activeModal === 'payment' && (
          <PaymentGateway user={user} onPaymentSuccess={handlePaymentSuccess} onClose={() => setActiveModal(null)} />
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
