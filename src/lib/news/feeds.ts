import { XMLParser } from "fast-xml-parser";
import { romeMidnight } from "./week";

/** Elemento di un feed RSS/Atom, normalizzato. */
export type FeedItem = {
  title: string;
  url: string;
  description: string;
  publishedAt: Date | null;
  /** Immagine indicata dal feed (enclosure, media:content, prima <img>). */
  imageUrl: string | null;
};

export const USER_AGENT =
  "Mozilla/5.0 (compatible; IlFuturoMeBot/1.0; +https://www.ilfuturome.it)";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: false,
  processEntities: true,
  htmlEntities: true,
  trimValues: true,
  parseTagValue: false,
});

/** fetch con timeout e user agent del sito. */
export async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  accept = "*/*"
): Promise<Response> {
  return fetch(url, {
    headers: { "user-agent": USER_AGENT, accept },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/** Testo di un nodo che può essere stringa, numero o { "#text": ... }. */
function text(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return text(value[0]);
  if (typeof value === "object" && "#text" in (value as object)) {
    return text((value as Record<string, unknown>)["#text"]);
  }
  return "";
}

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  egrave: "è",
  eacute: "é",
  agrave: "à",
  ograve: "ò",
  ugrave: "ù",
  igrave: "ì",
  Egrave: "È",
};

export function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n =
        code[1] === "x" || code[1] === "X"
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return HTML_ENTITIES[code] ?? match;
  });
}

/** Toglie tag HTML, script/style e spazi superflui. */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h\d)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

const IT_MONTHS: Record<string, number> = {
  gennaio: 1,
  febbraio: 2,
  marzo: 3,
  aprile: 4,
  maggio: 5,
  giugno: 6,
  luglio: 7,
  agosto: 8,
  settembre: 9,
  ottobre: 10,
  novembre: 11,
  dicembre: 12,
};

/** Istante UTC di un'ora locale italiana. */
function romeLocal(y: number, m: number, d: number, hh = 12, mm = 0): Date {
  return new Date(romeMidnight(y, m, d).getTime() + (hh * 60 + mm) * 60_000);
}

/**
 * Date dei feed: RFC 822 e ISO 8601, più due formati non standard visti nei
 * feed istituzionali italiani: "02/11/2026" (INPS) e
 * "Sabato, ottobre 31, 2026 - 14:37" (Ministero del Lavoro), in ora italiana.
 */
