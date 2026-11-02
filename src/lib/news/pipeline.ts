import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireNewsDb } from "./db";
import { fetchArticleText, fetchFeedPages, normalizeUrl } from "./feeds";
import {
  capPerSource,
  dedupe,
  MIN_RELEVANCE,
  MIN_RELEVANCE_EXTRACT,
  relevanceScore,
  shortHash,
  slugify,
} from "./select";
import {
  canUseAI,
  extractiveSummary,
  summarizeWithClaude,
  type Candidate,
  type Summary,
} from "./summarize";
import {
  NEWS_CACHE_TAG,
  type JobLogEntry,
  type NewsCategory,
  type NewsJobRun,
  type NewsSource,
} from "./types";
import { previousWeek, weekFromStart, type NewsWeek } from "./week";

/** Numero massimo di news pubblicate per settimana. */
function maxPerWeek(): number {
  const n = Number(process.env.NEWS_MAX_PER_WEEK);
  return Number.isInteger(n) && n > 0 && n <= 20 ? n : 6;
}

/** Candidati passati al riassunto (i più pertinenti). */
const MAX_CANDIDATES = 18;

export type RunOptions = {
  trigger: "cron" | "manual";
  /** Lunedì della settimana da elaborare; di default la settimana precedente. */
  weekStart?: string;
  /** Ripete anche se la settimana è già stata pubblicata. */
  force?: boolean;
  now?: Date;
};

export type RunResult = {
  runId: string | null;
  status: NewsJobRun["status"];
  week: NewsWeek;
  published: number;
  message: string;
};

type StoredItem = {
  url: string;
  title: string;
  description: string;
  publishedAt: Date;
  source: NewsSource;
  score: number;
};

/** Elementi dei feed conservati: si tengono 60 giorni. */
const FEED_ITEMS_RETENTION_DAYS = 60;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.name === "TimeoutError" ? "Timeout" : error.message;
  }
  return String(error);
}

export type CollectResult = {
  sources: NewsSource[];
  sourcesChecked: number;
  sourceErrors: number;
  itemsFound: number;
  itemsStored: number;
};

/**
 * Legge i feed delle fonti attive e conserva gli elementi in news_feed_items.
 * Gira ogni giorno: diversi feed (ANSA, Corriere, Sole 24 Ore) espongono solo
 * gli ultimi 1-3 giorni, quindi il lunedì non basterebbe leggerli una volta.
 */
export async function collectFeeds(
  db: SupabaseClient = requireNewsDb(),
  log: JobLogEntry[] = []
): Promise<CollectResult> {
  const { data, error } = await db
    .from("news_sources")
    .select("*")
    .eq("active", true)
    .order("name");
  if (error) throw new Error(error.message);
  const sources = (data ?? []) as NewsSource[];

  const now = Date.now();
  const oldest = now - FEED_ITEMS_RETENTION_DAYS * 86_400_000;
  const future = now + 2 * 86_400_000;
  let sourceErrors = 0;
  let itemsFound = 0;
  let itemsStored = 0;
  let undated = 0;

  await mapWithConcurrency(sources, 6, async (source) => {
    try {
      const items = await fetchFeedPages(source.feed_url, source.max_pages ?? 1);
      itemsFound += items.length;
      const rows = new Map<string, Record<string, unknown>>();
      for (const item of items) {
        if (!item.publishedAt) {
          undated++;
          continue;
        }
        const t = item.publishedAt.getTime();
        if (t < oldest || t > future) continue;
        const url = normalizeUrl(item.url);
        rows.set(url, {
          source_id: source.id,
          url,
          title: item.title.slice(0, 500),
          description: item.description.slice(0, 4000),
          published_at: item.publishedAt.toISOString(),
        });
      }
      if (rows.size > 0) {
        const { error: upsertError } = await db
          .from("news_feed_items")
          .upsert([...rows.values()], { onConflict: "url", ignoreDuplicates: true });
        if (upsertError) throw new Error(upsertError.message);
        itemsStored += rows.size;
      }
      await db
        .from("news_sources")
        .update({
          last_fetched_at: new Date().toISOString(),
          last_status: "ok",
          last_error: null,
          last_item_count: items.length,
        })
        .eq("id", source.id);
    } catch (err) {
      sourceErrors++;
      const message = errorMessage(err);
      log.push({ source: source.name, level: "error", message: `Feed non letto: ${message}` });
      await db
        .from("news_sources")
        .update({
          last_fetched_at: new Date().toISOString(),
          last_status: "error",
          last_error: message.slice(0, 500),
        })
        .eq("id", source.id);
    }
  });

  if (undated > 0) {
    log.push({ level: "warn", message: `${undated} elementi senza data ignorati` });
  }
  await db
    .from("news_feed_items")
    .delete()
    .lt("published_at", new Date(oldest).toISOString());

  return { sources, sourcesChecked: sources.length, sourceErrors, itemsFound, itemsStored };
}

