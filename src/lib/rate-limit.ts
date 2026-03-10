const store = new Map<string, number[]>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, timestamps] of store) {
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) {
      store.delete(key);
    } else {
      store.set(key, filtered);
    }
  }
}

export function rateLimit(
  request: Request,
  { limit = 30, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): { success: boolean; remaining: number } {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const now = Date.now();
  const cutoff = now - windowMs;

  cleanup(windowMs);

  let timestamps = store.get(ip);
  if (!timestamps) {
    timestamps = [];
    store.set(ip, timestamps);
  }

  const filtered = timestamps.filter((t) => t > cutoff);
  filtered.push(now);
  store.set(ip, filtered);

  const remaining = Math.max(0, limit - filtered.length);
  return { success: filtered.length <= limit, remaining };
}
