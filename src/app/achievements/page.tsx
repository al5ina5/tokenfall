"use client";

import { useEffect, useState } from "react";
import { nanoid } from "nanoid";

interface Badge {
  badgeKey: string; tier: string; earnedAt: string; discount: number;
}
interface Progress {
  current: number; nextThreshold: number; pct: number;
}

export default function AchievementsPage() {
  const [userId] = useState(() => {
    if (typeof window === "undefined") return "";
    const s = localStorage.getItem("tokenfall_user_id") || nanoid();
    localStorage.setItem("tokenfall_user_id", s); return s;
  });
  const [earned, setEarned] = useState<Badge[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [stats, setStats] = useState({ requests: 0, tokens: 0, modelsUsed: 0 });
  const [totalSaved, setTotalSaved] = useState(0);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/achievements?userId=${userId}`).then(r => r.json()).then(d => {
      setEarned(d.earned || []);
      setProgress(d.progress || {});
      setStats(d.stats || {});
      const saved = (d.earned || []).reduce((acc: number, b: Badge) => acc + (b.discount * 2.5), 0);
      setTotalSaved(saved);
    });
  }, [userId]);

  const tierChar = (t: string) => t === "Diamond" ? "✦" : t === "Gold" ? "★" : t === "Silver" ? "◆" : "●";
  const tierClass = (t: string) => t === "Diamond" ? "badge-accent" : t === "Gold" ? "badge-accent" : t === "Silver" ? "badge-success" : "badge";
  const badgeColors: Record<string, string> = { prompt_pioneer: "var(--color-terminal)", token_whale: "var(--color-accent-text)", model_explorer: "var(--color-success)", referral_lord: "var(--color-warning)" };

  const BADGES = [
    { key: "prompt_pioneer", name: "Prompt Pioneer", desc: "API calls made", current: stats.requests, max: 10000, tiers: "Bronze · 100 / Silver · 1K / Gold · 10K" },
    { key: "token_whale", name: "Token Whale", desc: "Tokens consumed", current: stats.tokens, max: 10_000_000_000, tiers: "Silver · 100M / Gold · 1B / Diamond · 10B" },
    { key: "model_explorer", name: "Model Explorer", desc: "Different models used", current: stats.modelsUsed, max: 10, tiers: "Bronze · 3 / Gold · 10" },
    { key: "referral_lord", name: "Referral Lord", desc: "Signups through your link", current: 0, max: 50, tiers: "Silver · 5 / Diamond · 50" },
  ];

  return (
    <div>
      <pre className="ascii-lg" style={{ marginBottom: "var(--space-9)" }}>
{` █████╗  ██████╗██╗  ██╗██╗███████╗██╗   ██╗███████╗███╗   ███╗███████╗███╗   ██╗████████╗███████╗
██╔══██╗██╔════╝██║  ██║██║██╔════╝██║   ██║██╔════╝████╗ ████║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
███████║██║     ███████║██║█████╗  ██║   ██║█████╗  ██╔████╔██║█████╗  ██╔██╗ ██║   ██║   ███████╗
██╔══██║██║     ██╔══██║██║██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║   ╚════██║
██║  ██║╚██████╗██║  ██║██║███████╗ ╚████╔╝ ███████╗██║ ╚═╝ ██║███████╗██║ ╚████║   ██║   ███████║
╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝╚══════╝  ╚═══╝  ╚══════╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝`}
      </pre>

      <div className="section-header"><h2 className="section-title">Your Badges</h2></div>

      {earned.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", marginBottom: "var(--space-9)" }}>
          <pre className="ascii-lg" style={{ color: "var(--color-text-tertiary)", marginBottom: "var(--space-4)" }}>
{`╔══════════════╗
║  NO BADGES   ║
║  YET         ║
╚══════════════╝`}
          </pre>
          <div className="empty-state-text">Make API calls, use different models, and refer friends to earn achievement badges. Each badge unlocks permanent discounts.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-9)" }}>
          {earned.map(b => (
            <div key={`${b.badgeKey}_${b.tier}`} className="stat-card halftone-diagonal" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "var(--space-1)", color: badgeColors[b.badgeKey] || "var(--color-accent-text)" }}>
                {tierChar(b.tier)}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "2px" }}>
                {b.tier}
              </div>
              <div style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)", marginBottom: "var(--space-1)" }}>
                {BADGES.find(x => x.key === b.badgeKey)?.name || b.badgeKey}
              </div>
              {b.discount > 0 && (
                <span className="badge badge-accent">{b.discount}% off</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="section-header"><h2 className="section-title">Progress</h2></div>
      <div style={{ display: "grid", gap: "var(--space-4)", marginBottom: "var(--space-9)" }}>
        {BADGES.map(b => {
          const earnedTier = earned.find(e => e.badgeKey === b.key);
          const pct = Math.min(100, Math.round((b.current / Math.max(1, b.max)) * 100));
          return (
            <div key={b.key} className="card" style={{ opacity: earnedTier ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--color-text-primary)" }}>{b.name}</div>
                  <div style={{ fontSize: "var(--text-caption)", color: "var(--color-text-secondary)" }}>{b.desc}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {earnedTier ? (
                    <span className={tierClass(earnedTier.tier)}>{earnedTier.tier} earned</span>
                  ) : (
                    <span style={{ fontSize: "var(--text-caption)", color: "var(--color-terminal-dim)" }}>{b.current.toLocaleString()} / {b.max >= 1e9 ? `${b.max/1e9}B` : b.max >= 1e6 ? `${b.max/1e6}M` : b.max.toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div style={{ height: "4px", background: "var(--color-border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: pct + "%", background: "var(--color-terminal)", transition: "width 0.5s" }} />
              </div>
              <div style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)", marginTop: "var(--space-1)" }}>{b.tiers}</div>
            </div>
          );
        })}
      </div>

      {totalSaved > 0 && (
        <div className="card-accent">
          <pre className="ascii-lg" style={{ textAlign: "center", color: "var(--color-accent-text)", marginBottom: "var(--space-3)" }}>
{"+========================================+\n|  YOU'VE SAVED $" + totalSaved.toFixed(2) + " FROM ACHIEVEMENTS    |\n|  THAT'S REAL MONEY. KEEP GOING.         |\n+========================================+"}
          </pre>
        </div>
      )}
    </div>
  );
}
