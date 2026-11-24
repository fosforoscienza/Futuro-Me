# Questionario con token (inizio e fine progetto)

Dal 9 novembre 2026 gli studenti non hanno più un account. Compilano il
questionario con un **token di 4 parole** (es. `lupo-fiume-pane-treno`) stampato
su un biglietto che pescano a caso e conservano fino a fine progetto. Nessuno
annota quale studente ha quale token: non c'è un foglio con i nomi, né nel sito
né su carta. Così si possono confrontare le risposte di inizio e fine progetto
della stessa persona senza che il progetto sappia chi è.

Sostituisce il sistema descritto in [account-studenti.md](account-studenti.md)
(registrazione con codice classe, username e password), che resta solo per lo staff.

## Procedura per gli psicologi

Queste sono le istruzioni da dare per iscritto a chi segue la classe.

0. **Per prendere confidenza.** Su `ilfuturome.it/questionario/prova` si fa
   tutto il percorso dello studente (token, domande, avatar, schermata finale)
   scegliendo la fase da provare. Va bene qualsiasi token di 4 parole dell'elenco,
   per esempio `lupo-fiume-pane-treno`; non viene salvato nulla. Non dare questo
   indirizzo agli studenti: le loro risposte andrebbero perse.
1. **Prima della lezione.** Gestore o admin genera i token della classe in
   `/admin/studenti` (pulsante «Genera token e PDF», uno per studente più qualche
   riserva). Si scarica un PDF con i soli **biglietti da ritagliare** (token e
   indirizzo, niente nome). Stampare, poi **cancellare il PDF** dal computer e
   dai download.
2. **In classe.** Ritagliare i biglietti, metterli in una busta o una scatola e
   far pescare a ogni studente il suo. **Non annotare** chi ha quale biglietto,
   nemmeno a mano, e non consegnarli in un ordine riconoscibile. Gli studenti
   vanno su `ilfuturome.it/questionario`, scrivono il token e compilano. A fine
   compilazione premono «Ho finito» così il compagno successivo trova la pagina
   vuota. Ricordare a tutti di **conservare il biglietto** (diario, astuccio, una
   foto sul proprio telefono): a fine progetto serve lo stesso.
3. **Durante l'anno.** Conservare i biglietti di riserva non consegnati in una
   busta chiusa con scuola e classe.
4. **A fine anno.** L'admin attiva «Fine progetto». Ogni studente usa il suo
   biglietto. Chi l'ha perso pesca un biglietto di riserva: compila la fase
   finale, ma la sua risposta resta senza coppia.
5. **Dopo il questionario finale.** L'admin preme «Chiudi abbinamenti» sulla
   classe e si buttano le riserve rimaste.

Casi particolari: lo studente assente all'inizio può compilare solo la fase
finale con un biglietto di riserva (resterà una risposta senza coppia); chi ha
perso il biglietto non può recuperarlo, perché nessuno sa quale fosse; un token
mai consegnato viene eliminato alla chiusura.

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
  seguono). Dopo, nessun token funziona e nessun biglietto conservato permette
  di ritrovare le risposte. Irreversibile.
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
