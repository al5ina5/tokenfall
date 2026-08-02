"use client";

import { useEffect, useState } from "react";
import { nanoid } from "nanoid";

interface KeyInfo {
  id: string; name: string; prefix: string; monthlyLimit: number; allowedModels: string; createdAt: string;
}

export default function KeysPage() {
  const [userId] = useState(() => {
    if (typeof window === "undefined") return "demo";
    const s = localStorage.getItem("tokenfall_user_id");
    if (s) return s;
    const id = nanoid(); localStorage.setItem("tokenfall_user_id", id); return id;
  });
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [name, setName] = useState("");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchKeys = async () => {
    const r = await fetch("/api/keys", { headers: { "x-user-id": userId } });
    const d = await r.json();
    setKeys(d.keys || []);
  };
  useEffect(() => { fetchKeys(); }, [userId]);

  const create = async () => {
    if (!name.trim()) { setError("Name your key."); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": userId }, body: JSON.stringify({ name }) });
      const d = await r.json();
      if (d.key) { setGenerated(d.key); setName(""); fetchKeys(); } else setError("Failed.");
    } catch { setError("Network error."); }
    setLoading(false);
  };
  const del = async (id: string) => { await fetch("/api/keys", { method: "DELETE", headers: { "x-user-id": userId, "x-key-id": id } }); fetchKeys(); };

  return (
    <div>
      <pre className="ascii-lg" style={{ marginBottom: "var(--space-9)" }}>
{` █████╗ ██████╗ ██╗    ██╗  ██╗███████╗██╗   ██╗███████╗
██╔══██╗██╔══██╗██║    ██║ ██╔╝██╔════╝╚██╗ ██╔╝██╔════╝
███████║██████╔╝██║    █████╔╝ █████╗   ╚████╔╝ ███████╗
██╔══██║██╔═══╝ ██║    ██╔═██╗ ██╔══╝    ╚██╔╝  ╚════██║
██║  ██║██║     ██║    ██║  ██╗███████╗   ██║   ███████║
╚═╝  ╚═╝╚═╝     ╚═╝    ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝`}
      </pre>

      <div className="section-header"><h2 className="section-title">New Key</h2></div>
      <div className="card" style={{ marginBottom: "var(--space-9)" }}>
        <label className="field-label" htmlFor="kn">Key name</label>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <input id="kn" placeholder="production, staging..." value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && create()} style={{ maxWidth: "320px" }} />
          <button className="btn btn-primary" onClick={create} disabled={loading}>{loading ? "..." : "Generate"}</button>
        </div>
        {error && <div className="field-error">{error}</div>}
        <div className="field-helper">Names identify keys. Never sent to APIs.</div>

        {generated && (
          <div style={{ marginTop: "var(--space-4)" }}>
            <div className="alert-accent">
              <div className="alert-title">Copy now — never shown again</div>
              <div className="key-display">{generated}</div>
            </div>
            <div className="code-block" style={{ marginTop: "var(--space-3)" }}>export TOKENFALL_API_KEY=&quot;{generated}&quot;</div>
          </div>
        )}
      </div>

      <div className="section-header">
        <h2 className="section-title">Your Keys</h2>
        <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)" }}>{keys.length} key{keys.length !== 1 ? "s" : ""}</span>
      </div>

      {keys.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", marginBottom: "var(--space-9)" }}>
          <div className="empty-state-title">No keys yet</div>
          <div className="empty-state-text">Create one above to start making API calls.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-2)", marginBottom: "var(--space-9)" }}>
          {keys.map(k => (
            <div key={k.id} className="key-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="key-row-name">{k.name}</div>
                <div className="key-row-prefix">{k.prefix}</div>
              </div>
              <div className="key-row-meta hide-mobile">
                <span>Limit: {k.monthlyLimit.toLocaleString()}</span>
                <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
              </div>
              <button className="btn btn-ghost" onClick={() => del(k.id)} style={{ color: "var(--color-error)", fontSize: "var(--text-caption)" }}>Delete</button>
            </div>
          ))}
        </div>
      )}

      <div className="section-header"><h2 className="section-title">Usage</h2></div>
      <pre className="code-block">
{`curl https://api.tokenfall.io/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer tf_sk_YOUR_KEY" \\
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'`}
      </pre>
    </div>
  );
}
