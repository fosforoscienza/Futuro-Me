# Handoff: questionario e avatar "Il Futuro Me"

Passaggio di consegne da una sessione Claude Code cloud a una sessione locale sul Mac
(`/Users/tia/Documents/Software/Futuro-Me`). Aggiornato al 7 ottobre 2026, commit `f70de26` su `main`.

## ✅ Completato il 7/10/2026: questionario collegato a Supabase

Tabella creata sul Mac mini, variabili impostate su Vercel (Production), redeploy fatto. Un invio
di prova a `https://www.ilfuturome.it/api/questionario` ha risposto `200 {"success":true}` e la riga
è comparsa in `public.questionario_risposte` (poi cancellata: la tabella riparte da 0 righe).
La CSP di produzione ora ha `connect-src 'self' https://api.fosforo.info`. Il resto di questa
sezione è lo storico dei passi.

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
   **Fatto il 7/10/2026**: il repo non è clonato sul Mac mini, quindi la migrazione è stata
   applicata via `ssh mac-mini 'docker exec -i supabase-db psql ...' < supabase/migrations/...`.
   Esito: tabella presente, RLS attiva, 39 colonne, 0 policy; `GET /rest/v1/questionario_risposte`
   su api.fosforo.info risponde 200. Attenzione: sul Mac mini ci sono due stack Supabase;
   api.fosforo.info è `~/Software/supabase-local` (container `supabase-*`), mentre `fosforo-*`
   (`~/Software/supabase-fosforo`) è ospiti.fosforo.info e non va usato.
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
  variabili non sono state verificate né impostate da lì. Il 7/10 neanche la sessione locale lo
  trova: il connettore vede solo il team fosforoscienzas-projects (4 progetti, non futuro-me) e la
  CLI `vercel` del Mac è loggata su un altro account (team Atelier800).

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
  in `scripts/avatar/jobs.tsv`, poi rifiniti da `scripts/avatar/fix_masks.py` (da rilanciare
  dopo ogni build). Vedi `scripts/avatar/README.md`. Le immagini sorgenti non sono nel
  repository: si riscaricano dai job id.
- **Colori dell'avatar (7/10, commit `4d9ec17` e `0242937`)**: capelli e iridi si ricolorano
  in OKLab con le statistiche del manifest; iridi con maschera geometrica; sopracciglia con
  maschera morbida (niente più macchia sotto il sopracciglio destro); i pezzi sovrapposti al
  viso non ridipingono più occhi e viso F; pelle in ombra, mani e buchi delle stoffe beige
  sistemati per tutti gli incarnati. Le ciglia si disegnano sotto la forma d'occhio scelta.

## Limiti noti / possibili prossimi passi

- La **carrozzina** (livello inclusione) non c'è ancora, per scelta.
- Il piercing "medusa" è etichettato "Piercing al labbro" perché cade sotto il labbro.
- **Somministrazione inizio/fine anno con confronto anonimo**: discussa ma non implementata
  (in attesa di decisione). Oggi ogni invio è indipendente, senza codice di collegamento.
- Crediti Higgsfield residui al 9/10: circa 245.
- **Occhiali (8/10)**: dietro le lenti non c'è più il viso F; lenti chiare trasparenti, lenti da
  sole come tinta semitrasparente (passo 5 di `fix_masks.py`).
- **Ciglia per ogni forma d'occhio (8/10)**: 30 pezzi `eyes/<forma>__<ciglia>` generati con
  Higgsfield (job in `jobs.tsv`, circa 46 crediti) e costruiti da `build_lash_combos.py`.
- **Estrazione dei capelli (8/10)**: niente più velatura del viso di partenza nell'attaccatura
  (afro M e altre, passo 7 di `fix_masks.py`), niente buchi o frammenti isolati (passo 8), attaccatura dell'afro F ricostruita dalla sorgente
  (`rebuild_hairline.py`); le ombre dei capelli su braccia e maglietta sono velature
  nere, la pelle ridisegnata è trasparente, e niente più blocco di capelli sulla guancia (passo 6
  di `fix_masks.py`, su tutte le 36 pettinature).
- **Pettinature M (8/10)**: tutte le 18 pettinature hanno ora la loro versione M (le ultime tre,
  buzz, chignon e ricci corti, generate l'8/10). Cappelli, occhiali e gioielli restano generati solo
  su F e riusati su M.
- Su telefono l'anteprima fissa dell'avatar occupa metà schermo: l'elenco dei tagli scorre
  in poco spazio. Il taglio di partenza ora c'è (M "Medi (ciuffo)", F "Mossi lunghi sciolti",
  `DEFAULT_HAIR` in `src/lib/avatar/config.ts`).
- **Difetti minori (9/10)**: sistemati i rettangoli chiari alle tempie (pettinature M), il contorno
  delle sopracciglia con "Nessuna" e i buchi e le macchie del trench (passi 9-10 di `fix_masks.py`).
  La fascia grigia in vita con i costumi non c'è nel sito: il renderer la colora come il costume.
  Sistemati anche (passi 11-15): grumi sotto l'orlo del gilet M e del completo F, sbavature dei
  polsini del camice, aloni sul contorno delle braccia (torso nudo, canotte), fessure chiare alle
  tempie (frangetta F, ricci lunghi F). Il 9/10 gilet, camice e canotta colorata M sono stati
  rigenerati su Higgsfield (job in `jobs.tsv`), tolta l'ombra scambiata per pelle sulla coscia del
  corpo base M e accordata la tinta della pelle dei busti con quella delle braccia (passo 14).
  Tolta anche la linea sulle braccia con canotte, top e torso nudo (ombra dell'orlo della manica
  del corpo base, passo 14 di `fix_masks.py`) e sistemati i polsini del camice: mani senza resti
  della mano d'origine e falda accanto alla mano destra M raddrizzata (passo 15).

## Verifiche utili in locale

```bash
npm install
npx tsc --noEmit -p .
npx eslint src/lib/avatar src/components/avatar src/components/questionario
npm run build && npx next start -p 3123
```

`src/components/layout/CookieConsent.tsx` ha un errore di lint preesistente, non legato a questo lavoro.
