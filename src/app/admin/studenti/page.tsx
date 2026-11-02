import type { Metadata } from "next";
import { connection } from "next/server";
import { isFaseFineAttiva } from "@/lib/auth/area";
import { authDb } from "@/lib/auth/session";
import { Shell, requireStaff } from "../shell";
import { ClassActiveButton, CreateClassForm, FaseFineToggle, ResetPasswordButton } from "./components";

export const metadata: Metadata = { title: "Studenti | Il Futuro Me" };

type Classe = { id: string; scuola: string; nome: string; codice: string; attiva: boolean; created_at: string };
type Studente = {
  id: string;
  username: string;
  classe_id: string;
  created_at: string;
  ultimo_accesso_at: string | null;
};

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString("it-IT", { timeZone: "Europe/Rome", day: "numeric", month: "short", year: "2-digit" })
    : "—";
}

export default async function StudentiPage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string; q?: string }>;
}) {
  await connection();
  const account = await requireStaff();
  const { classe: classeFilter = "", q = "" } = await searchParams;
  const search = q.trim().toLowerCase();

  const db = authDb();
  if (!db) {
    return (
      <Shell account={account} title="Studenti" current="/admin/studenti">
        <p className="text-primary">Supabase non configurato: servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.</p>
      </Shell>
    );
  }

  const [classiRes, studentiRes, compilazioniRes, fineAttiva] = await Promise.all([
    db.from("classi").select("id, scuola, nome, codice, attiva, created_at").order("scuola").order("nome"),
    db
      .from("account")
      .select("id, username, classe_id, created_at, ultimo_accesso_at")
      .eq("ruolo", "studente")
      .order("username"),
    db.from("questionario_risposte").select("account_id, fase").not("account_id", "is", null),
    isFaseFineAttiva(db),
  ]);
  const dbError = classiRes.error ?? studentiRes.error ?? compilazioniRes.error;
  const classi = (classiRes.data ?? []) as Classe[];
  const studenti = (studentiRes.data ?? []) as Studente[];

  const fatte = new Map<string, Set<string>>();
  for (const row of compilazioniRes.data ?? []) {
    if (!fatte.has(row.account_id)) fatte.set(row.account_id, new Set());
    fatte.get(row.account_id)!.add(row.fase);
  }
  const classeById = new Map(classi.map((c) => [c.id, c]));
  const perClasse = (id: string) => studenti.filter((s) => s.classe_id === id);
  const completate = (list: Studente[], fase: string) => list.filter((s) => fatte.get(s.id)?.has(fase)).length;

  const visibili = studenti.filter(
    (s) => (!classeFilter || s.classe_id === classeFilter) && (!search || s.username.includes(search))
  );

  return (
    <Shell account={account} title="Studenti" current="/admin/studenti">
      {dbError && (
        <p className="mb-8 text-primary">
          Errore del database: {dbError.message}. Hai applicato la migrazione
          supabase/migrations/20261103000000_account_studenti.sql?
        </p>
      )}

      {/* Fasi */}
      <section className="bg-surface-container-low rounded-3xl p-6 md:p-8 mb-10">
        <h2 className="text-xl font-bold text-secondary mb-4">Fasi del progetto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5">
            <p className="font-bold text-secondary">Inizio progetto</p>
            <p className="text-sm text-on-surface-variant">Sempre aperta.</p>
            <p className="text-sm mt-2">
              <strong>{completate(studenti, "inizio")}</strong> su {studenti.length} studenti hanno completato.
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5">
            <p className="font-bold text-secondary">Fine progetto</p>
            <p className="text-sm text-on-surface-variant">
              {fineAttiva ? "Aperta: gli studenti possono compilarla." : "Chiusa: gli studenti la vedono grigia."}
            </p>
            <p className="text-sm mt-2 mb-3">
              <strong>{completate(studenti, "fine")}</strong> su {studenti.length} studenti hanno completato.
            </p>
            {account.ruolo === "admin" ? (
              <FaseFineToggle attiva={fineAttiva} />
            ) : (
              <p className="text-xs text-on-surface-variant">La apre l&apos;admin dalla sua console.</p>
            )}
          </div>
        </div>
      </section>

      {/* Classi */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-secondary mb-1">Classi e codici ({classi.length})</h2>
        <p className="text-sm text-on-surface-variant mb-4">
          Dai il codice alla classe: ogni ragazzo e ragazza si registra da <strong>ilfuturome.it/it/registrati</strong>{" "}
          scegliendo username e password. Disattiva il codice quando la classe si è registrata.
        </p>
        <ul className="space-y-3 mb-6">
          {classi.map((c) => {
            const lista = perClasse(c.id);
            return (
              <li
                key={c.id}
                className="bg-surface-container-lowest rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-bold text-secondary">
                    {c.nome} · <span className="font-normal">{c.scuola}</span>
                    {!c.attiva && <span className="ml-2 text-xs text-primary font-bold">CODICE DISATTIVATO</span>}
                  </p>
                  <p className="font-mono text-lg font-bold tracking-wider select-all break-all">{c.codice}</p>
                  <p className="text-xs text-on-surface-variant">
                    {lista.length} registrati · inizio {completate(lista, "inizio")}/{lista.length} · fine{" "}
                    {completate(lista, "fine")}/{lista.length}
                  </p>
                </div>
                <ClassActiveButton id={c.id} attiva={c.attiva} />
              </li>
            );
          })}
        </ul>
        <details className="bg-surface-container-low rounded-3xl p-6" open={classi.length === 0}>
          <summary className="cursor-pointer font-bold text-secondary">Nuova classe</summary>
          <div className="mt-4">
            <CreateClassForm />
          </div>
        </details>
      </section>

      {/* Studenti */}
      <section>
        <h2 className="text-xl font-bold text-secondary mb-4">
          Studenti ({visibili.length}
          {visibili.length !== studenti.length ? ` di ${studenti.length}` : ""})
        </h2>
        <form method="get" className="flex flex-wrap gap-3 items-end mb-6">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1" htmlFor="classe">
              Classe
            </label>
            <select
              id="classe"
              name="classe"
              defaultValue={classeFilter}
              className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm"
            >
              <option value="">Tutte</option>
              {classi.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} · {c.scuola}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1" htmlFor="q">
              Username
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Cerca…"
              className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-full px-4 py-2 text-sm font-bold bg-secondary text-white hover:bg-secondary/90 cursor-pointer"
          >
            Filtra
          </button>
        </form>

        {visibili.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Nessuno studente.</p>
        ) : (
          <ul className="space-y-2">
            {visibili.map((s) => {
              const classe = classeById.get(s.classe_id);
              const fasi = fatte.get(s.id);
              return (
                <li
                  key={s.id}
                  className="bg-surface-container-lowest rounded-xl p-4 flex flex-wrap items-start justify-between gap-3"
                >
                  <div className="min-w-0 text-sm">
                    <p className="font-bold text-secondary break-all">{s.username}</p>
                    <p className="text-xs text-on-surface-variant">
                      {classe ? `${classe.nome} · ${classe.scuola}` : "—"} · registrato {formatDate(s.created_at)} ·
                      ultimo accesso {formatDate(s.ultimo_accesso_at)}
                    </p>
                    <p className="text-xs mt-1">
                      Inizio: <strong>{fasi?.has("inizio") ? "✓ completato" : "da fare"}</strong> · Fine:{" "}
                      <strong>{fasi?.has("fine") ? "✓ completato" : "da fare"}</strong>
                    </p>
                  </div>
                  <ResetPasswordButton id={s.id} username={s.username} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Shell>
  );
}
