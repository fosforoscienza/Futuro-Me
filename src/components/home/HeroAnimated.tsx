"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { CastAvatar } from "@/components/avatar/CastAvatar";
import type { CastId } from "@/lib/avatar/cast";

/**
 * I tre "futuri me" dell'hero, dal fondo al primo piano. `depth` regola quanto
 * seguono il puntatore: chi è davanti si sposta di più.
 */
const FIGURES: { id: CastId; depth: number; className: string }[] = [
  { id: "solarTech", depth: 0.4, className: "left-[-6%] bottom-[9%] h-[70%]" },
  { id: "dataAnalyst", depth: 0.6, className: "left-[50%] bottom-[11%] h-[68%]" },
  { id: "aiDev", depth: 1, className: "left-[16%] bottom-0 h-[90%]" },
];

/** Posizione nella sequenza d'ingresso CSS (vedi globals.css). */
const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function HeroAnimated() {
  const t = useTranslations();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // L'ingresso è in CSS (globals.css); qui solo il respiro della figura statica
      // e la profondità che segue il puntatore
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to("[data-hero-breathe]", {
          scaleY: 1.012,
          transformOrigin: "50% 100%",
          duration: 2.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });

      mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
        const header = root.current!;
        const layers = gsap.utils.toArray<HTMLElement>("[data-hero-depth]").map((el) => ({
          depth: Number(el.dataset.heroDepth),
          x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3.out" }),
        }));
        const move = (e: PointerEvent) => {
          const r = header.getBoundingClientRect();
          const dx = (e.clientX - r.left) / r.width - 0.5;
          const dy = (e.clientY - r.top) / r.height - 0.5;
          for (const l of layers) {
            l.x(dx * 18 * l.depth);
            l.y(dy * 10 * l.depth);
          }
        };
        header.addEventListener("pointermove", move);
        return () => header.removeEventListener("pointermove", move);
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
          data-hero-stage
          className="relative w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[460px] aspect-[460/520]"
        >
          {FIGURES.map((f, i) => (
            <div
              key={f.id}
              data-hero-depth={f.depth}
              className={`absolute ${f.className}`}
            >
              <div data-hero-figure style={order(i)} className="h-full">
                <div data-hero-breathe={f.id === "solarTech" ? "" : undefined} className="h-full">
                  <CastAvatar
                    id={f.id}
                    preload={f.id === "aiDev"}
                    sizes="(min-width: 1024px) 300px, 45vw"
                    className="h-full"
                  />
                </div>
              </div>
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
