"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CAST, type CastId } from "@/lib/avatar/cast";

/** Inquadratura comune dei file in public/avatar/cast (vedi cast.ts). */
export const CAST_RATIO = 606 / 1043;

/**
 * Un avatar del cast senza sfondo, in piedi su un'ombra a terra morbida.
 * L'immagine statica c'è sempre; per gli avatar animati il loop (<id>.anim.webp,
 * WebP animato con trasparenza) si scarica solo la prima volta che l'avatar
 * entra in vista e non parte con la riduzione del movimento. È un'immagine, non
 * un video: Safari e iOS bloccavano o coprivano i video con alfa.
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
  const root = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(false);
  const [shown, setShown] = useState(false);
  const src = `/avatar/cast/${id}`;

  useEffect(() => {
    const el = root.current;
    if (!el || !animated || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setStart(true);
      },
      { rootMargin: "120px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animated]);

  return (
    <div
      ref={root}
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
          className={`object-contain ${shown ? "opacity-0" : ""}`}
        />
        {start && (
          <Image
            src={`${src}.anim.webp`}
            alt=""
            fill
            unoptimized
            onLoad={() => setShown(true)}
            className={`object-contain ${shown ? "" : "opacity-0"}`}
          />
        )}
      </div>
    </div>
  );
}
