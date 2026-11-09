# Audit privacy, GDPR e AI Act — 9 novembre 2026

Ambito: codice del branch `feat/geo-premium` (incluse le modifiche non ancora
committate), migrazioni Supabase, testi IT/EN di `/privacy`, avviso cookie,
pipeline news. Non sono verificabili dal codice: contratti, consensi raccolti
nelle scuole, configurazione di Vercel/Supabase in produzione, backup e log.
Questo documento non è un parere legale: le scelte segnate «decisione del
titolare» spettano a Fondazione Caritas Senigallia ETS.

> **Aggiornamento stesso giorno:** il questionario ora usa token di 4 parole al posto degli
> account studente ([questionario-token.md](questionario-token.md)). Risolti nel codice i
> punti 2 (chiusura degli abbinamenti implementata), 11 (niente più «anonimo») e, per i
> nuovi dati, 7 e 8 (nessun account da esportare o cancellare). Restano le decisioni del
> titolare e i dati raccolti con il sistema precedente.

## Sintesi

| # | Priorità | Ambito | Problema |
|---|----------|--------|----------|
| 1 | Alta | GDPR art. 13(1)(c) | La base giuridica pubblicata copre solo i cookie; manca per account, questionario, avatar, valutazione |
| 2 | Alta | GDPR art. 5(1)(a)(e), 13(2)(a) | Promessa di cancellazione/anonimizzazione a fine progetto non implementata |
| 3 | Alta | GDPR art. 7(1), 8, 12(1) | Consenso dei genitori dichiarato ma non verificabile; informativa non adatta a 12-16 anni |
| 4 | Alta | AI Act art. 50(4)-(5) | In produzione le sintesi AI sono presentate come «della redazione»; la correzione è solo nel working tree e manca sulle card |
| 5 | Media | GDPR art. 35 | DPIA non documentata: minori + confronto individuale nel tempo + avatar con tratti sensibili |
| 6 | Media | GDPR art. 13(1)(e)(f), 28, 44 | Fornitori, ruoli e trasferimenti extra SEE (Vercel, email) non indicati |
| 7 | Media | GDPR art. 9 | Avatar collegato all'account con genere, carnagione, hijab, ausili e impianti |
| 8 | Media | GDPR art. 15, 17, 20 | Nessuno strumento per esportare o cancellare i dati di uno studente |
| 9 | Media | GDPR art. 30, 32, 33 | Registro trattamenti, procedura data breach e sicurezza del Mac mini non documentati |
| 10 | Bassa | GDPR art. 13(1)(a) | Titolare senza indirizzo completo; nessuna dichiarazione su RPD/DPO |
| 11 | Bassa | Trasparenza | «Questionario anonimo» in UI/metadati: il record non è collegato, ma l'anonimato non è garantito |
| 12 | Bassa | GDPR art. 5(1)(c) | Foto news caricate da domini terzi: IP del visitatore inviato alle fonti |
| 13 | Bassa | Minimizzazione | Tabella legacy `login_tentativi` con username in chiaro |
| 14 | Bassa | AI Act art. 4 | Alfabetizzazione AI dello staff non documentata |

Punti solidi: niente analytics né cookie di profilazione, dati di registrazione
minimi (niente nome/email/data di nascita), token di sessione e contatori
antiabuso salvati come hash/HMAC, RLS senza policy e `revoke` sulle tabelle
sensibili, CSP restrittiva, `no-referrer` sulle foto, nessun dato degli studenti
inviato a servizi AI, testi già prudenti su pseudonimizzazione e campi liberi.

## GDPR

### 1. Base giuridica assente per i trattamenti principali — Alta

`privacy.legalBasisBody` (IT/EN) cita solo il consenso «per i cookie non
essenziali» e il legittimo interesse per i cookie tecnici. Il sito non usa
cookie non essenziali, quindi la frase è inesatta, e non c'è nessuna base per:
account studenti, questionario/avatar per fase, confronto inizio/fine,
questionario senza account, email, sicurezza/antiabuso.

Da fare (decisione del titolare): indicare una base per ciascuna finalità.
Per una fondazione privata l'art. 6(1)(e) richiede una norma che attribuisca
il compito, quindi le strade realistiche sono il consenso dei genitori/tutori
(con prova, vedi punto 3) o il legittimo interesse con bilanciamento scritto,
difficile da sostenere per il confronto individuale di dati di minori.
Sicurezza e antiabuso: legittimo interesse (art. 6(1)(f)). Togliere la frase
sui cookie non essenziali.

### 2. Conservazione: promessa non implementata — Alta

`privacy.retentionBody`: «Al termine, gli account degli studenti vengono
cancellati e le risposte conservate solo in forma anonima». Nel repository:

