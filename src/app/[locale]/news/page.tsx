import type { Metadata } from "next";
import { getMessages, setRequestLocale } from "next-intl/server";
import { NewsContent } from "@/components/news/NewsContent";
import { getAllNews } from "@/lib/news/repository";

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
  return { title: news.title, description: news.subtitle };
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const articles = await getAllNews(locale);
  return <NewsContent articles={articles} />;
}
