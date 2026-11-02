import { timingSafeEqual } from "node:crypto";
import { getSession } from "@/lib/auth/session";

/**
 * Accesso alle funzioni admin:
 * - persone: account con ruolo "admin" (login unico su /accedi, vedi src/lib/auth);
 * - automazioni (task di Claude, curl): "Authorization: Bearer <ADMIN_SECRET>"
 *   (con ripiego su CRON_SECRET) sulle route /api/admin/*.
 */

export function adminSecret(): string | null {
  return process.env.ADMIN_SECRET || process.env.CRON_SECRET || null;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** True se la richiesta ha "Authorization: Bearer <ADMIN_SECRET>". */
export function hasAdminBearer(request: Request): boolean {
  const secret = adminSecret();
  if (!secret) return false;
  return safeEqual(request.headers.get("authorization") ?? "", `Bearer ${secret}`);
}

/** Sessione di un account admin (server component, server action, route handler). */
export async function isAdmin(): Promise<boolean> {
  return (await getSession())?.ruolo === "admin";
}
