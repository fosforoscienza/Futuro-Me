# Account studenti, gestore e admin

Ogni ragazzo e ragazza ha un account per compilare **questionario + avatar** due volte: a
**inizio** e a **fine progetto**. Lo staff ha due ruoli, **admin** e **gestore**.

## Come funziona

| Chi | Dove | Cosa può fare |
|---|---|---|
| Studente | `/it/registrati`, `/it/accedi`, `/it/area` | si registra con il codice della classe, compila Inizio progetto (e Fine progetto quando è aperta), rivede e scarica il suo avatar |
| Gestore | `/admin/studenti` | crea classi e codici, vede chi ha completato, reimposta la password degli studenti, cambia la propria password |
| Admin | `/admin/studenti`, `/admin` | tutto ciò che fa il gestore, più la console news e l'interruttore che apre **Fine progetto** |

- Login unico su `/it/accedi` (o `/en/accedi`): lo studente va alla sua area, admin e gestore alla
  console `/admin`. Il pulsante "Accedi" della navbar porta lì.
- **Fine progetto** è grigia e non cliccabile finché l'admin non la attiva in `/admin/studenti`
  (tabella `impostazioni`, chiave `fase_fine_attiva`).
- Ogni fase si compila una volta sola (indice unico su `account_id, fase`); dopo l'invio lo
  studente rivede il suo avatar e lo può scaricare.
- Admin e gestore reimpostano **solo** le password degli studenti: la nuova password temporanea
  (es. `bamote-4827`) compare una volta sola e va comunicata allo studente. Il reset chiude le sue
  sessioni aperte.
- Admin e gestore **non** possono reimpostarsi a vicenda: ognuno cambia la propria password da
  `/admin/password`; se la dimentica, si reimposta dal server con lo script qui sotto.
- Il questionario anonimo su `/questionario` resta com'era: le risposte già raccolte non
  cambiano (`account_id` e `fase` vuoti).

## Dati e sicurezza

- Dati minimi: username scelto dal ragazzo, scuola e classe, hash della password, date di
  registrazione e ultimo accesso, risposte e avatar. Niente nome, email o data di nascita.
- Password: scrypt (N=2^15, r=8, p=1) con sale casuale, `src/lib/auth/password.ts`.
  Studenti almeno 8 caratteri, staff almeno 12.
- Sessioni su database (`sessioni`): cookie httpOnly `fm_sessione` con token casuale, in tabella
  solo lo SHA-256; durata 12 ore; logout e reset le chiudono davvero.
- Limiti: 10 accessi falliti in 15 minuti per username (su database, regge su Vercel) più un
  limite largo per IP in memoria; registrazioni limitate per IP; codici classe da ~40 bit.
- RLS attiva senza policy e privilegi revocati ad `anon`/`authenticated` su tutte le tabelle
  nuove: le legge e scrive solo il server con la service role.
- Perché non Supabase Auth o next-auth: Supabase Auth vuole email (non le chiediamo ai minori) e
  sul self-hosted andrebbe configurato GoTrue; next-auth v4 non è pensato per Next 16 e
  avremmo comunque dovuto scrivere tabella utenti, hash e ruoli. `next-auth` resta tra le
  dipendenze ma non è usato.

## Messa in produzione (Supabase self-hosted del Mac mini)

1. Applicare la migrazione (idempotente):
   ```bash
   ssh mac-mini 'docker exec -i supabase-db psql -v ON_ERROR_STOP=1 -U postgres -d postgres' \
     < supabase/migrations/20261103000000_account_studenti.sql
   ssh mac-mini "docker exec supabase-db psql -U postgres -d postgres -c \"notify pgrst, 'reload schema';\""
   ```
2. Creare i due account staff (stampa una password temporanea; Node 23.6+):
   ```bash
   node --env-file=.env.production.local scripts/staff-account.mjs admin
   node --env-file=.env.production.local scripts/staff-account.mjs gestore
   ```
   Il file env deve contenere `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` di
   produzione. Lo stesso comando reimposta la password se l'account esiste già.
3. Entrare su `/it/accedi`, cambiare subito la password da `/admin/password`, creare le classi in
  `/admin/studenti` e dare i codici agli insegnanti.

Nessuna nuova variabile d'ambiente su Vercel. `ADMIN_SECRET` serve ancora alle automazioni
delle news, non più per entrare nella console.
