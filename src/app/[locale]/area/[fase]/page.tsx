import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Questionario, QuestionarioDone } from "@/components/questionario/Questionario";
import { getCompilazioni, isFase, isFaseAperta } from "@/lib/auth/area";
import { authDb, getSession } from "@/lib/auth/session";

const headline = "font-[var(--font-plus-jakarta)]";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; fase: string }>;
}): Promise<Metadata> {
  const { locale, fase } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return {
    title: fase === "fine" ? t("phaseEnd") : t("phaseStart"),
    robots: { index: false, follow: false },
  };
}

export default async function FasePage({
  params,
}: {
  params: Promise<{ locale: string; fase: string }>;
}) {
  const { locale, fase } = await params;
  setRequestLocale(locale);
  if (!isFase(fase)) notFound();

  const account = await getSession();
  if (!account) redirect(`/${locale}/accedi`);
  if (account.ruolo !== "studente") redirect("/admin");

  const db = authDb()!;
  const areaHref = `/${locale}/area`;
  if (!(await isFaseAperta(db, fase))) redirect(areaHref);

  const compilazione = (await getCompilazioni(db, account.id))[fase];
  if (!compilazione) return <Questionario fase={fase} areaHref={areaHref} />;

  const t = await getTranslations("account");
  return (
    <div className="pb-28 md:pb-16">
      <header className="px-4 sm:px-6 max-w-6xl mx-auto pt-10 md:pt-14 pb-8">
        <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4">
          {fase === "fine" ? t("phaseEnd") : t("phaseStart")}
        </p>
        <h1
          className={`text-4xl md:text-6xl ${headline} font-extrabold text-secondary tracking-tighter leading-[0.95]`}
        >
          Il Futuro Me
        </h1>
      </header>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <QuestionarioDone
          avatar={compilazione.avatar}
          backHref={areaHref}
          title={t("doneTitle")}
          text={t("doneText")}
          downloadLabel={t("download")}
          backLabel={t("back")}
        />
      </div>
    </div>
  );
}
