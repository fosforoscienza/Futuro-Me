"""
Pipeline asset avatar: dalle immagini generate (raw/) ai livelli pronti per il sito.

Per ogni pezzo:
  1. riallinea l'immagine modificata al corpo base (spostamento di 1-2 px);
  2. ricava l'alfa dalla differenza con il corpo base, dentro una regione per categoria;
  3. calcola le maschere di colore: R = pelle, G = capelli/sopracciglia, B = iride;
  4. ritaglia al riquadro utile e salva WebP (+ PNG maschera) e una voce nel manifest.

Uso: python3 -I build_assets.py <raw_dir> <public_out_dir> <manifest_out.json>
"""
import json, os, sys
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RAW, OUT, MANIFEST = sys.argv[1:4]
W, H = 848, 1264

def load(path):
    im = Image.open(path).convert('RGB')
    if im.size != (W, H):
        im = im.resize((W, H), Image.LANCZOS)
    return np.asarray(im).astype(np.float32)

def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114

def mask_from(shapes, sub=()):
    m = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(m)
    for kind, box in shapes:
        getattr(d, kind)(box, fill=255)
    for kind, box in sub:
        getattr(d, kind)(box, fill=0)
    return np.asarray(m).astype(np.float32) / 255

def blur(a, r):
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype('uint8'))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255

def close(a, k=5):
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype('uint8'))
    im = im.filter(ImageFilter.MaxFilter(k)).filter(ImageFilter.MinFilter(k))
    return np.asarray(im).astype(np.float32) / 255

# --- geometria per corpo -----------------------------------------------------
GEO = {
    'F': dict(face=(372, 140, 478, 272), eyes=[(372, 158, 412, 188), (437, 158, 477, 188)],
              brows=[(362, 136, 420, 162), (430, 136, 488, 162)]),
    'M': dict(face=(374, 138, 482, 276), eyes=[(374, 156, 416, 184), (434, 156, 474, 184)],
              brows=[(366, 136, 424, 164), (432, 136, 492, 164)]),
}

