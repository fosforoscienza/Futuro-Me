"""Strati "forma d'occhio + ciglia" (eyes/<forma>__<ciglia>).

Le ciglia di lashes/* sono disegnate sull'occhio del corpo base: con un'altra forma
d'occhio non combaciano. Per ogni forma ci sono quindi immagini Higgsfield dedicate
(modifica di eyes__<forma>.png che aggiunge solo le ciglia, vedi jobs.tsv).

Il modello tende a ridisegnare un po' l'occhio: dentro l'apertura dell'occhio si tiene
l'immagine della forma originale e dall'immagine generata si prendono solo le ciglia
(i pixel molto più scuri). Il risultato si allinea al corpo base con lo stesso
spostamento dello strato eyes/<forma> e diventa un pezzo come gli altri.

Uso (poi lanciare fix_masks.py, che calcola iridi e statistiche):
  python3 -I scripts/avatar/build_lash_combos.py raw public/avatar src/lib/avatar/assets.json
con raw/<F|M>/eyes__<forma>.png e raw/<F|M>/eyes__<forma>__<ciglia>.png.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RAW, OUT, MANIFEST = sys.argv[1:4]
ROOT = os.path.dirname(os.path.normpath(OUT))
d = json.load(open(MANIFEST))
W, H = d['size']
GEO = {
    'F': dict(eyes=[(372, 158, 412, 188), (437, 158, 477, 188)], brows=[(362, 136, 420, 162), (430, 136, 488, 162)]),
    'M': dict(eyes=[(374, 156, 416, 184), (434, 156, 474, 184)], brows=[(366, 136, 424, 164), (432, 136, 492, 164)]),
}


def load_raw(path):
    im = Image.open(path).convert('RGB')
    if im.size != (W, H):
        im = im.resize((W, H), Image.LANCZOS)
    return np.asarray(im).astype(np.float32)


def load_layer(e):
    im = np.asarray(Image.open(os.path.join(ROOT, e['src'].lstrip('/'))).convert('RGBA')).astype(np.float32)
    out = np.zeros((H, W, 4), np.float32)
    out[e['y']:e['y'] + e['h'], e['x']:e['x'] + e['w']] = im
    return out


def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def satur(a):
    return (a.max(-1) - a.min(-1)) / np.maximum(a.max(-1), 1)


def blur(a, r):
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype('uint8'))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255


def grow(m):
    g = m.copy()
    g[1:] |= m[:-1]; g[:-1] |= m[1:]; g[:, 1:] |= m[:, :-1]; g[:, :-1] |= m[:, 1:]
    return g


def hull(points):
    P = sorted(set(points))
    if len(P) < 3:
        return np.zeros((H, W), bool)

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, up = [], []
    for p in P:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0:
            lo.pop()
        lo.append(p)
    for p in reversed(P):
        while len(up) >= 2 and cross(up[-2], up[-1], p) <= 0:
            up.pop()
        up.append(p)
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon([(x, y) for y, x in lo[:-1] + up[:-1]], fill=255, outline=255)
    return np.asarray(m) > 128


def eye_opening(E, body):
    """Apertura degli occhi: bianco dell'occhio e iride attorno alla pupilla, involucro convesso per occhio."""
    L, S = lum(E), satur(E)
    white = (L > 140) & (S < 0.3)
    out = np.zeros((H, W), bool)
    for x0, y0, x1, y1 in GEO[body]['eyes']:
        X0, Y0, X1, Y1 = x0 - 26, y0 - 22, x1 + 26, y1 + 22
        sub = L[y0 - 6:y1 + 6, x0 - 6:x1 + 6]
        cy, cx = np.unravel_index(np.argmin(Image.fromarray(sub.astype('uint8')).filter(ImageFilter.BoxBlur(3))), sub.shape)
        cy, cx = cy + y0 - 6, cx + x0 - 6  # pupilla: punto più scuro (sfocato) dell'occhio
        box = np.zeros((H, W), bool)
        box[Y0:Y1, X0:X1] = True
        yy, xx = np.mgrid[0:H, 0:W]
        core = box & ((xx - cx) ** 2 + (yy - cy) ** 2 < 25)
        reach = core.copy()
        for _ in range(45):
            g = grow(reach) & box & (white | core | (L < 120) & (((xx - cx) ** 2 + (yy - cy) ** 2) < 150))
            if (g == reach).all():
                break
            reach = g
        out |= hull(list(zip(*np.nonzero(reach))))
    return out


