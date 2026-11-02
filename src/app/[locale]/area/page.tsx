import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, CheckCircle2, Circle, Lock, LogOut, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import { AvatarCanvas } from "@/components/avatar/AvatarCanvas";
import { LogoutForm } from "@/components/account/LogoutForm";
import { getCompilazioni, isFaseFineAttiva, type Compilazione, type Fase } from "@/lib/auth/area";
import { authDb, getSession } from "@/lib/auth/session";

const headline = "font-[var(--font-plus-jakarta)]";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("areaEyebrow"), robots: { index: false, follow: false } };
}

export default async function AreaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const account = await getSession();
  if (!account) redirect(`/${locale}/accedi`);
  if (account.ruolo !== "studente") redirect("/admin");

  const db = authDb()!;
  const [compilazioni, fineAttiva, t] = await Promise.all([
    getCompilazioni(db, account.id),
    isFaseFineAttiva(db),
    getTranslations("account"),
  ]);
  const languageNote = t("languageNote");

  return (
    <div className="pb-28 md:pb-16">
      <header className="px-4 sm:px-6 max-w-5xl mx-auto pt-10 md:pt-14 pb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-primary" />
              <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs">
                {t("areaEyebrow")}
              </p>
            </div>
            <h1
              className={`text-4xl md:text-6xl ${headline} font-extrabold text-secondary tracking-tighter leading-[0.95] break-words`}
            >
              {t("hello", { username: account.username })}
            </h1>
            {account.classe && (
              <p className="mt-4 inline-block rounded-full bg-secondary-fixed text-on-secondary-fixed-variant px-4 py-1.5 text-sm font-bold">
                {t("classLabel", { school: account.classe.scuola, className: account.classe.nome })}
              </p>
            )}
          </div>
          <LogoutForm
            locale={locale}
            className="rounded-full px-4 py-2.5 text-sm font-bold bg-surface-container-highest text-secondary hover:bg-secondary/10 inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <LogOut size={16} /> {t("logout")}
          </LogoutForm>
        </div>
        <p className="mt-6 text-lg text-on-surface-variant leading-relaxed max-w-2xl">
          {t("areaIntro")}
        </p>
        {languageNote && <p className="mt-2 text-sm text-on-surface-variant">{languageNote}</p>}
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <PhaseCard
          fase="inizio"
          number="01"
          title={t("phaseStart")}
          description={t("phaseStartDesc")}
          compilazione={compilazioni.inizio}
          open
          locale={locale}
        />
        <PhaseCard
          fase="fine"
          number="02"
          title={t("phaseEnd")}
          description={t("phaseEndDesc")}
          compilazione={compilazioni.fine}
          open={fineAttiva}
          locale={locale}
        />
      </div>
    </div>
  );
}

async function PhaseCard({
  fase,
  number,
  title,
  description,
  compilazione,
  open,
  locale,
}: {
  fase: Fase;
  number: string;
  title: string;
  description: string;
  compilazione?: Compilazione;
  open: boolean;
  locale: string;
}) {
  const t = await getTranslations("account");

  if (!open) {
    return (
      <section className="rounded-[1.5rem] p-6 sm:p-8 bg-surface-container text-on-surface-variant border-2 border-dashed border-outline-variant select-none"
      >
        <div className="flex items-center justify-between gap-3">
          <span className={`${headline} text-5xl font-extrabold text-outline-variant`}>{number}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <Lock size={12} /> {t("statusLocked")}
          </span>
        </div>
        <h2 className={`mt-6 text-2xl md:text-3xl ${headline} font-extrabold text-outline`}>{title}</h2>
        <p className="mt-3 leading-relaxed">{description}</p>
        <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-surface-container-highest px-5 py-3 text-sm font-bold text-outline">
          <Lock size={16} /> {t("lockedNote")}
        </p>
      </section>
    );
  }

  const done = Boolean(compilazione);
  const date = compilazione
    ? new Date(compilazione.created_at).toLocaleDateString(locale === "en" ? "en-GB" : "it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Rome",
      })
    : "";

  return (
    <section className="rounded-[1.5rem] p-6 sm:p-8 bg-surface-container-low">
      <div className="flex items-center justify-between gap-3">
        <span className={`${headline} text-5xl font-extrabold text-secondary/25`}>{number}</span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
            done ? "bg-secondary text-white" : "bg-tertiary-fixed text-on-tertiary-fixed-variant"
          }`}
        >
          {done ? <CheckCircle2 size={12} /> : <Circle size={12} />}
          {done ? t("statusDone", { date }) : t("statusTodo")}
        </span>
      </div>
      <h2 className={`mt-6 text-2xl md:text-3xl ${headline} font-extrabold text-secondary`}>{title}</h2>
      <p className="mt-3 text-on-surface-variant leading-relaxed">{description}</p>
      {compilazione && (
        <AvatarCanvas selection={compilazione.avatar} focus="face" className="mt-6 w-32" />
      )}
      <Link
        href={`/area/${fase}`}
        className={`mt-8 px-6 py-3 rounded-full font-bold text-sm inline-flex items-center gap-2 transition-colors ${
          done
            ? "bg-surface-container-highest text-secondary hover:bg-secondary/10"
            : "bg-primary text-on-primary hover:bg-primary-container"
        }`}
      >
        {done ? t("viewAvatar") : t("start")} <ArrowRight size={16} />
      </Link>
    </section>
  );
}