def region(cat, name, body):
    g = GEO[body]
    face = ('ellipse', g['face'])
    ears = [('rectangle', (322, 150, 392, 310)), ('rectangle', (458, 150, 530, 310))]
    if cat == 'hair':
        sub = [('ellipse', (g['face'][0] + 4, 150 if name == 'frangetta' else g['face'][1], g['face'][2] - 4, g['face'][3]))]
        wide = (200, 5, 650, 565) if name == 'afro' else (240, 5, 610, 565)
        return mask_from([('rectangle', wide)], sub)
    if cat == 'hat':
        if name == 'hijab':
            return mask_from([('rectangle', (215, 15, 635, 540))], [('ellipse', (380, 142, 470, 262))])
        box = (170, 0, 680, 320) if name in ('tesa_larga', 'cowboy') else (240, 0, 610, 300)
        return mask_from([('rectangle', box)], [face])
    if cat == 'other':
        if name == 'lenti':
            return mask_from([('rectangle', (330, 70, 520, 225))])
        return mask_from([('rectangle', (240, 0, 610, 320))], [('ellipse', (376, 150, 474, 272))])
    if cat == 'skin':
        # vitiligine: viso, collo, avambracci e mani
        return mask_from([('rectangle', (330, 90, 520, 330)), ('rectangle', (215, 450, 345, 790)), ('rectangle', (505, 450, 640, 790))])
    if cat == 'glasses':
        return mask_from([('rectangle', (340, 132, 510, 214))])
    if cat == 'jewel':
        if name in ('cerchio', 'pendenti', 'diamante', 'dilatatore', 'cerchio_grandi', 'perle'):
            return mask_from(ears)
        if name in ('naso_anello', 'naso_diamante', 'septum'):
            return mask_from([('rectangle', (400, 188, 455, 240))])
        if name == 'medusa':
            return mask_from([('rectangle', (395, 200, 460, 262))])
        return mask_from([('rectangle', (415, 128, 495, 178))])
    if cat == 'incl' and name == 'impianto':
        return mask_from([('rectangle', (318, 130, 395, 270)), ('rectangle', (455, 130, 535, 270))])
    if cat == 'incl':
        return mask_from([('rectangle', (140, 330, 710, 1264))], [('ellipse', (300, 40, 550, 330))])
    if cat == 'neck':
        return mask_from([('rectangle', (325, 238, 525, 440))])
    if cat == 'torso':
        return mask_from([('rectangle', (160, 232, 690, 910))], [('ellipse', (340, 40, 510, 268))])
    if cat == 'arms':
        if name == 'tatuaggi':
            return mask_from([('rectangle', (200, 380, 660, 780))], [('rectangle', (318, 280, 532, 820))])
        return mask_from([('rectangle', (220, 590, 345, 780)), ('rectangle', (505, 590, 640, 780))])
    if cat == 'legs':
        return mask_from([('rectangle', (215, 555, 645, 1264))])
    if cat == 'shoes':
        return mask_from([('rectangle', (240, 940 if name in ('anfibi', 'cowboy') else 1050, 610, 1264))])
    if cat == 'nose':
        return mask_from([('ellipse', (396, 176, 458, 240))])
    if cat == 'mouth':
        return mask_from([('ellipse', (380, 204, 470, 252))])
    if cat == 'brows':
        return mask_from([('rectangle', b) for b in g['brows']])
    if cat == 'eyes':
        # un'ellisse per occhio: niente strisce di tempia, naso e orecchio ai bordi
        return mask_from([('ellipse', (b[0] - 18, b[1] - 12, b[2] + 18, b[3] + 14)) for b in g['eyes']])
    if cat == 'lashes':
        return mask_from([('rectangle', (362, 146, 490, 198))])
    if cat == 'makeup':
        return mask_from([('ellipse', (352, 122, 500, 272))])
    raise ValueError(cat)

THRESH = {'hair': (20, 45), 'skin': (8, 26), 'nose': (5, 18), 'mouth': (6, 20), 'eyes': (6, 20), 'lashes': (8, 24), 'brows': (8, 24),
          'makeup': (6, 22), 'glasses': (20, 48), 'jewel': (14, 34)}
MULTIPLY = {'makeup', 'arms/tatuaggi'}
SHARED = {'hair', 'hat', 'glasses', 'jewel', 'other', 'incl/impianto'}

# --- maschere colore ---------------------------------------------------------
def skin_stats(base, body):
    cut = cutout_alpha(base)
    L = lum(base)
    q = base / np.maximum(L[..., None], 1)
    g = GEO[body]
    sample = mask_from([('ellipse', (g['face'][0] + 15, 185, g['face'][2] - 15, 255)),
                        ('rectangle', (260, 450, 300, 600)), ('rectangle', (550, 450, 590, 600)),
                        ('rectangle', (340, 850, 400, 1050))]) > 0.5
    sample &= cut > 0.5
    qs = q[sample]
    return dict(L=float(L[sample].mean()), q=qs.mean(0).tolist(), qstd=qs.std(0).tolist())

def skin_like(a, st, loose=1.0):
    L = lum(a)
    q = a / np.maximum(L[..., None], 1)
    d = np.abs(q - np.array(st['q'])) / (np.array(st['qstd']) * 3.2 * loose + 1e-3)
    sat = (a.max(-1) - a.min(-1)) / np.maximum(a.max(-1), 1)
    return (d.max(-1) < 1) & (L > 95) & (sat > 0.15)

def chan_stats(a, m):
    sel = m > 0.5
    if sel.sum() < 20:
        return None
    L = lum(a)
    q = a / np.maximum(L[..., None], 1)
    return dict(L=float(L[sel].mean()), q=q[sel].mean(0).tolist())

