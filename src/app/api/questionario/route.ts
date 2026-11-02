import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";
import { toRow, type Answers } from "@/lib/questionario";
import { validateAvatar } from "@/lib/avatar/config";
import { isFase, isFaseAperta } from "@/lib/auth/area";
import { getSession } from "@/lib/auth/session";

/**
 * Salva una compilazione del questionario.
 * - Senza `fase`: anonima (pagina /questionario). Non viene salvato nessun
 *   dato che identifichi chi risponde (né IP né user agent): l'IP serve solo
 *   al rate limit in memoria.
 * - Con `fase` ("inizio" | "fine"): dall'area personale, legata all'account
 *   dello studente loggato; una sola compilazione per fase.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  // Limite largo: in classe molti studenti condividono lo stesso IP.
  const { success } = rateLimit(`questionario:${ip ?? "unknown"}`, {
    limit: 60,
    windowSeconds: 60,
  });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { answers?: Answers; avatar?: unknown; website?: string; fase?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot: campo nascosto che solo i bot compilano.
  if (body.website) {
    return NextResponse.json({ success: true });
  }

  const row =
    body.answers && typeof body.answers === "object"
      ? toRow(body.answers)
      : null;
  const avatar = validateAvatar(body.avatar);
  if (!row || !avatar) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Questionario: Supabase env vars are not set");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  let owner: { account_id: string; fase: string } | null = null;
  if (body.fase !== undefined) {
    if (!isFase(body.fase)) {
      return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
    }
    const account = await getSession();
    if (account?.ruolo !== "studente") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await isFaseAperta(supabase, body.fase))) {
      return NextResponse.json({ error: "Phase closed" }, { status: 403 });
    }
    owner = { account_id: account.id, fase: body.fase };
  }

  const { error } = await supabase
    .from("questionario_risposte")
    .insert({ ...row, avatar, ...owner });
  if (error?.code === "23505") {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }
  if (error) {
    console.error("Questionario insert error:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
