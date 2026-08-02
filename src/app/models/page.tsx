"use client";

import { useEffect, useState } from "react";

interface Model {
  id: string;
  name: string;
  tier: string;
  pricing: { input: number; output: number };
  context: number;
  speed: string;
  strengths: string[];
  requiresAuth: string;
}

interface ModelsResponse {
  models: Model[];
  stats: { modelsOnline: number; cheapestOutput: number };
}

export default function ModelsPage() {
  const [data, setData] = useState<ModelsResponse | null>(null);
  const [filter, setFilter] = useState("all"); // all | cheap | good | best

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const tierBadge = (tier: string) => {
    if (tier === "cheap") return "badge badge-green";
    if (tier === "good") return "badge badge-orange";
    if (tier === "best") return "badge badge-gold";
    return "badge";
  };

  const speedText = (speed: string) => {
    if (speed === "fast") return "⚡ FAST";
    if (speed === "medium") return "— MEDIUM";
    return "— SLOW";
  };

  const filteredModels = data?.models.filter((m) => {
    if (filter === "all") return true;
    return m.tier === filter;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <pre className="ascii-title text-xs leading-tight text-[var(--text)]">
{`███╗   ███╗ ██████╗ ██████╗ ███████╗██╗     ███████╗
████╗ ████║██╔═══██╗██╔══██╗██╔════╝██║     ██╔════╝
██╔████╔██║██║   ██║██║  ██║█████╗  ██║     ███████╗
██║╚██╔╝██║██║   ██║██║  ██║██╔══╝  ██║     ╚════██║
██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗███████╗███████║
╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝`}
          </pre>
        </div>
        <div className="text-right text-xs text-[var(--border)]">
          <div>{data?.stats.modelsOnline || 0} MODELS ONLINE</div>
          <div className="text-[var(--green)]">from ${data?.stats.cheapestOutput || 0}/M output</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "cheap", "good", "best"].map((f) => (
          <button
            key={f}
            className={filter === f ? "btn-primary text-xs" : "btn-outline text-xs"}
            onClick={() => setFilter(f)}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Model Cards */}
      <div className="space-y-3">
        {filteredModels.map((m) => (
          <div key={m.id} className="model-card halftone-dot">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-lg font-bold" style={{ fontFamily: "'Times New Roman', serif" }}>
                  {m.name}
                </div>
                <div className="flex gap-2 mt-1">
                  <span className={tierBadge(m.tier)}>{m.tier}</span>
                  <span className="badge">{speedText(m.speed)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--border)]">OUTPUT / 1M TOKENS</div>
                <div className="price-tag">${m.pricing.output.toFixed(2)}</div>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-[var(--border)]">
              <span>Input: ${m.pricing.input.toFixed(2)}/M</span>
              <span>Context: {m.context >= 1_000_000 ? `${m.context / 1_000_000}M` : `${Math.round(m.context / 1000)}K`}</span>
              <span>Strengths: {m.strengths.join(", ")}</span>
              {m.requiresAuth !== "none" && (
                <span className="text-[var(--gold)]">Requires: {m.requiresAuth.toUpperCase()} PASS</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Price comparison note */}
      <div className="terminal-box halftone-line">
        <div className="text-xs text-[var(--border)]">
          TokenFall pricing is 10-30% below <span className="text-[var(--gold)]">OpenRouter</span> on equivalent models.
          No credit card fees. No hidden charges. Pay with crypto.<br />
          View real-time price comparisons: <code className="text-[var(--green)]">GET /api/models</code>
        </div>
      </div>
    </div>
  );
}
