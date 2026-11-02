import type { NewsCategory } from "./types";

/** Una news candidata, con il testo raccolto dalla fonte. */
export type Candidate = {
  index: number;
  sourceName: string;
  sourceCategory: NewsCategory;
  language: "it" | "en";
  title: string;
  url: string;
  publishedAt: string | null;
  /** Foto di copertina dell'articolo originale, se trovata. */
  imageUrl: string | null;
  text: string;
};

export type Summary = {
  index: number;
  category: NewsCategory;
  title: string;
  excerpt: string;
  content: string;
  titleEn: string | null;
  excerptEn: string | null;
  contentEn: string | null;
  method: "ai" | "extract";
};

/** Linee guida della redazione, usate anche dal task programmato di Claude. */
export const EDITORIAL_GUIDELINES = `Sei la redazione di "Il Futuro Me", un sito di orientamento per ragazze e ragazzi tra i 12 e i 16 anni di Senigallia (Marche). Ogni settimana scegli e riassumi le notizie più utili sul mondo del lavoro, la formazione, le competenze e l'impatto dell'intelligenza artificiale.

Come scegliere:
- Preferisci notizie che aiutano a capire quali lavori crescono, quali competenze servono, come cambiano scuola e formazione, dati ufficiali su occupazione giovanile, NEET, apprendistato, ITS, transizione digitale e verde.
- Scarta notizie fuori tema (finanza, politica di partito, cronaca, singole aziende senza interesse generale) e i doppioni: se due notizie raccontano lo stesso fatto, tieni quella della fonte più ufficiale.

Come scrivere:
- Usa SOLO le informazioni presenti nel testo fornito per ciascuna notizia. Non aggiungere numeri, date, nomi o fatti che non ci sono. Se un dato non è nel testo, non scriverlo.
- Riporta i numeri esattamente come nella fonte, indicando a cosa si riferiscono (periodo, territorio).
- Italiano semplice e chiaro, adatto a 12-16 anni, senza paternalismo. Spiega le sigle la prima volta (es. NEET).
- title_it: massimo 90 caratteri, informativo, niente clickbait.
- excerpt_it: 1-2 frasi (massimo 280 caratteri).
- content_it: 150-250 parole in 3-5 paragrafi separati da una riga vuota. Puoi usare un sottotitolo per paragrafo nella forma **Sottotitolo** su una riga a sé. L'ultimo paragrafo, introdotto da **Perché ti riguarda**, collega la notizia alle scelte di chi sta per scegliere la scuola superiore o un percorso, senza inventare dati.
- Non citare la fonte nel testo: il sito la mostra sempre accanto alla notizia con il link all'originale.
- title_en, excerpt_en, content_en: traduzione inglese fedele degli stessi testi, con la stessa struttura.
- category: ai (intelligenza artificiale e automazione), jobs (lavoro e occupazione), training (scuola, formazione, apprendistato), skills (competenze).`;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"));
  return (lastStop > max * 0.5 ? cut.slice(0, lastStop + 1) : cut.trimEnd() + "…").trim();
}

/**
 * Riassunto senza AI: titolo e testo presi dalla fonte, accorciati.
 * Usato dal job automatico; le news scritte dal task di Claude Desktop arrivano
 * già pronte da /api/admin/publish-news.
 */
export function extractiveSummary(c: Candidate): Summary {
  const paragraphs = c.text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p, i, all) => p.length > 60 && all.indexOf(p) === i);
  const body = truncate(paragraphs.join("\n\n"), 1200);
  const excerpt = truncate(paragraphs[0] ?? c.title, 280);
  return {
    index: c.index,
    category: c.sourceCategory,
    title: truncate(c.title, 140),
    excerpt,
    content: body || excerpt,
    titleEn: null,
    excerptEn: null,
    contentEn: null,
    method: "extract",
  };
}
