export type NewsArticle = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  /** Nome della fonte, sempre mostrato con il link all'originale. */
  source: string;
  sourceUrl: string;
  /** True per le news pubblicate dal job settimanale. */
  auto?: boolean;
  /** Foto dell'articolo originale (credito: la fonte). */
  imageUrl?: string | null;
};

/**
 * News scritte a mano. I numeri sono stati ricontrollati sulle fonti
 * originali il 2 novembre 2026 (vedi docs/news-automation.md); le news
 * settimanali arrivano invece dal database (src/lib/news/repository.ts).
 */
export const newsArticles: NewsArticle[] = [
  {
    slug: "ai-crea-piu-lavori",
    title: "Future of Jobs 2025: entro il 2030 78 milioni di posti di lavoro in più",
    excerpt:
      "Il World Economic Forum prevede 170 milioni di nuovi lavori e 92 milioni sostituiti tra il 2025 e il 2030: un saldo di 78 milioni. Le professioni che crescono più in fretta sono legate a dati, AI e tecnologia.",
    content: `Il World Economic Forum prevede che tra il 2025 e il 2030 nel mondo nasceranno 170 milioni di nuovi posti di lavoro, mentre 92 milioni verranno sostituiti: un saldo positivo di 78 milioni. Intelligenza artificiale e trattamento delle informazioni, da sole, creeranno 11 milioni di posti e ne sostituiranno 9 milioni.

**I lavori in più rapida crescita**

Secondo il Future of Jobs Report 2025, le professioni che crescono più in fretta in percentuale sono:
- Specialisti in Big Data
- Ingegneri FinTech
- Specialisti in intelligenza artificiale e machine learning
- Sviluppatori di software e applicazioni
- Specialisti nella gestione della sicurezza

A guidare questa trasformazione sono il cambiamento tecnologico, la transizione verde e i cambiamenti demografici. L'86% delle aziende intervistate si aspetta che intelligenza artificiale e trattamento delle informazioni trasformino la propria attività entro il 2030.

**Competenze ibride, non solo tecniche**

Sette aziende su dieci considerano il pensiero analitico la competenza fondamentale. Seguono resilienza, flessibilità e agilità, poi leadership e influenza sociale. Le imprese si aspettano che il 39% delle competenze richieste oggi cambi o diventi superato entro il 2030: non basta saper usare uno strumento, serve saper ragionare, adattarsi e collaborare.

**E in Italia?**

Le imprese che operano in Italia prevedono una crescita netta per ingegneri della robotica, ingegneri delle energie rinnovabili e ingegneri ambientali, e quindi più domanda di competenze in AI, reti, cybersecurity e tutela dell'ambiente. L'85% di loro punta a far crescere le competenze dei propri dipendenti.`,
    category: "ai",
    date: "2025-01-07",
    source: "World Economic Forum — Future of Jobs Report 2025",
    sourceUrl: "https://reports.weforum.org/docs/WEF_Future_of_Jobs_Report_2025.pdf",
  },
  {
    slug: "competenze-2025",
    title: "LinkedIn: le competenze in più rapida crescita nel 2025 negli Stati Uniti",
    excerpt:
      "Al primo posto della classifica LinkedIn c'è l'AI Literacy. Secondo LinkedIn, entro il 2030 il 70% delle competenze usate nella maggior parte dei lavori cambierà.",
    content: `LinkedIn ha pubblicato la classifica "Skills on the Rise 2025", costruita analizzando le competenze richieste nelle assunzioni sulla piattaforma negli Stati Uniti. Al primo posto c'è l'AI Literacy: la capacità di comprendere, usare e valutare in modo critico gli strumenti di intelligenza artificiale.

**Le competenze in cima alla classifica**

1. AI Literacy
2. Conflict Mitigation (gestione dei conflitti)
3. Adaptability (adattabilità)
4. Process Optimization (ottimizzazione dei processi)
5. Innovative Thinking (pensiero innovativo)
6. Public Speaking (parlare in pubblico)

Accanto a una competenza tecnologica come l'AI Literacy compaiono soprattutto competenze umane: gestire i conflitti, adattarsi, proporre idee nuove, saper parlare davanti agli altri.

**La sfida del 2030**

LinkedIn stima che entro il 2030 il 70% delle competenze usate nella maggior parte dei lavori cambierà. Non vuol dire che i lavori spariranno, ma che chi lavora dovrà continuare ad aggiornarsi.

**Come prepararsi oggi**

Per chi si sta orientando, il messaggio è chiaro: pensiero critico, comunicazione e capacità di imparare cose nuove durano più a lungo di qualsiasi singolo strumento tecnologico.`,
    category: "skills",
    date: "2025-03-19",
    source: "LinkedIn News — Skills on the Rise 2025",
    sourceUrl:
      "https://www.linkedin.com/pulse/linkedin-skills-rise-2025-15-fastest-growing-us-linkedin-news-hy0le",
  },
  {
    slug: "green-jobs-futuro",
    title: "GreenItaly 2025: in Italia 3,3 milioni di green jobs, il 13,8% degli occupati",
    excerpt:
      "Nel 2024 i lavoratori con professioni legate alla transizione verde erano 3.298 mila, in crescita del 4,3% sul 2023. Ma per oltre la metà dei green jobs cercati le imprese faticano a trovare candidati.",
    content: `Nel 2024 in Italia i green jobs, cioè le professioni legate alla transizione verde, erano 3.298 mila: il 13,8% di tutti gli occupati, in crescita del 4,3% (+135 mila) rispetto al 2023. Lo dice il Rapporto GreenItaly 2025 di Fondazione Symbola e Unioncamere, arrivato alla sedicesima edizione.

**Le imprese cercano, ma non trovano**

Secondo il presidente di Unioncamere, Andrea Prete, le imprese incontrano difficoltà di reperimento per oltre la metà dei green jobs che cercano, e questo frena gli investimenti. Tra il 2019 e il 2024 più di un'impresa su tre (il 38,7% di quelle fuori dall'agricoltura, cioè 578.450) ha fatto investimenti green.

**Che lavori sono**

Tra le figure legate alla transizione verde ci sono tecnici dell'efficienza energetica e delle energie rinnovabili, esperti di economia circolare, agronomi e tecnici dell'agricoltura sostenibile, progettisti e installatori di impianti. Sono mestieri presenti in quasi tutti i settori: manifattura, edilizia, agricoltura, turismo.

**Le prospettive**

Le previsioni del Sistema Excelsior di Unioncamere per il 2025-2029 indicano che, nello scenario più favorevole, quasi 2,4 milioni di lavoratori dovranno avere competenze green almeno di livello intermedio.

**Perché ti riguarda**

La domanda c'è e le imprese faticano a trovare persone preparate: per chi si sta orientando, i percorsi tecnici e scientifici legati all'ambiente e all'energia sono una strada concreta.`,
    category: "jobs",
    date: "2025-11-11",
    source: "Fondazione Symbola e Unioncamere — Rapporto GreenItaly 2025",
    sourceUrl:
      "https://symbola.net/wp-content/uploads/2025/11/comunicatostampa2025-002.pdf",
  },
  {
    slug: "formazione-digitale-marche",
    title: "Fondo per la Repubblica Digitale: l'obiettivo è formare 100.000 persone entro il 2026",
    excerpt:
      "Il Fondo finanzia corsi gratuiti di competenze digitali per NEET, donne, disoccupati e lavoratori a rischio automazione. In Italia solo il 54,3% delle persone ha competenze digitali almeno di base.",
    content: `Il Fondo per la Repubblica Digitale finanzia progetti di formazione gratuita sulle competenze digitali. Con le sue risorse punta a raggiungere almeno 100.000 beneficiari entro il 2026. Per i bandi del 2025 sono stati stanziati 70 milioni di euro.

**Chi può partecipare**

I programmi si rivolgono soprattutto a:
- Giovani NEET (Not in Education, Employment or Training: né al lavoro né in studio o formazione)
- Donne, in particolare nei settori dove sono poco presenti
- Adulti disoccupati
- Lavoratori a rischio di sostituzione da automazione

**I contenuti formativi**

I percorsi vanno dalle competenze digitali di base a quelle avanzate: navigare in sicurezza, analizzare dati, programmare, usare gli strumenti di intelligenza artificiale.

**Perché serve**

Nel 2025, secondo Eurostat, solo il 54,3% delle persone tra 16 e 74 anni in Italia aveva competenze digitali almeno di base, contro il 60,4% della media dell'Unione europea. Il Fondo è una delle risposte a questo ritardo, accanto alle iniziative regionali per l'apprendistato e la formazione professionale.

**Come partecipare**

I bandi e i progetti finanziati sono pubblicati sul sito del Fondo per la Repubblica Digitale. Per i minorenni serve l'autorizzazione di un genitore o tutore.`,
    category: "training",
    date: "2024-09-21",
    source: "TiConsiglio — Fondo per la Repubblica Digitale",
    sourceUrl: "https://www.ticonsiglio.com/fondo-repubblica-digitale-formazione/",
  },
  {
    slug: "prompt-engineering",
    title: "Il Sole 24 Ore: il Prompt Engineer, figura chiave nell'era dell'AI",
    excerpt:
      "Un contributo pubblicato da Il Sole 24 Ore descrive il Prompt Engineer come una professione strategica. Gli annunci di lavoro che citano l'intelligenza artificiale sono quasi quintuplicati in due anni.",
    content: `Un contributo pubblicato su Il Sole 24 Ore descrive il Prompt Engineer come una figura chiave per gestire l'intelligenza artificiale nelle aziende.

**Cos'è un Prompt Engineer**

Il Prompt Engineer progetta, migliora e valuta le istruzioni (prompt) da dare ai modelli di intelligenza artificiale per ottenere risposte precise, utili e sicure. Non si tratta solo di "fare domande all'AI": bisogna capire come funzionano i modelli linguistici e tradurre esigenze complesse in istruzioni efficaci.

**Le competenze richieste**

Il profilo ideale unisce:
- Conoscenza di come funzionano i grandi modelli linguistici
- Ottime capacità linguistiche e comunicative
- Pensiero logico e strutturato
- Conoscenza del settore in cui si lavora (marketing, diritto, medicina...)
- Capacità di provare, verificare e correggere

**Il mercato**

L'articolo riporta che, secondo LinkedIn, gli annunci di lavoro che citano l'intelligenza artificiale sono quasi quintuplicati negli ultimi due anni.

**Un messaggio per chi si orienta**

Nell'era dell'AI le competenze umanistiche (linguaggio, logica, comunicazione) contano quanto quelle tecniche: anche chi non ha una formazione informatica può avvicinarsi a questo mondo.`,
    category: "ai",
    date: "2024-10-23",
    source: "Il Sole 24 Ore — The Prompt Engineer, a key figure in AI",
    sourceUrl:
      "https://en.ilsole24ore.com/art/the-prompt-engineer-key-figure-manage-challenges-of-artificial-intelligence-company-AFoifbqD",
  },
  {
    slug: "apprendistato-crescita",
    title: "INAPP: 583.548 apprendisti nel 2023, le Marche prime per apprendistato nell'artigianato",
    excerpt:
      "Il XXIII Rapporto INAPP sull'apprendistato conta in media 583.548 rapporti di lavoro nel 2023 (+2,4%). Crescono di più il primo livello (+9,4%) e il terzo (+17,5%). Nelle Marche il 33% degli apprendisti lavora in imprese artigiane.",
    content: `Il XXIII Rapporto di monitoraggio sull'apprendistato dell'INAPP (Istituto Nazionale per l'Analisi delle Politiche Pubbliche), pubblicato a settembre 2026, conta in Italia in media 583.548 rapporti di lavoro in apprendistato nel 2023, il 2,4% in più rispetto al 2022. Le assunzioni con questo contratto sono state 392.394, il 4,4% in meno dell'anno prima.

**I tre tipi di apprendistato**

- **Primo livello**: per ottenere una qualifica o un diploma professionale mentre si lavora. Nel 2023: +9,4%
- **Secondo livello** (professionalizzante): il più diffuso, quasi la totalità dei contratti (97,5%). Nel 2023: +2,2%
- **Terzo livello**: di alta formazione e ricerca. Nel 2023: +17,5%

**Le Marche e l'artigianato**

Nelle Marche nel 2023 i rapporti di apprendistato erano in media 20.883 (+1,5%). La regione ha la quota più alta d'Italia di apprendisti nelle imprese artigiane: il 33,0%, contro il 20,8% della media nazionale.

**Perché ti riguarda**

L'apprendistato permette di lavorare e studiare insieme, con un contratto e uno stipendio. Il primo livello, pensato per i più giovani, consente di prendere una qualifica o un diploma imparando direttamente in azienda: nelle Marche, dove l'artigianato pesa molto, è una strada concreta.`,
    category: "jobs",
    date: "2026-09-01", // il rapporto è datato "settembre 2026"
    source: "INAPP — XXIII Rapporto di monitoraggio sull'apprendistato (Ministero del Lavoro)",
    sourceUrl:
      "https://www.lavoro.gov.it/temi-e-priorita-orientamento-e-formazione/studi-e-statistiche/xxiii-rapporto-di-monitoraggio-2023-2024",
  },
];
