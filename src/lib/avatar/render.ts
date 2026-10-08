/**
 * Disegna l'avatar su canvas sovrapponendo i pezzi di public/avatar.
 *
 * I colori di pelle, capelli/sopracciglia e iride si cambiano qui, pixel per
 * pixel, usando le maschere (R = pelle, G = capelli, B = iride): il nuovo
 * colore mantiene luci e ombre dell'originale. Le maschere e le statistiche
 * vengono da scripts/avatar/build_assets.py + fix_masks.py.
 */
import assets from "./assets.json";
import {
  EYE_COLORS,
  HAIR_COLORS,
  OBJECT_PLACEMENT,
  SKIN,
  findChoice,
  type AvatarSelection,
  type Body,
  type RGB,
} from "./config";

/** Luminosità OKLab (media e deviazione) dei pixel di capelli o iride di un pezzo. */
type Stats = { mu: number; sd: number } | null;
type LayerAsset = {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  mask?: string;
  blend?: "multiply";
  stats?: { G: Stats; B: Stats };
  waist?: number[];
};
type BodyAsset = LayerAsset & {
  skin: { L: number; q: number[] };
  shorts: { src: string; L: number };
};
type Manifest = {
  size: [number, number];
  bodies: Record<Body, BodyAsset>;
  layers: Record<string, Partial<Record<Body, LayerAsset>>>;
  objects: Record<string, { src: string; w: number; h: number }>;
  envs: Record<string, { src: string }>;
};

const M = assets as unknown as Manifest;
export const SCENE_W = M.size[0];
export const SCENE_H = M.size[1];

/** Scala e posizione dell'avatar nella scena, per lasciare spazio a sfondo e oggetti. */
const AVATAR_SCALE = 0.84;
const AVATAR_X = (SCENE_W - SCENE_W * AVATAR_SCALE) / 2;
const AVATAR_Y = SCENE_H - SCENE_H * AVATAR_SCALE - 24;

/** Inquadrature dell'anteprima: figura intera o primo piano sulla parte che si sta modificando. */
export type Focus = "full" | "face" | "torso" | "legs";

function focusBox(focus: Focus): [number, number, number, number] {
  if (focus === "full") return [0, 0, SCENE_W, SCENE_H];
  // centro e larghezza in coordinate del corpo base (848 x 1264), poi nella scena
  const [cy, w] = focus === "face" ? [235, 380] : focus === "torso" ? [500, 600] : [930, 600];
  const sw = w * AVATAR_SCALE;
  const sh = (sw * SCENE_H) / SCENE_W;
  const sx = SCENE_W / 2 - sw / 2;
  const sy = Math.min(Math.max(AVATAR_Y + cy * AVATAR_SCALE - sh / 2, 0), SCENE_H - sh);
  return [sx, sy, sw, sh];
}

/** Copia la scena già disegnata su `dst`, con l'inquadratura richiesta. */
export function drawFocus(dst: HTMLCanvasElement, scene: HTMLCanvasElement, focus: Focus) {
  dst.width = SCENE_W;
  dst.height = SCENE_H;
  const [x, y, w, h] = focusBox(focus);
  const ctx = dst.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(scene, x, y, w, h, 0, 0, SCENE_W, SCENE_H);
}

const images = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string) {
  let p = images.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    images.set(src, p);
  }
  return p;
}

function pixels(img: CanvasImageSource, w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas: c, ctx, data: ctx.getImageData(0, 0, w, h) };
}

/** Nuovo colore che conserva le sfumature del pixel rispetto al colore medio di riferimento. */
function tintInto(
  d: Uint8ClampedArray,
  i: number,
  ref: { L: number; q: number[] },
  target: RGB,
  amount: number
) {
  const r = d[i], g = d[i + 1], b = d[i + 2];
  const L = r * 0.299 + g * 0.587 + b * 0.114;
  if (L < 1) return;
  const k = L / ref.L;
  const nr = (target[0] * k * (r / L)) / ref.q[0];
  const ng = (target[1] * k * (g / L)) / ref.q[1];
  const nb = (target[2] * k * (b / L)) / ref.q[2];
  d[i] = r + (nr - r) * amount;
  d[i + 1] = g + (ng - g) * amount;
  d[i + 2] = b + (nb - b) * amount;
}