- nessun job o script di fine progetto;
- `questionario_risposte.account_id` ha `ON DELETE CASCADE`
  (`20261103000000_account_studenti.sql`): cancellando un account le risposte
  spariscono, non vengono anonimizzate;
- nessuna data di fine progetto né termine di cancellazione.

Da fare: fissare data e termine (decisione del titolare), poi scrivere uno
script che, a fine progetto, imposti `account_id`/`fase` a null o copi le
risposte in una tabella aggregata, arrotondi `created_at`, cancelli account,
sessioni e classi. Verificare che in classi piccole avatar + parola libera non
consentano di riconoscere qualcuno (in quel caso pubblicare solo aggregati con
soglia minima). Finché lo script non esiste, il testo pubblico va corretto.

### 3. Minori: consenso e linguaggio — Alta

`privacy.minorsBody` afferma che è stato «raccolto il consenso dei
genitori/tutori». Se la base è il consenso, il titolare deve poterlo
dimostrare (art. 7(1)): chi lo raccoglie (scuola o Caritas), con quale modulo,
dove è archiviato, come si revoca e cosa succede a chi non partecipa
(alternativa non digitale). In Italia il consenso diretto del minore per i
servizi della società dell'informazione vale dai 14 anni (art. 2-quinquies
Codice privacy); qui gli utenti hanno 12-16 anni, quindi per i 12-13enni serve
comunque chi esercita la responsabilità genitoriale.

L'informativa è scritta in linguaggio giuridico. Art. 12(1) e considerando 58
chiedono un testo comprensibile per i minori: aggiungere una versione breve
«per ragazze e ragazzi» (5-6 frasi) in testa a `/privacy` e nel form di
registrazione, accanto all'attuale `account.privacyNote`.

### 5. DPIA da valutare e documentare — Media

Ricorrono almeno due criteri delle linee guida WP248: interessati vulnerabili
(minori) e valutazione sistematica nel tempo (confronto inizio/fine per
persona), più dati potenzialmente sensibili nell'avatar (punto 7). Una DPIA è
probabilmente necessaria; in ogni caso va scritta la valutazione, anche se si
conclude che non serve.

### 6. Fornitori, ruoli e trasferimenti — Media

L'informativa nomina Vercel e Supabase self-hosted ma non dice chi sono i
responsabili ex art. 28, dove sono trattati i dati né quali garanzie coprono i
trasferimenti verso gli Stati Uniti (Vercel Inc.: DPA, adesione al Data Privacy
Framework o SCC). Mancano il fornitore delle caselle info@/feedback@ e i ruoli
di scuole, educatori e partner (titolari autonomi, contitolari o autorizzati).
Da fare: verificare DPA e regione Vercel (es. `fra1`/`cdg1` per le funzioni),
retention dei log Vercel, fornitore email; completare `recipientsBody`.

### 7. Avatar e categorie particolari — Media

`src/lib/avatar/config.ts` e gli asset includono genere, carnagione, hijab,
stampelle, bastone, impianto, vitiligine. L'avatar è salvato in
`questionario_risposte.avatar` e, per le fasi, collegato all'account. Se
l'avatar viene letto come autoritratto, se ne possono dedurre salute, origine o
convinzioni religiose (art. 9). Da fare: dire esplicitamente nell'interfaccia e
nell'informativa che l'avatar è un personaggio immaginario e non una
descrizione di sé; non analizzare questi campi per singolo studente; includerli
nella DPIA.

### 8. Diritti degli interessati — Media

Nessuna funzione di esportazione o cancellazione: le richieste vanno gestite
a mano in SQL. Lo studente non ha email, quindi la verifica dell'identità via
posta è debole. Da fare: in `/area` un pulsante «Scarica i miei dati» (JSON:
account, classe, risposte, avatar) che usa la sessione come verifica; in
`/admin/studenti` «Elimina account» per l'admin, con conferma e registro della
richiesta.

### 9. Registro, sicurezza, data breach — Media

Il trattamento non è occasionale e riguarda minori: il registro dei
trattamenti (art. 30) è dovuto anche sotto i 250 dipendenti. Il database è un
Supabase self-hosted su un Mac mini: documentare cifratura del disco
(FileVault), backup cifrati e loro rotazione, accesso fisico, aggiornamenti,
chi ha accesso amministrativo, e una procedura data breach con notifica al
Garante entro 72 ore.

### 10. Identificazione del titolare — Bassa

`controllerBody` indica solo «Senigallia, Provincia di Ancona». Inserire
indirizzo completo confermato e una frase sul RPD/DPO (nominato con contatto,
oppure non nominato).

### 11. «Questionario anonimo» — Bassa

