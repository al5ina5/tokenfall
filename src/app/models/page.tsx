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
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const tierBadgeClass = (tier: string) => {
    if (tier === "cheap") return "badge badge-success";
    if (tier === "good") return "badge badge-warning";
    if (tier === "best") return "badge badge-accent";
    return "badge";
  };

  const speedLabel = (speed: string) => {
    if (speed === "fast") return "Fast";
    if (speed === "medium") return "Medium";
    return "Slow";
  };

  const speedBadgeClass = (speed: string) => {
    if (speed === "fast") return "badge badge-success";
    return "badge";
  };

  const filteredModels = data?.models.filter((m) => {
    if (filter === "all") return true;
    return m.tier === filter;
  }) || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Models</h1>
          <p className="page-subtitle">
            {data ? `${data.stats.modelsOnline} models online · from $${data.stats.cheapestOutput}/M output` : "Loading…"}
          </p>
        </div>
      </div>

      <div className="filter-bar">
        {["all", "cheap", "good", "best"].map((f) => (
          <button
            key={f}
            className={`filter-pill ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {filteredModels.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No models available</div>
          <div className="empty-state-text">Add provider API keys to unlock more models.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-3)" }}>
          {filteredModels.map((m) => (
            <div key={m.id} className="model-card">
              <div className="model-card-header">
                <div style={{ minWidth: 0 }}>
                  <div className="model-card-name">{m.name}</div>
                  <div className="model-card-meta">
                    <span className={tierBadgeClass(m.tier)}>{m.tier}</span>
                    <span className={speedBadgeClass(m.speed)}>{speedLabel(m.speed)}</span>
                    {m.requiresAuth !== "none" && (
                      <span className="badge badge-accent">{m.requiresAuth} pass required</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)", marginBottom: "2px" }}>
                    Output / 1M tokens
                  </div>
                  <div className="price-tag">
                    ${m.pricing.output.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="model-card-details">
                <span>Input ${m.pricing.input.toFixed(2)}/M</span>
                <span>Context {m.context >= 1_000_000 ? `${m.context / 1_000_000}M` : `${Math.round(m.context / 1000)}K`}</span>
                <span>{m.strengths.join(", ")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: "var(--space-9)" }}>
        <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)" }}>
          All prices are 10-30% below OpenRouter. No credit card fees. Pay with crypto.{" "}
          <code style={{ color: "var(--color-accent-text)", fontSize: "0.9em" }}>GET /api/models</code> for real-time prices.
        </p>
      </div>
    </div>
  );
}
