// app/(dashboard)/penalty-calculator/page.tsx
// Article 99 penalty exposure estimator — gated behind login, part of the
// dashboard tool suite. (The public, ungated version of this kind of tool is
// /check — that one exists purely to drive signups; everything past that,
// including this, lives inside the authenticated app.)

"use client";

import { useState } from "react";
import Link from "next/link";

interface Tier {
  id: string;
  label: string;
  sub: string;
  fixedCap: number;   // EUR
  pctCap: number;      // 0-1
  article: string;
}

const TIERS: Tier[] = [
  {
    id: "prohibited",
    label: "Prohibited AI practices",
    sub: "Social scoring, manipulative AI, banned biometric surveillance (Article 5)",
    fixedCap: 35_000_000,
    pctCap: 0.07,
    article: "Article 99(3)",
  },
  {
    id: "other",
    label: "Most other breaches",
    sub: "High-risk system requirements, transparency obligations, and most non-prohibited violations",
    fixedCap: 15_000_000,
    pctCap: 0.03,
    article: "Article 99(4)",
  },
  {
    id: "misinformation",
    label: "Incorrect information to authorities",
    sub: "Supplying incorrect, incomplete, or misleading information to a notified body or authority",
    fixedCap: 7_500_000,
    pctCap: 0.01,
    article: "Article 99(5)",
  },
];

function formatEUR(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toLocaleString("en-GB", { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `€${(n / 1_000).toLocaleString("en-GB", { maximumFractionDigits: 0 })}K`;
  return `€${n.toLocaleString("en-GB")}`;
}

export default function PenaltyCalculatorPage() {
  const [turnoverInput, setTurnoverInput] = useState("");
  const [isSME, setIsSME] = useState<boolean | null>(null);
  const [tierId, setTierId] = useState<string>(TIERS[1].id);

  const turnover = parseFloat(turnoverInput.replace(/[^0-9.]/g, "")) || 0;
  const tier = TIERS.find((t) => t.id === tierId)!;
  const pctAmount = turnover * tier.pctCap;
  const ready = turnover > 0 && isSME !== null;

  // SMEs: capped at the LOWER of the two figures. Everyone else: the HIGHER.
  const exposure = ready
    ? (isSME ? Math.min(tier.fixedCap, pctAmount) : Math.max(tier.fixedCap, pctAmount))
    : null;

  return (
    <div style={{ maxWidth: 680, width: "100%", fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
          letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6,
        }}>
          Article 99
        </div>
        <h1 style={{
          fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 28,
          fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px", letterSpacing: "-0.02em",
        }}>
          Penalty Exposure Calculator
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, maxWidth: 560, lineHeight: 1.6 }}>
          The EU AI Act's fines are calculated per violation, tiered by severity. Estimate your maximum exposure.
        </p>
      </div>

      <div className="p-5 sm:p-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, marginBottom: 24 }}>
        {/* Turnover input */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
            Annual global turnover
          </label>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "0 0 10px" }}>
            Fines are based on <em>global</em> turnover, not just EU revenue — enter your total.
          </p>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 15 }}>€</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="2,000,000"
              value={turnoverInput}
              onChange={(e) => setTurnoverInput(e.target.value)}
              style={{
                width: "100%", padding: "12px 14px 12px 30px", border: "1.5px solid var(--border)",
                borderRadius: 8, fontSize: 15, color: "var(--text-primary)", background: "var(--bg-card)",
                fontFamily: "Inter, sans-serif", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* SME toggle */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
            Is your organisation an SME?
          </label>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "0 0 10px" }}>
            Under 250 employees, and either ≤€50M annual turnover or ≤€43M balance sheet. SMEs are capped at the <strong>lower</strong> of the two figures below; larger organisations face the <strong>higher</strong> of the two.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ v: true, l: "Yes, we're an SME" }, { v: false, l: "No, we're larger" }].map((opt) => (
              <button
                key={String(opt.v)}
                onClick={() => setIsSME(opt.v)}
                className="card-hover"
                style={{
                  flex: 1, padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                  border: "1.5px solid", borderColor: isSME === opt.v ? "var(--btn-primary-bg)" : "var(--border)",
                  background: isSME === opt.v ? "var(--bg-subtle)" : "var(--bg-card)",
                  color: "var(--text-primary)", fontSize: 13.5, fontWeight: 500, fontFamily: "Inter, sans-serif",
                }}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {/* Tier selector */}
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>
            What kind of violation?
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TIERS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTierId(t.id)}
                className="card-hover"
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "14px 16px", border: "1.5px solid",
                  borderColor: tierId === t.id ? "var(--btn-primary-bg)" : "var(--border)",
                  borderRadius: 10, background: tierId === t.id ? "var(--bg-subtle)" : "var(--bg-card)",
                  cursor: "pointer", textAlign: "left", width: "100%", fontFamily: "Inter, sans-serif",
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  border: "1.5px solid", borderColor: tierId === t.id ? "var(--btn-primary-bg)" : "var(--border-strong)",
                  background: tierId === t.id ? "var(--btn-primary-bg)" : "var(--bg-card)",
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.label}</span>
                    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: "var(--text-muted)" }}>{t.article}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>{t.sub}</div>
                  <div style={{ fontSize: 12, color: "var(--warning)", fontFamily: "IBM Plex Mono, monospace", marginTop: 4 }}>
                    Up to {formatEUR(t.fixedCap)} or {(t.pctCap * 100).toFixed(0)}% of global turnover
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result */}
      {ready && exposure !== null && (
        <div style={{
          padding: "24px 28px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
          borderRadius: 14, marginBottom: 24, textAlign: "center",
        }}>
          <div style={{ fontSize: 12.5, color: "var(--danger)", fontWeight: 600, fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
            Maximum exposure
          </div>
          <div style={{ fontFamily: "IBM Plex Serif, serif", fontSize: 44, fontWeight: 700, color: "var(--danger)", letterSpacing: "-0.02em", marginBottom: 8 }}>
            {formatEUR(exposure)}
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
            {pctAmount === exposure ? (
              <>The {(tier.pctCap * 100).toFixed(0)}% turnover figure ({formatEUR(pctAmount)}) {isSME ? "is lower than" : "exceeds"} the flat cap ({formatEUR(tier.fixedCap)}), so it applies{isSME ? " as the SME cap" : ""}.</>
            ) : (
              <>The flat cap ({formatEUR(tier.fixedCap)}) {isSME ? "is lower than" : "exceeds"} {(tier.pctCap * 100).toFixed(0)}% of your stated turnover ({formatEUR(pctAmount)}), so it applies{!isSME ? " — turnover would need to exceed " + formatEUR(tier.fixedCap / tier.pctCap) + " before the percentage figure would take over" : ""}.</>
            )}
          </p>
        </div>
      )}

      {/* Educational note */}
      <div style={{
        padding: "16px 20px", background: "var(--info-bg)", border: "1px solid var(--info-border)",
        borderRadius: 10, fontSize: 13, color: "var(--info)", lineHeight: 1.6,
      }}>
        <strong>This is illustrative, not a legal or financial forecast.</strong> Actual fines are set by
        national supervisory authorities case by case, considering factors like intent, mitigation steps
        taken, and cooperation with regulators — not automatically applied at the maximum. See the{" "}
        <Link href="/learn#penalties" className="link-hover" style={{ color: "var(--info)", fontWeight: 600 }}>
          Article 99 guide
        </Link>{" "}
        for the full picture, and consult counsel for your actual exposure.
      </div>
    </div>
  );
}