base = {b: load_layer(d['bodies'][b]) for b in ('F', 'M')}
for body in ('F', 'M'):
    folder = os.path.join(RAW, body)
    for f in sorted(os.listdir(folder)):
        if not (f.startswith('eyes__') and f.count('__') == 2 and f.endswith('.png')):
            continue
        shape, lash = f[:-4].split('__')[1:]
        shape_entry = d['layers'][f'eyes/{shape}'][body]
        E = load_raw(os.path.join(folder, f'eyes__{shape}.png'))
        G = load_raw(os.path.join(folder, f))

        # dentro l'occhio la forma originale, dall'immagine generata solo le ciglia
        op = eye_opening(E, body)
        inner = np.asarray(Image.fromarray((op * 255).astype('uint8')).filter(ImageFilter.MinFilter(3))).astype(np.float32) / 255
        dark = np.clip((lum(E) - lum(G) - 25) / 30, 0, 1)
        keep = blur(inner * (1 - dark), 0.7)
        C = G * (1 - keep[..., None]) + E * keep[..., None]

        # stesso allineamento al corpo base dello strato della forma d'occhio
        dx, dy = shape_entry.get('shift', [0, 0])
        C = np.roll(np.roll(C, dy, 0), dx, 1)

        # pezzo: dove differisce dal corpo base, attorno agli occhi (le ciglia lunghe escono di lato)
        b = base[body]
        diff = np.sqrt(((C - b[..., :3]) ** 2).sum(-1))
        al = np.clip((diff - 6) / 14, 0, 1)
        reg = Image.new('L', (W, H), 0)
        dr = ImageDraw.Draw(reg)
        for x0, y0, x1, y1 in GEO[body]['eyes']:
            dr.ellipse((x0 - 34, y0 - 20, x1 + 34, y1 + 22), fill=255)
        reg = np.asarray(reg.filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
        # sopra gli occhi ci sono le sopracciglia scelte: come negli strati eyes/*, lì niente
        top = min(e[1] for e in GEO[body]['eyes']) - 3
        al[:top] = 0
        al = blur(np.asarray(Image.fromarray((al * 255).astype('uint8')).filter(ImageFilter.MaxFilter(5))
                             .filter(ImageFilter.MinFilter(5))).astype(np.float32) / 255, 0.8) * reg
        al *= b[..., 3] / 255
        # le ciglia lunghe escono dalla zona degli occhi: lì solo i loro tratti (molto più scuri
        # dell'originale), così sopracciglia e pelle attorno restano quelle scelte
        wide = Image.new('L', (W, H), 0)
        dw = ImageDraw.Draw(wide)
        for x0, y0, x1, y1 in GEO[body]['eyes']:
            dw.ellipse((x0 - 60, y0 - 40, x1 + 60, y1 + 32), fill=255)
        wide = np.asarray(wide.filter(ImageFilter.GaussianBlur(4))).astype(np.float32) / 255
        stroke = np.clip((lum(E) - lum(G) - 20) / 40, 0, 1)
        stroke = np.roll(np.roll(stroke, dy, 0), dx, 1)
        # a volte il modello ritocca anche le sopracciglia: dove l'originale ha il sopracciglio
        # (scuro, nella sua zona) non sono ciglia; sulla pelle attorno le ciglia restano
        browzone = np.zeros((H, W), bool)
        for x0, y0, x1, y1 in GEO[body]['brows']:
            browzone[y0 - 8:y1 + 4, x0 - 8:x1 + 8] = True
        brow = np.roll(np.roll(browzone & (lum(E) < 150), dy, 0), dx, 1)
        brow = np.asarray(Image.fromarray((brow * 255).astype('uint8')).filter(ImageFilter.MaxFilter(5))) > 128
        stroke[brow] = 0
        # (anche fuori dalla sagoma della testa: le ciglia lunghissime sporgono ai lati)
        al = np.maximum(al, blur(stroke, 0.5) * wide)

        ys, xs = np.where(al > 0.03)
        y0, y1, x0, x1 = ys.min() - 2, ys.max() + 3, xs.min() - 2, xs.max() + 3
        rel = f'{body}/eyes__{shape}__{lash}'
        rgba = np.dstack([C, al * 255])[y0:y1, x0:x1]
        Image.fromarray(np.clip(rgba, 0, 255).astype('uint8'), 'RGBA').save(os.path.join(OUT, rel + '.webp'), 'WEBP', quality=90, method=6)
        # pelle: tutto il pezzo tranne il bianco dell'occhio (le ciglia scure restano scure);
        # l'iride la toglie fix_masks.py, che la calcola
        Lc, Sc = lum(C), satur(C)
        skin = (al > 0.02) & ~((Lc > 150) & (Sc < 0.22))
        mk = np.zeros((y1 - y0, x1 - x0, 3), np.uint8)
        mk[..., 0] = (skin[y0:y1, x0:x1] * 255).astype(np.uint8)
        Image.fromarray(mk, 'RGB').save(os.path.join(OUT, rel + '.mask.png'), optimize=True)
        d['layers'].setdefault(f'eyes/{shape}__{lash}', {})[body] = dict(
            src=f'/avatar/{rel}.webp', x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0),
            mask=f'/avatar/{rel}.mask.png', shift=[dx, dy])
        print(rel, x1 - x0, y1 - y0, flush=True)

json.dump(d, open(MANIFEST, 'w'), indent=1)
