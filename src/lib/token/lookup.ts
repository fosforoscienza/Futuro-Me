import type { SupabaseClient } from "@supabase/supabase-js";
import { isFaseFineAttiva, type Fase } from "@/lib/auth/area";
import { durableRateLimit } from "@/lib/auth/durable-rate-limit";
import { normalizeToken } from "./format";
import { hashToken } from "./server";

export type TokenCheck =
  | { ok: true; id: string; fase: Fase }
  | { ok: false; error: "format" | "notFound" | "done" | "tooMany" };

/**
 * Verifica un token scritto dallo studente e decide la fase da compilare:
 * "fine" quando l'admin l'ha aperta, altrimenti "inizio". Ogni tentativo conta
 * nel limite condiviso per IP (un'intera classe esce dallo stesso IP).
 */
export async function checkToken(db: SupabaseClient, raw: unknown, ip: string): Promise<TokenCheck> {
  if (!(await durableRateLimit(db, `questionario-token:${ip}`, 300, 600))) {
    return { ok: false, error: "tooMany" };
  }
  const token = normalizeToken(raw);
  if (!token) return { ok: false, error: "format" };

  const { data } = await db
    .from("questionario_token")
    .select("id")
    .eq("token_hash", hashToken(token))
    .is("chiuso_at", null)
    .maybeSingle();
  if (!data) return { ok: false, error: "notFound" };

  const fase: Fase = (await isFaseFineAttiva(db)) ? "fine" : "inizio";
  const { count } = await db
    .from("questionario_risposte")
    .select("id", { count: "exact", head: true })
    .eq("token_id", data.id)
    .eq("fase", fase);
  if (count) return { ok: false, error: "done" };
  return { ok: true, id: data.id, fase };
}

export const TOKEN_ERROR_STATUS: Record<Exclude<TokenCheck, { ok: true }>["error"], number> = {
  format: 400,
  notFound: 404,
  done: 409,
  tooMany: 429,
};
