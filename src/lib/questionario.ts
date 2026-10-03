/**
 * Questionario anonimo "Il Futuro Me".
 *
 * Unica fonte per domande, opzioni e validazione: la usano sia il form
 * (client) sia la API route che salva le risposte (server).
 * Le colonne della tabella `questionario_risposte` corrispondono agli id
 * delle domande (q1…q26, q6_1…q6_8, q19_altro, q20_altro).
 */

export const QUESTIONARIO_VERSIONE = "2026-1";

export type Option = {
  /** Valore salvato nel database. */
  value: string;
  /** Testo mostrato (se diverso dal valore). */
  label?: string;
  /** Spiegazione breve sotto l'opzione. */
  hint?: string;
  /** Se scelta, chiede di specificare con un testo libero. */
  other?: boolean;
};

type BaseQuestion = {
  id: string;
  number: number;
  text: string;
  hint?: string;
  /** Mostra la domanda solo se la condizione è vera. */
  showIf?: (answers: Answers) => boolean;
};

export type SingleQuestion = BaseQuestion & {
  type: "single";
  options: Option[];
  /** Box informativi mostrati prima delle opzioni. */
  info?: { title: string; text: string }[];
};

export type RankingQuestion = BaseQuestion & {
  type: "ranking";
  options: Option[];
};

export type WordQuestion = BaseQuestion & {
  type: "word";
  placeholder: string;
};

export type Question = SingleQuestion | RankingQuestion | WordQuestion;

export type Section = {
  title: string;
  intro?: string;
  questions: Question[];
};

/** Risposte del form: stringa per scelta singola/parola, array per classifica. */
export type Answers = Record<string, string | string[] | undefined>;

const opts = (...values: string[]): Option[] => values.map((value) => ({ value }));

const PER_NIENTE_MOLTISSIMO = opts(
  "Per niente",
  "Poco",
  "Abbastanza",
  "Molto",
  "Moltissimo"
);

const ACCORDO = opts(
  "Per niente d'accordo",
  "Poco d'accordo",
  "Né d'accordo né in disaccordo",
  "D'accordo",
  "Del tutto d'accordo"
);

