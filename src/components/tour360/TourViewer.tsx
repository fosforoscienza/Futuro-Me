"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Viewer } from "@photo-sphere-viewer/core";
import type { MarkerConfig, MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import type { Tour, TourAngles, TourHotspot, TourScene } from "@/lib/tour360";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import "./tour360.css";

const deg = (n: number) => `${n}deg`;

// Stessa rotazione predefinita dell'editor per le frecce senza rotazione salvata.
const ARROW_ROLL: Record<string, number> = {
  avanti: 0,
  destra: 90,
  indietro: 180,
  sinistra: 270,
  su: 0,
  giu: 180,
};

function hotspotRotation(h: TourHotspot): TourAngles {
  if (h.rotation) return h.rotation;
  if (h.style.kind === "arrow") {
    const dir = h.style.direction ?? "avanti";
    return {
      yaw: 0,
      pitch: dir === "su" || dir === "giu" ? 0 : -60,
      roll: ARROW_ROLL[dir] ?? 0,
    };
  }
  return { yaw: 0, pitch: 0, roll: 0 };
}

const ARROW_SVG =
  '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6 42 30H31v12H17V30H6z"/></svg>';

function hotspotElement(h: TourHotspot, goLabel: string): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "tour360-3d";
  if (h.style.kind === "arrow") {
    const size = h.style.size ?? 56;
    const hs = document.createElement("div");
    hs.className = "tour360-hs tour360-hs--arrow";
    hs.title = h.style.label ? `${goLabel}: ${h.style.label}` : goLabel;
    const arrow = document.createElement("span");
    arrow.className = "tour360-hs__arrow";
    arrow.style.setProperty("--s", `${size}px`);
    arrow.innerHTML = ARROW_SVG;
    hs.appendChild(arrow);
    wrap.appendChild(hs);
  } else {
    const hs = document.createElement("div");
    hs.className = "tour360-hs tour360-hs--image";
    const img = document.createElement("img");
    img.src = h.style.src;
    img.alt = h.style.alt ?? "";
    img.width = h.style.width;
    img.draggable = false;
    hs.appendChild(img);
    wrap.appendChild(hs);
  }
  return wrap;
}

type MarkersCtx = { viewer?: Viewer; markers?: MarkersPlugin };

// L'etichetta è un marker 2D a parte: a ogni render la spostiamo sotto l'ingombro
// proiettato della freccia 3D, come fa l'editor.
const LABEL_GAP = 6;
function followArrow(wrap: HTMLElement, tag: HTMLElement, h: TourHotspot, ctx: MarkersCtx) {
  let scale = 0;
  (wrap as HTMLElement & { updateMarker?: () => void }).updateMarker = () => {
    const { viewer, markers } = ctx;
    if (!viewer || !markers) return;
    let arrow;
    try {
      arrow = markers.getMarker(h.id);
    } catch {
      return;
    }
    const object = arrow.threeElement;
    const hs = arrow.domElement.firstElementChild as HTMLElement | null;
    const box = hs?.firstElementChild as HTMLElement | null;
    if (!object || !hs || !box) return;
    if (!scale) {
      const m = /matrix\(([^,]+)/.exec(getComputedStyle(hs).transform);
      const k = m ? Number(m[1]) : NaN;
      scale = Number.isFinite(k) && k > 0 ? k : 1;
    }
    const hw = (box.offsetWidth * scale) / 2;
    const hh = (box.offsetHeight * scale) / 2;
    if (!hw || !hh) return;
    object.updateMatrixWorld(true);
    const dh = viewer.dataHelper;
    const anchor3d = dh.sphericalCoordsToVector3({
      yaw: (h.yaw * Math.PI) / 180,
      pitch: (h.pitch * Math.PI) / 180,
    });
    const anchor = dh.vector3ToViewerCoords(anchor3d);
    let minX = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of [
      [-hw, -hh],
      [hw, -hh],
      [hw, hh],
      [-hw, hh],
    ]) {
      const p = dh.vector3ToViewerCoords(anchor3d.clone().set(x, y, 0).applyMatrix4(object.matrixWorld));
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const dx = (minX + maxX) / 2 - anchor.x;
    const dy = maxY - anchor.y + LABEL_GAP;
    tag.style.translate = `${Math.round(dx)}px ${Math.round(dy)}px`;
  };
}

function sceneMarkers(scene: TourScene, goLabel: string, ctx: MarkersCtx): MarkerConfig[] {
  return scene.hotspots.flatMap((h) => {
    const r = hotspotRotation(h);
    const position = { yaw: deg(h.yaw), pitch: deg(h.pitch) };
    const markers: MarkerConfig[] = [
      {
        id: h.id,
        elementLayer: hotspotElement(h, goLabel),
        position,
        rotation: { yaw: deg(r.yaw), pitch: deg(r.pitch), roll: deg(r.roll) },
        data: { hotspotId: h.id },
      },
    ];
    if (h.style.kind === "arrow" && h.style.label?.trim()) {
      const wrap = document.createElement("div");
      wrap.className = "tour360-tag-wrap";
      const tag = document.createElement("span");
      tag.className = "tour360-tag";
      tag.textContent = h.style.label.trim();
      wrap.appendChild(tag);
      followArrow(wrap, tag, h, ctx);
      markers.push({
        id: `${h.id}__label`,
        element: wrap,
        position,
        anchor: "top center",
        data: { hotspotId: h.id },
      });
    }
    return markers;
  });
}

function maxTextureSize(): number {
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    return gl ? (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number) : 4096;
  } catch {
    return 4096;
  }
}

