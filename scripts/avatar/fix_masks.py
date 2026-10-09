"""Rifinitura degli asset dell'avatar, da lanciare dopo build_assets.py.

Lavora sugli asset già pubblicati (public/avatar + manifest), quindi non servono le
immagini sorgenti. È idempotente: i pezzi già ripuliti sono segnati nel manifest.

  1. Sopracciglia (corpo base e brows/*): maschera morbida del solo sopracciglio, senza
     l'ombra della palpebra che sta sotto (prima veniva colorata come un sopracciglio).
  2. Iridi (corpo base e eyes/*): maschera geometrica (disco dell'iride meno pupilla,
     palpebre e bianco dell'occhio). Prima la soglia di colore prendeva solo il bordo
     dell'iride e le linee delle palpebre.
  3. Pulizia del viso negli altri pezzi (capelli, cappelli, occhiali, gioielli, ciglia,
     vitiligine...): dove un pixel è uguale al corpo da cui il pezzo è stato generato
     diventa trasparente, così non copre occhi, sopracciglia e pelle già ricolorati.
     Nei capelli, la pelle rimasta è marcata come pelle e non come capelli.
  4. Pezzi del corpo (busti, gambe, scarpe, braccia, collo, inclusione): le mani e la pelle
     copiate identiche dal corpo base diventano trasparenti, la pelle in ombra rimasta
     (sotto le ascelle, attorno all'impianto) è marcata come pelle. Con gli incarnati scuri
     prima restava chiara. Nei busti e nelle gambe si richiudono i buchi della stoffa beige.
  5. Occhiali (generati sul viso F): lenti chiare trasparenti, lenti colorate come tinta
     uniforme semitrasparente, così dietro si vedono pelle e occhi scelti.
  6. Capelli: le ombre che i capelli proiettano su braccia e maglietta (prima colorate come
     capelli) diventano velature nere semitrasparenti, la pelle ridisegnata più chiara diventa
     trasparente. Riconoscimento: stessi rapporti tra i canali del corpo base.
  7. Capelli: velatura semitrasparente del viso di partenza dentro il viso (attaccatura chiara,
     sopracciglia e occhi d'origine colorati come capelli): via se liscia e color pelle.
  8. Capelli: buchi piccoli dentro le ciocche riempiti col colore vicino, frammenti minuscoli
     staccati sopra il viso tolti.
  9. Sopracciglia "Nessuna": il pezzo copre per intero l'impronta del sopracciglio del corpo base
     (prima dal bordo semitrasparente ne traspariva il contorno, visibile con "Nessuna").
  10. Statistiche OKLab (media e deviazione della luminosità) di capelli e iridi, usate dal
     renderer per ricolorare conservando luci e ombre.

Uso:
  python3 -m pip install pillow numpy
  python3 -I scripts/avatar/fix_masks.py public/avatar src/lib/avatar/assets.json
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

PUB, MANIFEST = sys.argv[1], sys.argv[2]
ROOT = os.path.dirname(os.path.normpath(PUB))  # cartella "public"
d = json.load(open(MANIFEST))
W, H = d['size']

GEO = {
    'F': dict(face=(372, 140, 478, 272), eyes=[(372, 158, 412, 188), (437, 158, 477, 188)],
              brows=[(362, 136, 420, 162), (430, 136, 488, 162)]),
    'M': dict(face=(374, 138, 482, 276), eyes=[(374, 156, 416, 184), (434, 156, 474, 184)],
              brows=[(366, 136, 424, 164), (432, 136, 492, 164)]),
}
# versione delle rifiniture: i pezzi segnati con una versione più vecchia ricevono solo i passi nuovi
VERSION = 10
# pezzi che toccano il viso: lì ciò che è uguale al corpo base diventa trasparente
CLEAN = ('hair', 'hat', 'glasses', 'jewel', 'other', 'incl', 'lashes', 'skin', 'brows')
# pantaloncini grigi del corpo base (x0, y0, x1, y1), come in build_assets.py
SHORTS = {'F': (285, 572, 565, 820), 'M': (280, 585, 570, 822)}
# pezzi del corpo che coprono pelle del corpo base
BODY = ('torso', 'legs', 'shoes', 'arms', 'neck', 'incl')

# --- utilità -----------------------------------------------------------------
def load(e, key='src', mode='RGBA'):
    im = np.asarray(Image.open(os.path.join(ROOT, e[key].lstrip('/'))).convert(mode)).astype(np.float32)
    out = np.zeros((H, W) + im.shape[2:], np.float32)
    out[e['y']:e['y'] + e['h'], e['x']:e['x'] + e['w']] = im
    return out

def crop(a, e):
    return a[e['y']:e['y'] + e['h'], e['x']:e['x'] + e['w']]

def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114

def satur(a):
    return (a.max(-1) - a.min(-1)) / np.maximum(a.max(-1), 1)

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

def neighbours(m):
    k = m.astype(np.int32)
    n = np.zeros_like(k)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dy or dx:
                n += np.roll(np.roll(k, dy, 0), dx, 1)
    return n

def grow(m, it=1):
    for _ in range(it):
        g = m.copy()
        g[1:] |= m[:-1]; g[:-1] |= m[1:]; g[:, 1:] |= m[:, :-1]; g[:, :-1] |= m[:, 1:]
        m = g
    return m

def brow_ring(G, alpha):
    """Bordo morbido del sopracciglio: anche lì la pelle va ricolorata, in proporzione."""
    return (grow(G > 0.03, 2) & (alpha > 0)).astype(np.float32)

def skin_stats(base, body):
    g = GEO[body]['face']
    m = Image.new('L', (W, H), 0)
    dr = ImageDraw.Draw(m)
    dr.ellipse((g[0] + 15, 185, g[2] - 15, 255), fill=255)
    for r in ((260, 450, 300, 600), (550, 450, 590, 600), (340, 850, 400, 1050)):
        dr.rectangle(r, fill=255)
    sel = (np.asarray(m) > 128) & (base[..., 3] > 128)
    a = base[..., :3]
    q = a / np.maximum(lum(a)[..., None], 1)
    return dict(q=q[sel].mean(0), qstd=q[sel].std(0))

def skin_like(a, st, loose=1.0, minL=95):
    q = a / np.maximum(lum(a)[..., None], 1)
    dd = np.abs(q - st['q']) / (st['qstd'] * 3.2 * loose + 1e-3)
    return (dd.max(-1) < 1) & (lum(a) > minL) & (satur(a) > 0.15)

def oklab_L(rgb):
    c = rgb / 255.0
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    l = np.cbrt(lin @ np.array([0.4122214708, 0.5363325363, 0.0514459929]))
    m = np.cbrt(lin @ np.array([0.2119034982, 0.6806995451, 0.1073969566]))
    s = np.cbrt(lin @ np.array([0.0883024619, 0.2817188376, 0.6299787005]))
    return 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s

def l_stats(rgb, m):
    sel = m > 0.5
    if sel.sum() < 20:
        return None
    L = oklab_L(rgb[sel])
    return dict(mu=round(float(L.mean()), 4), sd=round(float(max(L.std(), 0.02)), 4))

# --- 1. sopracciglia ---------------------------------------------------------
def brows_mask(img, body, T=125, win=7, depth=12):
    """Per colonna: la prima fascia scura dall'alto (il sopracciglio), non l'ombra sotto.
    Copertura morbida: quanto il pixel è più scuro della pelle sopra e sotto."""
    px, alpha = img[..., :3], img[..., 3]
    L = lum(px)
    G = np.zeros((H, W), np.float32)
    for x0, y0, x1, y1 in GEO[body]['brows']:
        y0 -= 4
        n = x1 - x0
        tops, bots = np.full(n, np.nan), np.full(n, np.nan)
        for j, x in enumerate(range(x0, x1)):
            c = L[y0:y1, x]
            ys = np.flatnonzero((c < T) & (alpha[y0:y1, x] > 0))
            if not len(ys):
                continue
            span = np.arange(ys[0], min(ys[0] + depth, y1 - y0))
            k = span[np.argmin(c[span])]
            lim = c[k] + max(22, (T - c[k]) * 0.55)
            top = k
            while top - 1 >= ys[0] and c[top - 1] < lim:
                top -= 1
            bot = k
            while bot + 1 < y1 - y0 and c[bot + 1] < lim:
                bot += 1
            tops[j], bots[j] = top, bot
        sk_t, sk_b, cores = np.full(n, np.nan), np.full(n, np.nan), np.full(n, np.nan)
        for j in range(n):
            if np.isnan(tops[j]):
                continue
            c = L[y0:y1, x0 + j]
            t, bo = int(tops[j]), int(bots[j])
            t0, b0 = max(t - 3, 0), min(bo + 3, y1 - y0 - 1)
            sk_t[j] = c[max(t0 - 3, 0):t0 + 1].max()
            sk_b[j] = c[b0:min(b0 + 3, y1 - y0)].max()
            cores[j] = c[t:bo + 1].min()

        def med(v, j, w=9):
            return np.nanmedian(v[max(0, j - w // 2):min(n, j + w // 2 + 1)])
        for j in range(n):
            if np.isnan(tops[j]):
                continue
            x = x0 + j
            c = L[y0:y1, x]
            t, bo = int(round(med(tops, j, win))), int(round(med(bots, j, win)))
            st_, sb_, core = med(sk_t, j), med(sk_b, j), med(cores, j)
            t0, b0 = max(t - 3, 0), min(bo + 3, y1 - y0 - 1)
            for yy in range(t0, b0 + 1):
                f = (yy - t0) / max(b0 - t0, 1)
                sk = st_ * (1 - f) + sb_ * f
                av = np.clip((sk - c[yy]) / max(sk - core, 8), 0, 1)
                if yy < t or yy > bo:
                    av *= 0.85
                G[y0 + yy, x] = max(G[y0 + yy, x], av * (alpha[y0 + yy, x] > 0))
    return (G + np.roll(G, 1, 1) + np.roll(G, -1, 1)) / 3

# --- 2. iridi ----------------------------------------------------------------
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

def iris_mask(img, body, st, pad=6):
    """Disco dell'iride meno pupilla, palpebre e bianco. Ritorna (maschera, aperture degli occhi)."""
    a, al = img[..., :3], img[..., 3]
    L, S = lum(a), satur(a)
    yy, xx = np.mgrid[0:H, 0:W]
    M = np.zeros((H, W), np.float32)
    openings = np.zeros((H, W), bool)
    rays, centers = [], []
    for x0, y0, x1, y1 in GEO[body]['eyes']:
        X0, Y0, X1, Y1 = x0 - pad, y0 - pad, x1 + pad, y1 + pad
        # pupilla: il disco di raggio 4 più scuro, poi baricentro dei pixel scuri
        dk = (xx[:9, :9] - 4) ** 2 + (yy[:9, :9] - 4) ** 2 <= 16
        best = None
        for cy in range(Y0 + 4, Y1 - 4):
            for cx in range(X0 + 4, X1 - 4):
                if al[cy, cx] < 128:
                    continue
                v = L[cy - 4:cy + 5, cx - 4:cx + 5][dk].mean()
                if best is None or v < best[0]:
                    best = (v, cx, cy)
        _, cx, cy = best
        w = np.clip(70 - L[cy - 6:cy + 7, cx - 6:cx + 7], 0, None)
        if w.sum() > 0:
            cx, cy = (float((np.arange(cx - 6, cx + 7)[None, :] * w).sum() / w.sum()),
                      float((np.arange(cy - 6, cy + 7)[:, None] * w).sum() / w.sum()))
        # raggio: dal centro fino al bianco dell'occhio, di lato e in basso
        for ang in (0, 180, 10, 170, 20, 160, 30, 150):
            t = np.deg2rad(ang)
            for r in np.arange(5.5, 15, 0.25):
                px, py = int(round(cx + r * np.cos(t))), int(round(cy + r * np.sin(t)))
                if L[py, px] > 150 and S[py, px] < 0.22:
                    rays.append(r)
                    break
        centers.append((cx, cy, (X0, Y0, X1, Y1)))
    r = float(np.median(rays)) if rays else 8.0  # le due iridi hanno lo stesso raggio
    for cx, cy, (X0, Y0, X1, Y1) in centers:
        dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
        prof = []
        for q in np.arange(0.5, r, 0.5):
            ring = (dist >= q - 0.5) & (dist < q + 0.5) & (yy > cy)
            prof.append(L[ring].mean() if ring.any() else 0.0)
        lo, hi = min(prof), max(prof)
        rp = next(((i + 1) * 0.5 for i, v in enumerate(prof) if v > lo + 0.22 * (hi - lo)), r * 0.5)
        rp = min(max(rp, 0.3 * r), 0.55 * r)
        disc = np.clip(r + 0.8 - dist, 0, 1)
        pupil = np.clip((dist - (rp - 0.6)) / 1.2, 0, 1)
        # apertura dell'occhio: involucro convesso di bianco dell'occhio e iride non color pelle
        box = np.zeros((H, W), bool)
        box[Y0:Y1, X0:X1] = True
        sclera = box & (((L > 150) & (S < 0.22)) | ((L > 170) & (S < 0.3) & (yy > cy + 2))) & (al > 128) & (dist > r * 0.8)
        notskin = box & (dist < r + 0.5) & ~skin_like(a, st, 1.1, minL=60) & (al > 128)
        op = hull(list(zip(*np.nonzero(sclera))) + list(zip(*np.nonzero(notskin))))
        openings |= op | (dist < r + 1)
        # fascia alta esterna: ciglia (molto scure) e palpebra (chiara, color pelle) restano com'erano
        band = (yy < cy - 1) & (dist > r * 0.8)
        prot = band & (((L < 85) & (dist > r * 0.97)) | skin_like(a, st, 1.1, minL=140))
        M = np.maximum(M, disc * pupil * op * ~prot)
    M *= ~((L > 165) & (S < 0.12)) & (al > 128)
    M[neighbours(M > 0.5) < 3] = 0  # puntini isolati
    return M, openings

