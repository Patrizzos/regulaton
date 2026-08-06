"use client";
// components/dashboard/ComplianceScoreRing.tsx
// Animated SVG ring that fills on mount. The visual centrepiece of the dashboard.

import { useEffect, useState } from "react";

const RADIUS   = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 339.3

function scoreToColour(score: number): string {
  if (score >= 80) return "var(--success)";
  if (score >= 50) return "var(--warning)";
  return "var(--danger)";
}

function scoreToLabel(score: number): string {
  if (score === 100) return "Fully compliant";
  if (score >= 80)   return "Almost there";
  if (score >= 60)   return "In progress";
  if (score >= 40)   return "Getting started";
  return "Action needed";
}

interface ComplianceScoreRingProps {
  score: number;
  size?: number; // px, default 140
}

export function ComplianceScoreRing({ score, size = 140 }: ComplianceScoreRingProps) {
  const [displayed, setDisplayed] = useState(0);
  const colour = scoreToColour(score);

  // Animate number up on mount
  useEffect(() => {
    const start = performance.now();
    const duration = 1000;
    const raf = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setDisplayed(Math.round(eased * score));
      if (t < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [score]);

  const offset = CIRCUMFERENCE * (1 - score / 100);
  const scale  = size / 130; // normalise to viewBox size

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 130 130"
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle
            cx="65" cy="65" r={RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth="10"
          />
          {/* Fill */}
          <circle
            cx="65" cy="65" r={RADIUS}
            fill="none"
            stroke={colour}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - displayed / 100)}
            style={{ transition: "stroke-dashoffset 0.05s linear, stroke 0.4s ease" }}
          />
        </svg>

        {/* Number */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: size * 0.24,
            fontWeight: 500,
            color: "var(--text-primary)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}>
            {displayed}
          </span>
          <span style={{
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: size * 0.09,
            color: "var(--text-muted)",
            marginTop: 2,
          }}>
            / 100
          </span>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 15,
          fontWeight: 600,
          color: colour,
          fontFamily: "IBM Plex Serif, Georgia, serif",
        }}>
          {scoreToLabel(score)}
        </div>
      </div>
    </div>
  );
}
