import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GOOGLE_GENAI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description } = body as {
      title?: string;
      description?: string | null;
    };

    if (!title && !description) {
      return NextResponse.json({ error: "Missing question content" }, { status: 400 });
    }

    const prompt = buildPrompt(title, description);

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
    });

    const answerText = (response as any).text ?? "No answer generated.";

    return NextResponse.json({ answer: answerText });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI answer" },
      { status: 500 },
    );
  }
}

function buildPrompt(title?: string, description?: string | null) {
  return [
    "You are an assistant answering questions in a class Q&A app.",
    "Give a clear, helpful answer. Do not mention that you are AI unless asked.",
    "",
    "Question title:",
    title ?? "",
    "",
    "Question details:",
    description ?? "",
    "",
    "Return a concise answer, a few short paragraphs max.",
  ]
    .join("\n")
    .trim();
}
}
