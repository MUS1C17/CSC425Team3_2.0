import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request)
{
    try
    {
        const body = await req.json();
        const { email, password } = body;
        const first_name = body.first_name ?? null;
        const last_name = body.last_name ?? null;

        if (!email || !password)
        {
            return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { error } = await supabase.auth.admin.createUser(
            {
                email,
                password,
                email_confirm: true,
                user_metadata: { first_name, last_name },
            }
        );

        if (error)
        {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ ok: true }, { status: 201 });
    }
    catch (err: any)
    {
        return NextResponse.json({ error: err?.message ?? "Signup failed" }, { status: 500 });
    }
}