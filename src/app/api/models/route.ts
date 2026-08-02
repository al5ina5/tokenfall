// ── API Route: /api/models ──
// Public model catalog (no auth required — useful for discovery)
// Authenticated version at /v1/models shows NFT-gated models

import { getEnabledModels } from "@/lib/models";

export async function GET() {
  const models = getEnabledModels().map((m) => ({
    id: m.id,
    name: m.name,
    tier: m.tier,
    pricing: { input: m.inputPricePer1M, output: m.outputPricePer1M },
    context: m.contextWindow,
    speed: m.speed,
    strengths: m.strengths,
    requiresAuth: m.requiresAuth,
  }));

  const stats = {
    modelsOnline: models.length,
    cheapestOutput: models.length ? Math.min(...models.map((m) => m.pricing.output)) : null,
  };

  return Response.json({ models, stats }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
