import React from 'react';
import { MOCK_KNOWLEDGE_BASE } from '../constants';
import { Standard } from '../types';

interface ClauseSearchProps {
  activeStandard: Standard;
  onSelect: (query: string) => void;
}

const ClauseSearch: React.FC<ClauseSearchProps> = ({ activeStandard, onSelect }) => {
  const filteredClauses = MOCK_KNOWLEDGE_BASE.filter(c => c.standardId === activeStandard.id);

  return (
    <div className="flex flex-col gap-2 p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-2 tracking-widest">
          <i className="fa-solid fa-bookmark text-emerald-500 dark:text-emerald-400"></i>
          {activeStandard.shortName} Quick Reference
        </label>
        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
          {filteredClauses.length} Clauses
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {filteredClauses.map((clause) => (
          <button
            key={clause.id}
            onClick={() => onSelect(`Explain indicator ${clause.indicator} from ${activeStandard.shortName}: ${clause.title}`)}
            className="flex-shrink-0 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95 text-slate-700 dark:text-slate-200"
          >
            {clause.id}
          </button>
        ))}
        {filteredClauses.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-600 italic py-1 px-1">No reference clauses loaded for this standard yet.</p>
        )}
      </div>
    </div>
  );
};

export default ClauseSearch;