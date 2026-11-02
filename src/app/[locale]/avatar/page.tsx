import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { AvatarPlayground } from "@/components/avatar/AvatarPlayground";

// Pagina di prova non collegata dal sito: esclusa da motori di ricerca e sitemap.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata({
    locale,
    path: "/avatar",
    title: t("avatarTitle"),
    description: t("avatarDescription"),
    noindex: true,
  });
}

export default async function AvatarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AvatarPlayground />;
}