def cutout_alpha(img):
    bg = np.median(np.concatenate([img[:15].reshape(-1, 3), img[:, :15].reshape(-1, 3)]), 0)
    far = np.sqrt(((img - bg) ** 2).sum(-1)) > 16
    L = lum(img)
    sat = (img.max(-1) - img.min(-1)) / np.maximum(img.max(-1), 1)
    ys = np.arange(H)[:, None] * np.ones((1, W))
    far &= ~((ys > 1150) & (sat < 0.08) & (L > 170))  # ombra a terra
    far &= ~((ys > 1100) & (sat < 0.1))
    seen = np.zeros((H, W), bool)
    q = deque([(0, x) for x in range(W)] + [(H - 1, x) for x in range(W)] +
              [(y, 0) for y in range(H)] + [(y, W - 1) for y in range(H)])
    while q:
        y, x = q.popleft()
        if 0 <= y < H and 0 <= x < W and not seen[y, x] and not far[y, x]:
            seen[y, x] = True
            q.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
    a = (~seen).astype(np.float32)
    a = np.asarray(Image.fromarray((a * 255).astype('uint8')).filter(ImageFilter.MinFilter(3))
                   .filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255
    return a

def shift(img, dx, dy):
    return np.roll(np.roll(img, dy, 0), dx, 1)

def best_shift(base, ed, reg):
    ring = blur(reg, 18) > 0.02
    ring &= reg < 0.5
    tex = np.abs(np.gradient(lum(base))[0]) + np.abs(np.gradient(lum(base))[1]) > 4
    sel = ring & tex
    if sel.sum() < 200:
        return 0, 0
    ys, xs = np.where(sel)
    y0, y1, x0, x1 = max(ys.min() - 3, 0), min(ys.max() + 4, H), max(xs.min() - 3, 0), min(xs.max() + 4, W)
    sb, se, ss = base[y0:y1, x0:x1], ed[y0:y1, x0:x1], sel[y0:y1, x0:x1]
    best = None
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            s = shift(se, dx, dy)
            e = np.abs(s[ss] - sb[ss]).mean()
            if best is None or e < best[0]:
                best = (e, dx, dy)
    return best[1], best[2]

# --- salvataggio -------------------------------------------------------------
def save_layer(rgb, alpha, masks, rel):
    ys, xs = np.where(alpha > 0.03)
    if len(ys) == 0:
        return None
    y0, y1 = max(ys.min() - 2, 0), min(ys.max() + 3, H)
    x0, x1 = max(xs.min() - 2, 0), min(xs.max() + 3, W)
    rgba = np.dstack([rgb, alpha * 255])[y0:y1, x0:x1]
    path = os.path.join(OUT, rel + '.webp')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray(np.clip(rgba, 0, 255).astype('uint8'), 'RGBA').save(path, 'WEBP', quality=90, method=6)
    entry = dict(src='/avatar/' + rel + '.webp', x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0))
    if masks is not None and any(m[y0:y1, x0:x1].max() > 0.5 for m in masks):
        mk = np.dstack([m[y0:y1, x0:x1] for m in masks]) * 255
        Image.fromarray(np.clip(mk, 0, 255).astype('uint8'), 'RGB').save(os.path.join(OUT, rel + '.mask.png'), optimize=True)
        entry['mask'] = '/avatar/' + rel + '.mask.png'
    return entry

def iris_mask(img, body, st):
    m = mask_from([('rectangle', b) for b in GEO[body]['eyes']]) > 0.5
    L = lum(img)
    sat = (img.max(-1) - img.min(-1)) / np.maximum(img.max(-1), 1)
    return (m & (L > 30) & (L < 175) & (sat > 0.16) & ~skin_like(img, st)).astype(np.float32)

SHORTS = {'F': (285, 572, 565, 820), 'M': (280, 585, 570, 822)}

