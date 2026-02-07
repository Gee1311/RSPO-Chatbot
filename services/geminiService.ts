
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION, MOCK_KNOWLEDGE_BASE, LANGUAGE_MAP, NATIONAL_INTERPRETATIONS } from "../constants";
import { Standard, Language, PolicyDocument, RSPOClause, UserTier, GroundingUrl, User } from "../types";

export const askRSPOAssistant = async (
  question: string, 
  activeStandard: Standard, 
  language: Language,
  userTier: UserTier,
  policies: PolicyDocument[] = [],
  history: { role: string; content: string }[] = [],
  selectedNIs: string[] = []
): Promise<{ text: string; groundingUrls?: GroundingUrl[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const targetLanguageName = LANGUAGE_MAP[language] || 'English';

  // Identify Mode
  let activeMode = 'GENERAL';
  let cleanQuestion = question;
  
  if (question.startsWith('MODE_TECHNICAL:')) {
    activeMode = 'TECHNICAL';
    cleanQuestion = question.replace('MODE_TECHNICAL:', '').trim();
  } else if (question.startsWith('MODE_ACTIVITY:')) {
    activeMode = 'ACTIVITY';
    cleanQuestion = question.replace('MODE_ACTIVITY:', '').trim();
  } else if (question.startsWith('MODE_ARGUMENTATIVE:')) {
    activeMode = 'ARGUMENTATIVE';
    cleanQuestion = question.replace('MODE_ARGUMENTATIVE:', '').trim();
  } else if (question.startsWith('MODE_CONCISE:')) {
    activeMode = 'CONCISE';
    cleanQuestion = question.replace('MODE_CONCISE:', '').trim();
  }
  
  // Use semantic selection for better accuracy
  let matchingClauses: RSPOClause[] = [];
  try {
    const relevantIds = await selectRelevantClauses(cleanQuestion, activeStandard.id);
    matchingClauses = MOCK_KNOWLEDGE_BASE.filter(c => relevantIds.includes(c.id));
  } catch (e) {
    matchingClauses = MOCK_KNOWLEDGE_BASE.filter(clause => 
      clause.standardId === activeStandard.id && (
        cleanQuestion.toLowerCase().includes(clause.id.toLowerCase()) || 
        cleanQuestion.toLowerCase().includes(clause.title.toLowerCase())
      )
    );
  }

  const niContext = selectedNIs.length > 0 
    ? `\nSELECTED NATIONAL INTERPRETATIONS (NI):\n${selectedNIs.map(id => {
        const ni = NATIONAL_INTERPRETATIONS.find(n => n.id === id);
        return ni ? `- ${ni.name} (${ni.url})` : id;
      }).join('\n')}\n*Note: Use these specific documents for regional indicator definitions.*`
    : '\n(No specific National Interpretations selected. Use global P&C documents.)';

  const policyContext = policies.length > 0 
    ? `\nCOMPANY CONTEXT (UPLOADED DOCUMENTS):\n${policies.map(p => `[FILE: ${p.name}] TYPE: ${p.type}\nCONTENT: ${p.content}`).join('\n---\n')}`
    : '\n(No specific company policies provided. Using general RSPO framework.)';

  const contextPrompt = `
ACTIVE_STANDARD: ${activeStandard.name} (${activeStandard.year})
OPERATIONAL_MODE: ${activeMode}
OUTPUT_LANGUAGE: ${targetLanguageName}

${niContext}
${policyContext}

OFFICIAL RSPO INDICATORS PROVIDED FOR REFERENCE:
${matchingClauses.length > 0 
  ? matchingClauses.map(c => `INDICATOR_ID: ${c.id}\nTITLE: ${c.title}\nREQUIREMENT: ${c.description}`).join('\n\n')
  : 'Note: Specific matching Indicators were not found in the local database. Use Google Search to find the latest text from rspo.org.'}

STRICT TECHNICAL DIRECTIVE:
If the user asks for a specific indicator number or requirement, use the Google Search tool to verify it against the official RSPO resources (https://rspo.org). If a National Interpretation is selected, prioritize results matching that specific NI PDF content from rspo.org. Hallucinations are strictly forbidden.
`;

  // Using Pro model for search grounding and complex auditing tasks
  const modelToUse = userTier === 'Free' ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview';

  try {
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: [{
        parts: [{ text: `${contextPrompt}\n\nUSER QUESTION: ${cleanQuestion}` }]
      }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1, 
        tools: [{ googleSearch: {} }]
      },
    });

    const text = response.text || "I'm sorry, I couldn't generate a response based on the available RSPO documents.";
    
    // Extract grounding URLs
    const groundingUrls: GroundingUrl[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          groundingUrls.push({
            title: chunk.web.title || 'Official RSPO Resource',
            uri: chunk.web.uri
          });
        }
      });
    }

    return { text, groundingUrls: groundingUrls.length > 0 ? groundingUrls : undefined };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to connect to the RSPO Compliance Assistant.");
  }
};

