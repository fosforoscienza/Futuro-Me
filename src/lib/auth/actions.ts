"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { checkCredentials, clientIp } from "./login";
import { authDb, createSession, endSession } from "./session";

/** Errori come chiavi del namespace "account" dei messaggi (it/en). */
export type AuthState = {
  error: string;
  values?: { username?: string };
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
  const username = field(form, "username");
  const password = field(form, "password");
  const values = { username };
  if (!username.trim() || !password) return { error: "missingFields", values };

  const db = authDb();
  if (!db) return { error: "notConfigured", values };

  const result = await checkCredentials(db, username, password, clientIp(await headers()));
  if (!result.ok) return { error: result.error === "tooMany" ? "tooMany" : "invalidLogin", values };
  // Gli account studente del sistema precedente non entrano più: il questionario usa i token.
  if (result.account.ruolo === "studente") return { error: "invalidLogin", values };

  try {
    await createSession(db, result.account.id, result.account.authVersion);
  } catch {
    return { error: "genericError", values };
  }
  redirect("/admin");
}

export async function logout(_previous: boolean, form: FormData): Promise<boolean> {
  try {
    await endSession();
  } catch {
    return true;
  }
  redirect(`/${localeOf(form)}/accedi`);
}
