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

// A synthetic key is used only for local unit tests; never a real service role.
process.env.SUPABASE_SERVICE_ROLE_KEY = "local-test-key";
function database({ allowed = true, rpcError = null, account = null } = {}) {
  const calls = [];
  return {
    calls,
    rpc: async (_name, args) => {
      calls.push(args);
      return { data: allowed, error: rpcError };
    },
    from() {
      return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: account, error: null }) };
    },
  };
}

test("login fails closed if the shared limiter fails or refuses the reservation", async () => {
  for (const options of [{ rpcError: { message: "unavailable" } }, { allowed: false }, { allowed: null }]) {
    assert.deepEqual(await checkCredentials(database(options), "student", "password", "ip"), { ok: false, error: "tooMany" });
  }
});

test("oversized inputs never reach the shared limiter", async () => {
  const db = database();
  for (const [username, password] of [["a".repeat(65), "password"], ["student", "p".repeat(73)]]) {
    assert.equal((await checkCredentials(db, username, password, "ip")).ok, false);
  }
  assert.deepEqual(db.calls, []);
});

test("valid credentials return their exact version and hashed limiter keys", async () => {
  const account = { id: "student-id", ruolo: "studente", password_hash: await hashPassword("test-password"), auth_version: "version-1" };
  const db = database({ account });
  assert.deepEqual(await checkCredentials(db, "Student", "test-password", "192.0.2.1"), {
    ok: true, account: { id: "student-id", ruolo: "studente", authVersion: "version-1" },
  });
  assert.equal(db.calls.length, 2);
  for (const args of db.calls) assert.match(args.p_key_hash, /^[a-f0-9]{64}$/);
  assert.equal(db.calls[1].p_limit, 10);
});

test("password rotation invalidates a session even when created after the reset", () => {
  const now = Date.parse("2026-11-02T12:00:00Z");
  assert.equal(isSessionCurrent("2026-11-02T18:00:00Z", "old", "new", now), false);
  assert.equal(isSessionCurrent("2026-11-02T18:00:00Z", "new", "new", now), true);
  assert.equal(isSessionCurrent(new Date(now).toISOString(), "new", "new", now), false);
  assert.equal(isSessionCurrent("invalid", "new", "new", now), false);
  assert.equal(isSessionCurrent("2026-11-02T18:00:00Z", null, null, now), false);
});

test("logout refuses to confirm revocation when the database fails", async () => {
  const { revokeSession } = await import("../src/lib/auth/session-store.ts");
  const db = (error) => ({ from: () => ({ delete: () => ({ eq: async () => ({ error }) }) }) });
  await assert.rejects(revokeSession(db({ message: "offline" }), "token-hash"), /Revoca/);
  await assert.doesNotReject(revokeSession(db(null), "token-hash"));
});
