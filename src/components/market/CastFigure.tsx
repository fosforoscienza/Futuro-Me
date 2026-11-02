import Image from "next/image";
import type { CastId } from "@/lib/avatar/cast";
import { CastVideo } from "./CastVideo";

/**
 * Avatar del cast senza sfondo, in piedi su un'ombra a terra fatta in CSS
 * (ellisse sfumata nel rosso mattone della palette, mai nero).
 * I piedi stanno a circa il 30% della larghezza dell'immagine; flip li porta al 70%.
 */
export function CastFigure({
  id,
  sizes,
  flip = false,
  video = false,
  className = "",
}: {
  id: CastId;
  sizes: string;
  flip?: boolean;
  video?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`relative aspect-[606/1043] ${className}`}>
      <div
        className="absolute bottom-0 h-[6%] w-[58%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(150_46_22/0.32),rgb(150_46_22/0.14)_55%,transparent)]"
        style={{ left: flip ? "70%" : "30%" }}
      />
      <div className={`relative h-full w-full ${flip ? "-scale-x-100" : ""}`}>
        {video ? (
          <CastVideo id={id} className="h-full w-full object-contain" />
        ) : (
          <Image
            src={`/avatar/cast/${id}.webp`}
            alt=""
            width={606}
            height={1043}
            sizes={sizes}
            className="h-full w-full object-contain"
          />
        )}
      </div>
    </div>
  );
}
