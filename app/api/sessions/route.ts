import { NextResponse } from "next/server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const SESSION_OWNER_ROLES = new Set(["owner"]);

function parseDateInput(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

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

    const groupId = Number(body.group_id);
    const name = (body.name ?? "").trim();
    const description = typeof body.description === "string" ? body.description.trim() : null;
    const startTime = parseDateInput(body.start_time);
    const endTime = parseDateInput(body.end_time);

    if (!Number.isFinite(groupId)) {
      return NextResponse.json({ error: "group_id must be numeric" }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Session name is required" }, { status: 400 });
    }

    if (startTime && endTime && startTime > endTime) {
      return NextResponse.json({ error: "Start time must be before end time" }, { status: 400 });
    }

    const { data: group, error: groupError } = await service
      .from("groups")
      .select("id, deleted_at")
      .eq("id", groupId)
      .maybeSingle();

    if (groupError) {
      return NextResponse.json({ error: groupError.message }, { status: 500 });
    }

    if (!group || group.deleted_at) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const { data: groupMember, error: groupMemberError } = await service
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (groupMemberError) {
      return NextResponse.json({ error: groupMemberError.message }, { status: 500 });
    }

    if (!groupMember || !SESSION_OWNER_ROLES.has(groupMember.role ?? "")) {
      return NextResponse.json({ error: "Only group owners can create sessions" }, { status: 403 });
    }

    const sessionInsert: Record<string, unknown> = {
      group_id: groupId,
      name,
      description,
    };
    if (startTime) sessionInsert.start_time = startTime;
    if (endTime) sessionInsert.end_time = endTime;

    const { data: insertedSession, error: insertError } = await service
      .from("sessions")
      .insert(sessionInsert)
      .select()
      .single();

    if (insertError || !insertedSession) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to create session" },
        { status: insertError?.code === "23505" ? 409 : 500 },
      );
    }

    const { error: hostInsertError } = await service.from("session_members").upsert(
      {
        session_id: insertedSession.id,
        user_id: user.id,
        role: "host",
      },
      { onConflict: "session_id,user_id" },
    );

    if (hostInsertError) {
      await service.from("sessions").delete().eq("id", insertedSession.id);
      console.error("Failed to add host to session", hostInsertError);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: "Session created successfully",
        session: insertedSession,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected error while creating session", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
