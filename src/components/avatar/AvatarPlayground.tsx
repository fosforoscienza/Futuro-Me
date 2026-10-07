"use client";

import { useRef, useState } from "react";
import { Download, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import {
  DEFAULT_SELECTION,
  LEVELS,
  type AvatarSelection,
} from "@/lib/avatar/config";
import { renderAvatar } from "@/lib/avatar/render";
import { AvatarLevel } from "./AvatarLevel";

const headline = "font-[var(--font-plus-jakarta)]";
const START: AvatarSelection = { ...DEFAULT_SELECTION, corpo: "F" };

/** Combinazione casuale, utile per provare velocemente molte varianti. */
function randomSelection(): AvatarSelection {
  const out: Record<string, unknown> = { ...DEFAULT_SELECTION };
  for (const group of LEVELS.flatMap((l) => l.groups)) {
    const ids = group.choices.map((c) => c.id);
    const pick = () => ids[Math.floor(Math.random() * ids.length)];
    if (group.kind === "multi") {
      const n = Math.floor(Math.random() * ((group.max ?? 2) + 1));
      out[group.id] = [...new Set(Array.from({ length: n }, pick))].slice(0, group.max ?? 2);
    } else {
      out[group.id] = pick();
    }
  }
  return out as AvatarSelection;
}

/** Pagina di prova dell'avatar: tutti i livelli liberi, senza questionario. */
export function AvatarPlayground() {
  const [selection, setSelection] = useState<AvatarSelection>(START);
  const [levelIndex, setLevelIndex] = useState(0);
  const downloading = useRef(false);
  const level = LEVELS[levelIndex];

  const download = async () => {
    if (downloading.current) return;
    downloading.current = true;
    try {
      const canvas = document.createElement("canvas");
      await renderAvatar(canvas, selection);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "il-mio-futuro-me.png";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      downloading.current = false;
    }
  };

  const button =
    "px-4 py-2.5 rounded-full font-bold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer";

  return (
    <div className="pb-24 md:pb-12">
      <header className="px-6 max-w-6xl mx-auto pt-12 pb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-primary" />
          <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs">
            Prova dell&apos;avatar
          </p>
        </div>
        <h1
          className={`text-5xl md:text-7xl ${headline} font-extrabold text-secondary tracking-tighter leading-[0.9]`}
        >
          Il Futuro Me
        </h1>
        <p className="mt-6 text-lg text-on-surface-variant max-w-2xl">
          Crea il tuo avatar liberamente, livello per livello. In questa pagina
          di prova non ci sono domande e non viene salvato nulla.
        </p>
      </header>

      <div className="max-w-6xl mx-auto px-6">
        <nav aria-label="Livelli dell'avatar" className="flex flex-wrap gap-2">
          {LEVELS.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLevelIndex(i)}
              aria-current={i === levelIndex ? "step" : undefined}
              className={`${button} ${
                i === levelIndex
                  ? "bg-secondary text-white"
                  : "bg-surface-container-highest text-on-surface hover:bg-secondary/10"
              }`}
            >
              {l.number}. {l.id === "lv0" ? "Genere" : l.title}
            </button>
          ))}
        </nav>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelection(randomSelection())}
            className={`${button} bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary-fixed-dim`}
          >
            <Shuffle size={16} /> Avatar a caso
          </button>
          <button
            type="button"
            onClick={() => setSelection(START)}
            className={`${button} bg-surface-container-highest text-on-surface hover:bg-secondary/10`}
          >
            <RotateCcw size={16} /> Ricomincia
          </button>
          <button
            type="button"
            onClick={download}
            className={`${button} bg-primary text-on-primary hover:bg-primary-container`}
          >
            <Download size={16} /> Scarica PNG
          </button>
        </div>

        <AvatarLevel level={level} selection={selection} onChange={setSelection} />

        <div className="mt-10 flex justify-between gap-4">
          <button
            type="button"
            disabled={levelIndex === 0}
            onClick={() => setLevelIndex(levelIndex - 1)}
            className={`${button} bg-surface-container-highest text-on-surface disabled:opacity-40`}
          >
            ← Livello precedente
          </button>
          <button
            type="button"
            disabled={levelIndex === LEVELS.length - 1}
            onClick={() => setLevelIndex(levelIndex + 1)}
            className={`${button} bg-secondary text-white disabled:opacity-40`}
          >
            Livello successivo →
          </button>
        </div>
      </div>
    </div>
  );
}
