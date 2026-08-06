"use client";
// components/shared/CookieBanner.tsx
// Simple cookie consent for the marketing pages.
// We only use strictly necessary cookies (auth session), so this is informational.

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("cookie-consent");
    if (!accepted) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center left-4 right-4 sm:left-6 sm:right-6 bottom-[84px] md:bottom-6" style={{
      position: "fixed", zIndex: 200,
      maxWidth: 520, margin: "0 auto",
      background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12,
      padding: "16px 20px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      gap: 16,
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
          We use cookies
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Only essential cookies for authentication. No tracking or advertising.{" "}
          <Link href="/privacy" className="link-hover" style={{ color: "#059669", textDecoration: "none" }}>
            Privacy policy
          </Link>
        </div>
      </div>
      <button
        onClick={accept}
        className="w-full sm:w-auto"
        style={{
          padding: "8px 18px", background: "#059669", color: "white",
          border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600,
          cursor: "pointer", flexShrink: 0, fontFamily: "Inter, sans-serif",
        }}
      >
        Got it
      </button>
    </div>
  );
}
