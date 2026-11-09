import { connection } from "next/server";
import { redirect } from "next/navigation";
import { newsDb } from "@/lib/news/db";
import type { NewsArticleRow, NewsJobRun, NewsSource } from "@/lib/news/types";
import { previousWeek } from "@/lib/news/week";
import { Shell, requireStaff } from "./shell";
import {
  ArticleStatusButton,
  RunJobForm,
  SourceForm,
  SourceRow,
} from "./components";

// Il pulsante "Esegui ora" lancia il job dentro una server action.
export const maxDuration = 300;

const STATUS_LABELS: Record<NewsJobRun["status"], string> = {
  running: "In corso",
  success: "Completata",
  partial: "Completata con errori",
  error: "Errore",
  skipped: "Saltata",
};

function formatDateTime(value: string | null) {
  return value
    ? new Date(value).toLocaleString("it-IT", { timeZone: "Europe/Rome" })
    : "—";
}

export default async function AdminPage() {
  // Sempre al momento della richiesta: dipende da sessione e variabili d'ambiente.
  await connection();
  const account = await requireStaff();
  // Le news sono solo dell'admin: il gestore entra direttamente negli studenti.
  if (account.ruolo !== "admin") redirect("/admin/studenti");

  const db = newsDb();
  if (!db) {
    return (
      <Shell account={account} title="Console news" current="/admin">
        <p className="text-primary">
          Supabase non configurato: servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
        </p>
      </Shell>
    );
  }

  const [sourcesRes, runsRes, articlesRes] = await Promise.all([
    db.from("news_sources").select("*").order("active", { ascending: false }).order("name"),
    db.from("news_job_runs").select("*").order("started_at", { ascending: false }).limit(10),
    db
      .from("news_articles")
      .select("id,slug,title,excerpt,content,source_name,source_url,status,week_start,summary_method,published_at")
      .order("published_at", { ascending: false })
      .limit(30),
  ]);
  const dbError = sourcesRes.error ?? runsRes.error ?? articlesRes.error;
  const sources = (sourcesRes.data ?? []) as NewsSource[];
  const runs = (runsRes.data ?? []) as NewsJobRun[];
  const articles = (articlesRes.data ?? []) as Pick<
    NewsArticleRow,
    | "id"
    | "slug"
    | "title"
    | "excerpt"
    | "content"
    | "source_name"
    | "source_url"
    | "status"
    | "week_start"
    | "summary_method"
    | "published_at"
  >[];
  const lastRun = runs[0];
  const activeCount = sources.filter((s) => s.active).length;

  return (
    <Shell account={account} title="Console news" current="/admin">
      {dbError && (
        <p className="mb-8 text-primary">
          Errore del database: {dbError.message}. Hai applicato la migrazione
          supabase/migrations/20261102000000_news_automation.sql?
        </p>
      )}

      {/* Job */}
      <section className="bg-surface-container-low rounded-3xl p-6 md:p-8 mb-10">
        <h2 className="text-xl font-bold text-secondary mb-1">Job settimanale</h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Ogni giorno raccoglie le notizie dalle {activeCount} fonti attive; ogni lunedì alle
          8:00 (ora italiana) il task programmato di Claude Desktop scrive e pubblica le news
          della settimana precedente, lunedì-domenica. &quot;Esegui ora&quot; pubblica subito
          estratti delle fonti, senza riassunto.
        </p>

        {lastRun ? (
          <div className="mb-6 text-sm space-y-1">
            <p>
              <strong>Ultima esecuzione:</strong> {formatDateTime(lastRun.started_at)} (
              {lastRun.trigger === "cron"
                ? "automatica"
                : lastRun.trigger === "claude"
                  ? "redazione Claude"
                  : "manuale"}) —{" "}
              <span className={lastRun.status === "error" ? "text-primary font-bold" : "font-bold"}>
                {STATUS_LABELS[lastRun.status]}
              </span>
            </p>
            <p>
              Settimana {lastRun.week_start} – {lastRun.week_end}: {lastRun.sources_checked} fonti,{" "}
              {lastRun.items_found} elementi letti, {lastRun.items_in_week} nella settimana,{" "}
              <strong>{lastRun.items_published} pubblicate</strong>
            </p>
            {lastRun.message && <p className="text-on-surface-variant">{lastRun.message}</p>}
          </div>
        ) : (
          <p className="mb-6 text-sm text-on-surface-variant">Nessuna esecuzione registrata.</p>
        )}

        <RunJobForm defaultWeek={previousWeek().weekStart} />

        {runs.length > 0 && (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-bold text-secondary">
              Ultime {runs.length} esecuzioni e log
            </summary>
            <ul className="mt-4 space-y-3">
              {runs.map((run) => (
                <li key={run.id} className="bg-surface-container-lowest rounded-xl p-4 text-xs">
                  <p className="font-bold">
                    {formatDateTime(run.started_at)} · {run.trigger} · {STATUS_LABELS[run.status]} ·
                    settimana {run.week_start} · {run.items_published} pubblicate
                  </p>
                  {run.message && <p className="mt-1">{run.message}</p>}
                  {run.log?.length > 0 && (
                    <ul className="mt-2 space-y-0.5 font-mono">
                      {run.log.map((entry, i) => (
                        <li
                          key={i}
                          className={entry.level === "error" ? "text-primary" : "text-on-surface-variant"}
                        >
                          [{entry.level}] {entry.source ? `${entry.source}: ` : ""}
                          {entry.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* Sources */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-secondary mb-4">
          Fonti ({activeCount} attive su {sources.length})
        </h2>
        <ul className="space-y-3 mb-6">
          {sources.map((source) => (
            <SourceRow key={source.id} source={source} />
          ))}
        </ul>
        <details className="bg-surface-container-low rounded-3xl p-6">
          <summary className="cursor-pointer font-bold text-secondary">Aggiungi una fonte</summary>
          <div className="mt-4">
            <SourceForm />
          </div>
        </details>
      </section>

      {/* Published */}
      <section>
        <h2 className="text-xl font-bold text-secondary mb-4">News automatiche recenti</h2>
        {articles.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Ancora nessuna news pubblicata dal job.</p>
        ) : (
          <ul className="space-y-2">
            {articles.map((a) => (
              <li
                key={a.id}
                className="bg-surface-container-lowest rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0 text-sm">
                  {a.status === "published" ? (
                    <a href={`/it/news/${a.slug}`} className="font-bold text-secondary hover:underline">
                      {a.title}
                    </a>
                  ) : (
                    <span className="font-bold text-secondary">{a.title}</span>
                  )}
                  <p className="text-xs text-on-surface-variant">
                    Settimana {a.week_start} · Fonte:{" "}
                    <a href={a.source_url} target="_blank" rel="noopener noreferrer" className="underline">
                      {a.source_name}
                    </a>{" "}
                    · {a.summary_method === "ai" ? "riassunto AI" : "estratto"}
                    {a.status === "hidden" ? " · NASCOSTA" : ""}
                  </p>
                  {a.status === "hidden" && (
                    // Le news nascoste non hanno pagina: il testo si rivede qui.
                    <details className="mt-2 text-xs text-on-surface-variant">
                      <summary className="cursor-pointer font-bold">Rivedi il testo</summary>
                      <p className="mt-2 font-bold">{a.excerpt}</p>
                      <p className="mt-2 whitespace-pre-line">{a.content}</p>
                    </details>
                  )}
                </div>
                <ArticleStatusButton id={a.id} status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Shell>
  );
}
