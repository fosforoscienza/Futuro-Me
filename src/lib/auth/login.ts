import type { SupabaseClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";
import { DUMMY_HASH, normalizeUsername, verifyPassword } from "./password";
import type { Ruolo } from "./session";

/**
 * Controllo delle credenziali con due limiti:
 * - per username, su database (10 errori in 15 minuti): regge tra istanze
 *   serverless diverse e protegge il singolo account;
 * - per IP, in memoria e largo: in classe molti ragazzi escono dallo stesso IP.
 */

const MAX_FAILURES = 10;
const WINDOW_MINUTES = 15;

export type LoginResult =
  | { ok: true; account: { id: string; ruolo: Ruolo } }
  | { ok: false; error: "tooMany" | "invalid" };

export async function checkCredentials(
  db: SupabaseClient,
  rawUsername: string,
  password: string,
  ip: string
): Promise<LoginResult> {
  if (!rateLimit(`login:${ip}`, { limit: 100, windowSeconds: 300 }).success) {
    return { ok: false, error: "tooMany" };
  }

  const username = normalizeUsername(rawUsername).slice(0, 64);
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await db
    .from("login_tentativi")
    .select("id", { count: "exact", head: true })
    .eq("username", username)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_FAILURES) return { ok: false, error: "tooMany" };

  const { data: account } = await db
    .from("account")
    .select("id, ruolo, password_hash")
    .eq("username", username)
    .maybeSingle();

  // Hash calcolato comunque: i tempi non rivelano se l'username esiste.
  const valid = await verifyPassword(password, account?.password_hash ?? DUMMY_HASH);
  if (!account || !valid) {
    await db.from("login_tentativi").insert({ username });
    // Pulizia dei tentativi vecchi, così la tabella resta piccola.
    await db
      .from("login_tentativi")
      .delete()
      .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    return { ok: false, error: "invalid" };
  }

  await db.from("login_tentativi").delete().eq("username", username);
  return { ok: true, account: { id: account.id, ruolo: account.ruolo } };
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
