export default function DocsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Docs</h1>
          <p className="page-subtitle">Everything you need to integrate TokenFall into your application.</p>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Quick Start</h2>
        </div>
        <div className="card">
          <p style={{ fontSize: "var(--text-body)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
            TokenFall is a drop-in replacement for the OpenAI API. Change your base URL and API key. That's it.
          </p>
          <pre className="code-block">
{`# Python
pip install openai

from openai import OpenAI
client = OpenAI(
    base_url="https://api.tokenfall.io/v1",
    api_key="tf_sk_YOUR_KEY"
)

# JavaScript / TypeScript
import OpenAI from "openai";
const client = new OpenAI({
    baseURL: "https://api.tokenfall.io/v1",
    apiKey: "tf_sk_YOUR_KEY",
});

# cURL
curl https://api.tokenfall.io/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer tf_sk_YOUR_KEY" \\
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'`}
          </pre>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Available Models</h2>
        </div>
        <div className="card">
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {[
              { tier: "success", label: "Budget", name: "DeepSeek V4 Flash", price: "$0.28/M", desc: "Our flagship. 1M context. Serves 80% of traffic." },
              { tier: "success", label: "Budget", name: "Groq Llama 3.1 8B", price: "$0.10/M", desc: "Fastest inference. Latency-critical workloads." },
              { tier: "success", label: "Free", name: "GLM-4.7 Flash", price: "FREE", desc: "Powers our free tier. 1M tokens/month, no cost." },
              { tier: "warning", label: "Quality", name: "Gemini 3 Flash", price: "$3.00/M", desc: "Solid all-rounder. Multimodal capable." },
              { tier: "accent", label: "Premium", name: "Claude Opus 4.8", price: "$25.00/M", desc: "Best coding model. Coming soon." },
            ].map((m) => (
              <div key={m.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}>
                <div>
                  <div style={{ fontSize: "var(--text-body)", fontWeight: 500, color: "var(--color-text-primary)" }}>{m.name}</div>
                  <div style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)" }}>{m.desc}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                  <span className={`badge badge-${m.tier}`}>{m.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body-sm)", fontWeight: 600, color: "var(--color-accent-text)" }}>{m.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Smart Routing</h2>
        </div>
        <div className="card">
          <p style={{ fontSize: "var(--text-body)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>
            Use <code style={{ color: "var(--color-accent-text)", fontSize: "0.9em" }}>model: "auto"</code> and TokenFall selects the cheapest capable model for every request.
          </p>
          <div style={{ display: "grid", gap: "var(--space-2)", fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)" }}>
            <div>· Coding tasks → DeepSeek V4 Flash</div>
            <div>· Simple chat → GLM Flash (free)</div>
            <div>· Latency-critical → Groq</div>
            <div>· High quality → Gemini / Claude</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Pricing</h2>
        </div>
        <div className="card">
          <p style={{ fontSize: "var(--text-body)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
            Pay per token. 10-30% below OpenRouter because we don't pay credit card processing fees.
          </p>
          <div style={{ display: "grid", gap: "var(--space-1)", fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)" }}>
            <div>· Pay with crypto (SOL, USDC, $SONIC) — near-zero fees</div>
            <div>· NFT holders get 5–20% discounts</div>
            <div>· Free tier: 1M tokens/month (GLM Flash)</div>
            <div>· No hidden charges. No subscription required.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
