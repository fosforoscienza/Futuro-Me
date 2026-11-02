# News automatiche e fonti

Aggiornato al 2 novembre 2026.

Ogni lunedì alle 8:00 (ora italiana) il sito pubblica da solo le news sul mondo del lavoro della
settimana precedente (lunedì-domenica), prese da fonti autorevoli. Le fonti si gestiscono dalla
console `/admin`. Ogni news mostra sempre il nome della fonte e il link all'articolo originale, sia
nell'elenco sia nella pagina della news.

## Come funziona

1. **Raccolta giornaliera.** Vercel Cron chiama `/api/cron/fetch-news` ogni giorno alle 06:00 e
   alle 07:00 UTC. Ogni chiamata legge i feed RSS/Atom delle fonti attive (`news_sources`) e
   salva gli elementi in `news_feed_items` (deduplicati per URL, conservati 60 giorni). Serve
   ogni giorno perché diversi feed (ANSA Economia, Corriere Economia, Sole 24 Ore Scuola e
   Tecnologia) mostrano solo gli ultimi 1-3 giorni. Per i feed WordPress si leggono anche le
   pagine successive (`?paged=N`, campo "Pagine" della fonte).
2. **Pubblicazione del lunedì.** Il cron di Vercel è in UTC: le 8:00 a Roma sono le 06:00 UTC con
   l'ora legale e le 07:00 UTC con l'ora solare. La route pubblica solo nella chiamata che cade
   alle 8 italiane (`isPublishWindow` in `src/lib/news/week.ts`); l'altra si limita a raccogliere.
   Su piano Hobby Vercel può far partire il cron in un momento qualsiasi dell'ora: il controllo
   guarda solo l'ora, quindi va bene lo stesso.
3. **Selezione.** Dagli elementi della settimana precedente (lun 00:00 – dom 23:59, ora italiana)
   il job:
   - tiene quelli pertinenti: per le fonti con "filtro parole chiave", serve un punteggio minimo
     su lavoro, giovani, scuola, formazione, competenze e AI (`src/lib/news/select.ts`);
   - scarta i doppioni: stesso URL già pubblicato, oppure titolo molto simile a un altro della
     settimana o delle 4 settimane precedenti;
   - prende al massimo 3 candidati per fonte (18 in tutto).
4. **Riassunto.** Senza chiave API (configurazione attuale) le news le scrive il **task
   programmato di Claude Desktop** "News settimanali Il Futuro Me", ogni lunedì alle 8:00 sul
   Mac, con l'account Claude. Il task chiama `GET /api/admin/news-candidates`, che raccoglie i
   feed e restituisce le candidate con il testo degli articoli e le linee guida editoriali.
   Poi scrive i testi e li invia a `POST /api/admin/publish-news`. Il sito accetta solo URL
   raccolti davvero dalle fonti attive; nome della fonte, link e titolo originale li prende dal
   database. Prompt completo in [news-claude-task.md](news-claude-task.md). Il task gira solo
   con l'app aperta: se il Mac è spento parte alla prima apertura. In questa configurazione il
   cron di Vercel si limita a raccogliere.

   In alternativa, con `ANTHROPIC_API_KEY` impostata su Vercel, Claude (`claude-opus-5-5`, output JSON
   validato con zod) sceglie fino a `NEWS_MAX_PER_WEEK` news (6 se non impostata) adatte a
   ragazzi di 12-16 anni. Per ciascuna scrive titolo, sommario e testo in italiano, più la
   traduzione inglese per `/en`. Il prompt vieta numeri o fatti che non compaiono nel testo della
   fonte. Il job passa a Claude il testo della pagina originale, oppure la descrizione del feed se
   la pagina non si legge.

   Senza chiave, o se la chiamata fallisce, il job pubblica comunque estratti delle fonti in
   italiano, con una soglia di pertinenza più alta e al massimo 2 news per fonte. Il campo
   `summary_method` registra quale dei due metodi è stato usato.
