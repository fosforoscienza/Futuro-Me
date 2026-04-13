import type { Metadata } from "next";
import { getMessages, setRequestLocale } from "next-intl/server";
import { NewsContent } from "@/components/news/NewsContent";

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

  return <NewsContent />;
}
