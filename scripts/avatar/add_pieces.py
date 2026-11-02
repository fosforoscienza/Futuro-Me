"""Pezzi disegnati qui, senza immagini generate (dopo fix_masks.py).

  1. jewel/pallina: orecchino a pallina nera lucida su ciascun lobo. I lobi si trovano sul
     profilo del corpo base: dove, scendendo, il contorno dell'orecchio rientra verso il collo.
  2. skin/lentiggini: lentiggini leggere su guance e dorso del naso, per ciascun corpo.
     Puntini più scuri della pelle sotto, semitrasparenti e marcati come pelle nella
     maschera, così prendono il colore dell'incarnato scelto (sulla pelle scura si vedono
     appena, come dal vero). Posizioni casuali ma fisse (seme), attorno agli occhi del corpo.

Rilanciarlo riscrive i due pezzi da capo.

Uso:
  python3 -I scripts/avatar/add_pieces.py public/avatar src/lib/avatar/assets.json
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
K = 4  # sovracampionamento per bordi morbidi

BALL_R = 3.0


def place(e, key='src', mode='RGBA'):
    out = np.zeros((H, W, len(mode)), np.float32)
    out[e['y']:e['y'] + e['h'], e['x']:e['x'] + e['w']] = np.asarray(
        Image.open(os.path.join(ROOT, e[key].lstrip('/'))).convert(mode))
    return out


def save(rel, rgba, mask=None):
    a = rgba[..., 3]
    ys, xs = np.nonzero(a > 2)
    y0, y1, x0, x1 = ys.min() - 1, ys.max() + 2, xs.min() - 1, xs.max() + 2
    Image.fromarray(np.clip(rgba[y0:y1, x0:x1], 0, 255).astype('uint8'), 'RGBA').save(
        os.path.join(PUB, rel + '.webp'), 'WEBP', quality=92, method=6)
    entry = dict(src=f'/avatar/{rel}.webp', x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0),
                 shift=[0, 0], fixed=21)
    if mask is not None:
        Image.fromarray(np.clip(mask[y0:y1, x0:x1], 0, 255).astype('uint8'), 'RGB').save(
            os.path.join(PUB, rel + '.mask.png'), optimize=True)
        entry['mask'] = f'/avatar/{rel}.mask.png'
    return entry


def down(a):
    """Da K volte la risoluzione a quella del manifest (media dei blocchi)."""
    return a.reshape(H, K, W, K, *a.shape[2:]).mean((1, 3))


def lobes(body):
    """Fondo dei lobi: dove, scendendo, il contorno rientra di 6 pixel in 2 righe."""
    sil = place(d['bodies'][body])[..., 3] > 128
    left = [np.nonzero(sil[y])[0].min() for y in range(170, 240)]
    right = [np.nonzero(sil[y])[0].max() for y in range(170, 240)]
    out = []
    for side, sign in ((left, 1), (right, -1)):
        y = next(i for i in range(2, len(side)) if sign * (side[i] - side[i - 2]) >= 6)
        out.append((side[y - 2] + sign * 1.5, 170 + y - 3.5))
    return out


# --- 1. orecchino a pallina ----------------------------------------------------
yy, xx = np.mgrid[0:H * K, 0:W * K] / K
for body in ('F', 'M'):
    rgba = np.zeros((H * K, W * K, 4), np.float32)
    for cx, cy in lobes(body):
        r = np.hypot(xx - cx, yy - cy) / BALL_R
        inside = r < 1
        # sfera nera lucida: più chiara verso il bordo, riflesso in alto a sinistra
        shade = 22 + 30 * r ** 3
        glint = np.clip(1 - np.hypot(xx - (cx - 1.2), yy - (cy - 1.3)) / 1.1, 0, 1) ** 2
        col = shade + 200 * glint
        rgba[inside, :3] = np.stack([col, col, col * 1.04], -1)[inside]
        rgba[inside, 3] = 255
    d['layers'].setdefault('jewel/pallina', {})[body] = save(f'{body}/jewel__pallina', down(rgba))
    print('jewel/pallina', body, lobes(body), flush=True)

# --- 2. lentiggini leggere ---------------------------------------------------
rng = np.random.default_rng(15)
for body in ('F', 'M'):
    b = d['bodies'][body]
    base = place(b)
    iris = place(b, 'mask', 'RGB')[..., 2] > 60
    lab, n = ndi.label(iris)
    sizes = ndi.sum(iris, lab, range(1, n + 1))
    eyes = sorted((ndi.center_of_mass(iris, lab, i + 1) for i in np.argsort(sizes)[-2:]), key=lambda c: c[1])
    ey = (eyes[0][0] + eyes[1][0]) / 2
    mid = (eyes[0][1] + eyes[1][1]) / 2
    spots = []
    # guance sotto gli occhi e dorso del naso
    for (cx, cy, rx, ry, n_spots) in [(eyes[0][1] + 4, ey + 24, 18, 9, 34), (eyes[1][1] - 4, ey + 24, 18, 9, 34),
                                      (mid, ey + 16, 9, 10, 14)]:
        while n_spots:
            x, y = rng.uniform(-1, 1, 2)
            if x * x + y * y > 1:
                continue
            spots.append((cx + x * rx, cy + y * ry, rng.uniform(0.6, 1.4), rng.uniform(0.12, 0.28)))
            n_spots -= 1
    yy, xx = np.mgrid[0:H * K, 0:W * K] / K
    alpha = np.zeros((H * K, W * K), np.float32)
    for x, y, r, a in spots:
        sl = (slice(int((y - 3) * K), int((y + 3) * K)), slice(int((x - 3) * K), int((x + 3) * K)))
        dist = np.hypot(xx[sl] - x, yy[sl] - y)
        alpha[sl] = np.maximum(alpha[sl], a * np.clip((r - dist) / 1.2 + 0.5, 0, 1))
    alpha = down(alpha) * (base[..., 3] / 255)
    # colore: la pelle sotto, più scura e un po' più calda
    rgb = base[..., :3] * np.array([0.72, 0.62, 0.55], np.float32)
    mask = np.dstack([np.full((H, W), 255, np.float32), np.zeros((H, W)), np.zeros((H, W))]) * (alpha[..., None] > 0.01)
    d['layers'].setdefault('skin/lentiggini', {})[body] = save(f'{body}/skin__lentiggini', np.dstack([rgb, alpha * 255]), mask)
    print('skin/lentiggini', body, len(spots), flush=True)

json.dump(d, open(MANIFEST, 'w'), indent=1)
