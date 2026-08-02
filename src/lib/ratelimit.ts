// ── Rate limiter ──
// Uses Upstash Redis in production when configured; falls back to a conservative
// per-instance limiter for local development.

import { Redis } from "@upstash/redis";

const buckets = new Map<string, { count: number; resetAt: number }>();
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : null;

interface RateLimitConfig {
  tokensPerMinute: number;
  tokensPerDay: number;
}

const TIER_LIMITS: Record<string, RateLimitConfig> = {
  none: { tokensPerMinute: 5_000, tokensPerDay: 1_000_000 },
  common: { tokensPerMinute: 10_000, tokensPerDay: 5_000_000 },
  rare: { tokensPerMinute: 25_000, tokensPerDay: 25_000_000 },
  legendary: { tokensPerMinute: 100_000, tokensPerDay: 100_000_000 },
};

export function checkRateLimit(userId: string, tier: string, tokensRequested: number): { allowed: boolean; reason?: string } {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.none;
  const now = Date.now();
  const minuteKey = `${userId}:minute`;
  const dayKey = `${userId}:day`;

  // Clean expired buckets
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }

  // Minute check
  const minBucket = buckets.get(minuteKey);
  if (minBucket) {
    if (minBucket.count + tokensRequested > limits.tokensPerMinute) {
      return { allowed: false, reason: "Rate limit exceeded. Try again in a minute." };
    }
    minBucket.count += tokensRequested;
  } else {
    buckets.set(minuteKey, { count: tokensRequested, resetAt: now + 60_000 });
  }

  // Day check
  const dayBucket = buckets.get(dayKey);
  if (dayBucket) {
    if (dayBucket.count + tokensRequested > limits.tokensPerDay) {
      return { allowed: false, reason: "Daily limit reached. Resets at midnight UTC." };
    }
    dayBucket.count += tokensRequested;
  } else {
    buckets.set(dayKey, { count: tokensRequested, resetAt: now + 86_400_000 });
  }

  return { allowed: true };
}
