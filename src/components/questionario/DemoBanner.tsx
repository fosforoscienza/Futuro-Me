import { FlaskConical } from "lucide-react";

/** Avviso fisso della modalità prova: chi la usa deve sapere che nulla viene salvato. */
export function DemoBanner() {
  return (
    <div
      role="note"
      className="mb-8 flex items-start gap-3 rounded-2xl border-2 border-dashed border-primary bg-primary-fixed/40 p-4 text-sm text-on-surface"
    >
      <FlaskConical size={20} className="mt-0.5 shrink-0 text-primary" />
      <p>
        <strong>Modalità prova per lo staff.</strong> Il percorso è identico a quello degli studenti, ma le
        risposte non vengono salvate e il token non viene controllato. Gli studenti usano invece{" "}
        <strong>ilfuturome.it/questionario</strong>.
      </p>
    </div>
  );
}
