
import React from 'react';
import { Message, MessageOption } from '../types';

interface MessageBubbleProps {
  message: Message;
  onOptionClick?: (option: MessageOption) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onOptionClick }) => {
  const isAssistant = message.role === 'assistant';

  const parseInlineMarkdown = (text: string) => {
    // Regex to find **bold**, __bold__, *italic*, _italic_
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
      
      // Handle Headings (Catching any #, ##, ### etc and stripping them)
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
      
      // Handle Bullet Points (both - and *)
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        return (
          <li key={i} className="ml-4 list-disc mb-1 text-slate-700 dark:text-slate-300">
            {parseInlineMarkdown(trimmedLine.replace(/^[-*]\s*/, '').trim())}
          </li>
        );
      }
      
      // Handle Numbered Lists
      if (trimmedLine.match(/^\d+\./)) {
        return (
          <li key={i} className="ml-4 list-decimal mb-1 text-slate-700 dark:text-slate-300">
            {parseInlineMarkdown(trimmedLine.replace(/^\d+\.\s*/, '').trim())}
          </li>
        );
      }

      // Handle empty lines (spacing)
      if (trimmedLine === '' || trimmedLine === '--') {
        return <div key={i} className="h-2" />;
      }
      
      // Default Paragraph
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
