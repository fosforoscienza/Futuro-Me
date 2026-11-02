"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CAST, type CastId } from "@/lib/avatar/cast";

/** Inquadratura comune dei file in public/avatar/cast (vedi cast.ts). */
export const CAST_RATIO = 606 / 1043;
/** Posizione dei piedi nell'inquadratura, per l'ombra a terra. */
const FEET_X = "30%";
const FEET_Y = "96.5%";

/**
 * Un avatar del cast senza sfondo, con un'ombra a terra morbida.
 * Gli avatar animati usano un loop video trasparente (HEVC per Safari, VP9
 * per gli altri) che va in pausa fuori schermo; con riduzione del movimento
 * resta l'immagine statica.
 */
export function CastAvatar({
  id,
  className = "",
  sizes = "(min-width: 1024px) 360px, 50vw",
  preload = false,
  still = false,
}: {
  id: CastId;
  className?: string;
  sizes?: string;
  /** Avatar nella prima schermata: carica subito l'immagine. */
  preload?: boolean;
  /** Forza l'immagine statica anche per gli avatar animati. */
  still?: boolean;
}) {
  const member = CAST[id];
  const video = useRef<HTMLVideoElement>(null);
  const [motion, setMotion] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!member.animated || still) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setMotion(!mq.matches);
      if (mq.matches) setPlaying(false);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [member.animated, still]);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => {});
      else el.pause();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [motion]);

  const src = `/avatar/cast/${id}`;

  return (
    <div
      aria-hidden="true"
      className={`relative pointer-events-none select-none ${className}`}
      style={{ aspectRatio: `${CAST_RATIO}` }}
    >
      <span
        className="absolute -translate-x-1/2 -translate-y-1/2 w-[58%] h-[5%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(78,52,24,0.32),rgba(78,52,24,0))]"
        style={{ left: FEET_X, top: FEET_Y }}
      />
      <Image
        src={`${src}.webp`}
        alt=""
        fill
        sizes={sizes}
        preload={preload}
        className={`object-contain ${playing ? "opacity-0" : ""}`}
      />
      {motion && (
        <video
          ref={video}
          className="absolute inset-0 w-full h-full object-contain"
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          poster={`${src}.webp`}
          onPlaying={() => setPlaying(true)}
        >
          <source src={`${src}.mov`} type='video/quicktime; codecs="hvc1"' />
          <source src={`${src}.webm`} type="video/webm" />
        </video>
      )}
    </div>
  );
}
