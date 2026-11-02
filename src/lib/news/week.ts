/**
 * Date in ora italiana (Europe/Rome) per il job settimanale delle news.
 * Il cron di Vercel gira in UTC: qui si converte senza dipendenze esterne,
 * gestendo ora legale e solare tramite Intl.
 */

export const NEWS_TIME_ZONE = "Europe/Rome";

/** Ora di pubblicazione (ora italiana) del lunedì. */
export const PUBLISH_HOUR = 8;

type LocalParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 1 = lunedì ... 7 = domenica
};

const WEEKDAYS: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

export function romeParts(date: Date): LocalParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: NEWS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekday: WEEKDAYS[get("weekday")] ?? 0,
  };
}

/** Scostamento di Roma da UTC in minuti in un dato istante (60 o 120). */
function romeOffsetMinutes(date: Date): number {
  const name =
    new Intl.DateTimeFormat("en-US", {
      timeZone: NEWS_TIME_ZONE,
      timeZoneName: "longOffset",
    })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT+01:00";
  const match = name.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!match) return 60;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

/** Istante UTC della mezzanotte italiana del giorno indicato. */
export function romeMidnight(year: number, month: number, day: number): Date {
  const guess = Date.UTC(year, month - 1, day);
  return new Date(guess - romeOffsetMinutes(new Date(guess)) * 60_000);
}

/** "YYYY-MM-DD" di un giorno di calendario (senza fuso). */
export function isoDay(year: number, month: number, day: number): string {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type NewsWeek = {
  /** Lunedì della settimana, "YYYY-MM-DD" (ora italiana). */
  weekStart: string;
  /** Domenica della settimana, "YYYY-MM-DD". */
  weekEnd: string;
  /** Inizio (incluso) e fine (esclusa) come istanti UTC. */
  from: Date;
  to: Date;
};

/** Settimana lun-dom che inizia il lunedì indicato. */
export function weekFromStart(weekStart: string): NewsWeek {
  const [y, m, d] = weekStart.split("-").map(Number);
  const next = addDays(weekStart, 7);
  const [ny, nm, nd] = next.split("-").map(Number);
  return {
    weekStart,
    weekEnd: addDays(weekStart, 6),
    from: romeMidnight(y, m, d),
    to: romeMidnight(ny, nm, nd),
  };
}

/** Settimana precedente (lun-dom) rispetto all'istante dato, in ora italiana. */
export function previousWeek(now: Date = new Date()): NewsWeek {
  const p = romeParts(now);
  const today = isoDay(p.year, p.month, p.day);
  const thisMonday = addDays(today, -(p.weekday - 1));
  return weekFromStart(addDays(thisMonday, -7));
}

/** True se `value` è un lunedì in formato YYYY-MM-DD. */
export function isMonday(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.getUTCDay() === 1;
}

/**
 * True se adesso a Roma è lunedì tra le 8:00 e le 8:59. Vercel lancia il cron
 * due volte (06:00 e 07:00 UTC): solo una delle due cade alle 8 italiane, a
 * seconda di ora legale o solare.
 */
export function isPublishWindow(now: Date = new Date()): boolean {
  const p = romeParts(now);
  return p.weekday === 1 && p.hour === PUBLISH_HOUR;
}
