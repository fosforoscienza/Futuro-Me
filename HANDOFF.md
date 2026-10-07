# Handoff: questionario e avatar "Il Futuro Me"

Passaggio di consegne da una sessione Claude Code cloud a una sessione locale sul Mac
(`/Users/tia/Documents/Software/Futuro-Me`). Aggiornato al 7 ottobre 2026, commit `f70de26` su `main`.

## Compito aperto: collegare il questionario a Supabase

Oggi l'invio del questionario risponde `503 {"error":"Not configured"}`: su Vercel mancano le
variabili e la tabella non esiste ancora. Il database da usare è il **Supabase self-hosted sul
Mac mini**, esposto su `https://api.fosforo.info` (il gateway risponde: `/rest/v1/` dà 401
"No API key found", quindi è attivo). I progetti Supabase cloud dell'account
(`la-scienza-in-festa-DB`, `Eco-App`) **non** vanno usati.

Passi:

1. Creare la tabella sul Mac mini (lo script è idempotente e non stampa segreti):
   ```bash
   ssh mac-mini 'cd ~/Documents/Software/Futuro-Me && git pull && bash scripts/supabase/setup-questionario.sh'
   ```
   Lo script trova il container `supabase-db` (o `supabase_db_*`), applica
   `supabase/migrations/20261003000000_questionario_risposte.sql`, esegue
   `notify pgrst, 'reload schema'` e verifica: tabella presente, RLS attiva, 39 colonne.
   Non è mai stato eseguito: se fallisce (PATH di docker via SSH, nome del container, ecc.)
   va corretto lì.
2. Impostare su Vercel, progetto **futuro-me** (team fosforoscienzas-projects), ambiente Production:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://api.fosforo.info`
   - `SUPABASE_SERVICE_ROLE_KEY` = valore di `SERVICE_ROLE_KEY` nel `.env` di Supabase sul Mac mini
     (lo script stampa il percorso del file). Non mostrare la chiave in chat né committarla.
3. Redeploy della produzione su Vercel (le variabili valgono dal deploy successivo).
4. Verificare: completare il questionario su https://www.ilfuturome.it/it/questionario e controllare
   che compaia la schermata finale e che `select count(*) from public.questionario_risposte;`
   sul Mac mini aumenti. Il test automatico `flow` (vedi sotto) va bene anche in locale.

Note:
- `NEXT_PUBLIC_SUPABASE_URL` finisce anche nella CSP (`connect-src` in `next.config.ts`): è
  previsto. Oggi la CSP di produzione ha solo `'self'`, conferma che la variabile non è impostata.
- La tabella ha RLS attiva **senza policy**: legge e scrive solo il service role, cioè la API
  route `src/app/api/questionario/route.ts`. Nessun dato personale (niente nome, email, IP).
- Il connettore Vercel della sessione cloud non vedeva il progetto futuro-me (404), quindi le
  variabili non sono state verificate né impostate da lì.

## Cosa c'è già (tutto su `main`, deploy automatico su www.ilfuturome.it)

- **Questionario anonimo** `/it/questionario` (non linkato dalla home): domande da Avatar.docx,
  tutte obbligatorie, alternate ai livelli dell'avatar. Codice: `src/lib/questionario.ts`,
  `src/components/questionario/Questionario.tsx`, API `src/app/api/questionario/route.ts`
  (rate limit, honeypot `website`, validazione risposte e avatar).
- **Avatar a livelli** (stile cartoon tendente al realistico, adulto 25-30, corpi F/M,
  vestiti per entrambi): livelli 0-6 (genere, viso, busto, gambe, oggetti, ambiente,
  inclusione). Configurazione `src/lib/avatar/config.ts`, rendering a strati su canvas con
  ricolorazione di pelle, capelli e occhi `src/lib/avatar/render.ts`, componenti in
  `src/components/avatar/`. Scelte legate al corpo (`bodies`) filtrate con `fitToBody`.
- **Prova libera dell'avatar** `/it/avatar` (noindex) e copia autonoma su
  https://claude.ai/artifact/SqAccex4QQJq57rG6KJWyr (privato, da condividere dal menu Share).
- **Asset**: `public/avatar/**` (~470 file) e manifest `src/lib/avatar/assets.json`, generati
  da `scripts/avatar/build_assets.py` a partire da immagini Higgsfield (Nano Banana 2) elencate
  in `scripts/avatar/jobs.tsv`. Vedi `scripts/avatar/README.md`. Le immagini sorgenti non sono
  nel repository: si riscaricano dai job id.

## Limiti noti / possibili prossimi passi

- La **carrozzina** (livello inclusione) non c'è ancora, per scelta.
- Il piercing "medusa" è etichettato "Piercing al labbro" perché cade sotto il labbro.
- **Somministrazione inizio/fine anno con confronto anonimo**: discussa ma non implementata
  (in attesa di decisione). Oggi ogni invio è indipendente, senza codice di collegamento.
- Crediti Higgsfield residui al 7/10: 306,75.

## Verifiche utili in locale

```bash
npm install
npx tsc --noEmit -p .
npx eslint src/lib/avatar src/components/avatar src/components/questionario
npm run build && npx next start -p 3123
```

`src/components/layout/CookieConsent.tsx` ha un errore di lint preesistente, non legato a questo lavoro.