5. **Pubblicazione.** Le news vanno in `news_articles` con stato `published`, senza approvazione
   manuale. Il job poi invalida la cache di home, elenco news, pagine news e sitemap. Le pagine
   si aggiornano comunque almeno una volta all'ora.
6. **Registro.** Ogni esecuzione del lunedì o manuale scrive una riga in `news_job_runs`: stato,
   conteggi, messaggio e log per fonte. Non si pubblica due volte la stessa settimana, a meno di
   usare "Forza".

Le news scritte a mano restano in `src/lib/news-data.ts` e compaiono insieme a quelle automatiche,
ordinate per data.

## Console `/admin`

- Si entra con `ADMIN_SECRET`, cioè la stessa chiave che già protegge `/api/admin/*`. Il cookie di
  sessione è firmato con HMAC, dura 12 ore e non contiene il segreto. Login limitato a 5
  tentativi ogni 5 minuti per IP.
- Cosa si può fare:
  - vedere le fonti con l'esito dell'ultima lettura;
  - aggiungerle, modificarle, attivarle o disattivarle;
  - provare un feed prima di salvarlo con il pulsante "Prova feed".
- **Job:** mostra l'ultima esecuzione e lo storico con il log. "Esegui ora" lancia il job su una
  settimana a scelta, con l'opzione "Forza".
- **News pubblicate:** si può nascondere o ripubblicare una news a posteriori.
- `/admin` è escluso dal routing per lingua (`src/proxy.ts`), ha `noindex` ed è bloccato in
  `robots.txt`.

Avvio manuale anche via API:

```bash
curl -X POST https://www.ilfuturome.it/api/admin/trigger-news \
  -H "Authorization: Bearer $ADMIN_SECRET" -H "Content-Type: application/json" \
  -d '{"weekStart":"2026-10-26","force":false}'
```

## Variabili d'ambiente (Vercel, Production)

| Variabile | Obbligatoria | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | sì | Supabase (già impostata per il questionario) |
| `SUPABASE_SERVICE_ROLE_KEY` | sì | letture e scritture lato server (già impostata) |
| `CRON_SECRET` | sì | Vercel la manda come `Authorization: Bearer …` alle chiamate cron. Senza, la route risponde 503 |
| `ADMIN_SECRET` | sì | accesso a `/admin` e `/api/admin/*` (ripiego: `CRON_SECRET`) |
| `ANTHROPIC_API_KEY` | no | solo per far scrivere le news al cron di Vercel; oggi le scrive il task di Claude Desktop |
| `NEWS_MAX_PER_WEEK` | no | news massime per settimana (1-20, predefinito 6) |
| `NEWS_SUMMARY_MODEL` | no | modello per il riassunto (predefinito `claude-opus-5-5`) |

Nessun segreto è nel codice.

## Database

Migrazioni applicate in produzione il 2/11/2026: `20261102010000_news_claude_trigger.sql`
aggiunge il valore `claude` alla colonna `trigger` delle esecuzioni, e
`supabase/migrations/20261102000000_news_automation.sql` crea `news_sources`,
`news_feed_items`, `news_articles` e `news_job_runs` e inserisce le 25 fonti verificate. È
idempotente: si può rilanciare senza duplicare nulla.

- **RLS.** Fonti, elementi raccolti ed esecuzioni non hanno policy, quindi li tocca solo il
  service role. `news_articles` è leggibile da tutti solo con stato `published`.
- **Dove applicarla.** Sul Supabase self-hosted del Mac mini (api.fosforo.info), come per il
  questionario (vedi HANDOFF.md):

  ```bash
  ssh mac-mini 'docker exec -i supabase-db psql -U postgres -d postgres' \
    < supabase/migrations/20261102000000_news_automation.sql
  ```

  La migrazione termina con `notify pgrst, 'reload schema'`.

## Fonti

Ogni feed è stato scaricato con lo user agent del job e controllato come XML valido il 2/11/2026.
La raccolta di prova in locale ha letto tutte e 25 le fonti senza errori: 1.098 elementi, di cui
276 nella settimana 26/10–1/11.

