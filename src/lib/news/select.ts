/**
 * Pertinenza e deduplica delle news raccolte dai feed.
 * La pertinenza è un punteggio per parole chiave: serve a scartare i
 * comunicati fuori tema dei feed generici (es. inflazione, PIL) e a scegliere
 * i candidati da passare al riassunto.
 */

const KEYWORDS: { pattern: RegExp; weight: number }[] = [
  // Giovani, scuola e orientamento: il pubblico del sito, valgono di più.
  { pattern: /\bgiovan[ie]\b|\bragazz[ie]\b|\bstudent[ie]\b|\bneet\b/i, weight: 3 },
  { pattern: /\byouth\b|\byoung (people|workers)\b|\bstudents?\b|\bneets?\b/i, weight: 3 },
  { pattern: /orientament|\bscuol[ae]\b|istruzione|\bits academy\b|universit|laure[ai]|diplom/i, weight: 2 },
  { pattern: /\beducation\b|\bschools?\b|\bvocational\b|\bapprentice/i, weight: 2 },
  { pattern: /apprendist|tirocin|\bstage\b|alternanza|\bpcto\b/i, weight: 2 },
  // Lavoro e mercato del lavoro.
  { pattern: /lavor[oia]|occupa[tz]|disoccupa|impieg|assunzion|professioni|mestier/i, weight: 2 },
  { pattern: /\bjobs?\b|employ|unemploy|\blabou?r\b|\bworkers?\b|\bworkforce\b|\bcareers?\b|\bhiring\b/i, weight: 2 },
  { pattern: /competenz|\bskill|formazione|riqualific|aggiornament/i, weight: 2 },
  { pattern: /\btraining\b|\breskill|\bupskill|\blifelong learning\b/i, weight: 2 },
  { pattern: /salari|stipend|retribu|\bwages?\b|\bpay gap\b/i, weight: 1 },
  // Intelligenza artificiale, digitale e transizione verde.
  { pattern: /intelligenza artificiale|\bartificial intelligence\b|automazion|automation|\bchatgpt\b|\bgenai\b/i, weight: 2 },
  // Sigle in maiuscolo: "ai" minuscolo in italiano è una preposizione.
  { pattern: /\b(AI|IA)\b/, weight: 2 },
  { pattern: /digital[ei]|digital skills|\bgreen jobs?\b|transizione (verde|ecologica)|green transition/i, weight: 1 },
];

/** Avvisi amministrativi e tecnici, poco utili per chi ha 12-16 anni. */
const PENALTIES: RegExp[] = [
  /\bconcors[oi]\b|\bbando\b|\bgara\b|graduatori|\btracce\b|\bavviso\b|convocazion|\bnomin[ae]\b/i,
  /infografic|versione accessibile|\bwebinar\b|\bcall for\b|\btender\b|\bvacanc(y|ies)\b/i,
  /\bborsa\b|\bspread\b|\bbtp\b|\btitoli di stato\b|\btassi\b|\bstock\b/i,
];

function keywordScore(text: string): number {
  let score = 0;
  for (const { pattern, weight } of KEYWORDS) {
    if (pattern.test(text)) score += weight;
  }
  return score;
}

/** Pertinenza: il titolo conta il doppio della descrizione. */
export function relevanceScore(title: string, description = ""): number {
  let score = keywordScore(title) * 2 + keywordScore(description);
  for (const penalty of PENALTIES) {
    if (penalty.test(title)) score -= 4;
  }
  return score;
}

/**
 * Prende gli elementi in ordine (già ordinati per pertinenza) con al massimo
 * `perSource` elementi per fonte, così un feed molto ricco non copre gli altri.
 */
export function capPerSource<T extends { source: { id: string } }>(
  items: T[],
  perSource: number,
  limit: number
): T[] {
  const counts = new Map<string, number>();
  const out: T[] = [];
  for (const item of items) {
    const n = counts.get(item.source.id) ?? 0;
    if (n >= perSource) continue;
    counts.set(item.source.id, n + 1);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

/** Soglia minima per i feed generici (keyword_filter = true). */
export const MIN_RELEVANCE = 2;

/** Soglia più alta quando si pubblica senza la scelta di Claude. */
export const MIN_RELEVANCE_EXTRACT = 6;

const STOPWORDS = new Set(
  (
    "il lo la i gli le un uno una di a da in con su per tra fra e o ed che del della dei degli delle al allo alla ai agli alle dal dalla nel nella nei sul sulla " +
    "the a an of to in on for and or with by from at is are as its new nuovo nuova"
  ).split(" ")
);

function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

/** Somiglianza di Jaccard tra due titoli (0-1). */
export function titleSimilarity(a: string, b: string): number {
  const ta = titleTokens(a);
  const tb = titleTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let common = 0;
  for (const w of ta) if (tb.has(w)) common++;
  return common / (ta.size + tb.size - common);
}

export const DUPLICATE_TITLE_THRESHOLD = 0.6;

/**
 * Tiene il primo elemento di ogni gruppo di duplicati (stesso URL o titolo
 * molto simile). L'ordine in ingresso decide chi resta: va passato già
 * ordinato per priorità.
 */
export function dedupe<T extends { url: string; title: string }>(
  items: T[],
  knownTitles: string[] = []
): { kept: T[]; dropped: number } {
  const kept: T[] = [];
  const seenUrls = new Set<string>();
  let dropped = 0;
  for (const item of items) {
    const similarToKept = kept.some(
      (k) => titleSimilarity(k.title, item.title) >= DUPLICATE_TITLE_THRESHOLD
    );
    const similarToKnown = knownTitles.some(
      (t) => titleSimilarity(t, item.title) >= DUPLICATE_TITLE_THRESHOLD
    );
    if (seenUrls.has(item.url) || similarToKept || similarToKnown) {
      dropped++;
      continue;
    }
    seenUrls.add(item.url);
    kept.push(item);
  }
  return { kept, dropped };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
}

/** Hash corto e stabile (FNV-1a) per rendere unici gli slug. */
export function shortHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36).slice(0, 6);
}
