import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { BASE_URL } from "@/lib/constants";

// Aree private: console, API e area studenti (anche noindex nelle pagine).
const disallow = ["/api/", "/admin", ...locales.map((l) => `/${l}/area`)];

// Crawler dei motori AI (ricerca e risposte con citazioni): ammessi in modo esplicito.
// Chi ha un gruppo suo ignora "*", quindi le esclusioni vanno ripetute.
const aiCrawlers = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "DuckAssistBot",
  "MistralAI-User",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: aiCrawlers, allow: "/", disallow },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
