import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies, headers } from "next/headers";

export function createServerClient()
{
  return createServerComponentClient({ headers, cookies } as any);
}
