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

  useEffect(() => {
    fetch(`/api/users?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        // Calculate estimated savings vs direct API
        const saved = Math.round((data.totalTokensUsed / 1_000_000) * 0.1 * 100) / 100;
        setSavedCredits(saved);
      })
      .catch(() => {
        // User not created yet — that's fine
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
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ name: "dashboard-key" }),
      });
      const data = await res.json();
      setApiKey(data.key || "");
      setKeyCreated(true);
    } catch {}
    setLoading(false);
  };

  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse("");
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
        setResponse(`Error: ${data.error.message}`);
      } else {
        setResponse(data.choices?.[0]?.message?.content || JSON.stringify(data, null, 2));
        setPrompt("");
      }
    } catch (err: any) {
      setResponse(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const tierColor = (tier: string) => {
    if (tier === "legendary") return "var(--gold)";
    if (tier === "rare") return "var(--blue)";
    if (tier === "common") return "var(--text)";
    return "var(--border)";
  };

  return (
    <div className="space-y-6">
      {/* Balance + Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="terminal-box">
          <div className="text-xs text-[var(--border)] mb-1">CREDIT BALANCE</div>
          <div className="text-3xl font-bold" style={{ color: (stats?.creditBalance || 0) > 1_000_000 ? "var(--gold)" : "var(--text)" }}>
            {(stats?.creditBalance || 0).toLocaleString()}
          </div>
          <div className="text-xs text-[var(--border)] mt-1">≈ ${((stats?.creditBalance || 0) / 10000).toFixed(2)} USD value</div>
        </div>
        <div className="terminal-box">
          <div className="text-xs text-[var(--border)] mb-1">THIS SESSION</div>
          <div className="text-sm space-y-1">
            <div>Tokens used: <span className="text-[var(--green)]">{(stats?.totalTokensUsed || 0).toLocaleString()}</span></div>
            <div>Requests: <span className="text-[var(--green)]">{stats?.totalRequests || 0}</span></div>
            <div>Saved: <span className="text-[var(--gold)]">${savedCredits.toFixed(2)}</span></div>
            <div>
              NFT Tier:{" "}
              <span style={{ color: tierColor(stats?.nftTier || "none") }}>
                {stats?.nftTier?.toUpperCase() || "NONE"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Setup */}
      {!keyCreated && (
        <div className="terminal-box halftone-dot text-center py-8">
          <div className="text-lg mb-2">Get your API key to start</div>
          <button className="btn-primary" onClick={handleCreateKey} disabled={loading}>
            {loading ? "GENERATING..." : "CREATE API KEY"}
          </button>
        </div>
      )}

      {keyCreated && apiKey && (
        <>
          <div className="terminal-box-gold">
            <div className="text-xs text-[var(--border)] mb-2">YOUR API KEY (COPY NOW — SHOWN ONLY ONCE)</div>
            <div className="font-mono text-sm text-[var(--green)] break-all bg-[var(--bg)] p-3 select-all">{apiKey}</div>
            <div className="mt-3 text-xs text-[var(--border)]">
              <code className="text-[var(--green)]">export TOKENFALL_API_KEY=&quot;{apiKey}&quot;</code>
            </div>
          </div>

          {/* Quick Model Terminal */}
          <div className="terminal-box">
            <div className="text-xs text-[var(--border)] mb-2">QUICK MODEL — try it here</div>
            <div className="flex gap-2 mb-3">
              <select className="w-48" defaultValue="auto">
                <option value="auto">auto (smart route)</option>
                <option value="groq-llama-3.1-8b">Groq Llama 3.1 8B</option>
                <option value="glm-4.7-flash">GLM-4.7 Flash (free)</option>
              </select>
            </div>
            <textarea
              className="w-full bg-[var(--bg)] text-[var(--green)] border border-[var(--border)] p-3 font-mono text-sm resize-none"
              rows={3}
              placeholder="> Type a prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendPrompt();
                }
              }}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-[var(--border)] cursor-blink">
                model: auto // cost: ~0.028c per request
              </span>
              <button className="btn-primary text-sm" onClick={handleSendPrompt} disabled={loading}>
                {loading ? "..." : "SEND"}
              </button>
            </div>
            {response && (
              <div className="mt-4 p-3 bg-[var(--bg)] border border-[var(--border)] font-mono text-sm whitespace-pre-wrap text-[var(--text)]">
                {response}
              </div>
            )}
          </div>
        </>
      )}

      {/* Quick Start Code */}
      {keyCreated && (
        <div className="terminal-box">
          <div className="text-xs text-[var(--border)] mb-2">QUICK START — drop-in OpenAI replacement</div>
          <pre className="bg-[var(--bg)] p-4 text-xs text-[var(--green)] overflow-x-auto">
{`# Python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.tokenfall.io/v1",
    api_key="${apiKey.slice(0, 12)}..."
)

response = client.chat.completions.create(
    model="groq-llama-3.1-8b",  # or "auto" for smart routing
    messages=[{"role": "user", "content": "Hello, TokenFall!"}]
)
print(response.choices[0].message.content)`}
          </pre>
          <div className="mt-2 text-xs text-[var(--border)]">
            All models at <Link href="/models" className="text-[var(--gold)] hover:underline">/models</Link>
            {" "}|{" "}
            Full docs at <Link href="/docs" className="text-[var(--gold)] hover:underline">/docs</Link>
          </div>
        </div>
      )}
    </div>
  );
}
