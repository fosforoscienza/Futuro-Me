import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";
import { toRow, type Answers } from "@/lib/questionario";

/**
 * Salva una compilazione anonima del questionario.
 * Non viene salvato nessun dato che identifichi chi risponde (né IP né
 * user agent): l'IP serve solo al rate limit in memoria.
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

  let body: { answers?: Answers; website?: string };
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
  if (!row) {
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
  const { error } = await supabase.from("questionario_risposte").insert(row);
  if (error) {
    console.error("Questionario insert error:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