export function parseFeedDate(value: unknown): Date | null {
  const raw = text(value).trim();
  if (!raw) return null;

  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (dmy) {
    const [, d, m, y, hh, mm] = dmy;
    return romeLocal(+y, +m, +d, hh ? +hh : 12, mm ? +mm : 0);
  }

  const lower = raw.toLowerCase();
  const month = Object.keys(IT_MONTHS).find((name) => lower.includes(name));
  if (month) {
    const day = lower.match(new RegExp(`${month}\\s+(\\d{1,2})|(\\d{1,2})\\s+${month}`));
    const year = lower.match(/\b(\d{4})\b/);
    const time = lower.match(/\b(\d{1,2}):(\d{2})\b/);
    const d = Number(day?.[1] ?? day?.[2]);
    if (d && year) {
      return romeLocal(
        Number(year[1]),
        IT_MONTHS[month],
        d,
        time ? Number(time[1]) : 12,
        time ? Number(time[2]) : 0
      );
    }
  }

  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function atomLink(link: unknown): string {
  const links = asArray(link as Record<string, unknown> | string | null);
  const isObject = (l: unknown): l is Record<string, unknown> =>
    typeof l === "object" && l !== null;
  const alternate =
    links.find((l) => isObject(l) && (!l["@_rel"] || l["@_rel"] === "alternate")) ??
    links[0];
  if (typeof alternate === "string") return alternate;
  if (isObject(alternate)) return text(alternate["@_href"]) || text(alternate);
  return "";
}

/** Solo URL http(s) assoluti, risolti rispetto alla pagina. */
export function absoluteImageUrl(value: string | null | undefined, base: string): string | null {
  if (!value) return null;
  try {
    const u = new URL(decodeEntities(value.trim()), base);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Immagine di un elemento del feed: enclosure, media:content/thumbnail o prima <img>. */
function feedImage(raw: Record<string, unknown>, html: string, base: string): string | null {
  const candidates: unknown[] = [
    ...asArray(raw.enclosure as Record<string, unknown> | Record<string, unknown>[]).filter(
      (e) => !e["@_type"] || String(e["@_type"]).startsWith("image")
    ),
    ...asArray(raw["media:content"] as Record<string, unknown> | Record<string, unknown>[]).filter(
      (m) => !m["@_medium"] || m["@_medium"] === "image"
    ),
    ...asArray(raw["media:thumbnail"] as Record<string, unknown> | Record<string, unknown>[]),
  ];
  for (const c of candidates) {
    if (c && typeof c === "object") {
      const url = absoluteImageUrl(text((c as Record<string, unknown>)["@_url"]), base);
      if (url) return url;
    }
  }
  const img = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  return absoluteImageUrl(img, base);
}

/** Converte l'XML di un feed RSS 2.0, RSS 1.0 (RDF) o Atom in elementi. */
export function parseFeed(xml: string, baseUrl: string): FeedItem[] {
  const doc = parser.parse(xml) as Record<string, Record<string, unknown>>;

  let rawItems: Record<string, unknown>[] = [];
  let atom = false;
  if (doc.rss) {
    const channel = doc.rss.channel as Record<string, unknown> | undefined;
    rawItems = asArray(channel?.item as Record<string, unknown>[]);
  } else if (doc["rdf:RDF"]) {
    rawItems = asArray(doc["rdf:RDF"].item as Record<string, unknown>[]);
  } else if (doc.feed) {
    atom = true;
    rawItems = asArray(doc.feed.entry as Record<string, unknown>[]);
  } else {
    throw new Error("Formato non riconosciuto (né RSS né Atom)");
  }

  const items: FeedItem[] = [];
  for (const raw of rawItems) {
    const title = htmlToText(text(raw.title));
    const link = atom
      ? atomLink(raw.link)
      : text(raw.link) || text(raw.guid) || atomLink(raw.link);
    if (!title || !link) continue;

    let url: string;
    try {
      url = new URL(link.trim(), baseUrl).toString();
    } catch {
      continue;
    }

    const rawHtml =
      text(raw["content:encoded"]) ||
      text(raw.description) ||
      text(raw.summary) ||
      text(raw.content);
    const description = htmlToText(rawHtml);

    items.push({
      title,
      url,
      description,
      publishedAt: parseFeedDate(
        raw.pubDate ??
          raw.pubdate ??
          raw["dc:date"] ??
          raw.published ??
          raw.updated ??
          raw["a10:updated"]
      ),
      imageUrl: feedImage(raw, rawHtml, url),
    });
  }
  return items;
}

/**
 * Scarica un feed e, se `pages` > 1, anche le pagine successive dei feed
 * WordPress (?paged=2, 3, ...), che espongono solo gli ultimi 10 elementi.
 */
export async function fetchFeedPages(feedUrl: string, pages = 1): Promise<FeedItem[]> {
  const items = await fetchFeed(feedUrl);
  for (let page = 2; page <= Math.min(pages, 5); page++) {
    const url = new URL(feedUrl);
    url.searchParams.set("paged", String(page));
    try {
      const more = await fetchFeed(url.toString());
      if (more.length === 0) break;
      items.push(...more);
    } catch {
      break; // pagina inesistente: ci si ferma
    }
  }
  return items;
}

/** Scarica e interpreta un feed. */
export async function fetchFeed(feedUrl: string): Promise<FeedItem[]> {
  const res = await fetchWithTimeout(
    feedUrl,
    20_000,
    "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5"
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  return parseFeed(xml, feedUrl);
}

export type ArticlePage = { text: string; imageUrl: string | null };

/** Valore di un meta tag (property o name), in qualsiasi ordine di attributi. */
function metaContent(html: string, names: string[]): string | null {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`,
      "i"
    );
    const m = html.match(re);
    if (m) return m[1] ?? m[2] ?? null;
  }
  return null;
}

/**
 * Pagina dell'articolo: testo leggibile (meta description + paragrafi), usato
 * per riassumere con più contesto del feed, e immagine di copertina
 * (og:image / twitter:image).
 */
export async function fetchArticlePage(url: string, maxChars = 6000): Promise<ArticlePage> {
  try {
    const res = await fetchWithTimeout(url, 12_000, "text/html");
    if (!res.ok) return { text: "", imageUrl: null };
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) return { text: "", imageUrl: null };
    const html = (await res.text()).slice(0, 1_500_000);
    const meta = metaContent(html, ["og:description", "description"]) ?? "";
    const imageUrl = absoluteImageUrl(
      metaContent(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]),
      res.url || url
    );
    const body =
      html.match(/<article[\s\S]*?<\/article>/i)?.[0] ??
      html.match(/<main[\s\S]*?<\/main>/i)?.[0] ??
      html;
    const paragraphs = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => htmlToText(m[1]).replace(/\s+/g, " "))
      // Scarta etichette di interfaccia, firme e didascalie brevi.
      .filter((p) => p.length > 80);
    const unique = [...new Set([decodeEntities(meta), ...paragraphs])].filter(Boolean);
    return { text: unique.join("\n").slice(0, maxChars), imageUrl };
  } catch {
    return { text: "", imageUrl: null };
  }
}

/** URL senza parametri di tracciamento, frammento e slash finale. */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|mc_|ref$|source$)/i.test(key)) {
        u.searchParams.delete(key);
      }
    }
    let s = u.toString();
    if (s.endsWith("/") && u.pathname !== "/") s = s.slice(0, -1);
    return s;
  } catch {
    return url.trim();
  }
}
