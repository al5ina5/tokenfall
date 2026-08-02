"use client";

import { useState } from "react";

export default function StakingPage() {
  const [activeTab, setActiveTab] = useState<"stake" | "positions">("stake");
  const [locked, setLocked] = useState(false);
  const [lockPeriod, setLockPeriod] = useState(90);

  const periods = [7, 30, 90, 365];
  const multipliers: Record<number, number> = { 7: 1, 30: 1.5, 90: 3, 365: 10 };

  const handleStake = () => { setLocked(true); };
  const handleUnstake = () => { setLocked(false); };

  const daysLeft = lockPeriod - 23; // simulated 23 days elapsed
  const progressPct = daysLeft > 0 ? Math.round((daysLeft / lockPeriod) * 100) : 0;

  return (
    <div>
      <pre className="ascii-lg" style={{ marginBottom: "var(--space-9)" }}>
{`███████╗████████╗ █████╗ ██╗  ██╗██╗███╗   ██╗ ██████╗
██╔════╝╚══██╔══╝██╔══██╗██║ ██╔╝██║████╗  ██║██╔════╝
███████╗   ██║   ███████║█████╔╝ ██║██╔██╗ ██║██║  ███╗
╚════██║   ██║   ██╔══██║██╔═██╗ ██║██║╚██╗██║██║   ██║
███████║   ██║   ██║  ██║██║  ██╗██║██║ ╚████║╚██████╔╝
╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝

███████╗ ██████╗ ██████╗  ██████╗ ███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
█████╗  ██║   ██║██████╔╝██║  ███╗█████╗
██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝
██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝`}
      </pre>

      {/* Positions */}
      {locked && (
        <div style={{ marginBottom: "var(--space-9)" }}>
          <div className="section-header"><h2 className="section-title">Your Stake</h2></div>
          <div className="card-accent">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-4)" }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h3)", fontWeight: 700, color: "var(--color-text-primary)" }}>
                  Genesis Pass #2847
                </div>
                <span className="badge badge-accent" style={{ marginTop: "var(--space-1)" }}>RARE</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)" }}>EARNING</div>
                <div className="price-tag">800</div>
                <div style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)" }}>credits/day</div>
              </div>
            </div>

            <div style={{ marginTop: "var(--space-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)", marginBottom: "var(--space-1)" }}>
                <span>Time remaining: {daysLeft} days</span>
                <span>{daysLeft}/{lockPeriod}</span>
              </div>
              <div style={{ height: "6px", background: "var(--color-border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: progressPct + "%", background: "repeating-linear-gradient(90deg, var(--color-terminal) 0px, var(--color-terminal) 4px, transparent 4px, transparent 8px)" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
              <button className="btn btn-primary btn-sm">Claim Rewards</button>
              <button className="btn btn-ghost" onClick={handleUnstake} style={{ color: "var(--color-error)" }}>
                UNSTAKE (15% PENALTY)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New stake */}
      <div className="section-header"><h2 className="section-title">{locked ? "Stake More" : "Lock & Earn"}</h2></div>

      <div className="card card-halftone" style={{ marginBottom: "var(--space-9)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
          {periods.map(p => (
            <div
              key={p}
              className={"plan-card" + (lockPeriod === p ? " selected" : "")}
              onClick={() => setLockPeriod(p)}
            >
              <div className="plan-name" style={{ fontSize: "var(--text-h4)" }}>{p} days</div>
              <div className="plan-price" style={{ fontSize: "var(--text-h2)" }}>{multipliers[p]}x</div>
              <div className="plan-detail">multiplier</div>
              <div className="plan-detail">{p === 365 ? "40% penalty" : p === 90 ? "15% penalty" : p === 30 ? "10% penalty" : "5% penalty"}</div>
            </div>
          ))}
        </div>

        <div className="card-accent" style={{ marginBottom: "var(--space-4)" }}>
          <pre className="ascii-lg" style={{ textAlign: "center", color: "var(--color-accent-text)" }}>
{"+==========================================+\n|  LOCK " + lockPeriod + " DAYS -> " + multipliers[lockPeriod] + "X MULTIPLIER                  |\n|  EARN " + (800 * multipliers[lockPeriod]) + " CREDITS/DAY STAKED            |\n|                                          |\n|  \"THE FORGE REWARDS THE PATIENT.\"        |\n+==========================================+"}
          </pre>
        </div>

        <button className="btn btn-lg btn-primary" style={{ width: "100%" }} onClick={handleStake}>
          STAKE GENESIS PASS
        </button>
      </div>

      {/* Info */}
      <div className="card" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)" }}>
        <div style={{ display: "grid", gap: "var(--space-1)" }}>
          <div>· Earn daily credit rewards while your NFT is locked</div>
          <div>· Longer lock = higher multiplier — up to 10x for 365 days</div>
          <div>· Early unstake burns a portion of your yield (shown as penalty %)</div>
          <div>· Credits can be used for API calls or transferred to other users</div>
          <div style={{ color: "var(--color-warning)", marginTop: "var(--space-2)" }}>⚠ Early unstake penalty is final. Credits are burned, not returned.</div>
        </div>
      </div>
    </div>
  );
}
