"use client";

import { useState } from "react";

export default function GenesisPage() {
  const [minting, setMinting] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [tier, setTier] = useState("");
  const [showMint, setShowMint] = useState(false);

  const handleMint = () => {
    setMinting(true);
    setShowMint(true);
    setTimeout(() => {
      const roll = Math.random() * 100;
      const t = roll < 60 ? "Common" : roll < 90 ? "Rare" : "Legendary";
      setTier(t);
      setRevealed(true);
      setMinting(false);
    }, 2500);
  };

  const resetMint = () => {
    setShowMint(false); setRevealed(false); setTier("");
  };

  const tierBorder = tier === "Legendary" ? "var(--color-accent)" : tier === "Rare" ? "var(--color-success)" : "var(--color-text-secondary)";
  const tierLabel = tier === "Legendary" ? "badge badge-accent" : tier === "Rare" ? "badge badge-success" : "badge";
  const remaining = 7284; // hardcoded post-mint count

  return (
    <div>
      <pre className="ascii-lg" style={{ marginBottom: "var(--space-9)" }}>
{` ██████╗ ███████╗███╗   ██╗███████╗███████╗██╗███████╗
██╔════╝ ██╔════╝████╗  ██║██╔════╝██╔════╝██║██╔════╝
██║  ███╗█████╗  ██╔██╗ ██║█████╗  ███████╗██║███████╗
██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ╚════██║██║╚════██║
╚██████╔╝███████╗██║ ╚████║███████╗███████║██║███████║
 ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝╚══════╝

         ██████╗  █████╗ ███████╗███████╗
         ██╔══██╗██╔══██╗██╔════╝██╔════╝
         ██████╔╝███████║███████╗███████╗
         ██╔═══╝ ██╔══██║╚════██║╚════██║
         ██║     ██║  ██║███████║███████║
         ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝`}
      </pre>

      {!showMint ? (
        <div className="empty-state" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <pre className="ascii-lg" style={{ color: "var(--color-terminal)", marginBottom: "var(--space-4)" }}>
{"+========================================+\n|  10,000 unique passes. 3 tiers.     |\n|  Hold to unlock discounts, premium  |\n|  models, and revenue sharing.       |\n+========================================+"}
          </pre>
          <div className="empty-state-text">Mint your Genesis Pass to unlock permanent API discounts. Common (60%), Rare (30%), Legendary (10%).</div>
          <div style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)", marginBottom: "var(--space-4)" }}>
            {remaining.toLocaleString()} remaining · 0.1 SOL per mint
          </div>
          <button className="btn btn-lg btn-primary" onClick={handleMint}>
            MINT GENESIS PASS — 0.1 SOL
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "var(--space-12) 0" }}>
          {minting ? (
            /* Minting animation */
            <div style={{ maxWidth: "320px", margin: "0 auto" }}>
              <div className="card card-halftone" style={{ padding: "var(--space-12)", animation: "shimmer 1.5s infinite" }}>
                <div style={{ fontSize: "2rem", color: "var(--color-text-tertiary)", animation: "blink 0.5s infinite" }}>
                  ▓▓▓▓▓▓▓▓
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h3)", color: "var(--color-text-tertiary)", marginTop: "var(--space-3)" }}>
                  MINTING...
                </div>
                <div style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)", marginTop: "var(--space-2)" }}>
                  Resolving halftone...
                </div>
              </div>
            </div>
          ) : revealed ? (
            /* Revealed card */
            <div>
              <div style={{ maxWidth: "320px", margin: "0 auto var(--space-9)", border: `2px solid ${tierBorder}`, background: tier === "Legendary" ? "var(--color-accent-subtle)" : "var(--color-surface)", padding: "var(--space-9)" }}>
                <pre className="ascii-lg" style={{ color: tierBorder, marginBottom: "var(--space-4)" }}>
{`┌─────────────────────┐
│  █▀▀ █▀▀ █▄░█ █▀▀ █▀▀  │
│  █▄█ ██▄ █░▀█ ██▄ ▀▀█  │
│  ▀░▀ ▀▀▀ ▀░░▀ ▀▀▀ ▀▀▀  │
│                       │
│  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  │
│   HALFTONE ARTWORK    │
│  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  │
│                       │
│   #2847               │
└─────────────────────┘`}
                </pre>
                <span className={tierLabel} style={{ fontSize: "var(--text-body)", fontWeight: 700 }}>{tier.toUpperCase()}</span>
                <div style={{ marginTop: "var(--space-2)", fontSize: "var(--text-caption)", color: "var(--color-text-secondary)" }}>
                  Genesis Pass #{Math.floor(Math.random() * 3000) + 1000}
                </div>
              </div>

              <div className="card-accent" style={{ marginTop: "var(--space-6)", maxWidth: "500px", margin: "0 auto" }}>
                <div className="alert-title">Perks</div>
                <div style={{ display: "grid", gap: "var(--space-1)", fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)" }}>
                  <div>· {tier === "Legendary" ? "20" : tier === "Rare" ? "10" : "5"}% permanent API discount</div>
                  <div>· {tier === "Legendary" ? "Unlimited" : tier === "Rare" ? "2x" : "1x"} rate limits</div>
                  {tier === "Legendary" && <div>· Revenue share from platform fees</div>}
                  {tier !== "Common" && <div>· Premium model access</div>}
                </div>
              </div>

              <div style={{ marginTop: "var(--space-6)" }}>
                <button className="btn btn-outline" onClick={resetMint}>Mint Another</button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Tiers explainer */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginTop: "var(--space-12)" }}>
        {[
          { name: "Common", pct: "60%", discount: "5%", limits: "Basic", color: "var(--color-text-secondary)", badge: "badge" },
          { name: "Rare", pct: "30%", discount: "10%", limits: "2x · Premium", color: "var(--color-success)", badge: "badge badge-success" },
          { name: "Legendary", pct: "10%", discount: "20%", limits: "Unlimited · Rev Share", color: "var(--color-accent-text)", badge: "badge badge-accent" },
        ].map(t => (
          <div key={t.name} className="stat-card" style={{ textAlign: "center", borderColor: t.color, borderWidth: "2px" }}>
            <span className={t.badge} style={{ marginBottom: "var(--space-2)" }}>{t.name}</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-h1)", fontWeight: 700, color: t.color, marginTop: "var(--space-2)" }}>{t.pct}</div>
            <div style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)" }}>rarity</div>
            <div style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)", marginTop: "var(--space-2)" }}>{t.discount} discount · {t.limits}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
