import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { BASE_URL } from "@/lib/constants";

const routes = [
  "/",
  "/progetto",
  "/mercato-lavoro",
  "/news",
  "/archivio",
  "/contatti",
  "/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((route) => {
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
}