def shorts_like(img, body, grow=0):
    x0, y0, x1, y1 = SHORTS[body]
    m = mask_from([('rectangle', (x0 - grow, y0, x1 + grow, y1 + grow))]) > 0.5
    L = lum(img)
    sat = (img.max(-1) - img.min(-1)) / np.maximum(img.max(-1), 1)
    return m & (sat < 0.1) & (L > 70) & (L < 188)

def brows_mask(img, body):
    m = mask_from([('rectangle', b) for b in GEO[body]['brows']]) > 0.5
    return (m & (lum(img) < 125)).astype(np.float32)

manifest = {'size': [W, H], 'bodies': {}, 'layers': {}, 'objects': {}, 'envs': {}}
bases, stats, cuts = {}, {}, {}
for body in ('F', 'M'):
    base = load(os.path.join(RAW, body, 'base.png'))
    bases[body] = base
    st = skin_stats(base, body)
    stats[body] = st
    a = cutout_alpha(base)
    R = (skin_like(base, st, 1.3) & (a > 0.5)).astype(np.float32)
    G = brows_mask(base, body)
    B = iris_mask(base, body, st)
    R = np.clip(R - G - B, 0, 1)
    # il bordo della testa sfuma nello sfondo bianco: senza tinta resta un filo chiaro
    # tra viso e capelli con le carnagioni scure
    head = np.zeros((H, W), bool)
    head[:290] = True
    rim = head & (a > 0.05) & (blur(R, 3) > 0.05) & (G < 0.5) & (B < 0.5)
    R = np.maximum(R, rim.astype(np.float32))
    e = save_layer(base, a, [blur(R, 0.6), G, B], f'{body}/base')
    e['skin'] = dict(L=st['L'], q=st['q'])
    sh = (shorts_like(base, body) & (a > 0.5)).astype(np.float32)
    sh = blur(close(sh, 5), 0.8)
    os.makedirs(os.path.join(OUT, body), exist_ok=True)
    x0, y0 = e['x'], e['y']
    Image.fromarray((sh[y0:y0 + e['h'], x0:x0 + e['w']] * 255).astype('uint8'), 'L').save(
        os.path.join(OUT, body, 'base.shorts.png'), optimize=True)
    e['shorts'] = dict(src=f'/avatar/{body}/base.shorts.png', L=float(lum(base)[sh > 0.5].mean()))
    cuts[body] = a
    e['stats'] = {'G': chan_stats(base, G), 'B': chan_stats(base, B)}
    manifest['bodies'][body] = e
    print(body, 'skin', st)

# capi color sabbia: per colore sono indistinguibili dalla pelle, quindi la maschera
# pelle (che li ricolorerebbe con il tono scelto) va decisa a mano
NO_SKIN = {'legs/eleganti', 'legs/vigile', 'shoes/cowboy', 'shoes/antinfortunistiche'}
HANDS_ONLY = {'torso/trench', 'torso/cappotto_beige', 'torso/vigile', 'torso/collo_alto', 'torso/militare'}
HAND_Y = {'F': 685, 'M': 665}  # sotto i polsini: solo mani
# pantaloni color sabbia: pieni fino all'orlo (sopra la pelle chiara la differenza è minima)
LEG_FILL = {'legs/eleganti': {'F': 1150, 'M': 1148}, 'legs/vigile': {'F': 1158, 'M': 1152},
            'legs/corti': {'F': 812, 'M': 839}}
SKIN_BELOW = {'legs/corti': {'F': 820, 'M': 847}}  # sotto l'orlo dei pantaloncini

def hands_mask(base, body, st):
    x0, y0, x1, y1 = SHORTS[body]
    ys = np.arange(H)[:, None]
    xs = np.arange(W)[None, :]
    m = skin_like(base, st, 1.3) & (ys > HAND_Y[body]) & ((xs < x0 + 30) | (xs > x1 - 30))
    return blur(m.astype(np.float32), 4) > 0.05

