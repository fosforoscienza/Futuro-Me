# Asset dell'avatar

Gli asset in `public/avatar` e il manifest `src/lib/avatar/assets.json` sono
generati da `build_assets.py` a partire dalle immagini create con Higgsfield
(modifiche "Nano Banana 2" dei due corpi base, oggetti e ambienti).

- `jobs.tsv`: per ogni pezzo, categoria/nome, corpo di partenza (F, M, X =
  oggetto/ambiente) e id del job Higgsfield che l'ha generato.
- Le immagini sorgenti non sono nel repository: vanno scaricate in
  `raw/F`, `raw/M`, `raw/X` con nome `categoria__nome.png` (più `raw/F/base.png`
  e `raw/M/base.png`).

```bash
python3 -m pip install pillow numpy
python3 -I scripts/avatar/build_assets.py raw public/avatar src/lib/avatar/assets.json
```

Per rifare solo una categoria (più veloce, salta oggetti e ambienti):
`ONLY=torso__ python3 -I scripts/avatar/build_assets.py raw /tmp/out /tmp/out.json`,
poi copiare i file e le voci del manifest che servono.

Per aggiungere un pezzo: generarlo come modifica del corpo base (stessa
inquadratura), aggiungerlo in `raw/`, rilanciare lo script e collegarlo a una
scelta in `src/lib/avatar/config.ts`.
