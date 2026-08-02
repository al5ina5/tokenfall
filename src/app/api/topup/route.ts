// ── API Route: /api/topup ──
// Creates or updates a user with credits. Called after plan selection.
// In production: this would verify an on-chain payment before granting credits.
// For now: trusted internal call from the dashboard after plan selection.

import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, walletAddress, amount } = body;

  if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });
  if (!amount || amount <= 0) return Response.json({ error: "Amount must be positive" }, { status: 400 });

  const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (existing) {
    // Add to existing balance
    const newBalance = (existing.creditBalance ?? 0) + amount;
    await db.update(users).set({ creditBalance: newBalance }).where(eq(users.id, userId));
    return Response.json({ userId, creditBalance: newBalance, added: amount });
  }

  // Create new user with credits
  await db.insert(users).values({
    id: userId,
    walletAddress: walletAddress || null,
    creditBalance: amount,
  });

  return Response.json({ userId, creditBalance: amount, added: amount, created: true });
}
