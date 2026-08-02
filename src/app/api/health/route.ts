// ── API Route: /api/health ──
// Provider health scoring. Called every 60s by a cron job.

import { getProvider, getAvailableProviders } from "@/lib/providers";
import { getEnabledModels } from "@/lib/models";

interface HealthReport {
  provider: string;
  latencyMs: number;
  error: string | null;
  score: number;
  status: "healthy" | "degraded" | "dead";
}

export async function GET() {
  const providers = getAvailableProviders();
  const models = getEnabledModels();
  const reports: HealthReport[] = [];

  for (const providerName of providers) {
    const provider = getProvider(providerName);
    if (!provider) continue;

    const start = Date.now();
    let error: string | null = null;
    let outputOk = false;

    try {
      const res = await provider.chat({
        model: models.find(m => m.provider === providerName)?.id || "",
        messages: [{ role: "user", content: "ping" }],
        maxTokens: 5,
        temperature: 0,
      });
      outputOk = res.content.length > 0;
    } catch (err: any) {
      error = err.message?.slice(0, 100) || "Unknown";
    }

    const latencyMs = Date.now() - start;
    const latencyScore = latencyMs < 300 ? 1 : latencyMs < 800 ? 0.7 : latencyMs < 1500 ? 0.4 : 0.1;
    const errorScore = error ? 0 : 1;
    const matchScore = outputOk ? 1 : 0;
    const score = Math.round((latencyScore * 0.3 + errorScore * 0.4 + matchScore * 0.3) * 100) / 100;

    const status: HealthReport["status"] = score >= 0.8 ? "healthy" : score >= 0.5 ? "degraded" : "dead";

    reports.push({ provider: providerName, latencyMs, error, score, status });
  }

  reports.sort((a, b) => b.score - a.score);

  return Response.json({
    timestamp: new Date().toISOString(),
    reports,
    summary: {
      healthy: reports.filter(r => r.status === "healthy").length,
      degraded: reports.filter(r => r.status === "degraded").length,
      dead: reports.filter(r => r.status === "dead").length,
    },
  });
}
