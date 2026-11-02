"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import type { CastId } from "@/lib/avatar/cast";

const REDUCE = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(REDUCE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * Un "futuro me" dell'hero: fa qualche passo verso chi guarda e chiude in una
 * posa, una volta sola, poi resta fermo sull'ultimo fotogramma. Parte `delay` ms
 * dopo essere entrato in vista. Con riduzione del movimento mostra subito la posa.
 *
 * File in public/avatar/hero: <id>.webp (primo fotogramma), <id>-posa.webp
 * (ultimo), <id>.mov (HEVC con alfa, Safari) e <id>.webm (VP9 con alfa).
 */
export function HeroWalker({
  id,
  ratio,
  delay = 0,
  preload = false,
  sizes,
}: {
  id: CastId;
  /** Larghezza / altezza dei file. */
  ratio: number;
  delay?: number;
  preload?: boolean;
  sizes: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  /** null al server: si decide al primo render nel browser. */
  const motion = useSyncExternalStore<boolean | null>(
    subscribe,
    () => !window.matchMedia(REDUCE).matches,
    () => null
  );
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      timer = window.setTimeout(() => el.play().catch(() => {}), delay);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [motion, delay]);

  const src = `/avatar/hero/${id}`;

  return (
    <div className="relative h-full" style={{ aspectRatio: `${ratio}` }}>
      <Image
        src={motion === false ? `${src}-posa.webp` : `${src}.webp`}
        alt=""
        fill
        sizes={sizes}
        preload={preload}
        className={`object-contain ${motion && playing ? "opacity-0" : ""}`}
      />
      {motion && (
        <video
          ref={video}
          className="absolute inset-0 h-full w-full object-contain"
          muted
          playsInline
          preload="auto"
          onPlaying={() => setPlaying(true)}
        >
          <source src={`${src}.mov`} type='video/quicktime; codecs="hvc1"' />
          <source src={`${src}.webm`} type="video/webm" />
        </video>
      )}
    </div>
  );
}
