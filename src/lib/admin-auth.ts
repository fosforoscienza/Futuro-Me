import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Autenticazione admin: la stessa ADMIN_SECRET (con ripiego su CRON_SECRET)
 * già usata da /api/admin/*. Dalla console si entra digitandola una volta; il
 * cookie contiene solo una scadenza firmata con HMAC, mai il segreto.
 */

export const ADMIN_COOKIE = "fm_admin";
const SESSION_SECONDS = 60 * 60 * 12;

export function adminSecret(): string | null {
  return process.env.ADMIN_SECRET || process.env.CRON_SECRET || null;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(`fm-admin:${payload}`).digest("base64url");
}

/** True se il segreto digitato è quello configurato. */
export function checkAdminSecret(candidate: string): boolean {
  const secret = adminSecret();
  return Boolean(secret) && safeEqual(candidate, secret!);
}

/** True se la richiesta ha "Authorization: Bearer <ADMIN_SECRET>". */
export function hasAdminBearer(request: Request): boolean {
  const secret = adminSecret();
  if (!secret) return false;
  return safeEqual(request.headers.get("authorization") ?? "", `Bearer ${secret}`);
}

export function createSessionValue(now = Date.now()): string | null {
  const secret = adminSecret();
  if (!secret) return null;
  const expires = String(Math.floor(now / 1000) + SESSION_SECONDS);
  return `${expires}.${sign(expires, secret)}`;
}

export function verifySessionValue(value: string | undefined, now = Date.now()): boolean {
  const secret = adminSecret();
  if (!secret || !value) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature) return false;
  if (Number(expires) * 1000 < now) return false;
  return safeEqual(signature, sign(expires, secret));
}

/** Sessione admin valida (server component, server action, route handler). */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionValue(store.get(ADMIN_COOKIE)?.value);
}

export async function startAdminSession(): Promise<boolean> {
  const value = createSessionValue();
  if (!value) return false;
  const store = await cookies();
  store.set(ADMIN_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return true;
}

export async function endAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
