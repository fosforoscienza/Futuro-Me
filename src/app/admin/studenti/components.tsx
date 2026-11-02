"use client";

import { useActionState, useState, useTransition } from "react";
import {
  changeOwnPassword,
  createClass,
  resetStudentPassword,
  setClassActive,
  setFaseFine,
  type StaffState,
} from "./actions";

const input =
  "w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-secondary";
const button =
  "rounded-full px-4 py-2 text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer";

function Feedback({ state }: { state: StaffState }) {
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
        {pending ? "Creo…" : "Crea classe e codice"}
      </button>
      <div className="sm:col-span-3">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function ClassActiveButton({ id, attiva }: { id: string; attiva: boolean }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<StaffState>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => setState(await setClassActive(id, !attiva)))}
        className={`${button} ${attiva ? "bg-surface-container-highest hover:bg-secondary/10" : "bg-secondary text-white"}`}
      >
        {attiva ? "Disattiva codice" : "Riattiva codice"}
      </button>
      {state && !state.ok && <Feedback state={state} />}
    </div>
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
            ? "Chiudere \"Fine progetto\"? Gli studenti la vedranno di nuovo grigia."
            : "Aprire \"Fine progetto\" a tutti gli studenti?";
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

export function ResetPasswordButton({ id, username }: { id: string; username: string }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<StaffState>(null);
  return (
    <div className="text-right">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm(`Generare una nuova password per ${username}? Quella attuale smetterà di funzionare.`)) {
            startTransition(async () => setState(await resetStudentPassword(id)));
          }
        }}
        className={`${button} bg-surface-container-highest hover:bg-secondary/10 whitespace-nowrap`}
      >
        {pending ? "Genero…" : "Reimposta password"}
      </button>
      {state?.password ? (
        <div role="status" className="mt-2 rounded-xl bg-tertiary-fixed px-3 py-2 text-left text-xs">
          <p>{state.message}</p>
          <p className="font-mono text-base font-bold tracking-wider select-all">{state.password}</p>
          <p className="text-on-surface-variant">Comunicala allo studente: non verrà più mostrata.</p>
        </div>
      ) : (
        <Feedback state={state} />
      )}
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
