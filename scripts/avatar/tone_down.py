"""Attenua i pezzi troppo marcati, sugli asset già pubblicati (dopo fix_masks.py).

È idempotente: ogni pezzo ritoccato è segnato nel manifest ("toned") e non viene
ritoccato due volte.

  1. Nasi M "all'insù", "aquilino" e "a patata" e vitiligine: il pezzo diventa in parte
     trasparente e lascia vedere il corpo base, così la forma resta ma è molto meno marcata.
  2. Ciglia "lunghe" e "lunghissime" (eyes/<forma>__<ciglia> e lashes/*): erano enormi. Ogni
     ciglio si accorcia verso la palpebra: un pixel a distanza d dall'apertura dell'occhio
     prende il ciglio che stava a distanza d / f, quindi la radice resta attaccata alla
     palpebra e la punta si avvicina. Il pezzo si ricompone sulla forma d'occhio senza
     ciglia, così restano solo i tratti scuri delle ciglia (prima lashes/* copriva anche le
     sopracciglia del corpo base con una toppa di pelle). lashes/lunghissime (occhi a mandorla
     grandi del corpo base) era una nuvola scura senza ciglia riconoscibili: si ricava da
     lashes/lunghe, accorciate meno.
  3. Sopracciglia "folte": erano troppo grandi. Il sopracciglio (la parte più scura della
     pelle sotto) si schiaccia verso il suo bordo inferiore, di BROW_KEEP in altezza, e si
     appoggia sul pezzo "Nessuna", così il sopracciglio del corpo base non spunta sopra.
  4. Occhi "tondi grandi" (con tutte le loro ciglia): erano esagerati. Ogni occhio si
     rimpicciolisce di EYE_SCALE attorno al centro dell'iride; attorno, dove prima c'era
     l'occhio grande, pelle ricostruita da quella intorno (così non spunta l'occhio del corpo
     base).
     Segnati nel manifest con "scaled".

Uso:
  python3 -I scripts/avatar/tone_down.py public/avatar src/lib/avatar/assets.json
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

# pezzo -> opacità che resta del pezzo originale
FADE = {
    ('nose/insu', 'M'): 0.45,
    ('nose/aquilino', 'M'): 0.45,
    ('nose/patata', 'M'): 0.55,
    ('skin/vitiligine', 'F'): 0.4,
    ('skin/vitiligine', 'M'): 0.4,
}
# ciglia -> quanto resta della lunghezza (oltre la palpebra)
SHORTEN = {'lunghe': 0.72, 'lunghissime': 0.62}
LID = 2.0  # spessore della linea della palpebra, che resta com'è
# pezzi rifatti da un altro pezzo: chiave -> (pezzo di partenza, quanto resta della lunghezza)
FROM = {'lashes/lunghissime': ('lashes/lunghe', 0.95)}
BROW_KEEP = 0.75  # altezza che resta alle sopracciglia folte
EYE_SCALE = 0.9  # dimensione che resta agli occhi tondi grandi


def path(e, key='src'):
    return os.path.join(ROOT, e[key].lstrip('/'))


def fade(e, k):
    im = np.asarray(Image.open(path(e)).convert('RGBA')).astype(np.float32)
    im[..., 3] *= k
    Image.fromarray(np.clip(im, 0, 255).astype('uint8'), 'RGBA').save(path(e), 'WEBP', quality=90, method=6)


def place(e, key='src', mode='RGBA'):
    out = np.zeros((H, W, len(mode)), np.float32)
    if e is not None:
        out[e['y']:e['y'] + e['h'], e['x']:e['x'] + e['w']] = np.asarray(Image.open(path(e, key)).convert(mode))
    return out


def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def over(top, bottom):
    a = top[..., 3:4] / 255
    return top[..., :3] * a + bottom[..., :3] * (1 - a)


def eye_opening(img, mask):
    """Bianco dell'occhio e iride, in un riquadro attorno a ciascuna iride."""
    L = lum(img)
    sat = (img.max(-1) - img.min(-1)) / np.maximum(img.max(-1), 1)
    iris = mask[..., 2] > 60
    box = np.zeros((H, W), bool)
    lab, _ = ndi.label(iris)
    for sl in ndi.find_objects(lab):
        if (sl[0].stop - sl[0].start) * (sl[1].stop - sl[1].start) < 40:
            continue
        cy, cx = (sl[0].start + sl[0].stop) // 2, (sl[1].start + sl[1].stop) // 2
        box[cy - 16:cy + 16, cx - 30:cx + 30] = True
    op = (((L > 165) & (sat < 0.15)) | iris) & box
    op = ndi.binary_fill_holes(ndi.binary_closing(op, iterations=2)) & box
    lab, _ = ndi.label(op)
    return np.isin(lab, np.unique(lab[iris & (lab > 0)]))


