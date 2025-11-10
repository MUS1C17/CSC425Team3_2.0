import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
    const supabase = await createServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user)
        return NextResponse.json({ error: "User not authenticated" }, { status: 401 });

    const userId = authData.user.id;
    const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, avatar_path")
        .eq("id", userId)
        .limit(1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data?.[0]);
    }

export async function PATCH(req: Request) {
    const supabase = await createServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user)
        return NextResponse.json({ error: "User not authenticated" }, { status: 401 });

    const userId = authData.user.id;
    const body = await req.json();
    type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
    const updates: Partial<UserUpdate> = {};

    // Only include fields that are not undefined
    if (body.first_name !== undefined) updates.first_name = body.first_name;
    if (body.last_name !== undefined) updates.last_name = body.last_name;
    // email is not stored on the `users`/profiles row in our DB schema here,
    // so we skip updating it on this table (handle via auth if needed).
    if (body.avatar_path !== undefined) updates.avatar_path = body.avatar_path;

    // Use an admin client for the update to avoid strict client-side typing constraints
    const admin = createAdminClient();
    const { data, error } = await admin
        .from("users")
        .update(updates as any)
        .eq("id", userId)
        .select()
        .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

