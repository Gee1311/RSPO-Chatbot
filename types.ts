
export interface Standard {
  id: string;
  name: string;
  year: string;
  shortName: string;
}

export type Language = 'en' | 'id' | 'tp';

export type SettingsTab = 'profile' | 'billing' | 'preferences' | 'notifications' | 'api';

export type UserTier = 'Free' | 'Starter' | 'Professional' | 'Enterprise';

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: Language;
  autoSave: boolean;
}

export interface UserNotifications {
  billing: boolean;
  compliance: boolean;
  system: boolean;
}

export interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: string;
  billingPeriod: string;
  tokens: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  organization?: string;
  role: string;
  tier: UserTier;
  tokenLimit: number;
  tokensUsed: number;
  subscriptionStatus?: 'Active' | 'Expired' | 'Pending';
  stripeKey?: string;
  preferences: UserPreferences;
  notifications: UserNotifications;
  invoices: Invoice[];
}

export interface MessageOption {
  label: string;
  value: string;
  icon: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isNCDraft?: boolean;
  options?: MessageOption[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
  standardShortName: string;
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

export interface NCDraftRecord {
  id: string;
  originalFinding: string;
  standardShortName: string;
  observation: string;
  requirement: string;
  rootCause: string;
  correctiveAction: string;
  preventionPlan: string;
  timestamp: number;
  status: 'Draft' | 'Finalized';
}

export interface PolicyDocument {
  id: string;
  name: string;
  type: 'SOP' | 'Policy' | 'Report';
  content: string;
  uploadDate: Date;
  filePreview?: string;
}

export enum AppStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error',
  AUTHENTICATING = 'authenticating'
}

export type ModalType = 'privacy' | 'terms' | 'contact' | 'vault' | 'nc-drafter' | 'checklist' | 'history' | 'settings' | null;
