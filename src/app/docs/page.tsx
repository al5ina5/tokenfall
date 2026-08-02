export default function DocsPage() {
  const models = [
    { tier: "success", name: "DeepSeek V4 Flash", price: "$0.28/M", desc: "Our flagship. 1M context. 80% of traffic." },
    { tier: "success", name: "Groq Llama 3.1 8B", price: "$0.10/M", desc: "Fastest inference. Latency-critical." },
    { tier: "success", name: "GLM-4.7 Flash", price: "FREE", desc: "Powers free tier. 1M tokens/month." },
    { tier: "warning", name: "Gemini 3 Flash", price: "$3.00/M", desc: "Solid all-rounder." },
    { tier: "accent", name: "Claude Opus 4.8", price: "$25.00/M", desc: "Best coding model. Coming soon." },
  ];

  return (
    <div>
      <pre className="ascii-lg" style={{ marginBottom: "var(--space-9)" }}>
{`██████╗  ██████╗  ██████╗███████╗
██╔══██╗██╔═══██╗██╔════╝██╔════╝
██║  ██║██║   ██║██║     ███████╗
██║  ██║██║   ██║██║     ╚════██║
██████╔╝╚██████╔╝╚██████╗███████║
╚═════╝  ╚═════╝  ╚═════╝╚══════╝`}
      </pre>

      <div className="section-header"><h2 className="section-title">Quick Start</h2></div>
      <div className="card card-halftone" style={{ marginBottom: "var(--space-9)" }}>
        <p style={{ fontSize: "var(--text-body)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
          Drop-in replacement for the OpenAI API. Change your base URL and API key. Done.
        </p>
        <pre className="code-block">
{`# Python
from openai import OpenAI
client = OpenAI(base_url="https://api.tokenfall.io/v1", api_key="tf_sk_YOUR_KEY")

# JS / TS
import OpenAI from "openai";
const client = new OpenAI({ baseURL: "https://api.tokenfall.io/v1", apiKey: "tf_sk_YOUR_KEY" });

# cURL
curl https://api.tokenfall.io/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer tf_sk_YOUR_KEY" \\
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'`}
        </pre>
      </div>

      <div className="section-header"><h2 className="section-title">Models</h2></div>
      <div className="card" style={{ marginBottom: "var(--space-9)" }}>
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          {models.map(m => (
            <div key={m.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--color-text-primary)" }}>{m.name}</div>
                <div style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)" }}>{m.desc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                <span className={`badge badge-${m.tier}`}>{m.tier === "accent" ? "Premium" : m.tier === "warning" ? "Quality" : "Budget"}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body-sm)", fontWeight: 700, color: "var(--color-accent-text)" }}>{m.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-header"><h2 className="section-title">Smart Routing</h2></div>
      <div className="card" style={{ marginBottom: "var(--space-9)" }}>
        <p style={{ fontSize: "var(--text-body)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>
          Use <code style={{ color: "var(--color-terminal)" }}>model: "auto"</code> — TokenFall picks the cheapest capable model.
        </p>
        <div style={{ display: "grid", gap: "var(--space-1)", fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)" }}>
          <div>· Coding → DeepSeek V4 Flash</div>
          <div>· Chat → GLM Flash (free)</div>
          <div>· Speed → Groq</div>
          <div>· Quality → Gemini / Claude</div>
        </div>
      </div>

      <div className="section-header"><h2 className="section-title">Pricing</h2></div>
      <div className="card card-halftone">
        <p style={{ fontSize: "var(--text-body)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
          Pay per token. 10–30% below OpenRouter — no credit card fees.
        </p>
        <div style={{ display: "grid", gap: "var(--space-1)", fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)" }}>
          <div>· Crypto payments (SOL, USDC, $SONIC) — near-zero fees</div>
          <div>· NFT holders get 5–20% discounts</div>
          <div>· Free tier: 1M tokens/month (GLM Flash)</div>
          <div>· No hidden charges. No subscription required.</div>
        </div>
      </div>
    </div>
  );
}
