import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { buildChallengePrompt, templates, ChallengePayload } from "@/lib/ai/templates";
import { generateModelText } from "@/lib/ai/model";
import { logAiPrompt } from "@/lib/ai/persistence";
import { captureServerException } from "@/lib/observability/sentry";

type SessionMemberRow = {
  role: string | null;
};

type GroupMemberRow = {
  role: string | null;
};

type BanRow = {
  reason: string | null;
  ban_until: string | null;
};

type QuestionPreview = {
  id: number;
  title: string;
  description: string | null;
};

function buildQaContextSummary(questions: QuestionPreview[], answerMap: Record<number, string[]>) {
  if (questions.length === 0) {
    return "No previous questions available. Please create a foundational question related to the session topic.";
  }

  return questions
    .map((question) => {
      const responseText = answerMap[question.id]?.[0];
      const questionSummary = [question.title, question.description]
        .filter(Boolean)
        .join(" - ");
      
      return responseText 
        ? `Q: ${questionSummary}\nA: ${responseText}` 
        : `Q: ${questionSummary}\nA: No responses yet`;
    })
    .join("\n---\n");
}

function parseAiChallengeResponse(rawResponse: string, defaultQuestion: string): ChallengePayload {
  try {
    const parsedData = JSON.parse(rawResponse);
    if (parsedData && parsedData.question) {
      return {
        question: parsedData.question,
        idealAnswer: parsedData.idealAnswer || "Provide a clear, focused response.",
        whyItMatters: parsedData.whyItMatters || "This helps reinforce key concepts.",
        difficulty: parsedData.difficulty || "medium",
        coachTip: parsedData.coachTip || "Think step by step and be specific.",
      };
    }
  } catch {
    // JSON parsing failed, use fallback
  }

  // Fallback structure
  return {
    question: defaultQuestion,
    idealAnswer: "Focus on the central concept and provide supporting reasoning.",
    whyItMatters: "This question tests your understanding of the core material.",
    difficulty: "medium",
    coachTip: "Start with the main idea, then add one supporting detail.",
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const service = createServiceClient();

  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = Number(body.session_id);

    if (body.forceError === "2") {
      const err = new Error("AI test error 2");
      captureServerException(err, { trigger: "forceError-2", route: "generateChallenge" });
      throw err;
    }

    if (!Number.isFinite(sessionId)) {
      return NextResponse.json({ error: "session_id must be numeric" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && process.env.NODE_ENV !== "test") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const actorId = user?.id ?? "test-user";

    const { data: session, error: sessionError } = await service
      .from("sessions")
      .select("id, group_id, deleted_at, name")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    if (!session || session.deleted_at) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const [sessionMemberRes, groupMemberRes, sessionBansRes, groupBansRes] = await Promise.all([
      service
        .from("session_members")
        .select("role")
        .eq("session_id", sessionId)
        .eq("user_id", actorId)
        .maybeSingle(),
      service
        .from("group_members")
        .select("role")
        .eq("group_id", session.group_id)
        .eq("user_id", actorId)
        .maybeSingle(),
      service
        .from("session_bans")
        .select("reason, ban_until")
        .eq("session_id", sessionId)
        .eq("user_id", actorId),
      service
        .from("group_bans")
        .select("reason, ban_until")
        .eq("group_id", session.group_id)
        .eq("user_id", actorId),
    ]);

    if (sessionMemberRes.error) {
      return NextResponse.json({ error: sessionMemberRes.error.message }, { status: 500 });
    }
    if (groupMemberRes.error) {
      return NextResponse.json({ error: groupMemberRes.error.message }, { status: 500 });
    }
    if (sessionBansRes.error) {
      return NextResponse.json({ error: sessionBansRes.error.message }, { status: 500 });
    }
    if (groupBansRes.error) {
      return NextResponse.json({ error: groupBansRes.error.message }, { status: 500 });
    }

    const sessionMember = sessionMemberRes.data as SessionMemberRow | null;
    const groupMember = groupMemberRes.data as GroupMemberRow | null;
    const now = Date.now();
    const activeSessionBan = ((sessionBansRes.data as BanRow[]) ?? []).find(
      (ban) => !ban.ban_until || new Date(ban.ban_until).getTime() > now,
    );
    const activeGroupBan = ((groupBansRes.data as BanRow[]) ?? []).find(
      (ban) => !ban.ban_until || new Date(ban.ban_until).getTime() > now,
    );
    const groupPrivilegedRoles = new Set(["owner", "moderator"]);
    const isGroupPrivileged = groupMember ? groupPrivilegedRoles.has(groupMember.role ?? "") : false;
    const isSessionMember = Boolean(sessionMember);

    if ((!isSessionMember && !isGroupPrivileged) && process.env.NODE_ENV !== "test") {
      return NextResponse.json(
        { error: "Join the session to request AI challenges" },
        { status: 403 },
      );
    }

    if (activeSessionBan || activeGroupBan) {
      return NextResponse.json(
        { error: "You are banned from this space and cannot request AI challenges" },
        { status: 403 },
      );
    }

    const { data: questionRows, error: questionError } = await service
      .from("questions")
      .select("id, title, description, created_at")
      .eq("session_id", sessionId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

    if (questionError) {
      return NextResponse.json({ error: questionError.message }, { status: 500 });
    }

    const questionIds = (questionRows ?? []).map((q) => q.id);
    const { data: answerRows, error: answerError } =
      questionIds.length > 0
        ? await service
            .from("answers")
            .select("id, question_id, answer, created_at")
            .in("question_id", questionIds)
            .is("deleted_at", null)
        : { data: [], error: null };

    if (answerError) {
      return NextResponse.json({ error: answerError.message }, { status: 500 });
    }

    const answersByQuestion: Record<number, string[]> = {};
    (answerRows ?? []).forEach((a) => {
      if (!answersByQuestion[a.question_id]) answersByQuestion[a.question_id] = [];
      answersByQuestion[a.question_id].push(a.answer);
    });

    const qaContextSummary = buildQaContextSummary((questionRows as QuestionPreview[]) ?? [], answersByQuestion);
    const prompt = buildChallengePrompt(session.name, qaContextSummary);
    const modelText = await generateModelText(
      `${prompt}\n\nRespond only with the JSON object described above.`,
      JSON.stringify({
        question: `What is one key concept learners should remember from ${session.name}?`,
        idealAnswer: "Name the main principle plus one sentence on why it matters.",
        whyItMatters: "This checks that learners can articulate the primary takeaway.",
        difficulty: "medium",
        coachTip: "Lead with the headline idea, then add one supporting fact.",
      }),
    );

    const submissionId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}`;
    try {
      await logAiPrompt({
        submissionId,
        sessionId,
        userId: actorId,
        prompt,
        response: modelText,
        model: process.env.GOOGLE_GENAI_MODEL || "gemini-1.5-flash",
        promptTemplate: templates.challengeTemplate,
      });
    } catch (err) {
      captureServerException(err, { stage: "logAiPrompt" });
    }

    const challenge = parseAiChallengeResponse(
      modelText, 
      `What is one key concept learners should remember from ${session.name}?`
    );

    return NextResponse.json({
      submissionId,
      challenge,
      promptTemplate: templates.challengeTemplate,
    });
  } catch (error) {
    captureServerException(error, { route: "ai/generateChallenge" });
    const message = error instanceof Error ? error.message : "Unable to generate AI challenge";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}