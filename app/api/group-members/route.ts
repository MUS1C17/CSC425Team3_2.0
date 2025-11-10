import { NextResponse } from "next/server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type BanRow = {
  reason: string | null;
  ban_until: string | null;
};

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const service = createServiceClient();
    const body = await req.json().catch(() => ({}));

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const rawCode =
      typeof body.join_code === "string"
        ? body.join_code
        : typeof body.code === "string"
          ? body.code
          : "";
    const joinCode = rawCode.trim().toUpperCase();

    if (!joinCode) {
      return NextResponse.json({ error: "join_code is required" }, { status: 400 });
    }

    const { data: group, error: groupError } = await service
      .from("groups")
      .select("id, name, description, join_code, join_link, deleted_at")
      .eq("join_code", joinCode)
      .maybeSingle();

    if (groupError) {
      return NextResponse.json({ error: groupError.message }, { status: 500 });
    }

    if (!group || group.deleted_at) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const { data: existingMember, error: memberError } = await service
      .from("group_members")
      .select("role")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    if (existingMember) {
      return NextResponse.json(
        {
          message: "Already a member of this group",
          membership: existingMember,
          group,
        },
        { status: 200 },
      );
    }

    const { data: groupBans, error: groupBansError } = await service
      .from("group_bans")
      .select("reason, ban_until")
      .eq("group_id", group.id)
      .eq("user_id", user.id);

    if (groupBansError) {
      return NextResponse.json({ error: groupBansError.message }, { status: 500 });
    }

    const now = Date.now();
    const activeGroupBan =
      (groupBans as BanRow[] | null)?.find(
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

    const { data: insertedMembership, error: insertError } = await service
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: "member",
      })
      .select("group_id, user_id, role, joined_at")
      .single();

    if (insertError || !insertedMembership) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to join group" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Joined group successfully",
        membership: insertedMembership,
        group,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected error while joining group", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
