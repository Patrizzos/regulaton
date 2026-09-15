"use client";
// components/shared/MobileTabBar.tsx
// Bottom tab bar shown on mobile (< md). Mirrors Sidebar's nav items.

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard",  label: "Home",      icon: "⬡" },
  { href: "/inventory",  label: "Inventory", icon: "◫" },
  { href: "/documents",  label: "Documents", icon: "◻" },
  { href: "/training",   label: "Training",  icon: "◈" },
  { href: "/learn",      label: "Guide",     icon: "▣" },
  { href: "/penalty-calculator", label: "Fines", icon: "⬢" },
  { href: "/settings",   label: "Settings",  icon: "◎" },
];

interface MobileTabBarProps {
  unreadAlerts: number;
}

export function MobileTabBar({ unreadAlerts }: MobileTabBarProps) {
  const pathname = usePathname();

  return (
    <nav
      className="flex md:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {NAV.map(({ href, label, icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative"
            style={{ textDecoration: "none" }}
          >
            <span
              style={{
                fontSize: 17,
                color: active ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              {icon}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              {label}
            </span>
            {label === "Home" && unreadAlerts > 0 && (
              <span
                className="absolute"
                style={{
                  top: 2, right: "28%",
                  background: "var(--danger)", color: "white", fontSize: 9,
                  fontWeight: 700, padding: "0 4px", borderRadius: 8,
                  fontFamily: "IBM Plex Mono, monospace", lineHeight: "14px",
                  minWidth: 14, textAlign: "center",
                }}
              >
                {unreadAlerts}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
