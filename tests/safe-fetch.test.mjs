import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
// This test file lives alongside app dependencies.
registerHooks({ resolve(specifier, context, next) {
  if (specifier === "ipaddr.js" || specifier === "undici") {
    return next(pathToFileURL(resolve("node_modules", specifier, specifier === "undici" ? "index.js" : "lib/ipaddr.js")).href, context);
  }
  return next(specifier, context);
} });
const { isPublicAddress, publicUrl, readLimitedText, safeFetchText, createPublicLookup } = await import("../src/lib/news/safe-fetch.ts");

test("blocks private, special and mapped addresses", () => {
  for (const ip of ["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1", "2001:db8::1", "not-an-ip"]) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
  assert.equal(isPublicAddress("8.8.8.8"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
});

test("rejects dangerous URL forms before a network request", async () => {
  for (const url of ["http://127.1", "http://2130706433", "http://[::ffff:127.0.0.1]", "http://localhost", "http://host.internal:8080", "file:///etc/passwd", "https://user:pass@example.org"]) {
    assert.throws(() => publicUrl(url), undefined, url);
    await assert.rejects(safeFetchText(url, 100, {}));
  }
  assert.equal(publicUrl("https://example.org/feed").hostname, "example.org");
});

test("limits actual streamed bytes even with absent or misleading content length", async () => {
  for (const headers of [{}, { "content-length": "1" }]) {
    await assert.rejects(readLimitedText(new Response("x".repeat(11), { headers }), 10), /troppo grande/);
  }
  assert.equal(await readLimitedText(new Response("valid"), 10), "valid");
});

test("rejects oversized declared bodies and cancels the stream", async () => {
  let cancelled = false;
  const body = new ReadableStream({ cancel() { cancelled = true; } });
  await assert.rejects(readLimitedText(new Response(body, { headers: { "content-length": "100" } }), 10));
  assert.equal(cancelled, true);
});

test("rejects mixed public/private DNS and connects only to the validated address", async () => {
  const mixed = createPublicLookup(async () => [{ address: "8.8.8.8", family: 4 }, { address: "10.0.0.1", family: 4 }]);
  await assert.rejects(new Promise((resolve, reject) => mixed("example.org", {}, (error, address) => error ? reject(error) : resolve(address))), /DNS non pubblico/);
  let lookups = 0;
  const pinned = createPublicLookup(async () => { lookups++; return [{ address: "8.8.8.8", family: 4 }]; });
  const address = await new Promise((resolve, reject) => pinned("example.org", {}, (error, address) => error ? reject(error) : resolve(address)));
  assert.equal(address, "8.8.8.8");
  assert.equal(lookups, 1);
});

test("validates redirect targets before making the next request", async () => {
  let calls = 0;
  const request = async () => { calls++; return new Response(null, { status: 302, headers: { location: "http://169.254.169.254/" } }); };
  await assert.rejects(safeFetchText("https://example.org/feed", 100, {}, request), /non pubblico/);
  assert.equal(calls, 1);
});
