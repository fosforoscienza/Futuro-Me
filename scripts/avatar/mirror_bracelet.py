"""Sposta il bracciale sull'altro polso (dopo fix_masks.py).

Orologio e bracciale erano generati sullo stesso polso (il sinistro dell'avatar): scelti
insieme si sovrapponevano. Il bracciale passa al polso destro, ribaltato a specchio: in
ogni riga x diventa cS + cD - x, con cS e cD i centri del braccio sinistro e destro del
corpo base a quell'altezza (retta che approssima le righe, così il pezzo non si sfalsa
di riga in riga), così segue l'inclinazione del braccio. Restano solo i pezzi
del bracciale sul braccio (via i frammenti sparsi altrove).

È idempotente: il pezzo spostato è segnato nel manifest ("mirrored").

Uso:
  python3 -I scripts/avatar/mirror_bracelet.py public/avatar src/lib/avatar/assets.json
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

PUB, MANIFEST = sys.argv[1], sys.argv[2]
ROOT = os.path.dirname(os.path.normpath(PUB))  # cartella "public"
d = json.load(open(MANIFEST))
W, H = d['size']


def place(e):
    out = np.zeros((H, W, 4), np.float32)
    out[e['y']:e['y'] + e['h'], e['x']:e['x'] + e['w']] = np.asarray(
        Image.open(os.path.join(ROOT, e['src'].lstrip('/'))).convert('RGBA'))
    return out


for body in ('F', 'M'):
    e = d['layers']['arms/bracciale'][body]
    if e.get('mirrored'):
        continue
    img = place(e)
    base = place(d['bodies'][body])[..., 3] > 128
    # braccia: primo e ultimo tratto pieno di ogni riga del corpo base
    arms = {}
    for y in range(e['y'], e['y'] + e['h']):
        edges = np.nonzero(np.diff(np.r_[0, base[y].astype(int), 0]))[0]
        if len(edges) >= 4:
            arms[y] = (edges[0], edges[1], edges[-2], edges[-1])
    # pezzi del bracciale sul braccio destro dell'immagine
    alpha = img[..., 3] > 20
    lab, n = ndi.label(alpha)
    keep = np.zeros((H, W), bool)
    for i, sl in enumerate(ndi.find_objects(lab)):
        cy, cx = (sl[0].start + sl[0].stop) // 2, (sl[1].start + sl[1].stop) // 2
        if cy in arms and arms[cy][2] - 4 <= cx <= arms[cy][3] + 4:
            keep |= lab == i + 1
    keep = ndi.binary_dilation(keep, iterations=2)
    rows = np.array(sorted(arms))
    centres = np.array([sum(arms[y]) / 2 for y in rows])
    fit = np.poly1d(np.polyfit(rows, centres, 1))
    out = np.zeros_like(img)
    xs = np.arange(W)
    for y in rows:
        row = img[y] * keep[y][:, None]
        to = np.round(fit(y) - xs).astype(int)
        ok = (row[:, 3] > 0) & (to >= 0) & (to < W)
        out[y, to[ok]] = row[ok]
    ys, xs = np.nonzero(out[..., 3] > 0)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rel = e['src'].lstrip('/')
    Image.fromarray(np.clip(out[y0:y1, x0:x1], 0, 255).astype('uint8'), 'RGBA').save(
        os.path.join(ROOT, rel), 'WEBP', quality=90, method=6)
    e.update(x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0), mirrored=1)
    print(body, (x0, y0, x1 - x0, y1 - y0), flush=True)

json.dump(d, open(MANIFEST, 'w'), indent=1)