type WeekSelection = {
  sourceErrors: number;
  counts: Pick<NewsJobRun, "sources_checked" | "items_found" | "items_in_week">;
  /** Elementi pertinenti e nuovi, ordinati per pertinenza. */
  kept: StoredItem[];
  /** Se valorizzato, non c'è nulla da pubblicare: è il motivo. */
  empty: string | null;
  noSources: boolean;
};

/**
 * Passi comuni a job e candidate per Claude: raccoglie i feed, legge gli
 * elementi della settimana, tiene quelli pertinenti e toglie i doppioni.
 */
async function selectWeekItems(
  db: SupabaseClient,
  week: NewsWeek,
  log: JobLogEntry[]
): Promise<WeekSelection> {
  const collected = await collectFeeds(db, log);
  const { sources, sourceErrors, itemsFound } = collected;
  const counts = { sources_checked: sources.length, items_found: itemsFound, items_in_week: 0 };
  if (sources.length === 0) {
    return { sourceErrors, counts, kept: [], empty: "Nessuna fonte attiva", noSources: true };
  }
  const byId = new Map(sources.map((src) => [src.id, src]));

  const { data: stored, error: storedError } = await db
    .from("news_feed_items")
    .select("url,title,description,published_at,source_id")
    .gte("published_at", week.from.toISOString())
    .lt("published_at", week.to.toISOString())
    .limit(5000);
  if (storedError) throw new Error(storedError.message);

  const relevant: StoredItem[] = [];
  for (const row of stored ?? []) {
    const source = byId.get(row.source_id as string);
    if (!source) continue; // fonte disattivata nel frattempo
    counts.items_in_week++;
    const title = row.title as string;
    const description = row.description as string;
    const score = relevanceScore(title, description);
    if (source.keyword_filter && score < MIN_RELEVANCE) continue;
    relevant.push({
      url: row.url as string,
      title,
      description,
      publishedAt: new Date(row.published_at as string),
      source,
      score,
    });
  }
  log.push({
    level: "info",
    message: `${itemsFound} elementi letti oggi, ${counts.items_in_week} nella settimana, ${relevant.length} pertinenti`,
  });
  if (relevant.length === 0) {
    return {
      sourceErrors,
      counts,
      kept: [],
      empty: `Nessuna news pertinente nella settimana ${week.weekStart} – ${week.weekEnd}`,
      noSources: false,
    };
  }

  // Deduplica: contro gli articoli già pubblicati e tra le fonti.
  const { data: existing } = await db
    .from("news_articles")
    .select("source_url,original_title,title")
    .gte("published_at", new Date(week.from.getTime() - 28 * 86_400_000).toISOString());
  const { data: sameUrls } = await db
    .from("news_articles")
    .select("source_url")
    .in(
      "source_url",
      relevant.map((r) => r.url)
    );
  const knownUrls = new Set([
    ...(existing ?? []).map((e) => e.source_url as string),
    ...(sameUrls ?? []).map((e) => e.source_url as string),
  ]);
  const knownTitles = (existing ?? []).map(
    (e) => (e.original_title as string | null) ?? (e.title as string)
  );

  relevant.sort(
    (a, b) => b.score - a.score || b.publishedAt.getTime() - a.publishedAt.getTime()
  );
  const fresh = relevant.filter((r) => !knownUrls.has(r.url));
  const { kept, dropped } = dedupe(fresh, knownTitles);
  if (dropped > 0 || fresh.length < relevant.length) {
    log.push({
      level: "info",
      message: `Doppioni scartati: ${relevant.length - fresh.length} già pubblicati, ${dropped} simili`,
    });
  }
  return {
    sourceErrors,
    counts,
    kept,
    empty: kept.length === 0 ? "Nessuna news nuova (tutte già pubblicate)" : null,
    noSources: false,
  };
}

