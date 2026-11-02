// Il sito risponde su www (l'apex reindirizza): canonical, sitemap e dati
// strutturati devono usare quello, anche se NEXT_PUBLIC_SITE_URL indica l'apex.
export const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ilfuturome.it")
  .replace(/\/+$/, "")
  .replace("://ilfuturome.it", "://www.ilfuturome.it");

export const SITE_NAME = "Il Futuro Me";
export const CONTACT_EMAIL = "info@ilfuturome.it";
