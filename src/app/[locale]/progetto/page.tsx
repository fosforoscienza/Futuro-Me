import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import {
  Target,
  Heart,
  Users,
  Rocket,
  UserCheck,
  Globe,
  Settings,
} from "lucide-react";
import { HeaderAvatar } from "@/components/avatar/HeaderAvatar";
import { SectionAvatar } from "@/components/avatar/SectionAvatar";
import { JsonLd } from "@/components/seo/JsonLd";
import { projectFaq } from "@/lib/project-facts";
import { BASE_URL } from "@/lib/constants";
import { ORGANIZATION_ID, pageMetadata, webPageNodes } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const project = messages.project as Record<string, string>;
  return pageMetadata({
    locale,
    path: "/progetto",
    title: project.title,
    description: project.subtitle,
  });
}

export default async function ProgettoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProgettoContent />;
}

function ProgettoContent() {
  const t = useTranslations("project");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  // Riepilogo citabile (chi, cosa, dove, quando), riusato anche da llms.txt.
  const faq = projectFaq(t, locale);

  const objectives = [
    { icon: Target, title: t("obj1Title"), desc: t("obj1Desc") },
    { icon: Heart, title: t("obj2Title"), desc: t("obj2Desc") },
    { icon: Users, title: t("obj3Title"), desc: t("obj3Desc") },
  ];

  const phases = [
    {
      icon: Rocket,
      title: t("wp1Title"),
      desc: t("wp1Desc"),
      color: "bg-secondary",
      textColor: "text-white",
    },
    {
      icon: UserCheck,
      title: t("wp2Title"),
      desc: t("wp2Desc"),
      color: "bg-primary-container",
      textColor: "text-on-primary-container",
    },
    {
      icon: Globe,
      title: t("wp3Title"),
      desc: t("wp3Desc"),
      color: "bg-tertiary-container",
      textColor: "text-on-tertiary-container",
    },
    {
      icon: Settings,
      title: t("wp4Title"),
      desc: t("wp4Desc"),
      color: "bg-surface-container-high",
      textColor: "text-secondary",
    },
  ];

  return (
    <div className="pb-24 md:pb-12">
      <JsonLd
        data={[
          ...webPageNodes({
            locale,
            path: "/progetto",
            type: "AboutPage",
            name: t("title"),
            description: t("subtitle"),
            homeName: tNav("home"),
            breadcrumbs: [{ name: t("title"), path: "/progetto" }],
            extra: { mainEntity: { "@id": ORGANIZATION_ID } },
          }),
          {
            "@type": "FAQPage",
            "@id": `${BASE_URL}/${locale}/progetto#faq`,
            inLanguage: locale,
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          },
        ]}
      />
      {/* Header */}
      <header className="relative px-6 max-w-7xl mx-auto pt-12 pb-16 lg:min-h-[27rem]">
        <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4">
          Futuro Me
        </p>
        <h1 className="text-5xl md:text-7xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter max-w-3xl leading-[0.9]">
          {t("title")}
        </h1>
        <p className="mt-8 text-xl text-on-surface-variant max-w-2xl leading-relaxed">
          {t("subtitle")}
        </p>
        <HeaderAvatar id="teacher" />
      </header>

      {/* Overview */}
      <section className="bg-surface-container-low py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-[var(--font-plus-jakarta)] font-bold text-secondary mb-6">
            {t("overviewTitle")}
          </h2>
          <p className="text-on-surface-variant leading-relaxed max-w-3xl text-lg">
            {t("overview")}
          </p>
        </div>
      </section>

      {/* In breve: domande e risposte */}
      <section id="in-breve" className="max-w-7xl mx-auto px-6 pt-20">
        <h2 className="text-2xl font-[var(--font-plus-jakarta)] font-bold text-secondary mb-10">
          {t("faq.title")}
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 max-w-5xl">
          {faq.map((item) => (
            <div key={item.q}>
              <dt className="font-[var(--font-plus-jakarta)] font-bold text-lg text-secondary">
                {item.q}
              </dt>
              <dd className="mt-2 text-on-surface-variant leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Objectives */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-[var(--font-plus-jakarta)] font-bold text-secondary mb-10">
          {t("objectivesTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {objectives.map((obj) => {
            const Icon = obj.icon;
            return (
              <div
                key={obj.title}
                className="bg-surface-container-lowest p-8 rounded-[1.5rem]"
              >
                <div className="bg-secondary-container p-3 rounded-xl w-fit mb-4">
                  <Icon size={24} className="text-on-secondary-container" />
                </div>
                <h3 className="font-[var(--font-plus-jakarta)] font-bold text-lg text-secondary mb-2">
                  {obj.title}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {obj.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Phases Timeline */}
      <section className="bg-surface-container-low py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-[var(--font-plus-jakarta)] font-bold text-secondary mb-10">
            {t("phasesTitle")}
          </h2>
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">
            <SectionAvatar
              id="student"
              className="absolute right-6 bottom-full h-40 md:right-10 md:h-60"
            />
            {phases.map((phase, i) => {
              const Icon = phase.icon;
              return (
                <div
                  key={phase.title}
                  className={`${phase.color} ${phase.textColor} p-8 rounded-[1.5rem] relative overflow-hidden`}
                >
                  <div className="relative z-10">
                    <span className="text-xs font-bold opacity-60 uppercase tracking-widest">
                      WP{i + 1}
                    </span>
                    <h3 className="text-xl font-[var(--font-plus-jakarta)] font-bold mt-2 mb-3">
                      {phase.title}
                    </h3>
                    <p className="text-sm opacity-80 leading-relaxed">
                      {phase.desc}
                    </p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <Icon size={100} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
