"use server";

import { revalidatePath } from "next/cache";
import { generateClassCode, hashPassword, passwordError, verifyPassword } from "@/lib/auth/password";
import { MAX_TOKENS_PER_BATCH } from "@/lib/token/format";
import { generateToken, hashToken } from "@/lib/token/server";
import { authDb, createSession, getSession } from "@/lib/auth/session";

export type StaffState = { ok: boolean; message: string } | null;

/** Token appena generati: in chiaro solo in questa risposta, per costruire il PDF nel browser. */
export type TokenBatch =
  | { ok: true; message: string; tokens: string[]; scuola: string; classe: string }
  | { ok: false; message: string };

const NOT_ALLOWED = { ok: false, message: "Sessione scaduta: rientra." } as const;
const NO_DB = { ok: false, message: "Supabase non configurato." } as const;

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function staff() {
  const account = await getSession();
  return account?.ruolo === "admin" || account?.ruolo === "gestore" ? account : null;
}

export async function createClass(_prev: StaffState, form: FormData): Promise<StaffState> {
  if (!(await staff())) return NOT_ALLOWED;
  const db = authDb();
  if (!db) return NO_DB;

  const scuola = field(form, "scuola");
  const nome = field(form, "nome");
  if (!scuola || scuola.length > 120) return { ok: false, message: "Scuola mancante o troppo lunga." };
  if (!nome || nome.length > 40) return { ok: false, message: "Classe mancante o troppo lunga." };

  // Il codice classe serviva alla vecchia registrazione: resta solo perché la colonna è obbligatoria.
  for (let attempt = 0; attempt < 3; attempt++) {
    const codice = generateClassCode(nome);
    const { error } = await db.from("classi").insert({ scuola, nome, codice });
    if (!error) {
      revalidatePath("/admin/studenti");
      return { ok: true, message: "Classe creata: ora genera i token." };
    }
    if (error.code !== "23505") return { ok: false, message: error.message };
  }
  return { ok: false, message: "Non sono riuscito a generare un codice unico: riprova." };
}

/**
 * Nuovi token per una classe. Nel database va solo l'impronta; i token in
 * chiaro tornano al browser una volta sola per il PDF e non si possono
 * ristampare (se il PDF si perde, se ne generano altri).
 */
export async function generateClassTokens(classeId: string, count: number): Promise<TokenBatch> {
  if (!(await staff())) return NOT_ALLOWED;
  const db = authDb();
  if (!db) return NO_DB;
  if (!Number.isInteger(count) || count < 1 || count > MAX_TOKENS_PER_BATCH) {
    return { ok: false, message: `Puoi generare da 1 a ${MAX_TOKENS_PER_BATCH} token alla volta.` };
  }

  const { data: classe } = await db.from("classi").select("id, scuola, nome").eq("id", classeId).maybeSingle();
  if (!classe) return { ok: false, message: "Classe non trovata." };

  // Una collisione tra token è improbabilissima: in quel caso si rigenera il lotto.
  for (let attempt = 0; attempt < 3; attempt++) {
    const tokens = [...new Set(Array.from({ length: count }, generateToken))];
    if (tokens.length !== count) continue;
    const { error } = await db
      .from("questionario_token")
      .insert(tokens.map((token) => ({ classe_id: classe.id, token_hash: hashToken(token) })));
    if (!error) {
      revalidatePath("/admin/studenti");
      return { ok: true, message: `${count} token generati.`, tokens, scuola: classe.scuola, classe: classe.nome };
    }
    if (error.code !== "23505") return { ok: false, message: error.message };
  }
  return { ok: false, message: "Non sono riuscito a generare token unici: riprova." };
}

/**
 * Solo admin, dopo la distruzione dei fogli: chiude gli abbinamenti di una
 * classe (vedi chiudi_token_classe nella migrazione). Irreversibile.
 */
export async function closeClassTokens(classeId: string, conferma: string): Promise<StaffState> {
  if ((await getSession())?.ruolo !== "admin") return NOT_ALLOWED;
  if (conferma.trim().toUpperCase() !== "CHIUDI") return { ok: false, message: "Chiusura annullata." };
  const db = authDb();
  if (!db) return NO_DB;
  const { data, error } = await db.rpc("chiudi_token_classe", { p_classe: classeId });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/studenti");
  return { ok: true, message: `Abbinamenti chiusi: ${data ?? 0} token resi non più collegabili ai fogli.` };
}

/** Solo admin: apre o chiude la sezione "Fine progetto" per tutti gli studenti. */
export async function setFaseFine(attiva: boolean): Promise<StaffState> {
  if ((await getSession())?.ruolo !== "admin") return NOT_ALLOWED;
  const db = authDb();
  if (!db) return NO_DB;
  const { error } = await db
    .from("impostazioni")
    .upsert({ chiave: "fase_fine_attiva", valore: attiva, updated_at: new Date().toISOString() });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/studenti");
  return { ok: true, message: attiva ? "Fine progetto attivata." : "Fine progetto disattivata." };
}

/** Admin e gestore cambiano la propria password (nessuno dei due può resettare l'altro). */
export async function changeOwnPassword(_prev: StaffState, form: FormData): Promise<StaffState> {
  const account = await staff();
  if (!account) return NOT_ALLOWED;
  const db = authDb();
  if (!db) return NO_DB;

  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 12) return { ok: false, message: "Per lo staff servono almeno 12 caratteri." };
  const weak = passwordError(next, account.username);
  if (weak === "passwordLong") return { ok: false, message: "Password troppo lunga (massimo 72 caratteri)." };
  if (weak) return { ok: false, message: "Password troppo facile da indovinare: evita parole comuni, sequenze e il tuo username." };
  if (next !== String(form.get("next2") ?? "")) return { ok: false, message: "Le due password non coincidono." };

  const { data } = await db.from("account").select("password_hash").eq("id", account.id).single();
  if (!data || !(await verifyPassword(current, data.password_hash))) {
    return { ok: false, message: "La password attuale non è corretta." };
  }

  const { data: updated, error } = await db
    .from("account")
    .update({ password_hash: await hashPassword(next), password_cambiata_at: new Date().toISOString() })
    .eq("id", account.id).select("auth_version").single();
  if (error) return { ok: false, message: error.message };

  // Chiude le sessioni su altri dispositivi e ne apre una nuova qui.
  await db.from("sessioni").delete().eq("account_id", account.id);
  await createSession(db, account.id, updated.auth_version);
  return { ok: true, message: "Password aggiornata. Le altre sessioni sono state chiuse." };
}
