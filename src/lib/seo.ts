import type { Metadata } from "next";
import { defaultLocale, locales } from "@/i18n/config";
import { BASE_URL, CONTACT_EMAIL, SITE_NAME } from "./constants";
import { CARIVERONA_URL, partners, type Partner } from "./partners";

/**
 * Metadata e dati strutturati (JSON-LD) condivisi da tutte le pagine pubbliche.
 * I testi arrivano dai messaggi o dai dati del sito: qui non si inventa nulla.
 */

const OG_LOCALE: Record<string, string> = { it: "it_IT", en: "en_GB" };

/** URL assoluto di una pagina: path "" per la home, altrimenti "/progetto" e simili. */
export function pageUrl(locale: string, path = ""): string {
  return `${BASE_URL}/${locale}${path}`;
}

/** hreflang per le lingue in cui la pagina esiste davvero, con x-default sulla lingua principale. */
export function languageAlternates(
  path: string,
  available: readonly string[] = locales
): Record<string, string> | undefined {
  if (available.length < 2) return undefined;
  const languages: Record<string, string> = {};
  for (const l of available) languages[l] = pageUrl(l, path);
  languages["x-default"] = pageUrl(available.includes(defaultLocale) ? defaultLocale : available[0], path);
  return languages;
}

type PageMetadataInput = {
  locale: string;
  path: string;
  title: string;
  description: string;
  /** Lingue in cui il contenuto esiste (default: tutte). */
  languages?: readonly string[];
  /** Lingua della versione canonica, se diversa da quella richiesta (news non tradotte). */
  canonicalLocale?: string;
  noindex?: boolean;
  /** Il titolo è già completo: non aggiungere " | Il Futuro Me". */
  absoluteTitle?: boolean;
  article?: { publishedTime: string; modifiedTime?: string; section?: string };
  /** Anteprima specifica della pagina (es. la card della news); default quella della lingua. */
  image?: { url: string; alt: string };
};

/** Immagine di condivisione della lingua (src/app/[locale]/opengraph-image.tsx). */
export function ogImageUrl(locale: string): string {
  return `${pageUrl(locale)}/opengraph-image`;
}

export const OG_IMAGE_ALT = "Il Futuro Me — Orientamento e Carriere per Giovani";

export function pageMetadata(input: PageMetadataInput): Metadata {
  const { locale, path, title, description, noindex, absoluteTitle, article } = input;
  const available = input.languages ?? locales;
  const canonical = pageUrl(input.canonicalLocale ?? locale, path);
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  // openGraph della pagina sostituisce quello ereditato (merge superficiale): senza
  // images esplicite le pagine interne resterebbero senza anteprima. Un
  // opengraph-image di un segmento figlio va quindi passato qui con `image`.
  const ogLocale = input.canonicalLocale ?? locale;
  const images = [
    {
      url: input.image?.url ?? ogImageUrl(ogLocale),
      width: 1200,
      height: 630,
      alt: input.image?.alt ?? OG_IMAGE_ALT,
    },
  ];

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
      languages: input.canonicalLocale ? undefined : languageAlternates(path, available),
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images,
      locale: OG_LOCALE[ogLocale] ?? OG_LOCALE[defaultLocale],
      alternateLocale: input.canonicalLocale
        ? undefined
        : available.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      ...(article
        ? {
            type: "article",
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime,
            section: article.section,
          }
        : { type: "website" }),
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

// --- JSON-LD ---------------------------------------------------------------

type Node = Record<string, unknown>;

export const ORGANIZATION_ID = `${BASE_URL}/#organization`;
export const WEBSITE_ID = `${BASE_URL}/#website`;
const LEAD_ID = `${BASE_URL}/#fondazione-caritas-senigallia`;
const FUNDER_ID = `${BASE_URL}/#fondazione-cariverona`;

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function partnerId(partner: Partner): string {
  return partner.group === "lead" ? LEAD_ID : `${BASE_URL}/#partner-${slug(partner.name)}`;
}

const PARTNER_TYPE: Record<Partner["group"], string> = {
  lead: "NGO",
  thirdSector: "NGO",
  schools: "EducationalOrganization",
  universities: "CollegeOrUniversity",
};

function partnerNode(partner: Partner): Node {
  return {
    "@type": PARTNER_TYPE[partner.group],
    "@id": partnerId(partner),
    name: partner.name,
    // Il sito ufficiale lega il nodo all'entità che i motori conoscono già.
    url: partner.url,
    sameAs: [partner.url],
    ...(partner.logo ? { logo: `${BASE_URL}${partner.logo.src}` } : {}),
    ...(partner.group === "lead"
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: "Senigallia",
            addressRegion: "AN",
            addressCountry: "IT",
          },
          email: CONTACT_EMAIL,
        }
      : {}),
  };
}