/** Testo dei candidati: pagina dell'articolo se più ricca della descrizione. */
async function withArticleText(pool: StoredItem[]): Promise<Candidate[]> {
  const candidates = await mapWithConcurrency(pool, 5, async (item) => {
    const page = await fetchArticleText(item.url);
    const text = page.length > item.description.length ? page : item.description;
    return {
      index: 0,
      sourceName: item.source.name,
      sourceCategory: item.source.category,
      language: item.source.language,
      title: item.title,
      url: item.url,
      publishedAt: item.publishedAt.toISOString().slice(0, 10),
      text: text || item.title,
    };
  });
  candidates.forEach((c, i) => (c.index = i));
  return candidates;
}

/**
 * Job settimanale: raccoglie dalle fonti attive le news della settimana
 * (lun-dom, ora italiana), toglie i doppioni, le riassume e le pubblica.
 * Ogni news pubblicata porta nome della fonte e link all'articolo originale.
 */
export async function runNewsJob(options: RunOptions): Promise<RunResult> {
  const db = requireNewsDb();
  const week = options.weekStart
    ? weekFromStart(options.weekStart)
    : previousWeek(options.now);

  // Evita due esecuzioni sovrapposte o una seconda pubblicazione della stessa
  // settimana (Vercel può ripetere una chiamata cron).
  const { data: recentRuns } = await db
    .from("news_job_runs")
    .select("id,status,started_at,week_start")
    .or(`status.eq.running,week_start.eq.${week.weekStart}`)
    .order("started_at", { ascending: false })
    .limit(10);
  const tenMinutesAgo = Date.now() - 10 * 60_000;
  const running = (recentRuns ?? []).find(
    (r) => r.status === "running" && new Date(r.started_at).getTime() > tenMinutesAgo
  );
  if (running) {
    return {
      runId: null,
      status: "skipped",
      week,
      published: 0,
      message: "Un'altra esecuzione è in corso",
    };
  }
  const alreadyDone = (recentRuns ?? []).some(
    (r) =>
      r.week_start === week.weekStart &&
      (r.status === "success" || r.status === "partial")
  );
  if (alreadyDone && !options.force) {
    return {
      runId: null,
      status: "skipped",
      week,
      published: 0,
      message: `Settimana ${week.weekStart} già pubblicata (usa "forza" per ripetere)`,
    };
  }

  const { data: runRow, error: runError } = await db
    .from("news_job_runs")
    .insert({
      trigger: options.trigger,
      status: "running",
      week_start: week.weekStart,
      week_end: week.weekEnd,
    })
    .select("id")
    .single();
  if (runError || !runRow) {
    throw new Error(`Impossibile registrare l'esecuzione: ${runError?.message}`);
  }
  const runId = runRow.id as string;
  const log: JobLogEntry[] = [];

  const finish = async (
    status: NewsJobRun["status"],
    message: string,
    counts: Partial<
      Pick<NewsJobRun, "sources_checked" | "items_found" | "items_in_week" | "items_published">
    >
  ): Promise<RunResult> => {
    await db
      .from("news_job_runs")
      .update({ status, message, log, finished_at: new Date().toISOString(), ...counts })
      .eq("id", runId);
    return { runId, status, week, published: counts.items_published ?? 0, message };
  };

  try {
    const selection = await selectWeekItems(db, week, log);
    const { sourceErrors, counts, kept } = selection;
    if (selection.empty) {
      return await finish(
        selection.noSources ? "error" : sourceErrors > 0 ? "partial" : "success",
        selection.empty,
        { ...counts, items_published: 0 }
      );
    }

    // 4. Testo completo dei candidati migliori e riassunto.
    const max = maxPerWeek();
    const useAI = canUseAI();
    const pool = useAI
      ? capPerSource(kept, 3, MAX_CANDIDATES)
      : // Senza AI non si traduce né si sceglie: soglia più alta, fonti in
        // italiano, al massimo 2 news per fonte.
        capPerSource(
          kept.filter(
            (k) => k.source.language === "it" && k.score >= MIN_RELEVANCE_EXTRACT
          ),
          2,
          max
        );
    if (pool.length === 0) {
      return await finish("success", "Nessuna news abbastanza pertinente da pubblicare", {
        ...counts,
        items_published: 0,
      });
    }

    const candidates = await withArticleText(pool);

    let summaries: Summary[];
    if (useAI) {
      try {
        summaries = await summarizeWithClaude(candidates, max);
        log.push({ level: "info", message: `Claude ha scelto ${summaries.length} news su ${candidates.length}` });
      } catch (error) {
        log.push({
          level: "error",
          message: `Riassunto AI non riuscito, uso gli estratti: ${errorMessage(error)}`,
        });
        summaries = candidates.slice(0, max).map(extractiveSummary);
      }
    } else {
      log.push({
        level: "warn",
        message: "ANTHROPIC_API_KEY non impostata: pubblico estratti delle fonti senza riassunto",
      });
      summaries = candidates.slice(0, max).map(extractiveSummary);
    }

    // 5. Pubblica.
    const rows = summaries.map((s) => {
      const c = candidates[s.index];
      const item = pool[s.index];
      return {
        slug: `${slugify(s.title) || "news"}-${shortHash(c.url)}`,
        title: s.title,
        excerpt: s.excerpt,
        content: s.content,
        title_en: s.titleEn,
        excerpt_en: s.excerptEn,
        content_en: s.contentEn,
        category: s.category,
        source_name: item.source.name,
        source_url: c.url,
        source_id: item.source.id,
        original_title: c.title,
        original_published_at: item.publishedAt.toISOString(),
        week_start: week.weekStart,
        status: "published",
        summary_method: s.method,
        run_id: runId,
      };
    });

    let published = 0;
    if (rows.length > 0) {
      const { data: inserted, error: insertError } = await db
        .from("news_articles")
        .upsert(rows, { onConflict: "source_url", ignoreDuplicates: true })
        .select("id");
      if (insertError) throw new Error(`Pubblicazione non riuscita: ${insertError.message}`);
      published = inserted?.length ?? 0;
      revalidateNews();
    }

    return await finish(
      sourceErrors > 0 ? "partial" : "success",
      `${published} news pubblicate per la settimana ${week.weekStart} – ${week.weekEnd}` +
        (sourceErrors > 0 ? ` (${sourceErrors} fonti non lette)` : ""),
      { ...counts, items_published: published }
    );
  } catch (error) {
    log.push({ level: "error", message: errorMessage(error) });
    return await finish("error", errorMessage(error), {});
  }
}

