"use client";
// components/shared/Sidebar.tsx

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",  icon: "⬡" },
  { href: "/inventory",  label: "AI Inventory", icon: "◫" },
  { href: "/documents",  label: "Documents",  icon: "◻" },
  { href: "/training",   label: "Training",   icon: "◈" },
  { href: "/learn",      label: "AI Act Guide", icon: "▣" },
  { href: "/settings",   label: "Settings",   icon: "◎" },
];

const PLAN_LABELS: Record<string, string> = {
  SOLO: "Small", SMB: "Medium", BUSINESS: "Business",
};

interface SidebarProps {
  orgName: string;
  plan: string;
  trialEndsAt: Date | null;
  unreadAlerts: number;
}

export function Sidebar({ orgName, plan, trialEndsAt, unreadAlerts }: SidebarProps) {
  const pathname = usePathname();

  const isTrial = !!trialEndsAt && new Date(trialEndsAt) > new Date();
  const trialLabel = isTrial
    ? `Trial ends ${formatDistanceToNow(new Date(trialEndsAt!), { addSuffix: true })}`
    : null;

  return (
    <aside className="hidden md:flex" style={{
      width: 220, flexShrink: 0, background: "var(--bg)",
      borderRight: "1px solid var(--border)",
      flexDirection: "column",
      minHeight: "100vh", position: "sticky", top: 0, height: "100vh",
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{
          fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 18,
          fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em",
        }}>
          Regula<span style={{ color: "#059669" }}>ton</span>
        </div>
        <div style={{
          marginTop: 6, fontSize: 12, color: "var(--text-muted)",
          fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.02em",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {orgName}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className="sidebar-link" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px", borderRadius: 7, marginBottom: 2,
              textDecoration: "none",
              background: active ? "var(--bg-subtle)" : "transparent",
              color: active ? "var(--text-primary)" : "var(--text-secondary)",
              fontSize: 14, fontWeight: active ? 500 : 400,
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 14, opacity: active ? 1 : 0.7 }}>{icon}</span>
              <span style={{ flex: 1 }}>{label}</span>
              {label === "Dashboard" && unreadAlerts > 0 && (
                <span style={{
                  background: "var(--danger)", color: "white", fontSize: 10,
                  fontWeight: 700, padding: "1px 6px", borderRadius: 10,
                  fontFamily: "IBM Plex Mono, monospace",
                }}>
                  {unreadAlerts}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Trial badge + sign out */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid var(--border)" }}>
        {trialLabel && (
          <div style={{
            padding: "8px 10px", background: "var(--warning-bg)",
            border: "1px solid var(--warning-border)", borderRadius: 7, marginBottom: 10,
          }}>
            <div style={{ fontSize: 11, color: "var(--warning)", fontWeight: 600, marginBottom: 2 }}>
              Free trial
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{trialLabel}</div>
            <Link href="/settings#billing" className="link-hover" style={{
              display: "block", marginTop: 6, fontSize: 11,
              color: "#059669", textDecoration: "none", fontWeight: 500,
            }}>
              Upgrade →
            </Link>
          </div>
        )}

        {!trialLabel && (
          <div style={{
            padding: "6px 10px", fontSize: 11,
            color: "var(--text-muted)", fontFamily: "IBM Plex Mono, monospace",
            letterSpacing: "0.04em",
          }}>
            {PLAN_LABELS[plan] ?? plan} plan
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="sidebar-link"
          style={{
            width: "100%", padding: "8px 10px", background: "none",
            border: "none", color: "var(--text-muted)", fontSize: 13,
            cursor: "pointer", textAlign: "left", borderRadius: 6,
            fontFamily: "Inter, sans-serif",
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
