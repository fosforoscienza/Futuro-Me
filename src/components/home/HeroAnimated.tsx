"use client";

import { useRef, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import type { CastId } from "@/lib/avatar/cast";
import { HeroWalker } from "./HeroWalker";

/**
 * I sei "futuri me" che possono comparire nell'hero: a ogni caricamento se ne
 * scelgono tre a caso, così la pagina è sempre un po' diversa. `ratio` è il
 * rapporto dei file in public/avatar/hero (stessa scala e linea di terra per
 * tutti, così le altezze restano vere e i sei sono intercambiabili).
 */
const POOL: { id: CastId; ratio: number }[] = [
  { id: "solarTech", ratio: 326 / 900 },
  { id: "aiDev", ratio: 344 / 900 },
  { id: "dataAnalyst", ratio: 362 / 900 },
  { id: "cyber", ratio: 412 / 900 },
  { id: "biotech", ratio: 302 / 900 },
  { id: "firefighter", ratio: 386 / 900 },
];

/** Ritardo dei passi per posizione (sinistra, centro, destra): parte prima chi sta al centro. */
const DELAYS = [500, 150, 850];

/** Sovrapposizione per lato tra figure vicine, in pixel dei file (alti 900). */
const OVERLAP = 40;
/** Larghezza della scena: quella del terzetto più largo, così l'altezza non cambia tra un caricamento e l'altro. */
const STAGE_W =
  [...POOL]
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3)
    .reduce((w, f) => w + f.ratio * 900, 0) -
  4 * OVERLAP;

/**
 * Terzetto scelto nel browser, una volta per caricamento della pagina. Al server
 * (e durante l'idratazione) non c'è ancora: la scena resta vuota per un attimo,
 * mentre il suo ingresso CSS non è ancora partito.
 */
let trio: typeof POOL | null = null;
const pickTrio = () => (trio ??= gsap.utils.shuffle([...POOL]).slice(0, 3));
const noSubscribe = () => () => {};

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/** Posizione nella sequenza d'ingresso CSS (vedi globals.css). */
const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function HeroAnimated() {
  const t = useTranslations();
  const root = useRef<HTMLElement>(null);
  const figures = useSyncExternalStore(noSubscribe, pickTrio, () => null) ?? [];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const title = root.current!.querySelector<HTMLElement>("[data-hero-title]")!;
        const sub = root.current!.querySelector<HTMLElement>("[data-hero-sub]")!;
        // Il CSS li tiene nascosti fino a qui (con un ripiego a tempo se lo script non parte)
        const chars = SplitText.create(title, { type: "words,chars", mask: "chars", charsClass: "char-lift" });
        const lines = SplitText.create(sub, { type: "lines", mask: "lines" });
        gsap.set([title, sub], { visibility: "visible" });

        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .from(chars.chars, { yPercent: 115, rotate: 7, duration: 1.2, stagger: 0.024 })
          .from(lines.lines, { yPercent: 105, duration: 1, stagger: 0.09, ease: "power4.out" }, 0.45);

        // Uscita: scorrendo, il testo sale e sbiadisce, la scena scende più lenta
        gsap
          .timeline({
            scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.5 },
          })
          .to("[data-hero-copy]", { yPercent: -18, autoAlpha: 0.25, ease: "none" }, 0)
          .to("[data-hero-stage]", { yPercent: 10, ease: "none" }, 0);

        return () => {
          chars.revert();
          lines.revert();
        };
      });

      // Le lettere del titolo si sollevano vicino al puntatore
      mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
        const title = root.current!.querySelector<HTMLElement>("[data-hero-title]")!;
        // lettere già divise dal contesto precedente (stessa condizione, eseguito prima)
        // si solleva la maschera della lettera, così la lettera non viene tagliata
        const targets = gsap.utils
          .toArray<HTMLElement>(".char-lift", title)
          .map((c) => c.parentElement as HTMLElement);
        const lift = targets.map((c) => gsap.quickTo(c, "y", { duration: 0.5, ease: "power3.out" }));
        const move = (e: PointerEvent) => {
          targets.forEach((c, i) => {
            const r = c.getBoundingClientRect();
            const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
            lift[i](d < 140 ? -10 * (1 - d / 140) : 0);
          });
        };
        const leave = () => lift.forEach((fn) => fn(0));
        title.addEventListener("pointermove", move);
        title.addEventListener("pointerleave", leave);
        return () => {
          title.removeEventListener("pointermove", move);
          title.removeEventListener("pointerleave", leave);
        };
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <header
      ref={root}
      className="relative overflow-x-clip px-6 max-w-7xl mx-auto pt-10 md:pt-16 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center"
    >
      <div data-hero-copy className="lg:col-span-7">
        <h1
          data-hero-title
          className="text-5xl md:text-7xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter leading-[1]"
        >
          <span className="block pb-[0.06em]">{t("hero.title")}</span>
          <span className="block pb-[0.06em] text-primary">{t("hero.titleAccent")}</span>
        </h1>
        <p
          data-hero-sub
          className="mt-7 text-lg md:text-xl text-on-surface-variant max-w-[34rem] leading-relaxed"
        >
          {t("hero.subtitle")}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            data-hero-fade
            style={order(2)}
            href="/mercato-lavoro"
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-[1.5rem] font-bold inline-flex items-center gap-2 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] group"
          >
            {t("home.exploreMarket")}
            <ArrowRight
              size={18}
              className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
            />
          </Link>
          <Link
            data-hero-fade
            style={order(3)}
            href="/progetto"
            className="bg-surface-container-highest text-on-surface px-8 py-3 rounded-[1.5rem] font-bold inline-flex items-center gap-2 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            {t("home.discoverProject")}
          </Link>
        </div>
      </div>

      <div className="lg:col-span-5 flex flex-col items-center">
        <div
          data-hero-fade
          data-hero-stage
          style={{ ...order(2), aspectRatio: `${STAGE_W} / 900` }}
          className="relative flex w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[460px] items-end justify-center"
        >
          <span
            aria-hidden="true"
            className="absolute -bottom-[3%] left-1/2 h-[9%] w-[105%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(150_46_22/0.22),rgb(150_46_22/0.08)_60%,transparent)]"
          />
          {figures.map((f, i) => (
            <div
              key={f.id}
              aria-hidden="true"
              className={`relative h-full shrink-0 ${i === 1 ? "z-10" : ""}`}
              style={{ marginInline: `${(-OVERLAP / STAGE_W) * 100}%` }}
            >
              <HeroWalker
                id={f.id}
                ratio={f.ratio}
                delay={DELAYS[i]}
                preload={i === 1}
                sizes="(min-width: 1024px) 220px, 30vw"
              />
            </div>
          ))}
        </div>
        <div data-hero-fade style={order(4)} className="mt-6 min-h-[1.75rem] text-center">
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 font-[var(--font-plus-jakarta)] font-bold text-lg text-secondary">
            {figures.map((f) => (
              <li key={f.id}>{t(`hero.futures.${f.id}`)}</li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
