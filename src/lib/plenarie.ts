/**
 * Calendario della prima Plenaria nelle scuole (novembre 2026), come comunicato
 * dalla segreteria del progetto. Orari in ora italiana.
 */

export type PlenarySlot = {
  from: string;
  to: string;
  /** Anno delle classi: 2 = seconde, 3 = terze. */
  year: 2 | 3;
  /** Numero di classi, se indicato. */
  classes?: number;
  /** Gruppo di classi (1 = primo, 2 = secondo), quando la scuola è divisa in turni. */
  group?: 1 | 2;
};

export type Plenary = {
  /** Giorno, YYYY-MM-DD. */
  date: string;
  school: string;
  /** Nome ufficiale della scuola partner (src/lib/partners.ts), per i dati strutturati. */
  partner: string;
  /** Comune dell'incontro, solo se certo: nel nome della scuola e senza un luogo diverso. */
  town?: string;
  /** Luogo, se diverso dalla scuola. */
  place?: string;
  slots: PlenarySlot[];
  /** Totale classi della giornata, quando la scuola l'ha indicato per tutta la mattina. */
  totalClasses?: number;
};

export const FIRST_PLENARY: Plenary[] = [
  {
    date: "2026-11-03",
    school: "Fagnani",
    partner: "IC Senigallia Centro – Fagnani",
    place: "San Rocco",
    slots: [{ from: "8:30", to: "10:30", year: 2, classes: 6 }],
  },
  {
    date: "2026-11-04",
    school: "Ostra",
    partner: "Istituto Comprensivo Ostra",
    town: "Ostra",
    slots: [
      { from: "9:00", to: "10:30", year: 3, classes: 3 },
      { from: "10:30", to: "12:00", year: 2, classes: 3 },
    ],
  },
  {
    date: "2026-11-09",
    school: "Corinaldesi Padovano",
    partner: "IIS Corinaldesi Padovano",
    totalClasses: 10,
    slots: [
      { from: "9:00", to: "10:40", year: 2 },
      { from: "11:00", to: "12:45", year: 2 },
    ],
  },
  {
    date: "2026-11-10",
    school: "Liceo Medi",
    partner: "Liceo Scientifico Enrico Medi",
    slots: [
      { from: "9:00", to: "11:00", year: 2, group: 1 },
      { from: "11:00", to: "13:00", year: 2, group: 2 },
    ],
  },
];

/** Data di oggi a Roma, YYYY-MM-DD. */
export function todayInRome(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(now);
}

/** Stato di ogni giornata rispetto a oggi: passata, oggi, la prossima o più avanti. */
export function plenaryStatus(dates: string[], today = todayInRome()) {
  const next = dates.find((d) => d > today);
  return dates.map((d) =>
    d < today ? "past" : d === today ? "today" : d === next ? "next" : "later"
  ) as ("past" | "today" | "next" | "later")[];
}
