
import React from 'react';
import { ONBOARDING_OPTIONS } from '../constants';

interface ModeSelectorProps {
  currentMode: string;
  onSelect: (modeValue: string) => void;
  variant?: 'compact' | 'full';
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onSelect, variant = 'full' }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {ONBOARDING_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`w-full text-left p-3 rounded-2xl flex items-center gap-4 transition-all group ${currentMode === opt.value ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${currentMode === opt.value ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-900 text-emerald-600 dark:text-emerald-400'}`}>
            <i className={`fa-solid ${opt.icon} text-sm`}></i>
          </div>
          <span className="text-[11px] font-black uppercase tracking-tight">{variant === 'full' ? opt.label : ''}</span>
        </button>
      ))}
    </div>
  );
};

export default ModeSelector;