export const sections: Section[] = [
  {
    title: "Il mio futuro e il lavoro",
    questions: [
      {
        id: "q1",
        number: 1,
        type: "single",
        text: "Hai le idee chiare su come sarà la tua carriera futura?",
        options: opts("Per niente", "Poco", "Abbastanza", "Molto"),
      },
      {
        id: "q2",
        number: 2,
        type: "single",
        text: "Per te, nel tuo lavoro futuro, cosa sarà più importante?",
        options: opts(
          "Guadagnare molto",
          "Fare qualcosa che ti piace",
          "Avere molto tempo libero",
          "Aiutare gli altri",
          "Fare carriera e avere un ruolo di prestigio"
        ),
      },
      {
        id: "q3",
        number: 3,
        type: "single",
        text: "Pensi che per raggiungere i tuoi obiettivi lavorativi dovrai…",
        options: [
          { value: "Seguire un percorso universitario" },
          {
            value: "Frequentare corsi professionalizzanti",
            hint: "Corsi pratici, anche brevi, che insegnano un mestiere preciso (es. cuoco, elettricista, parrucchiere, grafico).",
          },
          { value: "Imparare sul “campo” iniziando a lavorare presto" },
          {
            value: "Creare qualcosa di mio",
            label: "Creare qualcosa di mio (es. attività autonoma, startup)",
          },
          { value: "Non ho ancora le idee chiare" },
        ],
      },
      {
        id: "q4",
        number: 4,
        type: "single",
        text: "Quali modalità di lavoro preferiresti?",
        info: [
          {
            title: "Il lavoratore dipendente",
            text: "Come un professore o un direttore di banca, sceglie maggiore sicurezza: ha un capo, orari stabiliti, ferie e malattia pagate e la certezza di ricevere ogni mese uno stipendio fisso. Però deve per forza rendere conto a un superiore e seguire regole decise da altri.",
          },
          {
            title: "Il lavoratore autonomo",
            text: "Come un fotografo o un avvocato, ha maggiore libertà: è il capo di se stesso e può organizzare le sue giornate come vuole. Il rovescio della medaglia è il rischio: non ha uno stipendio fisso, perché se non lavora non incassa, e dev'essere capace di cercare nuovi clienti in autonomia.",
          },
        ],
        options: opts("Lavoro da dipendente", "Lavoro autonomo", "Non lo so"),
      },
      {
        id: "q5",
        number: 5,
        type: "single",
        text: "Qual è l'area di lavoro/interesse che ti incuriosisce di più?",
        options: [
          {
            value: "Persone",
            label: "Lavorare con le Persone",
            hint: "es. curare, insegnare, gestire, aiutare",
          },
          {
            value: "Dati e Informazioni",
            label: "Lavorare con i Dati e le Informazioni",
            hint: "es. analizzare, programmare, ricercare",
          },
          {
            value: "Cose/Oggetti",
            label: "Lavorare con le Cose/Oggetti",
            hint: "es. costruire, riparare, progettare, creare fisicamente",
          },
          {
            value: "Animali o Natura",
            label: "Lavorare con Animali o Natura",
            hint: "es. veterinaria, agronomia, ambiente",
          },
          {
            value: "Idee e Creatività",
            label: "Lavorare con Idee e Creatività",
            hint: "es. arte, design, marketing, scrittura",
          },
        ],
      },
      {
        id: "q6",
        number: 6,
        type: "ranking",
        text: "Ordina le seguenti aree, da quella che ti interessa di più a quella che ti interessa di meno.",
        hint: "Tocca le aree nell'ordine che preferisci: la prima che scegli sarà la n° 1. Devi metterle in classifica tutte e 8.",
        options: [
          {
            value: "Ingegneria/Architettura",
            hint: "Costruire e progettare edifici, case, ponti, strade, automobili, oggetti; es. architetto, ingegnere, interior designer",
          },
          {
            value: "Scienza e Tecnologia",
            hint: "Scoprire come funzionano le cose e creare nuove tecnologie; es. chimico, biologo, informatico, sviluppatore di videogame",
          },
          {
            value: "Medicina e Sanità",
            hint: "Aiutare a mantenere in salute o a guarire le persone; es. medico, infermiere, farmacista",
          },
          {
            value: "Economia e Statistica",
            hint: "Gestire soldi, aziende e mercati; lavorare con numeri, dati, statistiche e percentuali; es. commercialista, broker, consulente finanziario",
          },
          {
            value: "Giuridica e Politico-Sociale",
            hint: "Far valere le regole e i diritti, fare politica, studiare come funziona la società; es. avvocato, notaio, sociologo",
          },
          {
            value: "Umanistica e Storico-Artistica",
            hint: "Lettere, storia, filosofia, lingue straniere, arte, musica e spettacolo; es. guida turistica, cantante, attore",
          },
          {
            value: "Educazione e Psicologia",
            hint: "Insegnare, educare e capire come funzionano la mente e le emozioni delle persone; es. assistente sociale, psicologo, professore",
          },
          {
            value: "Agraria e Veterinaria",
            hint: "Coltivare, prendersi cura dell'ambiente e degli animali; es. veterinario, agronomo, giardiniere, fioraio",
          },
        ],
      },
      {
        id: "q7",
        number: 7,
        type: "single",
        text: "Quanto è importante per te che il tuo futuro lavoro includa la tecnologia e il digitale?",
        options: opts(
          "Per niente importante",
          "Poco importante",
          "Abbastanza importante",
          "Molto importante",
          "È fondamentale"
        ),
      },
      {
        id: "q8",
        number: 8,
        type: "single",
        text: "Sai cosa si intende per materie STEM?",
        options: opts("Sì", "No", "Non sono del tutto certo/a"),
      },
      {
        id: "q9",
        number: 9,
        type: "single",
        text: "Terminata la scuola, ho già chiaro quello che voglio fare dopo.",
        options: opts("Sì", "No", "Non sono del tutto certo/a"),
      },
      {
        id: "q10",
        number: 10,
        type: "single",
        text: "Hai risposto “No” o “Non sono del tutto certo/a” alla domanda precedente: qual è il motivo principale?",
        showIf: (a) => a.q9 !== undefined && a.q9 !== "Sì",
        options: opts(
          "Non conosco abbastanza i lavori e i percorsi di studio che esistono",
          "Ho troppi interessi diversi e non riesco a sceglierne uno",
          "Ho paura di sbagliare scelta",
          "Non so ancora cosa mi piace o in cosa sono bravo/a",
          "Mi sembra troppo presto per decidere",
          "Sento la pressione della mia famiglia o degli altri e mi confonde"
        ),
      },
    ],
  },
  {
    title: "Il mio posto nel mondo",
    questions: [
      {
        id: "q11",
        number: 11,
        type: "single",
        text: "Dove vorrai vivere tra 15 anni?",
        options: opts(
          "Nella città o regione attuale",
          "In un'altra regione d'Italia",
          "In un altro Paese",
          "In giro per il mondo, lavorando online",
          "Non lo so"
        ),
      },
      {
        id: "q12",
        number: 12,
        type: "single",
        text: "Desideri fare un'esperienza significativa (studio o lavoro) all'estero della durata di almeno 1 anno?",
        options: opts(
          "Assolutamente no",
          "Probabilmente no",
          "Probabilmente sì",
          "Sicuramente sì"
        ),
      },
    ],
  },
  {
    title: "Relazioni e affetti",
    questions: [
      {
        id: "q13",
        number: 13,
        type: "single",
        text: "Nel tuo futuro ideale (tra 15 anni), che ruolo avrà la “famiglia”?",
        options: opts(
          "La cosa più importante sarà costruire e curare la mia famiglia",
          "Famiglia e carriera avranno esattamente lo stesso valore per me",
          "Il lavoro e i miei progetti avranno la precedenza sulla mia famiglia",
          "Immagino il mio futuro senza creare una mia famiglia",
          "Il mio punto di riferimento principale resteranno sempre i miei genitori (famiglia d'origine)",
          "Preferisco non rispondere"
        ),
      },
    ],
  },
  {
    title: "Il mio tempo",
    questions: [
      {
        id: "q14",
        number: 14,
        type: "single",
        text: "Immagina una tua settimana “ideale” tra 15 anni. Quanto tempo dedichi alle tue passioni e hobby (sport, arte, musica, volontariato, ecc.)?",
        options: [
          {
            value: "Pochissimo",
            label: "Pochissimo: lavoro e famiglia assorbiranno quasi tutto il mio tempo.",
          },
          {
            value: "Abbastanza",
            label: "Abbastanza: ritaglierò qualche ora la sera o nel fine settimana.",
          },
          {
            value: "Molto",
            label: "Molto: darò precedenza alle mie passioni, anche lavorando di meno.",
          },
          {
            value: "Lavoro e passione coincidono",
            label: "Il mio lavoro coinciderà con la mia grande passione.",
          },
          { value: "Non so" },
        ],
      },
    ],
  },
  {
    title: "Le mie capacità",
    questions: [
      {
        id: "q15",
        number: 15,
        type: "single",
        text: "Mi trovo bene a lavorare in gruppo con altre persone per raggiungere insieme un obiettivo.",
        options: PER_NIENTE_MOLTISSIMO,
      },
      {
        id: "q16",
        number: 16,
        type: "single",
        text: "Riesco a spiegare le mie idee in modo chiaro e ad ascoltare davvero gli altri quando parlano.",
        options: PER_NIENTE_MOLTISSIMO,
      },
      {
        id: "q17",
        number: 17,
        type: "single",
        text: "Quando non sono d'accordo con qualcuno, riesco a discuterne con calma per trovare una soluzione, senza litigare, né rinunciare subito.",
        options: PER_NIENTE_MOLTISSIMO,
      },
      {
        id: "q18",
        number: 18,
        type: "single",
        text: "Me la caverei bene nel guidare un gruppo, dando la carica agli altri e prendendo decisioni per la squadra.",
        options: PER_NIENTE_MOLTISSIMO,
      },
    ],
  },
  {
    title: "La mia visione",
    questions: [
      {
        id: "q19",
        number: 19,
        type: "single",
        text: "Per te “realizzarsi nella vita” significa soprattutto:",
        options: [
          ...opts(
            "Avere successo nel lavoro e guadagnare bene",
            "Essere sereno/a e felice con me stesso/a",
            "Avere relazioni solide (famiglia, amici, amore)",
            "Aiutare gli altri e lasciare un segno positivo nel mondo",
            "Essere libero/a di fare ciò che voglio, quando voglio"
          ),
          { value: "Altro", other: true },
        ],
      },
      {
        id: "q20",
        number: 20,
        type: "single",
        text: "Immagina di avere 35 anni. È un martedì sera qualunque. Cosa stai facendo che ti rende felice?",
        options: [
          ...opts(
            "Sto finendo un progetto di lavoro entusiasmante",
            "Sto cenando e chiacchierando con la mia famiglia/partner/amici",
            "Sto praticando il mio hobby preferito (es. sport, musica)",
            "Sto pianificando un viaggio",
            "Mi sto riposando sul divano",
            "Non lo so"
          ),
          { value: "Altro", other: true },
        ],
      },
    ],
  },
  {
    title: "Proiettarsi nel futuro",
    intro: "Per ogni frase indica quanto sei d'accordo.",
    questions: [
      {
        id: "q21",
        number: 21,
        type: "single",
        text: "La situazione economica e sociale in Italia oggi mi fa pensare che sarà difficile costruirsi un futuro qui.",
        options: ACCORDO,
      },
      {
        id: "q22",
        number: 22,
        type: "single",
        text: "Vedo i social media (influencer, creator) come un percorso credibile e veloce per realizzare successo e ricchezza senza grande sforzo formativo.",
        options: ACCORDO,
      },
      {
        id: "q23",
        number: 23,
        type: "single",
        text: "Vedo l'Intelligenza Artificiale e le nuove tecnologie digitali come strumenti che apriranno nuove opportunità stimolanti per la mia carriera futura.",
        options: ACCORDO,
      },
      {
        id: "q24",
        number: 24,
        type: "single",
        text: "Sono consapevole che tutto ciò che pubblico online (social, commenti) crea un'immagine di me che futuri datori di lavoro (ma non solo) potrebbero vedere.",
        options: ACCORDO,
      },
      {
        id: "q25",
        number: 25,
        type: "single",
        text: "Sono preoccupato/a che contenuti o post del mio passato (anche di anni fa) possano emergere e ostacolare il mio futuro (lavorativo o scolastico).",
        options: ACCORDO,
      },
      {
        id: "q26",
        number: 26,
        type: "word",
        text: "Qual è, oggi, la singola cosa che più ti spaventa o ti blocca quando pensi al tuo futuro ideale?",
        hint: "Puoi inserire solo UNA PAROLA.",
        placeholder: "Una parola",
      },
    ],
  },
];

