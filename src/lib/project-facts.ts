import { partners, type PartnerGroup } from "./partners";
import { FIRST_PLENARY } from "./plenarie";

type Translate = (key: string, values?: Record<string, string>) => string;

const DATE_LOCALES: Record<string, string> = { it: "it-IT", en: "en-GB" };

export function listOf(items: string[], locale: string): string {
  return new Intl.ListFormat(DATE_LOCALES[locale] ?? locale, { style: "long", type: "conjunction" }).format(items);
}

/** Nomi dei partner di un gruppo: "a e b", oppure "a, b, c" tra parentesi (`plain`). */
export function partnerNames(group: PartnerGroup, locale: string, plain = false): string {
  const names = partners.filter((p) => p.group === group).map((p) => p.name);
  return plain ? names.join(", ") : listOf(names, locale);
}

/** "3, 4, 9 e 10 novembre 2026": giorni della prima Plenaria, mese e anno dell'ultima data. */
export function plenaryDates(locale: string): string {
  const days = FIRST_PLENARY.map((p) => p.date);
  const last = new Date(`${days[days.length - 1]}T12:00:00Z`);
  const monthYear = last.toLocaleDateString(DATE_LOCALES[locale] ?? locale, {
    month: "long",
    year: "numeric",
    timeZone: "Europe/Rome",
  });
  return `${listOf(days.map((d) => String(Number(d.slice(8)))), locale)} ${monthYear}`;
}

/**
 * Riepilogo citabile (chi, cosa, dove, quando) della pagina Progetto, riusato da
 * llms.txt. `t` è il traduttore del namespace "project".
 */
export function projectFaq(t: Translate, locale: string): { q: string; a: string }[] {
  return [
    { q: t("faq.whatQ"), a: t("faq.whatA") },
    {
      q: t("faq.whoQ"),
      a: t("faq.whoA", {
        thirdSector: partnerNames("thirdSector", locale),
        schools: partnerNames("schools", locale, true),
        universities: partnerNames("universities", locale, true),
      }),
    },
    { q: t("faq.whereQ"), a: t("faq.whereA") },
    { q: t("faq.whenQ"), a: t("faq.whenA", { dates: plenaryDates(locale) }) },
    { q: t("faq.doQ"), a: t("wp1Desc") },
    { q: t("faq.fundQ"), a: t("faq.fundA") },
  ];
}
