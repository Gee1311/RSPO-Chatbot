
import React from 'react';
import { Message, MessageOption } from '../types';

interface MessageBubbleProps {
  message: Message;
  onOptionClick?: (option: MessageOption) => void;
  onOpenNCDrafter?: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onOptionClick, onOpenNCDrafter }) => {
  const isAssistant = message.role === 'assistant';

  const parseInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_)/g);
    
    return parts.map((part, i) => {
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
        return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
        return <em key={i} className="italic text-slate-800 dark:text-slate-200">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const trimmedLine = line.trim();
      
      const headerMatch = trimmedLine.match(/^(#{1,6})\s*(.*)$/);
      if (headerMatch) {
        const headerText = headerMatch[2].trim();
        return (
          <h3 key={i} className="text-emerald-700 dark:text-emerald-400 font-black text-sm uppercase tracking-wider mt-4 mb-2 first:mt-0 flex items-center gap-2">
            <span className="w-1 h-3 bg-emerald-500 rounded-full"></span>
            {parseInlineMarkdown(headerText)}
          </h3>
        );
      }
      
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        return (
          <li key={i} className="ml-4 list-disc mb-1 text-slate-700 dark:text-slate-300">
            {parseInlineMarkdown(trimmedLine.replace(/^[-*]\s*/, '').trim())}
          </li>
        );
      }
      
      if (trimmedLine.match(/^\d+\./)) {
        return (
          <li key={i} className="ml-4 list-decimal mb-1 text-slate-700 dark:text-slate-300">
            {parseInlineMarkdown(trimmedLine.replace(/^\d+\.\s*/, '').trim())}
          </li>
        );
      }

      if (trimmedLine === '' || trimmedLine === '--') {
        return <div key={i} className="h-2" />;
      }
      
      return (
        <p key={i} className="mb-2 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-300">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    alert("Copied to Audit File clipboard!");
  };

  const shareContent = async () => {
    const isUrlValid = window.location.href.startsWith('http');
    const shareData: ShareData = {
      title: 'RSPO Compliance Guidance',
      text: message.content,
    };
    
    if (isUrlValid) {
      shareData.url = window.location.href;
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const dateStr = message.timestamp.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const timeStr = message.timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex flex-col w-full mb-6 ${isAssistant ? 'items-start' : 'items-end'}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
        isAssistant 
          ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-none' 
          : 'bg-emerald-600 dark:bg-emerald-700 text-white rounded-tr-none shadow-emerald-900/20'
      }`}>
        <div className="flex items-center justify-between mb-1 gap-4">
          <span className={`text-[10px] font-bold uppercase tracking-tight ${isAssistant ? 'opacity-60 text-slate-500 dark:text-slate-400' : 'opacity-80'}`}>
            {isAssistant ? 'Compliance Assistant' : 'Field Operator'}
          </span>
          {isAssistant && !message.options && (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={copyToClipboard}
                className="text-[10px] bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded transition-colors"
                title="Copy"
              >
                <i className="fa-solid fa-copy"></i>
              </button>
              <button 
                onClick={shareContent}
                className="text-[10px] bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded transition-colors"
                title="Share"
              >
                <i className="fa-solid fa-share-nodes"></i>
              </button>
            </div>
          )}
        </div>
        <div className="text-sm">
          {isAssistant ? (
            <div className="assistant-content prose prose-sm dark:prose-invert max-w-none">
              {formatContent(message.content)}
              
              {message.groundingUrls && message.groundingUrls.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-link"></i> Verified RSPO Resources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {message.groundingUrls.map((link, idx) => (
                      <a 
                        key={idx}
                        href={link.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <i className="fa-solid fa-globe text-[8px]"></i>
                        {link.title.length > 30 ? link.title.substring(0, 30) + '...' : link.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {message.showNCDraftLink && (
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl animate-in slide-in-from-bottom-2 duration-500">
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200 mb-3 uppercase tracking-widest flex items-center gap-2">
                    <i className="fa-solid fa-wand-magic-sparkles"></i> 
                    Response Tooling Available
                  </p>
                  <button 
                    onClick={onOpenNCDrafter}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black uppercase tracking-widest py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Generate Professional NC Draft
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                  <p className="mt-2 text-[9px] text-amber-600/60 text-center font-bold">PRO/ENTERPRISE FEATURE</p>
                </div>
              )}
            </div>
          ) : (
            <p className="leading-relaxed">{message.content}</p>
          )}
        </div>
        <div className={`mt-2 text-[9px] text-right opacity-40 font-bold ${isAssistant ? 'text-slate-500' : 'text-emerald-100'}`}>
          {dateStr} • {timeStr}
        </div>
      </div>

      {isAssistant && message.options && message.options.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 w-full max-w-[85%] sm:max-w-[75%] animate-in fade-in slide-in-from-bottom-2 duration-500">
          {message.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => onOptionClick?.(option)}
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all text-left shadow-sm group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-inner">
                <i className={`fa-solid ${option.icon} text-lg`}></i>
              </div>
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight leading-tight">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
