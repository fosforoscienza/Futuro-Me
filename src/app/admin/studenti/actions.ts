"use server";

import { revalidatePath } from "next/cache";
import { generateClassCode, generatePassword, hashPassword, passwordError, verifyPassword } from "@/lib/auth/password";
import { authDb, createSession, getSession } from "@/lib/auth/session";

export type StaffState = { ok: boolean; message: string; password?: string } | null;

const NOT_ALLOWED: StaffState = { ok: false, message: "Sessione scaduta: rientra." };
const NO_DB: StaffState = { ok: false, message: "Supabase non configurato." };

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function staff() {
  const account = await getSession();
  return account?.ruolo === "admin" || account?.ruolo === "gestore" ? account : null;
}

/**
 * Nuova password temporanea per uno studente. Admin e gestore possono
 * reimpostare solo gli account studente (non quelli dello staff). Chiude le
 * sessioni aperte dello studente; la password si vede solo in questa risposta.
 */
export async function resetStudentPassword(accountId: string): Promise<StaffState> {
  if (!(await staff())) return NOT_ALLOWED;
  const db = authDb();
  if (!db) return NO_DB;

  const { data: student } = await db
    .from("account")
    .select("id, username, ruolo")
    .eq("id", accountId)
    .maybeSingle();
  if (!student || student.ruolo !== "studente") {
    return { ok: false, message: "Si possono reimpostare solo le password degli studenti." };
  }

  const password = generatePassword();
  const { error } = await db
    .from("account")
    .update({ password_hash: await hashPassword(password), password_cambiata_at: new Date().toISOString() })
    .eq("id", student.id);
  if (error) return { ok: false, message: error.message };
  await Promise.all([
    db.from("sessioni").delete().eq("account_id", student.id),
    db.from("login_tentativi").delete().eq("username", student.username),
  ]);

  return { ok: true, message: `Nuova password per ${student.username}:`, password };
}

export async function createClass(_prev: StaffState, form: FormData): Promise<StaffState> {
  if (!(await staff())) return NOT_ALLOWED;
  const db = authDb();
  if (!db) return NO_DB;

  const scuola = field(form, "scuola");
  const nome = field(form, "nome");
  if (!scuola || scuola.length > 120) return { ok: false, message: "Scuola mancante o troppo lunga." };
  if (!nome || nome.length > 40) return { ok: false, message: "Classe mancante o troppo lunga." };

  // In caso (rarissimo) di codice già usato si riprova con un altro.
  for (let attempt = 0; attempt < 3; attempt++) {
    const codice = generateClassCode(nome);
    const { error } = await db.from("classi").insert({ scuola, nome, codice });
    if (!error) {
      revalidatePath("/admin/studenti");
      return { ok: true, message: `Classe creata. Codice da dare ai ragazzi: ${codice}` };
    }
    if (error.code !== "23505") return { ok: false, message: error.message };
  }
  return { ok: false, message: "Non sono riuscito a generare un codice unico: riprova." };
}

export async function setClassActive(id: string, attiva: boolean): Promise<StaffState> {
  if (!(await staff())) return NOT_ALLOWED;
  const db = authDb();
  if (!db) return NO_DB;
  const { error } = await db.from("classi").update({ attiva }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/studenti");
  return { ok: true, message: attiva ? "Codice riattivato." : "Codice disattivato: niente nuove registrazioni." };
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
  if (passwordError(next)) return { ok: false, message: "Password troppo lunga (massimo 72 caratteri)." };
  if (next !== String(form.get("next2") ?? "")) return { ok: false, message: "Le due password non coincidono." };

  const { data } = await db.from("account").select("password_hash").eq("id", account.id).single();
  if (!data || !(await verifyPassword(current, data.password_hash))) {
    return { ok: false, message: "La password attuale non è corretta." };
  }

  const { error } = await db
    .from("account")
    .update({ password_hash: await hashPassword(next), password_cambiata_at: new Date().toISOString() })
    .eq("id", account.id);
  if (error) return { ok: false, message: error.message };

  // Chiude le sessioni su altri dispositivi e ne apre una nuova qui.
  await db.from("sessioni").delete().eq("account_id", account.id);
  await createSession(db, account.id);
  return { ok: true, message: "Password aggiornata. Le altre sessioni sono state chiuse." };
}
