import { TOKEN_WORDS } from "./words";

/**
 * Token del questionario: 4 parole separate da trattini (es. "lupo-fiume-pane-treno").
 * Modulo usabile anche nel browser: niente node:crypto.
 */
export const TOKEN_WORD_COUNT = 4;
export const TOKEN_MAX_INPUT = 80;
/** Token generabili per una classe in una volta. */
export const MAX_TOKENS_PER_BATCH = 60;

const WORDS = new Set(TOKEN_WORDS);

/**
 * Forma canonica di un token scritto a mano: minuscole, accenti tolti,
 * qualunque separatore (spazi, trattini, punti). Null se non sono 4 parole
 * dell'elenco.
 */
export function normalizeToken(input: unknown): string | null {
  if (typeof input !== "string" || input.length > TOKEN_MAX_INPUT) return null;
  const words = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);
  if (words.length !== TOKEN_WORD_COUNT || !words.every((w) => WORDS.has(w))) return null;
  return words.join("-");
}
