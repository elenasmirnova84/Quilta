
import { GoogleGenAI, Type } from "@google/genai";

// Use import.meta.env for Vite environment variables as requested
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

const SYSTEM_PROMPT = `You are a professional multilingual qualitative research assistant. 
Your task is to transcribe content EXACTLY as it is spoken and IDENTIFY SPEAKERS.

RULES:
1. VERBATIM ONLY: Do not summarize. Preserve filler words ("uh", "um", "well", "ah") and stuttering.
2. NO TRANSLATION: Transcribe in the original language.
3. SPEAKER IDENTIFICATION: Identify different speakers. 
   - Use provided "Speaker Hints" if available to map identities.
   - Otherwise, label them as "Interviewer" and "Respondent" if clear.
   - Use "Speaker 1", "Speaker 2", etc. as fallback.
   - Use consistent labels throughout.
4. FORMAT: Return a JSON array of objects, each containing "speaker" and "text" fields.
5. LENGTH: If the input is very long, ensure the JSON array is complete and valid. Do not cut off mid-object.`;

const SENTENCE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      speaker: { type: Type.STRING, description: "Label of the speaker (e.g. Interviewer, Respondent, S1)" },
      text: { type: Type.STRING, description: "The verbatim sentence or segment spoken." }
    },
    required: ["speaker", "text"]
  }
};

export const transcribeAudio = async (
  base64Data: string, 
  mimeType: string, 
  languageLabel: string = "Auto-Detect",
  speakerHints: string = ""
): Promise<{speaker: string, text: string}[]> => {
  try {
    const languageInstruction = languageLabel === "Auto-Detect" 
      ? "Automatically detect the language used in this audio." 
      : `The speaker is using ${languageLabel}.`;
      
    const hintInstruction = speakerHints ? `\n\nSPEAKER HINTS: Use these identities for mapping: ${speakerHints}` : "";

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      // Using parts array directly for multi-part input as per guidelines
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: `${SYSTEM_PROMPT}${hintInstruction}\n\nTask: ${languageInstruction}\nProvide a complete JSON array of structured transcript segments with speaker labels. Ensure the JSON is terminated correctly.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: SENTENCE_SCHEMA,
        thinkingConfig: { thinkingBudget: 4000 },
        maxOutputTokens: 8192
      }
    });

    // Access .text property directly (not as a method)
    const text = response.text || '[]';
    return JSON.parse(text);
  } catch (error) {
    console.error("Transcription Error:", error);
    throw new Error("Verbatim transcription failed.");
  }
};

export const processDocument = async (
  payload: { base64?: string, text?: string, mimeType?: string },
  speakerHints: string = ""
): Promise<{speaker: string, text: string}[]> => {
  try {
    const parts: any[] = [];
    const hintInstruction = speakerHints ? `\n\nSPEAKER HINTS: Use these identities for mapping: ${speakerHints}` : "";
    
    if (payload.base64 && payload.mimeType === 'application/pdf') {
      parts.push({ inlineData: { data: payload.base64, mimeType: 'application/pdf' } });
      parts.push({ text: `${SYSTEM_PROMPT}${hintInstruction}\n\nExtract text from this PDF verbatim. Try to identify speakers. Return a complete, valid JSON array of speaker/text objects. Do not truncate.` });
    } else if (payload.text) {
      parts.push({ text: `${SYSTEM_PROMPT}${hintInstruction}\n\nSegment this text verbatim and identify speakers. Return a complete, valid JSON array of speaker/text objects:\n\n${payload.text}` });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: SENTENCE_SCHEMA,
        thinkingConfig: { thinkingBudget: 4000 },
        maxOutputTokens: 8192
      }
    });

    // Access .text property directly
    const text = response.text || '[]';
    return JSON.parse(text);
  } catch (error) {
    console.error("Doc Processing Error:", error);
    return [{ speaker: "System", text: "Error: Extraction failed. The document might be too large or complex for a single pass." }];
  }
};

export const generateReport = async (
  projectTitle: string, 
  codes: {label: string, segments: {text: string, ref: number}[]}[]
): Promise<string> => {
  const context = codes.map(c => 
    `Code: ${c.label}\nQuotes:\n${c.segments.map(s => `- [#${s.ref + 1}] "${s.text}"`).join('\n')}`
  ).join('\n\n');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `You are a researcher. Write a thematic synthesis for "${projectTitle}".
      Data:
      ${context}
      
      Structure: Intro, Findings (citing quotes verbatim and mentioning speaker patterns if relevant), Conclusion.`,
      config: {
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });
    // Access .text property directly
    return response.text || "Report generation failed.";
  } catch (error) {
    return "Thematic analysis failed.";
  }
};
