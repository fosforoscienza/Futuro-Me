"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { LoaderCircle } from "lucide-react";
import type { AvatarSelection } from "@/lib/avatar/config";
import {
  SCENE_H,
  SCENE_W,
  drawFocus,
  renderAvatar,
  type Focus,
} from "@/lib/avatar/render";

export function AvatarCanvas({
  selection,
  canvasRef,
  focus = "full",
  className = "",
  children,
}: {
  selection: AvatarSelection;
  canvasRef?: RefObject<HTMLCanvasElement | null>;
  focus?: Focus;
  className?: string;
  children?: React.ReactNode;
}) {
  const ownRef = useRef<HTMLCanvasElement>(null);
  const ref = canvasRef ?? ownRef;
  const scene = useRef<HTMLCanvasElement | null>(null);
  const focusRef = useRef(focus);
  const [loading, setLoading] = useState(true);
  const token = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const current = ++token.current;
    // Disegna su un canvas di appoggio e copia solo l'ultimo risultato richiesto
    const off = document.createElement("canvas");
    renderAvatar(off, selection)
      .then(() => {
        if (current !== token.current) return;
        scene.current = off;
        drawFocus(canvas, off, focusRef.current);
        setLoading(false);
      })
      .catch(() => {
        if (current === token.current) setLoading(false);
      });
  }, [selection, ref]);

  // Cambiare inquadratura non ridisegna la scena: la ritaglia soltanto
  useEffect(() => {
    focusRef.current = focus;
    if (ref.current && scene.current) drawFocus(ref.current, scene.current, focus);
  }, [focus, ref]);

  return (
    <div
      className={`relative overflow-hidden rounded-[1.5rem] bg-surface-container ${className}`}
      style={{ aspectRatio: `${SCENE_W} / ${SCENE_H}` }}
    >
      <canvas
        ref={ref}
        width={SCENE_W}
        height={SCENE_H}
        role="img"
        aria-label="Anteprima del tuo avatar"
        className="w-full h-full block object-contain"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
          <LoaderCircle className="animate-spin" size={28} />
        </div>
      )}
      {children}
    </div>
  );
}
