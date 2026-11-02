/** Safari e tutti i browser iOS: leggono l'alfa solo dall'HEVC (.mov), gli altri dal VP9 (.webm). */
export function isWebKitOnly() {
  const ua = navigator.userAgent;
  return /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|Android/.test(ua);
}

/**
 * iPhone e iPad (anche iPadOS che si presenta come Mac): lì il video con alfa
 * compare con lo sfondo bianco, quindi gli avatar restano fermi nella loro posa.
 */
export function isIOS() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Il browser mostra correttamente i loop con trasparenza. */
export function canPlayAlphaVideo() {
  return !isIOS();
}

/**
 * Avvia un video con alfa (`<base>.mov` su Safari, `<base>.webm` altrove).
 * Safari rifiuta play() su un video a cui la sorgente è stata data da script
 * (NotAllowedError): parte solo se muto e autoplay sono impostati prima della
 * sorgente. Verificato in Safari con public/safari-test.html (varianti 5, 7, 8).
 */
export function startAlphaVideo(el: HTMLVideoElement, base: string) {
  el.muted = true;
  el.defaultMuted = true;
  el.setAttribute("muted", "");
  el.playsInline = true;
  el.autoplay = true;
  el.src = `${base}.${isWebKitOnly() ? "mov" : "webm"}`;
}
