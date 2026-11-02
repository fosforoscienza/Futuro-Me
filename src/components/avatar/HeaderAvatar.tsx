"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CastAvatar } from "./CastAvatar";
import type { CastId } from "@/lib/avatar/cast";

/**
 * Avatar del cast accanto al titolo di una pagina: sotto il testo su mobile,
 * appoggiato in basso a destra dell'intestazione da lg in su (l'intestazione
 * deve essere `relative`). Con `hopKey` fa un piccolo salto ogni volta che
 * il valore cambia, per accompagnare i passaggi di un percorso.
 */
export function HeaderAvatar({ id, hopKey }: { id: CastId; hopKey?: number | string }) {
  const hop = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (hopKey === undefined) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          hop.current,
          { y: 0 },
          { y: -18, duration: 0.22, ease: "power2.out", yoyo: true, repeat: 1 }
        );
      });
      return () => mm.revert();
    },
    { dependencies: [hopKey] }
  );

  return (
    <div className="mt-8 flex justify-end lg:mt-0 lg:absolute lg:right-6 lg:bottom-0">
      <div data-hero-figure>
        <div ref={hop}>
          <CastAvatar
            id={id}
            preload
            sizes="(min-width: 1024px) 240px, 40vw"
            className="h-56 sm:h-64 lg:h-[380px]"
          />
        </div>
      </div>
    </div>
  );
}
