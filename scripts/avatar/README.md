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
python3 -I scripts/avatar/build_lash_combos.py raw public/avatar src/lib/avatar/assets.json
python3 -I scripts/avatar/fix_masks.py public/avatar src/lib/avatar/assets.json
```

`build_lash_combos.py` crea i pezzi `eyes/<forma>__<ciglia>` (forma d'occhio con le sue
ciglia): le ciglia di `lashes/*` sono disegnate sull'occhio del corpo base e non
combaciano con le altre forme. Le immagini sono modifiche di `eyes__<forma>.png`
("aggiungi solo le ciglia") salvate come `raw/<F|M>/eyes__<forma>__<ciglia>.png`;
dentro l'occhio si tiene la forma originale e dall'immagine generata si prendono solo le
ciglia. Il renderer usa il pezzo combinato quando sono scelte sia la forma sia le ciglia.

`fix_masks.py` rifinisce gli asset già generati (non servono le immagini sorgenti) e va
lanciato dopo ogni `build_assets.py`: maschera morbida delle sopracciglia senza l'ombra
della palpebra, maschera geometrica delle iridi, pulizia del viso nei pezzi sovrapposti
(capelli, occhiali, ciglia... non devono coprire occhi e pelle già ricolorati) e
statistiche OKLab usate dal renderer per cambiare colore a capelli e occhi.

Per rifare solo una categoria (più veloce, salta oggetti e ambienti):
`ONLY=torso__ python3 -I scripts/avatar/build_assets.py raw /tmp/out /tmp/out.json`,
poi copiare i file e le voci del manifest che servono.

Per aggiungere un pezzo: generarlo come modifica del corpo base (stessa
inquadratura), aggiungerlo in `raw/`, rilanciare lo script e collegarlo a una
scelta in `src/lib/avatar/config.ts`.
