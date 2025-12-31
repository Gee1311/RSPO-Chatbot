import React from 'react';
import { LANGUAGES } from '../constants';
import { Language } from '../types';

interface LanguageSelectorProps {
  current: Language;
  onSelect: (lang: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ current, onSelect }) => {
  return (
    <div className="flex items-center gap-1 bg-emerald-900/40 dark:bg-emerald-950/60 p-1 rounded-lg border border-emerald-700/50 dark:border-emerald-800">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onSelect(lang.code as Language)}
          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
            current === lang.code 
              ? 'bg-emerald-600 dark:bg-emerald-700 text-white shadow-sm' 
              : 'text-emerald-300 dark:text-emerald-500 hover:text-white'
          }`}
          title={lang.name}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;