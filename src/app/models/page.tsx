"use client";

import { useEffect, useState } from "react";

interface Model {
  id: string; name: string; tier: string;
  pricing: { input: number; output: number };
  context: number; speed: string; strengths: string[]; requiresAuth: string;
}

export default function ModelsPage() {
  const [data, setData] = useState<{ models: Model[]; stats: { modelsOnline: number; cheapestOutput: number } } | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetch("/api/models").then(r => r.json()).then(setData); }, []);

  const fb = (t: string) => t === "cheap" ? "badge badge-success" : t === "good" ? "badge badge-warning" : "badge badge-accent";
  const filtered = data?.models.filter(m => filter === "all" || m.tier === filter) || [];

  return (
    <div>
      <pre className="ascii-lg" style={{ marginBottom: "var(--space-9)" }}>
{`███╗   ███╗ ██████╗ ██████╗ ███████╗██╗     ███████╗
████╗ ████║██╔═══██╗██╔══██╗██╔════╝██║     ██╔════╝
██╔████╔██║██║   ██║██║  ██║█████╗  ██║     ███████╗
██║╚██╔╝██║██║   ██║██║  ██║██╔══╝  ██║     ╚════██║
██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗███████╗███████║
╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝`}
      </pre>

      <div className="section-header">
        <div>
          <h2 className="section-title">Model Catalog</h2>
          <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
            {data ? `${data.stats.modelsOnline} models online · from $${data.stats.cheapestOutput}/M` : "Loading..."}
          </p>
        </div>
      </div>

      <div className="filter-bar">
        {["all", "cheap", "good", "best"].map(f => (
          <button key={f} className={`filter-pill ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No models</div>
          <div className="empty-state-text">Add provider keys to unlock models.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-3)" }}>
          {filtered.map(m => (
            <div key={m.id} className="model-card card-halftone">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)" }}>
                <div style={{ minWidth: 0 }}>
                  <div className="model-card-name">{m.name}</div>
                  <div className="model-card-meta">
                    <span className={fb(m.tier)}>{m.tier}</span>
                    {m.requiresAuth !== "none" && <span className="badge badge-accent">{m.requiresAuth} pass</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)", marginBottom: "2px" }}>Output / 1M</div>
                  <div className="price-tag">${m.pricing.output.toFixed(2)}</div>
                  <div style={{ fontSize: "var(--text-caption)", color: "var(--color-terminal-dim)" }}>input ${m.pricing.input.toFixed(2)}/M</div>
                </div>
              </div>
              <div className="model-card-details">
                <span>Context {m.context >= 1e6 ? `${m.context/1e6}M` : `${Math.round(m.context/1000)}K`}</span>
                <span style={{ color: "var(--color-terminal)" }}>{m.strengths.join(" · ")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card card-halftone" style={{ marginTop: "var(--space-9)" }}>
        <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)" }}>
          Prices 10–30% below OpenRouter. No credit card fees. Pay with crypto.{" "}
          <code style={{ color: "var(--color-terminal)" }}>GET /api/models</code> for live prices.
        </p>
      </div>
    </div>
  );
}
