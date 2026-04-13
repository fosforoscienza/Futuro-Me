export type NewsArticle = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  source: string;
  sourceUrl: string;
};

export const newsArticles: NewsArticle[] = [
  {
    slug: "ai-crea-piu-lavori",
    title: "Future of Jobs 2025: l'AI creerà 78 milioni di posti netti",
    excerpt:
      "Il World Economic Forum prevede 170 milioni di nuovi lavori nei prossimi cinque anni, con un guadagno netto di 78 milioni di ruoli. Gli specialisti in AI e Big Data guidano la crescita.",
    content: `Il World Economic Forum prevede 170 milioni di nuovi lavori creati a livello globale nei prossimi cinque anni, con un guadagno netto di 78 milioni di ruoli dopo 92 milioni di sostituzioni. L'intelligenza artificiale e il trattamento dati da soli creeranno 11 milioni di nuovi ruoli, sostituendone 9 milioni.

**I lavori in più rapida crescita**

Secondo il Future of Jobs Report 2025, le professioni con la crescita più accelerata sono:
- Big Data Specialist
- Fintech Engineer
- Specialista AI e Machine Learning
- Tecnico per l'energia rinnovabile
- Ingegnere ambientale

A guidare questa trasformazione sono tre grandi forze: il cambiamento tecnologico (in particolare l'intelligenza artificiale generativa), la transizione verde e i cambiamenti demografici. Il 60% delle aziende intervistate prevede di trasformare le proprie operazioni entro il 2030 grazie all'AI.

**Competenze ibride, non solo tecniche**

Il dato più significativo riguarda le competenze: l'85% dei datori di lavoro globali identifica il pensiero analitico come la skill più importante. Seguono la resilienza, la flessibilità e l'alfabetizzazione tecnologica. Non basta quindi saper programmare: serve saper ragionare, adattarsi e comunicare.

**Cosa significa per i giovani italiani**

L'Italia si colloca in una posizione intermedia nella classifica globale: la domanda di profili tech è in forte crescita, ma il sistema formativo deve ancora adeguarsi. Chi investe oggi nello sviluppo di competenze digitali e trasversali si troverà in una posizione privilegiata nel mercato del lavoro di domani.`,
    category: "ai",
    date: "2025-01-07",
    source: "World Economic Forum — Future of Jobs Report 2025",
    sourceUrl:
      "https://www.weforum.org/stories/2025/01/future-of-jobs-report-2025-jobs-of-the-future-and-the-skills-you-need-to-get-them/",
  },
  {
    slug: "competenze-2025",
    title: "LinkedIn: le 15 competenze in più rapida crescita nel 2025",
    excerpt:
      "L'AI Literacy è al primo posto. LinkedIn avverte: entro il 2030, il 70% delle competenze richieste nei lavori attuali cambierà. La capacità di apprendere continuamente è la meta-competenza del decennio.",
    content: `LinkedIn ha pubblicato il suo primo ranking "Skills on the Rise 2025", stilato analizzando milioni di assunzioni avvenute sulla piattaforma negli ultimi dodici mesi. Al primo posto si trova l'AI Literacy — la capacità di comprendere, usare e valutare criticamente gli strumenti di intelligenza artificiale.

**Le competenze in cima alla classifica**

1. AI Literacy
2. Conflict Mitigation (gestione dei conflitti)
3. Process Optimization
4. Adaptability
5. Communication
6. Strategic Thinking

La presenza di competenze trasversali come la gestione dei conflitti e la comunicazione al fianco di skill tecniche conferma un trend chiaro: il mercato del lavoro del 2025 premia i profili che sanno combinare capacità umane e digitali.

**La sfida del 2030**

LinkedIn avverte che entro il 2030, il 70% delle competenze utilizzate nella maggior parte dei lavori cambierà. Questo non significa che i lavori spariranno, ma che ogni professionista dovrà continuare ad aggiornarsi per rimanere rilevante.

**Come prepararsi oggi**

Per i giovani che si stanno orientando, questo dato è una bussola preziosa: investire in competenze trasversali — pensiero critico, comunicazione, adattabilità — è più duraturo che specializzarsi in un singolo strumento tecnologico. La meta-competenza del decennio è la capacità di apprendere continuamente.`,
    category: "skills",
    date: "2025-03-19",
    source: "LinkedIn News — Skills on the Rise 2025",
    sourceUrl:
      "https://www.linkedin.com/pulse/linkedin-skills-rise-2025-15-fastest-growing-us-linkedin-news-hy0le",
  },
  {
    slug: "green-jobs-futuro",
    title: "Green Economy: 3,3 milioni di lavoratori verdi in Italia",
    excerpt:
      "Il settore green impiega già il 13,8% della forza lavoro italiana, con una crescita del 4,3% nel 2024. Entro il 2028 la domanda di profili sostenibili crescerà ulteriormente. Il problema? Le aziende faticano a trovarli.",
    content: `Il settore dell'economia verde impiega già 3,3 milioni di persone in Italia — il 13,8% di tutti i lavoratori — ed è cresciuto del 4,3% nel solo 2024. Questi i dati dell'Osservatorio Excelsior di Unioncamere, che fotografa una trasformazione strutturale del mercato del lavoro italiano.

**Le professioni verdi più richieste**

Secondo il Sistema Informativo Excelsior, le figure più ricercate nel settore sostenibile sono:
- Esperti in efficienza energetica
- Tecnici delle energie rinnovabili
- Specialisti in economia circolare
- Agronomi e tecnici dell'agricoltura sostenibile
- Consulenti ESG (Environmental, Social, Governance)

**Il gap di competenze**

Il dato più preoccupante viene da Manpower Italy: il 75% delle aziende italiane dichiara di fare fatica a trovare professionisti con competenze green adeguate. Questo crea un'opportunità concreta per chi oggi decide di formarsi in questi ambiti.

**Prospettive al 2028**

Le previsioni di Unioncamere indicano un aumento significativo delle assunzioni nelle rinnovabili, nell'economia circolare e nella mobilità sostenibile entro il 2028. I settori trainanti nella nostra regione — manifattura, turismo, agroalimentare — stanno tutti attraversando una transizione verde che richiede nuove figure professionali.

**Un'opportunità per i giovani marchigiani**

Per chi si sta orientando nelle Marche, i green jobs rappresentano una scelta che unisce impatto concreto e concrete opportunità occupazionali. La domanda c'è, le competenze si acquisiscono.`,
    category: "jobs",
    date: "2024-12-23",
    source: "Excelsior Orienta / Unioncamere — Green Economy",
    sourceUrl:
      "https://excelsiorienta.unioncamere.it/2024/12/23/green-economy-il-futuro-del-lavoro-sostenibile-in-italia/",
  },
  {
    slug: "formazione-digitale-marche",
    title: "Fondo per la Repubblica Digitale: 70 milioni per formare 100.000 giovani",
    excerpt:
      "Il programma PNRR stanzia 70 milioni di euro per la formazione digitale nel 2025, con focus su NEET, donne e lavoratori a rischio automazione. Obiettivo: 100.000 beneficiari entro il 2026.",
    content: `Il Fondo per la Repubblica Digitale ha stanziato 70 milioni di euro per i bandi 2025 dedicati alla formazione digitale dei cittadini. Il programma, inserito nel Piano Nazionale di Ripresa e Resilienza (PNRR), punta a raggiungere almeno 100.000 beneficiari entro il 2026.

**Chi può partecipare**

I programmi si rivolgono a categorie specifiche:
- Giovani NEET (Not in Education, Employment or Training) tra i 15 e i 34 anni
- Donne, specialmente in settori a bassa presenza femminile
- Adulti disoccupati
- Lavoratori a rischio di sostituzione da automazione

**I contenuti formativi**

I percorsi coprono competenze digitali di base e avanzate: dalla navigazione sicura in rete alla programmazione, dall'analisi dei dati all'utilizzo degli strumenti di intelligenza artificiale. L'obiettivo è ridurre il divario digitale tra le generazioni e le aree geografiche.

**Il contesto nazionale e locale**

L'Italia si colloca al terzultimo posto in Europa per competenze digitali della popolazione adulta (fonte: DESI 2024). Il Fondo per la Repubblica Digitale è una risposta strutturale a questo ritardo. Per le Marche, il programma si affianca alle iniziative regionali per l'apprendistato e la formazione professionale, offrendo ai giovani locali un canale di accesso gratuito alla formazione digitale.

**Come partecipare**

I bandi sono pubblicati sul portale del Fondo per la Repubblica Digitale. La selezione avviene tramite domanda online; per i minorenni è richiesta l'autorizzazione di un genitore o tutore.`,
    category: "training",
    date: "2024-09-21",
    source: "TiConsiglio — Fondo per la Repubblica Digitale",
    sourceUrl: "https://www.ticonsiglio.com/fondo-repubblica-digitale-formazione/",
  },
  {
    slug: "prompt-engineering",
    title: "Il Sole 24 Ore: il Prompt Engineer, figura chiave nell'era AI",
    excerpt:
      "Il principale quotidiano economico italiano profila il Prompt Engineer come professione strategica emergente. In Italia le offerte di lavoro con AI sono quintuplate in due anni. Stipendi tra 35.000 e 120.000 euro.",
    content: `Il Sole 24 Ore dedica un'analisi approfondita al Prompt Engineer, definendolo una figura chiave per gestire le sfide dell'intelligenza artificiale in azienda. È una delle prime trattazioni dettagliate di questa professione sul principale quotidiano economico italiano.

**Cos'è un Prompt Engineer**

Il Prompt Engineer è il professionista che progetta, ottimizza e valuta le istruzioni (prompt) da dare ai modelli di intelligenza artificiale per ottenere output precisi, utili e sicuri. Non si tratta solo di "fare domande all'AI", ma di comprendere in profondità il funzionamento dei modelli linguistici e tradurre esigenze aziendali complesse in istruzioni efficaci.

**Le competenze richieste**

Secondo Il Sole 24 Ore, il profilo ideale combina:
- Conoscenza tecnica dei Large Language Models
- Forte capacità linguistica e comunicativa
- Pensiero logico e strutturato
- Conoscenza del dominio applicativo (marketing, legale, medicina, ecc.)
- Capacità di testing e iterazione sistematica

**Il mercato in Italia**

I dati citati dall'articolo sono significativi: le offerte di lavoro che menzionano l'AI in Italia sono aumentate di quasi cinque volte in due anni. Gli stipendi per i Prompt Engineer oscillano tra 35.000 e 120.000 euro annui a seconda del livello di esperienza e del settore.

**Un messaggio per chi si orienta**

Il Prompt Engineering dimostra che nell'era dell'AI le competenze umanistiche — linguaggio, logica, comunicazione — sono preziose quanto quelle tecniche. È una porta d'ingresso accessibile al mondo dell'intelligenza artificiale anche per chi non ha una formazione puramente informatica.`,
    category: "ai",
    date: "2024-10-23",
    source: "Il Sole 24 Ore — The Prompt Engineer, a key figure in AI",
    sourceUrl:
      "https://en.ilsole24ore.com/art/the-prompt-engineer-key-figure-manage-challenges-of-artificial-intelligence-company-AFoifbqD",
  },
  {
    slug: "apprendistato-crescita",
    title: "INAPP: 569.264 apprendisti in Italia, +14,8% nei percorsi formativi",
    excerpt:
      "Il 22° Rapporto INAPP sull'apprendistato registra 569.264 contratti attivi e 365.886 nuove assunzioni. I percorsi di primo livello crescono del 14,8%. Permane un forte divario Nord-Sud.",
    content: `Il 22° Rapporto Annuale sull'Apprendistato dell'INAPP (Istituto Nazionale per l'Analisi delle Politiche Pubbliche) registra 569.264 contratti di apprendistato attivi in Italia — un aumento del 4,5% rispetto al 2021 — con 365.886 nuove assunzioni nel periodo di riferimento.

**I tre tipi di apprendistato**

Il sistema italiano prevede tre percorsi:
- **Primo livello** (15-25 anni): per il conseguimento di una qualifica o diploma professionale. Crescita: +14,8%
- **Secondo livello** (18-29 anni): professionalizzante, il più diffuso. Stabile
- **Terzo livello** (18-29 anni): di alta formazione e ricerca. Crescita: +11%

L'aumento più significativo riguarda il primo livello, che avvicina i giovanissimi al mercato del lavoro attraverso un percorso che alterna scuola e azienda.

**Le conversioni a tempo indeterminato**

Un dato incoraggiante: 114.554 contratti di apprendistato si sono trasformati in rapporti di lavoro a tempo indeterminato. L'apprendistato si conferma quindi non solo come porta d'ingresso, ma come canale privilegiato per una occupazione stabile.

**Il divario geografico**

Il rapporto evidenzia una criticità strutturale: quasi il 90% degli apprendisti di primo livello è concentrato nel Nord Italia. Il Centro e il Sud, incluse le Marche, mostrano tassi di utilizzo ancora bassi, nonostante le risorse disponibili. Questo rappresenta un'opportunità per le aziende locali che decidono di investire nell'apprendistato come strumento di formazione.

**Come funziona l'apprendistato nelle Marche**

Nella nostra regione, la Camera di Commercio delle Marche supporta le aziende che attivano contratti di apprendistato con incentivi economici e supporto alla formazione. Per i giovani tra i 15 e i 29 anni, è uno strumento concreto per entrare nel mondo del lavoro imparando direttamente sul campo.`,
    category: "jobs",
    date: "2024-11-21",
    source: "Teleborsa — 22° Rapporto INAPP sull'Apprendistato",
    sourceUrl:
      "https://www.teleborsa.it/News/2024/11/21/crescita-dell-occupazione-in-apprendistato-dati-positivi-e-sfide-territoriali-45.html",
  },
];

export function getArticleBySlug(slug: string): NewsArticle | undefined {
  return newsArticles.find((a) => a.slug === slug);
}