### Attive (25)

| Fonte | Lingua | Categoria | Note |
|---|---|---|---|
| ISTAT – Comunicati e notizie | it | lavoro | generico, filtrato; 3 pagine |
| INPS – Notizie | it | lavoro | date gg/mm/aaaa, senza descrizione |
| Ministero del Lavoro – Notizie | it | lavoro | date in italiano, senza descrizione |
| Unioncamere – Comunicati stampa (incl. Excelsior) | it | lavoro | |
| Banca d'Italia – Notizie | it | lavoro | filtrato |
| Eurostat – News releases | en | lavoro | Atom |
| Eurostat – Popolazione e condizioni sociali | en | formazione | Atom |
| Commissione europea – DG Occupazione e affari sociali | en | competenze | |
| OECD Education Today | en | competenze | blog OCSE: oecd.org blocca i bot |
| Il Sole 24 Ore – Lavoro | it | lavoro | |
| Il Sole 24 Ore – Formazione e ITS | it | formazione | senza filtro |
| Il Sole 24 Ore – Scuola | it | formazione | copre circa 3 giorni |
| Il Sole 24 Ore – Tecnologia | it | AI | copre circa 3 giorni |
| ANSA – Economia | it | lavoro | copre circa 1 giorno |
| ANSA – Tecnologia | it | AI | |
| Corriere della Sera – Economia | it | lavoro | copre circa 3 giorni |
| Agenda Digitale | it | AI | 3 pagine |
| Agenda Digitale – Competenze digitali | it | competenze | senza filtro |
| Agenda Digitale – Scuola digitale | it | formazione | |
| AI4Business – Intelligenza artificiale | it | AI | 2 pagine |
| Openpolis | it | formazione | |
| lavoce.info | it | lavoro | 2 pagine |
| INDIRE | it | formazione | feed da 500 elementi |
| AlmaLaurea | it | formazione | |
| Orizzonte Scuola – Orientamento | it | formazione | senza filtro, bassa frequenza |

### Scartate

| Fonte | Motivo |
|---|---|
| INAPP | 403 (Cloudflare) su tutto il sito |
| OCSE / OECD | 403 su oecd.org, sostituita da OECD Education Today |
| World Economic Forum | 403 (Akamai) |
| Eurofound | 429 costante |
| Cedefop | news 403; il feed generico contiene solo allegati e bandi |
| ILO, CNEL, MIM, Sviluppo Lavoro Italia (ex ANPAL), Sistema Excelsior | nessun feed (i comunicati Excelsior escono nel feed Unioncamere) |
| Wired Italia | feed fermo al 1/7/2026 |
| ELA, Banca d'Italia – Comunicati, Eurostat – Aggiornamenti dataset | non pertinenti |

Queste fonti autorevoli restano senza feed. Si possono aggiungere dalla console quando
pubblicheranno un feed utilizzabile.

## Controllo dei dati del sito (2/11/2026)

Ogni numero mostrato ora ha la fonte accanto. I valori sono stati controllati sui documenti
originali: PDF del WEF, PDF Excelsior, comunicato GreenItaly, PDF INAPP, PDF della Camera di
Commercio. I dati Eurostat sono stati presi dall'API ufficiale (aggiornata al 30/10/2026).

### Pagina Mercato del lavoro

