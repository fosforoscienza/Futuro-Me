/** Tag di cache delle news pubblicate (repository.ts, revalidateNews). */
export const NEWS_CACHE_TAG = "news";

export const NEWS_CATEGORIES = ["ai", "jobs", "training", "skills"] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

/** Riga di public.news_sources. */
export type NewsSource = {
  id: string;
  name: string;
  site_url: string;
  feed_url: string;
  language: "it" | "en";
  category: NewsCategory;
  active: boolean;
  keyword_filter: boolean;
  max_pages: number;
  notes: string | null;
  last_fetched_at: string | null;
  last_status: string | null;
  last_error: string | null;
  last_item_count: number | null;
  created_at: string;
  updated_at: string;
};

/** Riga di public.news_articles. */
export type NewsArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  title_en: string | null;
  excerpt_en: string | null;
  content_en: string | null;
  category: NewsCategory;
  source_name: string;
  source_url: string;
  source_id: string | null;
  original_title: string | null;
  original_published_at: string | null;
  week_start: string;
  status: "published" | "hidden";
  summary_method: "ai" | "extract";
  run_id: string | null;
  published_at: string;
  created_at: string;
};

export type JobLogEntry = {
  source?: string;
  level: "info" | "warn" | "error";
  message: string;
};

/** Riga di public.news_job_runs. */
export type NewsJobRun = {
  id: string;
  trigger: "cron" | "manual";
  status: "running" | "success" | "partial" | "error" | "skipped";
  week_start: string;
  week_end: string;
  started_at: string;
  finished_at: string | null;
  sources_checked: number;
  items_found: number;
  items_in_week: number;
  items_published: number;
  message: string | null;
  log: JobLogEntry[];
};

export function isNewsCategory(value: unknown): value is NewsCategory {
  return (
    typeof value === "string" &&
    (NEWS_CATEGORIES as readonly string[]).includes(value)
  );
}
