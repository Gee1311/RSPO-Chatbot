import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('###')) {
        return <h3 key={i} className="text-emerald-700 dark:text-emerald-400 font-bold text-base mt-4 mb-2 first:mt-0">{line.replace('###', '').trim()}</h3>;
      }
      if (line.startsWith('-')) {
        return <li key={i} className="ml-4 list-disc mb-1 text-slate-700 dark:text-slate-300">{line.replace('-', '').trim()}</li>;
      }
      if (line.match(/^\d+\./)) {
        return <li key={i} className="ml-4 list-decimal mb-1 text-slate-700 dark:text-slate-300">{line.trim()}</li>;
      }
      return <p key={i} className="mb-2 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-300">{line}</p>;
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
        
        console.warn('Initial share failed, retrying without URL:', err);
        try {
          await navigator.share({
            title: 'RSPO Compliance Guidance',
            text: message.content,
          });
        } catch (secondErr) {
          console.error('Secondary share failed:', secondErr);
          copyToClipboard();
          alert("Sharing failed. Content copied to clipboard.");
        }
      }
    } else {
      copyToClipboard();
      alert("Sharing not supported on this browser. Content copied to clipboard.");
    }
  };

  return (
    <div className={`flex w-full mb-6 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
        isAssistant 
          ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-none pr-12 sm:pr-4' 
          : 'bg-emerald-600 dark:bg-emerald-700 text-white rounded-tr-none shadow-emerald-900/20'
      }`}>
        <div className="flex items-center justify-between mb-1 gap-4">
          <span className={`text-[10px] font-bold uppercase tracking-tight ${isAssistant ? 'opacity-60 text-slate-500 dark:text-slate-400' : 'opacity-80'}`}>
            {isAssistant ? 'Compliance Assistant' : 'Field Operator'}
          </span>
          {isAssistant && (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={copyToClipboard}
                className="text-[10px] bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                title="Copy to Clipboard"
              >
                <i className="fa-solid fa-copy"></i> Copy
              </button>
              <button 
                onClick={shareContent}
                className="text-[10px] bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                title="Share Guidance"
              >
                <i className="fa-solid fa-share-nodes"></i> Share
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
        <div className={`mt-2 text-[9px] text-right opacity-40 ${isAssistant ? 'text-slate-500' : 'text-emerald-100'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;