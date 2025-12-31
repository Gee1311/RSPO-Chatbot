import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION, MOCK_KNOWLEDGE_BASE, LANGUAGE_MAP } from "../constants";
import { Standard, Language, PolicyDocument, RSPOClause } from "../types";

export const askRSPOAssistant = async (
  question: string, 
  activeStandard: Standard, 
  language: Language,
  policies: PolicyDocument[] = [],
  history: { role: string; content: string }[] = []
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const targetLanguageName = LANGUAGE_MAP[language] || 'English';
  
  const matchingClauses = MOCK_KNOWLEDGE_BASE.filter(clause => 
    clause.standardId === activeStandard.id && (
      question.toLowerCase().includes(clause.id.toLowerCase()) || 
      question.toLowerCase().includes(clause.title.toLowerCase())
    )
  );

  const policyContext = policies.length > 0 
    ? `\nCompany Specific Policies Provided:\n${policies.map(p => `${p.name} (${p.type}): ${p.content}`).join('\n')}`
    : '';

  const contextPrompt = `
Active Standard: ${activeStandard.name} (${activeStandard.year})
OUTPUT_LANGUAGE: ${targetLanguageName}
${policyContext}

Retrieved RSPO Context Documents:
${matchingClauses.length > 0 
  ? matchingClauses.map(c => `ID: ${c.id}, Content: ${c.description}`).join('\n')
  : 'Search relevant RSPO requirements for ' + activeStandard.shortName}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{ text: `${contextPrompt}\n\nIMPORTANT: YOU MUST RESPOND ONLY IN ${targetLanguageName.toUpperCase()}.\n\nUser Question: ${question}` }]
      }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
      },
    });

    return response.text || "I'm sorry, I couldn't generate a response based on the available RSPO documents.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to connect to the RSPO Compliance Assistant.");
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
    You are an RSPO Audit Lead. 
    The auditor wants to focus on: "${prompt}"
    
    From the following list of available RSPO Indicators for this standard, select the 10 MOST RELEVANT indicators that need to be verified during this specific focused audit.
    If fewer than 10 are relevant, select only those.
    
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
    return availableClauses.slice(0, 10).map(c => c.id);
  }
};

export const generateAuditChecklist = async (clauses: RSPOClause[], language: Language, prompt?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const targetLanguageName = LANGUAGE_MAP[language] || 'English';

  const context = prompt ? `The specific audit focus is: "${prompt}". ` : "";

  const generatorPrompt = `${context}Convert the following RSPO clauses into a practical, actionable audit checklist for a field auditor. 
  Each item should be a "Verification Point" (what the auditor should physically check, observe, or ask for in the field).
  
  Clauses:
  ${clauses.map(c => `[${c.id}] ${c.title}: ${c.description}`).join('\n')}
  
  Output the response as a JSON array of objects with keys: "clauseId", "checkpoint".
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