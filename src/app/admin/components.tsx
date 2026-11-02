"use client";

import { useActionState, useState, useTransition } from "react";
import {
  runJobNow,
  saveSource,
  setArticleStatus,
  setSourceActive,
  testFeed,
  type ActionState,
} from "./actions";
import type { NewsSource } from "@/lib/news/types";

const CATEGORY_LABELS: Record<string, string> = {
  ai: "Intelligenza artificiale",
  jobs: "Lavoro",
  training: "Formazione",
  skills: "Competenze",
};

const input =
  "w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-secondary";
const button =
  "rounded-full px-4 py-2 text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer";

function Feedback({ state }: { state: ActionState }) {
  if (!state) return null;
  return (
    <p
      role="status"
      className={`text-sm mt-2 ${state.ok ? "text-secondary" : "text-primary"}`}
    >
      {state.message}
    </p>
  );
}

export function RunJobForm({ defaultWeek }: { defaultWeek: string }) {
  const [state, action, pending] = useActionState(runJobNow, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-4">
      <div>
        <label className="block text-xs font-bold text-on-surface-variant mb-1" htmlFor="week_start">
          Settimana (lunedì)
        </label>
        <input
          id="week_start"
          name="week_start"
          type="date"
          defaultValue={defaultWeek}
          className={input}
        />
      </div>
      <label className="flex items-center gap-2 text-sm pb-2">
        <input type="checkbox" name="force" /> Forza (ripeti se già pubblicata)
      </label>
      <button
        type="submit"
        disabled={pending}
        className={`${button} bg-primary text-white hover:bg-primary/90`}
      >
        {pending ? "In esecuzione… (fino a qualche minuto)" : "Esegui ora"}
      </button>
      <div className="basis-full">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function SourceForm({ source, onDone }: { source?: NewsSource; onDone?: () => void }) {
  const [state, action, pending] = useActionState(
    async (prev: ActionState, form: FormData) => {
      const result = await saveSource(prev, form);
      if (result?.ok) onDone?.();
      return result;
    },
    null
  );
  const [testState, testAction, testing] = useActionState(testFeed, null);

  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      {source && <input type="hidden" name="id" value={source.id} />}
      <div>
        <label className="block text-xs font-bold mb-1">Nome</label>
        <input name="name" required defaultValue={source?.name} className={input} />
      </div>
      <div>
        <label className="block text-xs font-bold mb-1">Sito</label>
        <input name="site_url" type="url" required defaultValue={source?.site_url} className={input} />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-bold mb-1">URL del feed RSS/Atom</label>
        <input name="feed_url" type="url" required defaultValue={source?.feed_url} className={input} />
      </div>
      <div>
        <label className="block text-xs font-bold mb-1">Lingua</label>
        <select name="language" defaultValue={source?.language ?? "it"} className={input}>
          <option value="it">Italiano</option>
          <option value="en">Inglese</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold mb-1">Categoria predefinita</label>
        <select name="category" defaultValue={source?.category ?? "jobs"} className={input}>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold mb-1">
          Pagine da leggere (feed WordPress, ?paged=N)
        </label>
        <input
          name="max_pages"
          type="number"
          min={1}
          max={5}
          defaultValue={source?.max_pages ?? 1}
          className={input}
        />
      </div>
      <div>
        <label className="block text-xs font-bold mb-1">Note</label>
        <input name="notes" defaultValue={source?.notes ?? ""} className={input} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={source?.active ?? true} /> Attiva
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="keyword_filter"
          defaultChecked={source?.keyword_filter ?? true}
        />{" "}
        Filtra per parole chiave (feed generici)
      </label>
      <div className="md:col-span-2 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className={`${button} bg-secondary text-white hover:bg-secondary/90`}
        >
          {pending ? "Salvataggio…" : source ? "Salva modifiche" : "Aggiungi fonte"}
        </button>
        <button
          type="submit"
          formAction={testAction}
          formNoValidate
          disabled={testing}
          className={`${button} bg-surface-container-highest hover:bg-secondary/10`}
        >
          {testing ? "Prova…" : "Prova feed"}
        </button>
      </div>
      <div className="md:col-span-2">
        <Feedback state={state} />
        <Feedback state={testState} />
      </div>
    </form>
  );
}

export function SourceRow({ source }: { source: NewsSource }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>(null);

  return (
    <li className="bg-surface-container-lowest rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-secondary">
            {source.name}{" "}
            <span className="text-xs font-normal text-on-surface-variant">
              · {source.language.toUpperCase()} · {CATEGORY_LABELS[source.category]}
              {source.keyword_filter ? " · filtro parole chiave" : ""}
              {source.max_pages > 1 ? ` · ${source.max_pages} pagine` : ""}
            </span>
          </p>
          <a
            href={source.feed_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-outline break-all hover:underline"
          >
            {source.feed_url}
          </a>
          <p className="text-xs mt-1">
            {source.last_fetched_at ? (
              <>
                Ultima lettura {new Date(source.last_fetched_at).toLocaleString("it-IT")}:{" "}
                {source.last_status === "ok" ? (
                  <span className="text-secondary">ok, {source.last_item_count ?? 0} elementi</span>
                ) : (
                  <span className="text-primary">errore: {source.last_error}</span>
                )}
              </>
            ) : (
              <span className="text-on-surface-variant">Mai letta</span>
            )}
          </p>
          {source.notes && <p className="text-xs text-on-surface-variant mt-1">{source.notes}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <span
            className={`text-xs font-bold px-3 py-2 rounded-full ${source.active ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-highest text-on-surface-variant"}`}
          >
            {source.active ? "Attiva" : "Disattivata"}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => setState(await setSourceActive(source.id, !source.active)))
            }
            className={`${button} bg-surface-container-highest hover:bg-secondary/10`}
          >
            {source.active ? "Disattiva" : "Attiva"}
          </button>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={`${button} bg-surface-container-highest hover:bg-secondary/10`}
          >
            {editing ? "Chiudi" : "Modifica"}
          </button>
        </div>
      </div>
      <Feedback state={state} />
      {editing && (
        <div className="mt-4 pt-4 border-t border-outline-variant/40">
          <SourceForm source={source} onDone={() => setEditing(false)} />
        </div>
      )}
    </li>
  );
}

export function ArticleStatusButton({
  id,
  status,
}: {
  id: string;
  status: "published" | "hidden";
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>(null);
  const next = status === "published" ? "hidden" : "published";
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => setState(await setArticleStatus(id, next)))}
        className={`${button} text-xs bg-surface-container-highest hover:bg-secondary/10`}
      >
        {status === "published" ? "Nascondi" : "Ripubblica"}
      </button>
      {state && !state.ok && <Feedback state={state} />}
    </div>
  );
}
