/** Password changes revoke previous sessions even if their deletion fails. */
export function isSessionCurrent(
  createdAt: string,
  expiresAt: string,
  passwordChangedAt: string,
  now = Date.now()
): boolean {
  const created = Date.parse(createdAt);
  const expires = Date.parse(expiresAt);
  const changed = Date.parse(passwordChangedAt);
  return Number.isFinite(created) && Number.isFinite(expires) && Number.isFinite(changed)
    && expires > now && created > changed;
}
