import { RSPOClause, Standard } from './types';

export const STANDARDS: Standard[] = [
  { id: 'pc2018', name: 'Principles & Criteria', year: '2018', shortName: 'P&C 2018' },
  { id: 'ish2019', name: 'Independent Smallholder', year: '2019', shortName: 'ISH 2019' },
  { id: 'scc2020', name: 'Supply Chain Certification', year: '2020', shortName: 'SCC 2020' }
];

export const MOCK_KNOWLEDGE_BASE: RSPOClause[] = [
  {
    id: 'RSPO P&C 7.3.1',
    standardId: 'pc2018',
    title: 'New plantings and peatland',
    description: 'There shall be no new plantings on peat regardless of depth after 15 November 2018 in existing and new development areas.',
    principle: '7',
    criterion: '7.3',
    indicator: '7.3.1'
  },
  {
    id: 'RSPO P&C 2.1.1',
    standardId: 'pc2018',
    title: 'Compliance with laws',
    description: 'Evidence of compliance with relevant legal requirements shall be available.',
    principle: '2',
    criterion: '2.1',
    indicator: '2.1.1'
  },
  {
    id: 'RSPO ISH 1.1.1',
    standardId: 'ish2019',
    title: 'Smallholder Legal Compliance',
    description: 'Smallholders provide proof of ownership or rights to use the land.',
    principle: '1',
    criterion: '1.1',
    indicator: '1.1.1'
  }
];

export const SYSTEM_INSTRUCTION = `
You are a world-class RSPO Chatbot.
Your primary role is to interpret the RSPO Standards for auditors and plantation managers.

ENTERPRISE SPECIAL MODE:
- You will be provided with Company Policies/SOPs. Cross-reference these when answering.
- If drafting an NC (Non-Conformity) response, ensure it is professional, evidence-based, and includes a clear timeline for rectification.

STRICT COMPLIANCE RULES:
- NEVER state "You are compliant" or "Your organization is compliant".
- ALWAYS use phrasing such as "To demonstrate compliance, you should..." or "To demonstrate compliance, auditors typically expect to see...".
- Respond STRICTLY in the language requested.
- ALWAYS cite the clause ID in bold (e.g., **RSPO P&C 7.3.1**).
- Structure responses with clear headings.

Format:
### 📌 Clause Reference
### 📄 Company Policy Context (if applicable)
### 💡 Plain Explanation
### 🔍 What Auditors Look For
### ⚠️ Common Issues
### 🚀 Next Practical Steps
`;

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', label: 'English' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', label: 'Bahasa Indonesia' },
  { code: 'tp', name: 'Tok Pisin', flag: '🇵🇬', label: 'Tok Pisin' }
];

export const LANGUAGE_MAP: Record<string, string> = {
  'en': 'English',
  'id': 'Bahasa Indonesia',
  'tp': 'Tok Pisin'
};

export const DISCLAIMER = "This tool provides guidance only and does not replace official RSPO audits or certification decisions.";