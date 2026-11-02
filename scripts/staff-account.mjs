#!/usr/bin/env node
// Crea o reimposta un account dello staff (admin o gestore) e stampa una
// password temporanea, da cambiare poi in /admin/password.
// Admin e gestore non possono resettarsi a vicenda dal sito: se uno dei due
// dimentica la password, si rilancia questo script.
//
// Uso (Node 23.6 o successivo, dalla cartella del progetto):
//   node --env-file=.env.local scripts/staff-account.mjs admin
//   node --env-file=.env.local scripts/staff-account.mjs gestore
//   node --env-file=.env.local scripts/staff-account.mjs gestore mario.gestore
// Servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY del Supabase di
// destinazione (quello di produzione per gli account veri).
import { createClient } from "@supabase/supabase-js";
import { generatePassword, hashPassword, USERNAME_PATTERN } from "../src/lib/auth/password.ts";

const [ruolo, usernameArg] = process.argv.slice(2);
if (ruolo !== "admin" && ruolo !== "gestore") {
  console.error("Uso: node --env-file=.env.local scripts/staff-account.mjs <admin|gestore> [username]");
  process.exit(1);
}
const username = (usernameArg ?? ruolo).toLowerCase();
if (!USERNAME_PATTERN.test(username)) {
  console.error("Username non valido: 3-24 caratteri tra a-z, 0-9, punto e trattino basso.");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Mancano NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: existing, error: readError } = await db
  .from("account")
  .select("id, ruolo")
  .eq("username", username)
  .maybeSingle();
if (readError) {
  console.error(`Errore del database: ${readError.message}`);
  process.exit(1);
}
if (existing && existing.ruolo !== ruolo) {
  console.error(`"${username}" esiste già con ruolo ${existing.ruolo}: scegli un altro username.`);
  process.exit(1);
}

const password = generatePassword() + generatePassword().slice(-4);
const row = {
  password_hash: await hashPassword(password),
  password_cambiata_at: new Date().toISOString(),
};
const { error } = existing
  ? await db.from("account").update(row).eq("id", existing.id)
  : await db.from("account").insert({ ...row, username, ruolo });
if (error) {
  console.error(`Errore del database: ${error.message}`);
  process.exit(1);
}
if (existing) await db.from("sessioni").delete().eq("account_id", existing.id);

console.log(`${existing ? "Password reimpostata" : "Account creato"}: ${username} (${ruolo})`);
console.log(`Password temporanea: ${password}`);
console.log("Accedi su /it/accedi e cambiala subito da /admin/password.");
