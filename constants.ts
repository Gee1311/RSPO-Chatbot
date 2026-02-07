
import { RSPOClause, Standard, UserTier, MessageOption } from './types';

export const STANDARDS: Standard[] = [
  { id: 'pc2018', name: 'Principles & Criteria', year: '2018', shortName: 'P&C 2018' },
  { id: 'ish2019', name: 'Independent Smallholder', year: '2019', shortName: 'ISH 2019' },
  { id: 'scc2020', name: 'Supply Chain Certification', year: '2020', shortName: 'SCC 2020' }
];

export const NATIONAL_INTERPRETATIONS = [
  { id: 'id-2020', name: 'Indonesia (INNI 2020)', url: 'https://rspo.org/resources/' },
  { id: 'my-2019', name: 'Malaysia (MYNI 2019)', url: 'https://rspo.org/resources/' },
  { id: 'png-si-2019', name: 'PNG & Solomon Islands (PNGNI 2019)', url: 'https://rspo.org/resources/' },
  { id: 'gh-2019', name: 'Ghana (GHNI 2019)', url: 'https://rspo.org/resources/' },
  { id: 'th-2019', name: 'Thailand (THNI 2019)', url: 'https://rspo.org/resources/' },
  { id: 'co-2019', name: 'Colombia (CONI 2019)', url: 'https://rspo.org/resources/' },
  { id: 'ng-2019', name: 'Nigeria (NGNI 2019)', url: 'https://rspo.org/resources/' }
];

export interface PlanDefinition {
  tier: UserTier;
  tokens: number;
  price: string;
  features: string[];
}

export const PLANS: PlanDefinition[] = [
  { 
    tier: 'Free', 
    tokens: 1000, 
    price: '$0', 
    features: ['1,000 Weekly Tokens', 'Use-it-or-lose-it Policy', '1-Month Trial Access', 'Standard P&C Access'] 
  },
  { 
    tier: 'Starter', 
    tokens: 50000, 
    price: '$10', 
    features: ['50k Tokens/Week', 'Increased Context Window', 'Priority Chat'] 
  },
  { 
    tier: 'Professional', 
    tokens: 200000, 
    price: '$30', 
    features: ['200k Tokens/Week', 'Document Vault OCR', 'Smart Checklist', 'NC Drafter Pro'] 
  },
  { 
    tier: 'Enterprise', 
    tokens: 1000000, 
    price: '$50+', 
    features: [
      '1M+ Tokens/Week', 
      'Full Toolbox Access', 
      'API Integration', 
      'Add more token options enabled during payment checkout'
    ] 
  }
];

export const ONBOARDING_OPTIONS: MessageOption[] = [
  { label: 'Indicator Verification', value: 'TECHNICAL', icon: 'fa-magnifying-glass' },
  { label: 'Activity Compliance', value: 'ACTIVITY', icon: 'fa-clipboard-check' },
  { label: 'Findings Justification', value: 'ARGUMENTATIVE', icon: 'fa-gavel' },
  { label: 'General Enquiry', value: 'CONCISE', icon: 'fa-circle-info' }
];

export const MOCK_KNOWLEDGE_BASE: RSPOClause[] = [
  {
    id: 'RSPO P&C 1.1.1',
    standardId: 'pc2018',
    title: 'Public availability of information',
    description: 'Information on compliance with relevant legal, environmental and social requirements and relevant RSPO P&C documents is publicly available.',
    principle: '1',
    criterion: '1.1',
    indicator: '1.1.1'
  },
  {
    id: 'RSPO P&C 2.1.1',
    standardId: 'pc2018',
    title: 'Legal Compliance',
    description: 'Evidence of compliance with relevant legal requirements shall be available.',
    principle: '2',
    criterion: '2.1',
    indicator: '2.1.1'
  },
  {
    id: 'RSPO P&C 3.4.1',
    standardId: 'pc2018',
    title: 'SEIA for new developments',
    description: 'A social and environmental impact assessment (SEIA) is undertaken prior to new establishments or expansions.',
    principle: '3',
    criterion: '3.4',
    indicator: '3.4.1'
  },
  {
    id: 'RSPO P&C 6.2.1',
    standardId: 'pc2018',
    title: 'Living Wage',
    description: 'Applicable labor laws, union agreements or direct contracts of employment detailing payments and conditions are available.',
    principle: '6',
    criterion: '6.2',
    indicator: '6.2.1'
  },
  {
    id: 'RSPO P&C 7.3.1',
    standardId: 'pc2018',
    title: 'No plantings on peat',
    description: 'There shall be no new plantings on peat regardless of depth after 15 November 2018 in existing and new development areas.',
    principle: '7',
    criterion: '7.3',
    indicator: '7.3.1'
  },
  {
    id: 'RSPO P&C 7.12.1',
    standardId: 'pc2018',
    title: 'HCV and HCS',
    description: 'Land clearing does not cause deforestation or damage any area required to protect or enhance High Conservation Values (HCVs) or High Carbon Stock (HCS) forests. HCV and HCS assessments are required.',
    principle: '7',
    criterion: '7.12',
    indicator: '7.12.1'
  }
];

export const SYSTEM_INSTRUCTION = `
You are a world-class RSPO Assistant. Your primary goal is to provide ACCURATE and technical interpretations of the RSPO Standards.

### SOURCES OF TRUTH (PRIORITY ORDER):
1. **Google Search (Official rspo.org)**: Use the built-in search tool to find the exact, most up-to-date text for any RSPO Indicator requested. Focus on https://rspo.org and its resource center.
2. **Context Documents (Uploaded SOPs/Policies)**: Use these for company-specific context.
3. **National Interpretations (NI)**: If the user has selected specific National Interpretations (e.g., INNI for Indonesia), you MUST prioritize the indicators as defined in that specific NI for regional compliance questions.

### ACCURACY PROTOCOL:
- If a user asks for a specific indicator (e.g., "P&C 2018 Indicator 6.2.2"), you **MUST** use the Google Search tool to verify the exact wording on rspo.org if it's not in your immediate context.
- ALWAYS check if a selected National Interpretation changes the indicator threshold or requirement (e.g., specific minimum wage or labor laws in the NI).
- NEVER guess or approximate indicator text. Hallucinations are a violation of audit protocol.
- If you cannot find the exact text even after searching, state clearly: "I was unable to retrieve the exact wording from the latest RSPO resources. Please consult the official P&C 2018 document at https://rspo.org/resources/".

### FRAMEWORK MODES:
1. **TECHNICAL**: High-precision audit verification. Verify Indicator IDs against evidence.
2. **ACTIVITY**: Procedural review of management plans.
3. **ARGUMENTATIVE**: Build technical justifications for findings.
4. **CONCISE**: High-level guidance (max 150 words).

### STRICTURES:
- ALWAYS format Indicator IDs in bold (e.g., **RSPO P&C 2.1.1**).
- Provide the official source links discovered during your search.
- Use emojis for headers. No Markdown '#' headers.
`;

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', label: 'English' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', label: 'Bahasa Indonesia' }
];

export const LANGUAGE_MAP: Record<string, string> = {
  'en': 'English',
  'id': 'Bahasa Indonesia'
};

export const DISCLAIMER = "This tool provides guidance only and does not replace official RSPO audits or certification decisions.";
