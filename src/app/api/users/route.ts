import { db } from "@/db";
import { users, usageLog } from "@/db/schema";
import { eq, sql, sum } from "drizzle-orm";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  // Aggregate stats
  const [stats] = await db.select({
    totalTokens: sum(usageLog.tokensOutput),
    totalRequests: sql<number>`count(*)::int`,
    totalCostUsd: sum(usageLog.costUsdProvider),
  }).from(usageLog).where(eq(usageLog.userId, userId));

  return Response.json({
    walletAddress: user.walletAddress,
    creditBalance: user.creditBalance,
    nftTier: user.nftTier,
    totalTokensUsed: Number(stats?.totalTokens || 0),
    totalRequests: Number(stats?.totalRequests || 0),
    totalCostUsdCents: Number(stats?.totalCostUsd || 0),
    createdAt: user.createdAt,
  });
}
