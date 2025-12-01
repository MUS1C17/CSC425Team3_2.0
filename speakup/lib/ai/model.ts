import { GoogleGenAI } from "@google/genai";
import { captureServerException } from "../observability/sentry";

const DEFAULT_RESPONSE = 
  "Quick reflection: What was the most important concept covered in today's discussion?";

/**
 * Extracts text content from various Google AI response formats
 * Handles multiple response structures to ensure compatibility
 */
function extractTextFromResponse(apiResponse: unknown): string {
  if (!apiResponse) return "";
  
  // Handle function-based text extraction
  if (typeof (apiResponse as { text?: () => string }).text === "function") {
    try {
      return (apiResponse as { text: () => string }).text();
    } catch {
      // Silent fail, continue to other methods
    }
  }
  
  // Direct text property
  if (typeof (apiResponse as { text?: string }).text === "string") {
    return (apiResponse as { text: string }).text;
  }
  
  // Nested response.text structure
  const responseText = (apiResponse as { response?: { text?: string } }).response?.text;
  if (responseText) {
    return responseText;
  }
  
  // Complex candidates structure with parts
  const candidateContent = (apiResponse as { 
    response?: { 
      candidates?: Array<{ 
        content?: { 
          parts?: Array<{ text?: string } | string> 
        } 
      }> 
    } 
  }).response?.candidates?.[0]?.content?.parts;
  
  if (Array.isArray(candidateContent)) {
    return candidateContent
      .map((part) => {
        if (typeof (part as { text?: string })?.text === "string") {
          return (part as { text: string }).text;
        }
        if (typeof part === "string") return part;
        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  
  // Direct candidates path
  const directText = (apiResponse as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>
      }
    }>
  }).candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (typeof directText === "string") {
    return directText;
  }
  
  return "";
}

/**
 * Generates AI text using Google's Gemini model
 * Falls back to provided text if API is unavailable or configured for testing
 */
export async function generateModelText(inputPrompt: string, fallbackText = DEFAULT_RESPONSE) {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  const shouldUseMock = process.env.USE_MOCK_AI === "true" || process.env.NODE_ENV === "test";

  // Return fallback for testing or when API key is missing
  if (!apiKey || shouldUseMock) {
    return fallbackText;
  }

  try {
    const client = new GoogleGenAI({ apiKey });
    const modelResponse = await client.models.generateContent({
      model: process.env.GOOGLE_GENAI_MODEL || "gemini-1.5-flash",
      contents: [{ 
        role: "user", 
        parts: [{ text: inputPrompt }]
      }],
    });
    
    const extractedText = extractTextFromResponse(modelResponse) || fallbackText;
    return extractedText;
  } catch (error) {
    captureServerException(error, { 
      context: "ai-text-generation",
      promptLength: inputPrompt.length 
    });
    return fallbackText;
  }
}
