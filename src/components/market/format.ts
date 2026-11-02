const LOCALES: Record<string, string> = { it: "it-IT", en: "en-GB" };

/** Numero formattato come lo scrive la lingua della pagina: 157.100 e 10,8 in italiano. */
export function formatNumber(value: number, locale: string, decimals = 0) {
  return new Intl.NumberFormat(LOCALES[locale] ?? locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
