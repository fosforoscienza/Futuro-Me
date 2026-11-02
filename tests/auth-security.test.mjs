import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Run the TypeScript auth modules directly, resolving the application's aliases.
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
const { checkCredentials } = await import("../src/lib/auth/login.ts");
const { hashPassword } = await import("../src/lib/auth/password.ts");
const { isSessionCurrent } = await import("../src/lib/auth/session-validity.ts");

function database({ count = 0, countError = null, clearError = null, account = null } = {}) {
  const calls = [];
  return {
    calls,
    from(table) {
      calls.push(table);
      const query = {
        select() { return query; },
        eq() { return query; },
        gte: async () => ({ count, error: countError }),
        maybeSingle: async () => ({ data: account, error: null }),
        insert: async () => ({ error: null }),
        delete() { return { eq: async () => ({ error: clearError }), lt: async () => ({ error: null }) }; },
      };
      return query;
    },
  };
}

test("login fails closed when durable attempt counting is unavailable", async () => {
  for (const options of [{ countError: { message: "unavailable" } }, { count: null }]) {
    const db = database(options);
    assert.equal((await checkCredentials(db, "student", "password", "test-db-error")).ok, false);
    assert.deepEqual(db.calls, ["login_tentativi"]);
  }
});

test("login blocks the eleventh attempt without reading credentials", async () => {
  const db = database({ count: 10 });
  assert.deepEqual(await checkCredentials(db, "student", "password", "test-lockout"), { ok: false, error: "tooMany" });
  assert.deepEqual(db.calls, ["login_tentativi"]);
});

test("oversized login input is rejected before database and password hashing", async () => {
  const db = database();
  for (const [username, password] of [["a".repeat(65), "password"], ["student", "p".repeat(73)]]) {
    assert.equal((await checkCredentials(db, username, password, "test-length")).ok, false);
  }
  assert.deepEqual(db.calls, []);
});

test("valid credentials require a working attempt log; usernames remain case insensitive", async () => {
  const account = { id: "student-id", ruolo: "studente", password_hash: await hashPassword("test-password") };
  assert.deepEqual(await checkCredentials(database({ account }), "Student", "test-password", "test-valid"), {
    ok: true, account: { id: "student-id", ruolo: "studente" },
  });
  assert.equal((await checkCredentials(database({ account, clearError: { message: "unavailable" } }), "student", "test-password", "test-clear")).ok, false);
});

test("password changes invalidate earlier sessions even if deletion fails", () => {
  const now = Date.parse("2026-11-02T12:00:00Z");
  const expires = "2026-11-02T18:00:00Z";
  assert.equal(isSessionCurrent("2026-11-02T10:00:00Z", expires, "2026-11-02T11:00:00Z", now), false);
  assert.equal(isSessionCurrent("2026-11-02T11:00:00Z", expires, "2026-11-02T11:00:00Z", now), false);
  assert.equal(isSessionCurrent("2026-11-02T11:01:00Z", expires, "2026-11-02T11:00:00Z", now), true);
  assert.equal(isSessionCurrent("2026-11-02T11:01:00Z", new Date(now).toISOString(), "2026-11-02T11:00:00Z", now), false);
  assert.equal(isSessionCurrent("invalid", expires, "2026-11-02T11:00:00Z", now), false);
});
