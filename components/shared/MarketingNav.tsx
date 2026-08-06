"use client";
// components/shared/MarketingNav.tsx
// Marketing site nav. Collapses secondary links + sign in into a hamburger
// menu on mobile, since there's no room for the full link row.

import { useState } from "react";
import Link from "next/link";

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "color-mix(in srgb, var(--bg) 92%, transparent)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
      <div className="px-4 sm:px-6" style={{ maxWidth: 1100, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontFamily: "IBM Plex Serif, serif", fontSize: 36, fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}>
          Regula<span style={{ color: "#059669" }}>ton</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center" style={{ gap: 16 }}>
          <Link href="/check"   className="link-hover" style={{ fontSize: 14, color: "#059669", textDecoration: "none", fontWeight: 600 }}>Does it apply to me? →</Link>
          <Link href="#how"     className="hidden md:inline nav-link-hover" style={{ fontSize: 14, color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500 }}>How it works</Link>
          <Link href="#pricing" className="hidden md:inline nav-link-hover" style={{ fontSize: 14, color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500 }}>Pricing</Link>
          <Link href="/login"   className="nav-link-hover" style={{ fontSize: 14, color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
          <Link href="/login"   className="btn-dark" style={{ display: "inline-block", padding: "8px 18px", background: "#059669", color: "var(--text-primary)", borderRadius: 7, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Get started</Link>
        </div>

        {/* Mobile: hamburger */}
        <button
          className="flex sm:hidden hamburger-btn"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav-menu"
          style={{
            width: 36, height: 36, alignItems: "center", justifyContent: "center",
            background: "none", border: "1.5px solid var(--border)", borderRadius: 8, cursor: "pointer",
          }}
        >
          <div style={{ position: "relative", width: 16, height: 12 }}>
            <span style={{ position: "absolute", top: open ? 5 : 0, left: 0, width: 16, height: 2, background: "var(--text-primary)", borderRadius: 1, transform: open ? "rotate(45deg)" : "none", transition: "all 0.15s" }} />
            <span style={{ position: "absolute", top: 5, left: 0, width: 16, height: 2, background: "var(--text-primary)", borderRadius: 1, opacity: open ? 0 : 1, transition: "all 0.15s" }} />
            <span style={{ position: "absolute", top: open ? 5 : 10, left: 0, width: 16, height: 2, background: "var(--text-primary)", borderRadius: 1, transform: open ? "rotate(-45deg)" : "none", transition: "all 0.15s" }} />
          </div>
        </button>
      </div>

      {/* Backdrop — closes menu on outside click, sits below the panel */}
      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="sm:hidden"
          style={{
            position: "fixed", inset: 0, top: 60, zIndex: 90,
            background: "rgba(26,35,50,0.15)", border: "none", padding: 0, cursor: "default",
          }}
        />
      )}

      {/* Mobile dropdown — overlays content instead of pushing it down */}
      {open && (
        <div id="mobile-nav-menu" className="flex sm:hidden" style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 95,
          flexDirection: "column", padding: "8px 16px 16px",
          borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
          background: "var(--bg-card)", boxShadow: "0 12px 24px rgba(26,35,50,0.08)",
        }}>
          {[
            { href: "/check",   label: "Does it apply to me? →", accent: true },
            { href: "#how",     label: "How it works" },
            { href: "#pricing", label: "Pricing" },
            { href: "/login",   label: "Sign in" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                padding: "12px 4px", fontSize: 15, fontWeight: item.accent ? 600 : 500,
                color: item.accent ? "#059669" : "var(--text-primary)", textDecoration: "none",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="btn-dark"
            style={{
              display: "block", textAlign: "center", marginTop: 12,
              padding: "11px 18px", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)",
              borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}
          >
            Get started
          </Link>
        </div>
      )}
    </nav>
  );
}
