import { createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Shared atomic limits; no raw IPs/usernames stored. Expiry is at most 15 minutes. */
export async function durableRateLimit(
  db: SupabaseClient, key: string, limit: number, windowSeconds: number
): Promise<boolean> {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return false;
  const keyHash = createHmac("sha256", secret).update(key).digest("hex");
  try {
    const { data, error } = await db.rpc("consume_auth_rate_limit", {
      p_key_hash: keyHash, p_limit: limit, p_window_seconds: windowSeconds,
    });
    return !error && data === true;
  } catch {
    return false;
  }
}
