"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, KeyRound, LoaderCircle, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import { HeaderAvatar } from "@/components/avatar/HeaderAvatar";
import type { Fase } from "@/lib/auth/area";
import { TOKEN_MAX_INPUT, normalizeToken } from "@/lib/token/format";
import { Questionario } from "./Questionario";

const headline = "font-[var(--font-plus-jakarta)]";

const ERRORS: Record<string, string> = {
  format: "Servono 4 parole, per esempio lupo-fiume-pane-treno. Controlla di averle scritte come sul biglietto.",
  notFound: "Token non trovato. Controlla le parole sul biglietto o chiedi allo psicologo del progetto.",
  done: "Con questo token questa fase è già stata compilata. Se pensi sia un errore, chiedi allo psicologo del progetto.",
  tooMany: "Troppi tentativi da questa rete: aspetta qualche minuto e riprova.",
  notConfigured: "Il questionario non è ancora disponibile. Riprova più tardi.",
};

/** Ingresso del questionario: lo studente scrive le 4 parole del suo token, mai il nome. */
export function TokenGate() {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<{ token: string; fase: Fase } | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const token = normalizeToken(value);
    if (!token) {
      setError(ERRORS.format);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/questionario/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => ({}))) as { fase?: Fase; error?: string };
      if (res.ok && data.fase) {
        setAccess({ token, fase: data.fase });
        setValue("");
        return;
      }
      setError(ERRORS[data.error ?? ""] ?? "Qualcosa è andato storto. Riprova.");
    } catch {
      setError("Non riusciamo a raggiungere il sito. Controlla la connessione e riprova.");
    } finally {
      setPending(false);
    }
  };

  if (access) {
    return <Questionario token={access.token} fase={access.fase} onExit={() => setAccess(null)} />;
  }

  return (
    <div className="pb-24 md:pb-12">
      <header className="relative px-6 max-w-5xl mx-auto pt-12 pb-10 lg:min-h-[25rem]">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-primary" />
          <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs">Questionario</p>
        </div>
        <h1 className={`text-5xl md:text-7xl ${headline} font-extrabold text-secondary tracking-tighter leading-[0.9]`}>
          Il Futuro Me
        </h1>
        <HeaderAvatar id="dronePilot" hopKey="token" />
      </header>

      <div className="max-w-3xl mx-auto px-6">
        <form onSubmit={submit} className="bg-surface-container-low p-8 md:p-10 rounded-[1.5rem]" noValidate>
          <div className="bg-secondary-container text-on-secondary-container w-12 h-12 rounded-xl flex items-center justify-center mb-6">
            <KeyRound size={24} />
          </div>
          <h2 className={`text-2xl ${headline} font-bold text-secondary mb-3`}>
            <label htmlFor="token">Scrivi il tuo token</label>
          </h2>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            Sono le 4 parole sul biglietto che ti ha dato lo psicologo del progetto. Non scrivere il tuo
            nome: il token basta.
          </p>
          <input
            id="token"
            name="token"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={TOKEN_MAX_INPUT}
            placeholder="parola-parola-parola-parola"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "token-errore" : undefined}
            className="mt-6 w-full bg-surface-container-lowest px-4 py-3 rounded-2xl text-lg font-mono font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary"
          />
          {error && (
            <p id="token-errore" role="alert" className="mt-3 text-sm font-bold text-error">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="mt-6 px-6 py-3 rounded-full font-bold text-sm inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-70"
          >
            {pending ? (
              <>
                <LoaderCircle size={16} className="animate-spin" /> Controllo…
              </>
            ) : (
              <>
                Continua <ArrowRight size={16} />
              </>
            )}
          </button>
          <p className="mt-6 text-sm text-on-surface-variant leading-relaxed">
            Il token serve a confrontare le risposte di inizio e fine progetto senza sapere chi sei.{" "}
            <Link href="/privacy" className="font-bold text-secondary underline underline-offset-2">
              Leggi l’informativa privacy
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
