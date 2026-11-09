"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin-auth";
import { newsDb } from "@/lib/news/db";
import { fetchFeed } from "@/lib/news/feeds";
import { revalidateNews, runNewsJob } from "@/lib/news/pipeline";
import { isNewsCategory } from "@/lib/news/types";
import { isMonday } from "@/lib/news/week";

export type ActionState = { ok: boolean; message: string } | null;

const NOT_ALLOWED: ActionState = { ok: false, message: "Sessione scaduta: rientra." };
const NO_DB: ActionState = {
  ok: false,
  message: "Supabase non configurato (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).",
};

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function httpUrl(value: string): string | null {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Crea (senza id) o aggiorna (con id) una fonte. */
export async function saveSource(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return NOT_ALLOWED;
  const db = newsDb();
  if (!db) return NO_DB;

  const id = field(form, "id");
  const name = field(form, "name");
  const siteUrl = httpUrl(field(form, "site_url"));
  const feedUrl = httpUrl(field(form, "feed_url"));
  const language = field(form, "language");
  const category = field(form, "category");
  const notes = field(form, "notes");
  const maxPages = Number(field(form, "max_pages") || "1");

  if (!name || name.length > 120) return { ok: false, message: "Nome mancante o troppo lungo." };
  if (!siteUrl) return { ok: false, message: "URL del sito non valido." };
  if (!feedUrl) return { ok: false, message: "URL del feed non valido." };
  if (language !== "it" && language !== "en") return { ok: false, message: "Lingua non valida." };
  if (!isNewsCategory(category)) return { ok: false, message: "Categoria non valida." };
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 5) {
    return { ok: false, message: "Pagine del feed: da 1 a 5." };
  }

  const row = {
    name,
    site_url: siteUrl,
    feed_url: feedUrl,
    language,
    category,
    active: form.get("active") === "on",
    keyword_filter: form.get("keyword_filter") === "on",
    max_pages: maxPages,
    notes: notes ? notes.slice(0, 500) : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = id
    ? await db.from("news_sources").update(row).eq("id", id)
    : await db.from("news_sources").insert(row);
  if (error) {
    return {
      ok: false,
      message: error.code === "23505" ? "Esiste già una fonte con questo feed." : error.message,
    };
  }
  revalidatePath("/admin");
  return { ok: true, message: id ? "Fonte aggiornata." : "Fonte aggiunta." };
}

export async function setSourceActive(id: string, active: boolean): Promise<ActionState> {
  if (!(await isAdmin())) return NOT_ALLOWED;
  const db = newsDb();
  if (!db) return NO_DB;
  const { error } = await db
    .from("news_sources")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  return { ok: true, message: active ? "Fonte attivata." : "Fonte disattivata." };
}

/** Prova un feed senza salvarlo: quanti elementi e data dell'ultimo. */
export async function testFeed(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return NOT_ALLOWED;
  const feedUrl = httpUrl(field(form, "feed_url"));
  if (!feedUrl) return { ok: false, message: "URL del feed non valido." };
  try {
    const items = await fetchFeed(feedUrl);
    const latest = items
      .map((i) => i.publishedAt)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return {
      ok: items.length > 0,
      message:
        items.length > 0
          ? `Feed valido: ${items.length} elementi, ultimo del ${latest ? latest.toLocaleDateString("it-IT") : "data non indicata"}. Primo titolo: "${items[0].title}"`
          : "Il feed non contiene elementi.",
    };
  } catch (error) {
    return {
      ok: false,
      message: `Feed non leggibile: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function runJobNow(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return NOT_ALLOWED;
  if (!newsDb()) return NO_DB;
  const weekStart = field(form, "week_start") || undefined;
  if (weekStart && !isMonday(weekStart)) {
    return { ok: false, message: "La settimana deve iniziare di lunedì." };
  }
  try {
    const result = await runNewsJob({
      trigger: "manual",
      weekStart,
      force: form.get("force") === "on",
    });
    revalidatePath("/admin");
    return { ok: result.status !== "error", message: result.message };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Pubblica un estratto revisionato, oppure nasconde o ripubblica una news automatica. */
export async function setArticleStatus(
  id: string,
  status: "published" | "hidden"
): Promise<ActionState> {
  if (!(await isAdmin())) return NOT_ALLOWED;
  const db = newsDb();
  if (!db) return NO_DB;
  const { error } = await db.from("news_articles").update({ status }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  if (status === "published") {
    // Gli estratti nascono nascosti: la data visibile è quella dell'approvazione.
    await db
      .from("news_articles")
      .update({ published_at: new Date().toISOString() })
      .eq("id", id)
      .eq("summary_method", "extract");
  }
  revalidateNews();
  revalidatePath("/admin");
  return { ok: true, message: status === "hidden" ? "News nascosta." : "News pubblicata." };
}