EXPOSED_WAIST = {'bikini', 'nudo', 'camicia', 'top', 'blazer'}

LONG_COATS = {'cappotto_beige', 'cappotto_blu', 'trench'}

def open_(a, k=5):
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype('uint8'))
    im = im.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k))
    return np.asarray(im).astype(np.float32) / 255

def torso_cleanup(al, ed, base, body, name, st):
    """Sotto la vita il busto non deve coprire i pantaloni con residui del corpo base.

    Restituisce l'alfa pulito e, per i cappotti lunghi, la zona in cui spegnere la maschera pelle.
    """
    x0, y0, x1, y1 = SHORTS[body]
    ys = np.arange(H)[:, None]
    xs = np.arange(W)[None, :]
    legzone = (ys > y0) & (xs > x0 + 25) & (xs < x1 - 25)
    L = lum(ed)
    sat = (ed.max(-1) - ed.min(-1)) / np.maximum(ed.max(-1), 1)
    cx = (x0 + x1) // 2
    if name in LONG_COATS:
        # cappotto chiuso: pieno fino all'orlo; l'orlo è dove tra le gambe torna lo sfondo
        cut = cutout_alpha(ed)
        hem = next((y for y in range(y0 + 80, H) if cut[y, cx - 6:cx + 7].mean() < 0.5), H)
        fill = (cut > 0.5) & (ys > y0 - 40) & (ys < hem) & (xs > x0 - 70) & (xs < x1 + 70)
        al = np.maximum(al, fill.astype(np.float32))
        al[(ys >= hem) & (xs > x0 - 70) & (xs < x1 + 70)] = 0
        al = blur(al, 0.6)
        return al, legzone & (ys < hem)
    diff = np.sqrt(((ed - base) ** 2).sum(-1))
    skin = skin_like(ed, st, 1.3)
    # residui: pelle sulle gambe e pixel ancora simili ai pantaloncini grigi del corpo base
    Lb = lum(base)
    satb = (base.max(-1) - base.min(-1)) / np.maximum(base.max(-1), 1)
    rect = mask_from([('rectangle', (x0 - 12, y0 - 35, x1 + 12, y1 + 12))]) > 0.5
    shorts_b = rect & (satb < 0.15) & (Lb < 190) & ~skin_like(base, st, 1.3)
    # (i residui sono grigi e non più chiari del base; un capo chiaro sopra i pantaloncini sì)
    junk_sat = 0.1 if name == 'camicia_jeans' else 0.2  # il jeans chiaro è quasi grigio
    junk = (legzone & skin & skin_like(base, st, 1.3)) | (shorts_b & (diff < 75) & (sat < junk_sat) & (L < Lb + 10))
    if name == 'camice':
        # camice aperto: sotto la vita resta solo il tessuto bianco
        junk |= legzone & ~((L > 165) & (sat < 0.15))
    keep = al.copy()
    # il capo sostituisce sempre la maglietta del corpo base: dentro la sua sagoma è
    # tutto capo, anche dove è uguale alla maglietta o allo sfondo bianco (camicie bianche,
    # jeans chiari). Fuori restano solo la pelle (collo, braccia) e i pantaloncini.
    reg = region('torso', name, body) > 0.5
    skinzone = blur(skin_like(base, st, 1.3).astype(np.float32), 2) > 0.1
    band = mask_from([('rectangle', (x0 - 12, y0 - 40, x1 + 12, y1 + 12))]) > 0.5
    # pantaloncini scoperti togliendo la maglietta: grigi, più scuri della maglietta del
    # corpo base e dentro la sua sagoma (un capo bianco in ombra sullo sfondo resta)
    greyish = (band & (sat < 0.1) & (L > 70) & (L < 188) & (L < Lb - 15)
               & (cuts[body] > 0.5) & ~skin_like(base, st, 1.3))
    fill = (cutout_alpha(ed) > 0.5) & reg & ~skin & ~(skinzone & (diff < 30)) & ~greyish
    # sui fianchi niente granelli: della sagoma resta solo ciò che è pieno
    fill &= ~band | (open_(fill.astype(np.float32), 5) > 0.5)
    keep = np.maximum(keep, fill.astype(np.float32))
    if name in EXPOSED_WAIST:
        # capi corti o infilati nei pantaloni: lì sotto si vedono i pantaloncini del base
        keep[greyish] = 0
    if name != 'camice':
        # sui fianchi il capo è pieno: dove coincide con la maglietta del corpo base
        # l'alfa era zero e lì sotto i pantaloni scoperchiavano tutto
        hip = (cutout_alpha(ed) > 0.5) & ~skin & (Lb > 190) & (diff < 40) & (ys > y0 - 60) & (ys < 770) & (xs > x0) & (xs < x1)
        keep = np.maximum(keep, hip.astype(np.float32))
        keep[legzone & (ys > 770)] = 0
    keep[junk] = 0
    # via i granelli rimasti sotto la vita
    low = open_((keep > 0.5).astype(np.float32), 5) > 0.5
    keep[legzone & (blur(low.astype(np.float32), 1.5) < 0.05)] = 0
    return keep, None

