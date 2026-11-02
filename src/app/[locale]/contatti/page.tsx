import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Mail, MapPin, ExternalLink } from "lucide-react";
import { HeaderAvatar } from "@/components/avatar/HeaderAvatar";
import { JsonLd } from "@/components/seo/JsonLd";
import { CONTACT_EMAIL } from "@/lib/constants";
import { pageMetadata, webPageNodes } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const contacts = messages.contacts as Record<string, string>;
  return pageMetadata({
    locale,
    path: "/contatti",
    title: contacts.metaTitle,
    description: contacts.metaDescription,
  });
}

export default async function ContattiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contacts");
  const tNav = await getTranslations("nav");

  return (
    <div className="pb-24 md:pb-12">
      <JsonLd
        data={webPageNodes({
          locale,
          path: "/contatti",
          type: "ContactPage",
          name: t("metaTitle"),
          description: t("metaDescription"),
          homeName: tNav("home"),
          breadcrumbs: [{ name: t("metaTitle"), path: "/contatti" }],
        })}
      />
      <header className="relative px-6 max-w-7xl mx-auto pt-12 pb-16 lg:min-h-[27rem]">
        <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4">
          {t("eyebrow")}
        </p>
        <h1 className="text-5xl md:text-7xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter max-w-3xl leading-[0.9]">
          {t("title")}
        </h1>
        <p className="mt-8 text-xl text-on-surface-variant max-w-2xl leading-relaxed">
          {t("intro")}
        </p>
        <HeaderAvatar id="firefighter" />
      </header>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface-container-low p-8 rounded-[1.5rem]">
          <h2 className="text-xl font-[var(--font-plus-jakarta)] font-bold text-secondary mb-6">
            {t("promoterTitle")}
          </h2>
          <div className="space-y-4">
            <p className="font-bold text-secondary">
              Fondazione Caritas Senigallia ETS
            </p>
            <div className="flex items-center gap-3 text-on-surface-variant">
              <MapPin size={18} />
              <span className="text-sm">{t("location")}</span>
            </div>
            <div className="flex items-center gap-3 text-on-surface-variant">
              <Mail size={18} />
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm hover:underline">
                {CONTACT_EMAIL}
              </a>
            </div>
            <div className="flex items-center gap-3 text-on-surface-variant">
              <ExternalLink size={18} />
              <span className="text-sm">{t("funding")}</span>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-8 rounded-[1.5rem] text-white">
          <h2 className="text-xl font-[var(--font-plus-jakarta)] font-bold mb-6">
            {t("feedbackTitle")}
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-6">
            {t("feedbackBody")}
          </p>
          <a
            href="mailto:feedback@ilfuturome.it"
            className="bg-white text-secondary px-6 py-3 rounded-full font-bold text-sm inline-flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Mail size={16} /> {t("feedbackCta")}
          </a>
        </div>
      </div>
    </div>
  );
}
