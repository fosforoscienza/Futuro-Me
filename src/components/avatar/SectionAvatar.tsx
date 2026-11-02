"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CastAvatar } from "./CastAvatar";
import type { CastId } from "@/lib/avatar/cast";

gsap.registerPlugin(ScrollTrigger);

/**
 * Avatar del cast dentro una sezione più in basso nella pagina: entra salendo
 * quando la sezione arriva in vista. Posizione e dimensioni dal `className`.
 */
export function SectionAvatar({ id, className = "" }: { id: CastId; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(root.current, {
          y: 60,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 85%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root} className={className}>
      <CastAvatar id={id} sizes="(min-width: 768px) 200px, 30vw" className="h-full" />
    </div>
  );
}
