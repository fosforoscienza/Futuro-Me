import { getTranslations } from "next-intl/server";
import {
  AI_STEPS,
  ANCONA,
  CORE_SKILLS,
  ITALY_SKILLS_CHANGE,
  JOBS_BALANCE,
  JOBS_TOTAL,
  NEET,
  SOURCE_URLS,
  TOP_JOBS,
  UNEMPLOYMENT,
  type SourceId,
} from "@/components/market/data";
import { formatNumber } from "@/components/market/format";
import { BASE_URL, CONTACT_EMAIL, SITE_NAME } from "./constants";
import { getAllNews } from "./news/repository";
import { partners, partnerGroups } from "./partners";
import { FIRST_PLENARY } from "./plenarie";
import { projectFaq } from "./project-facts";
import { pageUrl } from "./seo";

/**
 * llms.txt (https://llmstxt.org): descrizione del progetto per i motori AI, con
 * link alle pagine chiave. Solo contenuti già pubblicati nel sito, in italiano,
 * con i numeri accompagnati dalla loro fonte. `full` aggiunge testi completi e news.
 */
export async function buildLlmsTxt({ full }: { full: boolean }): Promise<string> {
  const locale = "it";
  const t = await getTranslations({ locale });
  const tp = await getTranslations({ locale, namespace: "project" });
  const tm = await getTranslations({ locale, namespace: "market" });
  const fmt = (v: number, dec = 0) => formatNumber(v, locale, dec);
  const src = (id: SourceId) => `Fonte: [${tm(`sources.${id}`)}](${SOURCE_URLS[id]})`;
  const news = await getAllNews(locale);
  // Senza l'ultima frase ("Queste sono le professioni..."): qui l'elenco non c'è.
  const jobsSummary = tm("jobs.desc", {
    low: fmt(JOBS_TOTAL.low / 1e6, 1),
    high: fmt(JOBS_TOTAL.high / 1e6, 1),
    replacementLow: fmt(JOBS_TOTAL.replacementLow),
    replacementHigh: fmt(JOBS_TOTAL.replacementHigh),
  }).replace(/\s[^.]+\.$/, "");

  const out: string[] = [];
  const add = (...lines: string[]) => out.push(...lines);

  add(
    `# ${SITE_NAME}`,
    "",
    `> ${tp("subtitle")} ${tp("overview")}`,
    "",
    `${SITE_NAME} (${BASE_URL}) è il sito del progetto: orientamento, mercato del lavoro spiegato con dati e fonti, news settimanali con il link all'articolo originale. Sito in italiano e in inglese.`,
    "",
    "## In breve",
    "",
    ...projectFaq(tp, locale).map((f) => `- **${f.q}** ${f.a}`),
    `- **Contatti:** ${CONTACT_EMAIL}, ${pageUrl(locale, "/contatti")}`,
    "",
    `## ${t("home.plenary.title")} (novembre 2026)`,
    "",
    ...FIRST_PLENARY.map((p) => {
      const day = new Date(`${p.date}T12:00:00Z`).toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Rome",
      });
      const slots = p.slots.map((s) => `${s.from}-${s.to}`).join(", ");
      return `- ${day}: ${p.partner}${p.place ? `, al ${p.place}` : ""} (${slots})`;
    }),
    "",
    "## Pagine principali",
    "",
    `- [Home](${pageUrl(locale)}): ${t("meta.description")}`,
    `- [${tp("title")}](${pageUrl(locale, "/progetto")}): ${tp("subtitle")}`,
    `- [${tm("title")}](${pageUrl(locale, "/mercato-lavoro")}): ${tm("subtitle")}`,
    `- [${t("news.title")}](${pageUrl(locale, "/news")}): ${t("news.subtitle")}`,
    `- [${t("contacts.metaTitle")}](${pageUrl(locale, "/contatti")}): ${t("contacts.metaDescription")}`,
    `- [${t("privacy.title")}](${pageUrl(locale, "/privacy")}): ${t("privacy.metaDescription")}`,
    "",
    "English version: " +
      [
        `[Home](${pageUrl("en")})`,
        `[The Project](${pageUrl("en", "/progetto")})`,
        `[Labour market](${pageUrl("en", "/mercato-lavoro")})`,
        `[News](${pageUrl("en", "/news")})`,
        `[Contacts](${pageUrl("en", "/contatti")})`,
      ].join(", "),
    "",
    "## Mercato del lavoro: numeri chiave",
    "",
    `- ${jobsSummary} ${src("excelsior")}`,
    `- Nel mondo, entro il 2030: ${fmt(JOBS_BALANCE.created)} milioni di posti nuovi, ${fmt(JOBS_BALANCE.displaced)} milioni che spariscono o vengono sostituiti, saldo +${fmt(JOBS_BALANCE.net)} milioni. ${src("wef")}`,
    `- NEET 15-29 anni nel 2025: Marche ${fmt(NEET.marche, 1)}%, Italia ${fmt(NEET.italia, 1)}%, UE ${fmt(NEET.ue, 1)}% (Marche 2019: ${fmt(NEET.marche2019, 1)}%). ${src("eurostatNeet")}`,
    `- Disoccupazione 15-29 anni nel 2025: Marche ${fmt(UNEMPLOYMENT.marche, 1)}%, Italia ${fmt(UNEMPLOYMENT.italia, 1)}%, UE ${fmt(UNEMPLOYMENT.ue, 1)}% (Marche 2024: ${fmt(UNEMPLOYMENT.marche2024, 1)}%). ${src("eurostatUnemp")}`,
    `- Provincia di Ancona, 2025: il ${fmt(ANCONA.hardToFill, 1)}% ${tm("local.ancona.title")} Occupazione 15-64 anni: ${fmt(ANCONA.employment, 1)}%. ${src("camcom")}`,
    ""
  );

  if (full) {
    add(
      `## ${tp("overviewTitle")}`,
      "",
      tp("overview"),
      "",
      `## ${tp("objectivesTitle")}`,
      "",
      ...[1, 2, 3].map((i) => `- **${tp(`obj${i}Title`)}:** ${tp(`obj${i}Desc`)}`),
      "",
      `## ${tp("phasesTitle")}`,
      "",
      ...[1, 2, 3, 4].map((i) => `- **WP${i} ${tp(`wp${i}Title`)}:** ${tp(`wp${i}Desc`)}`),
      "",
      `## ${t("footer.partnersTitle")}`,
      "",
      ...partnerGroups.map(
        (g) =>
          `- **${t(`footer.partnerGroups.${g}`)}:** ${partners
            .filter((p) => p.group === g)
            .map((p) => p.name)
            .join("; ")}`
      ),
      `- **${t("footer.supportTitle")}:** ${t("footer.cariveronaAlt")}. ${t("footer.fundedBy")}.`,
      "",
      `## ${tm("jobs.title")}`,
      "",
      ...TOP_JOBS.map(
        (j) =>
          `- ${tm(`jobs.items.${j.key}`)} (${tm(`jobs.hints.${j.key}`)}): da ${fmt(j.low)} a ${fmt(j.high)} lavoratori, 2025-2029`
      ),
      src("excelsior"),
      "",
      `## ${tm("ai.title")}`,
      "",
      ...AI_STEPS.map((a) => `- ${tm(`ai.${a.key}.title`)}: ${fmt(a.value)} su 100`),
      `- Competenze che cambiano entro il 2030 in Italia: ${fmt(ITALY_SKILLS_CHANGE)} su 100`,
      `- ${tm("skills.desc")}`,
      ...CORE_SKILLS.map((c) => `  - ${tm(`skills.items.${c.key}`)}: ${fmt(c.value)}%`),
      `- ${tm("skills.growing")}`,
      src("wef"),
      ""
    );
  }

  const shown = full ? news : news.slice(0, 10);
  add(full ? "## News" : "## Ultime news", "");
  for (const a of shown) {
    add(
      `- [${a.title}](${pageUrl("it", `/news/${a.slug}`)}) (${a.date}). Fonte: [${a.source}](${a.sourceUrl})` +
        (full ? `\n  ${a.excerpt}` : "")
    );
  }
  add("");

  if (!full) {
    add("## Optional", "", `- [Versione completa](${BASE_URL}/llms-full.txt): testi del progetto, partner, tutti i dati e tutte le news`, "");
  }

  return out.join("\n");
}

export function llmsResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
