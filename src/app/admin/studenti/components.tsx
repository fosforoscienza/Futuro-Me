"use client";

import { useActionState, useState, useTransition } from "react";
import { MAX_TOKENS_PER_BATCH } from "@/lib/token/format";
import { buildTokenPdf } from "@/lib/token/pdf";
import {
  changeOwnPassword,
  closeClassTokens,
  createClass,
  generateClassTokens,
  setFaseFine,
  type StaffState,
  type TokenBatch,
} from "./actions";

const input =
  "w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-secondary";
const button =
  "rounded-full px-4 py-2 text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer";

function Feedback({ state }: { state: StaffState | TokenBatch }) {
  if (!state) return null;
  return (
    <p role="status" className={`text-sm mt-2 ${state.ok ? "text-secondary" : "text-primary"}`}>
      {state.message}
    </p>
  );
}

export function CreateClassForm() {
  const [state, action, pending] = useActionState(createClass, null);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-[1fr_10rem_auto] gap-3 items-end">
      <div>
        <label className="block text-xs font-bold text-on-surface-variant mb-1" htmlFor="scuola">
          Scuola
        </label>
        <input id="scuola" name="scuola" required maxLength={120} placeholder="es. IC Senigallia Centro" className={input} />
      </div>
      <div>
        <label className="block text-xs font-bold text-on-surface-variant mb-1" htmlFor="nome">
          Classe
        </label>
        <input id="nome" name="nome" required maxLength={40} placeholder="es. 3B" className={input} />
      </div>
      <button type="submit" disabled={pending} className={`${button} bg-secondary text-white hover:bg-secondary/90`}>
        {pending ? "Creo…" : "Crea classe"}
      </button>
      <div className="sm:col-span-3">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function FaseFineToggle({ attiva }: { attiva: boolean }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<StaffState>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const question = attiva
            ? "Chiudere \"Fine progetto\"? I token torneranno a compilare Inizio progetto."
            : "Aprire \"Fine progetto\"? Da ora ogni token compila il questionario finale.";
          if (confirm(question)) startTransition(async () => setState(await setFaseFine(!attiva)));
        }}
        className={`${button} ${attiva ? "bg-surface-container-highest hover:bg-secondary/10" : "bg-primary text-on-primary hover:bg-primary-container"}`}
      >
        {attiva ? "Disattiva Fine progetto" : "Attiva Fine progetto"}
      </button>
      <Feedback state={state} />
    </div>
  );
}

/** Genera i token e scarica subito il PDF; i token restano solo in questo componente. */
export function GenerateTokensForm({ classeId }: { classeId: string }) {
  const [pending, startTransition] = useTransition();
  const [count, setCount] = useState(25);
  const [batch, setBatch] = useState<TokenBatch | null>(null);

  const download = (b: Extract<TokenBatch, { ok: true }>) => {
    const pdf = buildTokenPdf({
      scuola: b.scuola,
      classe: b.classe,
      data: new Date().toLocaleDateString("it-IT", { timeZone: "Europe/Rome" }),
      tokens: b.tokens,
      url: "ilfuturome.it/questionario",
    });
    const url = URL.createObjectURL(new Blob([pdf as BlobPart], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `token-${b.classe}-${b.scuola}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) + ".pdf";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const result = await generateClassTokens(classeId, count);
            setBatch(result);
            if (result.ok) download(result);
          });
        }}
      >
        <label className="text-xs font-bold text-on-surface-variant">
          Token
          <input
            type="number"
            min={1}
            max={MAX_TOKENS_PER_BATCH}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="ml-2 w-20 rounded-lg border border-outline-variant bg-white px-2 py-1.5 text-sm"
          />
        </label>
        <button type="submit" disabled={pending} className={`${button} bg-secondary text-white hover:bg-secondary/90`}>
          {pending ? "Genero…" : "Genera token e PDF"}
        </button>
      </form>
      {batch?.ok ? (
        <p role="status" className="text-sm mt-2 text-secondary">
          {batch.message} PDF scaricato: stampalo e poi cancellalo dal computer.{" "}
          <button type="button" onClick={() => download(batch)} className="font-bold underline cursor-pointer">
            Scarica di nuovo
          </button>
        </p>
      ) : (
        <Feedback state={batch} />
      )}
    </div>
  );
}

/** Solo admin: chiude gli abbinamenti della classe dopo la distruzione dei fogli. */
export function CloseTokensButton({ classeId, label }: { classeId: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<StaffState>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const conferma = prompt(
            `Chiudere gli abbinamenti di ${label}?\n\nFallo solo dopo il questionario finale e la distruzione dei fogli. ` +
              "I token smetteranno di funzionare, quelli mai usati verranno eliminati e le coppie inizio/fine " +
              "non saranno più collegabili ai fogli. Non si può annullare.\n\nScrivi CHIUDI per confermare."
          );
          if (conferma) startTransition(async () => setState(await closeClassTokens(classeId, conferma)));
        }}
        className={`${button} bg-surface-container-highest hover:bg-primary hover:text-on-primary`}
      >
        {pending ? "Chiudo…" : "Chiudi abbinamenti"}
      </button>
      <Feedback state={state} />
    </div>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPassword, null);
  return (
    <form action={action} className="space-y-4 max-w-sm">
      {[
        { id: "current", label: "Password attuale", autoComplete: "current-password" },
        { id: "next", label: "Nuova password (almeno 12 caratteri)", autoComplete: "new-password" },
        { id: "next2", label: "Ripeti la nuova password", autoComplete: "new-password" },
      ].map((f) => (
        <div key={f.id}>
          <label className="block text-xs font-bold text-on-surface-variant mb-1" htmlFor={f.id}>
            {f.label}
          </label>
          <input id={f.id} name={f.id} type="password" required maxLength={72} autoComplete={f.autoComplete} className={input} />
        </div>
      ))}
      <button type="submit" disabled={pending} className={`${button} bg-secondary text-white hover:bg-secondary/90`}>
        {pending ? "Aggiorno…" : "Cambia password"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
