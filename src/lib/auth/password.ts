import { randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Password, username e codici classe. Solo node:crypto e nessun alias "@/":
 * lo importa anche scripts/staff-account.mjs.
 *
 * Hash: scrypt (N=2^15, r=8, p=1, 32 MB di memoria), sale casuale di 16 byte,
 * salvato come "scrypt$N$r$p$sale$hash" così i parametri si possono alzare
 * senza invalidare le password esistenti.
 */

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;
const MAX_MEM = 64 * 1024 * 1024;

export const USERNAME_PATTERN = /^[a-z0-9._]{3,24}$/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

function derive(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { N: n, r, p, maxmem: MAX_MEM }, (err, key) =>
      err ? reject(err) : resolve(key)
    )
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return ["scrypt", N, R, P, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const key = await derive(password, Buffer.from(salt, "base64url"), Number(n), Number(r), Number(p));
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Hash di una password a caso: per confrontare in tempo costante quando l'username non esiste. */
export const DUMMY_HASH =
  "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

/** Messaggio d'errore in chiave i18n, o null se va bene. */
export function usernameError(username: string): "usernameInvalid" | null {
  return USERNAME_PATTERN.test(username) ? null : "usernameInvalid";
}

// Le più usate in Italia e nel mondo (liste pubbliche di password trapelate),
// più nomi di squadre e parole del progetto: le prime che si provano su username
// facili da indovinare. Il confronto è in minuscolo e senza cifre/simboli finali.
const COMMON_PASSWORDS = new Set([
  "password", "passw0rd", "password1", "qwerty", "qwertyui", "qwertyuiop", "asdfghjk",
  "asdfghjkl", "zxcvbnm", "iloveyou", "ciaociao", "ciao", "amore", "amoremio", "tiamo",
  "ti amo", "letmein", "welcome", "admin", "administrator", "login", "accesso",
  "segreto", "segreta", "nonloso", "nonlaso", "boh", "cambiami", "changeme", "abc",
  "abcd", "football", "calcio", "pallone", "juventus", "juve", "forzajuve", "inter",
  "forzainter", "milan", "forzamilan", "napoli", "forzanapoli", "roma", "forzaroma",
  "lazio", "ancona", "senigallia", "marche", "italia", "scuola", "studente",
  "studentessa", "classe", "prof", "futuro", "futurome", "ilfuturome", "avatar",
  "pokemon", "minecraft", "fortnite", "roblox", "dragon", "princess", "sunshine",
  "monkey", "shadow", "master", "superman", "batman", "starwars", "whatever",
  "freedom", "hello", "trustno1", "computer", "internet", "samsung", "iphone",
  "google", "tiktok", "instagram",
]);

/** True per sequenze (12345678, abcdefgh, 87654321) o un solo carattere ripetuto. */
function isTrivialSequence(value: string): boolean {
  if (/^(.)\1+$/.test(value)) return true;
  const steps = new Set<number>();
  for (let i = 1; i < value.length; i++) steps.add(value.charCodeAt(i) - value.charCodeAt(i - 1));
  return steps.size === 1 && [...steps].every((s) => Math.abs(s) === 1);
}

/** Password facile da indovinare: comune, sequenza o costruita sull'username. */
export function isWeakPassword(password: string, username = ""): boolean {
  const lower = password.normalize("NFKC").toLowerCase();
  const core = lower.replace(/[^a-z\s]+$/, "").replace(/^[^a-z]+/, "");
  if (isTrivialSequence(lower) || isTrivialSequence(lower.replace(/\d+$/, ""))) return true;
  if (COMMON_PASSWORDS.has(lower) || (core.length > 0 && COMMON_PASSWORDS.has(core))) return true;
  return username.length >= 3 && lower.includes(username.toLowerCase());
}

export function passwordError(
  password: string,
  username = ""
): "passwordShort" | "passwordLong" | "passwordCommon" | null {
  if (password.length < PASSWORD_MIN) return "passwordShort";
  if (password.length > PASSWORD_MAX) return "passwordLong";
  if (isWeakPassword(password, username)) return "passwordCommon";
  return null;
}

// Senza caratteri che si confondono (0/O, 1/l/I) e facili da dettare.
const SYLLABLES = [
  "ba", "be", "bi", "bo", "bu", "da", "de", "di", "do", "du", "fa", "fe", "fi", "fo",
  "ga", "go", "gu", "ka", "ke", "ki", "ko", "ma", "me", "mi", "mo", "mu", "na", "ne",
  "ni", "no", "pa", "pe", "pi", "po", "ra", "re", "ri", "ro", "ru", "sa", "se", "si",
  "so", "ta", "te", "ti", "to", "tu", "va", "ve", "vi", "vo", "za", "ze", "zo",
];
const DIGITS = "23456789";

/** Password temporanea leggibile, es. "bamote-4827" (~37 bit). */
export function generatePassword(): string {
  const word = Array.from({ length: 3 }, () => SYLLABLES[randomInt(SYLLABLES.length)]).join("");
  const number = Array.from({ length: 4 }, () => DIGITS[randomInt(DIGITS.length)]).join("");
  return `${word}-${number}`;
}

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Codice classe, es. "3B-K7QM-X4PZ": il prefisso aiuta a riconoscerlo, il resto (~40 bit) lo rende non indovinabile. */
export function generateClassCode(className: string): string {
  const prefix = className.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "FM";
  const part = () =>
    Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
  return `${prefix}-${part()}-${part()}`;
}

export function normalizeClassCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}
