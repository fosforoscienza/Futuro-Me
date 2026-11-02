import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowDownRight,
  BarChart3,
  Code,
  Handshake,
  HeartPulse,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { CastAvatar } from "@/components/avatar/CastAvatar";
import { MarketMotion } from "@/components/market/MarketMotion";
import { Num } from "@/components/market/Num";
import { formatNumber } from "@/components/market/format";
import {
  AI_STEPS,
  ANCONA,
  CORE_SKILLS,
  ITALY_SKILLS_CHANGE,
  JOBS_BALANCE,
  JOBS_TOTAL,
  NEET,
  SOURCE_URLS,
  TOP_JOBS,
  UNEMPLOYMENT,
  type JobKey,
  type SourceId,
} from "@/components/market/data";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "market" });
  return { title: t("title"), description: t("subtitle") };
}

const JOB_ICONS: Record<JobKey, typeof Stethoscope> = {
  healthTech: Stethoscope,
  management: BarChart3,
  marketTech: Handshake,
  engineers: Wrench,
  doctors: HeartPulse,
  appDev: Code,
};

const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function MercatoLavoroPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "market" });
  const fmt = (v: number, dec = 0) => formatNumber(v, locale, dec);

  const source = (id: SourceId, className = "") => (
    <p className={`text-xs leading-relaxed ${className}`}>
      {t("sourceLabel")}:{" "}
      <a
        href={SOURCE_URLS[id]}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-primary"
      >
        {t(`sources.${id}`)}
      </a>
    </p>
  );

  const maxJob = Math.max(...TOP_JOBS.map((j) => j.high));

  return (
    <MarketMotion locale={locale} className="overflow-x-clip pb-24 md:pb-12">
      {/* Hero: titolo e tre numeri chiave, ingresso in CSS come nella home */}
      <header className="max-w-7xl mx-auto px-6 pt-8 md:pt-14 pb-20 md:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-end">
        <div className="lg:col-span-7" data-drift data-speed="-6">
          <p
            data-hero-fade
            style={order(0)}
            className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-5"
          >
            {t("eyebrow")}
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter leading-[0.95]">
            <span className="block overflow-hidden pb-[0.08em]">
              <span data-hero-line className="block" style={order(0)}>
                {t("titleLine1")}
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <span data-hero-line className="block text-primary" style={order(1)}>
                {t("titleLine2")}
              </span>
            </span>
          </h1>
          <p
            data-hero-fade
            style={order(1)}
            className="mt-7 text-lg md:text-xl text-on-surface-variant max-w-[36rem] leading-relaxed"
          >
            {t("subtitle")}
          </p>
        </div>

        <div className="lg:col-span-5" data-drift data-speed="-18">
          <ul className="divide-y divide-outline-variant/60 border-y border-outline-variant/60">
            {(
              [
                { href: "#professioni", value: `${fmt(JOBS_TOTAL.high / 1e6, 1)} ${t("million")}`, label: t("heroStats.total") },
                { href: "#intelligenza-artificiale", value: `+${fmt(JOBS_BALANCE.net)} ${t("million")}`, label: t("heroStats.net") },
                { href: "#marche", value: `${fmt(NEET.marche, 1)}%`, label: t("heroStats.neet") },
              ] as const
            ).map((stat, i) => (
              <li key={stat.href} data-hero-fade style={order(i + 2)}>
                <a
                  href={stat.href}
                  className="group grid grid-cols-[1fr_auto] items-center gap-x-4 py-5 transition-colors duration-200 hover:text-primary"
                >
                  <span>
                    <span className="block font-[var(--font-plus-jakarta)] font-extrabold text-3xl md:text-4xl text-secondary tracking-tight tabular-nums group-hover:text-primary transition-colors duration-200">
                      {stat.value}
                    </span>
                    <span className="block mt-1 text-sm text-on-surface-variant leading-snug">
                      {stat.label}
                    </span>
                  </span>
                  <ArrowDownRight
                    size={22}
                    className="text-outline transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:text-primary"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* Professioni più richieste (Excelsior) con il medico accanto alle professioni sanitarie */}
      <section
        id="professioni"
        className="relative scroll-mt-24 bg-surface-container-low rounded-t-[2.5rem] md:rounded-t-[3.5rem] pt-16 md:pt-24 pb-20 md:pb-28"
        data-group
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-x-10">
          <div className="md:col-span-8 lg:col-span-8">
            <h2 className="pr-28 md:pr-0 text-3xl md:text-5xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tight leading-[1.05]">
              <span className="block overflow-hidden pb-[0.06em]">
                <span data-line className="block">
                  {t("jobs.title")}
                </span>
              </span>
            </h2>
            <p data-rise className="pr-24 md:pr-0 mt-5 text-on-surface-variant max-w-[60ch] leading-relaxed">
              {t("jobs.desc", {
                low: fmt(JOBS_TOTAL.low / 1e6, 1),
                high: fmt(JOBS_TOTAL.high / 1e6, 1),
                replacementLow: fmt(JOBS_TOTAL.replacementLow),
                replacementHigh: fmt(JOBS_TOTAL.replacementHigh),
              })}
            </p>

            <div data-rise className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-on-surface-variant">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-[3px] bg-primary" />
                {t("jobs.low")}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-[3px] bg-primary-fixed-dim" />
                {t("jobs.high")}
              </span>
            </div>

            <ol className="mt-8 space-y-7">
              {TOP_JOBS.map((job, i) => {
                const Icon = JOB_ICONS[job.key];
                return (
                  <li key={job.key} data-rise className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 items-center">
                    <span className="row-span-2 self-start grid place-items-center h-11 w-11 rounded-xl bg-secondary-container text-on-secondary-container">
                      <Icon size={20} />
                    </span>
                    <span className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                      <span className="min-w-0 basis-[min(100%,26rem)] grow">
                        <span className="block font-[var(--font-plus-jakarta)] font-bold text-secondary leading-snug">
                          <span className="text-outline tabular-nums mr-2">{i + 1}.</span>
                          {t(`jobs.items.${job.key}`)}
                        </span>
                        <span className="block mt-0.5 text-xs text-on-surface-variant">
                          {t(`jobs.hints.${job.key}`)}
                        </span>
                      </span>
                      <span className="font-bold text-primary text-sm whitespace-nowrap">
                        <Num value={job.low} locale={locale} /> - <Num value={job.high} locale={locale} />
                      </span>
                    </span>
                    <span className="block h-3" style={{ width: `${(job.high / maxJob) * 100}%` }}>
                      <span data-bar className="flex h-full w-full origin-left overflow-hidden rounded-[3px]">
                        <span className="h-full bg-primary" style={{ width: `${(job.low / job.high) * 100}%` }} />
                        <span data-fade className="h-full flex-1 bg-primary-fixed-dim" />
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
            {source("excelsior", "mt-10 text-outline")}
          </div>

          {/* Il medico esce dal bordo destro e segue la pagina */}
          <div className="pointer-events-none absolute right-0 top-6 w-28 sm:w-36 md:static md:col-span-4 md:w-auto md:flex md:justify-end md:items-start md:pt-10">
            <div data-avatar data-side="right" className="translate-x-[18%] md:translate-x-[14%] lg:translate-x-[10%] w-full md:max-w-[300px] lg:max-w-[340px]">
              <div data-drift data-speed="-10">
                {/* specchiato: lo stetoscopio guarda verso il grafico */}
                <CastAvatar id="doctor" flip sizes="(min-width: 1024px) 340px, (min-width: 768px) 30vw, 144px" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impatto dell'AI (WEF): su desktop la scena si ferma e i dati scorrono un passo alla volta */}
      <section id="intelligenza-artificiale" className="scroll-mt-24">
        <div
          data-ai-stage
          className="group/stage relative max-w-7xl mx-auto px-6 py-20 md:py-28 group-data-[pinned]/stage:min-h-[100dvh] group-data-[pinned]/stage:pt-28 group-data-[pinned]/stage:pb-10 grid grid-cols-1 md:grid-cols-12 md:grid-rows-[auto_1fr] md:content-center gap-x-10"
        >
          <div data-group className="md:col-start-5 md:col-span-8 md:row-start-1">
            <h2 className="text-3xl md:text-5xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tight leading-[1.05]">
              <span className="block overflow-hidden pb-[0.06em]">
                <span data-line className="block">
                  {t("ai.title")}
                </span>
              </span>
            </h2>
            <p data-rise className="mt-5 text-on-surface-variant max-w-[60ch] leading-relaxed">
              {t("ai.desc")}
            </p>
          </div>

          {/* cyber esce dal bordo sinistro: su desktop accanto a tutta la scena, su mobile accanto alla didascalia */}
          <div
            data-group
            className="mt-8 -ml-6 flex items-end gap-4 md:mt-0 md:ml-0 md:block md:col-start-1 md:col-span-4 md:row-start-1 md:row-span-2 md:self-end"
          >
            <div
              data-avatar
              data-side="left"
              className="w-28 shrink-0 md:w-auto md:max-w-[330px] md:-translate-x-[22%] lg:-translate-x-[16%]"
            >
              <div data-ai-figure>
                <CastAvatar
                  id="cyber"
                  sizes="(min-width: 1024px) 330px, (min-width: 768px) 30vw, 112px"
                />
              </div>
            </div>
            <p data-rise className="pb-4 md:pb-0 md:mt-4 max-w-[26ch] text-sm text-on-surface-variant leading-snug">
              {t("ai.cyberCaption")}
            </p>
          </div>

          <div className="md:col-start-5 md:col-span-8 md:row-start-2 md:self-start">
            <div aria-hidden="true" className="hidden group-data-[pinned]/stage:flex mt-8 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-1 w-12 overflow-hidden rounded-full bg-outline-variant/50">
                  <span data-ai-mark className="block h-full w-full bg-primary" />
                </span>
              ))}
            </div>

            <div className="mt-10 group-data-[pinned]/stage:mt-6 flex flex-col gap-16 group-data-[pinned]/stage:grid">
              {/* Passo 1: posti creati e sostituiti nel mondo */}
              <article data-ai-step className="group-data-[pinned]/stage:[grid-area:1/1]">
                <div data-group>
                  <p data-rise className="text-sm font-bold text-on-surface-variant">
                    {t("ai.balance.kicker")}
                  </p>
                  <p data-rise className="mt-2 font-[var(--font-plus-jakarta)] font-extrabold text-5xl md:text-7xl text-primary tracking-tighter">
                    <Num value={JOBS_BALANCE.net} locale={locale} prefix="+" /> {t("million")}
                  </p>
                  <p data-rise className="mt-1 font-[var(--font-plus-jakarta)] font-bold text-lg text-secondary">
                    {t("ai.balance.net")}
                  </p>
                  <div className="mt-7 space-y-4 max-w-xl">
                    {(
                      [
                        { key: "created", value: JOBS_BALANCE.created, tone: "bg-secondary" },
                        { key: "displaced", value: JOBS_BALANCE.displaced, tone: "bg-secondary-fixed-dim" },
                      ] as const
                    ).map((row) => (
                      <div key={row.key}>
                        <p className="flex justify-between gap-4 text-sm">
                          <span className="text-on-surface-variant">{t(`ai.balance.${row.key}`)}</span>
                          <span className="font-bold text-secondary">
                            <Num value={row.value} locale={locale} /> {t("million")}
                          </span>
                        </p>
                        <span className="mt-1.5 block h-3" style={{ width: `${(row.value / JOBS_BALANCE.created) * 100}%` }}>
                          <span data-bar className={`block h-full w-full origin-left rounded-[3px] ${row.tone}`} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              {/* Passi 2-4: quote su 100, ognuna con il suo grafico a celle */}
              {AI_STEPS.map((step) => (
                <article
                  key={step.key}
                  data-ai-step
                  className="group-data-[pinned]/stage:[grid-area:1/1]"
                >
                  <div data-group className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-8 items-center">
                    <div>
                      <p data-rise className="text-sm font-bold text-on-surface-variant">
                        {t(`ai.${step.key}.kicker`)}
                      </p>
                      <p data-rise className="mt-2 font-[var(--font-plus-jakarta)] font-extrabold text-5xl md:text-7xl text-primary tracking-tighter">
                        <Num value={step.value} locale={locale} />
                        <span className="text-3xl md:text-5xl text-primary/70"> {t("outOf100")}</span>
                      </p>
                      <h3 data-rise className="mt-2 font-[var(--font-plus-jakarta)] font-bold text-xl text-secondary">
                        {t(`ai.${step.key}.title`)}
                      </h3>
                      <p data-rise className="mt-3 text-on-surface-variant leading-relaxed max-w-[48ch]">
                        {t(`ai.${step.key}.desc`, { created: fmt(11), displaced: fmt(9), italy: fmt(ITALY_SKILLS_CHANGE) })}
                      </p>
                    </div>
                    <div
                      role="img"
                      aria-label={t("waffleLabel", { value: fmt(step.value) })}
                      className="grid grid-cols-10 gap-1 w-[176px] md:w-[216px]"
                    >
                      {Array.from({ length: 100 }, (_, c) => (
                        <span
                          key={c}
                          data-cell={c < step.value ? "on" : "off"}
                          className={`aspect-square rounded-[3px] ${c < step.value ? "bg-primary" : "bg-outline-variant/45"}`}
                        />
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {source("wef", "mt-10 group-data-[pinned]/stage:mt-8 text-outline")}
          </div>
        </div>
      </section>

      {/* Competenze chiave (WEF): la grandezza della parola segue la percentuale */}
      <section className="bg-secondary text-white rounded-t-[2.5rem] md:rounded-t-[3.5rem]" data-group>
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <h2 className="text-3xl md:text-5xl font-[var(--font-plus-jakarta)] font-extrabold tracking-tight leading-[1.05]">
            <span className="block overflow-hidden pb-[0.06em]">
              <span data-line className="block">
                {t("skills.title")}
              </span>
            </span>
          </h2>
          <p data-rise className="mt-5 text-white/80 max-w-[60ch] leading-relaxed">
            {t("skills.desc")}
          </p>
          <ol className="mt-12 flex flex-wrap items-baseline gap-x-8 gap-y-2">
            {CORE_SKILLS.map((skill) => (
              <li key={skill.key} className="overflow-hidden">
                <span
                  data-line
                  className="block pb-[0.14em] font-[var(--font-plus-jakarta)] font-extrabold tracking-tight leading-[1.08]"
                  style={{ fontSize: `clamp(1.35rem, ${(skill.value / 69) * 4.2}vw, ${(skill.value / 69) * 3.4}rem)` }}
                >
                  {t(`skills.items.${skill.key}`)}
                  <span className="ml-2 inline-block text-[max(0.5em,0.875rem)] font-bold text-secondary-fixed-dim">
                    <Num value={skill.value} locale={locale} suffix="%" />
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <p data-rise className="mt-12 text-sm text-white/80 max-w-[70ch] leading-relaxed">
            {t("skills.growing")}
          </p>
          {source("wef", "mt-6 text-white/65 [&_a:hover]:text-white")}
        </div>
      </section>

      {/* Contesto locale: Marche e Provincia di Ancona a confronto con Italia e UE */}
      <section id="marche" className="scroll-mt-24 max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div data-group>
          <h2 className="text-3xl md:text-5xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tight leading-[1.05]">
            <span className="block overflow-hidden pb-[0.06em]">
              <span data-line className="block">
                {t("local.title")}
              </span>
            </span>
          </h2>
          <p data-rise className="mt-5 text-on-surface-variant max-w-[60ch] leading-relaxed">
            {t("local.desc")}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10">
          {/* Ancona: una assunzione su due è difficile da coprire */}
          <div data-group className="lg:col-span-5 bg-primary text-on-primary rounded-[1.5rem] p-8 md:p-10 flex flex-col">
            <p data-rise className="text-sm font-bold text-on-primary-container">
              {t("local.ancona.kicker")}
            </p>
            <p data-rise className="mt-3 font-[var(--font-plus-jakarta)] font-extrabold text-6xl md:text-7xl tracking-tighter">
              <Num value={ANCONA.hardToFill} decimals={1} locale={locale} suffix="%" />
            </p>
            <p data-rise className="mt-3 text-lg font-bold leading-snug">
              {t("local.ancona.title")}
            </p>
            <div aria-hidden="true" className="mt-6 flex h-3 overflow-hidden rounded-[3px]">
              <span data-bar className="block h-full origin-left bg-on-primary" style={{ width: `${ANCONA.hardToFill}%` }} />
              <span className="block h-full flex-1 bg-on-primary/25" />
            </div>
            <p data-rise className="mt-6 text-on-primary-container leading-relaxed">
              {t("local.ancona.desc", { employment: fmt(ANCONA.employment, 1) })}
            </p>
            {source("camcom", "mt-auto pt-8 text-on-primary-container [&_a:hover]:text-white")}
          </div>

          {/* NEET e disoccupazione: colonne Marche, Italia, UE */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-8">
            {(
              [
                {
                  key: "neet",
                  source: "eurostatNeet",
                  rows: [
                    { label: t("local.labels.marche"), value: NEET.marche, tone: "bg-primary" },
                    { label: t("local.labels.italia"), value: NEET.italia, tone: "bg-secondary" },
                    { label: t("local.labels.ue"), value: NEET.ue, tone: "bg-secondary-fixed-dim" },
                    { label: t("local.labels.marche2019"), value: NEET.marche2019, tone: "bg-primary-fixed-dim" },
                  ],
                },
                {
                  key: "unemployment",
                  source: "eurostatUnemp",
                  rows: [
                    { label: t("local.labels.marche"), value: UNEMPLOYMENT.marche, tone: "bg-primary" },
                    { label: t("local.labels.italia"), value: UNEMPLOYMENT.italia, tone: "bg-secondary" },
                    { label: t("local.labels.ue"), value: UNEMPLOYMENT.ue, tone: "bg-secondary-fixed-dim" },
                    { label: t("local.labels.marche2024"), value: UNEMPLOYMENT.marche2024, tone: "bg-primary-fixed-dim" },
                  ],
                },
              ] as const
            ).map((chart) => {
              const max = Math.max(...chart.rows.map((r) => r.value));
              return (
                <figure key={chart.key} data-group className="flex flex-col">
                  <figcaption>
                    <h3 data-rise className="font-[var(--font-plus-jakarta)] font-bold text-lg text-secondary">
                      {t(`local.${chart.key}.title`)}
                    </h3>
                    <p data-rise className="mt-2 text-sm text-on-surface-variant leading-relaxed">
                      {t(`local.${chart.key}.desc`)}
                    </p>
                  </figcaption>
                  <div className="mt-8 grid grid-flow-col auto-cols-fr gap-3 items-end h-56">
                    {chart.rows.map((row) => (
                      <div key={row.label} className="flex h-full flex-col justify-end">
                        <p className="mb-2 text-center text-sm font-bold text-secondary">
                          <Num value={row.value} decimals={1} locale={locale} suffix="%" />
                        </p>
                        <span
                          data-col
                          className={`block origin-bottom rounded-t-[6px] ${row.tone}`}
                          style={{ height: `${(row.value / max) * 75}%` }}
                        />
                        <p className="mt-2 text-center text-xs text-on-surface-variant leading-tight min-h-[2lh]">
                          {row.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  {source(chart.source, "mt-6 text-outline")}
                </figure>
              );
            })}
          </div>
        </div>
      </section>
    </MarketMotion>
  );
}