export type WeekCandidates = {
  week: NewsWeek;
  alreadyPublished: boolean;
  maxPerWeek: number;
  message: string | null;
  candidates: Candidate[];
  log: JobLogEntry[];
};

/**
 * Candidate della settimana per la redazione con Claude (task programmato su
 * Claude Desktop): stessa raccolta, pertinenza e deduplica del job, con il
 * testo degli articoli. Non scrive nulla tranne la raccolta dei feed.
 */
export async function getWeekCandidates(options: {
  weekStart?: string;
  now?: Date;
}): Promise<WeekCandidates> {
  const db = requireNewsDb();
  const week = options.weekStart ? weekFromStart(options.weekStart) : previousWeek(options.now);
  const log: JobLogEntry[] = [];

  const { data: done } = await db
    .from("news_job_runs")
    .select("id")
    .eq("week_start", week.weekStart)
    .in("status", ["success", "partial"])
    .limit(1);

  const selection = await selectWeekItems(db, week, log);
  const pool = capPerSource(selection.kept, 3, MAX_CANDIDATES);
  return {
    week,
    alreadyPublished: (done ?? []).length > 0,
    maxPerWeek: maxPerWeek(),
    message: selection.empty,
    candidates: pool.length > 0 ? await withArticleText(pool) : [],
    log,
  };
}

/** Una news scritta dalla redazione con Claude, pronta da pubblicare. */
export type EditorialItem = {
  url: string;
  category: NewsCategory;
  title: string;
  excerpt: string;
  content: string;
  titleEn?: string | null;
  excerptEn?: string | null;
  contentEn?: string | null;
};