type SiteTexts = {
  description: string;
  fundedBy: string;
  audience: string;
};

/** Progetto, ente capofila, partner, finanziatore e sito: uguali su ogni pagina. */
export function siteGraph(texts: SiteTexts): Node[] {
  const lead = partners.find((p) => p.group === "lead")!;
  const others = partners.filter((p) => p.group !== "lead");

  return [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      alternateName: "Futuro Me",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        "@id": `${BASE_URL}/#logo`,
        url: `${BASE_URL}/icon-512.png`,
        width: 512,
        height: 512,
        caption: SITE_NAME,
      },
      image: { "@id": `${BASE_URL}/#logo` },
      description: texts.description,
      email: CONTACT_EMAIL,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "information",
        email: CONTACT_EMAIL,
        availableLanguage: ["it", "en"],
      },
      parentOrganization: { "@id": LEAD_ID },
      member: others.map((p) => ({ "@id": partnerId(p) })),
      funder: { "@id": FUNDER_ID },
      funding: {
        "@type": "Grant",
        name: texts.fundedBy,
        funder: { "@id": FUNDER_ID },
      },
      areaServed: [
        { "@type": "AdministrativeArea", name: "Provincia di Ancona" },
        { "@type": "City", name: "Senigallia" },
        { "@type": "City", name: "Arcevia" },
        { "@type": "City", name: "Ostra" },
      ],
      knowsLanguage: ["it", "en"],
      publishingPrinciples: pageUrl(defaultLocale, "/metodo"),
    },
    partnerNode(lead),
    ...others.map(partnerNode),
    {
      "@type": "Organization",
      "@id": FUNDER_ID,
      name: "Fondazione Cariverona",
      url: CARIVERONA_URL,
      sameAs: [CARIVERONA_URL],
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: BASE_URL,
      name: SITE_NAME,
      inLanguage: [...locales],
      publisher: { "@id": ORGANIZATION_ID },
      audience: {
        "@type": "PeopleAudience",
        audienceType: texts.audience,
        suggestedMinAge: 12,
        suggestedMaxAge: 16,
      },
    },
  ];
}

type Crumb = { name: string; path: string };

type WebPageInput = {
  locale: string;
  path: string;
  name: string;
  description: string;
  type?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";
  /** Briciole dopo la home, es. [{ name: "News", path: "/news" }]. */
  breadcrumbs?: Crumb[];
  homeName: string;
  extra?: Node;
};

/** Nodo WebPage con le sue briciole, da affiancare ai nodi specifici della pagina. */
export function webPageNodes(input: WebPageInput): Node[] {
  const url = pageUrl(input.locale, input.path);
  const crumbs = input.breadcrumbs ?? [];
  const nodes: Node[] = [
    {
      "@type": input.type ?? "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: input.name,
      description: input.description,
      inLanguage: input.locale,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      publisher: { "@id": ORGANIZATION_ID },
      ...(crumbs.length ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
      ...input.extra,
    },
  ];
  if (crumbs.length) {
    nodes.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [{ name: input.homeName, path: "" }, ...crumbs].map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: pageUrl(input.locale, c.path),
      })),
    });
  }
  return nodes;
}
