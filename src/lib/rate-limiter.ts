interface RateLimitBucket {
  timestamps: number[];
}

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

interface RateLimitRule {
  limit: number;
  windowMs: number;
}

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

const rules = new Map<string, RateLimitRule>([
  ["auth:forgot-password", { limit: 5, windowMs: WINDOW_MS }],
]);

const buckets = new Map<string, RateLimitBucket>();

function cleanup(key: string, windowMs: number, now: number): void {
  const bucket = buckets.get(key);
  if (!bucket) {
    return;
  }
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);
  if (bucket.timestamps.length === 0) {
    buckets.delete(key);
  }
}

export function checkRateLimit(
  scope: string,
  identifier: string
): RateLimitResult {
  const rule = rules.get(scope);
  if (!rule) {
    return { allowed: true };
  }

  const now = Date.now();
  const key = `${scope}:${identifier}`;

  cleanup(key, rule.windowMs, now);

  const bucket = buckets.get(key);
  if (!bucket) {
    buckets.set(key, { timestamps: [now] });
    return { allowed: true };
  }

  if (bucket.timestamps.length >= rule.limit) {
    const oldest = bucket.timestamps[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + rule.windowMs - now) / 1000)
    );
    return { allowed: false, retryAfterSeconds };
  }

  bucket.timestamps.push(now);
  return { allowed: true };
}

export function resetRateLimitBuckets(): void {
  buckets.clear();
}