export const allQuestions: Question[] = sections.flatMap((s) => s.questions);

export const OTHER_MAX_LENGTH = 200;
export const WORD_MAX_LENGTH = 40;

/** Una sola parola: lettere (anche accentate), apostrofo o trattino. */
const WORD_PATTERN = /^[\p{L}'’-]+$/u;

export function otherKey(questionId: string) {
  return `${questionId}_altro`;
}

export function isVisible(question: Question, answers: Answers) {
  return !question.showIf || question.showIf(answers);
}

/** Restituisce il messaggio di errore della domanda, o null se la risposta è valida. */
export function validateQuestion(
  question: Question,
  answers: Answers
): string | null {
  if (!isVisible(question, answers)) return null;
  const value = answers[question.id];

  if (question.type === "ranking") {
    const expected = question.options.map((o) => o.value);
    if (
      !Array.isArray(value) ||
      value.length !== expected.length ||
      new Set(value).size !== expected.length ||
      !value.every((v) => expected.includes(v))
    ) {
      return `Metti in classifica tutte le ${expected.length} aree.`;
    }
    return null;
  }

  if (typeof value !== "string" || value.trim() === "") {
    return question.type === "word"
      ? "Scrivi una parola."
      : "Scegli una risposta.";
  }

  if (question.type === "word") {
    const word = value.trim();
    if (word.length > WORD_MAX_LENGTH || !WORD_PATTERN.test(word)) {
      return "Scrivi una sola parola, senza spazi, numeri o simboli.";
    }
    return null;
  }

  const option = question.options.find((o) => o.value === value);
  if (!option) return "Scegli una risposta.";

  if (option.other) {
    const other = answers[otherKey(question.id)];
    if (typeof other !== "string" || other.trim() === "") {
      return "Specifica cosa intendi con “Altro”.";
    }
    if (other.trim().length > OTHER_MAX_LENGTH) {
      return `Usa al massimo ${OTHER_MAX_LENGTH} caratteri.`;
    }
  }
  return null;
}

export type RispostaRow = Record<string, string | null>;

/**
 * Valida tutte le risposte e le trasforma in una riga della tabella
 * `questionario_risposte`. Restituisce null se qualcosa non è valido.
 */
export function toRow(answers: Answers): RispostaRow | null {
  const row: RispostaRow = { versione: QUESTIONARIO_VERSIONE };

  for (const question of allQuestions) {
    if (validateQuestion(question, answers)) return null;

    if (!isVisible(question, answers)) {
      row[question.id] = null;
      continue;
    }

    const value = answers[question.id];
    if (question.type === "ranking") {
      (value as string[]).forEach((area, i) => {
        row[`${question.id}_${i + 1}`] = area;
      });
      continue;
    }

    row[question.id] = (value as string).trim();
    if (question.type === "single" && question.options.some((o) => o.other)) {
      const chosen = question.options.find((o) => o.value === value);
      row[otherKey(question.id)] = chosen?.other
        ? (answers[otherKey(question.id)] as string).trim()
        : null;
    }
  }

  return row;
}
