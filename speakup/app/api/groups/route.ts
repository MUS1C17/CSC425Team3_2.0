import { randomInt } from "crypto";
import { NextResponse } from "next/server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const JOIN_CODE_LENGTH = 8;
const JOIN_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const MAX_JOIN_CODE_ATTEMPTS = 5;

type SupabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

type CoercedBoolean = { ok: true; value: boolean } | { ok: false };

function generateJoinCode() {
  let code = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i += 1) {
    const idx = randomInt(JOIN_CODE_ALPHABET.length);
    code += JOIN_CODE_ALPHABET[idx];
  }
  return code;
}

function buildJoinLink(joinCode: string) {
  const path = `/groups/join?code=${joinCode}`;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
    : null;
  return baseUrl ? `${baseUrl}${path}` : path;
}

function coerceIsPrivate(value: unknown): CoercedBoolean {
  if (typeof value === "undefined") {
    return { ok: true, value: false };
  }

  if (typeof value === "boolean") {
    return { ok: true, value };
  }

  if (typeof value === "string") {
    if (value === "true") {
      return { ok: true, value: true };
    }
    if (value === "false") {
      return { ok: true, value: false };
    }
  }

  return { ok: false };
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

    const userId = user.id;

    const name = (body.name ?? "").trim();
    const description = typeof body.description === "string" ? body.description.trim() : null;

    const parsedIsPrivate = coerceIsPrivate(body.is_private);

    if (!parsedIsPrivate.ok) {
      return NextResponse.json({ error: "is_private must be boolean" }, { status: 400 });
    }
    const isPrivate = parsedIsPrivate.value;

    if (!name) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    let createdGroup: Record<string, unknown> | null = null;
    let lastError: SupabaseError | null = null;

    for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt += 1) {
      const joinCode = generateJoinCode();
      const joinLink = buildJoinLink(joinCode);

      const { data, error } = await service.rpc("create_group_with_owner", {
        p_name: name,
        p_description: description,
        p_is_private: isPrivate,
        p_admin_id: userId,
        p_join_code: joinCode,
        p_join_link: joinLink,
      });

      if (!error && data) {
        createdGroup = data;
        break;
      }

      lastError = error ?? null;

      const isUniqueViolation = error?.code === "23505";
      const isJoinCodeConflict =
        isUniqueViolation &&
        (error?.message?.includes("join_code") || error?.details?.includes("join_code"));

      if (isJoinCodeConflict) {
        continue;
      }

      console.error("Failed to create group", error);
      return NextResponse.json(
        { error: "Failed to create group" },
        { status: isUniqueViolation ? 409 : 500 },
      );
    }

    if (!createdGroup) {
      if (lastError) {
        console.error("Failed to create group after retrying join code generation", lastError);
      }

      const isUniqueViolation = lastError?.code === "23505";
      return NextResponse.json(
        {
          error: isUniqueViolation
            ? "Group join code already exists, please retry"
            : "Failed to create group",
        },
        { status: isUniqueViolation ? 409 : 500 },
      );
    }

    return NextResponse.json(
      { message: "Group created successfully", group: createdGroup },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected error while creating group", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