Il record senza account non contiene IP né user agent, ma la richiesta passa
da Vercel e in una classe piccola orario + avatar + parola libera possono
identificare qualcuno. Le etichette in `metadata.questionnaireDescription`,
`Questionario.tsx:205` e i commenti dicono «anonimo». Proposta: «non collegato
al tuo account» o «senza registrazione».

### 12. Foto news da domini terzi — Bassa

Già dichiarato in informativa. Per eliminare il trasferimento dell'IP alle
fonti si possono scaricare e servire le copertine dal proprio dominio (ricade
anche su diritti d'autore e CSP `img-src https:`).

### 13. Tabella `login_tentativi` — Bassa

Sostituita da `auth_rate_limits` (HMAC), ma resta nello schema con username in
chiaro e `admin/studenti/actions.ts:49` la usa ancora in un `delete`. Svuotarla
e rimuoverla con una migrazione.

### Cookie

Solo strumenti tecnici (`NEXT_LOCALE`, `fm_sessione`, chiave localStorage):
secondo le linee guida cookie del Garante (10 giugno 2021) non serve consenso
né banner; l'avviso «Ho capito» è lecito. Le chiavi `cookieConsent.accept` e
`reject` sono inutilizzate. Aggiornare `privacy.lastUpdated` quando si
pubblicano le correzioni.

## AI Act (Reg. UE 2024/1689)

### Classificazione

- **Deployer di un sistema AI generativo** (Claude, tramite il task
  programmato in `docs/news-claude-task.md`) che produce testi pubblicati per
  informare il pubblico: si applica l'art. 50(4), in vigore dal 2 agosto 2026.
- **Non alto rischio**: nessuna AI valuta, orienta o ammette gli studenti
  (Allegato III punto 3). Nessuna pratica vietata dall'art. 5.
- Attenzione per il futuro: usare l'AI per analizzare le risposte di singoli
  studenti o suggerire percorsi scolastici può far rientrare il sistema
  nell'Allegato III punto 3 e attiva la L. 132/2025 (accesso all'AI dei minori
  di 14 anni con consenso dei genitori). Rifare la valutazione prima.

### 4. Trasparenza delle sintesi AI — Alta

L'eccezione dell'art. 50(4) richiede revisione umana o controllo editoriale con
responsabilità editoriale. Le sintesi del task Claude vengono pubblicate
direttamente da `/api/admin/publish-news` senza revisione, quindi la
dichiarazione è obbligatoria.

- **In produzione (commit `dd8174c`)**: la nota `news.autoNote` dice «Sintesi
  della redazione di Il Futuro Me»: non dichiara l'AI e la attribuisce a
  persone.
- **Nel working tree**: `autoNoteAi`, link a `/metodo` e pagina metodo
  correggono la pagina della singola news. Non è ancora committato né in
  produzione.
- **Ancora scoperto**: card in home (`src/app/[locale]/page.tsx`) e in
  `/news` (`NewsContent.tsx`) mostrano titolo ed estratto generati dall'AI
  senza etichetta. L'art. 50(5) chiede l'informazione al più tardi alla prima
  esposizione: aggiungere un'etichetta breve «Sintesi AI» sulle card quando
  `method === "ai"`.
- La traduzione inglese è anch'essa generata: la nota EN lo copre.

In alternativa all'etichetta si può introdurre una revisione umana prima della
pubblicazione (stato `hidden` come per gli estratti e approvazione in
`/admin`) con una persona che firma come responsabile editoriale.

### 14. Alfabetizzazione AI — Bassa

L'art. 4 (in vigore da febbraio 2025) chiede ai deployer misure per
l'alfabetizzazione AI del personale che usa i sistemi. Basta una nota interna:
chi gestisce il task news, quali limiti conosce (allucinazioni, verifica dei
numeri), come correggere. Valutare anche se il task gira su un account Claude
consumer: verificare che i termini consentano l'uso per l'organizzazione e le
impostazioni sull'uso dei dati per l'addestramento (i testi inviati sono
articoli pubblici, nessun dato degli studenti).

## Ordine consigliato

1. Committare e pubblicare la dichiarazione AI, aggiungendo l'etichetta sulle
   card (punto 4).
2. Correggere subito i testi inesatti: base giuridica cookie, promessa di
   anonimizzazione, consenso dei genitori dato per raccolto, «anonimo»
   (punti 1, 2, 3, 11), anche con formule provvisorie veritiere.
3. Decisioni del titolare: basi giuridiche, procedura consensi, data di fine
   progetto, ruoli delle scuole, DPA fornitori (punti 1, 2, 3, 6).
4. DPIA e registro dei trattamenti (punti 5, 9).
5. Sviluppo: script di fine progetto, esporta/elimina dati, rimozione
   `login_tentativi`, nota avatar (punti 2, 7, 8, 13).
