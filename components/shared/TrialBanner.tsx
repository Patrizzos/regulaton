"use client";
// components/shared/TrialBanner.tsx
// Shows when trial has expired or payment has failed.
// Soft gate — doesn't block access, just makes the situation very clear.

import { useState } from "react";
import Link from "next/link";

interface Props {
  status: string;
  trialEndsAt: Date | null;
}

export function TrialBanner({ status, trialEndsAt }: Props) {
  const [dismissed, setDismissed] = useState(false);

  const trialExpired =
    status === "TRIALING" &&
    trialEndsAt &&
    new Date(trialEndsAt) < new Date();

  const isPastDue  = status === "PAST_DUE";
  const isCanceled = status === "CANCELED";

  if (dismissed || (!trialExpired && !isPastDue && !isCanceled)) return null;

  const config = trialExpired
    ? {
        bg:      "#FFFBEB",
        border:  "#FDE68A",
        text:    "#78350F",
        icon:    "⏰",
        message: "Your free trial has ended.",
        sub:     "Subscribe to keep generating documents and downloading your compliance pack.",
        cta:     "Choose a plan",
        href:    "/settings#billing",
      }
    : isPastDue
    ? {
        bg:      "#FEF2F2",
        border:  "#FECACA",
        text:    "#7F1D1D",
        icon:    "⚠️",
        message: "Your payment failed.",
        sub:     "Update your payment method to restore full access.",
        cta:     "Update payment",
        href:    "/settings#billing",
      }
    : {
        bg:      "var(--bg-subtle)",
        border:  "var(--border)",
        text:    "var(--text-secondary)",
        icon:    "ℹ️",
        message: "Your subscription has been cancelled.",
        sub:     "Resubscribe to continue using Regulaton.",
        cta:     "Resubscribe",
        href:    "/settings#billing",
      };

  return (
    <div style={{
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 10,
      padding: "12px 18px",
      marginBottom: 24,
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{config.icon}</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: config.text }}>
          {config.message}{" "}
        </span>
        <span style={{ fontSize: 13, color: config.text, opacity: 0.8 }}>
          {config.sub}
        </span>
      </div>
      <Link
        href={config.href}
        className="btn-dark"
        style={{
          padding: "7px 16px",
          background: "var(--btn-primary-bg)",
          color: "var(--btn-primary-text)",
          borderRadius: 7,
          fontSize: 12,
          fontWeight: 600,
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        {config.cta}
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="link-hover"
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-muted)", fontSize: 16, padding: "0 4px", flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
