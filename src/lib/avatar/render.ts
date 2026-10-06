/**
 * Disegna l'avatar su canvas sovrapponendo i pezzi di public/avatar.
 *
 * I colori di pelle, capelli/sopracciglia e iride si cambiano qui, pixel per
 * pixel, usando le maschere (R = pelle, G = capelli, B = iride): il nuovo
 * colore mantiene luci e ombre dell'originale.
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

type Stats = { L: number; q: number[] } | null;
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
  amount: number,
  soften = false
) {
  const r = d[i], g = d[i + 1], b = d[i + 2];
  const L = r * 0.299 + g * 0.587 + b * 0.114;
  if (L < 1) return;
  let k = L / ref.L;
  if (soften) {
    // Capelli e iridi: conta solo la luminosità (le sfumature del castano
    // originale non vanno portate nel nuovo colore) e, per i colori chiari,
    // meno contrasto per evitare chiazze bruciate.
    const lt = target[0] * 0.299 + target[1] * 0.587 + target[2] * 0.114;
    k = 1 + (k - 1) * (1 - 0.5 * (lt / 255));
    d[i] = r + (target[0] * k - r) * amount;
    d[i + 1] = g + (target[1] * k - g) * amount;
    d[i + 2] = b + (target[2] * k - b) * amount;
    return;
  }
  const nr = (target[0] * k * (r / L)) / ref.q[0];
  const ng = (target[1] * k * (g / L)) / ref.q[1];
  const nb = (target[2] * k * (b / L)) / ref.q[2];
  d[i] = r + (nr - r) * amount;
  d[i + 1] = g + (ng - g) * amount;
  d[i + 2] = b + (nb - b) * amount;
}

type Tints = { skin: RGB; hair: RGB; eyes: RGB; waist?: RGB };

/** Con i capelli tinti di colori di fantasia le sopracciglia restano naturali. */
const BROWS_FOR: Record<string, string> = {
  blu: "castano_scuri",
  viola: "castano_scuri",
  verde: "castano_scuri",
  rosa: "castano_scuri",
  biondo_platino: "biondo",
};

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
          if (m[i + 1] > 8 && hairRef) tintInto(d, i, hairRef, tints.hair, m[i + 1] / 255, true);
          if (m[i + 2] > 8 && eyeRef) tintInto(d, i, eyeRef, tints.eyes, m[i + 2] / 255, true);
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
  const keys = [
    pick("occhi", sel.occhi),
    pick("ciglia", sel.ciglia),
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
    pick("altro", sel.altro),
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
    hair: color(HAIR_COLORS, BROWS_FOR[sel.coloreCapelli] ?? sel.coloreCapelli),
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
  ctx.drawImage(av, AVATAR_X, AVATAR_Y, SCENE_W * AVATAR_SCALE, SCENE_H * AVATAR_SCALE);

  // Oggetti: il primo a destra dell'avatar, il secondo a sinistra
  objs.forEach((o, i) => {
    if (!o) return;
    const meta = M.objects[o.id];
    const place = OBJECT_PLACEMENT[o.id] ?? { slot: "floor", size: 200 };
    const h = place.size;
    const w = (meta.w / meta.h) * h;
    let cx = SCENE_W / 2 + 255;
    const bottom = place.slot === "floor" ? feetY + 8 : AVATAR_Y + 760 * AVATAR_SCALE + h / 2;
    if (i === 1) cx = SCENE_W - cx;
    ctx.drawImage(o.img, cx - w / 2, bottom - h, w, h);
  });
}
