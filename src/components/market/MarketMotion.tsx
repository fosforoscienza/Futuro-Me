"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { formatNumber } from "./format";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Coreografia della pagina Mercato del lavoro. Il contenuto è renderizzato dal server
 * già nello stato finale; qui si aggiunge il movimento leggendo gli attributi data-*:
 *
 * - data-group     blocco che entra tutto insieme quando arriva in vista; dentro:
 *   data-line      riga di titolo che sale dalla sua maschera
 *   data-rise      elemento che sale e compare (sfalsato)
 *   data-bar       barra che si disegna da sinistra (scaleX)
 *   data-col       colonna che cresce dal basso (scaleY)
 *   data-fade      dettaglio che compare dopo le barre
 *   data-cell="on" quadratino acceso di un grafico a 100 celle
 *   data-count     numero che conta fino al valore (vedi Num)
 *   data-avatar    avatar che esce dal bordo indicato da data-side
 * - data-drift     parallasse leggera legata allo scroll (data-speed in yPercent)
 * - data-ai-stage  scena dell'AI: su desktop si ferma (pin) e i passi scorrono con lo scroll
 *
 * Un blocco già in vista o superato quando la pagina si idrata non viene rianimato:
 * il lettore vede subito i dati, senza lampi. Con prefers-reduced-motion non parte niente.
 */
export function MarketMotion({
  locale,
  className,
  children,
}: {
  locale: string;
  className?: string;
  children: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          const { desktop } = ctx.conditions as { desktop: boolean; mobile: boolean };
          const el = root.current!;
          const restore: (() => void)[] = [];

          const stage = el.querySelector<HTMLElement>("[data-ai-stage]");
          const pinned = desktop && stage !== null;
          if (pinned) {
            // il CSS sovrappone i passi in un'unica cella: si alternano invece di scorrere
            stage.dataset.pinned = "";
            restore.push(() => delete stage.dataset.pinned);
          }

          /** Numero che conta da 0 al valore; il testo originale torna al revert. */
          const counter = (n: HTMLElement, duration: number, ease = "power2.out") => {
            const original = n.textContent;
            restore.push(() => {
              n.textContent = original;
            });
            const to = Number(n.dataset.count);
            const dec = Number(n.dataset.dec ?? 0);
            const write = (v: number) => {
              n.textContent = `${n.dataset.prefix ?? ""}${formatNumber(v, locale, dec)}${n.dataset.suffix ?? ""}`;
            };
            const p = { v: 0 };
            write(0);
            return gsap.to(p, { v: to, duration, ease, onUpdate: () => write(p.v) });
          };

          const below = (n: Element) => n.getBoundingClientRect().top > window.innerHeight * 0.9;
          const steps = stage ? gsap.utils.toArray<HTMLElement>("[data-ai-step]", stage) : [];
          const inLaterStep = (g: Element) => steps.slice(1).some((s) => s.contains(g));

          // Ingresso dei blocchi: prima la struttura (titoli, righe), poi i dati che si disegnano
          gsap.utils.toArray<HTMLElement>("[data-group]", el).forEach((group) => {
            if (!below(group) || (pinned && inLaterStep(group))) return;
            const $ = (s: string) => group.querySelectorAll<HTMLElement>(s);
            const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });

            $("[data-avatar]").forEach((a) => {
              const side = a.dataset.side === "left" ? -1 : 1;
              tl.from(a, { xPercent: 55 * side, autoAlpha: 0, duration: 1.4, ease: "expo.out" }, 0);
            });
            if ($("[data-line]").length)
              tl.from($("[data-line]"), { yPercent: 110, duration: 1, stagger: 0.09 }, 0);
            if ($("[data-rise]").length)
              tl.from($("[data-rise]"), { y: 28, autoAlpha: 0, duration: 0.8, stagger: 0.07 }, 0.12);
            if ($("[data-bar]").length)
              tl.from($("[data-bar]"), { scaleX: 0, duration: 1.3, stagger: 0.08, ease: "expo.out" }, 0.3);
            if ($("[data-col]").length)
              tl.from($("[data-col]"), { scaleY: 0, duration: 1.2, stagger: 0.12, ease: "expo.out" }, 0.3);
            if ($('[data-cell="on"]').length)
              tl.from(
                $('[data-cell="on"]'),
                { scale: 0, autoAlpha: 0, duration: 0.4, stagger: { amount: 0.9 }, ease: "back.out(2)" },
                0.3
              );
            if ($("[data-fade]").length)
              tl.from($("[data-fade]"), { autoAlpha: 0, duration: 0.6, stagger: 0.06 }, 0.9);
            $("[data-count]").forEach((n) => tl.add(counter(n, 1.6), 0.3));

            ScrollTrigger.create({
              trigger: group,
              start: "top 82%",
              once: true,
              onEnter: () => {
                tl.play();
              },
            });
          });

          // Parallasse: l'hero si allontana a velocità diverse, gli avatar seguono la pagina.
          // clamp() fa partire tutto da fermo se l'elemento è già in vista al caricamento.
          gsap.utils.toArray<HTMLElement>("[data-drift]", el).forEach((n) => {
            gsap.to(n, {
              yPercent: Number(n.dataset.speed ?? -10),
              ease: "none",
              scrollTrigger: {
                trigger: n,
                start: "clamp(top bottom)",
                end: "bottom top",
                scrub: true,
              },
            });
          });

          // Scena dell'AI: lo scroll fa avanzare il racconto un passo alla volta
          if (pinned && steps.length > 1) {
            const marks = gsap.utils.toArray<HTMLElement>("[data-ai-mark]", stage);
            const figure = stage.querySelector<HTMLElement>("[data-ai-figure]");
            gsap.set(steps.slice(1), { autoAlpha: 0, y: 56 });
            gsap.set(marks, { scaleX: 0, transformOrigin: "left center" });

            const tl = gsap.timeline({
              defaults: { ease: "none" },
              scrollTrigger: {
                trigger: stage,
                start: "top top",
                end: () => `+=${window.innerHeight * (steps.length - 0.4)}`,
                pin: true,
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            });

            tl.to(marks[0], { scaleX: 1, duration: 1 }, 0);
            steps.slice(1).forEach((step, i) => {
              const at = i + 1;
              tl.to(steps[i], { autoAlpha: 0, y: -56, duration: 0.3, ease: "power2.in" }, at)
                .to(step, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }, at + 0.2)
                .to(marks[at], { scaleX: 1, duration: 1 }, at);
              const cells = step.querySelectorAll('[data-cell="on"]');
              if (cells.length)
                tl.from(cells, { scale: 0, autoAlpha: 0, duration: 0.06, stagger: { amount: 0.3 } }, at + 0.3);
              step.querySelectorAll<HTMLElement>("[data-count]").forEach((n) => {
                tl.add(counter(n, 0.36, "none"), at + 0.3);
              });
            });
            if (figure) tl.to(figure, { xPercent: 8, duration: steps.length }, 0);
          }

          return () => restore.forEach((fn) => fn());
        }
      );

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
