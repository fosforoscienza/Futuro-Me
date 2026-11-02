# Correzioni del secondo audit — 2 novembre 2026

## Rollout

1. Applicare `supabase/migrations/20261104000000_auth_hardening.sql` al database
   self-hosted previsto in `docs/account-studenti.md`, prima del deploy app.
   Migrazione additiva e transazionale: il codice precedente resta compatibile.
2. Pubblicare l'app e verificare il deploy.
3. Applicare `20261104010000_require_session_version.sql` dopo il deploy:
   rifiuta gli inserimenti senza versione anche dai vecchi deploy/preview.
4. Testare accesso con un account sintetico in ambiente dedicato.
   Non usare account o questionari reali per i test.
5. Node 22.x su Vercel; Undici richiede almeno Node 22.19.0.

## Cambiamenti

- Next.js/eslint-config-next 16.4.4, sharp >=0.35.5, next-intl aggiornato;
  rimosso next-auth inutilizzato e aggiornato il lockfile.
- Limiti autenticazione su PostgreSQL con UPSERT atomico. Sono conteggiati
  **tutti i tentativi**, anche quelli riusciti: 10 per username in 15 minuti,
  100 per IP in 5 minuti; registrazione 60 per IP in 10 minuti. Questo evita
  che un login riuscito cancelli prenotazioni di richieste concorrenti.
- Chiavi dei contatori HMAC con segreto server, senza IP o username in chiaro.
  Scadono entro 15 minuti e vengono eliminate al controllo successivo.
  Gli altri limiti locali sono una protezione ausiliaria, non globale;
  la Map ora ha pulizia e un tetto di 10.000 chiavi.
- Ogni cambio di password ruota `account.auth_version` tramite trigger DB.
  Ogni sessione nuova presenta la versione effettivamente verificata.
  Un trigger con blocco di riga impedisce inserimenti con versioni obsolete;
  getSession confronta nuovamente la versione ad ogni richiesta.
  Le vecchie sessioni valide vengono migrate, quelle precedenti al reset
  restano non valide. La compatibilità con vecchi inserimenti senza versione
  è mantenuta solo per permettere un rollout senza interruzioni; l'app nuova
  richiede sempre la versione.
- Logout: cookie rimosso solo dopo revoca confermata; errore visibile e
  pulsante per riprovare se il database non risponde.
- Fetch RSS/articoli: soli HTTP(S) porte standard, niente credenziali URL,
  indirizzi pubblici verificati al momento della connessione DNS (anche IPv6
  e IPv4 mappati), verifica di ogni redirect, massimo 5 redirect e 1.500.000
  byte decodificati letti in streaming, timeout sull'intero caricamento.
- API admin: null, array, elementi non oggetto e JSON malformati ricevono 400;
  il trigger vuoto resta supportato ma un JSON rotto non avvia più un job.

## Verifiche

- `npm test`: test unitari per credenziali, sessioni, logout, IP, DNS,
  redirect e limiti di byte.
- `AUTH_TEST_DATABASE_URL=... npm test`: aggiunge test su un PostgreSQL
  locale usa e getta con migrazioni applicate. Il test rifiuta host remoti.
  Verificati 30 tentativi concorrenti con esattamente 10 autorizzati, rotazione
  credenziali, sessioni obsolete e permessi RPC.
- `npm run lint`, `npx tsc --noEmit`, `npm run build` e smoke test HTTP locali.
- `npm audit --omit=dev`: zero vulnerabilità segnalate dopo l'aggiornamento.
  L'audit completo segnala ancora 16 voci moderate di sviluppo riconducibili
  a minimatch <11.0.1 nella toolchain ESLint. npm propone downgrade incompatibili:
  non applicati. Il codice runtime non include questa toolchain; monitorare
  gli aggiornamenti upstream evitando glob non fidati nei controlli locali.

## Questioni non risolte tecnicamente

La base giuridica e il testo privacy restano da confermare dal titolare.
La CSP mantiene unsafe-inline per la generazione statica: una CSP con nonce
richiede un intervento separato su rendering/cache. Nessuna prova di attacco
è stata eseguita sulla produzione e nessun dato degli studenti è stato usato.

## Esito del rollout in produzione

Il 2 novembre 2026, dopo l'approvazione esplicita dell'utente, entrambe le
migrazioni sono state applicate tramite `ssh mac-mini`, container `supabase-db`.
La prima prima del push, la seconda dopo il deploy riuscito del commit
`03e9fa9353c4db3759993f2b0d9087653b2e6b39` su Vercel.
Verificate homepage e pagina di accesso (HTTP 200, CSP corretta), permessi RPC
(service_role autorizzato, anon escluso), RLS del limiter e versione obbligatoria
per le nuove sessioni. Nessun test con credenziali o dati reali degli studenti.
