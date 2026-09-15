// components/shared/DemoBanner.tsx
//
// Shown at the top of the dashboard layout when ?demo=1 is in the URL
// or when the session token carries isDemo: true.
// Dismissible for the session (state in localStorage — not critical data).

"use client";

import { useState, useEffect } from "react";
import { useSearchParams }     from "next/navigation";

export function DemoBanner() {
  const searchParams = useSearchParams();
  const isDemo       = searchParams.get("demo") === "1";
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    if (!isDemo) return;
    const wasDismissed = sessionStorage.getItem("demo-banner-dismissed");
    setDismissed(!!wasDismissed);
  }, [isDemo]);

  if (!isDemo || dismissed) return null;

  return (
    <div
      role="banner"
      style={{
        background:     "var(--bg-accent)",
        borderBottom:   "1px solid var(--border-accent)",
        padding:        "10px 24px",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        gap:            16,
        fontSize:       13,
        color:          "var(--text-primary)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontWeight: 500 }}>
          You&apos;re viewing a demo account
        </span>
        <span style={{ color: "var(--text-secondary)" }}>
          — Hartmann &amp; Partner GmbH, pre-populated with realistic data.
          Changes you make are saved but this account will be deleted after 30 days.
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <a
          href="/login"
          style={{
            fontSize:        13,
            fontWeight:      500,
            color:           "var(--text-accent)",
            textDecoration:  "none",
          }}
        >
          Create your own account →
        </a>
        <button
          onClick={() => {
            sessionStorage.setItem("demo-banner-dismissed", "1");
            setDismissed(true);
          }}
          aria-label="Dismiss demo banner"
          style={{
            background:  "none",
            border:      "none",
            cursor:      "pointer",
            color:       "var(--text-secondary)",
            fontSize:    18,
            lineHeight:  1,
            padding:     "2px 4px",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
