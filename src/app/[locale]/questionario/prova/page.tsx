import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { TokenGate } from "@/components/questionario/TokenGate";

// Prova del percorso studenti per psicologi e staff: non salva nulla, non indicizzata.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/questionario/prova",
    title: "Prova del questionario",
    description: "Prova del percorso degli studenti per lo staff del progetto: le risposte non vengono salvate.",
    noindex: true,
  });
}

export default async function QuestionarioProvaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TokenGate demo />;
}