def shorten(e, src, plain, base, f):
    """Ricompone il pezzo e con le ciglia di src accorciate di f sulla forma d'occhio plain."""
    P = place(plain)
    Pm = place(plain, 'mask', 'RGB') if plain else place(base, 'mask', 'RGB')
    B = place(base)
    look = over(P, B)                                   # occhio senza ciglia
    lashes = np.clip((lum(look) - lum(over(place(src), B)) - 10) / 40, 0, 1)
    colour = over(place(src), B)
    dist, (ny, nx) = ndi.distance_transform_edt(~eye_opening(look, Pm), return_indices=True)
    src = np.where(dist <= LID, dist, LID + (dist - LID) / f)
    k = np.where(dist > 0, src / np.maximum(dist, 1e-6), 1)
    yy, xx = np.mgrid[0:H, 0:W]
    at = [ny + (yy - ny) * k, nx + (xx - nx) * k]
    st = ndi.map_coordinates(lashes, at, order=1, cval=0)
    st *= ndi.binary_dilation(lashes > 0.05, iterations=2)  # le ciglia corte stanno dentro le lunghe
    aP = P[..., 3] / 255
    a = aP + st * (1 - aP)
    keep = aP * (1 - st) / np.maximum(a, 1e-6)          # quota della forma d'occhio
    col = np.stack([ndi.map_coordinates(colour[..., c], at, order=1, cval=0) for c in range(3)], -1)
    rgb = col * (st / np.maximum(a, 1e-6))[..., None] + P[..., :3] * keep[..., None]
    # maschera: ciglia come pelle (come in build_lash_combos.py), iride della forma d'occhio
    R = np.where(plain is None, 255, Pm[..., 0]) * keep + 255 * (st / np.maximum(a, 1e-6))
    Bm = (Pm[..., 2] if plain else 0) * keep
    ys, xs = np.nonzero(a > 0.01)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([rgb, a * 255])[y0:y1, x0:x1]
    Image.fromarray(np.clip(rgba, 0, 255).astype('uint8'), 'RGBA').save(path(e), 'WEBP', quality=90, method=6)
    mk = np.dstack([R, np.zeros_like(R), Bm])[y0:y1, x0:x1] * (a[y0:y1, x0:x1, None] > 0.01)
    Image.fromarray(np.clip(mk, 0, 255).astype('uint8'), 'RGB').save(path(e, 'mask'), optimize=True)
    e.update(x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0))


def thin_brows(e, none, base):
    """Sopracciglia e schiacciate verso il bordo inferiore, sopra il pezzo none."""
    F, Fm = place(e), place(e, 'mask', 'RGB')
    N, Nm = place(none), place(none, 'mask', 'RGB')
    B = place(base)
    brow = np.clip((lum(over(N, B)) - lum(over(F, B)) - 8) / 40, 0, 1) * (F[..., 3] / 255)
    yy, xx = np.mgrid[0:H, 0:W]
    out, G = np.zeros_like(F), np.zeros((H, W), np.float32)
    mid = e['x'] + e['w'] // 2
    for side in (xx < mid, xx >= mid):
        full = (brow > 0.6) & side
        cols = np.nonzero(full.any(0))[0]
        bottom = np.poly1d(np.polyfit(cols, [np.nonzero(full[:, c])[0].max() for c in cols], 2))
        b = bottom(xx).astype(np.float32) + 1
        at = [b - (b - yy) / BROW_KEEP, xx]
        inside = side & (yy <= b + 3)
        for c in range(3):
            out[..., c] = np.where(inside, ndi.map_coordinates(F[..., c], at, order=1), out[..., c])
        G = np.where(inside, ndi.map_coordinates(brow, at, order=1), G)
    # sopracciglio sopra la pelle di "Nessuna"
    aN = N[..., 3] / 255
    a = G + aN * (1 - G)
    rgb = (out[..., :3] * G[..., None] + N[..., :3] * (aN * (1 - G))[..., None]) / np.maximum(a, 1e-6)[..., None]
    R = Nm[..., 0] * aN * (1 - G) / np.maximum(a, 1e-6)
    Gm = 255 * G / np.maximum(a, 1e-6)
    ys, xs = np.nonzero(a > 0.01)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([rgb, a * 255])[y0:y1, x0:x1]
    Image.fromarray(np.clip(rgba, 0, 255).astype('uint8'), 'RGBA').save(path(e), 'WEBP', quality=90, method=6)
    mk = np.dstack([R, Gm, np.zeros_like(R)])[y0:y1, x0:x1] * (a[y0:y1, x0:x1, None] > 0.01)
    Image.fromarray(np.clip(mk, 0, 255).astype('uint8'), 'RGB').save(path(e, 'mask'), optimize=True)
    e.update(x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0))


