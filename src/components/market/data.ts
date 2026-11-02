/**
 * Numeri della pagina Mercato del lavoro. I testi stanno in messages/<locale>.json
 * sotto "market"; qui solo valori e link, così ogni cifra resta legata alla sua fonte.
 */

export type SourceId = "excelsior" | "wef" | "eurostatNeet" | "eurostatUnemp" | "camcom";

export const SOURCE_URLS: Record<SourceId, string> = {
  excelsior:
    "https://excelsior.unioncamere.net/sites/default/files/pubblicazioni/2025/report_previsivo_2025-29_agg.pdf",
  wef: "https://reports.weforum.org/docs/WEF_Future_of_Jobs_Report_2025.pdf",
  eurostatNeet: "https://ec.europa.eu/eurostat/databrowser/view/edat_lfse_22/default/table",
  eurostatUnemp: "https://ec.europa.eu/eurostat/databrowser/view/lfst_r_lfu3rt/default/table",
  camcom:
    "https://www.marche.camcom.it/la-camera/novita-ed-eventi/novita/dataview-infografiche-e-dati-statistici-delleconomia-marchigiana/dataview-2026/mercato_del_lavoro_marche_dati_2025.pdf/view",
};

/** Excelsior, fabbisogni 2025-2029 per professione: scenario negativo e positivo. */
export const TOP_JOBS = [
  { key: "healthTech", low: 157_100, high: 166_700 },
  { key: "management", low: 102_600, high: 110_100 },
  { key: "marketTech", low: 84_600, high: 94_800 },
  { key: "engineers", low: 55_100, high: 61_300 },
  { key: "doctors", low: 55_000, high: 59_400 },
  { key: "appDev", low: 29_700, high: 31_600 },
] as const;

/** Excelsior, fabbisogno totale 2025-2029 (tab. 2.2) e quota per sostituire chi esce dal lavoro. */
export const JOBS_TOTAL = { low: 3_287_100, high: 3_695_500, replacementLow: 84, replacementHigh: 94 };

export type JobKey = (typeof TOP_JOBS)[number]["key"];

/** WEF Future of Jobs 2025: posti di lavoro nel mondo 2025-2030, in milioni. */
export const JOBS_BALANCE = { created: 170, displaced: 92, net: 78 };

/** WEF Future of Jobs 2025: quote su 100 imprese o competenze. */
export const AI_STEPS = [
  { key: "skillsChange", value: 39 },
  { key: "aiTransform", value: 86 },
  { key: "upskilling", value: 85 },
] as const;

/** WEF Future of Jobs 2025: % di imprese che considera la competenza fondamentale. */
export const CORE_SKILLS = [
  { key: "analytical", value: 69 },
  { key: "resilience", value: 67 },
  { key: "leadership", value: 61 },
  { key: "creative", value: 57 },
  { key: "motivation", value: 52 },
  { key: "techLiteracy", value: 51 },
] as const;

/** Eurostat, giovani 15-29 anni, valori in %. */
export const NEET = { marche: 10.8, italia: 13.3, ue: 11.0, marche2019: 15.3 };
export const UNEMPLOYMENT = { marche: 14.4, italia: 14.4, ue: 11.7, marche2024: 12.0 };

/** Camera di Commercio delle Marche, Dataview 2026, Provincia di Ancona, dati 2025. */
export const ANCONA = { hardToFill: 48.0, employment: 66.9 };

/** WEF Future of Jobs 2025, profilo Italia: competenze che cambiano entro il 2030. */
export const ITALY_SKILLS_CHANGE = 38;
