"""Ricostruisce l'attaccatura di un pezzo di capelli dalla sua immagine sorgente.

Per alcune pettinature (es. afro F) l'estrazione di build_assets.py taglia male il bordo
tra capelli e fronte: restano un buco frastagliato e una parte di fronte scoperta dove la
sorgente aveva i capelli. Qui la pelle del viso della sorgente si trova con un riempimento
dal centro del viso (tinta di pelle e chiara): tutto il resto della testa che non è sfondo
è capelli. Sotto la testa il pezzo resta com'è.

Uso (dopo fix_masks.py; poi rilanciarlo per le statistiche non serve, le aggiorna questo):
  python3 -I scripts/avatar/rebuild_hairline.py raw/F/hair__afro.png hair/afro F \\
      public/avatar src/lib/avatar/assets.json
"""
import json
import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

SRC, KEY, BODY, PUB, MANIFEST = sys.argv[1:6]
ROOT = os.path.dirname(os.path.normpath(PUB))
d = json.load(open(MANIFEST))
W, H = d['size']
FACE = {'F': (372, 140, 478, 272), 'M': (374, 138, 482, 276)}
HEAD_BOTTOM = 300  # sotto: spalle e capelli lunghi, lasciati come sono


def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def face_flood(src, seed, tol=2.6, min_l=95):
    """Pelle collegata al seme (guancia): tinta di pelle e chiara. I capelli sono più scuri
    o più saturi e fermano il riempimento, anche dove hanno riflessi chiari."""
    L = lum(src)
    q = src / np.maximum(L[..., None], 1)
    sy, sx = seed
    ref = src[sy - 10:sy + 10, sx - 20:sx + 20].reshape(-1, 3)
    rq = ref / np.maximum(lum(ref)[:, None], 1)
    sq, ssd = rq.mean(0), rq.std(0) + 0.012
    ok = ((np.abs(q - sq) / ssd).max(-1) < tol) & (L > min_l)
    seen = np.zeros((H, W), bool)
    seen[sy, sx] = True
    todo = deque([(sy, sx)])
    while todo:
        y, x = todo.popleft()
        for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= yy < H and 0 <= xx < W and not seen[yy, xx] and ok[yy, xx]:
                seen[yy, xx] = True
                todo.append((yy, xx))
    return seen


e = d['layers'][KEY][BODY]
src = np.asarray(Image.open(SRC).convert('RGB').resize((W, H), Image.LANCZOS)).astype(np.float32)
dx, dy = e.get('shift', [0, 0])
src = np.roll(np.roll(src, dy, 0), dx, 1)

