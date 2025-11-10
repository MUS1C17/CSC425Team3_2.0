import { NextResponse } from "next/server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const PRIVILEGED_GROUP_ROLES = new Set(["owner", "moderator"]);
const SESSION_ROLES = new Set(["host", "moderator", "attendee"]);

type SessionMemberRow = {
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const sessionId = Number(body.session_id);

    if (!Number.isFinite(sessionId)) {
      return NextResponse.json({ error: "session_id must be numeric" }, { status: 400 });
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

    const [groupMemberRes, sessionMemberRes, groupBansRes, sessionBansRes] = await Promise.all([
      service
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .maybeSingle(),
      service
        .from("session_members")
        .select("role")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle(),
      service
        .from("group_bans")
        .select("reason, ban_until")
        .eq("group_id", groupId)
        .eq("user_id", user.id),
      service
        .from("session_bans")
        .select("reason, ban_until")
        .eq("session_id", sessionId)
        .eq("user_id", user.id),
    ]);

    if (groupMemberRes.error) {
      return NextResponse.json({ error: groupMemberRes.error.message }, { status: 500 });
    }
    if (sessionMemberRes.error) {
      return NextResponse.json({ error: sessionMemberRes.error.message }, { status: 500 });
    }
    if (groupBansRes.error) {
      return NextResponse.json({ error: groupBansRes.error.message }, { status: 500 });
    }
    if (sessionBansRes.error) {
      return NextResponse.json({ error: sessionBansRes.error.message }, { status: 500 });
    }

    const groupMember = groupMemberRes.data as SessionMemberRow | null;
    const existingSessionMember = sessionMemberRes.data as SessionMemberRow | null;

    if (!groupMember) {
      return NextResponse.json(
        { error: "You must join the group before joining sessions" },
        { status: 403 },
      );
    }

    const now = Date.now();
    const activeGroupBan =
      (groupBansRes.data as BanRow[] | null)?.find(
        (ban) => !ban.ban_until || new Date(ban.ban_until).getTime() > now,
      ) ?? null;
    const activeSessionBan =
      (sessionBansRes.data as BanRow[] | null)?.find(
        (ban) => !ban.ban_until || new Date(ban.ban_until).getTime() > now,
      ) ?? null;

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

    if (existingSessionMember) {
      return NextResponse.json(
        {
          message: "Already joined session",
          membership: existingSessionMember,
        },
        { status: 200 },
      );
    }

    const role = PRIVILEGED_GROUP_ROLES.has(groupMember.role ?? "") ? "moderator" : "attendee";

    if (!SESSION_ROLES.has(role)) {
      return NextResponse.json({ error: "Invalid session role" }, { status: 400 });
    }

    const { data: insertedMembership, error: insertError } = await service
      .from("session_members")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        role,
      })
      .select()
      .single();

    if (insertError || !insertedMembership) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to join session" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Joined session successfully",
        membership: insertedMembership,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected error while joining session", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
