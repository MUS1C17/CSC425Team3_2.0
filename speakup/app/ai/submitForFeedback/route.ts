import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { buildFeedbackPrompt, templates, FeedbackPayload } from "@/lib/ai/templates";
import { generateModelText } from "@/lib/ai/model";
import { captureServerException } from "@/lib/observability/sentry";
import { getSubmission, logAiFeedback } from "@/lib/ai/persistence";

function coerceFeedback(raw: string): FeedbackPayload {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.verdict) {
      return {
        verdict: parsed.verdict,
        strength: parsed.strength || "You touched on the core idea.",
        gap: parsed.gap || "Clarify the reasoning.",
        improve: parsed.improve || "Add one more supporting detail.",
      };
    }
  } catch {
    //ignore parse errors
  }

  return {
    verdict: "almost",
    strength: "You referenced the main idea.",
    gap: "It needs more precision to be fully correct.",
    improve: "Add a concise reason or an example.",
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();

  try {
    const body = await req.json().catch(() => ({}));
    const submissionId = String(body.submission_id ?? "").trim();
    const userAnswer = String(body.user_answer ?? body.userAnswer ?? "").trim();

    if (body.forceError === "2") {
      const err = new Error("AI feedback test error 2");
      captureServerException(err, { trigger: "forceError-2", route: "submitForFeedback" });
      throw err;
    }

    if (!submissionId) {
      return NextResponse.json({ error: "submission_id is required" }, { status: 400 });
    }

    if (!userAnswer) {
      return NextResponse.json({ error: "user_answer is required" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && process.env.NODE_ENV !== "test") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const actorId = user?.id ?? "test-user";
    const submission = await getSubmission(submissionId);

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.user_id && submission.user_id !== actorId && process.env.NODE_ENV !== "test") {
      return NextResponse.json({ error: "You cannot submit feedback for this entry" }, { status: 403 });
    }

    let questionText = submission.response;
    let idealAnswer = "Keep your answer concise and focused on the core idea.";

    try {
      const parsed = JSON.parse(submission.response);
      if (parsed.question) questionText = parsed.question;
      if (parsed.idealAnswer) idealAnswer = parsed.idealAnswer;
    } catch {
      //best effort; use stored response as-is
    }

    const prompt = buildFeedbackPrompt(questionText, idealAnswer, userAnswer);
    const aiText = await generateModelText(
      `${prompt}\n\nRespond only with the JSON object described above.`,
      JSON.stringify({
        verdict: "almost",
        strength: "You referenced the key idea.",
        gap: "It needs one more detail to be complete.",
        improve: "Explain why the idea matters or give one example.",
      }),
    );

    const feedback = coerceFeedback(aiText);
    try {
      await logAiFeedback({
        submissionId,
        userAnswer,
        aiFeedback: JSON.stringify(feedback),
      });
    } catch (err) {
      captureServerException(err, { stage: "logAiFeedback" });
    }

    return NextResponse.json({
      submissionId,
      feedback,
      promptTemplate: templates.feedbackTemplate,
    });
  } catch (error) {
    captureServerException(error, { route: "ai/submitForFeedback" });
    const message = error instanceof Error ? error.message : "Unable to score answer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
