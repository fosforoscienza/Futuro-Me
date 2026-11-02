"""Attenua i pezzi troppo marcati, sugli asset già pubblicati (dopo fix_masks.py).

È idempotente: ogni pezzo ritoccato è segnato nel manifest ("toned") e non viene
ritoccato due volte.

  1. Nasi M "all'insù", "aquilino" e "a patata": il pezzo diventa in parte trasparente
     e lascia vedere il naso del corpo base, così la forma resta ma è molto meno marcata.

Uso:
  python3 -I scripts/avatar/tone_down.py public/avatar src/lib/avatar/assets.json
"""
import json
import os
import sys

import numpy as np
from PIL import Image

PUB, MANIFEST = sys.argv[1], sys.argv[2]
ROOT = os.path.dirname(os.path.normpath(PUB))  # cartella "public"
d = json.load(open(MANIFEST))

# pezzo -> opacità che resta del pezzo originale
FADE = {
    ('nose/insu', 'M'): 0.45,
    ('nose/aquilino', 'M'): 0.45,
    ('nose/patata', 'M'): 0.55,
}


def path(e, key='src'):
    return os.path.join(ROOT, e[key].lstrip('/'))


def fade(e, k):
    im = np.asarray(Image.open(path(e)).convert('RGBA')).astype(np.float32)
    im[..., 3] *= k
    Image.fromarray(np.clip(im, 0, 255).astype('uint8'), 'RGBA').save(path(e), 'WEBP', quality=90, method=6)


for (key, body), k in FADE.items():
    e = d['layers'][key][body]
    if e.get('toned', 0) >= 1:
        continue
    fade(e, k)
    e['toned'] = 1
    print(key, body, k, flush=True)

json.dump(d, open(MANIFEST, 'w'), indent=1)
