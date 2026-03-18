type Bucket = {
  count: number;
  resetAtMs: number;
};

type LimitResult = {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds
};

const ONE_HOUR_MS = 60 * 60 * 1000;

const buckets = new Map<string, Bucket>();

function nowMs(): number {
  return Date.now();
}

function cleanupOccasionally(): void {
  // O(n) sweep, but only occasionally to keep memory bounded.
  // Trigger every ~256 calls (cheap + deterministic).
  const g: any = globalThis as any;
  g.__pcrm_rl_calls = ((g.__pcrm_rl_calls as number | undefined) ?? 0) + 1;
  if ((g.__pcrm_rl_calls & 0xff) !== 0) return;

  const now = nowMs();
  buckets.forEach((b, k) => {
    if (b.resetAtMs <= now) buckets.delete(k);
  });
}

function checkLimit(key: string, maxPerHour: number): LimitResult {
  if (!key.trim()) {
    return { allowed: false, remaining: 0, resetIn: Math.ceil(ONE_HOUR_MS / 1000) };
  }

  cleanupOccasionally();

  const now = nowMs();
  const existing = buckets.get(key);

  if (!existing || existing.resetAtMs <= now) {
    const resetAtMs = now + ONE_HOUR_MS;
    buckets.set(key, { count: 1, resetAtMs });
    return { allowed: true, remaining: Math.max(0, maxPerHour - 1), resetIn: Math.ceil((resetAtMs - now) / 1000) };
  }

  if (existing.count >= maxPerHour) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.max(0, Math.ceil((existing.resetAtMs - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, maxPerHour - existing.count),
    resetIn: Math.max(0, Math.ceil((existing.resetAtMs - now) / 1000)),
  };
}

export function rateLimitAI(ip: string): LimitResult {
  // max 50 requests per hour per IP for AI routes
  return checkLimit(`ai:${ip}`, 50);
}

export function rateLimitCreateCase(ip: string): LimitResult {
  // max 10 requests per hour per IP for POST /cases
  return checkLimit(`cases_post:${ip}`, 10);
}

export type { LimitResult };

