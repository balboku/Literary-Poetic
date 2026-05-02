import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { optionalEnv } from "./env";

let supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  const url = optionalEnv("SUPABASE_URL");
  const serviceRoleKey = optionalEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    return null;
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
}
