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

test("questionnaire tokens: one answer per phase, closure unlinks and keeps the pairs", { skip: !url }, async () => {
  const cols = (await sql(`select column_name from information_schema.columns where table_name='questionario_risposte' and is_nullable='NO' and column_default is null and column_name <> 'avatar'`)).split("\n");
  const answer = (token, fase) =>
    `insert into public.questionario_risposte(${cols.join(",")},avatar,token_id,fase) values(${cols.map(() => "'x'").join(",")},'{}','${token}','${fase}')`;
  const hex = (c) => c.repeat(64);

  await sql(`delete from public.questionario_token where classe_id in (select id from public.classi where codice='TOKEN-TEST'); delete from public.classi where codice='TOKEN-TEST'; insert into public.classi(scuola,nome,codice) values('Test','1A','TOKEN-TEST')`);
  const classe = await sql(`select id from public.classi where codice='TOKEN-TEST'`);
  await sql(`insert into public.questionario_token(classe_id,token_hash) values('${classe}','${hex("a")}'),('${classe}','${hex("b")}'),('${classe}','${hex("c")}')`);
  const id = (h) => sql(`select id from public.questionario_token where token_hash='${hex(h)}'`);
  const [a, b] = [await id("a"), await id("b")];

  await sql(answer(a, "inizio"));
  await sql(answer(a, "fine"));
  await sql(answer(b, "inizio"));
  await assert.rejects(sql(answer(a, "inizio")), /questionario_risposte_token_fase_key/);
  await assert.rejects(
    sql(`insert into public.questionario_risposte(${cols.join(",")},avatar,fase) values(${cols.map(() => "'x'").join(",")},'{}','inizio')`),
    /origine_fase_check/
  );

  assert.equal(await sql(`select public.chiudi_token_classe('${classe}')`), "2");
  assert.equal(await sql(`select count(*) from public.questionario_token where classe_id='${classe}'`), "2");
  assert.equal(await sql(`select count(*) from public.questionario_token where classe_id='${classe}' and (token_hash is not null or chiuso_at is null or id in ('${a}','${b}'))`), "0");
  assert.equal(await sql(`select count(*) from public.questionario_risposte r join public.questionario_token t on t.id=r.token_id where t.classe_id='${classe}'`), "3");
  assert.equal(await sql(`select count(*) from public.questionario_risposte r join public.questionario_token t on t.id=r.token_id where t.classe_id='${classe}' and r.created_at <> date_trunc('day', r.created_at)`), "0");
  assert.equal(await sql(`select public.chiudi_token_classe('${classe}')`), "0");

  assert.equal(await sql(`select has_table_privilege('anon','public.questionario_token','SELECT')`), "f");
  assert.equal(await sql(`select has_table_privilege('authenticated','public.questionario_risposte','SELECT')`), "f");
  assert.equal(await sql(`select has_function_privilege('anon','public.chiudi_token_classe(uuid)','EXECUTE')`), "f");

  await sql(`delete from public.questionario_token where classe_id='${classe}'; delete from public.classi where id='${classe}'`);
});
