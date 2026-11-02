"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { rateLimit } from "@/lib/rate-limit";
import { checkCredentials, clientIp } from "./login";
import {
  hashPassword,
  normalizeClassCode,
  normalizeUsername,
  passwordError,
  usernameError,
} from "./password";
import { authDb, createSession, endSession } from "./session";

/** Errori come chiavi del namespace "account" dei messaggi (it/en). */
export type AuthState = {
  error: string;
  values?: { username?: string; codice?: string };
} | null;

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

function localeOf(form: FormData): string {
  const locale = field(form, "locale");
  return routing.locales.includes(locale as "it" | "en") ? locale : routing.defaultLocale;
}

export async function login(_prev: AuthState, form: FormData): Promise<AuthState> {
  const locale = localeOf(form);
  const username = field(form, "username");
  const password = field(form, "password");
  const values = { username };
  if (!username.trim() || !password) return { error: "missingFields", values };

  const db = authDb();
  if (!db) return { error: "notConfigured", values };

  const result = await checkCredentials(db, username, password, clientIp(await headers()));
  if (!result.ok) return { error: result.error === "tooMany" ? "tooMany" : "invalidLogin", values };

  await createSession(db, result.account.id);
  redirect(result.account.ruolo === "studente" ? `/${locale}/area` : "/admin");
}

export async function signup(_prev: AuthState, form: FormData): Promise<AuthState> {
  const locale = localeOf(form);
  const codice = normalizeClassCode(field(form, "codice"));
  const username = normalizeUsername(field(form, "username"));
  const password = field(form, "password");
  const values = { username, codice };

  // Largo: un'intera classe si registra dallo stesso IP nello stesso momento.
  if (!rateLimit(`signup:${clientIp(await headers())}`, { limit: 60, windowSeconds: 600 }).success) {
    return { error: "tooMany", values };
  }
  if (!codice) return { error: "codeInvalid", values };
  const invalid = usernameError(username) ?? passwordError(password);
  if (invalid) return { error: invalid, values };
  if (password !== field(form, "password2")) return { error: "passwordMismatch", values };

  const db = authDb();
  if (!db) return { error: "notConfigured", values };

  const { data: classe } = await db
    .from("classi")
    .select("id")
    .eq("codice", codice)
    .eq("attiva", true)
    .maybeSingle();
  if (!classe) return { error: "codeInvalid", values };

  const { data: account, error } = await db
    .from("account")
    .insert({
      username,
      password_hash: await hashPassword(password),
      ruolo: "studente",
      classe_id: classe.id,
    })
    .select("id")
    .single();
  if (error || !account) {
    return { error: error?.code === "23505" ? "usernameTaken" : "genericError", values };
  }

  await createSession(db, account.id);
  redirect(`/${locale}/area`);
}

export async function logout(form: FormData) {
  await endSession();
  redirect(`/${localeOf(form)}/accedi`);
}
