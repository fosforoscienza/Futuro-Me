import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

// Tour 360° esportati dall'editor: ogni cartella public/tour360/<slug>/ contiene
// tour.json e media/. Il formato è quello dell'export; qui ne teniamo solo i
// campi che il visore usa. Per aggiungere un tour basta copiare la cartella
// dell'export (senza player.js, player.css e index.html).

export type TourAngles = { yaw: number; pitch: number; roll: number };

export type TourHotspotStyle =
  | { kind: "arrow"; direction?: string; label?: string; size?: number }
  | { kind: "image"; src: string; width: number; alt?: string };

export type TourHotspotAction =
  | { type: "goto"; sceneId: string; keepDirection?: boolean }
  | { type: "info"; title?: string; text?: string };

export type TourHotspot = {
  id: string;
  yaw: number;
  pitch: number;
  rotation?: TourAngles;
  style: TourHotspotStyle;
  action: TourHotspotAction;
};

export type TourScene = {
  id: string;
  title: string;
  image: {
    src: string;
    mobile?: string;
    thumb?: string;
    width: number;
    height: number;
  };
  correction?: { pan: number; tilt: number; roll: number };
  initialView: { yaw: number; pitch: number; zoom: number };
  hotspots: TourHotspot[];
};

export type Tour = {
  slug: string;
  title: string;
  startSceneId: string;
  scenes: TourScene[];
};

const TOURS_DIR = path.join(process.cwd(), "public", "tour360");
const SLUG_RE = /^[a-z0-9-]+$/;

export async function listTourSlugs(): Promise<string[]> {
  try {
    const entries = await readdir(TOURS_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && SLUG_RE.test(e.name))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

export async function getTour(slug: string): Promise<Tour | null> {
  if (!SLUG_RE.test(slug)) return null;
  let raw: string;
  try {
    raw = await readFile(path.join(TOURS_DIR, slug, "tour.json"), "utf8");
  } catch {
    return null;
  }
  const data = JSON.parse(raw) as Tour & { protected?: boolean; mode?: string };
  // I tour protetti o in modalità gioco usano le API dell'editor: qui non sono supportati.
  if (data.protected || (data.mode && data.mode !== "tour")) return null;
  const base = `/tour360/${slug}/`;
  const asset = (src: string | undefined) =>
    src && !/^[a-z]+:|^\//i.test(src) ? base + src : src;

  return {
    slug,
    title: data.title,
    startSceneId: data.startSceneId,
    scenes: data.scenes.map((scene) => ({
      id: scene.id,
      title: scene.title,
      image: {
        ...scene.image,
        src: asset(scene.image.src)!,
        mobile: asset(scene.image.mobile),
        thumb: asset(scene.image.thumb),
      },
      correction: scene.correction,
      initialView: scene.initialView,
      hotspots: scene.hotspots.map((h) => ({
        id: h.id,
        yaw: h.yaw,
        pitch: h.pitch,
        rotation: h.rotation,
        style:
          h.style.kind === "image" ? { ...h.style, src: asset(h.style.src)! } : h.style,
        action: h.action,
      })),
    })),
  };
}