f = FACE[BODY]
face = face_flood(src, ((f[1] + f[3]) // 2 + 15, (f[0] + f[2]) // 2))
# pelle in ombra ai lati e sul collo: quasi uguale al corpo base, che lì è pelle
base_e = d['bodies'][BODY]
bimg = np.zeros((H, W, 4), np.float32)
bimg[base_e['y']:base_e['y'] + base_e['h'], base_e['x']:base_e['x'] + base_e['w']] = np.asarray(
    Image.open(os.path.join(ROOT, base_e['src'].lstrip('/'))).convert('RGBA')).astype(np.float32)
bmask = np.zeros((H, W), np.float32)
bmask[base_e['y']:base_e['y'] + base_e['h'], base_e['x']:base_e['x'] + base_e['w']] = np.asarray(
    Image.open(os.path.join(ROOT, base_e['mask'].lstrip('/'))).convert('RGB'))[..., 0]
near_base = (np.abs(src - bimg[..., :3]).max(-1) < 28) & (bimg[..., 3] > 128) & (bmask > 127)
reach = face.copy()
for _ in range(25):  # solo collegata alla pelle già trovata
    g = reach.copy()
    g[1:] |= reach[:-1]; g[:-1] |= reach[1:]; g[:, 1:] |= reach[:, :-1]; g[:, :-1] |= reach[:, 1:]
    g &= face | near_base
    if (g == reach).all():
        break
    reach = g
face = reach
# buchi dentro il viso (occhi, bocca, riflesso sul naso): da fuori non si raggiungono
outside = np.zeros((H, W), bool)
todo = deque([(0, x) for x in range(W)] + [(y, 0) for y in range(HEAD_BOTTOM)] + [(y, W - 1) for y in range(HEAD_BOTTOM)])
for y, x in todo:
    outside[y, x] = not face[y, x]
while todo:
    y, x = todo.popleft()
    if face[y, x]:
        continue
    for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
        if 0 <= yy < HEAD_BOTTOM + 1 and 0 <= xx < W and not outside[yy, xx] and not face[yy, xx]:
            outside[yy, xx] = True
            todo.append((yy, xx))
face |= ~outside
face[HEAD_BOTTOM + 1:] = False
face = np.asarray(Image.fromarray((face * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3))
                  .filter(ImageFilter.MinFilter(3))) > 128
sat = (src.max(-1) - src.min(-1)) / np.maximum(src.max(-1), 1)
bg = (lum(src) > 225) & (sat < 0.08)
hair = ~face & ~bg
hair[HEAD_BOTTOM:] = False
alpha = np.asarray(Image.fromarray((hair * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255

# pezzo attuale a tutta tela
im = np.asarray(Image.open(os.path.join(ROOT, e['src'].lstrip('/'))).convert('RGBA')).astype(np.float32)
mk = np.asarray(Image.open(os.path.join(ROOT, e['mask'].lstrip('/'))).convert('RGB')).astype(np.float32)
full = np.zeros((H, W, 4), np.float32)
fmk = np.zeros((H, W, 3), np.float32)
full[e['y']:e['y'] + e['h'], e['x']:e['x'] + e['w']] = im
fmk[e['y']:e['y'] + e['h'], e['x']:e['x'] + e['w']] = mk

head = np.zeros((H, W), bool)
head[:HEAD_BOTTOM] = True
# sfumatura verso il pezzo esistente al confine della testa
blend = np.clip((HEAD_BOTTOM - np.arange(H)) / 12, 0, 1)[:, None] * np.ones((1, W))
a_new = alpha * 255
full[..., 3] = np.where(head, a_new * blend + full[..., 3] * (1 - blend), full[..., 3])
full[..., :3] = np.where((head & (alpha > 0.02))[..., None], src, full[..., :3])
fmk[..., 1] = np.where(head, alpha * 255 * blend + fmk[..., 1] * (1 - blend), fmk[..., 1])
fmk[..., 0] = np.where(head, fmk[..., 0] * (1 - blend), fmk[..., 0])

# nuovo riquadro e salvataggio
ys, xs = np.where(full[..., 3] > 8)
y0, y1, x0, x1 = max(ys.min() - 2, 0), min(ys.max() + 3, H), max(xs.min() - 2, 0), min(xs.max() + 3, W)
Image.fromarray(np.clip(full[y0:y1, x0:x1], 0, 255).astype('uint8'), 'RGBA').save(
    os.path.join(ROOT, e['src'].lstrip('/')), 'WEBP', quality=90, method=6)
Image.fromarray(np.clip(fmk[y0:y1, x0:x1], 0, 255).astype('uint8'), 'RGB').save(
    os.path.join(ROOT, e['mask'].lstrip('/')), optimize=True)
e.update(x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0))

# statistiche OKLab dei capelli (come fix_masks.py)
c = full[..., :3][fmk[..., 1] > 127] / 255.0
lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
l_ = np.cbrt(lin @ np.array([0.4122214708, 0.5363325363, 0.0514459929]))
m_ = np.cbrt(lin @ np.array([0.2119034982, 0.6806995451, 0.1073969566]))
s_ = np.cbrt(lin @ np.array([0.0883024619, 0.2817188376, 0.6299787005]))
L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
e.setdefault('stats', {})['G'] = dict(mu=round(float(L.mean()), 4), sd=round(float(max(L.std(), 0.02)), 4))
e['hairline'] = True
json.dump(d, open(MANIFEST, 'w'), indent=1)
print(KEY, BODY, 'ok', e['x'], e['y'], e['w'], e['h'])
