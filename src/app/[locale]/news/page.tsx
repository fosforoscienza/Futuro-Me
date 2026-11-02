import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { NewsContent } from "@/components/news/NewsContent";
import { getAllNews } from "@/lib/news/repository";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata, pageUrl, webPageNodes } from "@/lib/seo";

// Le news automatiche arrivano dal database: pagina rigenerata al massimo ogni
// ora e subito dopo ogni pubblicazione del job (revalidatePath).
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const news = messages.news as Record<string, string>;
  return pageMetadata({ locale, path: "/news", title: news.title, description: news.subtitle });
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const articles = await getAllNews(locale);
  const t = await getTranslations("news");
  const tNav = await getTranslations("nav");
  return (
    <>
      <JsonLd
        data={webPageNodes({
          locale,
          path: "/news",
          type: "CollectionPage",
          name: t("title"),
          description: t("subtitle"),
          homeName: tNav("home"),
          breadcrumbs: [{ name: t("title"), path: "/news" }],
          extra: {
            mainEntity: {
              "@type": "ItemList",
              itemListElement: articles.map((a, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: pageUrl(a.lang ?? "it", `/news/${a.slug}`),
                name: a.title,
              })),
            },
          },
        })}
      />
      <NewsContent articles={articles} />
    </>
  );
}
