# Questionario con token (inizio e fine progetto)

Dal 9 novembre 2026 gli studenti non hanno più un account. Compilano il
questionario con un **token di 4 parole** (es. `lupo-fiume-pane-treno`). Il nome
dello studente non entra mai nel sito: sta solo su un foglio di carta custodito
dagli psicologi, che viene distrutto dopo il questionario finale. Così si possono
confrontare le risposte di inizio e fine progetto della stessa persona, e alla
fine resta solo un archivio di coppie non collegate a nessun nome.

Sostituisce il sistema descritto in [account-studenti.md](account-studenti.md)
(registrazione con codice classe, username e password), che resta solo per lo staff.

## Procedura per gli psicologi

Queste sono le istruzioni da dare per iscritto a chi custodisce i fogli.

0. **Per prendere confidenza.** Su `ilfuturome.it/questionario/prova` si fa
   tutto il percorso dello studente (token, domande, avatar, schermata finale)
   scegliendo la fase da provare. Va bene qualsiasi token di 4 parole dell'elenco,
   per esempio `lupo-fiume-pane-treno`; non viene salvato nulla. Non dare questo
   indirizzo agli studenti: le loro risposte andrebbero perse.
1. **Prima della lezione.** Gestore o admin genera i token della classe in
   `/admin/studenti` (pulsante «Genera token e PDF», uno per studente più qualche
   riserva). Si scarica un PDF con:
   - il **foglio abbinamenti** (token + riga vuota per il nome);
   - i **biglietti da ritagliare** (solo token e indirizzo, niente nome).
   Stampare e poi **cancellare il PDF** dal computer e dai download.
2. **In classe.** Consegnare un biglietto a ogni studente e scrivere **a mano**
   sul foglio il nome accanto al token consegnato. Gli studenti vanno su
   `ilfuturome.it/questionario`, scrivono il token e compilano. A fine
   compilazione premono «Ho finito» così il compagno successivo trova la pagina vuota.
3. **Durante l'anno.** Il foglio va tenuto chiuso a chiave. Non fotografarlo,
   non scansionarlo, non copiarlo, non portarlo a casa. Se si perde, avvisare
   subito il titolare (Caritas): è una possibile violazione di dati personali.
4. **A fine anno.** L'admin attiva «Fine progetto». Gli psicologi ridanno a ogni
   studente il suo token leggendolo dal foglio (o il biglietto, se conservato).
5. **Dopo il questionario finale.** Distruggere il foglio con un
   distruggidocumenti e firmare un breve verbale (data, scuola e classe, chi ha
   distrutto). Poi l'admin preme «Chiudi abbinamenti» sulla classe.

Casi particolari: lo studente assente all'inizio può compilare solo la fase
finale (resterà una risposta senza coppia); chi ha perso il biglietto si fa
rileggere il token dal foglio; un token mai consegnato resta senza nome e viene
eliminato alla chiusura.

## Cosa succede nel sito

- `questionario_token`: per ogni token solo l'impronta SHA-256 e la classe. Il
  token in chiaro esiste solo nel PDF generato nel browser: non si può ristampare.
- La fase compilata la decide l'interruttore «Fine progetto»: chiuso = inizio,
  aperto = fine. Una sola compilazione per token e per fase.
- Limiti: 300 verifiche di token per IP ogni 10 minuti (un'intera scuola esce
  dallo stesso IP), contatore condiviso su database con IP in HMAC.
- `chiudi_token_classe(classe)` (pulsante admin «Chiudi abbinamenti»):
  elimina i token mai usati, porta `created_at` delle risposte al giorno,
  cancella le impronte e assegna a ogni token un id nuovo (le risposte lo
  seguono). Dopo, nessun token funziona e nessun foglio superstite permette di
  ritrovare le risposte. Irreversibile.
- Parole: 1035 parole italiane semplici senza accenti, nessuna a una lettera di
  distanza da un'altra (`src/lib/token/words.ts`); 4 parole ≈ 40 bit.
  Non togliere parole mentre ci sono token in uso.

Codice: `src/lib/token/`, `src/components/questionario/TokenGate.tsx`,
`src/app/api/questionario/`, `src/app/admin/studenti/`.

## Messa in produzione

1. Applicare la migrazione sul Supabase del Mac mini (idempotente):
   ```bash
   ssh mac-mini '/usr/local/bin/docker exec -i supabase-db psql -v ON_ERROR_STOP=1 -U postgres -d postgres' \
     < supabase/migrations/20261109000000_questionario_token.sql
   ```
2. Deploy del sito. Nessuna nuova variabile d'ambiente.
3. Verificare: generare 1 token per una classe di prova, compilare da
   `/it/questionario`, controllare i conteggi in `/admin/studenti`, poi
   chiudere gli abbinamenti della classe di prova.

## Dati del sistema precedente

Le compilazioni fatte con gli account studente (`account_id` valorizzato) e
quelle anonime senza account restano nel database. Registrazione e accesso
degli studenti sono disattivati, e la console mostra quanti account restano.
Decidere se cancellarli (con le risposte, per `ON DELETE CASCADE`) o
anonimizzarli prima di cancellare gli account, per esempio:

```sql
-- Anonimizza: stacca le risposte dagli account, poi elimina account e sessioni.
update public.questionario_risposte
   set account_id = null, fase = null, created_at = date_trunc('day', created_at)
 where account_id is not null;
delete from public.account where ruolo = 'studente';
```

Attenzione: così si perde anche l'abbinamento inizio/fine di quegli studenti.

## Test

```bash
npm test
# con un Postgres locale usa e getta e le migrazioni applicate:
AUTH_TEST_DATABASE_URL=postgresql://postgres@localhost:54329/postgres npm test
```
