import { NextResponse } from "next/server";
import { authDb } from "@/lib/auth/session";
import { clientIp } from "@/lib/auth/login";
import { checkToken, TOKEN_ERROR_STATUS } from "@/lib/token/lookup";

/** Controlla il token prima di iniziare, così nessuno compila 26 domande con un token sbagliato. */
export async function POST(request: Request) {
  let body: { token?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "format" }, { status: 400 });
  }
  const db = authDb();
  if (!db) return NextResponse.json({ error: "notConfigured" }, { status: 503 });

  const result = await checkToken(db, body?.token, clientIp(request.headers));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: TOKEN_ERROR_STATUS[result.error] });
  return NextResponse.json({ fase: result.fase });
}
