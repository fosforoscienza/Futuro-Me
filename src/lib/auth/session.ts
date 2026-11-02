import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Sessioni su database: il cookie httpOnly contiene un token casuale di 256 bit,
 * la tabella `sessioni` solo il suo SHA-256. Così il logout e il reset della
 * password chiudono davvero le sessioni aperte, anche su altri dispositivi.
 */

export type Ruolo = "studente" | "gestore" | "admin";

export type SessionAccount = {
  id: string;
  username: string;
  ruolo: Ruolo;
  classe: { scuola: string; nome: string } | null;
};

export const SESSION_COOKIE = "fm_sessione";
// Una giornata di scuola: i PC dell'aula sono condivisi.
const SESSION_SECONDS = 60 * 60 * 12;

/** Client con service role (le tabelle degli account hanno RLS senza policy). */
export function authDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("base64url");

/** Da chiamare solo in server action o route handler (scrive il cookie). */
export async function createSession(db: SupabaseClient, accountId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const { error } = await db.from("sessioni").insert({
    token_hash: hashToken(token),
    account_id: accountId,
    expires_at: new Date(now.getTime() + SESSION_SECONDS * 1000).toISOString(),
  });
  if (error) throw new Error(`Sessione non creata: ${error.message}`);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });

  await Promise.all([
    db.from("account").update({ ultimo_accesso_at: now.toISOString() }).eq("id", accountId),
    db.from("sessioni").delete().lt("expires_at", now.toISOString()),
  ]);
}

/** Account della richiesta corrente, o null. Una sola query per richiesta. */
export const getSession = cache(async (): Promise<SessionAccount | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = authDb();
  if (!db) return null;

  const { data } = await db
    .from("sessioni")
    .select("expires_at, account:account_id(id, username, ruolo, classe:classe_id(scuola, nome))")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!data || new Date(data.expires_at).getTime() < Date.now()) return null;
  return data.account as unknown as SessionAccount;
});

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await authDb()?.from("sessioni").delete().eq("token_hash", hashToken(token));
  store.delete(SESSION_COOKIE);
}

export async function isStaff(): Promise<boolean> {
  const account = await getSession();
  return account?.ruolo === "admin" || account?.ruolo === "gestore";
}
