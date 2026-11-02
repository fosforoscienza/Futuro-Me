import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { NewsArticle } from "@/lib/news-data";
import { getAllNews } from "@/lib/news/repository";
import { HeroAnimated } from "@/components/home/HeroAnimated";
import { HomeMotion } from "@/components/home/HomeMotion";
import { FIRST_PLENARY, plenaryStatus, type PlenarySlot } from "@/lib/plenarie";
import { NewsImage } from "@/components/news/NewsImage";

// Ultime news dal job settimanale: al massimo un'ora di ritardo, e la home
// viene rigenerata subito dopo ogni pubblicazione.
export const revalidate = 3600;

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

  const latestNews = (await getAllNews(locale)).slice(0, 3);
  return <HomeContent latestNews={latestNews} locale={locale} />;
}

function HomeContent({
  latestNews,
  locale,
}: {
  latestNews: NewsArticle[];
  locale: string;
}) {
  const t = useTranslations();
  const dateLocale = locale === "en" ? "en-GB" : "it-IT";

  const stats = [
    { value: 1200, label: t("home.stats.students") },
    { value: 4, label: t("home.stats.schools") },
    { value: 192, label: t("home.stats.hours") },
    { value: 2, label: t("home.stats.universities") },
  ];

  const sections = [
    { title: t("home.marketTitle"), desc: t("home.marketDesc"), href: "/mercato-lavoro" as const },
    { title: t("home.projectTitle"), desc: t("home.projectDesc"), href: "/progetto" as const },
    { title: t("home.archiveTitle"), desc: t("home.archiveDesc"), href: "/archivio" as const },
  ];

  const status = plenaryStatus(FIRST_PLENARY.map((p) => p.date));
  const day = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString(dateLocale, { timeZone: "Europe/Rome", ...opts });
  const slotText = (s: PlenarySlot) =>
    s.group
      ? t("home.plenary.group", { group: s.group, year: s.year })
      : s.classes
        ? t("home.plenary.classes", { count: s.classes, year: s.year })
        : t("home.plenary.yearOnly", { year: s.year });

  const [lead, ...rest] = latestNews;
  const newsDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="pb-24 md:pb-12">
      <HeroAnimated />

      <HomeMotion locale={locale}>
        {/* Numeri: grandi, senza icone, separati da filetti */}
        <section className="border-y border-outline-variant/60 bg-surface-container-low">
          <div data-hm-group className="max-w-7xl mx-auto px-6 py-14 md:py-20">
            <h2 className="sr-only">
              {t("home.numbersTitle")}
            </h2>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-y-10 md:divide-x md:divide-outline-variant/60">
              {stats.map((stat) => (
                <div key={stat.label} data-hm-rise className="flex flex-col-reverse md:px-8 first:md:pl-0">
                  <dt className="mt-2 text-sm md:text-base text-on-surface-variant">{stat.label}</dt>
                  <dd className="font-[var(--font-plus-jakarta)] font-extrabold text-secondary text-5xl md:text-7xl tracking-tighter tabular-nums">
                    <span data-hm-count={stat.value}>
                      {new Intl.NumberFormat(dateLocale).format(stat.value)}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* La prima Plenaria: titolo fermo a sinistra, tappe che si accendono scorrendo */}
        <section className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div data-hm-group className="lg:col-span-4 lg:sticky lg:top-28 self-start">
            <h2
              data-hm-title
              className="text-4xl md:text-6xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter leading-[1.02]"
            >
              {t("home.plenary.title")}
            </h2>
            <p data-hm-rise className="mt-6 text-on-surface-variant leading-relaxed max-w-[38ch]">
              {t("home.plenary.intro")}
            </p>
          </div>

          <ol className="relative overflow-x-clip lg:col-span-8 pl-10 md:pl-14">
            <span aria-hidden="true" className="absolute left-[11px] md:left-[15px] top-2 bottom-2 w-px bg-outline-variant" />
            <span
              data-hm-track
              aria-hidden="true"
              className="absolute left-[11px] md:left-[15px] top-2 bottom-2 w-px bg-primary origin-top"
            />
            {FIRST_PLENARY.map((p, i) => {
              const st = status[i];
              return (
                <li
                  key={p.date}
                  data-hm-stop
                  className={`relative pb-14 last:pb-0 ${st === "past" ? "opacity-55" : ""}`}
                >
                  <span
                    data-hm-dot
                    aria-hidden="true"
                    className={`absolute -left-10 md:-left-14 top-3 size-[23px] md:size-[31px] rounded-full border-4 border-background ${
                      st === "past" || st === "today" ? "bg-primary" : "bg-outline-variant"
                    }`}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-[11rem_1fr] gap-x-8 gap-y-3">
                    <p data-hm-rise-stop className="font-[var(--font-plus-jakarta)] text-secondary leading-none">
                      <span className="block text-6xl md:text-7xl font-extrabold tracking-tighter tabular-nums">
                        {day(p.date, { day: "numeric" })}
                        <span className="ml-2 text-2xl md:text-3xl tracking-tight">
                          {day(p.date, { month: "short" }).replace(".", "")}
                        </span>
                      </span>
                      <span className="block mt-2 text-sm font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                        {day(p.date, { weekday: "long" })}
                      </span>
                    </p>
                    <div>
                      <h3
                        data-hm-rise-stop
                        className="flex flex-wrap items-center gap-3 text-2xl md:text-3xl font-[var(--font-plus-jakarta)] font-bold text-secondary"
                      >
                        {p.school}
                        {(st === "next" || st === "today") && (
                          <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-on-primary">
                            {t(`home.plenary.status.${st}`)}
                          </span>
                        )}
                        {st === "past" && (
                          <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface-variant">
                            {t("home.plenary.status.past")}
                          </span>
                        )}
                      </h3>
                      {p.place && (
                        <p data-hm-rise-stop className="mt-1 text-on-surface-variant">
                          {t("home.plenary.place", { place: p.place })}
                        </p>
                      )}
                      <ul data-hm-rise-stop className="mt-4 space-y-2">
                        {p.slots.map((s) => (
                          <li key={s.from} className="flex flex-wrap items-baseline gap-x-4">
                            <span className="font-bold text-secondary tabular-nums">
                              {s.from}-{s.to}
                            </span>
                            <span className="text-on-surface-variant">{slotText(s)}</span>
                          </li>
                        ))}
                      </ul>
                      {p.totalClasses && (
                        <p data-hm-rise-stop className="mt-2 text-sm text-outline">
                          {t("home.plenary.total", { count: p.totalClasses })}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Esplora: righe tipografiche al posto delle tre card uguali */}
        <section className="max-w-7xl mx-auto px-6 pb-20 md:pb-28">
          <div data-hm-group>
            <h2
              data-hm-title
              className="text-4xl md:text-6xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter mb-10"
            >
              {t("home.featuredSections")}
            </h2>
            <ul className="border-t border-outline-variant">
              {sections.map((section) => (
                <li key={section.href} data-hm-rise className="border-b border-outline-variant">
                  <Link
                    href={section.href}
                    data-hm-row
                    className="group grid grid-cols-[1fr_auto] md:grid-cols-[1.1fr_1fr_auto] items-center gap-x-8 gap-y-2 py-8 md:py-10"
                  >
                    <span
                      data-hm-row-title
                      className="text-3xl md:text-5xl font-[var(--font-plus-jakarta)] font-bold text-secondary tracking-tight transition-colors group-hover:text-primary"
                    >
                      {section.title}
                    </span>
                    <span className="col-span-2 md:col-span-1 row-start-2 md:row-start-auto text-on-surface-variant leading-relaxed max-w-[48ch]">
                      {section.desc}
                    </span>
                    <span
                      data-hm-row-arrow
                      className="row-start-1 col-start-2 md:col-start-3 inline-flex size-12 md:size-14 items-center justify-center rounded-full border border-outline-variant text-secondary transition-colors group-hover:bg-primary group-hover:border-primary group-hover:text-on-primary"
                    >
                      <ArrowUpRight size={22} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Ultime news: una in grande, due accanto */}
        {lead && (
          <section className="max-w-7xl mx-auto px-6 pb-20">
            <div data-hm-group>
              <div className="flex items-end justify-between gap-6 mb-10">
                <h2
                  data-hm-title
                  className="text-4xl md:text-6xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter"
                >
                  {t("home.latestNews")}
                </h2>
                <Link
                  href="/news"
                  data-hm-rise
                  className="shrink-0 text-primary font-bold inline-flex items-center gap-1 hover:gap-2 transition-all"
                >
                  {t("home.viewAllNews")} <ArrowRight size={18} />
                </Link>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Link
                  href={`/news/${lead.slug}` as "/news/[slug]"}
                  className="group lg:col-span-7 block"
                >
                  <div data-hm-clip className="overflow-hidden rounded-[1.5rem]">
                    <NewsImage
                      src={lead.imageUrl}
                      alt=""
                      category={lead.category}
                      credit={lead.imageCredit ?? lead.source}
                      className="aspect-[16/10] w-full transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div data-hm-rise className="pt-6">
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                      {t(`news.categories.${lead.category}`)}
                    </span>
                    <h3 className="mt-3 text-2xl md:text-4xl font-[var(--font-plus-jakarta)] font-bold text-secondary tracking-tight group-hover:text-primary transition-colors">
                      {lead.title}
                    </h3>
                    <p className="mt-3 text-sm text-outline">
                      {newsDate(lead.date)} · {t("news.source")}: {lead.source}
                    </p>
                  </div>
                </Link>
                <div className="lg:col-span-5 grid grid-cols-1 gap-6 content-start">
                  {rest.map((news) => (
                    <Link
                      key={news.slug}
                      href={`/news/${news.slug}` as "/news/[slug]"}
                      data-hm-rise
                      className="group grid grid-cols-[8rem_1fr] sm:grid-cols-[10rem_1fr] gap-5 items-start"
                    >
                      <div className="overflow-hidden rounded-2xl">
                        <NewsImage
                          src={news.imageUrl}
                          alt=""
                          category={news.category}
                          credit={news.imageCredit ?? news.source}
                          className="aspect-square w-full transition-transform duration-700 group-hover:scale-[1.05]"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                          {t(`news.categories.${news.category}`)}
                        </span>
                        <h3 className="mt-2 font-[var(--font-plus-jakarta)] font-bold text-lg text-secondary leading-snug group-hover:text-primary transition-colors">
                          {news.title}
                        </h3>
                        <p className="mt-2 text-xs text-outline">{newsDate(news.date)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </HomeMotion>
    </div>
  );
}
