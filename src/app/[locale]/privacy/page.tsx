import type { Metadata } from "next";
import { getMessages, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const privacy = messages.privacy as Record<string, string>;
  return { title: privacy.title, description: privacy.metaDescription };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PrivacyContent />;
}

function PrivacyContent() {
  const t = useTranslations("privacy");

  const sections = [
    { title: t("controllerTitle"), body: t("controllerBody") },
    { title: t("dataTitle"), body: t("dataBody") },
    { title: t("purposeTitle"), body: t("purposeBody") },
    { title: t("legalBasisTitle"), body: t("legalBasisBody") },
    { title: t("retentionTitle"), body: t("retentionBody") },
    { title: t("rightsTitle"), body: t("rightsBody") },
    { title: t("cookiesTitle"), body: t("cookiesBody") },
    { title: t("minorsTitle"), body: t("minorsBody") },
    { title: t("contactTitle"), body: t("contactBody") },
  ];

  return (
    <div className="pb-24 md:pb-12">
      <header className="px-6 max-w-7xl mx-auto pt-12 pb-16">
        <h1 className="text-5xl md:text-7xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter max-w-3xl leading-[0.9]">
          {t("title")}
        </h1>
        <p className="mt-8 text-xl text-on-surface-variant max-w-2xl leading-relaxed">
          {t("subtitle")}
        </p>
      </header>

      <div className="max-w-4xl mx-auto px-6 space-y-12">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-[var(--font-plus-jakarta)] font-bold text-secondary mb-4">
              {section.title}
            </h2>
            <p className="text-on-surface-variant leading-relaxed whitespace-pre-line">
              {section.body}
            </p>
          </section>
        ))}

        <p className="text-sm text-outline border-t border-outline-variant pt-8">
          {t("lastUpdated")}
        </p>
      </div>
    </div>
  );
}
