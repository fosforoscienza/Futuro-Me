import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { getAllNews } from "@/lib/news/repository";
import { languageAlternates, pageUrl } from "@/lib/seo";

export const revalidate = 3600;

// Solo pagine indicizzabili: fuori archivio (contenuti d'esempio), questionario,
// avatar, accesso, area studenti e console /admin (tutte noindex).
const staticRoutes = ["", "/progetto", "/mercato-lavoro", "/news", "/metodo", "/contatti", "/privacy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Le news del job arrivano dal database: la sitemap si aggiorna da sola.
  // Gli estratti delle fonti sono noindex: fuori dalla sitemap.
  const news = (await getAllNews("it")).filter((a) => a.method !== "extract");
  // Le news sono ordinate per data della fonte: l'ultima pubblicata va cercata.
  const latest = news
    .map((a) => a.updatedAt ?? a.publishedAt ?? a.date)
    .sort()
    .at(-1);

  const staticEntries = staticRoutes.flatMap((route) => {
    const languages = languageAlternates(route);
    return locales.map((locale) => ({
      url: pageUrl(locale, route),
      // Home e news cambiano a ogni pubblicazione; le altre pagine non hanno una data affidabile.
      ...((route === "" || route === "/news") && latest ? { lastModified: new Date(latest) } : {}),
      changeFrequency: route === "" || route === "/news" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1.0 : 0.8,
      alternates: { languages },
    }));
  });

  const newsEntries = news.flatMap((article) => {
    const path = `/news/${article.slug}`;
    const available = article.languages ?? ["it"];
    const languages = languageAlternates(path, available);
    return available.map((locale) => ({
      url: pageUrl(locale, path),
      lastModified: new Date(article.updatedAt ?? article.publishedAt ?? article.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      ...(languages ? { alternates: { languages } } : {}),
    }));
  });

  return [...staticEntries, ...newsEntries];
}
