import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const ALLOWED_ANSWER_BUCKETS = new Set(["a_attach"]);

//component specific types
type AttachmentPayload = {
  storage_bucket: string;
  storage_path: string;
  mime_type: string;
  byte_size: number;
  uploaded_by: string;
};

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

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const service = createServiceClient();
    const body = await req.json();

    //validating user authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const answerText = (body.answer ?? "").trim();
    const questionId = Number(body.question_id);
    const sessionId = Number(body.session_id);
    const attachments: AttachmentPayload[] = Array.isArray(body.attachments)
      ? body.attachments
      : [];

    if (!answerText) {
      return NextResponse.json({ error: "Answer text is required" }, { status: 400 });
    }

    if (!Number.isFinite(questionId) || !Number.isFinite(sessionId)) {
      return NextResponse.json(
        { error: "question_id and session_id must be numeric" },
        { status: 400 },
      );
    }

    if (attachments.some((att) => !ALLOWED_ANSWER_BUCKETS.has(att.storage_bucket))) {
      return NextResponse.json(
        { error: "Attachments must use the a_attach bucket" },
        { status: 400 },
      );
    }

    if (attachments.some((att) => att.uploaded_by !== user.id)) {
      return NextResponse.json({ error: "Attachment owner mismatch" }, { status: 403 });
    }

    const { data: question, error: questionError } = await service
      .from("questions")
      .select("id, session_id")
      .eq("id", questionId)
      .maybeSingle();

    if (questionError) {
      return NextResponse.json({ error: questionError.message }, { status: 500 });
    }

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    if (question.session_id !== sessionId) {
      return NextResponse.json(
        { error: "Question does not belong to this session" },
        { status: 400 },
      );
    }

    const { data: session, error: sessionError } = await service
      .from("sessions")
      .select("id, group_id, deleted_at")
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
        .eq("user_id", user.id)
        .maybeSingle(),
      service
        .from("group_members")
        .select("role")
        .eq("group_id", session.group_id)
        .eq("user_id", user.id)
        .maybeSingle(),
      service
        .from("session_bans")
        .select("reason, ban_until")
        .eq("session_id", sessionId)
        .eq("user_id", user.id),
      service
        .from("group_bans")
        .select("reason, ban_until")
        .eq("group_id", session.group_id)
        .eq("user_id", user.id),
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
    const sessionAnswerRoles = new Set(["host", "moderator"]);
    const hasSessionRole = sessionMember ? sessionAnswerRoles.has(sessionMember.role ?? "") : false;
    const isGroupPrivileged = groupMember
      ? groupPrivilegedRoles.has(groupMember.role ?? "")
      : false;

    if (!hasSessionRole && !isGroupPrivileged) {
      return NextResponse.json(
        { error: "Only session hosts or group moderators can answer questions" },
        { status: 403 },
      );
    }

    if (activeSessionBan) {
      return NextResponse.json(
        {
          error: `You are banned from this session${activeSessionBan.reason ? `: ${activeSessionBan.reason}` : ""}`,
        },
        { status: 403 },
      );
    }

    if (activeGroupBan) {
      return NextResponse.json(
        {
          error: `You are banned from this group${activeGroupBan.reason ? `: ${activeGroupBan.reason}` : ""}`,
        },
        { status: 403 },
      );
    }

    const { data: existingAnswer, error: existingAnswerError } = await service
      .from("answers")
      .select("id")
      .eq("question_id", questionId)
      .eq("author_id", user.id)
      .maybeSingle();

    if (existingAnswerError) {
      return NextResponse.json({ error: existingAnswerError.message }, { status: 500 });
    }

    let answerId: number;

    //updating answers
    if (existingAnswer) {
      const { data: updatedAnswer, error: updateError } = await service
        .from("answers")
        .update({ answer: answerText, deleted_at: null })
        .eq("id", existingAnswer.id)
        .select()
        .single();

      if (updateError || !updatedAnswer) {
        return NextResponse.json(
          { error: updateError?.message ?? "Failed to update answer" },
          { status: 500 },
        );
      }

      answerId = updatedAnswer.id;

      const { error: deleteOldAttachmentsError } = await service
        .from("answer_attachments")
        .delete()
        .eq("answer_id", answerId);
      if (deleteOldAttachmentsError) {
        return NextResponse.json({ error: deleteOldAttachmentsError.message }, { status: 500 });
      }
    } else {
      const { data: insertedAnswer, error: insertError } = await service
        .from("answers")
        .insert({ question_id: questionId, author_id: user.id, answer: answerText })
        .select()
        .single();

      if (insertError || !insertedAnswer) {
        return NextResponse.json(
          { error: insertError?.message ?? "Failed to insert answer" },
          { status: 500 },
        );
      }

      answerId = insertedAnswer.id;
    }

    //saving answer attachments to storage
    if (attachments.length > 0) {
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];

        const row = {
          answer_id: answerId,
          storage_bucket: attachment.storage_bucket,
          storage_path: attachment.storage_path,
          mime_type: attachment.mime_type,
          byte_size: attachment.byte_size,
          position: i + 1,
          uploaded_by: attachment.uploaded_by,
        };

        const { error: attachmentError } = await service.from("answer_attachments").insert(row);

        if (attachmentError) {
          return NextResponse.json(
            { error: `Failed to save attachment: ${attachmentError.message}` },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json({ answer_id: answerId }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