type Tints = { skin: RGB; hair: RGB; eyes: RGB; waist?: RGB };

// --- OKLab: spazio colore percettivo, per cambiare tinta senza perdere luci e ombre ---
const toLin = (c: number) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const toSrgb = (c: number) => {
  c = Math.min(Math.max(c, 0), 1);
  return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
};
function oklab(r: number, g: number, b: number): [number, number, number] {
  const lr = toLin(r), lg = toLin(g), lb = toLin(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function fromOklab(L: number, a: number, b: number): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

/**
 * Capelli e iridi: il pixel prende tinta e saturazione del colore scelto, mentre la
 * luminosità sposta la media dell'originale su quella del colore scelto mantenendo
 * le differenze (ciocche, riflessi, anello scuro dell'iride). Lavorare in OKLab
 * evita le chiazze bruciate o piatte del vecchio metodo a rapporti RGB.
 */
function recolorInto(
  d: Uint8ClampedArray,
  i: number,
  ref: { mu: number; sd: number },
  target: RGB,
  amount: number,
  kind: "hair" | "eye"
) {
  const [Ls, as, bs] = oklab(d[i], d[i + 1], d[i + 2]);
  const [Lt, at, bt] = oklab(target[0], target[1], target[2]);
  const Ct = Math.hypot(at, bt);
  const z = (Ls - ref.mu) / ref.sd;
  let L: number, C: number;
  if (kind === "hair") {
    // i colori chiari mostrano più luci e ombre; luci e ombre estreme compresse dolcemente
    L = Lt + z * ref.sd * (1 + 0.35 * smooth(0.45, 0.85, Lt));
    if (L > 0.9) L = 0.9 + (L - 0.9) * 0.35;
    if (L < 0.08) L = 0.08 - (0.08 - L) * 0.3;
    C = Ct * Math.min(Math.max(1 - 0.9 * smooth(Lt, Lt + 0.3, L), 0.15), 1) *
      Math.min(Math.max(0.55 + (0.45 * L) / Math.max(Lt, 0.05), 0.3), 1.1);
  } else {
    // iride: riflessi contenuti, anello scuro più marcato
    L = Math.min(Lt + (z > 0 ? z * 0.6 : z * 1.15) * ref.sd, 0.93);
    C = 0.85 * Ct * Math.min(Math.max(0.6 + (0.4 * L) / Math.max(Lt, 0.05), 0.35), 1.15);
    // il riflesso bianco della luce resta bianco
    amount *= 1 - smooth(0.8, 0.92, Ls) * (Math.hypot(as, bs) < 0.04 ? 1 : 0);
  }
  const h = Math.atan2(bt, at);
  const [nr, ng, nb] = fromOklab(L, C * Math.cos(h), C * Math.sin(h));
  d[i] += (nr - d[i]) * amount;
  d[i + 1] += (ng - d[i + 1]) * amount;
  d[i + 2] += (nb - d[i + 2]) * amount;
}

/** Con i capelli tinti di colori di fantasia le sopracciglia restano naturali. */
const BROWS_FOR: Record<string, string> = {
  blu: "castano_scuri",
  viola: "castano_scuri",
  verde: "castano_scuri",
  rosa: "castano_scuri",
  biondo_platino: "biondo",
};

/** Le sopracciglia sono un po' più scure dei capelli quando questi sono chiari. */
function browColor(c: RGB): RGB {
  const [L, a, b] = oklab(c[0], c[1], c[2]);
  const f = 1 - 0.18 * smooth(0.45, 0.8, L);
  const cf = 0.9 + 0.1 * f;
  return fromOklab(L * f, a * cf, b * cf);
}

const tinted = new Map<string, Promise<HTMLCanvasElement | HTMLImageElement>>();

async function prepareLayer(
  layer: LayerAsset,
  skinRef: { L: number; q: number[] },
  tints: Tints,
  shorts?: { src: string; L: number }
) {
  const key = [layer.src, tints.skin, tints.hair, tints.eyes, shorts ? tints.waist : ""].join("|");
  let p = tinted.get(key);
  if (!p) {
    p = (async () => {
      const img = await loadImage(layer.src);
      if (!layer.mask && !shorts) return img;
      const out = pixels(img, layer.w, layer.h);
      const d = out.data.data;
      if (layer.mask) {
        const m = pixels(await loadImage(layer.mask), layer.w, layer.h).data.data;
        const hairRef = layer.stats?.G;
        const eyeRef = layer.stats?.B;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] === 0) continue;
          if (m[i] > 8) tintInto(d, i, skinRef, tints.skin, m[i] / 255);
          if (m[i + 1] > 8 && hairRef) recolorInto(d, i, hairRef, tints.hair, m[i + 1] / 255, "hair");
          if (m[i + 2] > 8 && eyeRef) recolorInto(d, i, eyeRef, tints.eyes, m[i + 2] / 255, "eye");
        }
      }
      if (shorts && tints.waist) {
        const s = pixels(await loadImage(shorts.src), layer.w, layer.h).data.data;
        const ref = { L: shorts.L, q: [1, 1, 1] };
        for (let i = 0; i < d.length; i += 4) {
          if (s[i] > 8) tintInto(d, i, ref, tints.waist, s[i] / 255);
        }
      }
      out.ctx.putImageData(out.data, 0, 0);
      return out.canvas;
    })();
    tinted.set(key, p);
  }
  return p;
}

