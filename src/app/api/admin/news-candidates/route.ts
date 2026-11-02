import { NextResponse } from "next/server";
import { hasAdminBearer, isAdmin } from "@/lib/admin-auth";
import { getWeekCandidates } from "@/lib/news/pipeline";
import { EDITORIAL_GUIDELINES } from "@/lib/news/summarize";
import { isMonday } from "@/lib/news/week";

export const maxDuration = 300;

/**
 * Candidate della settimana per la redazione con Claude (task programmato su
 * Claude Desktop, senza chiave API). Raccoglie i feed e restituisce le news
 * pertinenti e nuove con il testo degli articoli e le linee guida editoriali.
 *
 * GET ?week=YYYY-MM-DD (lunedì; di default la settimana precedente)
 * Authorization: Bearer <ADMIN_SECRET>
 */
export async function GET(request: Request) {
  if (!hasAdminBearer(request) && !(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const week = new URL(request.url).searchParams.get("week") || undefined;
  if (week && !isMonday(week)) {
    return NextResponse.json({ error: "week deve essere un lunedì (YYYY-MM-DD)" }, { status: 400 });
  }
  try {
    const result = await getWeekCandidates({ weekStart: week });
    return NextResponse.json({ ...result, guidelines: EDITORIAL_GUIDELINES });
  } catch (error) {
    console.error("news-candidates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
