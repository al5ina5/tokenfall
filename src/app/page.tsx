"use client";

import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import Link from "next/link";

interface UserStats {
  creditBalance: number;
  nftTier: string;
  totalTokensUsed: number;
  totalRequests: number;
  walletAddress: string;
}

export default function Dashboard() {
  const [userId] = useState(() => {
    if (typeof window === "undefined") return "demo";
    const stored = localStorage.getItem("tokenfall_user_id");
    if (stored) return stored;
    const id = nanoid();
    localStorage.setItem("tokenfall_user_id", id);
    return id;
  });

  const [stats, setStats] = useState<UserStats | null>(null);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keyCreated, setKeyCreated] = useState(false);
  const [savedCredits, setSavedCredits] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/users?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        const saved = Math.round((data.totalTokensUsed / 1_000_000) * 0.1 * 100) / 100;
        setSavedCredits(saved);
      })
      .catch(() => {
        setStats({
          creditBalance: 1_000_000,
          nftTier: "none",
          totalTokensUsed: 0,
          totalRequests: 0,
          walletAddress: "",
        });
      });
  }, [userId]);

  const handleCreateKey = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ name: "dashboard-key" }),
      });
      const data = await res.json();
      if (data.key) {
        setApiKey(data.key);
        setKeyCreated(true);
      } else {
        setError("Failed to generate key. Try again.");
      }
    } catch {
      setError("Network error. Check your connection.");
    }
    setLoading(false);
  };

  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse("");
    setError("");
    try {
      const res = await fetch("/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "auto",
          messages: [{ role: "user", content: prompt }],
          stream: false,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error.message);
      } else {
        setResponse(data.choices?.[0]?.message?.content || JSON.stringify(data, null, 2));
        setPrompt("");
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const tierLabel = (tier: string) => {
    const labels: Record<string, string> = { none: "None", common: "Common", rare: "Rare", legendary: "Legendary" };
    return labels[tier] || tier;
  };

  const tierClass = (tier: string) => {
    if (tier === "legendary") return "badge-accent";
    if (tier === "rare" || tier === "common") return "badge-success";
    return "";
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your AI inference command center. Models, keys, usage — all in one place.</p>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-9)" }}>
        <div className="stat-card">
          <div className="stat-label">Credit Balance</div>
          <div className="stat-value" style={{ color: stats && stats.creditBalance > 1_000_000 ? "var(--color-accent-text)" : "var(--color-text-primary)" }}>
            {stats ? stats.creditBalance.toLocaleString() : "—"}
          </div>
          <div className="stat-secondary">≈ ${stats ? (stats.creditBalance / 10000).toFixed(2) : "0.00"} USD</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Tokens Used</div>
          <div className="stat-value" style={{ color: "var(--color-success)" }}>
            {stats ? stats.totalTokensUsed.toLocaleString() : "—"}
          </div>
          <div className="stat-secondary">{stats ? `${stats.totalRequests || 0} requests` : ""}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">You Saved</div>
          <div className="stat-value" style={{ color: "var(--color-accent-text)" }}>
            ${savedCredits.toFixed(2)}
          </div>
          <div className="stat-secondary">vs direct API pricing</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">NFT Tier</div>
          <div className="stat-value" style={{ fontSize: "var(--text-h2)" }}>
            <span className={`badge ${tierClass(stats?.nftTier || "none")}`}>{tierLabel(stats?.nftTier || "none")}</span>
          </div>
          <div className="stat-secondary">
            {stats?.nftTier === "none" ? "Mint a Genesis Pass to unlock discounts" : `${stats?.nftTier === "legendary" ? "20" : stats?.nftTier === "rare" ? "10" : "5"}% discount active`}
          </div>
        </div>
      </div>

      {/* API Key Setup */}
      {!keyCreated && (
        <div className="section">
          <div className="empty-state" style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
            <div className="empty-state-title">Create your first API key</div>
            <div className="empty-state-text">Drop-in replacement for the OpenAI API. Same SDK, same endpoint format — just cheaper and crypto-native.</div>
            <button className="btn btn-primary" onClick={handleCreateKey} disabled={loading}>
              {loading ? "Generating…" : "Generate API Key"}
            </button>
            {error && <div className="form-error" style={{ marginTop: "var(--space-3)" }}>{error}</div>}
          </div>
        </div>
      )}

      {keyCreated && apiKey && (
        <>
          {/* API Key display */}
          <div className="section">
            <div className="alert-warning">
              <div className="alert-warning-title">Save your API key — it won't be shown again</div>
              <div className="mono-display">{apiKey}</div>
            </div>
          </div>

          {/* Quick Model Terminal */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Quick Model</h2>
              <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)" }}>
                model: auto · smart routing active
              </span>
            </div>
            <div className="card">
              <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                <select className="form-select" style={{ width: "auto", minWidth: "200px" }} defaultValue="auto">
                  <option value="auto">Auto (smart route)</option>
                  <option value="groq-llama-3.1-8b">Groq Llama 3.1 8B</option>
                  <option value="glm-4.7-flash">GLM-4.7 Flash (free)</option>
                </select>
              </div>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Type a prompt and press Enter…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-3)" }}>
                <button className="btn btn-primary" onClick={handleSendPrompt} disabled={loading}>
                  {loading ? "Sending…" : "Send"}
                </button>
              </div>
              {error && <div className="form-error" style={{ marginTop: "var(--space-3)" }}>{error}</div>}
              {response && (
                <div className="code-block" style={{ marginTop: "var(--space-4)", color: "var(--color-text-primary)" }}>
                  {response}
                </div>
              )}
            </div>
          </div>

          {/* Quick Start Code */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Quick Start</h2>
            </div>
            <div className="card">
              <p style={{ fontSize: "var(--text-body)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
                Drop-in replacement for OpenAI. Change <code style={{ color: "var(--color-accent-text)" }}>base_url</code> and <code style={{ color: "var(--color-accent-text)" }}>api_key</code>. That's it.
              </p>
              <pre className="code-block">
{`# Python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.tokenfall.io/v1",
    api_key="${apiKey.slice(0, 12)}..."
)

response = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Hello, TokenFall!"}]
)
print(response.choices[0].message.content)`}
              </pre>
              <div style={{ marginTop: "var(--space-4)", fontSize: "var(--text-body-sm)", color: "var(--color-text-tertiary)" }}>
                Browse <Link href="/models" style={{ color: "var(--color-accent-text)" }}>all models</Link> · Read the <Link href="/docs" style={{ color: "var(--color-accent-text)" }}>docs</Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
