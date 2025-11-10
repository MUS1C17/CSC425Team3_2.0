import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const ALLOWED_QUESTION_BUCKETS = new Set(["q_attach"]);

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

    const title = (body.title ?? "").trim();
    const description = typeof body.description === "string" ? body.description.trim() : null;

    const sessionId = Number(body.session_id);

    const attachments: AttachmentPayload[] = Array.isArray(body.attachments)
      ? body.attachments
      : [];

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!Number.isFinite(sessionId)) {
      return NextResponse.json({ error: "session_id must be numeric" }, { status: 400 });
    }

    if (attachments.some((att) => !ALLOWED_QUESTION_BUCKETS.has(att.storage_bucket))) {
      return NextResponse.json(
        { error: "Attachments must use the q_attach bucket" },
        { status: 400 },
      );
    }

    if (attachments.some((att) => att.uploaded_by !== user.id)) {
      return NextResponse.json({ error: "Attachment owner mismatch" }, { status: 403 });
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

    const groupId = session.group_id;

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
        .eq("group_id", groupId)
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
        .eq("group_id", groupId)
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
    const isSessionMember = Boolean(sessionMember);
    const isGroupPrivileged = groupMember
      ? groupPrivilegedRoles.has(groupMember.role ?? "")
      : false;

    if (!isSessionMember && !isGroupPrivileged) {
      return NextResponse.json(
        { error: "You must join this session before asking questions" },
        { status: 403 },
      );
    }

    if (activeSessionBan) {
      return NextResponse.json(
        {
          error: `You are banned from this session${
            activeSessionBan.reason ? `: ${activeSessionBan.reason}` : ""
          }`,
        },
        { status: 403 },
      );
    }

    if (activeGroupBan) {
      return NextResponse.json(
        {
          error: `You are banned from this group${
            activeGroupBan.reason ? `: ${activeGroupBan.reason}` : ""
          }`,
        },
        { status: 403 },
      );
    }

    //inserting questions
    const { data: insertedQuestion, error: insertError } = await service
      .from("questions")
      .insert({ session_id: sessionId, author_id: user.id, title, description })
      .select()
      .single();

    if (insertError || !insertedQuestion) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to insert question" },
        { status: 500 },
      );
    }

    //saving attachments to storage
    if (attachments.length > 0) {
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];

        const row = {
          question_id: insertedQuestion.id,
          storage_bucket: attachment.storage_bucket,
          storage_path: attachment.storage_path,
          mime_type: attachment.mime_type,
          byte_size: attachment.byte_size,
          position: i + 1,
          uploaded_by: attachment.uploaded_by,
        };

        const { error: attachmentError } = await service.from("question_attachments").insert(row);

        if (attachmentError) {
          return NextResponse.json(
            { error: `Failed to save attachment: ${attachmentError.message}` },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json({ question: insertedQuestion }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
