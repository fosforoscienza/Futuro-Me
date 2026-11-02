"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/**
 * Coreografia della home sotto l'hero. Il contenuto arriva dal server già nello
 * stato finale; qui si aggiunge il movimento leggendo gli attributi data-*:
 *
 * - data-hm-group   blocco che entra quando arriva in vista; dentro:
 *   data-hm-title   titolo diviso in righe che salgono dalla loro maschera
 *   data-hm-rise    elemento che sale e compare (sfalsato)
 *   data-hm-count   numero che conta fino al valore (il testo finale è già nell'HTML)
 *   data-hm-clip    immagine che si scopre dal basso
 * - data-hm-track   linea della timeline che si disegna seguendo lo scroll;
 *   data-hm-stop    tappa che entra e accende il suo pallino (data-hm-dot)
 *   quando la linea la raggiunge
 * - data-hm-row     riga di link: la freccia e il titolo seguono il puntatore
 *
 * Un blocco già in vista quando la pagina si idrata non viene rianimato: si
 * vede subito, senza lampi. Con prefers-reduced-motion non parte niente.
 */
export function HomeMotion({ locale, children }: { locale: string; children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const el = root.current!;
        const restore: (() => void)[] = [];
        const below = (n: Element) => n.getBoundingClientRect().top > window.innerHeight * 0.92;
        const format = new Intl.NumberFormat(locale === "en" ? "en-GB" : "it-IT");

        for (const group of gsap.utils.toArray<HTMLElement>("[data-hm-group]", el)) {
          if (!below(group)) continue;
          const tl = gsap.timeline({
            paused: true,
            defaults: { ease: "power4.out" },
            scrollTrigger: { trigger: group, start: "top 82%", once: true },
          });

          for (const title of gsap.utils.toArray<HTMLElement>("[data-hm-title]", group)) {
            const split = SplitText.create(title, { type: "lines", mask: "lines" });
            restore.push(() => split.revert());
            tl.from(split.lines, { yPercent: 110, duration: 1, stagger: 0.09 }, 0);
          }
          const rise = gsap.utils.toArray<HTMLElement>("[data-hm-rise]", group);
          if (rise.length) {
            tl.from(rise, { y: 36, autoAlpha: 0, duration: 0.9, stagger: 0.07, ease: "power3.out" }, 0.15);
          }
          for (const img of gsap.utils.toArray<HTMLElement>("[data-hm-clip]", group)) {
            tl.from(
              img,
              { clipPath: "inset(100% 0% 0% 0%)", scale: 1.08, duration: 1.2, ease: "expo.out" },
              0.1
            );
          }
          for (const n of gsap.utils.toArray<HTMLElement>("[data-hm-count]", group)) {
            const to = Number(n.dataset.hmCount);
            const original = n.textContent;
            restore.push(() => {
              n.textContent = original;
            });
            const p = { v: 0 };
            n.textContent = format.format(0);
            tl.to(
              p,
              {
                v: to,
                duration: 1.8,
                ease: "power3.out",
                onUpdate: () => {
                  n.textContent = format.format(Math.round(p.v));
                },
              },
              0.2
            );
          }
        }

        // Timeline delle plenarie: la linea si disegna con lo scroll e accende le tappe
        for (const track of gsap.utils.toArray<HTMLElement>("[data-hm-track]", el)) {
          const list = track.parentElement!;
          gsap.fromTo(
            track,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              transformOrigin: "50% 0%",
              scrollTrigger: { trigger: list, start: "top 70%", end: "bottom 60%", scrub: 0.6 },
            }
          );
          for (const stop of gsap.utils.toArray<HTMLElement>("[data-hm-stop]", list)) {
            const dot = stop.querySelector("[data-hm-dot]");
            gsap.from(stop.querySelectorAll("[data-hm-rise-stop]"), {
              x: 40,
              autoAlpha: 0,
              duration: 0.9,
              stagger: 0.06,
              ease: "power3.out",
              scrollTrigger: { trigger: stop, start: "top 78%", once: true },
            });
            if (dot) {
              gsap.fromTo(
                dot,
                { scale: 0.4, backgroundColor: "rgb(193 199 207)" },
                {
                  scale: 1,
                  backgroundColor: "rgb(150 46 22)",
                  duration: 0.5,
                  ease: "back.out(3)",
                  scrollTrigger: { trigger: stop, start: "top 60%", toggleActions: "play none none reverse" },
                }
              );
            }
          }
        }

        // Righe di link: titolo e freccia seguono il puntatore in orizzontale
        for (const row of gsap.utils.toArray<HTMLElement>("[data-hm-row]", el)) {
          const title = row.querySelector("[data-hm-row-title]");
          const arrow = row.querySelector("[data-hm-row-arrow]");
          const tx = title ? gsap.quickTo(title, "x", { duration: 0.6, ease: "power3.out" }) : null;
          const ax = arrow ? gsap.quickTo(arrow, "x", { duration: 0.4, ease: "power3.out" }) : null;
          const enter = () => {
            tx?.(16);
            ax?.(10);
          };
          const leave = () => {
            tx?.(0);
            ax?.(0);
          };
          row.addEventListener("pointerenter", enter);
          row.addEventListener("pointerleave", leave);
          restore.push(() => {
            row.removeEventListener("pointerenter", enter);
            row.removeEventListener("pointerleave", leave);
          });
        }

        return () => restore.forEach((fn) => fn());
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return <div ref={root}>{children}</div>;
}
