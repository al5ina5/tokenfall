// ── API Route: /v1/chat/completions ──
// OpenAI-compatible endpoint. Drop-in replacement for any OpenAI SDK client.

import { NextRequest } from "next/server";
import { routeRequest, streamRequest } from "@/lib/router";
import { getModelById, MODELS, getEnabledModels, TIER_PRICING } from "@/lib/models";
import { db } from "@/db";
import { apiKeys, users, usageLog } from "@/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createHash } from "crypto";
import { checkRateLimit } from "@/lib/ratelimit";

// SHA256 hash for API key lookup
function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// Extract API key from Authorization header
function extractApiKey(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

// POST /v1/chat/completions
export async function POST(req: NextRequest) {
  const apiKeyRaw = extractApiKey(req);
  if (!apiKeyRaw) {
    return Response.json({ error: { message: "Missing API key. Use Authorization: Bearer tf_sk_...", type: "auth_error" } }, { status: 401 });
  }

  // Look up key
  const keyHash = hashKey(apiKeyRaw);
  const keyRows = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash)).limit(1);
  if (keyRows.length === 0) {
    return Response.json({ error: { message: "Invalid API key", type: "auth_error" } }, { status: 401 });
  }

  const key = keyRows[0];
  const userRows = await db.select().from(users).where(eq(users.id, key.userId)).limit(1);
  if (userRows.length === 0) {
    return Response.json({ error: { message: "User not found", type: "auth_error" } }, { status: 401 });
  }

  const user = userRows[0];
  const balance = user.creditBalance ?? 0;
  const tier = user.nftTier ?? "none";

  // Check credit balance
  if (balance <= 0) {
    return Response.json({ error: { message: "Insufficient credits. Top up at https://tokenfall.io", type: "insufficient_credits" } }, { status: 402 });
  }

  // Parse request body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: { message: "Invalid JSON body", type: "invalid_request" } }, { status: 400 });
  }

  const modelId = body.model || "auto";
  const messages = body.messages || [];
  const maxTokens = Math.min(body.max_tokens || body.maxTokens || 4096, 32_768);
  const temperature = body.temperature ?? 0.7;
  const stream = body.stream === true;

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 100) {
    return Response.json({ error: { message: "messages must contain between 1 and 100 items", type: "invalid_request" } }, { status: 400 });
  }

  // Validate model
  const model = modelId !== "auto" ? getModelById(modelId) : null;
  if (modelId !== "auto" && !model) {
    // Try fallback
    const enabled = getEnabledModels();
    if (enabled.length === 0) {
      return Response.json({ error: { message: `Model '${modelId}' not found and no fallbacks available`, type: "invalid_model" } }, { status: 400 });
    }
  }

  const rateLimit = checkRateLimit(user.id, tier, maxTokens);
  if (!rateLimit.allowed) {
    return Response.json({ error: { message: rateLimit.reason, type: "rate_limited" } }, { status: 429 });
  }

  // Streaming remains disabled until final usage metering is implemented.
  if (stream) {
    return Response.json({ error: { message: "Streaming is temporarily unavailable while usage metering is upgraded. Use stream: false.", type: "streaming_unavailable" } }, { status: 501 });
  }

  // Handle streaming
  if (stream) {
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const modelToUse = modelId !== "auto" ? modelId : (getEnabledModels()[0]?.id || "glm-4.7-flash");

        try {
          for await (const chunk of streamRequest(modelToUse, messages, maxTokens, temperature)) {
            const data = JSON.stringify({
              id: `chatcmpl-${nanoid(12)}`,
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model: modelToUse,
              choices: [{ index: 0, delta: { content: chunk }, finish_reason: null }],
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: { message: err.message } })}\n\n`));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Non-streaming
  const result = await routeRequest(modelId, messages, maxTokens, temperature, tier);

  if (!result.success) {
    return Response.json({ error: { message: result.error, type: "provider_error" } }, { status: 502 });
  }

  // Calculate credit cost (what we charge the user)
  const modelDef = getModelById(result.model) || MODELS[0];
  const pricing = TIER_PRICING[modelDef.tier as keyof typeof TIER_PRICING] || TIER_PRICING.cheap;
  const totalCredits = Math.ceil(
    (result.tokensInput / 1_000_000) * pricing.input * 1_000_000 +
    (result.tokensOutput / 1_000_000) * pricing.output * 1_000_000
  );

  // Apply NFT discount
  const discounts: Record<string, number> = { none: 0, common: 5, rare: 10, legendary: 20 };
  const discountPct = discounts[tier] || 0;
  const finalCredits = Math.ceil(totalCredits * (1 - discountPct / 100));

  // Deduct credits
  if (finalCredits > 0) {
    const updated = await db.update(users)
      .set({ creditBalance: balance - finalCredits })
      .where(and(eq(users.id, user.id), gte(users.creditBalance, finalCredits)))
      .returning({ creditBalance: users.creditBalance });
    if (!updated.length) {
      return Response.json({ error: { message: "Insufficient credits", type: "insufficient_credits" } }, { status: 402 });
    }
  }

  // Log usage
  await db.insert(usageLog).values({
    id: nanoid(),
    apiKeyId: key.id,
    userId: user.id,
    model: result.model,
    provider: result.provider,
    tokensInput: result.tokensInput,
    tokensOutput: result.tokensOutput,
    costCredits: finalCredits,
    costUsdProvider: result.costUsdCents,
    latencyMs: result.latencyMs,
    success: "true",
  });

  const responseId = `chatcmpl-${nanoid(12)}`;

  return Response.json({
    id: responseId,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: result.model,
    choices: [{
      index: 0,
      message: { role: "assistant", content: result.content },
      finish_reason: "stop",
    }],
    usage: {
      prompt_tokens: result.tokensInput,
      completion_tokens: result.tokensOutput,
      total_tokens: result.tokensInput + result.tokensOutput,
    },
    _tokenfall: {
      credits_used: finalCredits,
      credits_remaining: balance - finalCredits,
      provider_cost_usd_cents: result.costUsdCents,
      savings_vs_direct: `${Math.round((finalCredits / 10000 - result.costUsdCents / 100) * 100) / 100}`,
    },
  });
}

// GET /v1/models — list available models
export async function GET(req: NextRequest) {
  const apiKeyRaw = extractApiKey(req);
  if (!apiKeyRaw) {
    return Response.json({ error: { message: "Missing API key" } }, { status: 401 });
  }

  const keyHash = hashKey(apiKeyRaw);
  const keyRows = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash)).limit(1);
  if (keyRows.length === 0) {
    return Response.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const userRows = await db.select().from(users).where(eq(users.id, keyRows[0].userId)).limit(1);
  const nftTier = userRows[0]?.nftTier || "none";
  const tierOrder = { none: 0, common: 1, rare: 2, legendary: 3 };
  const userTier = tierOrder[nftTier as keyof typeof tierOrder] || 0;

  const models = getEnabledModels()
    .filter((m) => {
      const required = tierOrder[m.requiresAuth as keyof typeof tierOrder] || 0;
      return userTier >= required;
    })
    .map((m) => ({
      id: m.id,
      object: "model",
      created: 1728000000,
      owned_by: `tokenfall/${m.provider}`,
      tokenfall_tier: m.tier,
      tokenfall_pricing: {
        input_per_1m: m.inputPricePer1M,
        output_per_1m: m.outputPricePer1M,
      },
    }));

  return Response.json({ object: "list", data: models });
}

// OPTIONS — CORS
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
