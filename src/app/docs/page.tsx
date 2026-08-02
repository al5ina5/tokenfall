export default function DocsPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <pre className="ascii-title text-xs leading-tight text-[var(--text)]">
{`██████╗  ██████╗  ██████╗███████╗
██╔══██╗██╔═══██╗██╔════╝██╔════╝
██║  ██║██║   ██║██║     ███████╗
██║  ██║██║   ██║██║     ╚════██║
██████╔╝╚██████╔╝╚██████╗███████║
╚═════╝  ╚═════╝  ╚═════╝╚══════╝`}
      </pre>

      <section className="terminal-box">
        <h2 className="text-lg mb-2" style={{ fontFamily: "'Times New Roman', serif" }}>Quick Start</h2>
        <p className="text-sm text-[var(--border)] mb-3">
          TokenFall is a drop-in replacement for the OpenAI API. Change your base URL and API key — that's it.
        </p>
        <pre className="bg-[var(--bg)] p-3 text-xs text-[var(--green)] overflow-x-auto">
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
      </section>

      <section className="terminal-box">
        <h2 className="text-lg mb-2" style={{ fontFamily: "'Times New Roman', serif" }}>Models</h2>
        <div className="space-y-3 text-sm">
          <div>
            <span className="badge badge-green">CHEAP</span>{" "}
            <span className="text-[var(--green)] font-bold">DeepSeek V4 Flash</span> — $0.28/M output. Our flagship. Serves 80% of traffic. 1M context.
          </div>
          <div>
            <span className="badge badge-green">CHEAP</span>{" "}
            <span className="text-[var(--green)] font-bold">Groq Llama 3.1 8B</span> — $0.10/M output. Fastest inference. Good for latency-critical.
          </div>
          <div>
            <span className="badge badge-green">CHEAP</span>{" "}
            <span className="text-[var(--green)] font-bold">GLM-4.7 Flash</span> — <span className="text-[var(--gold)]">FREE</span>. Powers our free tier.
          </div>
          <div>
            <span className="badge badge-orange">GOOD</span>{" "}
            <span className="text-[var(--orange)] font-bold">Gemini 3 Flash</span> — $3.00/M output. Solid all-rounder.
          </div>
          <div>
            <span className="badge badge-gold">BEST</span>{" "}
            <span className="text-[var(--gold)] font-bold">Claude Opus 4.8</span> — $25/M output. Premium. Coming soon.
          </div>
        </div>
      </section>

      <section className="terminal-box">
        <h2 className="text-lg mb-2" style={{ fontFamily: "'Times New Roman', serif" }}>Smart Routing</h2>
        <p className="text-sm text-[var(--border)]">
          Use <code className="text-[var(--green)]">model: "auto"</code> and TokenFall auto-selects the cheapest model that can handle your request.
          Coding task? Routes to DeepSeek. Simple chat? Routes to GLM Flash (free). Latency-critical? Routes to Groq.
        </p>
      </section>

      <section className="terminal-box">
        <h2 className="text-lg mb-2" style={{ fontFamily: "'Times New Roman', serif" }}>Pricing</h2>
        <p className="text-sm text-[var(--border)]">
          TokenFall charges per-token just like every AI API. 1 credit ≈ 1 token at cheap tier.
          Prices are 10-30% below OpenRouter because we don't pay credit card fees.
        </p>
        <div className="mt-3 text-xs space-y-1">
          <div>• Pay with crypto (SOL, USDC, $SONIC) — near-zero fees</div>
          <div>• NFT holders get 5-20% discounts</div>
          <div>• Free tier: 1M tokens/month (GLM Flash)</div>
          <div>• No hidden fees. No subscription required for pay-as-you-go.</div>
        </div>
      </section>
    </div>
  );
}
