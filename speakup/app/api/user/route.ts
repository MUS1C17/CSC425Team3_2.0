import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

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
    const updates: any = {};

    //Only include fields that are not undefined
    if (body.first_name !== undefined) updates.first_name = body.first_name;
    if (body.last_name !== undefined) updates.last_name = body.last_name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.avatar_path !== undefined) updates.avatar_path = body.avatar_path;

    const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userId)
        .select()
        .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

