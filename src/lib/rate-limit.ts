/**
 * Simple in-memory rate limiter for API routes.
 * Suitable for single-instance deployments (Vercel serverless functions
 * don't share memory, so each cold start resets the map).
 * For production-grade limiting, use Vercel Edge Config or Upstash Redis.
 */

const requests = new Map<string, { count: number; resetTime: number }>();

type RateLimitOptions = {
  /** Maximum requests allowed within the window. */
  limit?: number;
  /** Time window in seconds. */
  windowSeconds?: number;
};

export function rateLimit(
  key: string,
  { limit = 10, windowSeconds = 60 }: RateLimitOptions = {}
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = requests.get(key);

  if (!entry || now > entry.resetTime) {
    requests.set(key, { count: 1, resetTime: now + windowSeconds * 1000 });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}
