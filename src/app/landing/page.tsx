"use client";

import { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [connected, setConnected] = useState(false);
  const [wallet, setWallet] = useState("");

  const connect = () => {
    const w = "0x" + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setWallet(w); setConnected(true);
    localStorage.setItem("tokenfall_wallet", w);
  };

  return (
    <div>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "var(--space-12) 0 var(--space-9)" }}>
        <pre className="ascii-lg" style={{ marginBottom: "var(--space-6)" }}>
{`████████╗ ██████╗ ██╗  ██╗███████╗███╗   ██╗███████╗ █████╗ ██╗     ██╗
╚══██╔══╝██╔═══██╗██║ ██╔╝██╔════╝████╗  ██║██╔════╝██╔══██╗██║     ██║
   ██║   ██║   ██║█████╔╝ █████╗  ██╔██╗ ██║█████╗  ███████║██║     ██║
   ██║   ██║   ██║██╔═██╗ ██╔══╝  ██║╚██╗██║██╔══╝  ██╔══██║██║     ██║
   ██║   ╚██████╔╝██║  ██╗███████╗██║ ╚████║██║     ██║  ██║███████╗███████╗
   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝`}
        </pre>

        <div className="card-accent" style={{ maxWidth: "640px", margin: "0 auto var(--space-9)", textAlign: "center" }}>
          <div className="alert-title" style={{ fontSize: "var(--text-h4)" }}>
            AI TOKENS AT PRICES THAT SHOULD BE ILLEGAL
          </div>
          <pre className="ascii-lg" style={{ color: "var(--color-text-primary)", marginTop: "var(--space-4)", marginBottom: "var(--space-4)" }}>
{`╔══════════════════════════════════════════════════════╗
║  DeepSeek V4 Flash ..... $0.28/M  (28 CENTS)         ║
║  Groq Llama 3.1 ........ $0.10/M  (10 CENTS)         ║
║  GLM-4.7 Flash ......... FREE    (1M tokens/month)   ║
║                                                      ║
║  ═══════════════════════════════════════════════════  ║
║  PAY WITH CRYPTO. EARN NFTs. STAKE. REPEAT.          ║
╚══════════════════════════════════════════════════════╝`}
          </pre>
          {!connected ? (
            <button className="btn btn-lg btn-primary" onClick={connect}>Connect Wallet →</button>
          ) : (
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-caption)", color: "var(--color-terminal)", marginBottom: "var(--space-3)" }}>
                wallet: {wallet.slice(0, 8)}...{wallet.slice(-6)}
              </div>
              <Link href="/" className="btn btn-lg btn-primary" style={{ textDecoration: "none" }}>Open Dashboard →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-12)" }}>
        {[
          { label: "MODELS ONLINE", value: "1", sub: "more coming" },
          { label: "GENESIS PASSES", value: "2,716", sub: "remaining of 10,000" },
          { label: "TOKENS SERVED", value: "8.4B", sub: "and counting" },
          { label: "ACTIVE AGENTS", value: "1,203", sub: "using TokenFall" },
        ].map(s => (
          <div key={s.label} className="stat-card halftone" style={{ textAlign: "center" }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: "var(--text-h1)", color: "var(--color-terminal)" }}>{s.value}</div>
            <div style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)", marginTop: "var(--space-1)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Feature cards */}
      <div className="section-header"><h2 className="section-title">How It Works</h2></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-12)" }}>
        {[
          { step: "01", title: "Connect Wallet", desc: "Solana wallet. One click. No KYC. Gas sponsored by us." },
          { step: "02", title: "Choose Plan", desc: "Starter ($5), Builder ($20), Architect ($50), or custom amount. Pay with SOL or USDC." },
          { step: "03", title: "Get API Keys", desc: "Drop-in OpenAI replacement. Same SDK. Just cheaper. 10-30% below OpenRouter." },
          { step: "04", title: "Mint & Stake", desc: "Genesis NFT Pass gives permanent discounts. Stake to earn passive credits." },
        ].map(f => (
          <div key={f.step} className="card">
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h2)", fontWeight: 700, color: "var(--color-accent-text)", marginBottom: "var(--space-1)" }}>{f.step}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h4)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "var(--space-1)" }}>{f.title}</div>
            <div style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)" }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="card-accent" style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h2)", fontWeight: 700, color: "var(--color-accent-text)", marginBottom: "var(--space-4)" }}>
          The Web3 AI Marketplace
        </div>
        <div className="price-tag" style={{ color: "var(--color-terminal)", fontSize: "var(--text-h1)", marginBottom: "var(--space-4)" }}>
          10-30% cheaper than OpenRouter
        </div>
        <div style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
          No credit card fees. No hidden charges. Crypto-native. NFT gamification.
        </div>
        {!connected && <button className="btn btn-lg btn-primary" onClick={connect}>Get Started — Connect Wallet</button>}
      </div>
    </div>
  );
}