function color(list: { id: string; color?: RGB }[], id: string): RGB {
  return (list.find((c) => c.id === id) ?? list[0]).color!;
}

/** Elenco ordinato (dal fondo al primo piano) dei pezzi da disegnare. */
function layerKeys(sel: AvatarSelection): string[] {
  const pick = (group: keyof AvatarSelection, id: string) => findChoice(group, id)?.layer;
  const hijab = sel.cappello === "hijab";
  const jewels = sel.gioielli.map((id) => pick("gioielli", id));
  const extras = sel.altro.map((id) => pick("altro", id));
  // forma d'occhio + ciglia: c'è un pezzo generato apposta (eyes/<forma>__<ciglia>);
  // le ciglia da sole sono disegnate sugli occhi del corpo base
  const eyes = pick("occhi", sel.occhi);
  const lashes = pick("ciglia", sel.ciglia);
  const combo = eyes && lashes ? `${eyes}__${lashes.split("/")[1]}` : undefined;
  const eyeKeys = combo && M.layers[combo] ? [combo] : [lashes, eyes];
  const keys = [
    // la vitiligine è uno strato della pelle: subito sopra il corpo base
    ...extras.filter((k) => k?.startsWith("skin/")),
    ...eyeKeys,
    pick("naso", sel.naso),
    pick("bocca", sel.bocca),
    pick("sopracciglia", sel.sopracciglia),
    pick("trucco", sel.trucco),
    sel.braccia.includes("tatuaggi") ? "arms/tatuaggi" : undefined,
    pick("gambe", sel.gambe),
    pick("scarpe", sel.scarpe),
    pick("torso", sel.torso),
    ...sel.braccia.filter((b) => b !== "tatuaggi").map((b) => `arms/${b}`),
    ...jewels.filter((k) => k?.startsWith("neck/")),
    pick("ausilio", sel.ausilio),
    hijab ? undefined : pick("capelli", sel.capelli),
    ...jewels.filter((k) => k && !k.startsWith("neck/") && !(hijab && /cerchio|pendenti/.test(k))),
    hijab ? undefined : pick("impianto", sel.impianto),
    pick("occhiali", sel.occhiali),
    pick("cappello", sel.cappello),
    ...extras.filter((k) => k && !k.startsWith("skin/")),
  ];
  return keys.filter((k): k is string => Boolean(k));
}

