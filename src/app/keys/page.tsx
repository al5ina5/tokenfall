"use client";

import { useEffect, useState } from "react";
import { nanoid } from "nanoid";

interface KeyInfo {
  id: string;
  name: string;
  prefix: string;
  monthlyLimit: number;
  allowedModels: string;
  createdAt: string;
}

export default function KeysPage() {
  const [userId] = useState(() => {
    if (typeof window === "undefined") return "demo";
    const stored = localStorage.getItem("tokenfall_user_id");
    if (stored) return stored;
    const id = nanoid();
    localStorage.setItem("tokenfall_user_id", id);
    return id;
  });

  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchKeys = async () => {
    const res = await fetch(`/api/keys`, { headers: { "x-user-id": userId } });
    const data = await res.json();
    setKeys(data.keys || []);
  };

  useEffect(() => { fetchKeys(); }, [userId]);

  const createKey = async () => {
    if (!newKeyName.trim()) {
      setError("Please name your key first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (data.key) {
        setGeneratedKey(data.key);
        setNewKeyName("");
      } else {
        setError("Failed to create key.");
      }
      fetchKeys();
    } catch {
      setError("Network error. Try again.");
    }
    setLoading(false);
  };

  const deleteKey = async (keyId: string) => {
    await fetch("/api/keys", {
      method: "DELETE",
      headers: { "x-user-id": userId, "x-key-id": keyId },
    });
    fetchKeys();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">API Keys</h1>
          <p className="page-subtitle">Keys authenticate your requests. Use them with any OpenAI-compatible SDK.</p>
        </div>
      </div>

      {/* Create key */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">New key</h2>
        </div>
        <div className="card">
          <label className="form-label" htmlFor="key-name">Key name</label>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <input
              id="key-name"
              type="text"
              className="form-input"
              style={{ maxWidth: "320px" }}
              placeholder="production, staging, my-agent…"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createKey(); }}
            />
            <button className="btn btn-primary" onClick={createKey} disabled={loading}>
              {loading ? "Creating…" : "Generate"}
            </button>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-helper">Names help you identify keys later. They're never sent to APIs.</div>
        </div>

        {generatedKey && (
          <div style={{ marginTop: "var(--space-4)" }}>
            <div className="alert-warning">
              <div className="alert-warning-title">Copy this key now — it won't be shown again</div>
              <div className="mono-display">{generatedKey}</div>
            </div>
            <div className="code-block" style={{ marginTop: "var(--space-4)" }}>
{`export TOKENFALL_API_KEY="${generatedKey}"`}
            </div>
          </div>
        )}
      </div>

      {/* Key list */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Your keys</h2>
          <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)" }}>
            {keys.length} key{keys.length !== 1 ? "s" : ""}
          </span>
        </div>

        {keys.length === 0 ? (
          <div className="empty-state" style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
            <div className="empty-state-title">No API keys yet</div>
            <div className="empty-state-text">Create your first key above to start making API calls.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "var(--space-2)" }}>
            {keys.map((k) => (
              <div key={k.id} className="key-row">
                <div className="key-row-info">
                  <div className="key-row-name">{k.name}</div>
                  <div className="key-row-prefix">{k.prefix}</div>
                </div>
                <div className="key-row-meta hide-mobile">
                  <span>Limit: {k.monthlyLimit.toLocaleString()}</span>
                  <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                </div>
                <button className="btn btn-ghost" onClick={() => deleteKey(k.id)} style={{ color: "var(--color-error)", fontSize: "var(--text-caption)" }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage example */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Usage</h2>
        </div>
        <pre className="code-block">
{`curl https://api.tokenfall.io/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer tf_sk_YOUR_KEY" \\
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Hello world"}]
  }'`}
        </pre>
      </div>
    </div>
  );
}
