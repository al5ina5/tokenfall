"use client";

import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import Link from "next/link";
import { BrowserProvider, parseEther } from "ethers";
import { PLANS } from "@/lib/plans"

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

const SONIC_CHAIN_ID = "0x92"; // 146
const SONIC_CHAIN = {
  chainId: SONIC_CHAIN_ID,
  chainName: "Sonic",
  nativeCurrency: { name: "Sonic", symbol: "S", decimals: 18 },
  rpcUrls: ["https://rpc.soniclabs.com"],
  blockExplorerUrls: ["https://sonicscan.org"],
};

interface UserStats {
  creditBalance: number;
  hasVerifiedPurchase: boolean;
  nftTier: string;
  totalTokensUsed: number;
  totalRequests: number;
  walletAddress: string | null;
}


export default function Dashboard() {
  const [userId, setUserId] = useState("");
  const [wallet, setWallet] = useState("");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [step, setStep] = useState<"connect" | "topup" | "keys" | "ready">("connect");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("auto");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [keyCreated, setKeyCreated] = useState(false);
  const [savedCredits, setSavedCredits] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // Init user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("tokenfall_user_id");
    const id = stored || nanoid();
    if (!stored) localStorage.setItem("tokenfall_user_id", id);
    setUserId(id);

    const w = localStorage.getItem("tokenfall_wallet");
    if (w) {
      setWallet(w);
      fetchStats(id);
    } else {
      setInitialized(true);
    }
  }, []);

  const fetchStats = async (uid: string) => {
    try {
      const res = await fetch(`/api/users?userId=${uid}`);
      const data = await res.json();
      if (data.error) {
        setStats({ creditBalance: 0, hasVerifiedPurchase: false, nftTier: "none", totalTokensUsed: 0, totalRequests: 0, walletAddress: null });
        setStep("connect");
      } else {
        setStats(data);
        const saved = Math.round((data.totalTokensUsed / 1_000_000) * 0.1 * 100) / 100;
        setSavedCredits(saved);
        if (!data.hasVerifiedPurchase || (data.creditBalance || 0) <= 0) setStep("topup");
        else setStep("keys");
      }
      } catch {
        setStep("connect");
      } finally {
        setInitialized(true);
      }
  };

  const connectWallet = async () => {
    setError("");
    if (!window.ethereum) {
      setError("Install MetaMask or another EVM wallet to continue.");
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      try {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SONIC_CHAIN_ID }] });
      } catch {
        await window.ethereum.request({ method: "wallet_addEthereumChain", params: [SONIC_CHAIN] });
      }
      const provider = new BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      localStorage.setItem("tokenfall_wallet", address);
      setWallet(address);
      await fetchStats(userId);
      setStep("topup");
    } catch {
      setError("Wallet connection was cancelled.");
    }
  };

  const handleTopUp = async () => {
    setLoading(true);
    setError("");
    try {
      const plan = PLANS[selectedPlan as keyof typeof PLANS];
      if (!plan) { setError("Select a plan before paying."); setLoading(false); return; }

      if (!window.ethereum) {
        setError("Connect MetaMask or another EVM wallet to pay.");
        setLoading(false);
        return;
      }

      const configResponse = await fetch("/api/payment-config");
      const config = await configResponse.json();
      if (!config.configured) {
        setError("Payments are not configured yet. Add PAYMENT_WALLET_ADDRESS in Vercel.");
        setLoading(false);
        return;
      }

      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SONIC_CHAIN_ID }] });
      const provider = new BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const expectedWei = parseEther(plan.priceSonic);
      const transaction = await signer.sendTransaction({ to: config.recipient, value: expectedWei });
      const res = await fetch("/api/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, walletAddress: wallet, txHash: transaction.hash, planId: plan.id }),
      });
      const data = await res.json();

      if (data.error) { setError(data.error); setLoading(false); return; }
      setStats(prev => ({ ...prev!, creditBalance: data.creditBalance }));
      setStep("keys");
    } catch (e: any) {
      setError(e.message || "Top-up failed.");
    }
    setLoading(false);
  };

  const createApiKey = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ name: "primary", walletAddress: wallet }),
      });
      const data = await res.json();
      if (data.key) { setApiKey(data.key); setKeyCreated(true); setStep("ready"); }
      else setError("Failed to generate key.");
    } catch { setError("Network error."); }
    setLoading(false);
  };

  const handleSendPrompt = async () => {
    if (!prompt.trim() || !apiKey) return;
    setLoading(true); setResponse(""); setError("");
    try {
      const res = await fetch("/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: selectedModel, messages: [{ role: "user", content: prompt }], stream: false }),
      });
      const data = await res.json();
      if (data.error) setError(data.error.message);
      else { setResponse(data.choices?.[0]?.message?.content || JSON.stringify(data)); setPrompt(""); }
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const tierLabel = (t: string) => ({ none: "None", common: "Common", rare: "Rare", legendary: "Legendary" }[t] || t);

  if (!initialized) {
    return (
      <div className="card hero-halftone" style={{ minHeight: "360px", display: "grid", placeItems: "center" }}>
        <div className="ascii-box">LOADING TOKENFALL...</div>
      </div>
    );
  }

  return (
    <div>
      {/* ASCII header */}
      <pre className="ascii-lg" style={{ marginBottom: "var(--space-9)" }}>
{`████████╗ ██████╗ ██╗  ██╗███████╗███╗   ██╗███████╗ █████╗ ██╗     ██╗
╚══██╔══╝██╔═══██╗██║ ██╔╝██╔════╝████╗  ██║██╔════╝██╔══██╗██║     ██║
   ██║   ██║   ██║█████╔╝ █████╗  ██╔██╗ ██║█████╗  ███████║██║     ██║
   ██║   ██║   ██║██╔═██╗ ██╔══╝  ██║╚██╗██║██╔══╝  ██╔══██║██║     ██║
   ██║   ╚██████╔╝██║  ██╗███████╗██║ ╚████║██║     ██║  ██║███████╗███████╗
   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝`}
      </pre>

      {/* STEP 1: Connect wallet */}
      {step === "connect" && (
        <div className="empty-state" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <pre className="ascii-lg" style={{ marginBottom: "var(--space-4)", color: "var(--color-terminal-dim)" }}>
{`╔══════════════════════════════╗
║  CONNECT WALLET TO BEGIN     ║
╚══════════════════════════════╝`}
          </pre>
          <div className="empty-state-text">Connect your Sonic EVM wallet to buy AI tokens at prices that should be illegal.</div>
          <button className="btn btn-lg btn-primary" onClick={connectWallet}>
            Connect Wallet →
          </button>
        </div>
      )}

      {/* STEP 2: Choose plan / top up */}
      {(step === "topup" || step === "connect") && wallet && (
        <div>
          <div className="section-header" style={{ marginTop: step === "topup" ? 0 : "var(--space-9)" }}>
            <h2 className="section-title">Choose Your Plan</h2>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-caption)", color: "var(--color-terminal-dim)" }}>
              wallet: {wallet.slice(0, 6)}...{wallet.slice(-4)}
            </span>
          </div>
          <div className="plans-grid">
            {Object.values(PLANS).map((p) => (
              <button
                type="button"
                key={p.id}
                className={`plan-card ${selectedPlan === p.id ? "selected" : ""}`}
                onClick={() => setSelectedPlan(p.id)}
                aria-pressed={selectedPlan === p.id}
              >
                <div className="plan-name">{p.name}</div>
                <div className="plan-price">{p.priceSonic} S</div>
                <div className="plan-detail">{p.label}</div>
                <div className="plan-detail">{p.id === "architect" ? "premium models + priority" : p.id === "builder" ? "budget models + priority" : "budget models"}</div>
              </button>
            ))}
          </div>

          <div className="card-accent" style={{ marginBottom: "var(--space-6)" }}>
            <div className="field-label">Payment</div>
            <div style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)" }}>
              Native Sonic <strong style={{ color: "var(--color-accent-text)" }}>S</strong> payment. Your transaction is verified before credits or API keys unlock.
            </div>
          </div>

          <button className="btn btn-lg btn-primary" onClick={handleTopUp} disabled={loading || !selectedPlan} style={{ width: "100%" }}>
            {loading ? "Waiting for Sonic..." : selectedPlan ? `Pay ${PLANS[selectedPlan as keyof typeof PLANS].priceSonic} S · Buy ${PLANS[selectedPlan as keyof typeof PLANS].label}` : "Choose a plan"}
          </button>
          {error && <div className="field-error" style={{ marginTop: "var(--space-3)", textAlign: "center" }}>{error}</div>}
        </div>
      )}

      {/* STEP 3: Create key */}
      {step === "keys" && (
        <div style={{ marginTop: wallet ? 0 : "var(--space-9)" }}>
          <div className="empty-state" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <pre className="ascii-lg" style={{ marginBottom: "var(--space-4)", color: "var(--color-accent-text)" }}>
{`╔══════════════════════════════╗
║  CREDITS LOADED              ║
║  CREATE YOUR FIRST API KEY   ║
╚══════════════════════════════╝`}
            </pre>
            <div className="empty-state-text">
              Drop-in replacement for OpenAI. Same SDK. Same format. Just cheaper.
            </div>
            <button className="btn btn-lg btn-primary" onClick={createApiKey} disabled={loading}>
              {loading ? "Generating..." : "Generate API Key"}
            </button>
            {error && <div className="field-error" style={{ marginTop: "var(--space-3)" }}>{error}</div>}
          </div>
        </div>
      )}

      {/* STEP 4: Ready — stats + key + terminal */}
      {step === "ready" && apiKey && (
        <div>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-9)" }}>
            <div className="stat-card halftone">
              <div className="stat-label">Credits</div>
              <div className="stat-value" style={{ color: stats && stats.creditBalance > 0 ? "var(--color-terminal)" : "var(--color-text-tertiary)" }}>
                {stats ? stats.creditBalance.toLocaleString() : "—"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Tokens Used</div>
              <div className="stat-value" style={{ fontSize: "var(--text-h1)", color: "var(--color-terminal)" }}>
                {stats ? stats.totalTokensUsed.toLocaleString() : "—"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">You Saved</div>
              <div className="stat-value" style={{ fontSize: "var(--text-h1)", color: "var(--color-accent-text)" }}>
                ${savedCredits.toFixed(2)}
              </div>
            </div>
            <div className="stat-card halftone-diagonal">
              <div className="stat-label">NFT Tier</div>
              <div className="stat-value" style={{ fontSize: "var(--text-h2)" }}>
                <span className={`badge ${stats?.nftTier === "legendary" ? "badge-accent" : stats?.nftTier === "rare" ? "badge-success" : ""}`}>
                  {tierLabel(stats?.nftTier || "none")}
                </span>
              </div>
            </div>
          </div>

          {/* API Key */}
          <div className="alert-accent" style={{ marginBottom: "var(--space-9)" }}>
            <div className="alert-title">Your API Key — copy now, shown only once</div>
            <div className="key-display">{apiKey}</div>
            <div style={{ marginTop: "var(--space-3)", fontSize: "var(--text-caption)", color: "var(--color-terminal-dim)" }}>
              export TOKENFALL_API_KEY=&quot;{apiKey.slice(0, 16)}...&quot;
            </div>
          </div>

          {/* Quick Model */}
          <div style={{ marginBottom: "var(--space-9)" }}>
            <div className="section-header">
              <h2 className="section-title">Quick Model</h2>
              <span style={{ fontSize: "var(--text-caption)", color: "var(--color-terminal-dim)" }}>
                $0.00014 per 1K tokens · <span className="typewriter" style={{ color: "var(--color-accent-text)" }}>auto routing</span>
              </span>
            </div>
            <div className="card card-halftone">
              <div style={{ marginBottom: "var(--space-3)" }}>
                <select style={{ maxWidth: "240px" }} value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)}>
                  <option value="auto">auto (smart route)</option>
                  <option value="groq-llama-3.1-8b">Groq Llama 3.1 8B</option>
                  <option value="glm-4.7-flash">GLM-4.7 Flash</option>
                </select>
              </div>
              <textarea
                rows={3} placeholder="> type a prompt..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendPrompt(); } }}
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-terminal)" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-3)" }}>
                <button className="btn btn-primary" onClick={handleSendPrompt} disabled={loading}>
                  {loading ? "..." : "Send ▸"}
                </button>
              </div>
              {error && <div className="field-error" style={{ marginTop: "var(--space-3)" }}>{error}</div>}
              {response && (
                <div className="code-block" style={{ marginTop: "var(--space-4)", color: "var(--color-text-primary)" }}>{response}</div>
              )}
            </div>
          </div>

          {/* Quick start */}
          <div>
            <div className="section-header"><h2 className="section-title">Quick Start</h2></div>
            <div className="card">
              <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
                Drop-in OpenAI replacement. Same SDK. Change base_url and api_key. Done.
              </p>
              <pre className="code-block">
{`# Python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.tokenfall.io/v1",
    api_key="${apiKey.slice(0, 16)}..."
)

response = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Hello"}]
)`}
              </pre>
              <div style={{ marginTop: "var(--space-4)", fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)" }}>
                <Link href="/models" style={{ color: "var(--color-accent-text)" }}>Browse models</Link>
                {" · "}
                <Link href="/keys" style={{ color: "var(--color-accent-text)" }}>Manage keys</Link>
                {" · "}
                <Link href="/docs" style={{ color: "var(--color-accent-text)" }}>Full docs</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
