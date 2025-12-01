import { GoogleGenAI } from "@google/genai";
import { captureServerException } from "../observability/sentry";

const FALLBACK_CHALLENGE =
  "Practice Question: Summarize the main takeaway from today's session in two sentences.";

function normalizeResponseText(response: any): string {
  if (!response) return "";
  if (typeof response.text === "function") {
    try {
      return response.text();
    } catch {
      //ignored
    }
  }
  if (typeof response.text === "string") return response.text;
  if (response.response?.text) return response.response.text;
  const contentParts = response.response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(contentParts)) {
    return contentParts
      .map((p: any) => {
        if (typeof p?.text === "string") return p.text;
        if (typeof p === "string") return p;
        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  if (typeof response.candidates?.[0]?.content?.parts?.[0]?.text === "string") {
    return response.candidates[0].content.parts[0].text;
  }
  return "";
}

export async function generateModelText(prompt: string, fallback = FALLBACK_CHALLENGE) {
  const key = process.env.GOOGLE_GENAI_API_KEY;
  const useMock = process.env.USE_MOCK_AI === "true" || process.env.NODE_ENV === "test";

  if (!key || useMock) {
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: process.env.GOOGLE_GENAI_MODEL || "gemini-3-pro-preview",
      contents: [{ role: "user", parts: [{ text: prompt }]}],
    });
    const normalized = normalizeResponseText(response) || fallback;
    return normalized;
  } catch (error) {
    captureServerException(error, { promptKind: "generic" });
    return fallback;
  }
}
