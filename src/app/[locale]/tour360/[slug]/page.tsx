import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TourViewer } from "@/components/tour360/TourViewer";
import { getTour, listTourSlugs } from "@/lib/tour360";
import { pageMetadata } from "@/lib/seo";

// Un tour per ogni cartella di public/tour360: gli slug sconosciuti danno 404.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listTourSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const tour = await getTour(slug);
  if (!tour) return {};
  const t = await getTranslations({ locale, namespace: "tour360" });
  return pageMetadata({
    locale,
    path: `/tour360/${slug}`,
    title: `${tour.title} · ${t("metaTitle")}`,
    description: t("metaDescription"),
    // In prova: non indicizzata finché non è collegata dal sito.
    noindex: true,
  });
}

export default async function TourPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const tour = await getTour(slug);
  if (!tour) notFound();
  const t = await getTranslations("tour360");

  return (
    <div className="pb-24 md:pb-12">
      <header className="px-6 max-w-7xl mx-auto pt-12 pb-8">
        <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4">
          {t("eyebrow")}
        </p>
        <h1 className="text-4xl md:text-6xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter leading-[0.95]">
          {tour.title}
        </h1>
        <p className="mt-6 text-lg text-on-surface-variant max-w-2xl leading-relaxed">
          {t("intro")}
        </p>
      </header>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <TourViewer tour={tour} />
      </div>
    </div>
  );
}
