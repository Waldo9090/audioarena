import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireEnv } from "@/lib/env";

let cachedClient: SupabaseClient | undefined;

export function getSupabaseAdmin() {
  if (!cachedClient) {
    cachedClient = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  return cachedClient;
}
