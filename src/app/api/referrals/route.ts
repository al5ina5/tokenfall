// ── API Route: /api/referrals ──
// Referral tracking and shard mechanics

import { NextRequest } from "next/server";
import { db } from "@/db";
import { referrals, achievements, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET /api/referrals?userId=X — get referral stats
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });

  const code = `ref_${userId.slice(0, 8).toUpperCase()}`;
  const rows = await db.select().from(referrals).where(eq(referrals.referrerId, userId));
  const totalShards = rows.reduce((acc, r) => acc + (r.shardsEarned || 0), 0);

  const link = `https://tokenfall.vercel.app/landing?ref=${userId}`;

  return Response.json({ referralCode: code, totalSignups: rows.length, totalShards, referralLink: link, referrals: rows });
}

// POST /api/referrals — record a new referral
export async function POST(req: NextRequest) {
  const referrerId = req.headers.get("x-referrer");
  const referredUserId = req.headers.get("x-user-id");
  if (!referrerId || !referredUserId) return Response.json({ error: "Missing headers" }, { status: 400 });

  // Don't self-refer
  if (referrerId === referredUserId) return Response.json({ error: "Cannot refer yourself" }, { status: 400 });

  // Check if already referred
  const existing = await db.select().from(referrals).where(eq(referrals.referredUserId, referredUserId)).limit(1);
  if (existing.length > 0) return Response.json({ error: "Already referred" }, { status: 409 });

  await db.insert(referrals).values({
    id: nanoid(),
    referrerId,
    referredUserId,
    referralCode: `ref_${referrerId.slice(0, 8)}`,
    shardsEarned: 1,
  });

  // Check for Referral Lord achievement
  const count = await db.select().from(referrals).where(eq(referrals.referrerId, referrerId));
  const signups = count.length;

  if (signups === 5) {
    await db.insert(achievements).values({
      id: nanoid(),
      userId: referrerId,
      badgeKey: "referral_lord",
      tier: "Silver",
      progress: 100,
      minted: "true",
    });
  } else if (signups === 50) {
    await db.insert(achievements).values({
      id: nanoid(),
      userId: referrerId,
      badgeKey: "referral_lord",
      tier: "Diamond",
      progress: 100,
      minted: "true",
    });
  }

  return Response.json({ success: true, totalReferrals: signups, shardsEarned: signups });
}
