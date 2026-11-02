import type { SupabaseClient } from "@supabase/supabase-js";
import { durableRateLimit } from "./durable-rate-limit";
import { DUMMY_HASH, normalizeUsername, verifyPassword } from "./password";
import type { Ruolo } from "./session";

export type LoginResult =
  | { ok: true; account: { id: string; ruolo: Ruolo; authVersion: string } }
  | { ok: false; error: "tooMany" | "invalid" };

export async function checkCredentials(
  db: SupabaseClient, rawUsername: string, password: string, ip: string
): Promise<LoginResult> {
  const username = normalizeUsername(rawUsername);
  if (!username || username.length > 64 || !password || password.length > 72) {
    return { ok: false, error: "invalid" };
  }
  // Reserve before hashing; successful and failed attempts both count. Never reset
  // after login: a parallel successful request must not erase other reservations.
  if (!(await durableRateLimit(db, `login-ip:${ip}`, 100, 300)) ||
      !(await durableRateLimit(db, `login-user:${username}`, 10, 900))) {
    return { ok: false, error: "tooMany" };
  }
  const { data: account, error } = await db.from("account")
    .select("id, ruolo, password_hash, auth_version").eq("username", username).maybeSingle();
  if (error) return { ok: false, error: "invalid" };
  const valid = await verifyPassword(password, account?.password_hash ?? DUMMY_HASH);
  if (!account || !valid || !account.auth_version) return { ok: false, error: "invalid" };
  return { ok: true, account: { id: account.id, ruolo: account.ruolo, authVersion: account.auth_version } };
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
