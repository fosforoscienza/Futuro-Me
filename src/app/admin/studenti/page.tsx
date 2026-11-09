import type { Metadata } from "next";
import { connection } from "next/server";
import { isFaseFineAttiva } from "@/lib/auth/area";
import { authDb } from "@/lib/auth/session";
import { Shell, requireStaff } from "../shell";
import { CloseTokensButton, CreateClassForm, FaseFineToggle, GenerateTokensForm } from "./components";

export const metadata: Metadata = { title: "Questionario | Il Futuro Me" };

type Classe = { id: string; scuola: string; nome: string };
type Token = { id: string; classe_id: string; chiuso_at: string | null };
type Conteggi = { aperti: number; chiusi: number; inizio: number; fine: number; coppie: number };

export default async function QuestionarioAdminPage() {
  await connection();
  const account = await requireStaff();

  const db = authDb();
  if (!db) {
    return (
      <Shell account={account} title="Questionario" current="/admin/studenti">
        <p className="text-primary">Supabase non configurato: servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.</p>
      </Shell>
    );
  }

  const [classiRes, tokenRes, risposteRes, legacyRes, fineAttiva] = await Promise.all([
    db.from("classi").select("id, scuola, nome").order("scuola").order("nome"),
    db.from("questionario_token").select("id, classe_id, chiuso_at"),
    db.from("questionario_risposte").select("token_id, fase").not("token_id", "is", null),
    db.from("account").select("id", { count: "exact", head: true }).eq("ruolo", "studente"),
    isFaseFineAttiva(db),
  ]);
  const dbError = classiRes.error ?? tokenRes.error ?? risposteRes.error;
  const classi = (classiRes.data ?? []) as Classe[];
  const tokens = (tokenRes.data ?? []) as Token[];

  const fasiPerToken = new Map<string, Set<string>>();
  for (const row of risposteRes.data ?? []) {
    if (!fasiPerToken.has(row.token_id)) fasiPerToken.set(row.token_id, new Set());
    fasiPerToken.get(row.token_id)!.add(row.fase);
  }
  const conta = (lista: Token[]): Conteggi => {
    const c = { aperti: 0, chiusi: 0, inizio: 0, fine: 0, coppie: 0 };
    for (const t of lista) {
      const fasi = fasiPerToken.get(t.id);
      if (t.chiuso_at) c.chiusi++;
      else c.aperti++;
      if (fasi?.has("inizio")) c.inizio++;
      if (fasi?.has("fine")) c.fine++;
      if (fasi?.has("inizio") && fasi.has("fine")) c.coppie++;
    }
    return c;
  };
  const totale = conta(tokens);

  return (
    <Shell account={account} title="Questionario" current="/admin/studenti">
      {dbError && (
        <p className="mb-8 text-primary">
          Errore del database: {dbError.message}. Hai applicato la migrazione
          supabase/migrations/20261109000000_questionario_token.sql?
        </p>
      )}

      <section className="bg-surface-container-low rounded-3xl p-6 md:p-8 mb-10">
        <h2 className="text-xl font-bold text-secondary mb-2">Come funziona</h2>
        <ol className="list-decimal pl-5 space-y-1 text-sm text-on-surface-variant max-w-3xl">
          <li>Genera i token della classe: si scarica un PDF con il foglio per gli psicologi e i biglietti da ritagliare.</li>
          <li>In classe gli psicologi danno un biglietto a ogni studente e scrivono il nome a mano sul foglio. I nomi non entrano mai nel sito.</li>
          <li>Gli studenti vanno su <strong>ilfuturome.it/questionario</strong> e scrivono il loro token.</li>
          <li>A fine anno l&apos;admin attiva Fine progetto e gli psicologi ridanno a ognuno il suo token.</li>
          <li>Dopo il questionario finale gli psicologi distruggono i fogli e l&apos;admin chiude gli abbinamenti della classe.</li>
        </ol>
        <p className="mt-4 text-sm text-on-surface-variant max-w-3xl">
          Per far provare il percorso agli psicologi prima della lezione:{" "}
          <a href="/it/questionario/prova" target="_blank" rel="noopener" className="font-bold text-secondary underline">
            ilfuturome.it/questionario/prova
          </a>
          . È identico a quello degli studenti, ma non salva nulla e non serve un token vero.
        </p>
      </section>

      <section className="bg-surface-container-low rounded-3xl p-6 md:p-8 mb-10">
        <h2 className="text-xl font-bold text-secondary mb-4">Fase aperta</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5">
            <p className="font-bold text-secondary">{fineAttiva ? "Fine progetto" : "Inizio progetto"}</p>
            <p className="text-sm text-on-surface-variant">
              {fineAttiva
                ? "Chi scrive il token compila il questionario finale."
                : "Chi scrive il token compila il questionario iniziale."}
            </p>
            <p className="text-sm mt-2">
              Inizio: <strong>{totale.inizio}</strong> · Fine: <strong>{totale.fine}</strong> · Coppie complete:{" "}
              <strong>{totale.coppie}</strong>
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5">
            <p className="font-bold text-secondary mb-3">Interruttore</p>
            {account.ruolo === "admin" ? (
              <FaseFineToggle attiva={fineAttiva} />
            ) : (
              <p className="text-xs text-on-surface-variant">Lo cambia l&apos;admin dalla sua console.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-secondary mb-1">Classi ({classi.length})</h2>
        <p className="text-sm text-on-surface-variant mb-4">
          I token in chiaro si vedono solo nel PDF appena generato e non si possono ristampare: se un PDF si perde,
          generane altri. Quelli mai usati vengono eliminati alla chiusura.
        </p>
        <ul className="space-y-3 mb-6">
          {classi.map((c) => {
            const n = conta(tokens.filter((t) => t.classe_id === c.id));
            return (
              <li key={c.id} className="bg-surface-container-lowest rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-secondary">
                      {c.nome} · <span className="font-normal">{c.scuola}</span>
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {n.aperti} token attivi · inizio {n.inizio} · fine {n.fine} · coppie {n.coppie}
                      {n.chiusi > 0 && ` · ${n.chiusi} chiusi`}
                    </p>
                  </div>
                  {account.ruolo === "admin" && n.aperti > 0 && (
                    <CloseTokensButton classeId={c.id} label={`${c.nome} · ${c.scuola}`} />
                  )}
                </div>
                <GenerateTokensForm classeId={c.id} />
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

      {(legacyRes.count ?? 0) > 0 && (
        <section className="bg-surface-container-low rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-secondary mb-2">Account studenti del sistema precedente</h2>
          <p className="text-sm text-on-surface-variant max-w-3xl">
            Nel database ci sono ancora <strong>{legacyRes.count}</strong> account studente con le loro risposte.
            Registrazione e accesso sono disattivati; i dati restano finché non vengono cancellati (vedi
            docs/questionario-token.md).
          </p>
        </section>
      )}
    </Shell>
  );
}
