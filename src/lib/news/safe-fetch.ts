import { lookup } from "node:dns/promises";
import type { LookupFunction } from "node:net";
import ipaddr from "ipaddr.js";
import { Agent, fetch } from "undici";

const MAX_BYTES = 1_500_000;
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

export function isPublicAddress(address: string): boolean {
  try {
    // process() converts IPv4-mapped IPv6 before classification.
    return ipaddr.process(address).range() === "unicast";
  } catch {
    return false;
  }
}

export function publicUrl(value: string): URL {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      (url.port && !["80", "443"].includes(url.port))) throw new Error("URL non consentito");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || !host.includes(".") && !host.includes(":")) throw new Error("Host non pubblico");
  if (ipaddr.isValid(host) && !isPublicAddress(host)) throw new Error("Indirizzo non pubblico");
  return url;
}

// Validate at connection time, not in a separate DNS preflight: avoids DNS rebinding.
export function createPublicLookup(resolve = lookup): LookupFunction {
  return (hostname, options, callback) => {
    resolve(hostname, { all: true, verbatim: true }).then((addresses) => {
      if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
        throw new Error("DNS non pubblico");
      }
      const family = typeof options.family === "number" ? options.family : 0;
      const matches = addresses.filter((entry) => !family || entry.family === family);
      if (!matches.length) throw new Error("Nessun indirizzo pubblico compatibile");
      // Node's connector can request the full list for family auto-selection.
      if (options.all) callback(null, matches);
      else callback(null, matches[0].address, matches[0].family);
    }).catch((error: Error) => callback(error, "", 4));
  };
}
export const publicLookup = createPublicLookup();

export async function readLimitedText(response: Pick<Response, "headers" | "body">, maxBytes = MAX_BYTES): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (declared > maxBytes) {
    await response.body?.cancel();
    throw new Error("Risposta troppo grande");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error("Risposta troppo grande");
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf8");
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

/** Public HTTP(S) only, bounded decoded body, timeout includes redirects and body. */
export async function safeFetchText(value: string, timeoutMs: number, headers: Record<string, string>, request = fetch) {
  let url = publicUrl(value);
  const dispatcher = new Agent({ connect: { lookup: publicLookup }, headersTimeout: timeoutMs, bodyTimeout: timeoutMs });
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    for (let hop = 0; hop <= 5; hop++) {
      const response = await request(url, { dispatcher, signal, headers, redirect: "manual" });
      if (REDIRECTS.has(response.status)) {
        await response.body?.cancel();
        const location = response.headers.get("location");
        if (!location || hop === 5) throw new Error("Redirect non valido");
        url = publicUrl(new URL(location, url).href);
        continue;
      }
      const text = await readLimitedText(response as unknown as Response);
      return { ok: response.ok, status: response.status, headers: response.headers, url: url.href, text: async () => text };
    }
    throw new Error("Troppi redirect");
  } finally {
    await dispatcher.destroy();
  }
}
