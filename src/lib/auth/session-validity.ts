/** Sessions are bound to the exact credential version used for authentication. */
export function isSessionCurrent(
  expiresAt: string, sessionVersion: string | null, accountVersion: string | null, now = Date.now()
): boolean {
  const expires = Date.parse(expiresAt);
  return Number.isFinite(expires) && expires > now &&
    typeof sessionVersion === "string" && sessionVersion.length > 0 && sessionVersion === accountVersion;
}
