import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { BASE_URL } from "@/lib/constants";
import { getAllNews } from "@/lib/news/repository";

export const revalidate = 3600;

const staticRoutes = [
  "/",
  "/progetto",
  "/mercato-lavoro",
  "/news",
  "/archivio",
  "/contatti",
  "/privacy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = staticRoutes.flatMap((route) => {
    const languages: Record<string, string> = {};
    for (const locale of locales) {
      languages[locale] = `${BASE_URL}/${locale}${route === "/" ? "" : route}`;
    }

    return locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${route === "/" ? "" : route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "/" ? 1.0 : 0.8,
      alternates: { languages },
    }));
  });

  const newsEntries = (await getAllNews("it")).flatMap((article) => {
    const languages: Record<string, string> = {};
    for (const locale of locales) {
      languages[locale] = `${BASE_URL}/${locale}/news/${article.slug}`;
    }

    return locales.map((locale) => ({
      url: `${BASE_URL}/${locale}/news/${article.slug}`,
      lastModified: new Date(article.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages },
    }));
  });

  return [...staticEntries, ...newsEntries];
}
