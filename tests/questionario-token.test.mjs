import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }
    if (specifier.startsWith(".") && context.parentURL?.endsWith(".ts")) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
    }
    return nextResolve(specifier, context);
  },
});
const { TOKEN_WORDS } = await import("../src/lib/token/words.ts");
const { normalizeToken } = await import("../src/lib/token/format.ts");
const { generateToken, hashToken } = await import("../src/lib/token/server.ts");
const { buildTokenPdf } = await import("../src/lib/token/pdf.ts");

const oneEditApart = (a, b) => {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) return [...a].filter((c, i) => c !== b[i]).length === 1;
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  return [...long].some((_, i) => long.slice(0, i) + long.slice(i + 1) === short);
};

test("word list: unique, plain a-z, 3-8 letters, at least 1024 words", () => {
  assert.equal(new Set(TOKEN_WORDS).size, TOKEN_WORDS.length);
  assert.ok(TOKEN_WORDS.length >= 1024);
  for (const w of TOKEN_WORDS) assert.match(w, /^[a-z]{3,8}$/);
});

test("word list: a single typo never turns a word into another word", () => {
  for (let i = 0; i < TOKEN_WORDS.length; i++) {
    for (let j = i + 1; j < TOKEN_WORDS.length; j++) {
      assert.ok(!oneEditApart(TOKEN_WORDS[i], TOKEN_WORDS[j]), `${TOKEN_WORDS[i]} / ${TOKEN_WORDS[j]}`);
    }
  }
});

test("generated tokens are four list words and normalize to themselves", () => {
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const token = generateToken();
    assert.match(token, /^[a-z]+(-[a-z]+){3}$/);
    assert.equal(normalizeToken(token), token);
    seen.add(token);
  }
  assert.ok(seen.size > 495);
});

test("normalizeToken accepts handwritten variants and rejects the rest", () => {
  assert.equal(normalizeToken("  Lupo FIUME.pane—trèno "), "lupo-fiume-pane-treno");
  assert.equal(normalizeToken("lupo fiume pane"), null);
  assert.equal(normalizeToken("lupo-fiume-pane-treno-luna"), null);
  assert.equal(normalizeToken("lupo-fiume-pane-xyzzy"), null);
  assert.equal(normalizeToken("a".repeat(200)), null);
  assert.equal(normalizeToken(42), null);
});

test("hashToken is stable, domain-separated and 64 hex chars", () => {
  const h = hashToken("lupo-fiume-pane-treno");
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.equal(h, hashToken("lupo-fiume-pane-treno"));
  assert.notEqual(h, hashToken("lupo-fiume-pane-luna"));
});

test("PDF has a valid header, cross-reference table and one page per 25 rows plus slips", () => {
  const tokens = Array.from({ length: 30 }, generateToken);
  const bytes = buildTokenPdf({ scuola: "IC Senigallia (Centro)", classe: "3B", data: "9/11/2026", tokens, url: "ilfuturome.it/questionario" });
  const pdf = Buffer.from(bytes).toString("latin1");
  assert.ok(pdf.startsWith("%PDF-1.4"));
  assert.ok(pdf.trimEnd().endsWith("%%EOF"));

  const startxref = Number(pdf.match(/startxref\n(\d+)\n%%EOF/)[1]);
  assert.equal(pdf.slice(startxref, startxref + 4), "xref");
  const [, count] = pdf.slice(startxref).match(/^xref\n0 (\d+)\n/);
  const entries = pdf.slice(startxref).split("\n").slice(3, 2 + Number(count));
  entries.forEach((entry, i) => {
    const offset = Number(entry.slice(0, 10));
    assert.equal(pdf.slice(offset, offset + `${i + 1} 0 obj`.length), `${i + 1} 0 obj`);
  });

  // 30 righe = 2 pagine di foglio; 30 biglietti da 16 = 2 pagine di biglietti.
  assert.match(pdf, /\/Count 4 /);
  for (const token of tokens) assert.ok(pdf.includes(`(${token})`));
  assert.ok(pdf.includes("IC Senigallia \\(Centro\\)"));
  for (const [, length, body] of pdf.matchAll(/\/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/g)) {
    assert.equal(body.length, Number(length));
  }
});