function pickImage(scene: TourScene): string {
  if (!scene.image.mobile) return scene.image.src;
  const small = window.matchMedia("(max-width: 1023px)").matches;
  return small || maxTextureSize() < scene.image.width ? scene.image.mobile : scene.image.src;
}

function viewOptions(scene: TourScene) {
  const c = scene.correction ?? { pan: 0, tilt: 0, roll: 0 };
  return {
    position: { yaw: deg(scene.initialView.yaw), pitch: deg(scene.initialView.pitch) },
    zoom: scene.initialView.zoom,
    sphereCorrection: { pan: deg(c.pan), tilt: deg(c.tilt), roll: deg(c.roll) },
    caption: scene.title,
  };
}

export function TourViewer({ tour }: { tour: Tour }) {
  const t = useTranslations("tour360");
  const containerRef = useRef<HTMLDivElement>(null);
  const goToRef = useRef<(sceneId: string) => void>(() => {});
  const [sceneId, setSceneId] = useState(tour.startSceneId);
  const [error, setError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let viewer: Viewer | undefined;
    let cancelled = false;
    const scenes = new Map(tour.scenes.map((s) => [s.id, s]));
    const start = scenes.get(tour.startSceneId) ?? tour.scenes[0];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const goLabel = t("goTo");
    const ctx: MarkersCtx = {};

    (async () => {
      const [{ Viewer }, { MarkersPlugin }] = await Promise.all([
        import("@photo-sphere-viewer/core"),
        import("@photo-sphere-viewer/markers-plugin"),
      ]);
      if (cancelled) return;

      const v = new Viewer({
        container,
        panorama: pickImage(start),
        defaultYaw: deg(start.initialView.yaw),
        defaultPitch: deg(start.initialView.pitch),
        defaultZoomLvl: start.initialView.zoom,
        sphereCorrection: viewOptions(start).sphereCorrection,
        caption: start.title,
        navbar: ["zoom", "move", "caption", "fullscreen"],
        mousewheelCtrlKey: true,
        touchmoveTwoFingers: false,
        lang: {
          zoom: t("psv.zoom"),
          zoomOut: t("psv.zoomOut"),
          zoomIn: t("psv.zoomIn"),
          moveUp: t("psv.moveUp"),
          moveDown: t("psv.moveDown"),
          moveLeft: t("psv.moveLeft"),
          moveRight: t("psv.moveRight"),
          description: t("psv.description"),
          download: t("psv.download"),
          fullscreen: t("psv.fullscreen"),
          loading: t("psv.loading"),
          loadError: t("psv.loadError"),
          webglError: t("psv.webglError"),
          ctrlZoom: t("psv.ctrlZoom"),
          twoFingers: t("psv.twoFingers"),
          menu: t("psv.menu"),
          close: t("psv.close"),
        },
        plugins: [[MarkersPlugin, { markers: sceneMarkers(start, goLabel, ctx) }]],
      });
      viewer = v;
      const markers = v.getPlugin<MarkersPlugin>(MarkersPlugin);
      ctx.viewer = v;
      ctx.markers = markers;
      let current = start.id;
      let busy = false;

      const goTo = async (targetId: string) => {
        const target = scenes.get(targetId);
        if (!target || targetId === current || busy) return;
        busy = true;
        current = targetId;
        setSceneId(targetId);
        markers.clearMarkers();
        try {
          const done = await v.setPanorama(pickImage(target), {
            ...viewOptions(target),
            transition: reduceMotion ? false : { effect: "fade", rotation: false, speed: 900 },
          });
          if (done && current === targetId) markers.setMarkers(sceneMarkers(target, goLabel, ctx));
        } catch {
          setError(true);
        } finally {
          busy = false;
        }
      };
      goToRef.current = goTo;

      markers.addEventListener("select-marker", ({ marker }) => {
        const id = (marker.data as { hotspotId?: string } | undefined)?.hotspotId;
        const hotspot = scenes.get(current)?.hotspots.find((h) => h.id === id);
        if (hotspot?.action.type === "goto") void goTo(hotspot.action.sceneId);
      });
    })().catch(() => setError(true));

    return () => {
      cancelled = true;
      goToRef.current = () => {};
      viewer?.destroy();
    };
  }, [tour, t]);

  return (
    <div>
      <div
        ref={containerRef}
        className="tour360-viewer w-full h-[62dvh] min-h-[360px] md:h-[min(78dvh,760px)] md:min-h-[420px] rounded-3xl overflow-hidden bg-inverse-surface"
        role="application"
        aria-label={t("viewerLabel", { title: tour.title })}
      />
      {error && (
        <p role="alert" className="mt-4 text-error">
          {t("error")}
        </p>
      )}

      <nav aria-label={t("scenesLabel")} className="mt-6">
        <ul className="flex gap-3 overflow-x-auto pb-2">
          {tour.scenes.map((scene) => {
            const active = scene.id === sceneId;
            return (
              <li key={scene.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => goToRef.current(scene.id)}
                  aria-current={active ? "true" : undefined}
                  className={`group block w-44 text-left rounded-2xl overflow-hidden border-2 transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                    active
                      ? "border-primary bg-primary-fixed"
                      : "border-transparent bg-surface-container hover:bg-surface-container-high"
                  }`}
                >
                  {scene.image.thumb && (
                    // eslint-disable-next-line @next/next/no-img-element -- miniatura statica già ottimizzata dall'export
                    <img
                      src={scene.image.thumb}
                      alt=""
                      width={176}
                      height={88}
                      loading="lazy"
                      className="w-full aspect-[2/1] object-cover"
                    />
                  )}
                  <span
                    className={`block px-3 py-2 text-sm font-bold ${
                      active ? "text-on-primary-fixed" : "text-on-surface"
                    }`}
                  >
                    {scene.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
