import { NextResponse } from "next/server";

function cookieClear(name: string)
{
    return `${name}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

export async function POST()
{
    const headers = new Headers();
    headers.append("Set-Cookie", cookieClear("sb-access-token"));
    headers.append("Set-Cookie", cookieClear("sb-refresh-token"));
    return new NextResponse(JSON.stringify({ ok: true }), { status: 200, headers });
}