# --- 3. pulizia del viso -----------------------------------------------------
def face_zone(body):
    f = GEO[body]['face']
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).ellipse((f[0] - 14, f[1] - 55, f[2] + 14, f[3] + 6), fill=255)
    return np.asarray(m) > 128

def diff_to(img, base):
    dd = np.abs(img[..., :3] - base[..., :3]).max(-1)
    return np.asarray(Image.fromarray(np.clip(dd, 0, 255).astype('uint8')).filter(ImageFilter.BoxBlur(1))).astype(np.float32)

# --- 5. lenti degli occhiali --------------------------------------------------
def lens_layer(img, base, body, eye_op, st):
    """Occhiali generati sul viso F: dietro le lenti c'era quel viso (pelle chiara, occhi
    castani). Lenti chiare: l'interno diventa trasparente e restano montatura e riflessi.
    Lenti colorate: tinta uniforme semitrasparente (trasmissione stimata sul viso di
    partenza), così sotto si vedono pelle e occhi scelti, scuriti dalla lente."""
    a0 = img[..., 3:4] / 255
    B = base[..., :3]
    O = img[..., :3] * a0 + B * (1 - a0)              # come appariva sul viso di partenza
    face = face_zone(body) & (img[..., 3] > 0)
    L, S = lum(O), satur(O)
    dd = np.abs(O - B).max(-1)
    m = Image.new('L', (W, H), 0)
    dr = ImageDraw.Draw(m)
    for x0, y0, x1, y1 in GEO[body]['eyes']:
        dr.ellipse((x0 - 16, y0 - 14, x1 + 16, y1 + 16), fill=255)
    ez = (np.asarray(m) > 128) & (img[..., 3] > 0)
    # pelle vista attraverso la lente: color pelle e chiara come la pelle (le montature
    # marroni o tartaruga hanno la stessa tinta ma sono più scure; i bordi dorati sono saturi)
    rim = (dd > 35) & (S > 0.3)
    blobs = np.asarray(Image.fromarray((rim * 255).astype('uint8')).filter(ImageFilter.MinFilter(5))
                       .filter(ImageFilter.MaxFilter(5))) > 128
    rim &= ~blobs                                       # solo linee sottili, non chiazze
    seen_skin = ((skin_like(O, st, 1.5, minL=128) & ~rim) | (dd < 18)) & face
    clear = seen_skin[ez].mean() > 0.3
    out = img.copy()
    if clear:
        frame = ((L < 115) | ((S > 0.5) & ~skin_like(O, st, 1.5, minL=40))) & ~grow(eye_op, 2)
        frame = np.asarray(Image.fromarray((frame * 255).astype('uint8')).filter(ImageFilter.MinFilter(3))
                           .filter(ImageFilter.MaxFilter(3))) > 128
        seen = (ez & ~frame) | seen_skin
    else:
        # modello della lente O = t*B + r per canale, robusto (scarta montatura e riflessi)
        sel = ez.copy()
        for _ in range(4):
            t, r = np.zeros(3), np.zeros(3)
            for c in range(3):
                A = np.vstack([B[sel][:, c], np.ones(sel.sum())]).T
                (t[c], r[c]), *_ = np.linalg.lstsq(A, O[sel][:, c], rcond=None)
            t = np.clip(t, 0, 0.95)
            res = np.abs(O - (B * t + r)).max(-1)
            sel = ez & (res < max(12, np.percentile(res[ez], 60)))
        res = np.abs(O - (B * t + r)).max(-1)
        lens = face & (res < 22)
        lens = np.asarray(Image.fromarray((lens * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3))
                          .filter(ImageFilter.MinFilter(3))) > 128
        lens &= face & (img[..., 3] > 0)
        ts = float(t.mean())
        tint = np.clip(r / max(1 - ts, 0.05), 0, 255)
        # riflessi: dove la lente è più chiara del previsto resta il pixel originale
        glare = np.clip((L - lum(B * t + r) - 15) / 30, 0, 1)
        col = tint[None, None, :] * (1 - glare[..., None]) + O * glare[..., None]
        alpha = (1 - ts) * (1 - glare) + glare
        out[..., :3] = np.where(lens[..., None], col, out[..., :3])
        out[..., 3] = np.where(lens, alpha * 255, out[..., 3])
        seen = seen_skin & ~lens
    seen = np.asarray(Image.fromarray((seen * 255).astype('uint8')).filter(ImageFilter.MinFilter(3))
                      .filter(ImageFilter.MaxFilter(3))) > 128
    seen &= face
    soft = np.asarray(Image.fromarray((seen * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
    out[..., 3] *= 1 - soft
    return out, bool(clear)

# --- 6. ombre nei capelli -----------------------------------------------------
GEO_FACE_BOTTOM = 245

def hair_shading(img, base, base_skin_mask, st, y_arm=300):
    """Pixel che sono solo il corpo base illuminato diversamente: rapporti tra i canali
    simili a quelli del corpo base (sotto le spalle, sulla pelle, si tollera di più perché
    in ombra la pelle diventa più satura). Restituisce maschera e rapporto di luminosità."""
    O, B = img[..., :3], base[..., :3]
    on = (img[..., 3] > 0) & (base[..., 3] > 128) & (lum(O) > 12) & (lum(B) > 12)
    r = O / np.maximum(B, 1)
    spread = r.max(-1) / np.maximum(r.min(-1), 1e-3)
    k = lum(O) / np.maximum(lum(B), 1)
    lim = np.full((H, W), 1.18, np.float32)
    arm = base_skin_mask.copy()
    arm[:y_arm] = False
    lim[arm] = 1.3
    same = on & (spread < lim)
    # sulle braccia anche la pelle ridisegnata più chiara (tinta di pelle, sopra pelle)
    same |= on & arm & skin_like(O, st, 1.4, minL=40)
    same = np.asarray(Image.fromarray((same * 255).astype('uint8')).filter(ImageFilter.MinFilter(3))
                      .filter(ImageFilter.MaxFilter(3))) > 128
    # solo sotto il viso: sopra, ciocche e frangia sulla fronte hanno la tinta della pelle
    same[:GEO_FACE_BOTTOM] = False
    same &= on
    # sulle braccia anche i puntini isolati rimasti tra le zone d'ombra
    closed = np.asarray(Image.fromarray((same * 255).astype('uint8')).filter(ImageFilter.MaxFilter(7))
                        .filter(ImageFilter.MinFilter(7))) > 128
    same |= closed & arm & on
    return same, k


def jaw_hair(img, base_skin_mask, body):
    """Capelli sopra la pelle del viso sotto gli occhi (il riempimento "capelli dietro il collo"
    di build_assets.py a volte copre la guancia con un blocco a bordo dritto)."""
    f = GEO[body]['face']
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).ellipse(f, fill=255)
    face = np.asarray(m) > 128
    face[:max(e[3] for e in GEO[body]['eyes']) + 4] = False
    inner = np.asarray(Image.fromarray((base_skin_mask * 255).astype('uint8')).filter(ImageFilter.MinFilter(5))) > 128
    return face & inner & (img[..., 3] > 0)

# --- 7. velatura del viso nei capelli -------------------------------------------
def local_std(x, r=2):
    from numpy.lib.stride_tricks import sliding_window_view
    w = sliding_window_view(np.pad(x, r, mode='edge'), (2 * r + 1, 2 * r + 1))
    return w.std(axis=(-1, -2))


def face_veil(img, base, base_skin_mask, body):
    """Dentro il viso, i pixel semitrasparenti con la tinta della pelle del corpo base e lisci
    (le ciocche, anche quelle lucide, hanno filamenti); sotto le sopracciglia ogni velatura."""
    f = GEO[body]['face']
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).ellipse((f[0] - 6, f[1] - 30, f[2] + 6, f[3] + 4), fill=255)
    fz = (np.asarray(m) > 128) & base_skin_mask & (img[..., 3] > 0)
    q = lambda a: a / np.maximum(lum(a)[..., None], 1)
    qd = np.abs(q(img[..., :3]) - q(base[..., :3])).max(-1)
    a = img[..., 3]
    veil = fz & (qd < 0.12) & (a < 230) & (local_std(lum(img[..., :3])) < 5)
    veil = np.asarray(Image.fromarray((veil * 255).astype('uint8')).filter(ImageFilter.MinFilter(3))
                      .filter(ImageFilter.MaxFilter(3))) > 128
    low = fz & (a < 200)
    low[:min(b[1] for b in GEO[body]['brows']) - 8] = False
    return (veil & fz) | low

# --- 8. puntini nei capelli ----------------------------------------------------
def components(mask, max_area):
    """Componenti 4-connesse di `mask` con area <= max_area (liste di indici piatti)."""
    h, w = mask.shape
    flat = mask.ravel()
    seen = np.zeros(flat.size, bool)
    out = []
    for start in np.flatnonzero(flat):
        if seen[start]:
            continue
        seen[start] = True
        comp, stack, big = [start], [start], False
        while stack:
            i = stack.pop()
            y, x = divmod(i, w)
            for j in ((i - w) if y else -1, (i + w) if y < h - 1 else -1, (i - 1) if x else -1, (i + 1) if x < w - 1 else -1):
                if j >= 0 and flat[j] and not seen[j]:
                    seen[j] = True
                    stack.append(j)
                    if not big:
                        comp.append(j)
                        big = len(comp) > max_area
        if not big:
            out.append(np.array(comp))
    return out


def hair_dots(img, G, body, eyes):
    """Riempie i buchi piccoli circondati da capelli e toglie i frammenti minuscoli sul viso."""
    e_y0, e_x0 = np.nonzero(img[..., 3] > 0)
    y0, y1, x0, x1 = e_y0.min(), e_y0.max() + 1, e_x0.min(), e_x0.max() + 1
    a = img[y0:y1, x0:x1, 3]
    sub = img[y0:y1, x0:x1]
    g = G[y0:y1, x0:x1]
    h, w = a.shape
    solid = a > 200
    fill = np.zeros((h, w), bool)
    for comp in components(a < 200, 60):  # anche i buchi con bordo semitrasparente
        ys, xs = np.divmod(comp, w)
        if ys.min() == 0 or xs.min() == 0 or ys.max() == h - 1 or xs.max() == w - 1:
            continue
        m = np.zeros((h, w), bool)
        m[ys, xs] = True
        ring = np.asarray(Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.MaxFilter(5))) > 128
        ring &= ~m
        if solid[ring].mean() > 0.85:
            fill |= m
    if fill.any():
        # colore: diffusione dai pixel di capelli vicini
        known = ~fill & solid
        col = np.where(known[..., None], sub[..., :3], 0.0)
        wgt = known.astype(np.float32)
        rgb = sub[..., :3].copy()
        todo = fill.copy()
        for _ in range(12):
            if not todo.any():
                break
            acc = np.zeros_like(col)
            cnt = np.zeros_like(wgt)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    acc += np.roll(np.roll(col, dy, 0), dx, 1)
                    cnt += np.roll(np.roll(wgt, dy, 0), dx, 1)
            new = todo & (cnt > 0)
            rgb[new] = acc[new] / cnt[new][:, None]
            col[new] = rgb[new]
            wgt[new] = 1
            todo &= ~new
        sub[..., :3] = np.where(fill[..., None], rgb, sub[..., :3])
        sub[..., 3] = np.where(fill, 255.0, sub[..., 3])
        g[fill] = 1.0
    # frammenti minuscoli staccati sopra il viso
    zone = face_zone(body)[y0:y1, x0:x1]
    specks = np.zeros((h, w), bool)
    for comp in components(sub[..., 3] > 10, 40):
        ys, xs = np.divmod(comp, w)
        if zone[ys, xs].mean() > 0.5:
            specks[ys, xs] = True
    specks = np.asarray(Image.fromarray((specks * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3))) > 128
    sub[..., 3] = np.where(specks & zone, 0.0, sub[..., 3])
    img[y0:y1, x0:x1] = sub
    G[y0:y1, x0:x1] = g
    # niente capelli (o resti delle ciglia d'origine) sugli occhi
    near = eyes
    img[..., 3] = np.where(near, 0.0, img[..., 3])
    return int(fill.sum()), int((specks & zone).sum())

