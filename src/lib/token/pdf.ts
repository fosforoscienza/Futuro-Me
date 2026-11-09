/**
 * PDF dei token di una classe, costruito nel browser senza librerie: i token
 * in chiaro non tornano mai al server dopo la generazione.
 *
 * Pagine 1..n: foglio per gli psicologi (token + riga per il nome a mano).
 * Pagine seguenti: biglietti da ritagliare da dare agli studenti (solo token).
 * Font standard PDF (Helvetica, Courier) con WinAnsiEncoding: testo Latin-1.
 */

export type TokenPdfInput = {
  scuola: string;
  classe: string;
  /** Data di generazione già formattata, es. "9/11/2026". */
  data: string;
  tokens: string[];
  /** Indirizzo da stampare sui biglietti, senza protocollo. */
  url: string;
};

const PAGE_W = 595;
const PAGE_H = 842;
const ROWS_PER_SHEET = 25;
const SLIP_COLS = 2;
const SLIP_ROWS = 8;

type Font = "F1" | "F2" | "F3"; // Helvetica, Helvetica-Bold, Courier-Bold

/** Testo PDF letterale: solo Latin-1, con le parentesi e la barra protette. */
function pdfText(value: string): string {
  const latin = value
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[^ -~ -ÿ]/g, "?");
  return `(${latin.replace(/[\\()]/g, (c) => `\\${c}`)})`;
}

function text(font: Font, size: number, x: number, y: number, value: string): string {
  return `BT /${font} ${size} Tf ${x} ${y} Td ${pdfText(value)} Tj ET`;
}

function line(x1: number, y1: number, x2: number, y2: number): string {
  return `${x1} ${y1} m ${x2} ${y2} l S`;
}

function sheetPage(input: TokenPdfInput, page: number, pages: number, start: number): string {
  const ops = [
    "0 0 0 RG 0 0 0 rg 0.6 w",
    text("F2", 16, 40, 800, "Il Futuro Me - Foglio abbinamenti token"),
    text("F1", 10, 40, 782, `Scuola: ${input.scuola}  ·  Classe: ${input.classe}  ·  Generato il ${input.data}  ·  Pagina ${page} di ${pages}`),
    text("F1", 9, 40, 764, "Scrivi a mano nome e cognome accanto al token che consegni. I nomi non vanno mai scritti nel sito."),
    text("F1", 9, 40, 752, "Non fotografare, non scansionare e non copiare questo foglio. Conservalo chiuso a chiave fino al questionario"),
    text("F1", 9, 40, 740, "di fine progetto, poi distruggilo con un distruggidocumenti e firma il verbale di distruzione."),
    text("F2", 10, 40, 712, "N."),
    text("F2", 10, 70, 712, "Token"),
    text("F2", 10, 320, 712, "Nome e cognome (a mano)"),
    line(40, 706, 555, 706),
  ];
  input.tokens.slice(start, start + ROWS_PER_SHEET).forEach((token, i) => {
    const y = 684 - i * 24;
    ops.push(
      text("F1", 10, 40, y, String(start + i + 1)),
      text("F3", 11, 70, y, token),
      line(320, y - 3, 555, y - 3)
    );
  });
  ops.push(text("F1", 8, 40, 30, "I token non consegnati restano senza nome: vengono eliminati quando si chiudono gli abbinamenti."));
  return ops.join("\n");
}

function slipPage(input: TokenPdfInput, start: number): string {
  const cellW = (PAGE_W - 80) / SLIP_COLS;
  const cellH = 95;
  const top = 812;
  const ops = [
    "0 0 0 RG 0 0 0 rg",
    text("F1", 8, 40, 826, `Biglietti da ritagliare  ·  ${input.scuola}  ·  ${input.classe}`),
    "0.5 w [3 3] 0 d",
  ];
  input.tokens.slice(start, start + SLIP_COLS * SLIP_ROWS).forEach((token, i) => {
    const x = 40 + (i % SLIP_COLS) * cellW;
    const y = top - (Math.floor(i / SLIP_COLS) + 1) * cellH;
    ops.push(
      `${x} ${y} ${cellW} ${cellH} re S`,
      text("F2", 9, x + 12, y + cellH - 20, "Il Futuro Me - il tuo token"),
      text("F3", 11, x + 12, y + cellH - 46, token),
      text("F1", 8, x + 12, y + 26, `Vai su ${input.url} e scrivi le 4 parole.`),
      text("F1", 8, x + 12, y + 14, "Non scrivere il tuo nome su questo biglietto.")
    );
  });
  return ops.join("\n");
}

export function buildTokenPdf(input: TokenPdfInput): Uint8Array {
  const sheets = Math.max(1, Math.ceil(input.tokens.length / ROWS_PER_SHEET));
  const slips = Math.ceil(input.tokens.length / (SLIP_COLS * SLIP_ROWS));
  const contents = [
    ...Array.from({ length: sheets }, (_, p) => sheetPage(input, p + 1, sheets, p * ROWS_PER_SHEET)),
    ...Array.from({ length: slips }, (_, p) => slipPage(input, p * SLIP_COLS * SLIP_ROWS)),
  ];

  const objects: string[] = [];
  const pageIds = contents.map((_, i) => 6 + i * 2);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  objects[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>";
  contents.forEach((stream, i) => {
    const pageId = pageIds[i];
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${pageId + 1} 0 R >>`;
    objects[pageId + 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  // Tutti i caratteri sono Latin-1: un carattere = un byte, quindi gli offset sono esatti.
  let out = "%PDF-1.4\n%âãÏÓ\n";
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = out.length;
    out += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = out.length;
  out += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) out += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i);
  return bytes;
}
