import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
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

const MODEL = process.env.NEWS_SUMMARY_MODEL || "claude-opus-5-5";

const SummarySchema = z.object({
  selected: z.array(
    z.object({
      index: z.number().int(),
      category: z.enum(["ai", "jobs", "training", "skills"]),
      title_it: z.string(),
      excerpt_it: z.string(),
      content_it: z.string(),
      title_en: z.string(),
      excerpt_en: z.string(),
      content_en: z.string(),
    })
  ),
});

const SYSTEM_PROMPT = `Sei la redazione di "Il Futuro Me", un sito di orientamento per ragazze e ragazzi tra i 12 e i 16 anni di Senigallia (Marche). Ogni settimana scegli e riassumi le notizie più utili sul mondo del lavoro, la formazione, le competenze e l'impatto dell'intelligenza artificiale.

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

/** True se è configurata una chiave per il riassunto con Claude. */
export function canUseAI(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/**
 * Sceglie fino a `max` news tra i candidati e le riassume con Claude.
 * Restituisce solo le news scelte, già pronte per la pubblicazione.
 */
export async function summarizeWithClaude(
  candidates: Candidate[],
  max: number
): Promise<Summary[]> {
  const client = new Anthropic({ timeout: 240_000, maxRetries: 1 });

  const items = candidates
    .map(
      (c) =>
        `<notizia index="${c.index}">
<fonte>${c.sourceName}</fonte>
<lingua_originale>${c.language}</lingua_originale>
<data>${c.publishedAt ?? "non indicata"}</data>
<titolo_originale>${c.title}</titolo_originale>
<testo>
${c.text}
</testo>
</notizia>`
    )
    .join("\n\n");

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: betaZodOutputFormat(SummarySchema),
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Ecco le notizie della settimana raccolte dalle fonti del sito. Scegline al massimo ${max} (anche meno, se le altre non sono utili per il nostro pubblico) e scrivi per ciascuna i testi richiesti. Usa l'attributo index per indicare la notizia.\n\n${items}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Riassunto rifiutato dal modello");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Riassunto troncato (max_tokens)");
  }
  const parsed = response.parsed_output;
  if (!parsed) throw new Error("Risposta del modello non valida");

  const valid = new Set(candidates.map((c) => c.index));
  const seen = new Set<number>();
  return parsed.selected
    .filter((s) => valid.has(s.index) && !seen.has(s.index) && seen.add(s.index))
    .slice(0, max)
    .map((s) => ({
      index: s.index,
      category: s.category,
      title: s.title_it.trim(),
      excerpt: s.excerpt_it.trim(),
      content: s.content_it.trim(),
      titleEn: s.title_en.trim() || null,
      excerptEn: s.excerpt_en.trim() || null,
      contentEn: s.content_en.trim() || null,
      method: "ai" as const,
    }));
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"));
  return (lastStop > max * 0.5 ? cut.slice(0, lastStop + 1) : cut.trimEnd() + "…").trim();
}

/**
 * Riassunto senza AI: titolo e testo presi dalla fonte, accorciati.
 * Usato se manca ANTHROPIC_API_KEY o se la chiamata a Claude fallisce.
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
