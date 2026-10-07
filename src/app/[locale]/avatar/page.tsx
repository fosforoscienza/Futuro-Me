import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AvatarPlayground } from "@/components/avatar/AvatarPlayground";

// Pagina di prova non collegata dal sito: esclusa da motori di ricerca e sitemap.
export const metadata: Metadata = {
  title: "Prova avatar",
  description: "Prova l'avatar de Il Futuro Me senza compilare il questionario.",
  robots: { index: false, follow: false },
};

export default async function AvatarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AvatarPlayground />;
}