/**
 * Pubblica le news scritte da Claude per una settimana. Fonte, link e titolo
 * originale vengono sempre dal database (news_feed_items), mai dall'input:
 * si pubblica solo ciò che è stato davvero raccolto da una fonte attiva.
 */
export async function publishEditorialItems(options: {
  weekStart: string;
  items: EditorialItem[];
  force?: boolean;
}): Promise<RunResult> {
  const db = requireNewsDb();
  const week = weekFromStart(options.weekStart);

  const { data: done } = await db
    .from("news_job_runs")
    .select("id")
    .eq("week_start", week.weekStart)
    .in("status", ["success", "partial"])
    .limit(1);
  if ((done ?? []).length > 0 && !options.force) {
    return {
      runId: null,
      status: "skipped",
      week,
      published: 0,
      message: `Settimana ${week.weekStart} già pubblicata (usa force per aggiungere)`,
    };
  }

  const log: JobLogEntry[] = [];
  const { data: runRow, error: runError } = await db
    .from("news_job_runs")
    .insert({
      trigger: "claude",
      status: "running",
      week_start: week.weekStart,
      week_end: week.weekEnd,
    })
    .select("id")
    .single();
  if (runError || !runRow) {
    throw new Error(`Impossibile registrare l'esecuzione: ${runError?.message}`);
  }
  const runId = runRow.id as string;

  const urls = [...new Set(options.items.map((i) => normalizeUrl(i.url)))];
  const { data: found, error: foundError } = await db
    .from("news_feed_items")
    .select("url,title,published_at,source_id,news_sources(id,name,active)")
    .in("url", urls);
  if (foundError) throw new Error(foundError.message);
  const byUrl = new Map((found ?? []).map((f) => [f.url as string, f]));

  const rows = [];
  for (const item of options.items) {
    const url = normalizeUrl(item.url);
    const feedItem = byUrl.get(url);
    const source = feedItem?.news_sources as unknown as
      | { id: string; name: string; active: boolean }
      | null
      | undefined;
    if (!feedItem || !source) {
      log.push({ level: "error", message: `Scartata, non è tra le notizie raccolte: ${url}` });
      continue;
    }
    rows.push({
      slug: `${slugify(item.title) || "news"}-${shortHash(url)}`,
      title: item.title.trim(),
      excerpt: item.excerpt.trim(),
      content: item.content.trim(),
      title_en: item.titleEn?.trim() || null,
      excerpt_en: item.excerptEn?.trim() || null,
      content_en: item.contentEn?.trim() || null,
      category: item.category,
      source_name: source.name,
      source_url: url,
      source_id: source.id,
      original_title: feedItem.title as string,
      original_published_at: feedItem.published_at as string,
      week_start: week.weekStart,
      status: "published",
      summary_method: "ai",
      run_id: runId,
    });
  }

  let published = 0;
  let status: NewsJobRun["status"] = "success";
  let message: string;
  if (rows.length > 0) {
    const { data: inserted, error: insertError } = await db
      .from("news_articles")
      .upsert(rows, { onConflict: "source_url", ignoreDuplicates: true })
      .select("id");
    if (insertError) {
      status = "error";
      message = `Pubblicazione non riuscita: ${insertError.message}`;
    } else {
      published = inserted?.length ?? 0;
      message = `${published} news scritte con Claude pubblicate per la settimana ${week.weekStart} – ${week.weekEnd}`;
      if (published > 0) revalidateNews();
    }
  } else {
    status = "error";
    message = "Nessuna delle news inviate corrisponde a una notizia raccolta";
  }
  if (status === "success" && rows.length < options.items.length) status = "partial";

  await db
    .from("news_job_runs")
    .update({
      status,
      message,
      log,
      finished_at: new Date().toISOString(),
      items_published: published,
    })
    .eq("id", runId);
  return { runId, status, week, published, message };
}

/** Aggiorna le pagine che mostrano le news. */
export function revalidateNews() {
  revalidateTag(NEWS_CACHE_TAG, "max");
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/news", "page");
  revalidatePath("/[locale]/news/[slug]", "page");
  revalidatePath("/sitemap.xml");
}