# --- 9. sopracciglia piene sull'impronta di quelle del corpo base ----------------
def diffuse_fill(rgb, known, todo, it=30):
    """Colore dei pixel `todo` diffuso dai vicini `known`."""
    col = np.where(known[..., None], rgb, 0.0)
    wgt = known.astype(np.float32)
    out = rgb.copy()
    todo = todo & ~known
    for _ in range(it):
        if not todo.any():
            break
        acc, cnt = np.zeros_like(col), np.zeros_like(wgt)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                acc += np.roll(np.roll(col, dy, 0), dx, 1)
                cnt += np.roll(np.roll(wgt, dy, 0), dx, 1)
        new = todo & (cnt > 0)
        out[new] = acc[new] / cnt[new][:, None]
        col[new] = out[new]
        wgt[new] = 1
        todo &= ~new
    return out


def brows_cover(img, R, G, base_brow):
    foot = grow(base_brow > 0.03, 2)
    known = img[..., 3] > 230
    img[..., :3] = np.where((foot & ~known)[..., None], diffuse_fill(img[..., :3], known, foot), img[..., :3])
    # pelle dove serve (il sopracciglio nuovo resta sopracciglio)
    R = np.where(foot & ~known & (G < 0.3), 1.0, R).astype(np.float32)
    img[..., 3] = np.where(foot, 255.0, img[..., 3])
    return R