/** Rende la scena completa su `canvas` (dimensioni SCENE_W x SCENE_H). */
export async function renderAvatar(canvas: HTMLCanvasElement, sel: AvatarSelection) {
  const body: Body = sel.corpo === "M" ? "M" : "F";
  const base = M.bodies[body];
  const legs = findChoice("gambe", sel.gambe)?.layer;
  const waist = legs ? M.layers[legs]?.[body]?.waist : undefined;
  const tints: Tints = {
    skin: color(SKIN, sel.pelle),
    hair: color(HAIR_COLORS, sel.coloreCapelli),
    eyes: color(EYE_COLORS, sel.coloreOcchi),
    waist: waist ? (waist.map((v) => Math.round(v)) as RGB) : undefined,
  };

  const browTints: Tints = {
    ...tints,
    hair: browColor(color(HAIR_COLORS, BROWS_FOR[sel.coloreCapelli] ?? sel.coloreCapelli)),
  };
  const keys = layerKeys(sel);
  const [env, baseImg, parts, objs] = await Promise.all([
    sel.ambiente !== "nessuno" && M.envs[sel.ambiente] ? loadImage(M.envs[sel.ambiente].src) : null,
    prepareLayer(base, base.skin, browTints, waist ? base.shorts : undefined),
    Promise.all(
      keys.map(async (k) => {
        const layer = M.layers[k]?.[body];
        const t = k.startsWith("brows/") ? browTints : tints;
        return layer ? { layer, img: await prepareLayer(layer, base.skin, t) } : null;
      })
    ),
    Promise.all(
      sel.oggetti.map(async (id) => (M.objects[id] ? { id, img: await loadImage(M.objects[id].src) } : null))
    ),
  ]);

  const ctx = canvas.getContext("2d")!;
  canvas.width = SCENE_W;
  canvas.height = SCENE_H;

  if (env) {
    ctx.drawImage(env, 0, 0, SCENE_W, SCENE_H);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, SCENE_H);
    g.addColorStop(0, "#fff9eb");
    g.addColorStop(1, "#efe8d5");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SCENE_W, SCENE_H);
  }

  // Ombra a terra
  const feetY = AVATAR_Y + 1215 * AVATAR_SCALE;
  ctx.save();
  ctx.fillStyle = "rgba(30, 28, 16, 0.18)";
  ctx.filter = "blur(10px)";
  ctx.beginPath();
  ctx.ellipse(SCENE_W / 2, feetY, 150, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Avatar: composto a piena risoluzione e poi scalato nella scena
  const av = document.createElement("canvas");
  av.width = SCENE_W;
  av.height = SCENE_H;
  const actx = av.getContext("2d")!;
  actx.drawImage(baseImg, base.x, base.y);
  for (const part of parts) {
    if (!part) continue;
    const { layer, img } = part;
    if (layer.blend === "multiply") {
      // moltiplica solo dentro la sagoma del pezzo, mantenendo la trasparenza
      const tmp = document.createElement("canvas");
      tmp.width = layer.w;
      tmp.height = layer.h;
      const t = tmp.getContext("2d")!;
      t.drawImage(av, layer.x, layer.y, layer.w, layer.h, 0, 0, layer.w, layer.h);
      t.globalCompositeOperation = "multiply";
      t.drawImage(img, 0, 0);
      t.globalCompositeOperation = "destination-in";
      t.drawImage(img, 0, 0);
      actx.drawImage(tmp, layer.x, layer.y);
    } else {
      actx.drawImage(img, layer.x, layer.y);
    }
  }
  // Oggetti: veicoli dietro l'avatar; gli altri il primo a destra, il secondo a sinistra
  const placed = objs.map((o, i) => {
    if (!o) return null;
    const meta = M.objects[o.id];
    const place = OBJECT_PLACEMENT[o.id] ?? { slot: "floor" as const, size: 200 };
    const scale = place.size / Math.max(meta.w, meta.h);
    const w = meta.w * scale;
    const h = meta.h * scale;
    let cx = SCENE_W / 2 + 255;
    if (i === 1) cx = SCENE_W - cx;
    let bottom = feetY + 8;
    if (place.slot === "hand") bottom = AVATAR_Y + 760 * AVATAR_SCALE + h / 2;
    if (place.slot === "behind") {
      cx = SCENE_W / 2 + (i === 1 ? -60 : 60);
      bottom = feetY - 30;
    }
    return { img: o.img, slot: place.slot, x: cx - w / 2, y: bottom - h, w, h };
  });
  for (const o of placed) if (o?.slot === "behind") ctx.drawImage(o.img, o.x, o.y, o.w, o.h);
  ctx.drawImage(av, AVATAR_X, AVATAR_Y, SCENE_W * AVATAR_SCALE, SCENE_H * AVATAR_SCALE);
  for (const o of placed) if (o && o.slot !== "behind") ctx.drawImage(o.img, o.x, o.y, o.w, o.h);
}