| Prima | Esito | Ora | Fonte |
|---|---|---|---|
| Professioni con crescita +35%, +45%, +28%, +22%, +30%, +38% | nessuna fonte trovata | lavoratori richiesti in Italia 2025-2029, ad esempio Tecnici della salute 157.100–166.700 e Analisti e progettisti di applicazioni 29.700–31.600 | Excelsior, previsioni 2025-2029, II aggiornamento, tab. 5.2 |
| 30% attività automatizzabili entro il 2030 | solo da fonte secondaria (McKinsey, ore lavorate negli USA) | 39% delle competenze cambierà entro il 2030; 170 milioni di nuovi lavori e 92 milioni sostituiti | WEF Future of Jobs 2025 |
| "Nuove professioni 65%" | stima senza fonte, nota come mito | 86% delle imprese si aspetta una trasformazione da AI e trattamento delle informazioni | WEF Future of Jobs 2025 |
| 78% aziende cerca profili "T-shaped" | nessuna fonte trovata | 7 imprese su 10 (69%) considerano essenziale il pensiero analitico; l'85% punta a far crescere le competenze dei dipendenti | WEF Future of Jobs 2025 |
| NEET Senigallia 16,7% (2019), "media UE 9%" | nessuna fonte trovata; il 9% è l'obiettivo UE al 2030, non la media | NEET 15-29 anni nel 2025: Marche 10,8%, Italia 13,3%, UE 11,0% (Marche nel 2019: 15,3%) | Eurostat edat_lfse_22 |
| Inattività giovanile 18-29 Provincia di Ancona 51,3% | nessuna fonte trovata | disoccupazione 15-29 anni nel 2025: Marche 14,4%, Italia 14,4%, UE 11,7% | Eurostat lfst_r_lfu3rt |
| 54,8% segue il consiglio orientativo | nessuna fonte trovata | rimosso, sostituito con: Provincia di Ancona 2024, 50,6% delle assunzioni previste di difficile reperimento, occupazione 15-64 anni al 66,2% | Camera di Commercio delle Marche, Dataview 2025 |

### News scritte a mano (`src/lib/news-data.ts`)

**WEF Future of Jobs 2025**
- Corretti:
  - "60% delle aziende trasformate dall'AI": il valore giusto è 86%.
  - "85% indica il pensiero analitico": il valore giusto è 69%, cioè 7 su 10.
  - La seconda e la terza competenza.
  - L'elenco dei lavori in più rapida crescita.
- Tolto "Italia in posizione intermedia": nessuna fonte.
- Aggiunto il paragrafo sull'Italia (p. 71 del report).
- La fonte ora punta al PDF ufficiale.

**LinkedIn Skills on the Rise 2025**
- Corretta la classifica.
- Chiarito che vale solo per gli Stati Uniti.
- Esiste un'edizione 2026 che include l'Italia, non ancora usata nel sito.

**Green economy**
- I numeri (3,3 milioni, 13,8%, +4,3%) erano giusti, ma venivano da GreenItaly 2025
  (Symbola–Unioncamere, 11/11/2025), non da Excelsior Orienta: corretti fonte e data.
- Il "75% Manpower" è un dato globale, non italiano: sostituito con la dichiarazione di
  Unioncamere ("oltre la metà dei green jobs" difficili da reperire).

**Fondo per la Repubblica Digitale**
- "Italia terzultima (DESI 2024)" era sbagliato: sostituito con il dato Eurostat 2025 sulle
  competenze digitali almeno di base, Italia 54,3% contro UE 60,4%.
- I 70 milioni per i bandi 2025 si trovano solo nella fonte secondaria già citata (TiConsiglio).

**Prompt Engineer (Il Sole 24 Ore)**
- Tolti gli stipendi 35.000–120.000 €, che non compaiono nell'articolo.
- "Quintuplicate" diventa "quasi quintuplicate (LinkedIn)".
- Chiarito che è un contributo esterno, non un'analisi della redazione.

**Apprendistato INAPP**
- Il XXII rapporto è superato. La news ora usa il XXIII Rapporto (settembre 2026): 583.548
  apprendisti nel 2023, Marche 20.883, Marche prima per apprendistato nell'artigianato (33,0%).
- La fonte è la pagina del Ministero del Lavoro, al posto di Teleborsa.
- La data della news è segnata come 1/9/2026 perché il rapporto indica solo il mese.

### Dati non verificabili dall'esterno

Le statistiche del progetto in home (1.200 ragazzi, 4 scuole, 192 ore, 2 università) e
l'avanzamento in Archivio (45%) sono dati interni del progetto. Vanno confermati da chi lo
gestisce.
