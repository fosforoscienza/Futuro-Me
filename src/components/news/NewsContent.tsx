"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { newsArticles } from "@/lib/news-data";

const categories = ["all", "ai", "jobs", "training", "skills"] as const;

export function NewsContent() {
  const t = useTranslations("news");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered =
    activeCategory === "all"
      ? newsArticles
      : newsArticles.filter((n) => n.category === activeCategory);

  return (
    <div className="pb-24 md:pb-12">
      {/* Header */}
      <header className="px-6 max-w-7xl mx-auto pt-12 pb-16">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-primary" />
          <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs">
            Science Snack
          </p>
        </div>
        <h1 className="text-5xl md:text-7xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter max-w-3xl leading-[0.9]">
          {t("title")}
        </h1>
        <p className="mt-8 text-xl text-on-surface-variant max-w-2xl leading-relaxed">
          {t("subtitle")}
        </p>
      </header>

      {/* Category Filter */}
      <section className="max-w-7xl mx-auto px-6 mb-10">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                activeCategory === cat
                  ? "bg-secondary text-white"
                  : "bg-surface-container-highest text-on-surface hover:bg-secondary/10"
              }`}
            >
              {t(`categories.${cat}`)}
            </button>
          ))}
        </div>
      </section>

      {/* News Grid */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((news) => (
            <Link
              key={news.slug}
              href={`/news/${news.slug}` as "/news/[slug]"}
              className="bg-surface-container-lowest p-8 rounded-[1.5rem] hover:translate-y-[-4px] transition-transform group block"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-tertiary-container text-on-tertiary-container text-xs font-bold px-3 py-1 rounded-full">
                  {t(`categories.${news.category}`)}
                </span>
                <span className="text-xs text-on-surface-variant">
                  {new Date(news.date).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h3 className="font-[var(--font-plus-jakarta)] font-bold text-xl text-secondary mb-3 group-hover:text-primary transition-colors">
                {news.title}
              </h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                {news.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-outline">
                  {t("source")}: {news.source}
                </span>
                <span className="text-primary font-bold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  {t("readMore")} <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
