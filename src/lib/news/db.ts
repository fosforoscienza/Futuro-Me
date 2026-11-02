import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase con service role, solo lato server (route, server action,
 * server component). Restituisce null se le variabili non sono impostate, così
 * build e pagine pubbliche funzionano anche senza database (solo news statiche).
 */
export function newsDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function requireNewsDb(): SupabaseClient {
  const db = newsDb();
  if (!db) {
    throw new Error(
      "Supabase non configurato: servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return db;
}
