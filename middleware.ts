import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest)
{
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const
  {
    data: { session },
  } = await supabase.auth.getSession();

  const isProtected = req.nextUrl.pathname.startsWith("/protected");
  const isAuthRoute = req.nextUrl.pathname.startsWith("/auth");

  if (isProtected && !session && !isAuthRoute) 
    {
    const loginUrl = new URL("/auth/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
  return res;
}

export const config =
{
  matcher: ["/protected/:path*", "/protected"],
};