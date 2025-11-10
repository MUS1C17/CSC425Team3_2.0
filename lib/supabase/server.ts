import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Lightweight server-side Supabase client factory.
 * This intentionally uses the server-side keys and does not attempt
 * to manage cookie sync. It matches existing call sites that expect
 * a function named `createServerClient()` returning a Supabase client.
 */
export function createServerClient(): SupabaseClient<Database> {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
  );
}

// Backwards-compatible alias used in several call sites
export const createClient = createServerClient;
