import { createClient as _createClient, SupabaseClient } from "@supabase/supabase-js";

export function createAdminClient(): SupabaseClient
{
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    return _createClient(url, serviceRole);
}

export default createAdminClient;
