import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { Questionario } from "@/components/questionario/Questionario";

// Pagina non ancora collegata dal sito: esclusa da motori di ricerca e sitemap.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata({
    locale,
    path: "/questionario",
    title: t("questionnaireTitle"),
    description: t("questionnaireDescription"),
    noindex: true,
  });
}

export default async function QuestionarioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Questionario />;
}
