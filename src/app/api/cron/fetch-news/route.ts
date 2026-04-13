import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Vercel Cron Job: runs weekly (Sunday 8:00 UTC)
 * Fetches news from RSS/API sources about youth employment, AI impact, skills
 * and generates "science snack" summaries.
 *
 * TODO: Integrate with:
 * - NewsAPI or Google News RSS for source fetching
 * - Claude/OpenAI for "snack" summary generation
 * - Supabase for storing drafts
 */
export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: max 2 cron runs per minute
  const { success } = rateLimit("cron-fetch-news", {
    limit: 2,
    windowSeconds: 60,
  });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    // Placeholder: news fetching pipeline
    // 1. Fetch from RSS feeds (Il Sole 24 Ore, ANSA Lavoro, Wired Italia)
    // 2. Filter by relevance (keywords: lavoro giovani, AI, competenze, mercato)
    // 3. Generate "snack" summary via AI (150-200 words)
    // 4. Save as draft in Supabase
    // 5. Notify admin (optional)

    const timestamp = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: "News fetch pipeline executed",
      timestamp,
      articles_found: 0,
      drafts_created: 0,
    });
  } catch (error) {
    console.error("Cron fetch-news error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
