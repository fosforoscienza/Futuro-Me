import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Questionario } from "@/components/questionario/Questionario";

// Pagina non ancora collegata dal sito: esclusa da motori di ricerca e sitemap.
export const metadata: Metadata = {
  title: "Questionario",
  description:
    "Questionario anonimo su pensieri, desideri e aspirazioni per il futuro.",
  robots: { index: false, follow: false },
};

export default async function QuestionarioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Questionario />;
}