export const generateNCDraft = async (finding: string, standard: Standard, language: Language, policies: PolicyDocument[] = []) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const targetLanguageName = LANGUAGE_MAP[language] || 'English';

  const policyContext = policies.length > 0 
    ? `Available Company Context:\n${policies.map(p => `${p.name}: ${p.content.substring(0, 1000)}`).join('\n')}`
    : '';

  const prompt = `You are an RSPO Compliance Expert. Take the following audit finding and transform it into a structured professional management response.
  
  Finding: "${finding}"
  Standard: ${standard.name}
  
  ${policyContext}
  
  Generate a JSON response with the following keys:
  1. "observation": A professional restatement of the finding.
  2. "requirement": The specific RSPO Indicator and requirement being violated.
  3. "rootCause": A deep analysis of why this happened (systemic/procedural).
  4. "correctiveAction": The immediate action taken to fix the specific instance.
  5. "preventionPlan": The long-term systemic change to ensure it never happens again.
  
  RESPOND ONLY IN ${targetLanguageName.toUpperCase()}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            observation: { type: Type.STRING },
            requirement: { type: Type.STRING },
            rootCause: { type: Type.STRING },
            correctiveAction: { type: Type.STRING },
            preventionPlan: { type: Type.STRING }
          },
          required: ["observation", "requirement", "rootCause", "correctiveAction", "preventionPlan"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("NC Draft Error:", error);
    throw new Error("Failed to generate professional NC draft.");
  }
};

export const extractTextFromImage = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanBase64 = base64Data.replace(/\s/g, '');
  
  const imagePart = {
    inlineData: {
      data: cleanBase64,
      mimeType: mimeType,
    },
  };
  
  const textPart = {
    text: `You are an expert OCR and document digitizer for RSPO Compliance audits. 
    1. Extract all text from this image accurately.
    2. Maintain the structure, headings, and bullet points of the original SOP or policy.
    3. Output ONLY the extracted text content. 
    4. If the image is not a document or is unreadable, state: "ERROR: UNREADABLE_DOCUMENT"`
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [imagePart, textPart]
      },
    });

    const resultText = response.text;
    if (!resultText || resultText.includes("ERROR: UNREADABLE_DOCUMENT")) {
      throw new Error("Document text extraction failed. Please ensure the photo is clear and contains readable text.");
    }
    return resultText.trim();
  } catch (error: any) {
    console.error("OCR API Error Details:", error);
    const msg = error?.message || "Internal API Error";
    throw new Error(`OCR processing failed: ${msg}. Please try a smaller image or a different format.`);
  }
};

export const selectRelevantClauses = async (prompt: string, standardId: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const availableClauses = MOCK_KNOWLEDGE_BASE.filter(c => c.standardId === standardId);
  
  const selectionPrompt = `
    Analyze this audit query: "${prompt}"
    
    From the list of RSPO Indicators for ${standardId}, identify which are directly relevant. 
    If none match exactly, pick the closest matching indicators.
    
    Available Indicators:
    ${availableClauses.map(c => `ID: ${c.id}, Title: ${c.title}`).join('\n')}
    
    Return ONLY a JSON array of the Indicator IDs.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: selectionPrompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Selection Error:", error);
    return availableClauses.slice(0, 5).map(c => c.id);
  }
};

export const generateAuditChecklist = async (clauses: RSPOClause[], language: Language, prompt?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const targetLanguageName = LANGUAGE_MAP[language] || 'English';

  const context = prompt ? `The specific audit focus is: "${prompt}". ` : "";

  const generatorPrompt = `${context}Convert these RSPO clauses into actionable "Verification Points" for a field auditor.
  
  Clauses:
  ${clauses.map(c => `[${c.id}] ${c.title}: ${c.description}`).join('\n')}
  
  Output as JSON array of objects with keys: "clauseId", "checkpoint".
  RESPOND ONLY IN ${targetLanguageName.toUpperCase()}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: generatorPrompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              clauseId: { type: Type.STRING },
              checkpoint: { type: Type.STRING }
            },
            required: ["clauseId", "checkpoint"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Checklist Generation Error:", error);
    return clauses.map(c => ({ clauseId: c.id, checkpoint: `Verify compliance with ${c.id}: ${c.title}` }));
  }
};