def process(body, fname):
    cat, name = fname[:-4].split('__')
    key = f'{cat}/{name}'
    base, st = bases[body], stats[body]
    ed = load(os.path.join(RAW, body, fname))
    reg = region(cat, name, body)
    dx, dy = best_shift(base, ed, reg)
    ed = shift(ed, dx, dy)
    lo, hi = THRESH.get(cat, (14, 38))
    diff = np.sqrt(((ed - base) ** 2).sum(-1))
    al = np.clip((diff - lo) / (hi - lo), 0, 1)
    if cat in ('hair', 'hat', 'other'):
        # via le linee lungo i contorni del corpo (piccoli disallineamenti), non le ciocche
        gy, gx = np.gradient(lum(base))
        edge = blur((np.hypot(gx, gy) > 10).astype(np.float32), 1.0) > 0.2
        al[edge & (diff < 60)] = 0
    if cat == 'hair':
        # i capelli (castano medio) sono più scuri di pelle e maglietta: via aloni e riflessi
        al *= np.clip((170 - lum(ed)) / 35, 0, 1)
        # sul collo (sotto il mento) le ombre rifatte della pelle non sono capelli
        neck = np.zeros((H, W), bool)
        neck[GEO[body]['face'][3] - 10:420, 340:510] = True
        al[neck & skin_like(ed, st, 1.3) & skin_like(base, st, 1.3) & (lum(ed) > 100)] = 0
        # sotto la testa (spalle, braccia, maglietta) le ciocche sono molto diverse dal corpo:
        # le differenze lievi sono solo ombre rifatte, non capelli
        al[300:] *= np.clip((diff[300:] - 50) / 20, 0, 1)
    al = blur(close(al, 5), 1.0)
    al *= blur(reg, 3)
    if cat == 'hair':
        # l'ellisse del viso è più larga della mandibola: ai lati, sotto gli occhi, ciò che
        # non è pelle è la chioma dietro il collo (altrimenti lì resta lo sfondo bianco)
        f = GEO[body]['face']
        cx = (f[0] + f[2]) // 2
        ys = np.arange(H)[:, None]
        xs = np.arange(W)[None, :]
        face = mask_from([('ellipse', f)]) > 0.5
        jaw = face & (ys > 200) & ((xs < cx - 28) | (xs > cx + 28))
        back = jaw & ~skin_like(ed, st, 1.3) & (lum(ed) < 150) & (diff > lo)
        al = np.maximum(al, blur(back.astype(np.float32), 0.8))
    if cat == 'eyes':
        # le sopracciglia ridisegnate insieme agli occhi coprirebbero quelle scelte
        top = min(b[1] for b in GEO[body]['eyes']) - 3
        brows = mask_from([('rectangle', b) for b in GEO[body]['brows']]) > 0.5
        al[brows & (np.arange(H)[:, None] < top)] = 0
        al = blur(al, 0.8)
    if key in LEG_FILL:
        cut = cutout_alpha(ed)
        ys = np.arange(H)[:, None]
        legs_fill = (cut > 0.5) & (ys > 555) & (ys < LEG_FILL[key][body]) & (reg > 0.5)
        al = np.maximum(al, legs_fill.astype(np.float32))
    if cat not in ('eyes', 'lashes', 'nose', 'mouth', 'brows', 'makeup', 'skin'):
        same_skin = skin_like(ed, st, 1.2) & skin_like(base, st, 1.2) & (diff < 35)
        # un capo color sabbia sopra la pelle sembra "pelle rimasta uguale": lì è stoffa
        if key in HANDS_ONLY:
            same_skin &= hands_mask(base, body, st)
        elif key in LEG_FILL:
            same_skin[:LEG_FILL[key][body]] = False
        al[blur(same_skin.astype(np.float32), 1.0) > 0.5] = 0
    if cat == 'torso' or (cat == 'incl' and name != 'impianto'):
        # i pantaloncini grigi del corpo base non devono finire nei pezzi del busto
        al[shorts_like(ed, body, grow=12)] = 0
    noskin = None
    if cat == 'torso':
        al, noskin = torso_cleanup(al, ed, base, body, name, st)
    if cat == 'incl' and name != 'impianto':
        al[skin_like(ed, st, 1.3)] = 0
        col = mask_from([('rectangle', (300, 560, 550, 1264))]) > 0.5
        al[col & (lum(ed) > 60) & ~(((ed.max(-1) - ed.min(-1)) / np.maximum(ed.max(-1), 1)) > 0.25)] = 0
    if cat in ('legs', 'shoes', 'incl'):
        # niente residui d'ombra lontano dai piedi
        near = blur(cuts[body], 14) > 0.02
        far = ~near
        far[:1090] = False
        al[far] = 0
    al = blur(close(al, 3), 0.6) if cat == 'incl' else al
    rel = f'{body}/{cat}__{name}'
    if key in MULTIPLY or cat in MULTIPLY:
        rgb = np.clip(255 * ed / np.maximum(base, 1), 0, 255)
        e = save_layer(rgb, al, None, rel)
        if e:
            e['blend'] = 'multiply'
    else:
        skin = skin_like(ed, st, 1.2).astype(np.float32)
        G = np.zeros((H, W), np.float32)
        B = np.zeros((H, W), np.float32)
        if cat == 'hair':
            G = (al > 0.02).astype(np.float32)
        if cat == 'brows':
            G = brows_mask(ed, body)
        if cat == 'eyes':
            B = iris_mask(ed, body, st)
        R = np.clip(skin - G - B, 0, 1) * (al > 0.02)
        if cat in ('nose', 'mouth'):
            R = (al > 0.02).astype(np.float32)
        if noskin is not None:
            R[noskin] = 0
        if key in NO_SKIN:
            R[:] = 0
        elif key in HANDS_ONLY:
            R *= hands_mask(base, body, st)
        elif key in SKIN_BELOW:
            R[:SKIN_BELOW[key][body]] = 0
        if cat in ('hair', 'hat', 'other', 'glasses', 'jewel', 'neck', 'incl', 'arms'):
            # la pelle rifatta è già stata tolta: qui ogni pixel rimasto è il pezzo stesso
            R[:] = 0
        e = save_layer(ed, al, [blur(R, 0.6), G, B], rel)
        if e:
            e['stats'] = {'G': chan_stats(ed, G), 'B': chan_stats(ed, B)}
            if cat == 'legs':
                x0, y0, x1, y1 = SHORTS[body]
                band = mask_from([('rectangle', (x0 + 20, y0 + 20, x1 - 20, y0 + 120))]) > 0.5
                band &= (al > 0.8) & (skin < 0.5)
                if band.sum() > 50:
                    e['waist'] = [float(v) for v in ed[band].mean(0)]
    if e is None:
        print('EMPTY', body, fname)
        return
    e['shift'] = [dx, dy]
    print(body, key, 'shift', dx, dy, 'box', e['w'], e['h'], e.get('mask') is not None, flush=True)
    return key, body, e

