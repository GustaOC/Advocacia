// lib/rate-limit.ts
type Key = string;

const WINDOW_MS = 60_000; // 1 minute
const MAX = 60; // 60 req/min per IP (tune per route)

// Exportando o Map para que possamos limpá-lo nos testes
export const hits = new Map<Key, { count: number; expires: number }>();

export function rateLimit(ip: string, max = MAX, windowMs = WINDOW_MS) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || rec.expires < now) {
    hits.set(ip, { count: 1, expires: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }
  if (rec.count >= max) {
    return { allowed: false, remaining: 0 };
  }
  rec.count += 1;
  return { allowed: true, remaining: max - rec.count };
}