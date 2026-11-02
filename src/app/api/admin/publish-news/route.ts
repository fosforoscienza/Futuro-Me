import { NextResponse } from "next/server";
import { hasAdminBearer, isAdmin } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";
import { publishEditorialItems, type EditorialItem } from "@/lib/news/pipeline";
import { isNewsCategory } from "@/lib/news/types";
import { isMonday } from "@/lib/news/week";

/**
 * Pubblica le news scritte dalla redazione con Claude (task programmato).
 * Fonte e link vengono dal database: ogni `url` deve essere una notizia
 * raccolta da /api/admin/news-candidates.
 *
 * POST { weekStart: "YYYY-MM-DD", force?: boolean, items: [{ url, category,
 *   title, excerpt, content, titleEn?, excerptEn?, contentEn? }] }
 * Authorization: Bearer <ADMIN_SECRET>
 */
export async function POST(request: Request) {
  if (!hasAdminBearer(request) && !(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!rateLimit("admin-publish-news", { limit: 5, windowSeconds: 60 }).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { weekStart?: unknown; force?: unknown; items?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON object" }, { status: 400 });
  }
  if (typeof body.weekStart !== "string" || !isMonday(body.weekStart)) {
    return NextResponse.json({ error: "weekStart deve essere un lunedì (YYYY-MM-DD)" }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 20) {
    return NextResponse.json({ error: "items: da 1 a 20 news" }, { status: 400 });
  }

  const str = (v: unknown, max: number) =>
    typeof v === "string" && v.trim().length > 0 && v.length <= max ? v : null;
  const items: EditorialItem[] = [];
  for (const [i, raw] of body.items.entries()) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return NextResponse.json({ error: `items[${i}]: invalid object` }, { status: 400 });
    }
    const r = raw as Record<string, unknown>;
    const url = str(r.url, 2000);
    const title = str(r.title, 200);
    const excerpt = str(r.excerpt, 600);
    const content = str(r.content, 6000);
    if (!url || !title || !excerpt || !content || !isNewsCategory(r.category)) {
      return NextResponse.json(
        { error: `items[${i}]: servono url, category (ai|jobs|training|skills), title, excerpt, content` },
        { status: 400 }
      );
    }
    items.push({
      url,
      category: r.category,
      title,
      excerpt,
      content,
      titleEn: str(r.titleEn, 200),
      excerptEn: str(r.excerptEn, 600),
      contentEn: str(r.contentEn, 6000),
    });
  }

  try {
    const result = await publishEditorialItems({
      weekStart: body.weekStart,
      items,
      force: body.force === true,
    });
    return NextResponse.json({ success: result.status !== "error", ...result });
  } catch (error) {
    console.error("publish-news error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
