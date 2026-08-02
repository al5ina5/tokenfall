// ── API Route: /api/keys ──
// API key management — create, list, rotate, delete keys.

import { NextRequest } from "next/server";
import { db } from "@/db";
import { apiKeys, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createHash, randomBytes } from "crypto";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function generateKey(): { full: string; hash: string; prefix: string } {
  const id = randomBytes(24).toString("hex");
  const full = `tf_sk_${id}`;
  const hash = hashKey(full);
  return { full, hash, prefix: `tf_sk_${id.slice(0, 8)}...` };
}

// GET /api/keys — list keys for a user
export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return Response.json({ error: "Missing x-user-id header" }, { status: 401 });

  const rows = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  const safe = rows.map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.keyPrefix,
    monthlyLimit: k.monthlyLimit,
    allowedModels: k.allowedModels,
    webhookUrl: k.webhookUrl,
    createdAt: k.createdAt,
    rotatedAt: k.rotatedAt,
  }));

  return Response.json({ keys: safe });
}

// POST /api/keys — create a new API key
export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return Response.json({ error: "Missing x-user-id header" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch {}

  // Ensure user exists
  const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(users).values({ id: userId, walletAddress: body.walletAddress || null, creditBalance: 1_000_000 });
  }

  const { full, hash, prefix } = generateKey();

  await db.insert(apiKeys).values({
    id: nanoid(),
    userId,
    name: body.name || "default",
    keyHash: hash,
    keyPrefix: prefix,
    monthlyLimit: body.monthlyLimit || 10_000_000,
    allowedModels: body.allowedModels || "*",
    webhookUrl: body.webhookUrl || null,
  });

  return Response.json({ key: full, prefix, name: body.name || "default" }, { status: 201 });
}

// DELETE /api/keys — delete a key
export async function DELETE(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const keyId = req.headers.get("x-key-id");
  if (!userId || !keyId) return Response.json({ error: "Missing headers" }, { status: 400 });

  await db.delete(apiKeys).where(eq(apiKeys.id, keyId));

  return Response.json({ deleted: true });
}
