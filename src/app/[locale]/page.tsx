import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  FolderArchive,
  Users,
  School,
  Clock,
  GraduationCap,
} from "lucide-react";
import { newsArticles } from "@/lib/news-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const meta = messages.meta as Record<string, string>;
  return { title: meta.title, description: meta.description };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations();

  const stats = [
    { value: "1.200", label: t("home.stats.students"), icon: Users },
    { value: "4", label: t("home.stats.schools"), icon: School },
    { value: "192", label: t("home.stats.hours"), icon: Clock },
    { value: "2", label: t("home.stats.universities"), icon: GraduationCap },
  ];

  const sections = [
    {
      title: t("home.marketTitle"),
      desc: t("home.marketDesc"),
      href: "/mercato-lavoro" as const,
      cta: t("home.exploreMarket"),
      bg: "bg-secondary",
      text: "text-white",
      icon: BarChart3,
    },
    {
      title: t("home.projectTitle"),
      desc: t("home.projectDesc"),
      href: "/progetto" as const,
      cta: t("home.discoverProject"),
      bg: "bg-primary-container",
      text: "text-on-primary-container",
      icon: BookOpen,
    },
    {
      title: t("home.archiveTitle"),
      desc: t("home.archiveDesc"),
      href: "/archivio" as const,
      cta: t("home.archiveTitle"),
      bg: "bg-surface-container-high",
      text: "text-secondary",
      icon: FolderArchive,
    },
  ];

  return (
    <div className="pb-24 md:pb-12">
      {/* Hero */}
      <header className="px-6 max-w-7xl mx-auto pt-12 pb-20">
        <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4">
          {t("hero.badge")}
        </p>
        <h1 className="text-5xl md:text-7xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter max-w-3xl leading-[0.9]">
          {t("hero.title")}{" "}
          <span className="text-primary">{t("hero.titleAccent")}</span>
        </h1>
        <p className="mt-8 text-xl text-on-surface-variant max-w-2xl leading-relaxed">
          {t("hero.subtitle")}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/mercato-lavoro"
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-[1.5rem] font-bold inline-flex items-center gap-2 hover:scale-105 transition-transform"
          >
            {t("home.exploreMarket")} <ArrowRight size={18} />
          </Link>
          <Link
            href="/progetto"
            className="bg-surface-container-highest text-on-surface px-8 py-3 rounded-[1.5rem] font-bold inline-flex items-center gap-2 hover:scale-105 transition-transform"
          >
            {t("home.discoverProject")}
          </Link>
        </div>
      </header>

      {/* Stats */}
      <section className="bg-surface-container-low py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary-container rounded-xl mb-3">
                  <Icon size={24} className="text-on-secondary-container" />
                </div>
                <p className="text-3xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary">
                  {stat.value}
                </p>
                <p className="text-sm text-on-surface-variant mt-1">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Sections */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-[var(--font-plus-jakarta)] font-bold text-secondary mb-10">
          {t("home.featuredSections")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className={`${section.bg} ${section.text} p-8 rounded-[1.5rem] group relative overflow-hidden transition-transform hover:scale-[1.02]`}
              >
                <div className="relative z-10">
                  <h3 className="text-2xl font-[var(--font-plus-jakarta)] font-bold mb-3">
                    {section.title}
                  </h3>
                  <p className="text-sm opacity-80 leading-relaxed mb-6">
                    {section.desc}
                  </p>
                  <span className="inline-flex items-center gap-2 font-bold text-sm">
                    {section.cta} <ArrowRight size={16} />
                  </span>
                </div>
                <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Icon size={120} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Latest News Preview */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-[var(--font-plus-jakarta)] font-bold text-secondary">
            {t("home.latestNews")}
          </h2>
          <Link
            href="/news"
            className="text-primary font-bold text-sm inline-flex items-center gap-1 hover:gap-2 transition-all"
          >
            {t("home.viewAllNews")} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsArticles.slice(0, 3).map((news) => (
            <Link
              key={news.slug}
              href={`/news/${news.slug}` as "/news/[slug]"}
              className="bg-surface-container-lowest p-6 rounded-[1.5rem] hover:translate-y-[-4px] transition-transform group block"
            >
              <span className="bg-tertiary-container text-on-tertiary-container text-xs font-bold px-3 py-1 rounded-full">
                {t(`news.categories.${news.category}`)}
              </span>
              <h3 className="font-[var(--font-plus-jakarta)] font-bold text-lg text-secondary mt-4 mb-2 group-hover:text-primary transition-colors">
                {news.title}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {new Date(news.date).toLocaleDateString("it-IT", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
