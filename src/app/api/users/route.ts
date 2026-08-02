// ── API Route: /api/users ──
// Read-only user stats. Credits are managed exclusively via /api/topup.

import { db } from "@/db";
import { users, usageLog } from "@/db/schema";
import { eq, sum, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return Response.json({ error: "User not found. Top up first.", code: "NO_ACCOUNT" }, { status: 404 });

  const [stats] = await db.select({
    totalTokens: sum(usageLog.tokensOutput),
    totalRequests: sql<number>`count(*)::int`,
  }).from(usageLog).where(eq(usageLog.userId, userId));

  return Response.json({
    walletAddress: user.walletAddress,
    creditBalance: user.creditBalance ?? 0,
    nftTier: user.nftTier ?? "none",
    totalTokensUsed: Number(stats?.totalTokens || 0),
    totalRequests: Number(stats?.totalRequests || 0),
    createdAt: user.createdAt,
  });
}
