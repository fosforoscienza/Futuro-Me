import assert from "node:assert/strict";
import { test } from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
const url = process.env.AUTH_TEST_DATABASE_URL;
if (url && !["localhost", "127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Tests require a disposable local PostgreSQL database");
const sql = async (query) => (await run("psql", [url, "-v", "ON_ERROR_STOP=1", "-Atc", query])).stdout.trim();

test("shared limiter admits exactly 10 of 30 concurrent attempts", { skip: !url }, async () => {
  const key = "a".repeat(64);
  await sql(`delete from public.auth_rate_limits where key_hash='${key}'`);
  const results = await Promise.all(Array.from({ length: 30 }, () => sql(`select public.consume_auth_rate_limit('${key}',10,900)`)));
  assert.equal(results.filter(x => x === "t").length, 10);
  await sql(`update public.auth_rate_limits set expires_at=now()-interval '1 second' where key_hash='${key}'`);
  assert.equal(await sql(`select public.consume_auth_rate_limit('${key}',10,900)`), "t");
});

test("rotation prevents a session using previously verified credentials", { skip: !url }, async () => {
  await sql(`delete from public.account where username='security_test'; insert into public.account(username,password_hash,ruolo) values('security_test','old-hash','admin')`);
  const [id, version] = (await sql(`select id,auth_version from public.account where username='security_test'`)).split("|");
  await sql(`insert into public.sessioni(token_hash,account_id,auth_version,expires_at) values('security-old','${id}','${version}',now()+interval '1 hour')`);
  await sql(`update public.account set password_hash='new-hash' where id='${id}'`);
  assert.notEqual(await sql(`select auth_version from public.account where id='${id}'`), version);
  await assert.rejects(sql(`insert into public.sessioni(token_hash,account_id,auth_version,expires_at) values('security-stale','${id}','${version}',now()+interval '1 hour')`), /Credentials changed/);
  assert.equal(await sql(`select s.auth_version = a.auth_version from public.sessioni s join public.account a on a.id=s.account_id where token_hash='security-old'`), "f");
  assert.equal(await sql(`select has_function_privilege('anon','public.consume_auth_rate_limit(text,integer,integer)','EXECUTE')`), "f");
  await sql(`delete from public.account where id='${id}'`);
});
