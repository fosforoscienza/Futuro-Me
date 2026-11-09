import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { toRow, type Answers } from "@/lib/questionario";
import { validateAvatar } from "@/lib/avatar/config";
import { clientIp } from "@/lib/auth/login";
import { authDb } from "@/lib/auth/session";
import { checkToken, TOKEN_ERROR_STATUS } from "@/lib/token/lookup";

/**
 * Salva una compilazione del questionario, legata al token dello studente e
 * alla fase aperta (inizio o fine). Niente nome, account, IP o user agent nel
 * record: l'IP serve solo ai limiti di frequenza.
 */
export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  // Limite largo: in classe molti studenti condividono lo stesso IP.
  if (!rateLimit(`questionario:${ip}`, { limit: 60, windowSeconds: 60 }).success) {
    return NextResponse.json({ error: "tooMany" }, { status: 429 });
  }

  let body: { answers?: Answers; avatar?: unknown; website?: string; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON object" }, { status: 400 });
  }

  // Honeypot: campo nascosto che solo i bot compilano.
  if (body.website) {
    return NextResponse.json({ success: true });
  }

  const row = body.answers && typeof body.answers === "object" ? toRow(body.answers) : null;
  const avatar = validateAvatar(body.avatar);
  if (!row || !avatar) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  const db = authDb();
  if (!db) {
    console.error("Questionario: Supabase env vars are not set");
    return NextResponse.json({ error: "notConfigured" }, { status: 503 });
  }

  const token = await checkToken(db, body.token, ip);
  if (!token.ok) {
    return NextResponse.json({ error: token.error }, { status: TOKEN_ERROR_STATUS[token.error] });
  }

  const { error } = await db
    .from("questionario_risposte")
    .insert({ ...row, avatar, token_id: token.id, fase: token.fase });
  if (error?.code === "23505") {
    return NextResponse.json({ error: "done" }, { status: 409 });
  }
  if (error) {
    console.error("Questionario insert error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true, fase: token.fase });
}
