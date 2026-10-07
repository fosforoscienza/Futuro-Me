"use client";

import { useState } from "react";
import { Check, Sparkles, ZoomIn, ZoomOut } from "lucide-react";
import { fitToBody, type AvatarSelection, type Group, type Level } from "@/lib/avatar/config";
import type { Focus } from "@/lib/avatar/render";
import { AvatarCanvas } from "./AvatarCanvas";

/** Primo piano automatico sulla parte del corpo che il livello modifica. */
const LEVEL_FOCUS: Record<string, Focus> = { lv1: "face", lv2: "torso", lv3: "legs" };

const headline = "font-[var(--font-plus-jakarta)]";

export function AvatarLevel({
  level,
  selection,
  onChange,
  error,
}: {
  level: Level;
  selection: AvatarSelection;
  onChange: (next: AvatarSelection) => void;
  error?: string | null;
}) {
  const set = (group: Group, id: string) => {
    if (group.kind === "multi") {
      const current = selection[group.id] as string[];
      let next = current.includes(id)
        ? current.filter((v) => v !== id)
        : [...current, id];
      if (group.max && next.length > group.max) next = next.slice(-group.max);
      onChange({ ...selection, [group.id]: next });
    } else {
      onChange(fitToBody({ ...selection, [group.id]: id }));
    }
  };

  const hasBody = selection.corpo !== "";
  const [wide, setWide] = useState<Record<string, boolean>>({});
  const closeUp = LEVEL_FOCUS[level.id];
  const focus: Focus = closeUp && !wide[level.id] ? closeUp : "full";

  return (
    <section aria-labelledby={`livello-${level.id}`} className="mt-8">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} className="text-tertiary" />
        <p className="text-tertiary font-bold tracking-[0.2em] uppercase text-xs">
          Avatar · Livello {level.number}
        </p>
      </div>
      <h2
        id={`livello-${level.id}`}
        className={`text-3xl md:text-4xl ${headline} font-extrabold text-secondary tracking-tight`}
      >
        {level.title}
      </h2>
      <p className="mt-3 text-lg text-on-surface-variant">{level.intro}</p>

      {/* Larghezza esplicita ricavata dall'altezza dello schermo: una colonna "auto"
          con l'aspect-ratio viene calcolata larga zero da Safari */}
      <div
        className="mt-6 grid grid-cols-1 md:grid-cols-[var(--avatar-w)_minmax(0,1fr)] gap-4 md:gap-8 items-start"
        style={
          {
            "--avatar-w": "min(calc((100vh - 8rem) * 848 / 1264), 590px)",
            "--avatar-w-mobile": "calc(38vh * 848 / 1264)",
          } as React.CSSProperties
        }
      >
        {/* Anteprima: su mobile fissa in alto sotto la barra, su desktop alta quanto lo schermo */}
        <div className="sticky top-20 md:top-24 z-20 -mx-6 px-6 py-2 bg-background/95 backdrop-blur md:mx-0 md:p-0 md:bg-transparent md:backdrop-blur-none">
          {hasBody ? (
            <AvatarCanvas
              selection={selection}
              focus={focus}
              className="w-[var(--avatar-w-mobile)] md:w-[var(--avatar-w)] mx-auto"
            >
              {closeUp && (
                <button
                  type="button"
                  onClick={() => setWide({ ...wide, [level.id]: !wide[level.id] })}
                  className="absolute bottom-3 right-3 bg-surface-container-lowest/90 text-secondary px-3 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow cursor-pointer hover:bg-surface-container-lowest"
                >
                  {focus === "full" ? (
                    <>
                      <ZoomIn size={14} /> Primo piano
                    </>
                  ) : (
                    <>
                      <ZoomOut size={14} /> Figura intera
                    </>
                  )}
                </button>
              )}
            </AvatarCanvas>
          ) : (
            <div
              className="w-[var(--avatar-w-mobile)] md:w-[var(--avatar-w)] mx-auto rounded-[1.5rem] bg-surface-container flex items-center justify-center text-center p-6 text-on-surface-variant font-bold"
              style={{ aspectRatio: "848 / 1264" }}
            >
              Scegli il genere per vedere il tuo avatar
            </div>
          )}
        </div>

        <div className="space-y-4">
          {level.groups.map((group) => (
            <fieldset
              key={group.id}
              className="bg-surface-container-lowest p-5 md:p-6 rounded-[1.5rem]"
            >
              <legend className="sr-only">{group.label}</legend>
              <p className={`${headline} font-bold text-secondary`} aria-hidden="true">
                {group.label}
              </p>
              {group.hint && (
                <p className="text-sm text-on-surface-variant mt-1">{group.hint}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {group.choices
                  .filter((c) => !c.bodies || (selection.corpo !== "" && c.bodies.includes(selection.corpo)))
                  .map((choice) => {
                  const value = selection[group.id];
                  const checked = Array.isArray(value)
                    ? value.includes(choice.id)
                    : value === choice.id;
                  if (group.kind === "swatch" && choice.color) {
                    return (
                      <label
                        key={choice.id}
                        title={choice.label}
                        className="cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary rounded-full"
                      >
                        <input
                          type="radio"
                          name={group.id}
                          checked={checked}
                          onChange={() => set(group, choice.id)}
                          className="sr-only"
                          aria-label={choice.label}
                        />
                        <span
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-transform ${
                            checked ? "border-secondary scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: `rgb(${choice.color.join(",")})` }}
                        >
                          {checked && (
                            <Check
                              size={16}
                              className={
                                choice.color[0] * 0.3 + choice.color[1] * 0.6 + choice.color[2] * 0.1 > 150
                                  ? "text-secondary"
                                  : "text-white"
                              }
                            />
                          )}
                        </span>
                      </label>
                    );
                  }
                  return (
                    <label
                      key={choice.id}
                      className={`cursor-pointer px-4 py-2.5 rounded-full text-sm font-bold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                        checked
                          ? "bg-secondary text-white"
                          : "bg-surface-container text-on-surface hover:bg-secondary/10"
                      }`}
                    >
                      <input
                        type={group.kind === "multi" ? "checkbox" : "radio"}
                        name={group.id}
                        checked={checked}
                        onChange={() => set(group, choice.id)}
                        className="sr-only"
                      />
                      {choice.label}
                    </label>
                  );
                })}
              </div>
              {group.kind === "swatch" && (
                <p className="mt-3 text-sm text-on-surface-variant">
                  {group.choices.find((c) => c.id === selection[group.id])?.label}
                </p>
              )}
            </fieldset>
          ))}
          {error && <p className="text-sm font-bold text-error">{error}</p>}
        </div>
      </div>
    </section>
  );
}
