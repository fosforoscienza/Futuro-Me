import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { ORGANIZATION_ID, pageMetadata, webPageNodes } from "@/lib/seo";

// Come nascono le news: i testi descrivono il job e il task editoriale
// (src/lib/news), non un processo ideale. Aggiornarli se cambia la pipeline.
const SECTIONS = ["sources", "choice", "writing", "extracts", "credit", "limits", "corrections"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const method = messages.method as Record<string, string>;
  return pageMetadata({
    locale,
    path: "/metodo",
    title: method.metaTitle,
    description: method.metaDescription,
  });
}

export default async function MetodoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("method");
  const tNav = await getTranslations("nav");

  return (
    <div className="pb-24 md:pb-12">
      <JsonLd
        data={webPageNodes({
          locale,
          path: "/metodo",
          type: "AboutPage",
          name: t("metaTitle"),
          description: t("metaDescription"),
          homeName: tNav("home"),
          breadcrumbs: [
            { name: tNav("news"), path: "/news" },
            { name: t("metaTitle"), path: "/metodo" },
          ],
          extra: { mainEntity: { "@id": ORGANIZATION_ID } },
        })}
      />
      <header className="px-6 max-w-7xl mx-auto pt-12 pb-16">
        <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4">
          {t("eyebrow")}
        </p>
        <h1 className="text-5xl md:text-7xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter max-w-3xl leading-[0.9]">
          {t("title")}
        </h1>
        <p className="mt-8 text-xl text-on-surface-variant max-w-2xl leading-relaxed">
          {t("intro")}
        </p>
      </header>

      <div className="max-w-4xl mx-auto px-6 space-y-12">
        {SECTIONS.map((key) => (
          <section key={key}>
            <h2 className="text-xl font-[var(--font-plus-jakarta)] font-bold text-secondary mb-4">
              {t(`${key}Title`)}
            </h2>
            <p className="text-on-surface-variant leading-relaxed whitespace-pre-line">
              {t(`${key}Body`)}
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
