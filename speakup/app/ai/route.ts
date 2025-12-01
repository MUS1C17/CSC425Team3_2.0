import { NextRequest, NextResponse } from "next/server";
import { generateModelText } from "@/lib/ai/model";
import { captureServerException } from "@/lib/observability/sentry";

/**
 * Simple AI answer endpoint for direct question-answer interactions
 * Used by legacy components that need basic AI responses
 */
export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const { title, description } = requestBody as {
      title?: string;
      description?: string | null;
    };

    // Validate input
    if (!title && !description) {
      return NextResponse.json(
        { error: "Question content is required" }, 
        { status: 400 }
      );
    }

    // Build context-aware prompt
    const questionPrompt = `
You are a helpful teaching assistant providing clear answers to student questions.

Question: ${title ?? ""}
${description ? `Details: ${description}` : ""}

Provide a concise, educational response that:
- Directly addresses the question
- Uses clear, accessible language
- Includes relevant examples when helpful
- Encourages further learning

Keep your response focused and practical.
    `.trim();

    const generatedAnswer = await generateModelText(
      questionPrompt,
      "I understand your question. Let me provide a clear explanation of the key concepts involved."
    );

    return NextResponse.json({ 
      answer: generatedAnswer,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    captureServerException(error, { 
      endpoint: "ai/route",
      context: "direct-answer-generation"
    });
    
    return NextResponse.json(
      { error: "Unable to generate response at this time" },
      { status: 500 }
    );
  }
}
