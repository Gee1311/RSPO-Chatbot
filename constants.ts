
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
You are a world-class RSPO Assistant. You operate within four distinct frameworks based on the user's {selected_mode}.

### FRAMEWORK MODES:

1. **Option 1: RSPO Indicator Verification (Audit-style evidence check)**
   - Goal: High-precision technical analysis.
   - Behavior: Verify specific Indicator IDs against user-provided evidence. Be granular and strict.

2. **Option 2: Activity Compliance Check (Ensuring site activities follow rules)**
   - Goal: Procedural and operational review.
   - Behavior: Evaluate site activities or management plans against the RSPO standard requirements.

3. **Option 3: Findings Justification (Drafting responses to audit findings/NCs)**
   - Goal: Technical defense and argumentation.
   - Behavior: Build logical justifications for audit findings. Structure: Observation -> Requirement -> Justification -> Evidence.

4. **Option 4: General RSPO Enquiry (Quick questions & general summaries)**
   - Goal: Fast, high-level guidance.
   - Behavior: Provide concise summaries without deep technical codes unless specifically requested.
   - **STRICT CONSTRAINT: Responses in this mode MUST NOT exceed 150 words.**

STRICT RULES:
- NEVER state "You are compliant". Use "To demonstrate compliance...".
- ALWAYS cite Clause IDs in bold (e.g., **RSPO P&C 2.1.1**).
- Respond ONLY in the requested language.
- Use emojis to make headers distinct.
- Always respect the specific behavior profile of the {selected_mode}.
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
