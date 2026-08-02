// ── API Route: /api/achievements ──
// Achievement tracking + badge claiming

import { NextRequest } from "next/server";
import { db } from "@/db";
import { achievements, usageLog, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const BADGE_DEFS: Record<string, { name: string; tiers: { threshold: number; name: string; color: string; discount: number }[] }> = {
  prompt_pioneer: {
    name: "Prompt Pioneer",
    tiers: [
      { threshold: 100, name: "Bronze", color: "#CD7F32", discount: 0 },
      { threshold: 1000, name: "Silver", color: "#C0C0C0", discount: 2 },
      { threshold: 10000, name: "Gold", color: "#FFD700", discount: 5 },
    ],
  },
  token_whale: {
    name: "Token Whale",
    tiers: [
      { threshold: 100_000_000, name: "Silver", color: "#C0C0C0", discount: 2 },
      { threshold: 1_000_000_000, name: "Gold", color: "#FFD700", discount: 5 },
      { threshold: 10_000_000_000, name: "Diamond", color: "#7B68EE", discount: 10 },
    ],
  },
  model_explorer: {
    name: "Model Explorer",
    tiers: [
      { threshold: 3, name: "Bronze", color: "#CD7F32", discount: 0 },
      { threshold: 10, name: "Gold", color: "#FFD700", discount: 5 },
    ],
  },
  referral_lord: {
    name: "Referral Lord",
    tiers: [
      { threshold: 5, name: "Silver", color: "#C0C0C0", discount: 2 },
      { threshold: 50, name: "Diamond", color: "#7B68EE", discount: 10 },
    ],
  },
};

// GET /api/achievements — list user's achievements
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });

  const rows = await db.select().from(achievements).where(eq(achievements.userId, userId));
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  // Calculate progress for unearned badges
  const [requestCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(usageLog).where(eq(usageLog.userId, userId));
  const [tokenTotal] = await db.select({ total: sql<number>`coalesce(sum(usage_log.tokens_output), 0)::int` })
    .from(usageLog).where(eq(usageLog.userId, userId));

  const earned = rows.filter(r => r.minted === "true").map(r => ({
    badgeKey: r.badgeKey,
    tier: r.tier,
    earnedAt: r.earnedAt,
    discount: BADGE_DEFS[r.badgeKey]?.tiers.find(t => t.name === r.tier)?.discount || 0,
  }));

  const progress: Record<string, { current: number; nextThreshold: number; pct: number }> = {};
  const stats = { requests: Number(requestCount?.count || 0), tokens: (Number(tokenTotal?.total || 0)), modelsUsed: 1 };

  return Response.json({ earned, progress, stats, badgeDefs: BADGE_DEFS });
}

// POST /api/achievements — check and claim achievements (called after API calls)
export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return Response.json({ error: "Missing x-user-id" }, { status: 400 });

  // Get user's current stats
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userRows[0]) return Response.json({ claimed: [] });

  const [requestCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(usageLog).where(eq(usageLog.userId, userId));
  const [tokenTotal] = await db.select({ total: sql<number>`coalesce(sum(usage_log.tokens_output), 0)::int` })
    .from(usageLog).where(eq(usageLog.userId, userId));
  const [modelCount] = await db.select({ count: sql<number>`count(distinct usage_log.model)::int` })
    .from(usageLog).where(eq(usageLog.userId, userId));

  const stats = {
    requests: Number(requestCount?.count || 0),
    tokens: Number(tokenTotal?.total || 0),
    models: Number(modelCount?.count || 0),
  };

  // Check which badges can be claimed
  const existing = await db.select().from(achievements).where(eq(achievements.userId, userId));
  const existingKeys = new Set(existing.map(e => `${e.badgeKey}_${e.tier}`));
  const claimed: { badgeKey: string; tier: string; name: string }[] = [];

  const checks: Record<string, number> = {
    prompt_pioneer: stats.requests,
    token_whale: stats.tokens,
    model_explorer: stats.models,
  };

  for (const [badgeKey, value] of Object.entries(checks)) {
    if (!BADGE_DEFS[badgeKey]) continue;
    for (const tier of BADGE_DEFS[badgeKey].tiers) {
      const key = `${badgeKey}_${tier.name}`;
      if (existingKeys.has(key)) continue;
      if (value >= tier.threshold) {
        await db.insert(achievements).values({
          id: nanoid(),
          userId,
          badgeKey,
          tier: tier.name,
          progress: 100,
          minted: "true",
        });
        existingKeys.add(key);
        claimed.push({ badgeKey, tier: tier.name, name: BADGE_DEFS[badgeKey].name });
      }
    }
  }

  // Update savings for user
  const permanentDiscount = await db.select().from(achievements)
    .where(eq(achievements.userId, userId))
    .then(rows => rows.filter(r => r.minted === "true" || r.earnedAt)
      .reduce((acc, r) => acc + (BADGE_DEFS[r.badgeKey]?.tiers.find(t => t.name === r.tier)?.discount || 0), 0));

  return Response.json({ claimed, permanentDiscount });
}