def fill_skin(rgb, hole, it=600):
    """Riempie hole sfumando i colori del bordo (diffusione, solo attorno al buco)."""
    ys, xs = np.nonzero(hole)
    sl = (slice(ys.min() - 2, ys.max() + 3), slice(xs.min() - 2, xs.max() + 3))
    out, h = rgb[sl].copy(), hole[sl]
    ring = ndi.binary_dilation(h, iterations=2) & ~h
    out[h] = np.median(out[ring], 0)  # si parte dal colore medio del bordo
    for _ in range(it):
        avg = (np.roll(out, 1, 0) + np.roll(out, -1, 0) + np.roll(out, 1, 1) + np.roll(out, -1, 1)) / 4
        out[h] = avg[h]
    full = rgb.copy()
    full[sl] = out
    return full


def scale_eyes(e, base, k):
    """Occhi del pezzo e rimpiccioliti di k attorno alle iridi, su pelle ricostruita."""
    E, Em = place(e), place(e, 'mask', 'RGB')
    iris = Em[..., 2] > 60
    lab, n = ndi.label(iris)
    sizes = ndi.sum(iris, lab, range(1, n + 1))
    centres = sorted(ndi.center_of_mass(iris, lab, i + 1) for i in np.argsort(sizes)[-2:])
    centres.sort(key=lambda c: c[1])
    split = (centres[0][1] + centres[1][1]) / 2
    yy, xx = np.mgrid[0:H, 0:W]
    cy = np.where(xx < split, centres[0][0], centres[1][0])
    cx = np.where(xx < split, centres[0][1], centres[1][1])
    at = [cy + (yy - cy) / k, cx + (xx - cx) / k]
    # sotto: la pelle al posto dell'occhio grande
    hole = ((xx - cx) / 34) ** 2 + ((yy - cy) / 19) ** 2 < 1
    U = np.dstack([fill_skin(over(E, place(base)), hole), 255 * np.maximum(hole, E[..., 3] / 255)])
    U[~hole] = E[~hole]
    Um = np.where(hole[..., None], np.array([255, 0, 0], np.float32), Em)
    a = ndi.map_coordinates(E[..., 3], at, order=1) / 255
    pre = [ndi.map_coordinates(E[..., c] * E[..., 3] / 255, at, order=1) for c in range(3)]
    msk = [ndi.map_coordinates(Em[..., c], at, order=1) for c in range(3)]
    aU = U[..., 3] / 255
    aO = a + aU * (1 - a)
    rgb = np.stack([(pre[c] + U[..., c] * aU * (1 - a)) for c in range(3)], -1) / np.maximum(aO, 1e-6)[..., None]
    wE, wU = a / np.maximum(aO, 1e-6), aU * (1 - a) / np.maximum(aO, 1e-6)
    mk = np.stack([msk[c] * wE + Um[..., c] * wU for c in range(3)], -1)
    ys, xs = np.nonzero(aO > 0.01)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([rgb, aO * 255])[y0:y1, x0:x1]
    Image.fromarray(np.clip(rgba, 0, 255).astype('uint8'), 'RGBA').save(path(e), 'WEBP', quality=90, method=6)
    mk = mk[y0:y1, x0:x1] * (aO[y0:y1, x0:x1, None] > 0.01)
    Image.fromarray(np.clip(mk, 0, 255).astype('uint8'), 'RGB').save(path(e, 'mask'), optimize=True)
    e.update(x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0))


for (key, body), k in FADE.items():
    e = d['layers'][key][body]
    if e.get('toned', 0) >= 1:
        continue
    fade(e, k)
    e['toned'] = 1
    print(key, body, k, flush=True)

# prima i pezzi rifatti da un altro, che va letto ancora com'era
for key in sorted(d['layers'], key=lambda k: k not in FROM):
    cat, name = key.split('/')
    lash = name.split('__')[-1]
    if lash not in SHORTEN or cat not in ('eyes', 'lashes'):
        continue
    for body in ('F', 'M'):
        e = d['layers'][key][body]
        if e.get('toned', 0) >= 2:
            continue
        plain = d['layers'][key.split('__')[0]][body] if cat == 'eyes' else None
        src, f = FROM.get(key, (key, SHORTEN[lash]))
        shorten(e, dict(d['layers'][src][body]), plain, d['bodies'][body], f)
        e['toned'] = 2
        print(key, body, src, f, flush=True)

for body in ('F', 'M'):
    e = d['layers']['brows/folte'][body]
    if e.get('toned', 0) < 3:
        thin_brows(e, d['layers']['brows/nessuna'][body], d['bodies'][body])
        e['toned'] = 3
        print('brows/folte', body, BROW_KEEP, flush=True)

for key in [k for k in d['layers'] if k.split('__')[0] == 'eyes/tondi_grandi']:
    for body in ('F', 'M'):
        e = d['layers'][key][body]
        if not e.get('scaled'):
            scale_eyes(e, d['bodies'][body], EYE_SCALE)
            e['scaled'] = EYE_SCALE
            print(key, body, EYE_SCALE, flush=True)

json.dump(d, open(MANIFEST, 'w'), indent=1)
