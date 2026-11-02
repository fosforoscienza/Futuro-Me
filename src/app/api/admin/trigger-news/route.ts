import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { hasAdminBearer, isAdmin } from "@/lib/admin-auth";
import { runNewsJob } from "@/lib/news/pipeline";
import { isMonday } from "@/lib/news/week";

export const maxDuration = 300;

/**
 * Avvio manuale del job delle news (stessa pipeline del cron), senza
 * controllo dell'ora. Accetta "Authorization: Bearer <ADMIN_SECRET>" oppure la
 * sessione della console /admin.
 *
 * Body JSON opzionale: { "weekStart": "YYYY-MM-DD" (lunedì), "force": true }
 */
export async function POST(request: Request) {
  try {
    if (!hasAdminBearer(request) && !(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: max 5 manual triggers per minute
    const { success } = rateLimit("admin-trigger", {
      limit: 5,
      windowSeconds: 60,
    });
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    let body: { weekStart?: unknown; force?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      // Body vuoto: settimana precedente, senza forzare.
    }
    const weekStart =
      typeof body.weekStart === "string" && body.weekStart ? body.weekStart : undefined;
    if (weekStart && !isMonday(weekStart)) {
      return NextResponse.json(
        { error: "weekStart deve essere un lunedì (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const result = await runNewsJob({
      trigger: "manual",
      weekStart,
      force: body.force === true,
    });

    return NextResponse.json({
      success: result.status !== "error",
      message: "Manual news fetch triggered",
      result,
    });
  } catch (error) {
    console.error("Manual trigger error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
