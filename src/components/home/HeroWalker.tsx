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
 * L'animazione è un WebP animato con trasparenza (riprodotto una volta), non un
 * video: Safari e iOS bloccavano o coprivano i video con alfa (pulsante play,
 * sfondo bianco), mentre un'immagine animata si comporta uguale ovunque.
 *
 * File in public/avatar/hero: <id>.webp (primo fotogramma), <id>-posa.webp
 * (ultimo) e <id>.anim.webp (camminata).
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
  const root = useRef<HTMLDivElement>(null);
  /** null al server: si decide al primo render nel browser. */
  const motion = useSyncExternalStore<boolean | null>(
    subscribe,
    () => !window.matchMedia(REDUCE).matches,
    () => null
  );
  const [start, setStart] = useState(false);
  const [shown, setShown] = useState(false);
  const src = `/avatar/hero/${id}`;

  useEffect(() => {
    const el = root.current;
    if (!el || !motion) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      timer = window.setTimeout(() => setStart(true), delay);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [motion, delay]);

  return (
    <div ref={root} className="relative h-full" style={{ aspectRatio: `${ratio}` }}>
      <Image
        src={motion === false ? `${src}-posa.webp` : `${src}.webp`}
        alt=""
        fill
        sizes={sizes}
        preload={preload}
        className={`object-contain ${shown ? "opacity-0" : ""}`}
      />
      {motion && start && (
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
  );
}
