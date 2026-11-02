"use client";

import { useEffect, useRef } from "react";

/** Safari e tutti i browser iOS leggono l'alfa solo dall'HEVC (.mov), gli altri dal VP9 (.webm). */
function wantsHevc() {
  const ua = navigator.userAgent;
  return /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|Android/.test(ua);
}

/**
 * Loop dell'avatar: muto, parte solo quando è in vista e si ferma fuori schermo.
 * Con prefers-reduced-motion resta il poster. Il file si scarica solo al primo play.
 */
export function CastVideo({ id, className }: { id: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;

    const sync = () => {
      if (!visible || reduce.matches) {
        video.pause();
        return;
      }
      if (!video.getAttribute("src")) {
        video.src = `/avatar/cast/${id}.${wantsHevc() ? "mov" : "webm"}`;
      }
      video.play().catch(() => {});
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { rootMargin: "120px 0px" }
    );
    io.observe(video);
    reduce.addEventListener("change", sync);
    return () => {
      io.disconnect();
      reduce.removeEventListener("change", sync);
    };
  }, [id]);

  return (
    <video
      ref={ref}
      poster={`/avatar/cast/${id}.webp`}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      className={className}
    />
  );
}
