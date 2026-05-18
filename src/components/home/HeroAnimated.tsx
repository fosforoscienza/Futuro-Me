"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";

export function HeroAnimated() {
  const t = useTranslations();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.set(
        "[data-hero-anim]",
        { opacity: 0, y: 24 }
      );
      gsap.set("[data-hero-accent]", { opacity: 0, y: 24, scale: 0.92 });
      gsap.set("[data-hero-blob]", { opacity: 0, scale: 0.6 });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out", duration: 0.9 },
      });

      tl.to("[data-hero-blob]", {
        opacity: 1,
        scale: 1,
        duration: 1.4,
        ease: "power2.out",
      })
        .to(
          "[data-hero-anim='badge']",
          { opacity: 1, y: 0, duration: 0.6 },
          "-=1.1"
        )
        .to(
          "[data-hero-anim='title']",
          { opacity: 1, y: 0 },
          "-=0.4"
        )
        .to(
          "[data-hero-accent]",
          { opacity: 1, y: 0, scale: 1, duration: 1, ease: "back.out(1.4)" },
          "-=0.55"
        )
        .to(
          "[data-hero-anim='subtitle']",
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.6"
        )
        .to(
          "[data-hero-anim='cta']",
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 },
          "-=0.4"
        );

      gsap.to("[data-hero-blob]", {
        x: "+=30",
        y: "+=20",
        duration: 6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    },
    { scope: root }
  );

  return (
    <header
      ref={root}
      className="relative px-6 max-w-7xl mx-auto pt-12 pb-20 overflow-hidden"
    >
      <div
        data-hero-blob
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-primary/30 to-tertiary-container/40 blur-3xl"
      />
      <p
        data-hero-anim="badge"
        className="relative text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4"
        style={{ opacity: 0 }}
      >
        {t("hero.badge")}
      </p>
      <h1
        className="relative text-5xl md:text-7xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter max-w-3xl leading-[0.9]"
      >
        <span data-hero-anim="title" className="inline-block" style={{ opacity: 0 }}>
          {t("hero.title")}
        </span>{" "}
        <span
          data-hero-accent
          className="inline-block text-primary"
          style={{ opacity: 0 }}
        >
          {t("hero.titleAccent")}
        </span>
      </h1>
      <p
        data-hero-anim="subtitle"
        className="relative mt-8 text-xl text-on-surface-variant max-w-2xl leading-relaxed"
        style={{ opacity: 0 }}
      >
        {t("hero.subtitle")}
      </p>
      <div className="relative mt-10 flex flex-wrap gap-4">
        <Link
          data-hero-anim="cta"
          href="/mercato-lavoro"
          className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-[1.5rem] font-bold inline-flex items-center gap-2 hover:scale-105 transition-transform"
          style={{ opacity: 0 }}
        >
          {t("home.exploreMarket")} <ArrowRight size={18} />
        </Link>
        <Link
          data-hero-anim="cta"
          href="/progetto"
          className="bg-surface-container-highest text-on-surface px-8 py-3 rounded-[1.5rem] font-bold inline-flex items-center gap-2 hover:scale-105 transition-transform"
          style={{ opacity: 0 }}
        >
          {t("home.discoverProject")}
        </Link>
      </div>
    </header>
  );
}
