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

  const fetchKeys = async () => {
    const res = await fetch(`/api/keys`, { headers: { "x-user-id": userId } });
    const data = await res.json();
    setKeys(data.keys || []);
  };

  useEffect(() => { fetchKeys(); }, [userId]);

  const createKey = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ name: newKeyName || "default" }),
      });
      const data = await res.json();
      data.key && setGeneratedKey(data.key);
      setNewKeyName("");
      fetchKeys();
    } catch {}
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
    <div className="space-y-6">
      <div>
        <pre className="ascii-title text-xs leading-tight text-[var(--text)]">
{` █████╗ ██████╗ ██╗    ██╗  ██╗███████╗██╗   ██╗███████╗
██╔══██╗██╔══██╗██║    ██║ ██╔╝██╔════╝╚██╗ ██╔╝██╔════╝
███████║██████╔╝██║    █████╔╝ █████╗   ╚████╔╝ ███████╗
██╔══██║██╔═══╝ ██║    ██╔═██╗ ██╔══╝    ╚██╔╝  ╚════██║
██║  ██║██║     ██║    ██║  ██╗███████╗   ██║   ███████║
╚═╝  ╚═╝╚═╝     ╚═╝    ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝`}
        </pre>
      </div>

      {/* Generate new key */}
      <div className="terminal-box">
        <div className="text-xs text-[var(--border)] mb-2">CREATE NEW API KEY</div>
        <div className="flex gap-2">
          <input
            placeholder="Key name (e.g., my-agent, production)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="w-64"
          />
          <button className="btn-primary text-sm" onClick={createKey} disabled={loading}>
            {loading ? "..." : "GENERATE"}
          </button>
        </div>
        {generatedKey && (
          <div className="mt-3 p-3 bg-[var(--bg)] border border-[var(--gold)]">
            <div className="text-xs text-[var(--gold)] mb-1">COPY NOW — SHOWN ONLY ONCE</div>
            <code className="text-[var(--green)] text-xs break-all select-all">{generatedKey}</code>
          </div>
        )}
      </div>

      {/* Existing keys */}
      {keys.length > 0 && (
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k.id} className="terminal-box">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm">{k.name}</div>
                  <code className="text-xs text-[var(--green)]">{k.prefix}</code>
                </div>
                <div className="flex gap-3 text-xs text-[var(--border)]">
                  <span>Limit: {k.monthlyLimit.toLocaleString()}</span>
                  <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                </div>
                <button className="text-xs text-[var(--red)] hover:underline" onClick={() => deleteKey(k.id)}>
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usage example */}
      <div className="terminal-box">
        <div className="text-xs text-[var(--border)] mb-2">USAGE</div>
        <pre className="bg-[var(--bg)] p-3 text-xs text-[var(--green)]">
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
