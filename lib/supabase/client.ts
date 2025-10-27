import { createClient as _createClient, SupabaseClient } from "@supabase/supabase-js";

export function createClient(): SupabaseClient
{
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return _createClient(url, anonKey);
}
