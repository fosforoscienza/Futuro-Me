"""Rifà gli occhiali da vista con montatura spessa (geek, squadrati, tondi spessi).

Il passo 5 di fix_masks.py (lenti chiare trasparenti) scambiava per lente parte della
montatura: restavano montature spezzate e frammenti di pelle. Qui si riparte dalla
versione precedente a quel passo (commit 4d9ec17, montatura intera e dietro le lenti il
viso F) e si tiene solo la montatura: i pixel scuri del pezzo collegati tra loro (cerchi,
ponte e aste). Le lenti diventano del tutto trasparenti, così dietro si vedono il viso e
gli occhi scelti, anche sul corpo M che usa lo stesso file. Il colore dei bordi morbidi è
quello della montatura vicina, senza alone chiaro sulla pelle scura.

Uso:
  mkdir -p raw/glasses
  for g in geek squadrati tondi_spessi; do
    git show 4d9ec17:public/avatar/F/glasses__$g.webp > raw/glasses/$g.webp
  done
  python3 -I scripts/avatar/rebuild_glasses.py raw/glasses public/avatar src/lib/avatar/assets.json
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

RAW, PUB, MANIFEST = sys.argv[1:4]
ROOT = os.path.dirname(os.path.normpath(PUB))  # cartella "public"
d = json.load(open(MANIFEST))
W, H = d['size']
# luminosità: sotto T1 montatura piena, sopra T2 niente montatura
T1, T2 = 70, 125


def place(path, e):
    out = np.zeros((H, W, 4), np.float32)
    out[e['y']:e['y'] + e['h'], e['x']:e['x'] + e['w']] = np.asarray(Image.open(path).convert('RGBA'))
    return out


def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


# occhi del viso F: ellisse attorno a ciascun occhio (centro, semiassi)
yy, xx = np.mgrid[0:H, 0:W]
EYES, NEAR = np.zeros((H, W), bool), np.zeros((H, W), bool)
for cx, cy in ((396, 173), (452, 173)):  # centri delle iridi
    EYES |= ((xx - cx) / 21) ** 2 + ((yy - cy) / 10) ** 2 < 1
    NEAR |= ((xx - cx) / 27) ** 2 + ((yy - cy) / 17) ** 2 < 1

base = place(os.path.join(ROOT, d['bodies']['F']['src'].lstrip('/')), d['bodies']['F'])
for g in ('geek', 'squadrati', 'tondi_spessi'):
    e = d['layers'][f'glasses/{g}']['F']
    img = place(os.path.join(RAW, f'{g}.webp'), e)
    a0 = img[..., 3:4] / 255
    O = img[..., :3] * a0 + base[..., :3] * (1 - a0)  # come appariva sul viso F
    L = lum(O)
    # scuro e diverso dal viso F (occhi e ciglia di quel viso sono quasi uguali al corpo base)
    differs = np.abs(O - base[..., :3]).max(-1) > 35
    dark = ndi.binary_closing((L < T2) & differs & (img[..., 3] > 0), np.ones((3, 3)))
    # la montatura è il pezzo scuro più grande (occhi e ciglia del viso F sono a parte)
    lab, n = ndi.label(dark)
    sizes = ndi.sum(dark, lab, range(1, n + 1))
    frame = np.isin(lab, 1 + np.nonzero(sizes >= 0.25 * sizes.max())[0])
    # niente di ciò che sta attorno agli occhi del viso F (ciglia e coda dell'eyeliner
    # attaccate alla montatura): la montatura passa più in là
    frame &= ~EYES
    alpha = np.clip((T2 - L) / (T2 - T1), 0, 1) * ndi.binary_dilation(frame) * differs * ~EYES
    # vicino agli occhi solo la montatura piena e il suo bordo: via le ombre grigie del viso F
    # dentro la lente
    alpha[NEAR & ~ndi.binary_dilation(alpha >= 0.7, iterations=2)] = 0
    # e via i puntini staccati
    lab, n = ndi.label(alpha > 0.05)
    sizes = ndi.sum(alpha > 0.05, lab, range(1, n + 1))
    alpha[np.isin(lab, 1 + np.nonzero(sizes < 20)[0])] = 0
    # bordi: colore del pixel pieno di montatura più vicino
    core = alpha > 0.9
    iy, ix = ndi.distance_transform_edt(~core, return_distances=False, return_indices=True)
    rgb = O[iy, ix]
    rgba = np.dstack([rgb, alpha * 255])
    ys, xs = np.nonzero(alpha > 0.02)
    y0, y1, x0, x1 = ys.min() - 1, ys.max() + 2, xs.min() - 1, xs.max() + 2
    rel = f'F/glasses__{g}.webp'
    Image.fromarray(np.clip(rgba[y0:y1, x0:x1], 0, 255).astype('uint8'), 'RGBA').save(
        os.path.join(PUB, rel), 'WEBP', quality=90, method=6)
    for body in ('F', 'M'):
        d['layers'][f'glasses/{g}'][body].update(x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0))
    print(g, n, int(sizes.max()), (x1 - x0, y1 - y0), flush=True)

json.dump(d, open(MANIFEST, 'w'), indent=1)
