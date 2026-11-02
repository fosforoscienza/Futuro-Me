import { unstable_cache } from "next/cache";
import { newsArticles, type NewsArticle } from "@/lib/news-data";
import { newsDb } from "./db";
import { NEWS_CACHE_TAG, type NewsArticleRow } from "./types";

/** News pubblicate dal job, lette dal database (cache 1 ora + tag "news"). */
const getPublishedRows = unstable_cache(
  async (): Promise<NewsArticleRow[]> => {
    const db = newsDb();
    if (!db) return [];
    const { data, error } = await db
      .from("news_articles")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error("news_articles:", error.message);
      return [];
    }
    return (data ?? []) as NewsArticleRow[];
  },
  ["news-published-v2"],
  { tags: [NEWS_CACHE_TAG], revalidate: 3600 }
);

function toArticle(row: NewsArticleRow, locale: string): NewsArticle {
  // Senza traduzione la versione inglese mostra il testo italiano.
  const en = locale === "en" && Boolean(row.title_en);
  return {
    slug: row.slug,
    title: (en && row.title_en) || row.title,
    excerpt: (en && row.excerpt_en) || row.excerpt,
    content: (en && row.content_en) || row.content,
    category: row.category,
    // Data dell'articolo originale; se manca, quella di pubblicazione.
    date: (row.original_published_at ?? row.published_at).slice(0, 10),
    source: row.source_name,
    sourceUrl: row.source_url,
    auto: true,
    imageUrl: row.image_url,
    lang: en ? "en" : "it",
    languages: row.title_en ? ["it", "en"] : ["it"],
    publishedAt: row.published_at,
  };
}

/** Tutte le news (automatiche + statiche), dalla più recente. */
export async function getAllNews(locale: string): Promise<NewsArticle[]> {
  const rows = await getPublishedRows();
  const dynamic = rows.map((r) => toArticle(r, locale));
  const slugs = new Set(dynamic.map((a) => a.slug));
  return [...dynamic, ...newsArticles.filter((a) => !slugs.has(a.slug))].sort(
    (a, b) => b.date.localeCompare(a.date)
  );
}

export async function getNewsBySlug(
  slug: string,
  locale: string
): Promise<NewsArticle | undefined> {
  const all = await getAllNews(locale);
  return all.find((a) => a.slug === slug);
}
