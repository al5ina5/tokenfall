// ── API Route: /api/users ──
// User stats, credit management

import { db } from "@/db";
import { users, usageLog } from "@/db/schema";
import { eq, sum, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

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

export async function PATCH(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (typeof body.creditBalance === "number") {
    await db.update(users).set({ creditBalance: body.creditBalance }).where(eq(users.id, userId));
    return Response.json({ creditBalance: body.creditBalance });
  }

  return Response.json({ error: "Nothing to update" }, { status: 400 });
}