# --- elaborazione ------------------------------------------------------------
def save(e, img=None, R=None, G=None, B=None):
    if img is not None:
        rgba = np.clip(crop(img, e), 0, 255).astype('uint8')
        Image.fromarray(rgba, 'RGBA').save(os.path.join(ROOT, e['src'].lstrip('/')), 'WEBP', quality=90, method=6)
    if R is not None:
        mk = np.dstack([crop(c, e) for c in (R, G, B)]) * 255
        Image.fromarray(np.clip(mk, 0, 255).astype('uint8'), 'RGB').save(os.path.join(ROOT, e['mask'].lstrip('/')), optimize=True)

bases = {b: load(d['bodies'][b]) for b in ('F', 'M')}
base_skin = {}
skin = {b: skin_stats(bases[b], b) for b in ('F', 'M')}
eye_open = {}
base_brow = {}
eye_core = {}  # bianco dell'occhio e iride del corpo base: la zona da non coprire coi capelli

# corpo base: sopracciglia e iridi
for body in ('F', 'M'):
    e = d['bodies'][body]
    img = bases[body]
    version = int(e.get('fixed', 0))
    old = load(e, 'mask', 'RGB') / 255
    G = brows_mask(img, body)
    base_brow[body] = G
    B, eye_open[body] = iris_mask(img, body, skin[body])
    boxes = np.zeros((H, W), bool)
    for x0, y0, x1, y1 in GEO[body]['eyes']:
        boxes[y0 - 2:y1 + 2, x0 - 2:x1 + 2] = True
    sclera = (lum(img[..., :3]) > 150) & (satur(img[..., :3]) < 0.22) & (img[..., 3] > 128)
    eye_core[body] = grow(boxes & (sclera | (B > 0.2)), 3)
    R = old[..., 0]
    if version < 1:
        R = np.clip(np.maximum(R, old[..., 1] * skin_like(img[..., :3], skin[body], 1.3, minL=60)) - G - B, 0, 1)
    if version < 2:
        # pelle in ombra (sotto le ascelle, mani vicino ai pantaloncini) che la soglia di
        # build_assets.py lasciava fuori: con gli incarnati scuri restava chiara. La stoffa
        # del corpo base è grigia, quindi basta una tinta calda e un po' satura.
        px = img[..., :3]
        shorts = load(dict(e, src=e['shorts']['src']), 'src', 'L') / 255
        warm = (px[..., 0] > px[..., 1]) & (px[..., 1] >= px[..., 2] - 2) & (satur(px) > 0.14)
        add = (img[..., 3] > 128) & warm & (R < 0.3) & (G < 0.3) & (B < 0.3) & (shorts < 0.3)
        R = np.maximum(R, add.astype(np.float32))
        R = np.clip(np.maximum(R, brow_ring(G, img[..., 3])) * (1 - G) - B, 0, 1)
    if version < VERSION:
        save(e, None, R, G, B)
    base_skin[body] = R > 0.5
    e['stats'] = {'G': l_stats(img[..., :3], G), 'B': l_stats(img[..., :3], B)}
    e['fixed'] = VERSION
    print(body, 'base', e['stats'])

