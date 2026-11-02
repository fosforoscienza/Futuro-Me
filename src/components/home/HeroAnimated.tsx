"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import type { CastId } from "@/lib/avatar/cast";
import { HeroWalker } from "./HeroWalker";

/**
 * I tre "futuri me" dell'hero, da sinistra a destra, in fila sulla stessa linea
 * di terra. `ratio` è il rapporto dei file in public/avatar/hero (stessa scala per
 * tutti, così le altezze restano vere); `delay` scagliona i passi.
 */
const FIGURES: { id: CastId; ratio: number; delay: number }[] = [
  { id: "solarTech", ratio: 326 / 900, delay: 500 },
  { id: "aiDev", ratio: 344 / 900, delay: 150 },
  { id: "dataAnalyst", ratio: 362 / 900, delay: 850 },
];

/** Sovrapposizione per lato tra figure vicine e larghezza della scena, in pixel dei file (alti 900). */
const OVERLAP = 40;
const STAGE_W = FIGURES.reduce((w, f) => w + f.ratio * 900, 0) - 4 * OVERLAP;

/** Posizione nella sequenza d'ingresso CSS (vedi globals.css). */
const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function HeroAnimated() {
  const t = useTranslations();

  return (
    <header
      className="relative overflow-x-clip px-6 max-w-7xl mx-auto pt-10 md:pt-16 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center"
    >
      <div className="lg:col-span-7">
        <p
          data-hero-fade
          style={order(0)}
          className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-5"
        >
          {t("hero.badge")}
        </p>
        <h1 className="text-5xl md:text-7xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter leading-[0.95]">
          <span className="block overflow-hidden pb-[0.08em]">
            <span data-hero-line className="block" style={order(0)}>
              {t("hero.title")}
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.08em]">
            <span data-hero-line className="block text-primary" style={order(1)}>
              {t("hero.titleAccent")}
            </span>
          </span>
        </h1>
        <p
          data-hero-fade
          style={order(1)}
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
          style={{ ...order(2), aspectRatio: `${STAGE_W} / 900` }}
          className="relative flex w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[460px] items-end justify-center"
        >
          <span
            aria-hidden="true"
            className="absolute -bottom-[3%] left-1/2 h-[9%] w-[105%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(150_46_22/0.22),rgb(150_46_22/0.08)_60%,transparent)]"
          />
          {FIGURES.map((f, i) => (
            <div
              key={f.id}
              aria-hidden="true"
              className={`relative h-full shrink-0 ${i === 1 ? "z-10" : ""}`}
              style={{ marginInline: `${(-OVERLAP / STAGE_W) * 100}%` }}
            >
              <HeroWalker
                id={f.id}
                ratio={f.ratio}
                delay={f.delay}
                preload={i === 1}
                sizes="(min-width: 1024px) 220px, 30vw"
              />
            </div>
          ))}
        </div>
        <div data-hero-fade style={order(4)} className="mt-6 text-center">
          <p className="text-sm text-on-surface-variant">{t("hero.futureLabel")}</p>
          <ul className="mt-1 flex flex-wrap justify-center gap-x-5 gap-y-1 font-[var(--font-plus-jakarta)] font-bold text-lg text-secondary">
            {FIGURES.map((f) => (
              <li key={f.id}>{t(`hero.futures.${f.id}`)}</li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
