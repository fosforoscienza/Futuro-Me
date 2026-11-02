"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { AvatarCanvas } from "@/components/avatar/AvatarCanvas";
import { DEFAULT_SELECTION, fitToBody, type AvatarSelection } from "@/lib/avatar/config";

/** Tre "futuri me" d'esempio, costruiti con le stesse opzioni del configuratore. */
const FUTURES: { key: "doctor" | "musician" | "chef"; selection: AvatarSelection }[] = [
  {
    key: "doctor",
    selection: fitToBody({
      ...DEFAULT_SELECTION,
      corpo: "F",
      pelle: "marrone",
      capelli: "treccine",
      coloreCapelli: "neri",
      occhiali: "tondi",
      torso: "camice",
      gambe: "eleganti",
      scarpe: "eleganti",
      oggetti: ["stetoscopio"],
      ambiente: "ospedale",
    }),
  },
  {
    key: "musician",
    selection: fitToBody({
      ...DEFAULT_SELECTION,
      corpo: "M",
      pelle: "rosa",
      capelli: "ricci_medi",
      coloreCapelli: "castano_chiaro",
      torso: "tshirt_rock",
      gambe: "jeans",
      scarpe: "jordan",
      oggetti: ["chitarra"],
      ambiente: "palco",
    }),
  },
  {
    key: "chef",
    selection: fitToBody({
      ...DEFAULT_SELECTION,
      corpo: "F",
      pelle: "bianco_pallido",
      capelli: "coda",
      coloreCapelli: "rosso",
      cappello: "cuoco",
      torso: "cuoco",
      gambe: "cuoco",
      scarpe: "antinfortunistiche",
      ambiente: "cucina",
    }),
  },
];

/** Posizioni della pila: davanti, dietro a destra, dietro a sinistra. */
const SLOTS = [
  { xPercent: 0, rotation: 0, scale: 1, zIndex: 3 },
  { xPercent: 11, rotation: 5, scale: 0.9, zIndex: 2 },
  { xPercent: -11, rotation: -5, scale: 0.82, zIndex: 1 },
];

const HOLD = 3.2;

/** Posizione nella sequenza d'ingresso CSS (vedi globals.css). */
const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function HeroAnimated() {
  const t = useTranslations();
  const root = useRef<HTMLElement>(null);
  const cycle = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-hero-card]");
      const captions = gsap.utils.toArray<HTMLElement>("[data-hero-caption]");
      cards.forEach((card, i) => gsap.set(card, SLOTS[i]));
      gsap.set(captions, { yPercent: (i) => (i === 0 ? 0 : 100), opacity: (i) => (i === 0 ? 1 : 0) });

      const mm = gsap.matchMedia();

      // L'ingresso è in CSS (globals.css); qui solo il ciclo dei futuri possibili:
      // la carta davanti esce a sinistra e torna in fondo alla pila
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ repeat: -1, delay: 1.2 });
        cards.forEach((_, k) => {
          const front = cards[k];
          const mid = cards[(k + 1) % 3];
          const back = cards[(k + 2) % 3];
          const at = `step${k}`;
          tl.addLabel(at, `+=${HOLD}`)
            .set(front, { zIndex: 4 }, at)
            .to(front, { xPercent: -55, rotation: -14, opacity: 0, duration: 0.55, ease: "power2.in" }, at)
            .to(mid, { ...SLOTS[0], duration: 0.8, ease: "power3.out" }, `${at}+=0.2`)
            .to(back, { ...SLOTS[1], duration: 0.8, ease: "power3.out" }, `${at}+=0.28`)
            .set(front, { ...SLOTS[2], opacity: 0 }, `${at}+=0.6`)
            .to(front, { opacity: 1, duration: 0.5, ease: "power1.out" }, `${at}+=0.6`)
            .to(captions[k], { yPercent: -100, opacity: 0, duration: 0.45, ease: "power2.in" }, at)
            .fromTo(
              captions[(k + 1) % 3],
              { yPercent: 100, opacity: 0 },
              { yPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
              `${at}+=0.3`
            );
        });
        cycle.current = tl;
        return () => {
          cycle.current = null;
        };
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <header
      ref={root}
      className="relative overflow-x-clip px-6 max-w-7xl mx-auto pt-10 md:pt-16 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-8 items-center"
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

      <div
        className="lg:col-span-5 flex flex-col items-center"
        onMouseEnter={() => cycle.current?.pause()}
        onMouseLeave={() => cycle.current?.resume()}
      >
        <div
          data-hero-stage
          aria-hidden="true"
          className="relative w-full max-w-[260px] sm:max-w-[320px] lg:max-w-[330px] xl:max-w-[360px] aspect-[848/1264]"
        >
          <div className="absolute -inset-x-10 inset-y-8 rounded-[2rem] bg-secondary-container/45 -rotate-3" />
          {FUTURES.map((future) => (
            <div
              key={future.key}
              data-hero-card
              className="absolute inset-0 will-change-transform rounded-[1.5rem] shadow-[0_28px_60px_-24px_rgba(150,46,22,0.45)]"
            >
              <AvatarCanvas selection={future.selection} className="w-full h-full" />
            </div>
          ))}
        </div>
        <div data-hero-fade className="mt-8 text-center" style={order(4)}>
          <p className="text-sm text-on-surface-variant">{t("hero.futureLabel")}</p>
          <div className="relative h-8 overflow-hidden min-w-[16rem]">
            {FUTURES.map((future) => (
              <p
                key={future.key}
                data-hero-caption
                className="absolute inset-0 font-[var(--font-plus-jakarta)] font-bold text-xl text-secondary"
              >
                {t(`hero.futures.${future.key}`)}
              </p>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
