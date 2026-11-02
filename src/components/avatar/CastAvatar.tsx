"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CAST, type CastId } from "@/lib/avatar/cast";

/** Inquadratura comune dei file in public/avatar/cast (vedi cast.ts). */
export const CAST_RATIO = 606 / 1043;

/** Safari e tutti i browser iOS leggono l'alfa solo dall'HEVC (.mov), gli altri dal VP9 (.webm). */
function wantsHevc() {
  const ua = navigator.userAgent;
  return /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|Android/.test(ua);
}

/**
 * Un avatar del cast senza sfondo, in piedi su un'ombra a terra morbida.
 * L'immagine statica c'è sempre; per gli avatar animati il loop video si
 * scarica solo la prima volta che l'avatar entra in vista, va in pausa fuori
 * schermo e non parte con la riduzione del movimento.
 * I piedi stanno a circa il 30% della larghezza; `flip` specchia l'avatar.
 */
export function CastAvatar({
  id,
  className = "",
  sizes = "(min-width: 1024px) 360px, 50vw",
  preload = false,
  still = false,
  flip = false,
}: {
  id: CastId;
  className?: string;
  sizes?: string;
  /** Avatar nella prima schermata: carica subito l'immagine. */
  preload?: boolean;
  /** Forza l'immagine statica anche per gli avatar animati. */
  still?: boolean;
  /** Specchia l'avatar (l'ombra segue i piedi). */
  flip?: boolean;
}) {
  const animated = CAST[id].animated && !still;
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const src = `/avatar/cast/${id}`;

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;

    const sync = () => {
      if (!visible || reduce.matches) {
        el.pause();
        if (reduce.matches) setPlaying(false);
        return;
      }
      if (!el.getAttribute("src")) el.src = `${src}.${wantsHevc() ? "mov" : "webm"}`;
      el.play().catch(() => {});
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { rootMargin: "120px 0px" }
    );
    io.observe(el);
    reduce.addEventListener("change", sync);
    return () => {
      io.disconnect();
      reduce.removeEventListener("change", sync);
    };
  }, [src]);

  return (
    <div
      aria-hidden="true"
      className={`relative pointer-events-none select-none ${className}`}
      style={{ aspectRatio: `${CAST_RATIO}` }}
    >
      <span
        className="absolute top-[96.5%] h-[6%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(150_46_22/0.3),rgb(150_46_22/0.12)_55%,transparent)]"
        style={{ left: flip ? "70%" : "30%" }}
      />
      <div className={`absolute inset-0 ${flip ? "-scale-x-100" : ""}`}>
        <Image
          src={`${src}.webp`}
          alt=""
          fill
          sizes={sizes}
          preload={preload}
          className={`object-contain ${playing ? "opacity-0" : ""}`}
        />
        {animated && (
          <video
            ref={video}
            className="absolute inset-0 h-full w-full object-contain"
            muted
            loop
            playsInline
            preload="none"
            onPlaying={() => setPlaying(true)}
          />
        )}
      </div>
    </div>
  );
}