import multiprocessing
from multiprocessing import Pool

# su macOS il default è "spawn", che rilancerebbe questo script (senza __main__) in ogni processo
multiprocessing.set_start_method('fork', force=True)

def work(job):
    return process(*job)

jobs = [(body, f) for body in ('F', 'M') for f in sorted(os.listdir(os.path.join(RAW, body)))
        if f != 'base.png' and f.endswith('.png') and f.startswith(os.environ.get('ONLY', ''))]
with Pool(4) as pool:
    for res in pool.imap_unordered(work, jobs):
        if res:
            key, body, e = res
            manifest['layers'].setdefault(key, {})[body] = e

# pezzi della testa generati solo sul corpo F: riusati su M con lo stesso riquadro
for key, per in manifest['layers'].items():
    cat = key.split('/')[0]
    if 'M' not in per and (cat in SHARED or key in SHARED):
        per['M'] = dict(per['F'])

# --- oggetti e ambienti -------------------------------------------------------
for f in ([] if os.environ.get('ONLY') else sorted(os.listdir(os.path.join(RAW, 'X')))):
    cat, name = f[:-4].split('__')
    im = Image.open(os.path.join(RAW, 'X', f))
    if cat == 'obj':
        if im.mode == 'RGBA' and np.asarray(im)[..., 3].min() < 250:
            rgba = np.asarray(im.convert('RGBA')).astype(np.float32)
        else:
            rgb = np.asarray(im.convert('RGB')).astype(np.float32)
            a = cutout_alpha_obj = None
            # sfondo bianco: flood fill dai bordi
            bg = np.array([rgb[:5].reshape(-1, 3).mean(0)])
            far = np.sqrt(((rgb - bg) ** 2).sum(-1)) > 14
            h, w = far.shape
            seen = np.zeros((h, w), bool)
            q = deque([(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)] +
                      [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)])
            while q:
                y, x = q.popleft()
                if 0 <= y < h and 0 <= x < w and not seen[y, x] and not far[y, x]:
                    seen[y, x] = True
                    q.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
            a = np.asarray(Image.fromarray(((~seen) * 255).astype('uint8')).filter(ImageFilter.MinFilter(3))
                           .filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32)
            rgba = np.dstack([rgb, a])
        ys, xs = np.where(rgba[..., 3] > 10)
        rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        o = Image.fromarray(rgba.astype('uint8'), 'RGBA')
        o.thumbnail((420, 420), Image.LANCZOS)
        path = os.path.join(OUT, 'obj', name + '.webp')
        os.makedirs(os.path.dirname(path), exist_ok=True)
        o.save(path, 'WEBP', quality=88, method=6)
        manifest['objects'][name] = dict(src=f'/avatar/obj/{name}.webp', w=o.width, h=o.height)
    else:
        im = im.convert('RGB')
        s = max(W / im.width, H / im.height)
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        l, t = (im.width - W) // 2, (im.height - H) // 2
        im = im.crop((l, t, l + W, t + H))
        path = os.path.join(OUT, 'env', name + '.webp')
        os.makedirs(os.path.dirname(path), exist_ok=True)
        im.save(path, 'WEBP', quality=82, method=6)
        manifest['envs'][name] = dict(src=f'/avatar/env/{name}.webp')

json.dump(manifest, open(MANIFEST, 'w'), indent=1)
print('layers', len(manifest['layers']), 'objects', len(manifest['objects']), 'envs', len(manifest['envs']))
