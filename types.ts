
export interface Standard {
  id: string;
  name: string;
  year: string;
  shortName: string;
}

export type Language = 'en' | 'id' | 'tp';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'auditor' | 'manager' | 'smallholder' | 'demo';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isNCDraft?: boolean;
}

export interface RSPOClause {
  id: string;
  standardId: string;
  title: string;
  description: string;
  principle: string;
  criterion: string;
  indicator: string;
}

export interface ChecklistItem {
  id: string;
  clauseId: string;
  checkpoint: string;
  status: 'pending' | 'compliant' | 'non-compliant';
  notes: string;
}

export interface SavedAudit {
  id: string;
  name: string;
  standardId: string;
  standardShortName: string;
  items: ChecklistItem[];
  timestamp: number;
  score: number;
  completion: number;
}

export interface PolicyDocument {
  id: string;
  name: string;
  type: 'SOP' | 'Policy' | 'Report';
  content: string;
  uploadDate: Date;
  filePreview?: string; // Base64 data URL for images or PDF thumbnails
}

export enum AppStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error',
  AUTHENTICATING = 'authenticating'
}

export type ModalType = 'privacy' | 'terms' | 'contact' | 'vault' | 'nc-drafter' | 'checklist' | null;
