"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useState } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { NewsArticle } from "@/lib/news-data";
import { NewsImage } from "./NewsImage";

const categories = ["all", "ai", "jobs", "training", "skills"] as const;

const href = (news: NewsArticle) => `/news/${news.slug}` as "/news/[slug]";

function formatNewsDate(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale === "en" ? "en-GB" : "it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Meta({ news }: { news: NewsArticle }) {
  const t = useTranslations("news");
  const locale = useLocale();
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="bg-tertiary-container text-on-tertiary-container text-xs font-bold px-3 py-1 rounded-full">
        {t(`categories.${news.category}`)}
      </span>
      <span className="text-xs text-on-surface-variant">{formatNewsDate(news.date, locale)}</span>
    </div>
  );
}

function Footer({ news }: { news: NewsArticle }) {
  const t = useTranslations("news");
  return (
    <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
      <a
        href={news.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-outline hover:text-primary hover:underline inline-flex items-center gap-1 min-w-0"
      >
        {t("source")}: {news.source}
        <ExternalLink size={12} className="shrink-0" aria-hidden />
      </a>
      <Link
        href={href(news)}
        className="text-primary font-bold text-sm inline-flex items-center gap-1 hover:gap-2 transition-all"
      >
        {t("readMore")} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export function NewsContent({ articles }: { articles: NewsArticle[] }) {
  const t = useTranslations("news");
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered =
    activeCategory === "all"
      ? articles
      : articles.filter((n) => n.category === activeCategory);

  // Le più recenti con foto vanno in copertina e in evidenza.
  const withPhoto = filtered.filter((n) => n.imageUrl);
  const cover = withPhoto[0] ?? filtered[0];
  const highlights = (withPhoto.length > 1 ? withPhoto : filtered)
    .filter((n) => n !== cover)
    .slice(0, 4);
  const rest = filtered.filter((n) => n !== cover && !highlights.includes(n));

  const formatDate = (date: string) => formatNewsDate(date, locale);

  return (
    <div className="pb-24 md:pb-12">
      {/* Header */}
      <header className="px-6 max-w-7xl mx-auto pt-12 pb-16">
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

      {/* Magazine: copertina, in evidenza, mosaico (come crivellini.it) */}
      <section className="max-w-7xl mx-auto px-6">
        {cover && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Copertina */}
            <article className="lg:col-span-2 bg-surface-container-lowest rounded-[1.5rem] overflow-hidden group flex flex-col">
              <Link href={href(cover)} tabIndex={-1} aria-hidden>
                <NewsImage
                  src={cover.imageUrl}
                  alt=""
                  category={cover.category}
                  credit={cover.imageCredit ?? cover.source}
                  className="aspect-[16/9] w-full"
                />
              </Link>
              <div className="p-8 flex flex-col flex-1">
                <Meta news={cover} />
                <h2 className="font-[var(--font-plus-jakarta)] font-extrabold text-3xl md:text-4xl text-secondary tracking-tight leading-tight mb-4 group-hover:text-primary transition-colors">
                  <Link href={href(cover)}>{cover.title}</Link>
                </h2>
                <p className="text-on-surface-variant leading-relaxed mb-6">
                  {cover.excerpt}
                </p>
                <Footer news={cover} />
              </div>
            </article>

            {/* In evidenza */}
            {highlights.length > 0 && (
              <aside aria-labelledby="in-evidenza" className="flex flex-col gap-3">
                <h2
                  id="in-evidenza"
                  className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-1"
                >
                  {t("highlights")}
                </h2>
                {highlights.map((news) => (
                  <Link
                    key={news.slug}
                    href={href(news)}
                    className="bg-surface-container-lowest rounded-2xl p-3 flex gap-4 items-center hover:translate-y-[-2px] transition-transform group"
                  >
                    <NewsImage
                      src={news.imageUrl}
                      alt=""
                      category={news.category}
                      showCredit={false}
                      className="w-28 h-20 shrink-0 rounded-xl"
                    />
                    <div className="min-w-0">
                      <h3 className="font-[var(--font-plus-jakarta)] font-bold text-secondary leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                        {news.title}
                      </h3>
                      <p className="text-xs text-outline mt-1 truncate">
                        {formatDate(news.date)} · {news.source}
                      </p>
                    </div>
                  </Link>
                ))}
              </aside>
            )}
          </div>
        )}

        {/* Mosaico */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((news) => (
            <article
              key={news.slug}
              className="bg-surface-container-lowest rounded-[1.5rem] overflow-hidden hover:translate-y-[-4px] transition-transform group flex flex-col"
            >
              <Link href={href(news)} tabIndex={-1} aria-hidden>
                <NewsImage
                  src={news.imageUrl}
                  alt=""
                  category={news.category}
                  credit={news.imageCredit ?? news.source}
                  className="aspect-[16/9] w-full"
                />
              </Link>
              <div className="p-6 flex flex-col flex-1">
                <Meta news={news} />
                <h3 className="font-[var(--font-plus-jakarta)] font-bold text-lg text-secondary leading-snug mb-3 group-hover:text-primary transition-colors">
                  <Link href={href(news)}>{news.title}</Link>
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-4 line-clamp-3">
                  {news.excerpt}
                </p>
                <Footer news={news} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
