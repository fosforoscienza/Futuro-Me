"use client";

import { useState } from "react";
import { Briefcase, Cpu, GraduationCap, Lightbulb, type LucideIcon } from "lucide-react";

const FALLBACK: Record<string, { icon: LucideIcon; className: string }> = {
  ai: { icon: Cpu, className: "from-secondary to-secondary-container" },
  jobs: { icon: Briefcase, className: "from-primary to-primary-container" },
  training: { icon: GraduationCap, className: "from-tertiary to-tertiary-container" },
  skills: { icon: Lightbulb, className: "from-secondary-container to-primary-container" },
};

/**
 * Foto di una news: la copertina dell'articolo originale, con il credito alla
 * fonte. Se manca o non si carica (alcune testate bloccano l'uso esterno),
 * mostra un'immagine di riserva con il colore e l'icona della categoria.
 */
export function NewsImage({
  src,
  alt,
  category,
  credit,
  className = "",
  showCredit = true,
}: {
  src?: string | null;
  alt: string;
  category: string;
  credit?: string;
  className?: string;
  showCredit?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const fallback = FALLBACK[category] ?? FALLBACK.jobs;
  const Icon = fallback.icon;

  if (!src || failed) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br ${fallback.className} ${className}`}
        aria-hidden
      >
        <Icon
          size={96}
          strokeWidth={1.25}
          className="absolute -right-4 -bottom-4 text-white/30"
        />
        <Icon size={36} className="absolute left-5 top-5 text-white/90" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-surface-container ${className}`}>
      {/* Immagini da domini esterni qualsiasi: niente next/image (servirebbe
          elencare ogni testata in remotePatterns). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {showCredit && credit && (
        <span className="absolute bottom-2 left-2 max-w-[85%] truncate rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white">
          Foto: {credit}
        </span>
      )}
    </div>
  );
}