done = set()
for key, per in d['layers'].items():
    cat = key.split('/')[0]
    for body, e in per.items():
        version = int(e.get('fixed', 0))
        if e['src'] in done or version >= VERSION:
            continue
        done.add(e['src'])
        # i pezzi condivisi (generati solo su F) hanno lo stesso file anche per M
        src_body = 'F' if (cat in ('hair', 'hat', 'glasses', 'jewel', 'other') or key == 'incl/impianto') and \
            per.get('F', {}).get('src') == e['src'] else body
        base = bases[src_body]
        img = load(e)
        has_mask = 'mask' in e
        old = load(e, 'mask', 'RGB') / 255 if has_mask else np.zeros((H, W, 3), np.float32)
        R, G, B = old[..., 0], old[..., 1], old[..., 2]
        changed_img = False

        if version < 1 and cat in CLEAN and key != 'incl/stampelle' and key != 'incl/bastone':
            dd = diff_to(img, base)
            zone = face_zone(src_body) if cat != 'brows' else np.zeros((H, W), bool)
            eyes = grow(eye_open[src_body], 2)
            keep = np.ones((H, W), np.float32)
            # capelli e cappelli sono molto diversi dalla pelle: lì si può pulire più a fondo
            lo, hi = (14, 30) if cat in ('hair', 'hat') else (8, 20)
            keep[zone] = smooth(lo, hi, dd[zone])
            keep[eyes] = np.minimum(keep[eyes], smooth(14, 30, dd[eyes]))
            if (keep < 0.999).any():
                img[..., 3] *= keep
                changed_img = True

        if version < 1 and cat in CLEAN and cat not in ('brows', 'lashes'):
            # pelle rimasta nel pezzo (fronte all'attaccatura dei capelli, viso dietro le lenti,
            # o il viso del corpo F nei pezzi condivisi con M): simile alla pelle e quasi uguale
            # al corpo base, quindi trasparente. Le ciocche castano chiaro e le montature sottili
            # somigliano alla pelle ma sono molto diverse dal corpo base e restano.
            dd = diff_to(img, base)
            px = img[..., :3]
            shine = (lum(px) > 150) & (satur(px) < 0.2)  # riflessi della pelle, poco saturi
            sk = face_zone(src_body) & (skin_like(px, skin[src_body], 1.2, minL=50) | shine) & (dd < 25)
            if sk.any():
                img[..., 3] *= 1 - np.asarray(Image.fromarray((sk * 255).astype('uint8')).filter(
                    ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
                changed_img = True
                G = np.where(sk, 0.0, G).astype(np.float32)
        if version < 1 and cat == 'brows':
            Gn = np.zeros((H, W), np.float32) if key == 'brows/nessuna' else brows_mask(img, body)
            R = np.clip(np.maximum(R, G * (1 - Gn) * skin_like(img[..., :3], skin[body], 1.3, minL=60)) - Gn, 0, 1)
            G = Gn
        if version < 2 and cat == 'brows':
            R = np.clip(np.maximum(R, brow_ring(G, img[..., 3])) * (1 - G), 0, 1)
        if version < 1 and cat == 'eyes':
            if '__' in key:
                # forma d'occhio + ciglia: l'interno dell'occhio è quello della forma, quindi
                # anche l'iride (le ciglia folte ingannerebbero la ricerca della pupilla)
                Bn = load(d['layers'][key.split('__')[0]][body], 'mask', 'RGB')[..., 2] / 255 * (img[..., 3] > 0)
            else:
                Bn, _ = iris_mask(img, body, skin[body])
            R = np.clip(np.maximum(R, B * (1 - Bn) * skin_like(img[..., :3], skin[body], 1.3, minL=40)) - Bn, 0, 1)
            B = Bn

        if version < 2 and cat in ('torso', 'legs'):
            # build_assets.py rendeva trasparente la stoffa beige scambiandola per pelle uguale al
            # corpo base (buchi sul trench, cappotto beige semitrasparente): con la pelle scura si
            # vedeva sotto. Dentro la sagoma del capo l'alfa torna pieno; vicino al bordo resta lo
            # sfondo bianco (lo spazio tra braccio e busto), nell'interno profondo no.
            a = img[..., 3]
            closed = Image.fromarray(((a > 64) * 255).astype('uint8')).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
            inner = np.asarray(closed.filter(ImageFilter.MinFilter(7))) > 128
            deep = np.asarray(closed.filter(ImageFilter.MinFilter(21))) > 128
            px = img[..., :3]
            bg = (lum(px) > 235) & (satur(px) < 0.06)
            fill = ((inner & ~bg) | deep) & (a < 250)
            if fill.any():
                img[..., 3] = np.where(fill, 255.0, a)
                changed_img = True

        if version < 2 and cat in BODY:
            dd = diff_to(img, base)
            px = img[..., :3]
            q = px / np.maximum(lum(px)[..., None], 1)
            # mani e pelle copiate identiche dal corpo base: trasparenti, sotto c'è già la pelle
            # ricolorata. L'apertura morfologica tiene i blocchi (mani) e scarta le strisce
            # sottili dove una stoffa beige è quasi uguale alla pelle.
            same = (img[..., 3] > 0) & base_skin[src_body] & (dd < 10) & (q[..., 0] > skin[src_body]['q'][0] - 0.06)
            same = np.asarray(Image.fromarray((same * 255).astype('uint8')).filter(ImageFilter.MinFilter(5))
                              .filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
            if same.max() > 0:
                img[..., 3] *= 1 - same
                changed_img = True
            # pelle in ombra rimasta fuori dalla maschera (sotto le ascelle, attorno all'impianto):
            # più rossa della pelle media, a contatto con la pelle già marcata. Il cachi e il
            # beige delle stoffe sono più gialli, le fantasie sature superano il limite di saturazione.
            L, S = lum(px), satur(px)
            st = skin[src_body]
            cand = (img[..., 3] > 128) & (same < 0.5) & (q[..., 0] > st['q'][0] - 0.06) & \
                (q[..., 2] < st['q'][2] + 0.04) & (S > 0.2) & (S < 0.6) & (L > 25) & (L < 200)
            seed = R > 0.5
            if not seed.any() and cat == 'incl':
                seed = cand & skin_like(px, st, 1.0, minL=60)  # impianto: nessuna pelle marcata
            reach = seed.copy()
            for _ in range(8):
                reach = grow(reach) & (cand | seed)
            add = reach & (R < 0.5)
            if key == 'incl/impianto':
                # orecchio (generato sul corpo F) e apparecchio color pelle: tutto ricolorato come pelle
                add |= skin_like(px, st, 1.3, minL=30) & (img[..., 3] > 0)
            if cat == 'legs':
                # nei pezzi delle gambe braccia e mani non fanno parte del capo: fuori dai fianchi,
                # all'altezza delle mani, la pelle del corpo base resta pelle
                x0, _, x1, _ = SHORTS[src_body]
                arms = np.zeros((H, W), bool)
                arms[380:760, :x0 + 5] = True
                arms[380:760, x1 - 5:] = True
                armskin = cand | skin_like(px, st, 1.3, minL=30)
                add |= arms & armskin & (img[..., 3] > 0) & base_skin[src_body] & (R < 0.5)
            if add.any():
                R = np.maximum(R, add.astype(np.float32))
                if not has_mask:
                    e['mask'] = e['src'].replace('.webp', '.mask.png')
                    has_mask = True
                    old = np.zeros((H, W, 3), np.float32)

        if version < 4 and cat == 'hair':
            same, k = hair_shading(img, base, base_skin[src_body], skin[src_body])
            shade = same & (k < 0.97)
            a = img[..., 3] / 255
            # ombra: nero con alfa pari alla luce tolta, valida su qualunque incarnato
            img[..., :3] = np.where(shade[..., None], 0.0, img[..., :3])
            img[..., 3] = np.where(shade, np.clip(1 - k, 0, 0.6) * a * 255, np.where(same, 0.0, img[..., 3]))
            jaw = jaw_hair(img, base_skin[src_body], src_body)
            soft = np.asarray(Image.fromarray((jaw * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1))).astype(np.float32) / 255
            img[..., 3] *= 1 - soft
            R = np.where(same | jaw, 0.0, R).astype(np.float32)
            G = np.where(same | jaw, 0.0, G).astype(np.float32)
            changed_img = True

        if version < 5 and cat == 'hair':
            veil = face_veil(img, base, base_skin[src_body], src_body)
            soft = np.asarray(Image.fromarray((veil * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
            img[..., 3] *= 1 - soft
            G = np.where(veil, 0.0, G).astype(np.float32)
            changed_img = True

        if version < 10 and key == 'brows/nessuna':
            R = brows_cover(img, R, G, base_brow[body])
            changed_img = True

        if version < 9 and cat == 'hair':
            G = G.copy()
            hair_dots(img, G, src_body, eye_core[src_body])
            changed_img = True

        if version < 3 and cat == 'glasses':
            img, _ = lens_layer(img, base, src_body, eye_open[src_body], skin[src_body])
            changed_img = True

        mask_changed = has_mask and np.abs(np.dstack([R, G, B]) - old).max() > 1 / 255
        save(e, img if changed_img else None, *((R, G, B) if mask_changed else (None, None, None)))
        stats = {'G': l_stats(img[..., :3], G), 'B': l_stats(img[..., :3], B)}
        if stats['G'] or stats['B']:
            e['stats'] = stats
        elif any((e.get('stats') or {}).values()):
            e.pop('stats')
        e['fixed'] = VERSION
        print(key, body, 'pulito' if changed_img else '', e.get('stats', ''), flush=True)

# le voci condivise di M puntano agli stessi file: allinea maschera e statistiche
for key, per in d['layers'].items():
    if 'M' in per and 'F' in per and per['M']['src'] == per['F']['src']:
        per['M'] = dict(per['F'])

json.dump(d, open(MANIFEST, 'w'), indent=1)
print('ok')
