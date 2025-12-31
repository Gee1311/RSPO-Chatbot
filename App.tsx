
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
import { Message, AppStatus, Standard, User, ModalType, Language, PolicyDocument } from './types';
import { STANDARDS, DISCLAIMER, LANGUAGE_MAP } from './constants';
import { askRSPOAssistant } from './services/geminiService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rspo_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeStandard, setActiveStandard] = useState<Standard>(STANDARDS[0]);
  const [language, setLanguage] = useState<Language>('en');
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('rspo_theme');
    return (saved as 'light' | 'dark') || 'light';
  });
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('rspo_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        console.error("Failed to load history", e);
        return [];
      }
    }
    return [];
  });

  const [input, setInput] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('rspo_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('rspo_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([
        {
          id: 'initial',
          role: 'assistant',
          content: `Welcome to the Enterprise RSPO Workspace. \nLanguage set to: **${language.toUpperCase()}**. \n\nYou can now "upload" company SOPs in the Document Vault to get site-specific guidance.`,
          timestamp: new Date()
        }
      ]);
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    const langName = LANGUAGE_MAP[newLang];
    const confirmationQuery = `System: The user has switched the interface language to ${langName}. Please provide a very brief one-sentence greeting/acknowledgment in ${langName} confirming you are ready to help in this language.`;
    handleSend(confirmationQuery);
  };

  const handleSend = async (forcedQuery?: string, isNC?: boolean) => {
    const query = forcedQuery || input;
    if (!query.trim() || status === AppStatus.LOADING) return;

    const isInternalTrigger = query.startsWith('System:');
    
    if (!isInternalTrigger) {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: isNC ? `🚨 NC DRAFT REQUEST: ${query}` : query,
        timestamp: new Date(),
        isNCDraft: isNC
      };
      setMessages(prev => [...prev, userMsg]);
    }

    setInput('');
    setStatus(AppStatus.LOADING);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await askRSPOAssistant(query, activeStandard, language, policies, history);
      
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
        content: "⚠️ Connection error. Please verify your connection or check your API configuration.",
        timestamp: new Date()
      }]);
    } finally {
      setStatus(AppStatus.IDLE);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your entire audit chat history? This cannot be undone.")) {
      setMessages([]);
      localStorage.removeItem('rspo_chat_history');
    }
  };

  const handleExportHistory = () => {
    if (messages.length === 0) return alert("No history to export.");
    const formattedContent = messages.map(m => {
      const time = m.timestamp.toLocaleString();
      const role = m.role === 'assistant' ? 'AI ASSISTANT' : 'USER/AUDITOR';
      return `[${time}] ${role}:\n${m.content}\n${'-'.repeat(40)}\n`;
    }).join('\n');
    const blob = new Blob([`RSPO AUDIT LOG\nGenerated: ${new Date().toLocaleString()}\nStandard: ${activeStandard.name}\n\n${formattedContent}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RSPO_Audit_Log_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddPolicy = (policy: PolicyDocument) => {
    setPolicies(prev => [...prev, policy]);
  };

  const handleRemovePolicy = (id: string) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
  };

  if (!user) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <Login onLogin={(u) => { setUser(u); localStorage.setItem('rspo_user', JSON.stringify(u)); }} onShowModal={setActiveModal} />
        <LegalModal type={activeModal} onClose={() => setActiveModal(null)} />
      </div>
    );
  }

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
          onLogout={() => { setUser(null); localStorage.removeItem('rspo_user'); setMessages([]); localStorage.removeItem('rspo_chat_history'); }}
          onShowModal={setActiveModal}
          onClearHistory={handleClearHistory}
          onExportHistory={handleExportHistory}
          onToggleTheme={toggleTheme}
        />
        
        <ClauseSearch activeStandard={activeStandard} onSelect={(q) => handleSend(q)} />

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-950/40 scroll-smooth">
          <div className="max-w-2xl mx-auto">
            {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
            {status === AppStatus.LOADING && (
              <div className="flex justify-start mb-6 animate-pulse">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  AI ANALYZING DOCUMENTS & STANDARDS...
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 z-10 shadow-lg p-3 md:p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about compliance or site-specific SOPs..."
                className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:bg-white dark:focus:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              />
              <button
                onClick={() => handleSend()}
                disabled={status === AppStatus.LOADING || !input.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white w-12 h-12 flex items-center justify-center rounded-xl shadow-md transition-all active:translate-y-0.5"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
            <div className="mt-3 py-1.5 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                <i className="fa-solid fa-scale-balanced text-emerald-600 dark:text-emerald-500 mr-1"></i> {DISCLAIMER}
              </p>
            </div>
          </div>
        </footer>

        {activeModal === 'vault' && (
          <DocumentVault 
            policies={policies} 
            onAdd={handleAddPolicy} 
            onRemove={handleRemovePolicy} 
            onClose={() => setActiveModal(null)} 
          />
        )}
        
        {activeModal === 'checklist' && (
          <ChecklistGenerator
            activeStandard={activeStandard}
            language={language}
            user={user}
            onClose={() => setActiveModal(null)}
          />
        )}
        
        {activeModal === 'nc-drafter' && (
          <NCResponseDrafter 
            onDraft={(f) => handleSend(f, true)} 
            onClose={() => setActiveModal(null)} 
          />
        )}

        <LegalModal type={activeModal} onClose={() => setActiveModal(null)} />
      </div>

      {/* Floating Tool Belt outside the main flex container so it docks to the screen edge */}
      <FloatingToolBelt onShowModal={setActiveModal} />
    </>
  );
};

export default App;
