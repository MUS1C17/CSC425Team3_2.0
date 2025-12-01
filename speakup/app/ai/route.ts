import { NextRequest, NextResponse } from "next/server";
import { generateModelText } from "@/lib/ai/model";
import { captureServerException } from "@/lib/observability/sentry";

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

    const prompt = `
            You are an assistant answering questions in a class Q&A app.
            Give a clear, helpful answer. Do not mention that you are AI unless asked.
            Question title:
            ${title ?? ""}
            Question details:
            ${description ?? ""}
            Return a concise answer, a few short paragraphs max.
                `.trim();

    const answerText = await generateModelText(prompt, "No answer generated.");

    return NextResponse.json({ answer: answerText });
  } catch (error) {
    captureServerException(error, { route: "ai/route" });
    return NextResponse.json(
      { error: "Failed to generate AI answer" },
      { status: 500 },
    );
  }
}
