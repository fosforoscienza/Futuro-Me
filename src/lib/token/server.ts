import { createHash, randomInt } from "node:crypto";
import { TOKEN_WORD_COUNT } from "./format";
import { TOKEN_WORDS } from "./words";

/** Nuovo token casuale (CSPRNG), già in forma canonica. */
export function generateToken(): string {
  return Array.from({ length: TOKEN_WORD_COUNT }, () => TOKEN_WORDS[randomInt(TOKEN_WORDS.length)]).join("-");
}

/**
 * Impronta salvata nel database al posto del token. SHA-256 senza segreto di
 * proposito: chi legge il database vede già le risposte, e un segreto ruotato
 * a metà anno renderebbe inutilizzabili tutti i fogli. Il nome dello studente
 * non entra mai nel sistema: sta solo sul foglio cartaceo.
 */
export function hashToken(canonical: string): string {
  return createHash("sha256").update(`questionario-token:v1:${canonical}`).digest("hex");
}
