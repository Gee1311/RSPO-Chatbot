import React from 'react';
import { STANDARDS } from '../constants';
import { Standard } from '../types';

interface StandardSelectorProps {
  selectedId: string;
  onSelect: (standard: Standard) => void;
}

const StandardSelector: React.FC<StandardSelectorProps> = ({ selectedId, onSelect }) => {
  return (
    <div className="flex items-center">
      <div className="relative group">
        <select
          value={selectedId}
          onChange={(e) => {
            const std = STANDARDS.find(s => s.id === e.target.value);
            if (std) onSelect(std);
          }}
          className="appearance-none bg-emerald-900/50 dark:bg-emerald-950/60 text-white text-[10px] md:text-[11px] font-bold py-1.5 pl-2.5 pr-7 rounded-lg border border-emerald-700/50 dark:border-emerald-800 cursor-pointer hover:bg-emerald-900 dark:hover:bg-emerald-800 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-400 dark:focus:ring-emerald-600"
        >
          {STANDARDS.map(s => (
            <option key={s.id} value={s.id} className="bg-emerald-800 text-white">{s.shortName}</option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-400 text-[9px] md:text-[10px]">
          <i className="fa-solid fa-chevron-down"></i>
        </div>
      </div>
    </div>
  );
};

export default StandardSelector;