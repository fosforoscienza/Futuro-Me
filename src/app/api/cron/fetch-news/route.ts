import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { collectFeeds, runNewsJob } from "@/lib/news/pipeline";
import { isPublishWindow, romeParts } from "@/lib/news/week";
import type { JobLogEntry } from "@/lib/news/types";

// Feed, pagine degli articoli e riassunto con Claude: può servire qualche minuto.
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Vercel Cron, ogni giorno alle 06:00 e alle 07:00 UTC.
 *
 * - Ogni chiamata raccoglie i feed delle fonti attive in news_feed_items
 *   (alcuni feed coprono solo 1-3 giorni, quindi vanno letti ogni giorno).
 * - Il lunedì alle 8:00 ora italiana pubblica anche le news della settimana
 *   precedente (lun-dom). Il cron di Vercel è in UTC: con l'ora legale le 8 a
 *   Roma sono le 06 UTC, con l'ora solare le 07 UTC; la chiamata che non cade
 *   alle 8 italiane si limita a raccogliere.
 *
 * `?force=1` pubblica subito (anche fuori orario e anche una settimana già
 * pubblicata): utile per prove manuali con il secret.
 */
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = rateLimit("cron-fetch-news", { limit: 4, windowSeconds: 60 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const now = new Date();

  if (!force && !isPublishWindow(now)) {
    const p = romeParts(now);
    try {
      const log: JobLogEntry[] = [];
      const collected = await collectFeeds(undefined, log);
      return NextResponse.json({
        success: true,
        published: false,
        message: `Raccolta giornaliera (a Roma sono le ${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}; si pubblica il lunedì alle 8)`,
        sources: collected.sourcesChecked,
        sourceErrors: collected.sourceErrors,
        itemsFound: collected.itemsFound,
        itemsStored: collected.itemsStored,
        log,
      });
    } catch (error) {
      console.error("Cron collect error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  try {
    const result = await runNewsJob({ trigger: "cron", force, now });
    return NextResponse.json({
      success: result.status !== "error",
      ...result,
    });
  } catch (error) {
    console.error("Cron fetch-news error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
