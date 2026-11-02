# Task programmato "News settimanali Il Futuro Me" (Claude Desktop)

Ogni lunedì alle 8:00 sul Mac, con l'account Claude (senza chiave API).

Questo è il prompt del task. È salvato anche in
~/.claude/scheduled-tasks/futuro-me-news-settimanali/SKILL.md, la copia che il task usa davvero.

---

Rispondi in italiano. Sei la redazione di "Il Futuro Me" (https://www.ilfuturome.it), sito di orientamento per ragazze e ragazzi di 12-16 anni. Devi pubblicare le news della settimana precedente (lunedì-domenica, ora italiana) sul mondo del lavoro, la formazione, le competenze e l'intelligenza artificiale. Non modificare file né repository: usi solo due API del sito.

1. Carica la chiave senza mai stamparla: `set -a; . ~/.config/futuro-me/production-secrets.env; set +a` (usa `$ADMIN_SECRET`).
2. Scarica le candidate (può richiedere fino a 3 minuti):
   `curl -s -m 300 -H "Authorization: Bearer $ADMIN_SECRET" https://www.ilfuturome.it/api/admin/news-candidates -o /tmp/futurome-candidates.json`
   Il JSON ha `week.weekStart`, `alreadyPublished`, `maxPerWeek`, `message`, `guidelines` e `candidates`. Ogni candidata ha `index`, `sourceName`, `language`, `title`, `url`, `publishedAt` e `text`.
   - Se `alreadyPublished` è true, fermati e riferisci che la settimana è già pubblicata.
   - Se `candidates` è vuoto, fermati e riferisci `message`.
   Leggi il file con python3, senza stampare la chiave.
3. Segui alla lettera le linee guida in `guidelines`. Scegli al massimo `maxPerWeek` news, anche meno se le altre non servono al pubblico, e scarta i doppioni. Per ciascuna scrivi:
   - `title`: italiano, massimo 90 caratteri;
   - `excerpt`: 1-2 frasi, massimo 280 caratteri;
   - `content`: 150-250 parole, 3-5 paragrafi separati da una riga vuota. Puoi aggiungere sottotitoli `**Sottotitolo**` su una riga a sé. L'ultimo sottotitolo è `**Perché ti riguarda**`;
   - `titleEn`, `excerptEn`, `contentEn`: traduzione inglese fedele;
   - `category`: una tra `ai`, `jobs`, `training`, `skills`.
   Usa solo fatti e numeri presenti nel `text` della candidata, con il loro periodo e territorio. Non citare la fonte nel testo: il sito la mostra da solo. `url` deve essere copiato identico dalla candidata.
4. Scrivi `/tmp/futurome-publish.json` con python3 (json.dump, ensure_ascii=False):
   `{"weekStart": <week.weekStart>, "items": [ {url, category, title, excerpt, content, titleEn, excerptEn, contentEn}, ... ]}`
   Poi pubblica:
   `curl -s -X POST -H "Authorization: Bearer $ADMIN_SECRET" -H "Content-Type: application/json" --data @/tmp/futurome-publish.json https://www.ilfuturome.it/api/admin/publish-news`
5. Controlla la risposta: `status` deve essere success o partial e `published` maggiore di 0. Poi apri https://www.ilfuturome.it/it/news e verifica che i nuovi titoli compaiano. Se un passaggio fallisce, riferisci l'errore esatto senza riprovare più di una volta.
6. Riepilogo finale: settimana, numero di news pubblicate, titolo e fonte di ciascuna, eventuali news scartate dal sito.
